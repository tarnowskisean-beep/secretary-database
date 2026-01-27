'use client'

import { useState } from 'react'
import NameChangeModal from '@/components/NameChangeModal'

type PersonNameHeaderProps = {
    personId: string
    firstName: string
    lastName: string
    internalId?: string | null
}

export default function PersonNameHeader({ personId, firstName, lastName, internalId }: PersonNameHeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-foreground) 100%)",
                color: "white", fontSize: "1.5rem", fontWeight: "bold",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid var(--background)", boxShadow: "0 0 0 1px var(--border)"
            }}>
                {firstName[0]}{lastName[0]}
            </div>
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <h1 style={{ margin: 0, fontSize: "2rem" }}>{firstName} {lastName}</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, color: "var(--primary)", background: "var(--primary-foreground)", border: "1px solid var(--primary)", padding: "0.25rem 0.5rem", borderRadius: "1rem", cursor: "pointer" }}
                        title="Record a Legal Name Change"
                    >
                        Change
                    </button>
                </div>
                {internalId && <p style={{ color: "var(--muted-foreground)", marginTop: "0.25rem" }}>ID: {internalId}</p>}
            </div>

            <NameChangeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                targetId={personId}
                targetType="PERSON"
                currentName={{ first: firstName, last: lastName }}
            />
        </div>
    )
}
