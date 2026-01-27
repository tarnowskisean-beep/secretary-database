
import { getEntity, getEntities } from '@/server/actions/entities'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AddTransactionForm from '@/components/AddTransactionForm'
import EntityReportButton from '@/components/EntityReportButton'

export const dynamic = 'force-dynamic'

export default async function EntityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const entity = await getEntity(id)
    const allEntities = await getEntities()

    if (!entity) {
        notFound()
    }

    // Identify if this entity is part of a corporate group
    const isSubsidiary = entity.owners.length > 0
    const isParent = entity.subsidiaries.length > 0
    const boardMembers = entity.roles.filter(r => r.roleType === 'DIRECTOR' || r.roleType === 'TRUSTEE')

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem" }}>
                <Link href="/entities" style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back to Entities
                </Link>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                        {entity.logoUrl ? (
                            <img src={entity.logoUrl} alt="Logo" style={{ width: "64px", height: "64px", objectFit: "contain", borderRadius: "var(--radius)", background: "white", padding: "0.5rem", border: "1px solid var(--border)" }} />
                        ) : (
                            <div style={{ width: "64px", height: "64px", borderRadius: "var(--radius)", background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🏢</div>
                        )}
                        <div>
                            <h1 style={{ margin: 0, fontSize: "2rem" }}>{entity.legalName}</h1>
                            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                                <span className="badge badge-secondary">{entity.entityType}</span>
                                {isSubsidiary && <span className="badge badge-warning">Subsidiary</span>}
                                {isParent && <span className="badge badge-primary">Parent Company</span>}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <EntityReportButton entityId={entity.id} />
                        <Link href={`/entities/${entity.id}/edit`} className="btn btn-secondary">
                            Edit Entity
                        </Link>
                    </div>
                </div>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", alignItems: "start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

                    {/* Corporate Structure Section */}
                    <div className="card">
                        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
                            Corporate Structure
                        </h2>

                        {!isSubsidiary && !isParent && (
                            <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted-foreground)", background: "var(--muted)", borderRadius: "var(--radius)" }}>
                                Independent entity. No parent or subsidiary relationships recorded.
                            </div>
                        )}

                        {isSubsidiary && (
                            <div style={{ marginBottom: "1.5rem" }}>
                                <span style={{ textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "bold", color: "var(--muted-foreground)", marginBottom: "0.5rem", display: "block" }}>Owners (Parents)</span>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {entity.owners.map(rel => (
                                        <div key={rel.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                                            <div style={{ background: "var(--muted)", padding: "0.5rem", borderRadius: "0.5rem" }}>⬆️</div>
                                            <div style={{ flex: 1 }}>
                                                {rel.ownerEntity ? (
                                                    <Link href={`/entities/${rel.ownerEntity.id}`} style={{ fontWeight: 600, fontSize: "1.1rem" }} className="hover:underline">
                                                        {rel.ownerEntity.legalName}
                                                    </Link>
                                                ) : rel.ownerPerson ? (
                                                    <Link href={`/people/${rel.ownerPerson.id}`} style={{ fontWeight: 600, fontSize: "1.1rem" }} className="hover:underline">
                                                        {rel.ownerPerson.firstName} {rel.ownerPerson.lastName}
                                                    </Link>
                                                ) : (
                                                    <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>Unknown Owner</span>
                                                )}

                                                <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                                                    Owns <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{rel.percentage}%</span>
                                                </div>
                                            </div>
                                            {entity.parentAppointsGoverningBody && (
                                                <span className="badge badge-warning" style={{ marginLeft: "auto" }}>Appoints Board</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isParent && (
                            <div>
                                <span style={{ textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "bold", color: "var(--muted-foreground)", marginBottom: "0.5rem", display: "block" }}>Subsidiaries (Owned)</span>
                                <div style={{ display: "grid", gap: "0.75rem" }}>
                                    {entity.subsidiaries.map(rel => (
                                        <div key={rel.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                                            <div style={{ background: "var(--muted)", padding: "0.5rem", borderRadius: "0.5rem" }}>⬇️</div>
                                            <div style={{ flex: 1 }}>
                                                <Link href={`/entities/${rel.childEntity.id}`} style={{ fontWeight: 600 }} className="hover:underline">
                                                    {rel.childEntity.legalName}
                                                </Link>
                                                <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                                                    {rel.childEntity.entityType} • Owned {rel.percentage}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Schedule R Financials (Part V) */}
                    <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                            <div>
                                <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Financial Transactions</h2>
                                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>Schedule R Part V (Transactions &gt;$50k)</p>
                            </div>
                            <AddTransactionForm currentEntityId={entity.id} allEntities={allEntities} />
                        </div>

                        {entity.transactionsOut.length === 0 && entity.transactionsIn.length === 0 ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted-foreground)" }}>
                                No reportable transactions found.
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Counterparty</th>
                                            <th>Description</th>
                                            <th style={{ textAlign: "right" }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entity.transactionsOut.map(t => (
                                            <tr key={t.id}>
                                                <td><span className="badge badge-secondary">{t.type.replace('_', ' ')}</span></td>
                                                <td>
                                                    <span style={{ color: "var(--muted-foreground)", fontSize: "0.75rem" }}>TO → </span>
                                                    <Link href={`/entities/${t.toEntity.id}`} className="hover:underline" style={{ fontWeight: 500 }}>
                                                        {t.toEntity.legalName}
                                                    </Link>
                                                </td>
                                                <td style={{ color: "var(--muted-foreground)" }}>{t.description}</td>
                                                <td style={{ textAlign: "right", fontWeight: 600 }}>-${t.amount?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {entity.transactionsIn.map(t => (
                                            <tr key={t.id}>
                                                <td><span className="badge badge-secondary">{t.type.replace('_', ' ')}</span></td>
                                                <td>
                                                    <span style={{ color: "var(--muted-foreground)", fontSize: "0.75rem" }}>FROM ← </span>
                                                    <Link href={`/entities/${t.fromEntity.id}`} className="hover:underline" style={{ fontWeight: 500 }}>
                                                        {t.fromEntity.legalName}
                                                    </Link>
                                                </td>
                                                <td style={{ color: "var(--muted-foreground)" }}>{t.description}</td>
                                                <td style={{ textAlign: "right", fontWeight: 600, color: "var(--success)" }}>+${t.amount?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Board Composition */}
                    <div className="card">
                        <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Governing Body</h3>
                        {boardMembers.length === 0 ? (
                            <p style={{ color: "var(--muted-foreground)" }}>No active board members.</p>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Title</th>
                                            <th>Voting</th>
                                            <th>Documents</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {boardMembers.map(role => (
                                            <tr key={role.id}>
                                                <td>
                                                    <Link href={`/people/${role.person.id}`} style={{ fontWeight: 500 }} className="hover:underline">
                                                        {role.person.firstName} {role.person.lastName}
                                                    </Link>
                                                </td>
                                                <td>{role.title}</td>
                                                <td>{role.votingRights ? <span className="badge badge-success" style={{ background: "#dcfce7", color: "#166534" }}>Yes</span> : <span className="badge badge-secondary">No</span>}</td>
                                                <td>
                                                    {role.appointmentDocUrl && (
                                                        <a href={role.appointmentDocUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline", fontSize: "0.875rem" }}>
                                                            View Doc
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <aside style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "2rem" }}>
                    <div className="card">
                        <h3 style={{ fontSize: "1rem", marginBottom: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>Entity Details</h3>
                        <dl style={{ display: "grid", gap: "1rem", fontSize: "0.875rem" }}>
                            <div>
                                <dt style={{ color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>EIN</dt>
                                <dd style={{ fontFamily: "monospace", fontSize: "1rem" }}>{entity.ein || "N/A"}</dd>
                            </div>
                            <div>
                                <dt style={{ color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>State of Inc.</dt>
                                <dd>{entity.stateOfIncorporation || "N/A"}</dd>
                            </div>
                            <div>
                                <dt style={{ color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>Fiscal Year End</dt>
                                <dd>{entity.fiscalYearEnd || "N/A"}</dd>
                            </div>
                            <div>
                                <dt style={{ color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>Tax Classification</dt>
                                <dd><span className="badge badge-outline">{entity.taxClassification || "N/A"}</span></dd>
                            </div>

                            {/* Schedule R Fields */}
                            {(entity.owners.length > 0 || entity.supportingOrgType) && (
                                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                                    <div style={{ marginBottom: "0.5rem", fontWeight: 600, color: "var(--foreground)" }}>Schedule R Data</div>

                                    {entity.owners.length > 0 && (
                                        <div style={{ marginBottom: "0.5rem" }}>
                                            <dt style={{ color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>Owned By</dt>
                                            <dd>
                                                <ul style={{ paddingLeft: "1rem", margin: 0 }}>
                                                    {entity.owners.map(o => (
                                                        <li key={o.id}>
                                                            {o.ownerEntity ? o.ownerEntity.legalName : (o.ownerPerson ? `${o.ownerPerson.firstName} ${o.ownerPerson.lastName}` : 'Unknown')}
                                                            : <strong>{o.percentage}%</strong>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </dd>
                                        </div>
                                    )}

                                    {entity.supportingOrgType && (
                                        <div>
                                            <dt style={{ color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>Support Type</dt>
                                            <dd className="badge badge-warning" style={{ width: "100%", justifyContent: "center" }}>{entity.supportingOrgType}</dd>
                                        </div>
                                    )}
                                </div>
                            )}
                        </dl>
                    </div>
                </aside>
            </div>
        </div>
    )
}
