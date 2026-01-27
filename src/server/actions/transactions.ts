'use server'

import { prisma } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { FormState } from '@/lib/types'
import { createAuditLog } from '@/server/actions/users'

const TransactionSchema = z.object({
    fromEntityId: z.string().min(1, "Source Entity is required"),
    toEntityId: z.string().min(1, "Destination Entity is required"),
    type: z.string().min(1, "Type is required"),
    amount: z.coerce.number().min(0.01, "Amount must be positive"),
    description: z.string().optional(),
    date: z.string().optional()
})

export async function createTransaction(prevState: FormState, formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    const validated = TransactionSchema.safeParse(data)

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Validation failed"
        }
    }

    const { fromEntityId, toEntityId, type, amount, description, date } = validated.data

    try {
        const transaction = await prisma.relatedTransaction.create({
            data: {
                fromEntityId,
                toEntityId,
                type,
                amount,
                description,
                date: date ? new Date(date) : new Date()
            }
        })

        // Log it
        await createAuditLog({
            action: "CREATE",
            resource: "Transaction",
            resourceId: transaction.id,
            details: `${type} of $${amount} from ${fromEntityId} to ${toEntityId}`
        })

    } catch (error) {
        console.error("Create Transaction Error:", error)
        return { message: "Failed to create transaction" }
    }

    revalidatePath('/entities/[id]')
    return { success: true, message: "Transaction saved successfully" }
}
