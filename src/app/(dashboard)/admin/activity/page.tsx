'use client'

import { useState, useEffect } from 'react'
import { getAuditLogs, getUsers } from '@/server/actions/users' // Assuming getUsers exists
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

type AuditLog = {
    id: string
    action: string
    resource: string
    details: string | null
    createdAt: Date
    user: { email: string } | null
}

type UserOption = {
    id: string
    email: string
}

export default function ActivityPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [logs, setLogs] = useState<AuditLog[]>([])
    const [users, setUsers] = useState<UserOption[]>([])
    const [loading, setLoading] = useState(true)

    const currentAction = searchParams.get('action') || ''
    const currentUser = searchParams.get('userId') || ''

    useEffect(() => {
        loadData()
    }, [currentAction, currentUser])

    const loadData = async () => {
        setLoading(true)
        const [logsRes, usersRes] = await Promise.all([
            getAuditLogs(currentUser, currentAction),
            getUsers()
        ])

        if (logsRes.success && logsRes.data) {
            setLogs(logsRes.data)
        }
        if (usersRes.success && usersRes.data) {
            setUsers(usersRes.data)
        }
        setLoading(false)
    }

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`?${params.toString()}`)
    }

    return (
        <div style={{ padding: "2rem" }}>
            <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "1.875rem", fontWeight: 700, marginBottom: "0.5rem" }}>Activity Log</h1>
                    <p style={{ color: "var(--muted-foreground)" }}>Audit trail of all system actions</p>
                </div>
            </div>

            {/* Filters */}
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "1.5rem",
                padding: "1rem",
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)"
            }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)" }}>
                        Action Type
                    </label>
                    <select
                        value={currentAction}
                        onChange={(e) => handleFilterChange('action', e.target.value)}
                        className="input"
                        style={{ minWidth: "200px" }}
                    >
                        <option value="">All Actions</option>
                        <option value="LOGIN">Login</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                        <option value="AUTO_CREATE">System</option>
                    </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)" }}>
                        User
                    </label>
                    <select
                        value={currentUser}
                        onChange={(e) => handleFilterChange('userId', e.target.value)}
                        className="input"
                        style={{ minWidth: "250px" }}
                    >
                        <option value="">All Users</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.email}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">No logs found matching your filters.</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                        {log.user?.email || 'System'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span style={{
                                            padding: "0.25rem 0.5rem",
                                            borderRadius: "9999px",
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            backgroundColor:
                                                log.action === 'DELETE' ? '#fef2f2' :
                                                    log.action === 'CREATE' ? '#f0fdf4' :
                                                        log.action === 'UPDATE' ? '#eff6ff' :
                                                            '#f8fafc',
                                            color:
                                                log.action === 'DELETE' ? '#b91c1c' :
                                                    log.action === 'CREATE' ? '#15803d' :
                                                        log.action === 'UPDATE' ? '#1d4ed8' :
                                                            '#475569'
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        <div style={{ fontWeight: 500 }}>{log.resource}</div>
                                        <div style={{ fontSize: "0.80rem", color: "#64748b" }}>{log.details}</div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
