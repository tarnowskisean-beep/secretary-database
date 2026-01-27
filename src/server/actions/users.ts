'use server'

import { prisma as db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { z } from "zod";

const CreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(UserRole)
});

export async function createUser(formData: unknown) {
    try {
        const result = CreateUserSchema.safeParse(formData);

        if (!result.success) {
            return { success: false, error: "Invalid data format" };
        }

        const { email, password, role } = result.data;
        const supabase = createAdminClient();

        // 1. Create in Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Auto-confirm for admin-created users
        });

        if (authError || !authUser.user) {
            console.error("Supabase Auth Error:", authError);
            return { success: false, error: authError?.message || "Failed to create user in Auth" };
        }

        // 2. Create in Prisma DB
        await db.user.create({
            data: {
                id: authUser.user.id,
                email: email,
                role: role
            }
        });

        // 3. Log Action
        await db.auditLog.create({
            data: {
                action: "CREATE",
                resource: "User",
                resourceId: authUser.user.id,
                details: `Created user ${email} with role ${role}`
            }
        });

        revalidatePath('/admin/users');
        return { success: true };

    } catch (error) {
        console.error("Create User Error:", error);
        return { success: false, error: "Failed to create user" };
    }
}

export async function createAuditLog(data: { action: string, resource: string, resourceId?: string, details?: string, userId?: string }) {
    try {
        await db.auditLog.create({
            data: {
                ...data,
                userId: data.userId
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Audit Log Error:", error);
        return { success: false, error: "Failed to log action" };
    }
}

export async function getAuditLogs(userId?: string, action?: string) {
    try {
        const where: any = {};
        if (userId) where.userId = userId;
        if (action) where.action = action;

        const logs = await db.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: { user: { select: { email: true } } }
        });
        return { success: true, data: logs };
    } catch (error) {
        console.error("Fetch Logs Error:", error);
        return { success: false, error: "Failed to fetch logs" };
    }
}

export async function getUsers() {
    try {
        const users = await db.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { auditLogs: true }
                }
            }
        });
        return { success: true, data: users };
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return { success: false, error: "Failed to fetch users" };
    }
}

export async function updateUserRole(userId: string, newRole: UserRole) {
    try {
        await db.user.update({
            where: { id: userId },
            data: { role: newRole }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error("Failed to update role:", error);
        return { success: false, error: "Failed to update role" };
    }
}

export async function deleteUser(userId: string) {
    try {
        // Note: This only deletes from Prisma. Actual Auth user must be deleted in Supabase Dashboard.
        await db.user.delete({
            where: { id: userId }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { success: false, error: "Failed to delete user" };
    }
}
