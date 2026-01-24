'use client'

import { updateEntity } from '@/server/actions/entities'
import { useActionState, useState } from 'react'
import Link from 'next/link'

type OwnerState = {
    id: string
    type: 'ENTITY' | 'PERSON'
    percentage: number
}

type Entity = {
    id: string
    legalName: string
    ein: string | null
    entityType: string
    taxClassification: string | null
    stateOfIncorporation: string | null
    fiscalYearEnd: string | null
    logoUrl: string | null
    parentAppointsGoverningBody?: boolean
    supportingOrgType?: string | null
    owners?: {
        ownerEntityId: string | null,
        ownerPersonId: string | null,
        percentage: number
    }[]
}

type Person = {
    id: string
    firstName: string
    lastName: string
}

export default function EditEntityForm({ entity, allEntities, allPeople }: { entity: Entity, allEntities: Entity[], allPeople: Person[] }) {
    const updateAction = updateEntity.bind(null, entity.id)
    const [state, formAction] = useActionState(updateAction, { message: '', errors: {} })

    const [owners, setOwners] = useState<OwnerState[]>(
        entity.owners ? entity.owners.map(o => ({
            id: o.ownerEntityId || o.ownerPersonId || '',
            type: o.ownerPersonId ? 'PERSON' : 'ENTITY',
            percentage: o.percentage
        })) : []
    )

    const addOwner = () => {
        setOwners([...owners, { id: '', type: 'ENTITY', percentage: 0 }])
    }

    const removeOwner = (index: number) => {
        setOwners(owners.filter((_, i) => i !== index))
    }

    const updateOwner = (index: number, field: keyof OwnerState, value: string | number) => {
        const newOwners = [...owners]
        // @ts-expect-error - dynamic assignment
        newOwners[index][field] = value
        // Reset ID if type changes to prevent invalid ID referencing wrong collection
        if (field === 'type') {
            newOwners[index].id = ''
        }
        setOwners(newOwners)
    }

    return (
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <input type="hidden" name="owners" value={JSON.stringify(owners)} />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="legalName" style={{ fontWeight: 500 }}>Legal Name</label>
                <input
                    type="text"
                    id="legalName"
                    name="legalName"
                    defaultValue={entity.legalName}
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
                    defaultValue={entity.ein || ''}
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
                    defaultValue={entity.logoUrl || ''}
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
                    defaultValue={entity.entityType}
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
                    defaultValue={entity.stateOfIncorporation || ''}
                    maxLength={2}
                    className="input"
                />
            </div>

            <div style={{ border: "1px solid var(--border)", padding: "1rem", borderRadius: "var(--radius)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Ownership Structure</h3>
                    <button type="button" onClick={addOwner} className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>+ Add Owner</button>
                </div>

                {owners.length === 0 ? (
                    <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", fontStyle: "italic" }}>No owners (Independent Entity)</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {owners.map((owner, index) => (
                            <div key={index} style={{ display: "flex", gap: "0.5rem", alignItems: "end" }}>
                                <div style={{ width: "100px" }}>
                                    <label style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>Type</label>
                                    <select
                                        value={owner.type}
                                        onChange={(e) => updateOwner(index, 'type', e.target.value)}
                                        className="input"
                                        style={{ width: "100%" }}
                                    >
                                        <option value="ENTITY">Entity</option>
                                        <option value="PERSON">Person</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>Owner</label>
                                    <select
                                        value={owner.id}
                                        onChange={(e) => updateOwner(index, 'id', e.target.value)}
                                        className="input"
                                        style={{ width: "100%" }}
                                    >
                                        <option value="">Select Owner...</option>
                                        {owner.type === 'ENTITY' ? (
                                            allEntities
                                                .filter(e => e.id !== entity.id)
                                                .map(e => (
                                                    <option key={e.id} value={e.id}>{e.legalName}</option>
                                                ))
                                        ) : (
                                            allPeople.map(p => (
                                                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div style={{ width: "80px" }}>
                                    <label style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>%</label>
                                    <input
                                        type="number"
                                        value={owner.percentage}
                                        onChange={(e) => updateOwner(index, 'percentage', parseFloat(e.target.value))}
                                        className="input"
                                        min="0"
                                        max="100"
                                        style={{ width: "100%" }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeOwner(index)}
                                    style={{ background: "none", border: "none", color: "red", cursor: "pointer", padding: "0.5rem", marginBottom: "2px" }}
                                    aria-label="Remove owner"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="supportingOrgType" style={{ fontWeight: 500 }}>Supporting Org Type</label>
                <select
                    id="supportingOrgType"
                    name="supportingOrgType"
                    defaultValue={entity.supportingOrgType || ''}
                    className="input"
                >
                    <option value="">(None)</option>
                    <option value="Type I">Type I</option>
                    <option value="Type II">Type II</option>
                    <option value="Type III FI">Type III FI (Functionally Integrated)</option>
                    <option value="Type III NFI">Type III NFI (Non-FI)</option>
                </select>
            </div>

            <div style={{ marginTop: "-0.5rem", fontSize: "0.75rem", color: "var(--muted-foreground)", background: "var(--muted)", padding: "0.75rem", borderRadius: "var(--radius)" }}>
                <strong>Cheat Sheet:</strong>
                <ul style={{ paddingLeft: "1rem", marginTop: "0.25rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <li><strong>Type I:</strong> Controlled by the parent (like a subsidiary).</li>
                    <li><strong>Type II:</strong> Controlled by the same people as the parent (brother-sister).</li>
                    <li><strong>Type III FI:</strong> &quot;Functionally Integrated&quot; - performs essential operations for the parent.</li>
                    <li><strong>Type III NFI:</strong> &quot;Non-Functionally Integrated&quot; - primarily provides funding; has stricter distribution rules.</li>
                </ul>
            </div>

            <div style={{ padding: "1rem", borderRadius: "var(--radius)", background: "var(--muted)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "start", gap: "0.75rem" }}>
                    <input
                        type="checkbox"
                        id="parentAppointsGoverningBody"
                        name="parentAppointsGoverningBody"
                        defaultChecked={entity.parentAppointsGoverningBody || false}
                        style={{ marginTop: "4px" }}
                    />
                    <div>
                        <label htmlFor="parentAppointsGoverningBody" style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
                            Parent Appoints Governing Body?
                        </label>
                        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", lineHeight: "1.4" }}>
                            Check this if a Parent Entity has the power to appoint or remove a majority of this entity&apos;s board.
                            This establishes a &quot;Subsidiary&quot; relationship independent of tax ownership.
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
                <Link href="/entities" className="btn btn-secondary" style={{ flex: 1, textAlign: "center", padding: "0.75rem" }}>
                    Cancel
                </Link>
                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: "1rem", padding: "0.75rem" }}
                >
                    Save Changes
                </button>
            </div>

            {state?.message && <p style={{ color: "red", textAlign: "center" }}>{state.message}</p>}
        </form>
    )
}
