'use server'

import { createClient } from "@/utils/supabase/server"
import { prisma as db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function syncUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user || !user.email) {
        return { success: false, error: "No authenticated user found" }
    }

    try {
        // Check if user exists in our DB
        const existingUser = await db.user.findUnique({
            where: { id: user.id }
        })

        if (!existingUser) {
            // Create new record
            await db.user.create({
                data: {
                    id: user.id,
                    email: user.email,
                    role: UserRole.VIEWER, // Default role
                    lastLogin: new Date()
                }
            })

            // Log creation
            await db.auditLog.create({
                data: {
                    action: "AUTO_CREATE",
                    resource: "User",
                    resourceId: user.id,
                    userId: user.id,
                    details: `Auto-created user record for ${user.email} on login`
                }
            })
        } else {
            // Update last login
            await db.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            })

            // Log successful login
            await db.auditLog.create({
                data: {
                    action: "LOGIN",
                    resource: "Auth",
                    resourceId: user.id,
                    userId: user.id,
                    details: `User ${user.email} logged in`
                }
            })
        }

        return { success: true }
    } catch (dbError) {
        console.error("Sync User DB Error:", dbError)
        return { success: false, error: "Database sync failed" }
    }
}

export async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true }
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
        throw new Error("Forbidden: Admin access required")
    }

    return user
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    // redirect must be called outside of try/catch if it's used, but here there's no try/catch
    const { redirect } = await import('next/navigation')
    redirect('/login')
}
