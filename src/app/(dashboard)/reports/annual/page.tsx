import { prisma } from '@/lib/db'
import Link from 'next/link'
import AddAnnualReportDialog from '@/components/AddAnnualReportDialog'
import DateRangeFilter from '@/components/DateRangeFilter'

export const dynamic = 'force-dynamic'

export default async function GlobalAnnualReportsPage(
    props: { searchParams: Promise<{ status?: string, startDate?: string, endDate?: string }> }
) {
    const searchParams = await props.searchParams;

    // Calculate default dates (3 months past, 3 months future)
    const today = new Date()
    const defaultStartDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate())
    const defaultEndDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())

    // Parse or use defaults
    const startDateRaw = searchParams.startDate ? new Date(searchParams.startDate) : defaultStartDate
    const endDateRaw = searchParams.endDate ? new Date(searchParams.endDate) : defaultEndDate

    // Use UTC boundaries to avoid timezone slips on the database
    const queryStartDate = new Date(Date.UTC(startDateRaw.getFullYear(), startDateRaw.getMonth(), startDateRaw.getDate()))
    const queryEndDate = new Date(Date.UTC(endDateRaw.getFullYear(), endDateRaw.getMonth(), endDateRaw.getDate(), 23, 59, 59, 999))

    // Format for the HTML inputs
    const formattedStart = queryStartDate.toISOString().split('T')[0]
    const formattedEnd = queryEndDate.toISOString().split('T')[0]

    const trackedReports = await prisma.annualReport.findMany({
        where: {
            dueDate: {
                gte: queryStartDate,
                lte: queryEndDate
            }
        },
        include: {
            entity: {
                select: {
                    id: true,
                    legalName: true,
                    ein: true,
                    entityType: true,
                    // Use ts-ignore temporarily to bypass strict local cache typing on these newly migrated fields
                    // @ts-ignore
                    hasRecurringAnnualReport: true,
                    // @ts-ignore
                    recurringReportDueMonth: true,
                    // @ts-ignore
                    recurringReportDueDay: true
                }
            }
        },
        orderBy: [
            { dueDate: 'asc' },
        ]
    })

    // Fetch all entities configured for recurring reports to check for missing current year reports
    const recurringEntities = await prisma.entity.findMany({
        where: { hasRecurringAnnualReport: true },
        select: { id: true, legalName: true, ein: true, entityType: true, recurringReportDueMonth: true, recurringReportDueDay: true }
    })

    const currentYear = new Date().getFullYear().toString()

    // Determine which entities are missing their report for the current year, and if that report falls in the window
    const expectedReports = recurringEntities.map(entity => {
        // Construct expected due date
        let dueDate: Date | null = null;
        if (entity.recurringReportDueMonth && entity.recurringReportDueDay) {
            dueDate = new Date(Date.UTC(parseInt(currentYear), entity.recurringReportDueMonth - 1, entity.recurringReportDueDay))
        }

        // If it doesn't have a due date, or falls outside the active query window, don't show it as an EXPECTED report in this view
        if (!dueDate || dueDate < queryStartDate || dueDate > queryEndDate) {
            return null
        }

        const hasReportThisYear = trackedReports.some(r => r.entityId === entity.id && r.year === currentYear);
        if (hasReportThisYear) return null;

        return {
            id: `expected-${entity.id}`, // Mock ID
            entityId: entity.id,
            entity,
            year: currentYear,
            status: 'EXPECTED',
            dueDate,
            filingDate: null,
            documentUrl: null,
            notes: 'System generated expected report based on recurring configuration.',
            createdAt: new Date(),
            updatedAt: new Date(),
            isExpected: true // Flag for UI
        }
    }).filter(Boolean)

    // Combine and sort
    let allReports = [...trackedReports, ...expectedReports] as any[]
    allReports.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime()
    })

    // Filter by search parameters
    const activeStatusFilter = searchParams.status || 'ALL'
    if (activeStatusFilter !== 'ALL') {
        allReports = allReports.filter(report => {
            // "Pending" tile covers both PENDING and EXPECTED since they group in the UI count
            if (activeStatusFilter === 'PENDING') {
                return report.status === 'PENDING' || report.status === 'EXPECTED'
            }
            return report.status === activeStatusFilter
        })
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'FILED': return <span className="badge badge-success" style={{ background: '#dcfce7', color: '#166534' }}>Filed</span>;
            case 'PENDING': return <span className="badge badge-warning">Pending</span>;
            case 'EXPECTED': return <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>Expected</span>;
            case 'OVERDUE': return <span className="badge badge-error" style={{ background: '#fee2e2', color: '#991b1b' }}>Overdue</span>;
            case 'EXEMPT': return <span className="badge badge-secondary">Exempt</span>;
            default: return <span className="badge badge-outline">{status}</span>;
        }
    }

    // Quick stats (Calculate from the *unfiltered* combined lists so the tiles don't lose their absolute counts)
    const rawAllReports = [...trackedReports, ...expectedReports].filter(Boolean) as any[]
    const total = rawAllReports.length
    const filed = rawAllReports.filter(r => r.status === 'FILED').length
    const pending = rawAllReports.filter(r => r.status === 'PENDING' || r.status === 'EXPECTED').length
    const overdue = rawAllReports.filter(r => r.status === 'OVERDUE').length

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem" }}>
                <Link href="/reports" style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", display: "inline-block", marginBottom: "0.5rem" }}>
                    ← Back to Reports
                </Link>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <h1 style={{ marginTop: 0 }}>Global Annual Reports</h1>
                        <p style={{ color: "var(--muted-foreground)", margin: 0 }}>
                            Track state and federal filing statuses across all entities.
                        </p>
                    </div>
                    <DateRangeFilter defaultStart={formattedStart} defaultEnd={formattedEnd} />
                </div>
            </header>

            {/* Stats Overview */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
                <Link
                    href={`/reports/annual?startDate=${formattedStart}&endDate=${formattedEnd}`}
                    className="card hover:shadow-md transition-shadow"
                    style={{ padding: "1.5rem", border: activeStatusFilter === 'ALL' ? "2px solid var(--accent)" : undefined }}
                >
                    <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Total Reports</div>
                    <div style={{ fontSize: "2rem", fontWeight: 700 }}>{total}</div>
                </Link>
                <Link
                    href={`/reports/annual?status=FILED&startDate=${formattedStart}&endDate=${formattedEnd}`}
                    className="card hover:shadow-md transition-shadow"
                    style={{ padding: "1.5rem", borderLeft: "4px solid #166534", border: activeStatusFilter === 'FILED' ? "2px solid #166534" : "1px solid var(--border)", borderLeftWidth: activeStatusFilter === 'FILED' ? "4px" : "4px" }}
                >
                    <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Filed</div>
                    <div style={{ fontSize: "2rem", fontWeight: 700 }}>{filed}</div>
                </Link>
                <Link
                    href={`/reports/annual?status=PENDING&startDate=${formattedStart}&endDate=${formattedEnd}`}
                    className="card hover:shadow-md transition-shadow"
                    style={{ padding: "1.5rem", borderLeft: "4px solid #f59e0b", border: activeStatusFilter === 'PENDING' ? "2px solid #f59e0b" : "1px solid var(--border)", borderLeftWidth: activeStatusFilter === 'PENDING' ? "4px" : "4px" }}
                >
                    <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Pending</div>
                    <div style={{ fontSize: "2rem", fontWeight: 700 }}>{pending}</div>
                </Link>
                <Link
                    href={`/reports/annual?status=OVERDUE&startDate=${formattedStart}&endDate=${formattedEnd}`}
                    className="card hover:shadow-md transition-shadow"
                    style={{ padding: "1.5rem", borderLeft: "4px solid #991b1b", border: activeStatusFilter === 'OVERDUE' ? "2px solid #991b1b" : "1px solid var(--border)", borderLeftWidth: activeStatusFilter === 'OVERDUE' ? "4px" : "4px" }}
                >
                    <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Overdue</div>
                    <div style={{ fontSize: "2rem", fontWeight: 700 }}>{overdue}</div>
                </Link>
            </div>

            <div className="card">
                {allReports.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>
                        No annual reports currently tracked.
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Entity</th>
                                    <th>EIN</th>
                                    <th>Type</th>
                                    <th>Report Year</th>
                                    <th>Status</th>
                                    <th>Due Date</th>
                                    <th>Filing Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allReports.map(report => (
                                    <tr key={report.id} style={report.isExpected ? { backgroundColor: 'var(--muted)' } : {}}>
                                        <td>
                                            <Link href={`/entities/${report.entityId}`} className="hover:underline" style={{ fontWeight: 600 }}>
                                                {report.entity.legalName}
                                            </Link>
                                        </td>
                                        <td style={{ fontFamily: "monospace" }}>{report.entity.ein || '-'}</td>
                                        <td><span className="badge badge-outline">{report.entity.entityType}</span></td>
                                        <td style={{ fontWeight: 600 }}>{report.year}</td>
                                        <td>{getStatusBadge(report.status)}</td>
                                        <td>{report.dueDate ? new Date(report.dueDate).toLocaleDateString() : '-'}</td>
                                        <td>{report.filingDate ? new Date(report.filingDate).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <AddAnnualReportDialog
                                                entityId={report.entityId}
                                                report={report.isExpected ? { year: report.year, status: 'PENDING', entityId: report.entityId, dueDate: report.dueDate } as any : report}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
