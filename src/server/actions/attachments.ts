'use server'

import { prisma } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { logAuditAction } from './audit'

const AttachmentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    url: z.string().url("Must be a valid URL"),
    personId: z.string().optional(),
    entityId: z.string().optional()
})

export async function createAttachment(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    const validated = AttachmentSchema.safeParse(data)

    if (!validated.success) {
        return { message: "Validation failed: " + JSON.stringify(validated.error.flatten()) }
    }

    const { title, url, personId, entityId } = validated.data

    if (!personId && !entityId) {
        return { message: "Must attach to either Person or Entity" }
    }

    try {
        const attachment = await prisma.attachment.create({
            data: {
                title,
                url,
                personId: personId || null,
                entityId: entityId || null,
                type: "LINK"
            }
        })

        const resource = personId ? "Person" : "Entity"
        const resourceId = personId || entityId || "unknown"

        await logAuditAction("CREATE", "Attachment", attachment.id, `Added attachment "${title}" to ${resource}`)

        revalidatePath(`/people/${personId}`)
        revalidatePath(`/entities/${entityId}`)

        return { success: true, message: "Attachment added" }

    } catch (e) {
        console.error("Create Attachment Error:", e)
        return { message: "Failed to create attachment" }
    }
}

export async function deleteAttachment(id: string, resourcePath: string) {
    try {
        const attachment = await prisma.attachment.findUnique({ where: { id } })
        if (!attachment) return { message: "Not found" }

        await prisma.attachment.delete({ where: { id } })
        await logAuditAction("DELETE", "Attachment", id, `Deleted attachment "${attachment.title}"`)

        revalidatePath(resourcePath)
        return { success: true }
    } catch (e) {
        console.error("Delete Attachment Error:", e)
        return { message: "Failed to delete" }
    }
}
