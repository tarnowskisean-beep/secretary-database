'use client'

import { endRole } from '@/server/actions/roles'
import { useState, useActionState } from 'react'

export default function EndRoleDialog({ roleId, personId }: { roleId: string, personId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const endRoleWithIds = endRole.bind(null, roleId, personId)
    const [state, formAction] = useActionState(endRoleWithIds, { message: '', errors: {} })

    if (state?.success && isOpen) {
        setIsOpen(false)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    color: "red",
                    background: "none",
                    border: "none",
                    textDecoration: "underline",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "0.875rem"
                }}
            >
                End Term
            </button>
        )
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
        }}>
            <div style={{
                background: 'var(--secondary)',
                padding: '2rem',
                borderRadius: 'var(--radius)',
                width: '100%',
                maxWidth: '500px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <h3 style={{ marginBottom: '1rem' }}>End Term & Record Resignation</h3>
                <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                    To end this role, you must provide the resignation letter or board resolution documenting this change.
                </p>

                <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label htmlFor="endDate" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                            Effective End Date
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            id="endDate"
                            required
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="input"
                        />

                        {state?.errors?.endDate && <p style={{ color: "red", fontSize: "0.75rem" }}>{state.errors.endDate[0]}</p>}
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label htmlFor="resignationDocUrl" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                Resignation Document URL
                            </label>
                            <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    name="missingDoc"
                                    onChange={(e) => {
                                        const urlInput = document.getElementById('resignationDocUrl') as HTMLInputElement
                                        if (e.target.checked) {
                                            urlInput.value = ''
                                            urlInput.disabled = true
                                            urlInput.required = false
                                        } else {
                                            urlInput.disabled = false
                                            urlInput.required = true
                                        }
                                    }}
                                />
                                Missing document
                            </label>
                        </div>
                        <input
                            type="url"
                            name="resignationDocUrl"
                            id="resignationDocUrl"
                            placeholder="https://drive.google.com/..."
                            required
                            className="input"
                        />

                        {state?.errors?.resignationDocUrl && <p style={{ color: "red", fontSize: "0.75rem" }}>{state.errors.resignationDocUrl[0]}</p>}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn"
                            style={{ background: 'red', color: 'white' }}
                        >
                            Confirm End Term
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
