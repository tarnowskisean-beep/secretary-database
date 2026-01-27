'use client'

import { useState, useEffect } from 'react'
import { getAuditLogs } from '@/server/actions/users'

type AuditLog = {
    id: string
    action: string
    resource: string
    details: string | null
    createdAt: Date
}

export default function ActivityLogModal({ userId, onClose }: { userId: string, onClose: () => void }) {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadLogs()
    }, [userId])

    const loadLogs = async () => {
        const res = await getAuditLogs(userId)
        if (res.success && res.data) {
            setLogs(res.data)
        }
        setLoading(false)
    }

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
            <div style={{ background: "white", borderRadius: "12px", width: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
                <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>Activity Log</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--muted-foreground)" }}>&times;</button>
                </div>

                <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
                    {loading ? (
                        <div style={{ textAlign: "center", color: "var(--muted-foreground)" }}>Loading activity...</div>
                    ) : logs.length === 0 ? (
                        <div style={{ textAlign: "center", color: "var(--muted-foreground)" }}>No activity recorded.</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {logs.map((log) => (
                                <div key={log.id} style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                                            {log.action} {log.resource}
                                        </span>
                                        <span style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                                        {log.details}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
