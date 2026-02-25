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
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5rem" }}>
            <div style={{
                width: "64px", height: "64px", flexShrink: 0, borderRadius: "12px",
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
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <h1 style={{ margin: 0, fontSize: "2rem", lineHeight: 1.2, wordBreak: "break-word" }}>{legalName}</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{ flexShrink: 0, marginTop: "0.35rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, color: "var(--primary)", background: "var(--primary-foreground)", border: "1px solid var(--primary)", padding: "0.25rem 0.5rem", borderRadius: "1rem", cursor: "pointer", whiteSpace: "nowrap" }}
                        title="Record a Legal Name Change"
                    >
                        Change
                    </button>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", color: "var(--muted-foreground)" }}>
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
