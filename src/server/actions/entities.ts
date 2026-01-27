'use server'

import { prisma } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { FormState } from '@/lib/types'
import { logAuditAction } from './audit'

const emptyToNull = (val: unknown) => (val === '' ? null : val)

const OwnerSchema = z.object({
    id: z.string().uuid(),
    type: z.enum(['ENTITY', 'PERSON']),
    percentage: z.number().min(0).max(100)
})

const EntitySchema = z.object({
    legalName: z.string().min(1, "Legal Name is required"),
    ein: z.preprocess(emptyToNull, z.string().optional().nullable()),
    entityType: z.string().min(1, "Entity Type is required"),
    taxClassification: z.preprocess(emptyToNull, z.string().optional().nullable()),
    stateOfIncorporation: z.preprocess(emptyToNull, z.string().optional().nullable()),
    fiscalYearEnd: z.preprocess(emptyToNull, z.string().optional().nullable()),
    logoUrl: z.preprocess(emptyToNull, z.string().url().optional().nullable()),
    parentAppointsGoverningBody: z.coerce.boolean().optional(),
    supportingOrgType: z.preprocess(emptyToNull, z.string().optional().nullable()),
    owners: z.string().transform((str, ctx) => {
        try {
            return z.array(OwnerSchema).parse(JSON.parse(str))
        } catch {
            return []
        }
    }).optional()
})

// ...
export async function getUniqueStates() {
    const states = await prisma.entity.findMany({
        select: { stateOfIncorporation: true },
        distinct: ['stateOfIncorporation'],
        where: { stateOfIncorporation: { not: null } },
        orderBy: { stateOfIncorporation: 'asc' }
    })
    return states.map(s => s.stateOfIncorporation).filter(Boolean) as string[]
}

export async function getEntities(filters?: { type?: string, state?: string }) {
    const where: import('@prisma/client').Prisma.EntityWhereInput = {}

    if (filters?.type) {
        where.entityType = filters.type
    }

    if (filters?.state) {
        where.stateOfIncorporation = filters.state
    }

    return await prisma.entity.findMany({
        where,
        orderBy: { legalName: 'asc' }
    })
}

export async function getEntity(id: string) {
    return await prisma.entity.findUnique({
        where: { id },
        include: {
            owners: {
                include: {
                    ownerEntity: true,
                    ownerPerson: true
                }
            },
            subsidiaries: {
                include: { childEntity: true }
            },
            roles: {
                include: {
                    person: true
                },
                where: {
                    endDate: null
                }
            },
            transactionsOut: {
                include: { toEntity: true },
                orderBy: { date: 'desc' }
            },
            transactionsIn: {
                include: { fromEntity: true },
                orderBy: { date: 'desc' }
            },
            nameChanges: {
                orderBy: { changeDate: 'desc' }
            },
            attachments: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })
}

export async function createEntity(prevState: FormState, formData: FormData) {
    const data = Object.fromEntries(formData.entries())

    const validated = EntitySchema.safeParse({
        ...data,
        parentAppointsGoverningBody: data.parentAppointsGoverningBody === 'on',
    })

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Validation failed"
        }
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const entity = await tx.entity.create({
                data: {
                    legalName: validated.data.legalName,
                    ein: validated.data.ein || null,
                    entityType: validated.data.entityType,
                    taxClassification: validated.data.taxClassification || null,
                    stateOfIncorporation: validated.data.stateOfIncorporation || null,
                    fiscalYearEnd: validated.data.fiscalYearEnd || null,
                    logoUrl: validated.data.logoUrl || null,
                    parentAppointsGoverningBody: validated.data.parentAppointsGoverningBody || false,
                    supportingOrgType: validated.data.supportingOrgType
                }
            })

            if (validated.data.owners && validated.data.owners.length > 0) {
                await tx.entityOwner.createMany({
                    data: validated.data.owners.map(owner => ({
                        childEntityId: entity.id,
                        ownerEntityId: owner.type === 'ENTITY' ? owner.id : null,
                        ownerPersonId: owner.type === 'PERSON' ? owner.id : null,
                        percentage: owner.percentage
                    }))
                })
            }
            return entity.id
        })

        await logAuditAction("CREATE", "Entity", result, `Created entity ${validated.data.legalName}`)

    } catch (e) {
        console.error("Create Entity Error:", e)
        return { message: "Failed to create entity" }
    }

    // Since we can't easily get the ID from inside the transaction unless we return it,
    // we should ideally refactor to get the ID. But wait, we can't await inside the tx callback from outside.
    // Actually, prisma transaction returns the result of the callback.
    // I need to refactor the structure slightly to capture the ID.
    // BUT since I am in a 'replace' block, I cannot easily refactor the whole function.
    // I will modify the 'try' block to return the entity.

    revalidatePath('/entities')
    redirect('/entities')
}

