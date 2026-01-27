'use client'

import { deletePerson } from "@/server/actions/people"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PersonDeleteButton({ personId }: { personId: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this person? This action cannot be undone.")) return

        setLoading(true)
        setError(null)

        const res = await deletePerson(personId)

        if (res.success) {
            router.push('/people')
        } else {
            setError(res.error || "Failed to delete person")
            setLoading(false)
        }
    }

    return (
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            <button
                onClick={handleDelete}
                disabled={loading}
                style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "#fee2e2",
                    color: "#991b1b",
                    border: "1px solid #fecaca",
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem"
                }}
            >
                {loading ? "Deleting..." : (
                    <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        Delete Person
                    </>
                )}
            </button>
            {error && (
                <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "red", textAlign: "center" }}>
                    {error}
                </p>
            )}
        </div>
    )
}
