'use client'

import { useActionState, useState, useRef } from 'react'
import { createRole } from '@/server/actions/roles'

export default function AddRoleForm({ personId, entities }: { personId: string, entities: { id: string, legalName: string, entityType: string }[] }) {
    const createRoleWithId = createRole.bind(null, personId)
    const [state, formAction] = useActionState(createRoleWithId, { message: '', errors: {} })

    // State to track if we are in the "warning" phase
    const [showDocWarning, setShowDocWarning] = useState(false)
    const docInputRef = useRef<HTMLInputElement>(null)

    // Dynamic Title State
    const [roleType, setRoleType] = useState('DIRECTOR')
    const [officerTitles, setOfficerTitles] = useState<string[]>([])

    // Officer title options
    const OFFICER_OPTIONS = ["President", "Chairman", "CEO", "Treasurer", "Secretary", "Vice President", "General Counsel"]

    const handleOfficerTitleToggle = (title: string) => {
        setOfficerTitles(prev =>
            prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
        )
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        const docUrl = docInputRef.current?.value

        // If no URL and we haven't warned yet, stop and warn
        if (!docUrl && !showDocWarning) {
            e.preventDefault()
            setShowDocWarning(true)
            return
        }

        // Otherwise let it submit naturally via action
    }

    // Reset warning if user starts typing
    const handleDocChange = () => {
        if (showDocWarning) setShowDocWarning(false)
    }

    return (
        <form action={formAction} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="entityId" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Entity</label>
                <select name="entityId" id="entityId" style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", color: "black", width: "100%" }}>
                    <option value="">Select Entity...</option>
                    {entities.map(e => (
                        <option key={e.id} value={e.id}>{e.legalName} ({e.entityType})</option>
                    ))}
                </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="roleType" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Role Type</label>
                <select
                    name="roleType"
                    id="roleType"
                    value={roleType}
                    onChange={(e) => {
                        setRoleType(e.target.value)
                        // Reset officer titles if switching away from OFFICER
                        if (e.target.value !== 'OFFICER') {
                            setOfficerTitles([])
                        }
                    }}
                    style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", color: "black", width: "100%" }}
                >
                    <option value="DIRECTOR">Director</option>
                    <option value="OFFICER">Officer</option>
                    <option value="TRUSTEE">Trustee</option>
                    <option value="KEY_EMPLOYEE">Key Employee</option>
                </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="title" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Title</label>

                {roleType === 'DIRECTOR' && (
                    <>
                        <input type="text" id="title-display" value="Director" readOnly style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", background: "#f1f5f9", color: "#64748b", width: "100%", cursor: "not-allowed" }} />
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
                        {/* The actual value sent back to the server action */}
                        <input type="hidden" name="title" value={officerTitles.join(', ')} />
                    </div>
                )}

                {(roleType === 'TRUSTEE' || roleType === 'KEY_EMPLOYEE') && (
                    <input type="text" name="title" id="title" placeholder={roleType === 'TRUSTEE' ? "e.g. Lead Trustee" : "e.g. VP of Communications"} style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", color: "black", width: "100%" }} />
                )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="startDate" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Start Date</label>
                <input type="date" name="startDate" id="startDate" style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", color: "black", width: "100%" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="appointmentDocUrl" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Appointment Document URL</label>
                <input
                    ref={docInputRef}
                    onChange={handleDocChange}
                    type="url"
                    name="appointmentDocUrl"
                    id="appointmentDocUrl"
                    placeholder="https://drive.google.com/..."
                    // required attribute removed
                    style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", color: "black", width: "100%", borderColor: showDocWarning ? "var(--warning)" : "var(--input)" }}
                />

                {showDocWarning && (
                    <div style={{ fontSize: "0.75rem", color: "var(--warning)", background: "rgba(245, 158, 11, 0.1)", padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--warning)" }}>
                        ⚠️ No document attached. This is not recommended. Click <strong>Add Role</strong> again to confirm.
                    </div>
                )}

                {state?.errors?.appointmentDocUrl && <p style={{ color: "red", fontSize: "0.75rem" }}>{state.errors.appointmentDocUrl[0]}</p>}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.875rem", cursor: (roleType === 'OFFICER' || roleType === 'KEY_EMPLOYEE') ? "not-allowed" : "pointer", opacity: (roleType === 'OFFICER' || roleType === 'KEY_EMPLOYEE') ? 0.5 : 1 }}>
                    <input
                        type="checkbox"
                        name="votingRights"
                        checked={(roleType === 'OFFICER' || roleType === 'KEY_EMPLOYEE') ? false : undefined}
                        defaultChecked={(roleType !== 'OFFICER' && roleType !== 'KEY_EMPLOYEE')}
                        disabled={roleType === 'OFFICER' || roleType === 'KEY_EMPLOYEE'}
                    />
                    Voting Rights
                </label>
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.875rem" }}>
                    <input type="checkbox" name="isCompensated" />
                    Compensated
                </label>
            </div>

            <div style={{ marginTop: "0.5rem" }}>
                <button type="submit" style={{ width: "100%", padding: "0.5rem 1rem", background: showDocWarning ? "var(--warning)" : "var(--primary)", color: showDocWarning ? "black" : "var(--primary-foreground)", borderRadius: "var(--radius)", border: "none", fontWeight: 500, cursor: "pointer" }}>
                    {showDocWarning ? "Confirm Without Document" : "Add Role"}
                </button>
                {state?.message && <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.875rem" }}>{state.message}</span>}
            </div>
        </form>
    )
}
