'use client'

import { updateRole, deleteRole } from '@/server/actions/roles'
import { useState, useActionState, useEffect } from 'react'
import { createPortal } from 'react-dom'

// If RoleType isn't exported globally, we can just use strings or define it:
// type RoleType = 'DIRECTOR' | 'OFFICER' | 'TRUSTEE' | 'KEY_EMPLOYEE'

export default function EditRoleDialog({ role }: {
    role: {
        id: string,
        title: string,
        roleType: string,
        startDate: Date | null,
        endDate: Date | null,
        votingRights: boolean,
        isCompensated: boolean,
        appointmentDocUrl: string | null,
        resignationDocUrl: string | null,
        personId: string,
        entityId: string
    }
}) {
    const [isOpen, setIsOpen] = useState(false)
    const updateRoleWithId = updateRole.bind(null, role.id)
    const [state, formAction] = useActionState(updateRoleWithId, { message: '', errors: {} })

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    // Dynamic Title State
    const [roleType, setRoleType] = useState(role.roleType)

    // Officer title options
    const OFFICER_OPTIONS = ["President", "Chairman", "CEO", "Treasurer", "Secretary", "Vice President", "General Counsel"]

    // Initialize officer titles if the role is already an officer
    const initialOfficerTitles = role.roleType === 'OFFICER'
        ? role.title.split(',').map(t => t.trim()).filter(t => OFFICER_OPTIONS.includes(t))
        : []

    const [officerTitles, setOfficerTitles] = useState<string[]>(initialOfficerTitles)

    const handleOfficerTitleToggle = (title: string) => {
        setOfficerTitles(prev =>
            prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
        )
    }

    // Auto-close on success
    useEffect(() => {
        if (state?.success && isOpen) {
            setIsOpen(false)
        }
    }, [state?.success, isOpen])

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="btn btn-secondary"
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", height: "auto" }}
                >
                    Edit
                </button>
            )}

            {mounted && isOpen && createPortal(
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
                        background: 'var(--background)',
                        padding: '2rem',
                        borderRadius: 'var(--radius)',
                        width: '100%',
                        maxWidth: '500px',
                        boxShadow: 'var(--shadow-lg)',
                        border: '1px solid var(--border)'
                    }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Edit Role Details</h3>

                        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {/* Role Type */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <label htmlFor="roleType" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Role Type</label>
                                <select
                                    name="roleType"
                                    id="roleType"
                                    value={roleType}
                                    onChange={(e) => {
                                        setRoleType(e.target.value)
                                        if (e.target.value !== 'OFFICER') setOfficerTitles([])
                                    }}
                                    className="input"
                                >
                                    <option value="DIRECTOR">Director</option>
                                    <option value="OFFICER">Officer</option>
                                    <option value="TRUSTEE">Trustee</option>
                                    <option value="KEY_EMPLOYEE">Key Employee</option>
                                </select>
                            </div>

                            {/* Title */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <label htmlFor="title" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Title</label>

                                {roleType === 'DIRECTOR' && (
                                    <>
                                        <input type="text" id="title-display" value="Director" readOnly className="input" style={{ background: "#f1f5f9", color: "#64748b", cursor: "not-allowed" }} />
                                        <input type="hidden" name="title" value="Director" />
                                    </>
                                )}

                                {roleType === 'OFFICER' && (
                                    <div style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", background: "white", color: "black", width: "100%", maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                        {OFFICER_OPTIONS.map(opt => (
                                            <label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", padding: "0.25rem" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={officerTitles.includes(opt)}
                                                    onChange={() => handleOfficerTitleToggle(opt)}
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                        <input type="hidden" name="title" value={officerTitles.join(', ')} />
                                    </div>
                                )}

                                {(roleType === 'TRUSTEE' || roleType === 'KEY_EMPLOYEE') && (
                                    <input
                                        type="text"
                                        name="title"
                                        id="title"
                                        defaultValue={roleType === role.roleType ? role.title : ''}
                                        className="input"
                                        required
                                    />
                                )}
                                {state?.errors?.title && <p style={{ color: "red", fontSize: "0.75rem" }}>{state.errors.title[0]}</p>}
                            </div>

                            {/* Dates Row */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    <label htmlFor="startDate" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Start Date</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        id="startDate"
                                        defaultValue={role.startDate ? new Date(role.startDate).toISOString().split('T')[0] : ''}
                                        className="input"
                                    />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    <label htmlFor="endDate" style={{ fontSize: "0.875rem", fontWeight: 500 }}>End Date</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        id="endDate"
                                        defaultValue={role.endDate ? new Date(role.endDate).toISOString().split('T')[0] : ''}
                                        className="input"
                                    />
                                </div>
                            </div>

                            {/* Document */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <label htmlFor="appointmentDocUrl" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Appointment Doc URL</label>
                                <input
                                    type="text"
                                    name="appointmentDocUrl"
                                    id="appointmentDocUrl"
                                    defaultValue={role.appointmentDocUrl || ''}
                                    placeholder="https://drive.google.com/..."
                                    className="input"
                                />
                                {state?.errors?.appointmentDocUrl && <p style={{ color: "red", fontSize: "0.75rem" }}>{state.errors.appointmentDocUrl[0]}</p>}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <label htmlFor="resignationDocUrl" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Resignation Doc URL</label>
                                <input
                                    type="text"
                                    name="resignationDocUrl"
                                    id="resignationDocUrl"
                                    defaultValue={role.resignationDocUrl === "Missing document" ? "" : (role.resignationDocUrl || '')}
                                    placeholder="https://drive.google.com/..."
                                    className="input"
                                />
                                {state?.errors?.resignationDocUrl && <p style={{ color: "red", fontSize: "0.75rem" }}>{state.errors.resignationDocUrl[0]}</p>}
                            </div>

                            {/* Toggles */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", marginTop: "0.5rem" }}>
                                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.875rem", cursor: "pointer" }}>
                                    <input type="checkbox" name="votingRights" defaultChecked={role.votingRights} />
                                    Voting Rights
                                </label>
                                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.875rem", cursor: "pointer" }}>
                                    <input type="checkbox" name="isCompensated" defaultChecked={role.isCompensated} />
                                    Compensated
                                </label>
                            </div>

                            {/* Actions */}
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
                                    className="btn btn-primary"
                                >
                                    Save Changes
                                </button>
                            </div>
                            {state?.message && !state.success && <p style={{ color: "red", textAlign: "center", fontSize: "0.875rem" }}>{state.message}</p>}
                        </form>

                        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                            <form action={async () => {
                                if (confirm("Are you sure you want to completely delete this role? This cannot be undone.")) {
                                    await deleteRole(role.id, role.personId, role.entityId)
                                    setIsOpen(false)
                                }
                            }}>
                                <button
                                    type="submit"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "red",
                                        fontSize: "0.875rem",
                                        textDecoration: "underline",
                                        cursor: "pointer",
                                        padding: 0
                                    }}
                                >
                                    Delete this role entry entirely
                                </button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

