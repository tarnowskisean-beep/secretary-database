'use server'

import { prisma } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { FormState } from '@/lib/types'

const RelationshipSchema = z.object({
    person1Id: z.string().uuid(),
    person2Id: z.string().uuid(),
    type: z.enum(['FAMILY', 'BUSINESS', 'OTHER']),
    details: z.string().optional()
})

export async function createRelationship(prevState: FormState, formData: FormData) {
    const data = {
        person1Id: formData.get('person1Id'),
        person2Id: formData.get('person2Id'),
        type: formData.get('type'),
        details: formData.get('details')
    }

    const validated = RelationshipSchema.safeParse(data)

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Validation failed"
        }
    }

    // Prevent self-relationship
    if (validated.data.person1Id === validated.data.person2Id) {
        return { message: "Cannot create a relationship with oneself." }
    }

    try {
        await prisma.relationship.create({
            data: {
                person1Id: validated.data.person1Id,
                person2Id: validated.data.person2Id,
                type: validated.data.type,
                details: validated.data.details || ''
            }
        })
    } catch (e) {
        console.error("Create Relationship Error:", e)
        return { message: "Failed to create relationship." }
    }

    revalidatePath(`/people/${validated.data.person1Id}`)
    revalidatePath(`/people/${validated.data.person2Id}`)
    return { message: "Relationship created successfully!", success: true }
}
