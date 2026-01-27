'use server'

import { prisma } from '@/lib/db'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function logAuditAction(
    action: string, // e.g. "CREATE"
    resource: string, // e.g. "Entity"
    resourceId?: string,
    details?: string
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Get IP and User Agent for SOC 2 compliance
        const headerList = await headers()
        const ip = headerList.get('x-forwarded-for') || 'unknown'
        const userAgent = headerList.get('user-agent') || 'unknown'

        // If user is logged in, link to User model
        // Note: For this to work, the User must exist in Prisma (User table)
        // We'll need a sync mechanism or just store the userId string if not found

        await prisma.auditLog.create({
            data: {
                userId: user?.id,
                action,
                resource,
                resourceId,
                details,
                ipAddress: ip,
                userAgent
            }
        })
    } catch (error) {
        console.error("Failed to write audit log:", error)
        // In strict SOC 2, failing to log might require failing the action.
        // For now, we log the error 
    }
}
