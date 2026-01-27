'use client'

import { useState } from 'react'

type NameChangeRecord = {
    id: string
    oldName: string
    newName: string
    changeDate: Date
    effectiveDate: Date | null
    documentUrl: string | null
}

export default function NameHistoryList({ history }: { history: NameChangeRecord[] }) {
    if (history.length === 0) return null

    return (
        <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "1rem", color: "var(--foreground)" }}>Name Change History</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {history.map((record) => (
                    <div key={record.id} style={{
                        background: "var(--background)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "1rem"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <div style={{ fontSize: "0.9rem", color: "var(--muted-foreground)" }}>
                                    Changed from <span style={{ fontWeight: "600", color: "var(--foreground)" }}>{record.oldName}</span> to <span style={{ fontWeight: "600", color: "var(--foreground)" }}>{record.newName}</span>
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                                    Processed: {new Date(record.changeDate).toLocaleDateString()}
                                    {record.effectiveDate && ` • Effective: ${new Date(record.effectiveDate).toLocaleDateString()}`}
                                </div>
                            </div>
                            {record.documentUrl && (
                                <a
                                    href={record.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", height: "auto" }}
                                >
                                    View Document
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
