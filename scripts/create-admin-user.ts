import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createAdminClient } from '../src/utils/supabase/admin'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@compassprofessional.com'
    const password = 'Password123!'
    console.log(`Attempting to create admin user: ${email}`)

    const supabase = createAdminClient()

    // 1. Create in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    })

    if (authError) {
        console.error("Error creating user in Supabase Auth:", authError)
        return
    }

    const userId = authUser.user.id
    console.log(`Created user in Auth with ID: ${userId}`)

    // 2. Create in Prisma DB
    try {
        await prisma.user.create({
            data: {
                id: userId,
                email: email,
                role: 'ADMIN' // Assuming UserRole.ADMIN exists
            }
        })
        console.log("Successfully created user in Prisma DB with ADMIN role.")
    } catch (dbError) {
         console.error("Error creating user in Prisma DB:", dbError)
    } finally {
        await prisma.$disconnect()
    }

    console.log(`\n--- SUCCESS ---\nYou can now login with:\nEmail: ${email}\nPassword: ${password}`)
}

main()
