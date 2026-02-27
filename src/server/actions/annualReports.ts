'use server'

import { prisma } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { FormState } from '@/lib/types'
import { logAuditAction } from './audit'

const AnnualReportSchema = z.object({
    entityId: z.string().uuid(),
    year: z.string().min(4).max(4),
    status: z.enum(['PENDING', 'FILED', 'OVERDUE', 'EXEMPT']),
    dueDate: z.coerce.date().optional().nullable(),
    filingDate: z.coerce.date().optional().nullable(),
    documentUrl: z.string().url().optional().nullable(),
    notes: z.string().optional().nullable()
})

const emptyToNull = (val: unknown) => (val === '' ? null : val)

export async function createAnnualReport(prevState: FormState, formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    
    // Convert empty strings to null for dates
    if (data.dueDate === '') delete data.dueDate
    if (data.filingDate === '') delete data.filingDate
    if (data.documentUrl === '') delete data.documentUrl

    const validated = AnnualReportSchema.safeParse(data)

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Validation failed"
        }
    }

    try {
        const report = await prisma.annualReport.create({
            data: {
                entityId: validated.data.entityId,
                year: validated.data.year,
                status: validated.data.status,
                dueDate: validated.data.dueDate || null,
                filingDate: validated.data.filingDate || null,
                documentUrl: validated.data.documentUrl || null,
                notes: validated.data.notes || null,
            },
            include: { entity: true }
        })

        await logAuditAction("CREATE", "AnnualReport", report.id, `Created Annual Report ${report.year} for ${report.entity.legalName}`)

        revalidatePath(`/entities/${validated.data.entityId}`)
        return { success: true, message: "Annual report created successfully" }
    } catch (e) {
        console.error("Create Annual Report Error:", e)
        return { message: "Failed to create annual report" }
    }
}

export async function updateAnnualReport(id: string, prevState: FormState, formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    
    // Convert empty strings to null for dates
    if (data.dueDate === '') delete data.dueDate
    if (data.filingDate === '') delete data.filingDate
    if (data.documentUrl === '') delete data.documentUrl

    const validated = AnnualReportSchema.safeParse(data)

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Validation failed"
        }
    }

    try {
        const report = await prisma.annualReport.update({
            where: { id },
            data: {
                year: validated.data.year,
                status: validated.data.status,
                dueDate: validated.data.dueDate || null,
                filingDate: validated.data.filingDate || null,
                documentUrl: validated.data.documentUrl || null,
                notes: validated.data.notes || null,
            },
            include: { entity: true }
        })

        await logAuditAction("UPDATE", "AnnualReport", id, `Updated Annual Report ${report.year} for ${report.entity.legalName}`)

        revalidatePath(`/entities/${validated.data.entityId}`)
        return { success: true, message: "Annual report updated successfully" }
    } catch (e) {
        console.error("Update Annual Report Error:", e)
        return { message: "Failed to update annual report" }
    }
}

export async function deleteAnnualReport(id: string, entityId: string) {
    try {
        const report = await prisma.annualReport.delete({
            where: { id },
            include: { entity: true }
        })

        await logAuditAction("DELETE", "AnnualReport", id, `Deleted Annual Report ${report.year} for ${report.entity.legalName}`)

        revalidatePath(`/entities/${entityId}`)
        return { success: true, message: "Annual report deleted successfully" }
    } catch (e) {
        console.error("Delete Annual Report Error:", e)
        return { message: "Failed to delete annual report" }
    }
}
