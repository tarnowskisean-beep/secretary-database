
'use client'

import { createPerson, checkPersonDuplicate } from '@/server/actions/people'
import { useActionState, useState, useRef } from 'react'
import Link from 'next/link'

const initialState = {
    message: '',
    errors: {} as Record<string, string[]>
}

export default function NewPersonPage() {
    const [state, formAction] = useActionState(createPerson, initialState)
    const [candidates, setCandidates] = useState<{ id: string, firstName: string, lastName: string }[]>([])
    const [showWarning, setShowWarning] = useState(false)
    const skipCheckRef = useRef(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        // If we already checked and passed, or showed warning, allow submit
        if (skipCheckRef.current || showWarning) {
            skipCheckRef.current = false // Reset for next time (e.g. if server error)
            return
        }

        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const firstName = formData.get('firstName') as string
        const lastName = formData.get('lastName') as string

        if (!firstName || !lastName || firstName.length < 2) {
            // Let server validation handle basic errors, skip check
            skipCheckRef.current = true
            e.currentTarget.requestSubmit()
            return
        }

        // Check duplicates
        const duplicates = await checkPersonDuplicate(firstName, lastName)

        if (duplicates.length > 0) {
            setCandidates(duplicates)
            setShowWarning(true)
        } else {
            // No duplicates, proceed
            skipCheckRef.current = true
            e.currentTarget.requestSubmit()
        }
    }

    return (
        <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem" }}>
                <Link href="/people" style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                    ← Back to People
                </Link>
                <h1 style={{ marginTop: "0.5rem" }}>New Person</h1>
            </header>

            <form action={formAction} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                        <label htmlFor="firstName" style={{ fontWeight: 500 }}>First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            required
                            style={{ padding: "0.5rem", border: "1px solid var(--input)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--foreground)" }}
                        />
                        {state?.errors?.firstName && <p style={{ color: "red", fontSize: "0.875rem" }}>{state.errors.firstName[0]}</p>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                        <label htmlFor="lastName" style={{ fontWeight: 500 }}>Last Name</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            required
                            style={{ padding: "0.5rem", border: "1px solid var(--input)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--foreground)" }}
                        />
                        {state?.errors?.lastName && <p style={{ color: "red", fontSize: "0.875rem" }}>{state.errors.lastName[0]}</p>}
                    </div>
                </div>

                {showWarning && (
                    <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid var(--warning)", borderRadius: "var(--radius)", padding: "1rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "var(--warning)", fontWeight: 600, marginBottom: "0.5rem" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            Possible Duplicates Found
                        </div>
                        <p style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>We found similar records. Are you sure you want to create a new one?</p>
                        <ul style={{ fontSize: "0.875rem", paddingLeft: "1.5rem", marginBottom: "1rem" }}>
                            {candidates.map(c => (
                                <li key={c.id}>
                                    <Link href={`/people/${c.id}`} target="_blank" style={{ textDecoration: "underline" }}>
                                        {c.firstName} {c.lastName}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                                type="button"
                                onClick={() => { setShowWarning(false); setCandidates([]) }}
                                className="btn btn-secondary"
                                style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    style={{
                        padding: "0.75rem",
                        background: showWarning ? "var(--warning)" : "var(--primary)",
                        color: showWarning ? "black" : "var(--primary-foreground)",
                        borderRadius: "var(--radius)",
                        fontWeight: 500,
                        border: "none",
                        fontSize: "1rem",
                        cursor: "pointer"
                    }}
                >
                    {showWarning ? "Ignore & Create Person" : "Create Person"}
                </button>

                {state?.message && <p style={{ color: "red", textAlign: "center" }}>{state.message}</p>}
            </form>
        </div>
    )
}
