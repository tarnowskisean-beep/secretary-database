'use server'

import { prisma } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { FormState } from '@/lib/types'
import { logAuditAction } from './audit'

const RoleSchema = z.object({
    entityId: z.string().min(1, "Entity is required"),
    title: z.string().min(1, "Title is required"),
    roleType: z.string().min(1, "Role Type is required"),
    startDate: z.string().optional(),
    votingRights: z.coerce.boolean(),
    isCompensated: z.coerce.boolean(),
    appointmentDocUrl: z.union([z.string().url("Must be a valid URL"), z.literal("")]).optional().nullable(),
})

export async function createRole(personId: string, prevState: FormState, formData: FormData): Promise<FormState> {
    const data = Object.fromEntries(formData.entries())

    let rawApptUrl = data.appointmentDocUrl as string || ''
    if (rawApptUrl && !rawApptUrl.startsWith('http://') && !rawApptUrl.startsWith('https://')) {
        rawApptUrl = `https://${rawApptUrl}`
    }

    const rawData = {
        ...data,
        appointmentDocUrl: rawApptUrl,
        votingRights: (data.roleType === 'OFFICER' || data.roleType === 'KEY_EMPLOYEE') ? false : (data.votingRights === 'on'),
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
        const role = await prisma.boardRole.create({
            data: {
                personId,
                entityId: validated.data.entityId,
                title: validated.data.title,
                roleType: validated.data.roleType,
                startDate: validated.data.startDate ? new Date(validated.data.startDate) : null,
                votingRights: validated.data.votingRights,
                isCompensated: validated.data.isCompensated,
                appointmentDocUrl: validated.data.appointmentDocUrl
            },
            include: { entity: true, person: true }
        })
        await logAuditAction("CREATE", "Role", role.id, `Appointed ${role.person.firstName} ${role.person.lastName} as ${role.title} at ${role.entity.legalName}`)
    } catch (e) {
        console.error(e)
        return { message: "Failed to create role" }
    }

    revalidatePath(`/people/${personId}`)
    return { message: "Role added successfully", success: true }
}

const EndRoleSchema = z.object({
    resignationDocUrl: z.union([z.string().url("Must be a valid URL"), z.literal("")]).optional(),
    endDate: z.string().min(1, "End Date is required"),
    missingDoc: z.string().optional()
})

export async function endRole(roleId: string, personId: string, prevState: FormState, formData: FormData): Promise<FormState> {
    let rawResigUrl = formData.get('resignationDocUrl') as string || ''
    if (rawResigUrl && !rawResigUrl.startsWith('http://') && !rawResigUrl.startsWith('https://')) {
        rawResigUrl = `https://${rawResigUrl}`
    }

    const rawData = {
        resignationDocUrl: rawResigUrl,
        endDate: formData.get('endDate') as string,
        missingDoc: (formData.get('missingDoc') as string) || undefined
    }

    const validated = EndRoleSchema.safeParse(rawData)

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Validation failed"
        }
    }

    const finalDocUrl = validated.data.missingDoc === 'on'
        ? "Missing document"
        : validated.data.resignationDocUrl

    try {
        const role = await prisma.boardRole.update({
            where: { id: roleId },
            data: {
                endDate: new Date(validated.data.endDate),
                resignationDocUrl: finalDocUrl
            },
            include: { person: true, entity: true }
        })
        await logAuditAction("UPDATE", "Role", roleId, `Ended term for ${role.person.firstName} ${role.person.lastName} as ${role.title} at ${role.entity.legalName}`)

        revalidatePath(`/people/${personId}`)
        return { success: true, message: "Role ended successfully" }
    } catch (e) {
        console.error("End role error:", e)
        return { message: "Failed to end role" }
    }
}


export async function restoreRole(roleId: string, personId: string) {
    try {
        const role = await prisma.boardRole.update({
            where: { id: roleId },
            data: { endDate: null },
            include: { person: true, entity: true }
        })
        await logAuditAction("UPDATE", "Role", roleId, `Restored role for ${role.person.firstName} ${role.person.lastName} as ${role.title} at ${role.entity.legalName}`)

        revalidatePath(`/people/${personId}`)
    } catch {
        return { message: "Failed to restore role" }
    }
}

const UpdateRoleSchema = z.object({
    title: z.string().min(1, "Title is required"),
    roleType: z.string().min(1, "Role Type is required"),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    votingRights: z.coerce.boolean(),
    isCompensated: z.coerce.boolean(),
    appointmentDocUrl: z.union([z.string().url("Must be a valid URL"), z.literal("")]).optional().nullable(),
    resignationDocUrl: z.union([z.string().url("Must be a valid URL"), z.literal("")]).optional().nullable(),
})

export async function updateRole(roleId: string, prevState: FormState, formData: FormData): Promise<FormState> {
    const data = Object.fromEntries(formData.entries())

    let rawApptUrl = data.appointmentDocUrl as string || ''
    if (rawApptUrl && !rawApptUrl.startsWith('http://') && !rawApptUrl.startsWith('https://')) {
        rawApptUrl = `https://${rawApptUrl}`
    }

    let rawResigUrl = data.resignationDocUrl as string || ''
    if (rawResigUrl && !rawResigUrl.startsWith('http://') && !rawResigUrl.startsWith('https://')) {
        rawResigUrl = `https://${rawResigUrl}`
    }

    const rawData = {
        ...data,
        startDate: data.startDate === '' ? null : data.startDate,
        endDate: data.endDate === '' ? null : data.endDate,
        votingRights: (data.roleType === 'OFFICER' || data.roleType === 'KEY_EMPLOYEE') ? false : (data.votingRights === 'on'),
        isCompensated: data.isCompensated === 'on',
        appointmentDocUrl: rawApptUrl,
        resignationDocUrl: rawResigUrl
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
                appointmentDocUrl: validated.data.appointmentDocUrl,
                resignationDocUrl: validated.data.resignationDocUrl
            },
            include: {
                person: true,
                entity: true
            }
        })

        await logAuditAction("UPDATE", "Role", roleId, `Updated role for ${role.person.firstName} ${role.person.lastName} at ${role.entity.legalName}`)

        revalidatePath(`/people/${role.personId}`)
        revalidatePath(`/entities/${role.entityId}`)
        return { success: true, message: "Role updated successfully" }
    } catch (e) {
        console.error(e)
        return { message: "Failed to update role" }
    }
}

export async function deleteRole(roleId: string, personId: string, entityId: string) {
    try {
        const role = await prisma.boardRole.findUnique({ where: { id: roleId }, include: { person: true, entity: true } })
        if (role) {
            await prisma.boardRole.delete({
                where: { id: roleId }
            })
            await logAuditAction("DELETE", "Role", roleId, `Deleted role for ${role.person.firstName} ${role.person.lastName} as ${role.title} at ${role.entity.legalName}`)
        }

        revalidatePath(`/people/${personId}`)
        revalidatePath(`/entities/${entityId}`)
        return { success: true, message: "Role deleted successfully" }
    } catch {
        return { message: "Failed to delete role" }
    }
}
