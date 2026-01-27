'use client'

import { updateRole, deleteRole } from '@/server/actions/roles'
import { useState, useActionState, useEffect } from 'react'

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
        personId: string,
        entityId: string
    }
}) {
    const [isOpen, setIsOpen] = useState(false)
    const updateRoleWithId = updateRole.bind(null, role.id)
    const [state, formAction] = useActionState(updateRoleWithId, { message: '', errors: {} })

    // Auto-close on success
    useEffect(() => {
        if (state?.success && isOpen) {
            setIsOpen(false)
        }
    }, [state?.success, isOpen])

    // Reset state when opening/closing? (Optional, but good practice)

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-secondary"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", height: "auto" }}
            >
                Edit
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

                    {/* Title */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label htmlFor="title" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Title</label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            defaultValue={role.title}
                            className="input"
                            required
                        />
                        {state?.errors?.title && <p style={{ color: "red", fontSize: "0.75rem" }}>{state.errors.title[0]}</p>}
                    </div>

                    {/* Role Type */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label htmlFor="roleType" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Role Type</label>
                        <select
                            name="roleType"
                            id="roleType"
                            defaultValue={role.roleType}
                            className="input"
                        >
                            <option value="DIRECTOR">Director</option>
                            <option value="OFFICER">Officer</option>
                            <option value="TRUSTEE">Trustee</option>
                            <option value="KEY_EMPLOYEE">Key Employee</option>
                        </select>
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
                            type="url"
                            name="appointmentDocUrl"
                            id="appointmentDocUrl"
                            defaultValue={role.appointmentDocUrl || ''}
                            placeholder="https://drive.google.com/..."
                            className="input"
                        />
                        {state?.errors?.appointmentDocUrl && <p style={{ color: "red", fontSize: "0.75rem" }}>{state.errors.appointmentDocUrl[0]}</p>}
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
        </div>
    )
}
