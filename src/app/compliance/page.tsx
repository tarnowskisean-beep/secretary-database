
import { detectOverlaps } from '@/server/actions/analysis'
import { analyzeRisks, getScheduleRSummary } from '@/server/actions/risk'
import { prisma } from '@/lib/db'
import RiskCard from '@/components/RiskCard'
import RiskFilters from '@/components/RiskFilters'
import ScheduleRDetailsDialog from '@/components/ScheduleRDetailsDialog'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

export default async function CompliancePage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    // 1. Fetch Entities & People for Filters
    const allEntities = await prisma.entity.findMany({
        select: { id: true, legalName: true },
        orderBy: { legalName: 'asc' }
    })

    const allPeople = await prisma.person.findMany({
        select: { id: true, firstName: true, lastName: true },
        orderBy: { lastName: 'asc' }
    })

    // 2. Parse URL Params
    const searchParams = await props.searchParams

    // Date Filters
    const today = new Date().toISOString().split('T')[0]
    const start = typeof searchParams.start === 'string' ? searchParams.start : today
    const end = typeof searchParams.end === 'string' ? searchParams.end : today

    const typeFilter = typeof searchParams.type === 'string' ? searchParams.type : null
    const entityFilter = typeof searchParams.entityId === 'string' ? searchParams.entityId : null
    const personFilter = typeof searchParams.personId === 'string' ? searchParams.personId : null

    // 3. Fetch Core Data (Overlaps & Risks & Stats)
    let overlaps = await detectOverlaps(start, end)
    let risks = await analyzeRisks(overlaps)

    // Pass date filters to summary (convert string to Date object if needed, or rely on Prisma string handling)
    // Prisma prefers Date objects for date types usually
    const scheduleRStats = await getScheduleRSummary(
        start ? new Date(start) : undefined,
        end ? new Date(end) : undefined
    )

    // 4. Apply Risk Filters
    if (typeFilter) {
        risks = risks.filter(r => r.type === typeFilter)
    }

    if (entityFilter) {
        risks = risks.filter(r =>
            r.entity1Id === entityFilter ||
            r.entity2Id === entityFilter
        )
    }

    if (personFilter) {
        risks = risks.filter(r => r.personId === personFilter)
    }

    // Filter Overlaps based on selection
    if (entityFilter) {
        overlaps = overlaps.filter(o =>
            o.entity1.id === entityFilter ||
            o.entity2.id === entityFilter
        )
    }

    if (personFilter) {
        overlaps = overlaps.filter(o =>
            o.sharedPeople.some(p => p.id === personFilter)
        )
    }

    // 5. Server Action for Date Filter Update
    async function updateFilters(formData: FormData) {
        'use server'
        const start = formData.get('start')
        const end = formData.get('end')

        const p = new URLSearchParams()
        if (start) p.set('start', start.toString())
        if (end) p.set('end', end.toString())

        redirect(`/compliance?${p.toString()}`)
    }

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem" }}>
                <Link href="/" style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                    ← Back to Dashboard
                </Link>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 style={{ marginTop: "0.5rem" }}>Compliance & Risk Center</h1>
                        <p style={{ color: "var(--muted-foreground)" }}>
                            Governance risk indicators, Schedule R analysis, and required disclosures.
                        </p>
                    </div>

                    {/* Unified Toolbar */}
                    <div style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "flex-end",
                        background: "var(--muted)",
                        padding: "0.5rem",
                        paddingRight: "0.75rem",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)"
                    }}>
                        {/* What-If Button */}
                        <Link
                            href="/compliance/simulation"
                            className="btn btn-ghost"
                            style={{
                                height: "38px", // Match standard input height usually
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                marginBottom: "1px", // Fine-tune alignment with inputs
                                background: "var(--background)",
                                border: "1px solid var(--border)",
                                boxShadow: "sm"
                            }}
                        >
                            <span style={{ fontSize: "1.1rem" }}>🧪</span>
                            <span style={{ fontWeight: 600 }}>Scenario Planner</span>
                        </Link>

                        {/* Divider */}
                        <div style={{ width: "1px", height: "30px", background: "var(--border)", marginBottom: "5px" }} />

                        {/* Date Picker */}
                        <form action={updateFilters} style={{ display: "flex", gap: "0.5rem", alignItems: "end" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                <label htmlFor="start" style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>Start Date</label>
                                <input type="date" name="start" defaultValue={start} className="input" style={{ width: "130px", height: "38px" }} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                <label htmlFor="end" style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>End Date</label>
                                <input type="date" name="end" defaultValue={end} className="input" style={{ width: "130px", height: "38px" }} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ height: "38px", marginBottom: "0px" }}>Update</button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Schedule R Summary Box */}
            <div style={{
                marginBottom: "2rem",
                padding: "1.5rem",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                background: "linear-gradient(to right, rgba(59, 130, 246, 0.05), transparent)"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        📊 Schedule R Data Summary
                    </h2>
                    <ScheduleRDetailsDialog stats={scheduleRStats} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
                    <div>
                        <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Part I: Disregarded</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{scheduleRStats.disregardedCount}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Part III: Taxable Subs</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: scheduleRStats.taxableCount > 0 ? "var(--warning)" : "inherit" }}>
                            {scheduleRStats.taxableCount}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Part V Transaction Volume</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                            ${scheduleRStats.totalTransactionVolume.toLocaleString()}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                            {scheduleRStats.reportableTransactionCount > 0 ? (
                                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                                    {scheduleRStats.reportableTransactionCount} Reportable
                                </span>
                            ) : "No Reportable Items"}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Risk Analysis</h2>
                <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                    Found {risks.length} risks matching filters
                </div>
            </div>

            <RiskFilters entities={allEntities} people={allPeople} />

            {risks.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "var(--radius)", marginBottom: "3rem" }}>
                    <p>No risks match your filter criteria.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: "1rem", marginBottom: "3rem" }}>
                    {risks.map(risk => (
                        <RiskCard key={risk.id} risk={risk} />
                    ))}
                </div>
            )}

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Board Overlap Details</h2>
                {overlaps.length === 0 ? (
                    <p style={{ color: "var(--muted-foreground)" }}>No overlaps detected in this period.</p>
                ) : (
                    <div style={{ display: "grid", gap: "1.5rem" }}>
                        {overlaps.map((overlap) => (
                            <div key={`${overlap.entity1.id}-${overlap.entity2.id}`} className="card">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                                    <div>
                                        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            {overlap.entity1.name}
                                            <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>↔</span>
                                            {overlap.entity2.name}
                                        </h3>
                                        <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                                            {overlap.entity1.type} • {overlap.entity2.type}
                                        </div>
                                    </div>
                                    <div className="badge" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
                                        {overlap.overlapCount} Shared
                                    </div>
                                </div>
                                <div style={{ background: "var(--muted)", borderRadius: "var(--radius)", padding: "1rem" }}>
                                    <h4 style={{ fontSize: "0.75rem", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>Shared Directors / Officers</h4>
                                    <ul style={{ listStyle: "none" }}>
                                        {overlap.sharedPeople.map(p => (
                                            <li key={p.id} style={{ marginBottom: "0.5rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                                                <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: "2px" }}>
                                                    {overlap.entity1.name}: {p.roles1.join(", ")} <br />
                                                    {overlap.entity2.name}: {p.roles2.join(", ")}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
