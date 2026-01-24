
'use client'

import { createPerson } from '@/server/actions/people'
import { useActionState } from 'react'
import Link from 'next/link'

const initialState = {
    message: '',
    errors: {} as Record<string, string[]>
}

export default function NewPersonPage() {
    const [state, formAction] = useActionState(createPerson, initialState)

    return (
        <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem" }}>
                <Link href="/people" style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                    ← Back to People
                </Link>
                <h1 style={{ marginTop: "0.5rem" }}>New Person</h1>
            </header>

            <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                        <label htmlFor="firstName" style={{ fontWeight: 500 }}>First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
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
                            style={{ padding: "0.5rem", border: "1px solid var(--input)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--foreground)" }}
                        />
                        {state?.errors?.lastName && <p style={{ color: "red", fontSize: "0.875rem" }}>{state.errors.lastName[0]}</p>}
                    </div>
                </div>


                <button
                    type="submit"
                    style={{
                        padding: "0.75rem",
                        background: "var(--primary)",
                        color: "var(--primary-foreground)",
                        borderRadius: "var(--radius)",
                        fontWeight: 500,
                        border: "none",
                        fontSize: "1rem"
                    }}
                >
                    Create Person
                </button>

                {state?.message && <p style={{ color: "red", textAlign: "center" }}>{state.message}</p>}
            </form>
        </div>
    )
}
