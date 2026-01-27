'use client'

import { useState, useEffect } from 'react'
import { getUsers, updateUserRole, deleteUser } from '@/server/actions/users'
import { UserRole } from '@prisma/client'
import AddUserDialog from '@/components/AddUserDialog'
import ActivityLogModal from '@/components/ActivityLogModal'

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddUser, setShowAddUser] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        const res = await getUsers()
        if (res.success && res.data) {
            setUsers(res.data)
        }
        setLoading(false)
    }

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        // Optimistic update
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
        await updateUserRole(userId, newRole)
    }

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure? This removes their access permissions (but not their Supabase Auth account).')) return
        await deleteUser(userId)
        setUsers(users.filter(u => u.id !== userId))
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500">Manage access roles and permissions.</p>
                </div>
                <button
                    onClick={() => setShowAddUser(true)}
                    className="btn btn-primary"
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                    <span>+</span> Add User
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Login</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Activity</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading users...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">No users found. (Log in once to create your user record).</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                            className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:ring-slate-500 focus:border-slate-500 block p-2"
                                        >
                                            <option value="VIEWER">Viewer</option>
                                            <option value="EDITOR">Editor</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        <button
                                            onClick={() => setSelectedUserId(user.id)}
                                            className="hover:underline text-blue-600 font-medium"
                                        >
                                            {user._count.auditLogs} actions
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showAddUser && (
                <AddUserDialog
                    onClose={() => setShowAddUser(false)}
                    onUserCreated={() => {
                        loadUsers()
                        setShowAddUser(false)
                    }}
                />
            )}

            {selectedUserId && (
                <ActivityLogModal
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                />
            )}
        </div>
    )
}
