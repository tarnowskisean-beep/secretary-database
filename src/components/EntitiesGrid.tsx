'use client'

import { useState } from 'react'
import Link from 'next/link'

type Entity = {
    id: string
    legalName: string
    entityType: string
    stateOfIncorporation?: string | null
    ein?: string | null
}

export default function EntitiesGrid({ entities }: { entities: Entity[] }) {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredEntities = entities.filter(entity => {
        const query = searchQuery.toLowerCase()
        return (
            entity.legalName.toLowerCase().includes(query) ||
            (entity.ein && entity.ein.includes(query)) ||
            (entity.entityType && entity.entityType.toLowerCase().includes(query))
        )
    })

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ maxWidth: "400px" }}>
                <input
                    type="text"
                    placeholder="Search entities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--input)",
                        fontSize: "1rem",
                        outline: "none"
                    }}
                />
            </div>

            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                {filteredEntities.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", padding: "3rem", textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--border)", borderRadius: "var(--radius)" }}>
                        No entities found matching &quot;{searchQuery}&quot;.
                    </div>
                ) : (
                    filteredEntities.map((entity) => (
                        <div key={entity.id} className="card">
                            <h3 style={{ marginBottom: "0.25rem" }}>
                                <Link href={`/entities/${entity.id}`} style={{ textDecoration: "none", color: "inherit" }} className="hover:underline">
                                    {entity.legalName}
                                </Link>
                            </h3>
                            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                                <span className="badge" style={{ background: "var(--muted)", color: "var(--secondary-foreground)" }}>
                                    {entity.entityType}
                                </span>
                                {entity.stateOfIncorporation && (
                                    <span className="badge" style={{ background: "var(--muted)", color: "var(--secondary-foreground)" }}>
                                        {entity.stateOfIncorporation}
                                    </span>
                                )}
                            </div>
                            <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                                EIN: <span style={{ fontFamily: "monospace" }}>{entity.ein || "N/A"}</span>
                            </div>
                            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                                <Link
                                    href={`/entities/${entity.id}/edit`}
                                    className="btn btn-secondary"
                                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", height: "auto" }}
                                >
                                    Edit
                                </Link>
                                <Link
                                    href={`/entities/${entity.id}`}
                                    className="btn btn-primary"
                                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", height: "auto", marginLeft: "0.5rem" }}
                                >
                                    View
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
