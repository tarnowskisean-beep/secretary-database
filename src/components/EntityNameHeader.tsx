'use client'

import { useState } from 'react'
import NameChangeModal from '@/components/NameChangeModal'

type EntityNameHeaderProps = {
    entityId: string
    legalName: string
    logoUrl?: string | null
    type: string
}

export default function EntityNameHeader({ entityId, legalName, logoUrl, type }: EntityNameHeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{
                width: "64px", height: "64px", borderRadius: "12px",
                background: "white",
                border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden"
            }}>
                {logoUrl ? (
                    <img src={logoUrl} alt={legalName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--muted-foreground)" }}>
                        {legalName[0]}
                    </div>
                )}
            </div>
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <h1 style={{ margin: 0, fontSize: "2rem" }}>{legalName}</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            fontSize: "0.8rem",
                            padding: "0.25rem 0.5rem",
                            background: "var(--muted)",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            color: "var(--muted-foreground)"
                        }}
                    >
                        Change Name
                    </button>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem", color: "var(--muted-foreground)" }}>
                    <span className="badge badge-secondary">{type}</span>
                </div>
            </div>

            <NameChangeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                targetId={entityId}
                targetType="ENTITY"
                currentName={legalName}
            />
        </div>
    )
}
