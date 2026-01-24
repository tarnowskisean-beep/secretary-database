'use client'

import { createRelationship } from '@/server/actions/relationships'
import { useActionState } from 'react'

type Person = {
    id: string
    firstName: string
    lastName: string
}

export default function AddRelationshipForm({
    currentPersonId,
    allPeople
}: {
    currentPersonId: string
    allPeople: Person[]
}) {
    const [state, formAction] = useActionState(createRelationship, { message: '', errors: {} })

    const availablePeople = allPeople.filter(p => p.id !== currentPersonId)

    return (
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input type="hidden" name="person1Id" value={currentPersonId} />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="person2Id" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    Related Person
                </label>
                <select
                    id="person2Id"
                    name="person2Id"
                    required
                    style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", color: "black", width: "100%" }}
                >
                    <option value="">Select a person...</option>
                    {availablePeople.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                        </option>
                    ))}
                </select>
                {state?.errors?.person2Id && <p style={{ fontSize: "0.75rem", color: "red", marginTop: "0.25rem" }}>{state.errors.person2Id[0]}</p>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="type" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    Relationship Type
                </label>
                <select
                    id="type"
                    name="type"
                    required
                    style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", color: "black", width: "100%" }}
                >
                    <option value="FAMILY">Family Member</option>
                    <option value="BUSINESS">Business Partner</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="details" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    Details <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                    type="text"
                    id="details"
                    name="details"
                    placeholder="e.g. Spouse, Brother, Co-owner"
                    style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", color: "black", width: "100%" }}
                />
            </div>

            <div style={{ marginTop: "0.5rem" }}>
                <button
                    type="submit"
                    style={{ width: "100%", padding: "0.5rem 1rem", background: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "var(--radius)", border: "none", fontWeight: 500, cursor: "pointer" }}
                >
                    Add Relationship
                </button>
            </div>

            {state?.message && (
                <div style={{ fontSize: "0.75rem", padding: "0.5rem", borderRadius: "var(--radius)", background: state.success ? "#f0fdf4" : "#fef2f2", color: state.success ? "#15803d" : "#b91c1c" }}>
                    {state.message}
                </div>
            )}
        </form>
    )
}
