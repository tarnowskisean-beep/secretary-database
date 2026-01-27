'use client'

import { useState, useTransition } from 'react'
// Server actions will be passed as props or imported directly if specific
import { changePersonName } from '@/server/actions/people' // We might need to make this generic or pass action
import { changeEntityName } from '@/server/actions/entities'

type NameChangeModalProps = {
    isOpen: boolean
    onClose: () => void
    targetId: string
    targetType: 'PERSON' | 'ENTITY'
    currentName: { first: string, last: string } | string // Person: {first, last}, Entity: string
}

export default function NameChangeModal({ isOpen, onClose, targetId, targetType, currentName }: NameChangeModalProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [fileLocalUrl, setFileLocalUrl] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        const formData = new FormData(e.currentTarget)
        formData.append(targetType === 'PERSON' ? 'personId' : 'entityId', targetId)

        // Handle File upload -> Base64
        const fileInput = (e.currentTarget.elements.namedItem('document') as HTMLInputElement)
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0]
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError("File is too large (Max 5MB)")
                return
            }
            // Convert to Base64
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.readAsDataURL(file)
            })
            formData.set('documentUrl', base64) // Replace file obj with string
            formData.delete('document')
        }

        startTransition(async () => {
            let res;
            if (targetType === 'PERSON') {
                res = await changePersonName({} as any, formData)
            } else {
                res = await changeEntityName({} as any, formData)
            }

            if (res?.success) {
                onClose()
            } else {
                setError(res?.message || "Failed to change name")
            }
        })
    }

    const isPerson = targetType === 'PERSON'
    const personName = typeof currentName === 'object' ? currentName : { first: '', last: '' }
    const entityName = typeof currentName === 'string' ? currentName : ''

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
            <div style={{ background: "white", padding: "2rem", borderRadius: "12px", width: "500px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Change Legal Name</h2>

                {error && <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "0.5rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                    {isPerson ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">New First Name</label>
                                <input type="text" name="firstName" defaultValue={personName.first} required className="input" style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">New Last Name</label>
                                <input type="text" name="lastName" defaultValue={personName.last} required className="input" style={{ width: "100%" }} />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">New Legal Name</label>
                            <input type="text" name="legalName" defaultValue={entityName} required className="input" style={{ width: "100%" }} />
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Effective Date (Optional)</label>
                        <input type="date" name="effectiveDate" className="input" style={{ width: "100%" }} />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Supporting Document (PDF/Image)</label>
                        <input
                            type="file"
                            name="document"
                            accept="application/pdf,image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) setFileLocalUrl(URL.createObjectURL(file))
                            }}
                            className="input"
                            style={{ width: "100%", padding: "0.5rem" }}
                        />
                        {fileLocalUrl && fileLocalUrl.endsWith('.pdf') === false && (
                            <div style={{ marginTop: "0.5rem", borderRadius: "6px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                                <img src={fileLocalUrl} alt="Preview" style={{ width: "100px", height: "auto" }} />
                            </div>
                        )}
                        <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                            Attach marriage certificate, court order, or amendment.
                        </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" disabled={isPending} className="btn btn-primary">
                            {isPending ? "Saving..." : "Save Change"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
