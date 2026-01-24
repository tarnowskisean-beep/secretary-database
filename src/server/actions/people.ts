'use server'

import { prisma } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { FormState } from '@/lib/types'

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
        await prisma.person.create({
            data: {
                firstName: validated.data.firstName,
                lastName: validated.data.lastName,
            }
        })
    } catch {
        return { message: "Failed to create person" }
    }

    revalidatePath('/people')
    redirect('/people')
}
