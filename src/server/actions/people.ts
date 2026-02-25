'use server'

import { prisma } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { FormState } from '@/lib/types'
import { logAuditAction } from './audit'

const PersonSchema = z.object({
    firstName: z.string().min(1, "First Name is required"),
    lastName: z.string().min(1, "Last Name is required"),
})

export async function getPeople() {
    return await prisma.person.findMany({
        orderBy: { lastName: 'asc' }
    })
}

export async function createPerson(prevState: FormState, formData: FormData) {
    const data = Object.fromEntries(formData.entries())

    const validated = PersonSchema.safeParse(data)

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Validation failed"
        }
    }

    try {
        const newPerson = await prisma.person.create({
            data: {
                firstName: validated.data.firstName,
                lastName: validated.data.lastName,
            }
        })
        await logAuditAction("CREATE", "Person", newPerson.id, `Created person ${newPerson.firstName} ${newPerson.lastName}`)
    } catch {
        return { message: "Failed to create person" }
    }

    revalidatePath('/people')
    redirect('/people')
}

export async function checkPersonDuplicate(firstName: string, lastName: string) {
    // 1. Broad search: Match first 3 chars of First Name AND exact Last Name
    // This reduces the set we need to process in JS
    const candidates = await prisma.person.findMany({
        where: {
            lastName: { equals: lastName, mode: 'insensitive' },
            firstName: { startsWith: firstName.substring(0, 1), mode: 'insensitive' }
        },
        select: { id: true, firstName: true, lastName: true }
    })

    // 2. Refine
    const duplicates = candidates.filter(c => {
        const f1 = c.firstName.toLowerCase()
        const f2 = firstName.toLowerCase()

        // Direct substring check (Jon in Jonathan)
        return f1.includes(f2) || f2.includes(f1)
    })

    return duplicates
}

export async function deletePerson(id: string) {
    try {
        // Check for dependencies
        const [roles, ownerships, rel1, rel2] = await Promise.all([
            prisma.boardRole.count({ where: { personId: id } }),
            prisma.entityOwner.count({ where: { ownerPersonId: id } }),
            prisma.relationship.count({ where: { person1Id: id } }),
            prisma.relationship.count({ where: { person2Id: id } })
        ])

        const totalRecords = roles + ownerships + rel1 + rel2

        if (totalRecords > 0) {
            return {
                success: false,
                error: `Cannot delete: attached to ${roles} roles, ${ownerships} ownerships, and ${rel1 + rel2} relationships.`
            }
        }


        const personToDelete = await prisma.person.findUnique({ where: { id } })
        const name = personToDelete ? `${personToDelete.firstName} ${personToDelete.lastName}` : 'Unknown'

        await prisma.person.delete({ where: { id } })
        await logAuditAction("DELETE", "Person", id, `Deleted person ${name}`)
        revalidatePath('/people')
        return { success: true }
    } catch (error) {
        console.error("Delete Person Error:", error)
        return { success: false, error: "Database failure during deletion." }
    }
}

const NameChangeSchema = z.object({
    personId: z.string().uuid(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    documentUrl: z.string().optional(), // Base64 or URL
    effectiveDate: z.coerce.date().optional()
})

export async function changePersonName(prevState: FormState, formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    if (data.effectiveDate === '') {
        delete data.effectiveDate
    }
    const validated = NameChangeSchema.safeParse(data)

    if (!validated.success) {
        return { message: "Invalid name change data" }
    }

    const { personId, firstName, lastName, documentUrl, effectiveDate } = validated.data
    let oldName = ''

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Get current name
            const current = await tx.person.findUniqueOrThrow({ where: { id: personId } })
            oldName = `${current.firstName} ${current.lastName}`
            const newName = `${firstName} ${lastName}`

            // 2. Update Person
            await tx.person.update({
                where: { id: personId },
                data: { firstName, lastName }
            })

            // 3. Create History Record
            await tx.nameChange.create({
                data: {
                    personId,
                    oldName,
                    newName,
                    documentUrl,
                    effectiveDate,
                    // TODO: Capture userId from session if possible, but for now we track via AuditLog
                }
            })
        })

        await logAuditAction("UPDATE", "Person", personId, `Changed name for ${oldName} to ${firstName} ${lastName}`)

        revalidatePath(`/people/${personId}`)
        return { success: true, message: "Name changed successfully" }

    } catch (e) {
        console.error("Name Change Error:", e)
        return { message: "Failed to change name" }
    }
}
