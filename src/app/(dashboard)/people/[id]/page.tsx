
import { prisma } from '@/lib/db'
import { getEntities } from '@/server/actions/entities'
import { restoreRole } from '@/server/actions/roles'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function getPerson(id: string) {
    return await prisma.person.findUnique({
        where: { id },
        include: {
            roles: {
                include: {
                    entity: {
                        include: { owners: true }
                    }
                },
                orderBy: { startDate: 'desc' }
            },
            relationshipsAsPerson1: {
                include: { person2: true }
            },
            relationshipsAsPerson2: {
                include: { person1: true }
            },
            nameChanges: {
                orderBy: { changeDate: 'desc' }
            },
            attachments: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })
}

import PersonReportButton from '@/components/PersonReportButton'
import PersonDeleteButton from '@/components/PersonDeleteButton'
import AddRelationshipForm from '@/components/AddRelationshipForm'
import AddRoleForm from '@/components/AddRoleForm'
import EndRoleDialog from '@/components/EndRoleDialog'
import PersonNameHeader from '@/components/PersonNameHeader'
import NameHistoryList from '@/components/NameHistoryList'
import { getPeople } from '@/server/actions/people'
import AttachmentsCard from '@/components/AttachmentsCard'

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // ... same content ...
    // (Keeping the rest of the file structure intact, just modifying getPerson above and RolesTable below)
    const { id } = await params
    const person = await getPerson(id)
    const entities = await getEntities()
    const allPeople = await getPeople()

    if (!person) {
        notFound()
    }

    const today = new Date()
    const activeRoles = person.roles.filter(r => !r.endDate || r.endDate > today)
    const pastRoles = person.roles.filter(r => r.endDate && r.endDate <= today)

    // Merge relationships
    const relationships = [
        ...person.relationshipsAsPerson1.map(r => ({ ...r, otherPerson: r.person2, isPrimary: true })),
        ...person.relationshipsAsPerson2.map(r => ({ ...r, otherPerson: r.person1, isPrimary: false }))
    ]

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem" }}>
                <Link href="/people" style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back to People
                </Link>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <PersonNameHeader
                        personId={person.id}
                        firstName={person.firstName}
                        lastName={person.lastName}
                        internalId={person.internalId}
                    />
                    <PersonReportButton personId={person.id} />
                </div>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", alignItems: "start" }}>

                {/* Main Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

                    {/* Active Roles */}
                    <div className="card">
                        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
                            Board Service
                        </h2>
                        {activeRoles.length === 0 ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted-foreground)", background: "var(--muted)", borderRadius: "var(--radius)" }}>
                                No active board roles.
                            </div>
                        ) : (
                            <RolesTable roles={activeRoles} personId={person.id} isActive={true} />
                        )}
                    </div>

                    {/* Relationships */}
                    <div className="card">
                        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
                            Relationships & Conflicts
                        </h2>
                        {relationships.length === 0 ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted-foreground)", fontStyle: "italic" }}>
                                No known relationships recorded.
                            </div>
                        ) : (
                            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                                {relationships.map(rel => (
                                    <div key={rel.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)" }}>
                                        <div style={{
                                            width: "36px", height: "36px", borderRadius: "50%",
                                            background: rel.type === 'FAMILY' ? "var(--accent)" : "var(--secondary)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: rel.type === 'FAMILY' ? "white" : "var(--foreground)",
                                            fontSize: "1rem"
                                        }}>
                                            {rel.type === 'FAMILY' ? "🏠" : "💼"}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{rel.otherPerson.firstName} {rel.otherPerson.lastName}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                                                {rel.type} • {rel.details || "No details"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past Service */}
                    {pastRoles.length > 0 && (
                        <div className="card">
                            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem", color: "var(--muted-foreground)" }}>
                                Past Service (Historical)
                            </h2>
                            <RolesTable roles={pastRoles} personId={person.id} isActive={false} />
                        </div>
                    )}

                    {/* Attachments Section */}
                    <AttachmentsCard attachments={person.attachments} personId={person.id} />
                </div>

                {/* Sidebar Column */}
                <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "sticky", top: "2rem" }}>

                    <div className="card">
                        <NameHistoryList history={person.nameChanges} />
                    </div>

                    <div className="card" style={{ background: "var(--muted)" }}>
                        <h3 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: "1rem" }}>
                            Quick Actions
                        </h3>

                        <div style={{ marginBottom: "1.5rem" }}>
                            <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem", fontWeight: 600 }}>Add Board Role</h4>
                            <div style={{ background: "var(--background)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                                <AddRoleForm personId={person.id} entities={entities} />
                            </div>
                        </div>

                        <div>
                            <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem", fontWeight: 600 }}>Add Relationship</h4>
                            <div style={{ background: "var(--background)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                                <AddRelationshipForm currentPersonId={person.id} allPeople={allPeople} />
                            </div>
                        </div>

                        <PersonDeleteButton personId={person.id} />
                    </div>

                </aside>

            </div>
        </div>
    )
}

// Client Component for the form to handle state
function RolesTable({ roles, personId, isActive }: { roles: { id: string, title: string, roleType: string, votingRights: boolean, isCompensated: boolean, appointmentDocUrl?: string | null, resignationDocUrl?: string | null, endDate?: Date | null, entity: { id: string, legalName: string, owners: { percentage: number }[] } }[], personId: string, isActive: boolean }) {
    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Entity</th>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Voting</th>
                        <th>Comp</th>
                        <th>Docs</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {roles.map((role) => {
                        const isControlled = role.entity.owners.some(o => o.percentage > 50)
                        return (
                            <tr key={role.id} style={{ opacity: isActive ? 1 : 0.7 }}>
                                <td>
                                    <Link href={`/entities/${role.entity.id}`} className="hover:underline" style={{ fontWeight: 500 }}>
                                        {role.entity.legalName}
                                    </Link>
                                    {isControlled && (
                                        <div style={{ fontSize: "0.65rem", marginTop: "0.2rem" }}>
                                            <span className="badge badge-warning">Controlled</span>
                                        </div>
                                    )}
                                </td>
                                <td>{role.title}</td>
                                <td><span className="badge badge-secondary">{role.roleType}</span></td>
                                <td>{role.votingRights ? <span className="badge badge-success" style={{ background: '#dcfce7', color: '#166534' }}>Yes</span> : <span className="badge badge-outline">No</span>}</td>
                                <td>{role.isCompensated ? "Yes" : "No"}</td>
                                <td>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.75rem" }}>
                                        {role.appointmentDocUrl && (
                                            <a href={role.appointmentDocUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>
                                                Appt.
                                            </a>
                                        )}
                                        {role.resignationDocUrl && (
                                            <a href={role.resignationDocUrl} target="_blank" rel="noopener noreferrer" style={{ color: "red", textDecoration: "underline" }}>
                                                Resig.
                                            </a>
                                        )}
                                        {!role.appointmentDocUrl && !role.resignationDocUrl && <span style={{ color: "var(--muted-foreground)" }}>-</span>}
                                    </div>
                                </td>
                                <td>
                                    {isActive ? (
                                        <EndRoleDialog roleId={role.id} personId={personId} />
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                            <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                                                Ended {role.endDate ? new Date(role.endDate).toLocaleDateString() : 'Unknown'}
                                            </span>
                                            <form action={async () => {
                                                'use server'
                                                await restoreRole(role.id, personId)
                                            }}>
                                                <button type="submit" style={{ fontSize: "0.75rem", color: "blue", background: "none", border: "none", textDecoration: "underline", cursor: "pointer", padding: 0 }}>
                                                    Restore
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div >
    )
}
