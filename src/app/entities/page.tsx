
import { getEntities, getUniqueStates } from '@/server/actions/entities'
import Link from 'next/link'
import EntityFilter from '@/components/EntityFilter'

export default async function EntitiesPage({ searchParams }: { searchParams: Promise<{ type?: string, state?: string }> }) {
    const filters = await searchParams
    const [entities, states] = await Promise.all([
        getEntities(filters),
        getUniqueStates()
    ])

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h1>Entities</h1>
                    <Link
                        href="/entities/new"
                        className="btn btn-primary"
                        style={{ textDecoration: "none" }}
                    >
                        Add Entity
                    </Link>
                </div>
                <EntityFilter states={states} />
            </header>

            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                {entities.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", padding: "3rem", textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--border)", borderRadius: "var(--radius)" }}>
                        No entities found.
                    </div>
                ) : (
                    entities.map((entity) => (
                        <div key={entity.id} className="card">
                            <h3 style={{ marginBottom: "0.25rem" }}>
                                <Link href={`/entities/${entity.id}`} style={{ textDecoration: "none", color: "inherit" }} className="hover:underline">
                                    {entity.legalName}
                                </Link>
                            </h3>
                            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                                <span className="badge" style={{ background: "var(--muted)", color: "var(--secondary-foreground)" }}>
                                    {entity.entityType}
                                </span>
                                {entity.stateOfIncorporation && (
                                    <span className="badge" style={{ background: "var(--muted)", color: "var(--secondary-foreground)" }}>
                                        {entity.stateOfIncorporation}
                                    </span>
                                )}
                            </div>
                            <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                                EIN: <span style={{ fontFamily: "monospace" }}>{entity.ein || "N/A"}</span>
                            </div>
                            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                                <Link
                                    href={`/entities/${entity.id}/edit`}
                                    className="btn btn-secondary"
                                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", height: "auto" }}
                                >
                                    Edit
                                </Link>
                                <Link
                                    href={`/entities/${entity.id}`}
                                    className="btn btn-primary"
                                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", height: "auto", marginLeft: "0.5rem" }}
                                >
                                    View
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
