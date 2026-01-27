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

import { isSimilar } from '@/lib/string-utils'

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

    // 2. Refine with Levenshtein
    const duplicates = candidates.filter(c => {
        // Check fuzzy match on first name
        // "Jon" vs "Jonathan" -> similar?
        // Let's use a specialized check: if one is a substring of the other OR decent levenshtein
        const f1 = c.firstName.toLowerCase()
        const f2 = firstName.toLowerCase()

        // Direct substring check (Jon in Jonathan)
        if (f1.includes(f2) || f2.includes(f1)) return true

        // Levenshtein check for typos
        return isSimilar(firstName, c.firstName, 2)
    })

    // ... duplicate check code ...
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

        await prisma.person.delete({ where: { id } })
        await logAuditAction("DELETE", "Person", id, `Deleted person ID ${id}`)
        revalidatePath('/people')
        return { success: true }
    } catch (error) {
        console.error("Delete Person Error:", error)
        return { success: false, error: "Database failure during deletion." }
    }
}
