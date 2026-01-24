'use client'

import { useActionState } from 'react'
import { createRole } from '@/server/actions/roles'

export default function AddRoleForm({ personId, entities }: { personId: string, entities: { id: string, legalName: string, entityType: string }[] }) {
    const createRoleWithId = createRole.bind(null, personId)
    const [state, formAction] = useActionState(createRoleWithId, { message: '', errors: {} })

    return (
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                <label htmlFor="title" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Title</label>
                <input type="text" name="title" id="title" placeholder="e.g. Director" style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", color: "black", width: "100%" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="roleType" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Role Type</label>
                <select name="roleType" id="roleType" style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", color: "black", width: "100%" }}>
                    <option value="DIRECTOR">Director</option>
                    <option value="OFFICER">Officer</option>
                    <option value="TRUSTEE">Trustee</option>
                    <option value="KEY_EMPLOYEE">Key Employee</option>
                </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="startDate" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Start Date</label>
                <input type="date" name="startDate" id="startDate" style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", color: "black", width: "100%" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="appointmentDocUrl" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Appointment Document URL</label>
                <input
                    type="url"
                    name="appointmentDocUrl"
                    id="appointmentDocUrl"
                    placeholder="https://drive.google.com/..."
                    required
                    style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--input)", color: "black", width: "100%" }}
                />

                {state?.errors?.appointmentDocUrl && <p style={{ color: "red", fontSize: "0.75rem" }}>{state.errors.appointmentDocUrl[0]}</p>}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.875rem" }}>
                    <input type="checkbox" name="votingRights" defaultChecked />
                    Voting Rights
                </label>
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.875rem" }}>
                    <input type="checkbox" name="isCompensated" />
                    Compensated
                </label>
            </div>

            <div style={{ marginTop: "0.5rem" }}>
                <button type="submit" style={{ width: "100%", padding: "0.5rem 1rem", background: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "var(--radius)", border: "none", fontWeight: 500, cursor: "pointer" }}>
                    Add Role
                </button>
                {state?.message && <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.875rem" }}>{state.message}</span>}
            </div>
        </form>
    )
}
