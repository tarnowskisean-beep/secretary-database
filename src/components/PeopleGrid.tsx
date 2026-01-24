'use client'

import { useState } from 'react'
import Link from 'next/link'

type Person = {
    id: string
    firstName: string
    lastName: string
    internalId?: string | null
}

export default function PeopleGrid({ people }: { people: Person[] }) {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredPeople = people.filter(person => {
        const query = searchQuery.toLowerCase()
        return (
            person.firstName.toLowerCase().includes(query) ||
            person.lastName.toLowerCase().includes(query) ||
            (person.internalId && person.internalId.toLowerCase().includes(query))
        )
    })

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ maxWidth: "400px" }}>
                <input
                    type="text"
                    placeholder="Search people..."
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
                {filteredPeople.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", padding: "3rem", textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--border)", borderRadius: "var(--radius)" }}>
                        No people found matching &quot;{searchQuery}&quot;.
                    </div>
                ) : (
                    filteredPeople.map((person) => (
                        <Link href={`/people/${person.id}`} key={person.id} style={{ textDecoration: "none" }}>
                            <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "2rem" }}>
                                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--muted)", color: "var(--muted-foreground)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
                                    {person.firstName[0]}{person.lastName[0]}
                                </div>
                                <h3 style={{ fontSize: "1.125rem" }}>{person.firstName} {person.lastName}</h3>
                                {person.internalId && <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{person.internalId}</p>}
                                <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--accent)" }}>
                                    View Profile →
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
