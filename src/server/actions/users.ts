'use server'

import { prisma as db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

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
