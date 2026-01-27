'use client'

import { useState, useTransition } from 'react'
import { createAttachment, deleteAttachment } from '@/server/actions/attachments'

type Attachment = {
    id: string
    title: string
    url: string
    createdAt: Date
}

type AttachmentsCardProps = {
    attachments: Attachment[]
    personId?: string
    entityId?: string
}

export default function AttachmentsCard({ attachments, personId, entityId }: AttachmentsCardProps) {
    const [isAdding, setIsAdding] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [title, setTitle] = useState("")
    const [url, setUrl] = useState("")
    const [error, setError] = useState<string | null>(null)

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        startTransition(async () => {
            const formData = new FormData()
            formData.append('title', title)
            formData.append('url', url)
            if (personId) formData.append('personId', personId)
            if (entityId) formData.append('entityId', entityId)

            const res = await createAttachment(null, formData)
            if (res.success) {
                setIsAdding(false)
                setTitle("")
                setUrl("")
            } else {
                setError(res.message || "Failed to add")
            }
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this link?")) return
        const path = personId ? `/people/${personId}` : `/entities/${entityId}`
        await deleteAttachment(id, path)
    }

    return (
        <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Documents & Links</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    style={{ fontSize: "0.875rem", color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
                >
                    {isAdding ? "Cancel" : "+ Add Link"}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAdd} style={{ marginBottom: "1rem", padding: "1rem", background: "var(--muted)", borderRadius: "var(--radius)" }}>
                    {error && <div style={{ color: "red", fontSize: "0.8rem", marginBottom: "0.5rem" }}>{error}</div>}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <input
                            placeholder="Document Title (e.g. Tax Returns)"
                            className="input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                        <input
                            placeholder="URL (e.g. Google Drive Link)"
                            className="input"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            type="url"
                            required
                        />
                        <button type="submit" disabled={isPending} className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
                            {isPending ? "Adding..." : "Save Link"}
                        </button>
                    </div>
                </form>
            )}

            {attachments.length === 0 ? (
                <div style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", fontStyle: "italic" }}>
                    No documents attached.
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {attachments.map(att => (
                        <div key={att.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                                <div style={{ fontSize: "1.25rem" }}>
                                    {att.url.includes('drive.google.com') ? '📁' : '📄'}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="hover:underline">
                                        {att.title}
                                    </a>
                                    <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                                        Added {new Date(att.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(att.id)}
                                style={{ color: "var(--muted-foreground)", padding: "0.25rem", background: "none", border: "none", cursor: "pointer" }}
                                title="Remove Link"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
