'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type EntityOption = {
    id: string
    legalName: string
    acronym?: string // Optional if we want to show it
}


type PeopleOption = {
    id: string
    firstName: string
    lastName: string
}

export default function RiskFilters({ entities, people }: { entities: EntityOption[], people: PeopleOption[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentType = searchParams.get('type') || ''
    const currentEntity = searchParams.get('entityId') || ''
    const currentPerson = searchParams.get('personId') || ''

    function handleFilterChange(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`?${params.toString()}`)
    }

    return (
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
                    Alert Type
                </label>
                <select
                    value={currentType}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    style={{
                        padding: "0.5rem",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--background)",
                        fontSize: "0.875rem",
                        minWidth: "200px"
                    }}
                >
                    <option value="">All Types</option>
                    <option value="CONTROL">Control Issues (Appoitment/Overlap)</option>
                    <option value="INDEPENDENCE">Board Independence</option>
                    <option value="CONFLICT">Conflict of Interest</option>
                    <option value="SCHEDULE_R">Schedule R / Related Org</option>
                </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)" }}>
                    Entity
                </label>
                <select
                    value={currentEntity}
                    onChange={(e) => handleFilterChange('entityId', e.target.value)}
                    style={{
                        padding: "0.5rem",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--background)",
                        fontSize: "0.875rem",
                        minWidth: "250px"
                    }}
                >
                    <option value="">All Entities</option>
                    {entities.map(e => (
                        <option key={e.id} value={e.id}>
                            {e.legalName}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)" }}>
                    Person
                </label>
                <select
                    value={currentPerson}
                    onChange={(e) => handleFilterChange('personId', e.target.value)}
                    style={{
                        padding: "0.5rem",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--background)",
                        fontSize: "0.875rem",
                        minWidth: "250px"
                    }}
                >
                    <option value="">All People</option>
                    {people.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}
