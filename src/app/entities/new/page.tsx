
'use client'

import { createEntity } from '@/server/actions/entities'
import { useActionState } from 'react'
import Link from 'next/link'

const initialState = {
    message: '',
    errors: {} as Record<string, string[]>
}

export default function NewEntityPage() {
    const [state, formAction] = useActionState(createEntity, initialState)

    return (
        <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem" }}>
                <Link href="/entities" style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                    ← Back to Entities
                </Link>
                <h1 style={{ marginTop: "0.5rem" }}>New Entity</h1>
            </header>

            <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label htmlFor="legalName" style={{ fontWeight: 500 }}>Legal Name</label>
                    <input
                        type="text"
                        id="legalName"
                        name="legalName"
                        className="input"
                    />
                    {state?.errors?.legalName && <p style={{ color: "red", fontSize: "0.875rem" }}>{state.errors.legalName[0]}</p>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label htmlFor="ein" style={{ fontWeight: 500 }}>EIN</label>
                    <input
                        type="text"
                        id="ein"
                        name="ein"
                        placeholder="XX-XXXXXXX"
                        className="input"
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label htmlFor="logoUrl" style={{ fontWeight: 500 }}>Logo URL (Optional)</label>
                    <input
                        type="url"
                        id="logoUrl"
                        name="logoUrl"
                        placeholder="https://example.com/logo.png"
                        className="input"
                    />
                    <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>URL to a public image file (PNG/JPG)</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label htmlFor="entityType" style={{ fontWeight: 500 }}>Entity Type</label>
                    <select
                        id="entityType"
                        name="entityType"
                        defaultValue="501(c)(3)"
                        className="input"
                    >
                        <option value="501(c)(3)">501(c)(3) Public Charity</option>
                        <option value="501(c)(4)">501(c)(4) Social Welfare</option>
                        <option value="527">527 Political Org</option>
                        <option value="LLC">LLC</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label htmlFor="stateOfIncorporation" style={{ fontWeight: 500 }}>State</label>
                    <input
                        type="text"
                        id="stateOfIncorporation"
                        name="stateOfIncorporation"
                        maxLength={2}
                        className="input"
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: "100%", fontSize: "1rem", padding: "0.75rem" }}
                >
                    Create Entity
                </button>

                {state?.message && <p style={{ color: "red", textAlign: "center" }}>{state.message}</p>}
            </form>
        </div>
    )
}
