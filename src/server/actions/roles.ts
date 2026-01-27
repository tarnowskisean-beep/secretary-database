'use server'

import { prisma } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { FormState } from '@/lib/types'

const RoleSchema = z.object({
    entityId: z.string().min(1, "Entity is required"),
    title: z.string().min(1, "Title is required"),
    roleType: z.string().min(1, "Role Type is required"),
    startDate: z.string().optional(),
    votingRights: z.coerce.boolean(),
    isCompensated: z.coerce.boolean(),
    appointmentDocUrl: z.union([z.string().url("Must be a valid URL"), z.literal("")]).optional().nullable(),
})

export async function createRole(personId: string, prevState: FormState, formData: FormData) {
    const data = Object.fromEntries(formData.entries())

    const rawData = {
        ...data,
        votingRights: data.votingRights === 'on',
        isCompensated: data.isCompensated === 'on',
    }

    const validated = RoleSchema.safeParse(rawData)

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Validation failed"
        }
    }

    try {
        await prisma.boardRole.create({
            data: {
                personId,
                entityId: validated.data.entityId,
                title: validated.data.title,
                roleType: validated.data.roleType,
                startDate: validated.data.startDate ? new Date(validated.data.startDate) : null,
                votingRights: validated.data.votingRights,
                isCompensated: validated.data.isCompensated,
                appointmentDocUrl: validated.data.appointmentDocUrl
            }
        })
    } catch (e) {
        console.error(e)
        return { message: "Failed to create role" }
    }

    revalidatePath(`/people/${personId}`)
    return { message: "Role added successfully" }
}

// Schema for ending a role
const EndRoleSchema = z.object({
    resignationDocUrl: z.string().url("Must be a valid URL").min(1, "Resignation/Resolution Document is required"),
    endDate: z.string().min(1, "End Date is required")
})

export async function endRole(roleId: string, personId: string, prevState: FormState, formData: FormData) {
    const rawData = {
        resignationDocUrl: formData.get('resignationDocUrl'),
        endDate: formData.get('endDate')
    }

    const validated = EndRoleSchema.safeParse(rawData)

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Validation failed"
        }
    }

    try {
        await prisma.boardRole.update({
            where: { id: roleId },
            data: {
                endDate: new Date(validated.data.endDate),
                resignationDocUrl: validated.data.resignationDocUrl
            }
        })
        revalidatePath(`/people/${personId}`)
        return { success: true, message: "Role ended successfully" }
    } catch {
        return { message: "Failed to end role" }
    }
}


export async function restoreRole(roleId: string, personId: string) {
    try {
        await prisma.boardRole.update({
            where: { id: roleId },
            data: { endDate: null }
        })
        revalidatePath(`/people/${personId}`)
    } catch {
        return { message: "Failed to restore role" }
    }
}

// Schema for updating a role
const UpdateRoleSchema = z.object({
    title: z.string().min(1, "Title is required"),
    roleType: z.string().min(1, "Role Type is required"),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    votingRights: z.coerce.boolean(),
    isCompensated: z.coerce.boolean(),
    appointmentDocUrl: z.union([z.string().url("Must be a valid URL"), z.literal("")]).optional().nullable(),
})

export async function updateRole(roleId: string, prevState: FormState, formData: FormData) {
    const data = Object.fromEntries(formData.entries())

    const rawData = {
        ...data,
        startDate: data.startDate === '' ? null : data.startDate,
        endDate: data.endDate === '' ? null : data.endDate,
        votingRights: data.votingRights === 'on',
        isCompensated: data.isCompensated === 'on',
    }

    const validated = UpdateRoleSchema.safeParse(rawData)

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Validation failed"
        }
    }

    try {
        const role = await prisma.boardRole.update({
            where: { id: roleId },
            data: {
                title: validated.data.title,
                roleType: validated.data.roleType,
                startDate: validated.data.startDate ? new Date(validated.data.startDate) : null,
                endDate: validated.data.endDate ? new Date(validated.data.endDate) : null,
                votingRights: validated.data.votingRights,
                isCompensated: validated.data.isCompensated,
                appointmentDocUrl: validated.data.appointmentDocUrl
            },
            include: {
                person: true,
                entity: true
            }
        })

        revalidatePath(`/people/${role.personId}`)
        revalidatePath(`/entities/${role.entityId}`)
        return { success: true, message: "Role updated successfully" }
    } catch (e) {
        console.error(e)
        return { message: "Failed to update role" }
    }
}
