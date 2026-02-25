
'use client'

import { createEntity, checkEntityDuplicate } from '@/server/actions/entities'
import { useActionState, useState, useRef } from 'react'
import Link from 'next/link'

const initialState = {
    message: '',
    errors: {} as Record<string, string[]>
}

export default function NewEntityPage() {
    const [state, formAction] = useActionState(createEntity, initialState)
    const [candidates, setCandidates] = useState<{ id: string, legalName: string, ein?: string | null }[]>([])
    const [showWarning, setShowWarning] = useState(false)
    const skipCheckRef = useRef(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        if (skipCheckRef.current || showWarning) {
            skipCheckRef.current = true
            return
        }

        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const legalName = formData.get('legalName') as string

        if (!legalName || legalName.length < 3) {
            skipCheckRef.current = true
            e.currentTarget.requestSubmit()
            return
        }

        const duplicates = await checkEntityDuplicate(legalName)

        if (duplicates.length > 0) {
            setCandidates(duplicates)
            setShowWarning(true)
        } else {
            skipCheckRef.current = true
            e.currentTarget.requestSubmit()
        }
    }

    return (
        <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem" }}>
                <Link href="/entities" style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                    ← Back to Entities
                </Link>
                <h1 style={{ marginTop: "0.5rem" }}>New Entity</h1>
            </header>

            <form action={formAction} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

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

                {showWarning && (
                    <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid var(--warning)", borderRadius: "var(--radius)", padding: "1rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "var(--warning)", fontWeight: 600, marginBottom: "0.5rem" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            Possible Duplicates Found
                        </div>
                        <p style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>We found similar entities. Are you sure you want to create a new one?</p>
                        <ul style={{ fontSize: "0.875rem", paddingLeft: "1.5rem", marginBottom: "1rem" }}>
                            {candidates.map(c => (
                                <li key={c.id}>
                                    <Link href={`/entities/${c.id}`} target="_blank" style={{ textDecoration: "underline" }}>
                                        {c.legalName}
                                    </Link>
                                    {c.ein && <span style={{ color: "var(--muted-foreground)", marginLeft: "0.5rem" }}>(EIN: {c.ein})</span>}
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

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontWeight: 500 }}>Entity Logo (Upload)</label>

                    {/* Hidden input to store Base64 string for Server Action */}
                    <input type="hidden" name="logoUrl" id="logoUrlHidden" />

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {/* Preview */}
                        <div style={{
                            width: '60px', height: '60px',
                            border: '1px dashed var(--border)',
                            borderRadius: '0.25rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', background: "var(--muted)"
                        }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                id="logoPreview"
                                src=""
                                alt=""
                                style={{ maxWidth: '100%', maxHeight: '100%', display: 'none' }}
                            />
                            <span id="logoPlaceholder" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>No Logo</span>
                        </div>

                        <div style={{ flex: 1 }}>
                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                        if (file.size > 500000) { // 500KB limit
                                            alert("File too large. Please choose an image under 500KB.")
                                            e.target.value = ''
                                            return
                                        }

                                        const reader = new FileReader()
                                        reader.onload = (ev) => {
                                            const base64 = ev.target?.result as string

                                            // Update Hidden Input for form submission
                                            const hiddenInput = document.getElementById('logoUrlHidden') as HTMLInputElement
                                            if (hiddenInput) hiddenInput.value = base64

                                            // Update Preview
                                            const preview = document.getElementById('logoPreview') as HTMLImageElement
                                            const placeholder = document.getElementById('logoPlaceholder') as HTMLSpanElement
                                            if (preview) {
                                                preview.src = base64
                                                preview.style.display = 'block'
                                            }
                                            if (placeholder) placeholder.style.display = 'none'
                                        }
                                        reader.readAsDataURL(file)
                                    }
                                }}
                                className="input" // Re-using existing class
                                style={{ padding: '0.5rem' }}
                            />
                            <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                                Select an image file (PNG/JPG, max 500KB). It will be embedded directly.
                            </p>
                        </div>
                    </div>
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
                        <option value="S Corporation">S Corporation</option>
                        <option value="C Corporation">C Corporation</option>
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
                    style={{
                        width: "100%",
                        fontSize: "1rem",
                        padding: "0.75rem",
                        background: showWarning ? "var(--warning)" : undefined,
                        color: showWarning ? "black" : undefined
                    }}
                >
                    {showWarning ? "Ignore & Create Entity" : "Create Entity"}
                </button>

                {state?.message && <p style={{ color: "red", textAlign: "center" }}>{state.message}</p>}
            </form>
        </div>
    )
}