export async function updateEntity(id: string, prevState: FormState, formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    // Preprocess checkbox
    const rawData = {
        ...data,
        parentAppointsGoverningBody: data.parentAppointsGoverningBody === 'on' || data.parentAppointsGoverningBody === 'true',
    }

    const validated = EntitySchema.safeParse(rawData)

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Validation failed"
        }
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Update core entity details
            await tx.entity.update({
                where: { id },
                data: {
                    legalName: validated.data.legalName,
                    ein: validated.data.ein || null,
                    entityType: validated.data.entityType,
                    taxClassification: validated.data.taxClassification || null,
                    stateOfIncorporation: validated.data.stateOfIncorporation || null,
                    fiscalYearEnd: validated.data.fiscalYearEnd || null,
                    logoUrl: validated.data.logoUrl || null,
                    parentAppointsGoverningBody: validated.data.parentAppointsGoverningBody,
                    supportingOrgType: validated.data.supportingOrgType
                }
            })

            // Update owners: Delete all existing and re-create
            if (validated.data.owners !== undefined) {
                await tx.entityOwner.deleteMany({
                    where: { childEntityId: id }
                })

                if (validated.data.owners.length > 0) {
                    await tx.entityOwner.createMany({
                        data: validated.data.owners.map(owner => ({
                            childEntityId: id,
                            ownerEntityId: owner.type === 'ENTITY' ? owner.id : null,
                            ownerPersonId: owner.type === 'PERSON' ? owner.id : null,
                            percentage: owner.percentage
                        }))
                    })
                }
            }
        })
    } catch (e) {
        console.error("Update Entity Error:", e)
        const message = e instanceof Error ? e.message : 'Unknown error'
        return { message: `Failed to update entity: ${message}` }
    }

    await logAuditAction("UPDATE", "Entity", id, `Updated entity ${validated.data.legalName}`)

    revalidatePath(`/entities/${id}`)
    revalidatePath('/entities')
    redirect(`/entities/${id}`)
}

import { isSimilar } from '@/lib/string-utils'

export async function checkEntityDuplicate(legalName: string) {
    // 1. Broad search: Entities starting with same first 3 letters
    const prefix = legalName.substring(0, 3)
    const candidates = await prisma.entity.findMany({
        where: {
            legalName: { startsWith: prefix, mode: 'insensitive' }
        },
        select: { id: true, legalName: true, ein: true }
    })

    // 2. Refine
    const duplicates = candidates.filter(c => {
        return isSimilar(legalName, c.legalName, 4) || c.legalName.toLowerCase().includes(legalName.toLowerCase()) || legalName.toLowerCase().includes(c.legalName.toLowerCase())
    })

    return duplicates
}

const TransactionSchema = z.object({
    fromEntityId: z.string().uuid(),
    toEntityId: z.string().uuid(),
    type: z.string().min(1),
    amount: z.coerce.number().min(0),
    description: z.string().optional(),
    date: z.coerce.date()
})

export async function createTransaction(prevState: FormState, formData: FormData) {
    const validated = TransactionSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Validation failed"
        }
    }

    if (validated.data.fromEntityId === validated.data.toEntityId) {
        return { message: "Cannot create transaction to self." }
    }

    try {
        await prisma.relatedTransaction.create({
            data: {
                fromEntityId: validated.data.fromEntityId,
                toEntityId: validated.data.toEntityId,
                type: validated.data.type,
                amount: validated.data.amount,
                description: validated.data.description,
                date: validated.data.date
            }
        })
    } catch (e) {
        console.error("Create Transaction Error:", e)
        return { message: "Failed to create transaction" }
    }

    revalidatePath(`/entities/${validated.data.fromEntityId}`)
    revalidatePath(`/entities/${validated.data.toEntityId}`)
    return { message: "Transaction created", success: true }
}

const EntityNameChangeSchema = z.object({
    entityId: z.string().uuid(),
    legalName: z.string().min(1),
    documentUrl: z.string().optional(),
    effectiveDate: z.coerce.date().optional()
})

export async function changeEntityName(prevState: FormState, formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    const validated = EntityNameChangeSchema.safeParse(data)

    if (!validated.success) {
        return { message: "Invalid name change data" }
    }

    const { entityId, legalName, documentUrl, effectiveDate } = validated.data

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Get old name
            const current = await tx.entity.findUniqueOrThrow({ where: { id: entityId } })

            // 2. Update Entity
            await tx.entity.update({
                where: { id: entityId },
                data: { legalName }
            })

            // 3. Create History
            await tx.nameChange.create({
                data: {
                    entityId,
                    oldName: current.legalName,
                    newName: legalName,
                    documentUrl,
                    effectiveDate
                }
            })
        })

        await logAuditAction("UPDATE", "Entity", entityId, `Changed legal name to ${legalName}`)

        revalidatePath(`/entities/${entityId}`)
        return { success: true, message: "Legal name changed successfully" }

    } catch (e) {
        console.error("Entity Name Change Error:", e)
        return { message: "Failed to change entity name" }
    }
}
