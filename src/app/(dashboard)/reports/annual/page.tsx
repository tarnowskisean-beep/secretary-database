import { prisma } from '@/lib/db'
import Link from 'next/link'
import AddAnnualReportDialog from '@/components/AddAnnualReportDialog'

export const dynamic = 'force-dynamic'

export default async function GlobalAnnualReportsPage() {
    const trackedReports = await prisma.annualReport.findMany({
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

    // Determine which entities are missing their report for the current year
    const expectedReports = recurringEntities.map(entity => {
        const hasReportThisYear = trackedReports.some(r => r.entityId === entity.id && r.year === currentYear);
        if (hasReportThisYear) return null;

        // Construct expected due date
        let dueDate: Date | null = null;
        if (entity.recurringReportDueMonth && entity.recurringReportDueDay) {
            dueDate = new Date(parseInt(currentYear), entity.recurringReportDueMonth - 1, entity.recurringReportDueDay)
        }

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
    const allReports = [...trackedReports, ...expectedReports] as any[]
    allReports.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime()
    })

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

    // Quick stats
    const total = allReports.length
    const filed = allReports.filter(r => r.status === 'FILED').length
    const pending = allReports.filter(r => r.status === 'PENDING' || r.status === 'EXPECTED').length
    const overdue = allReports.filter(r => r.status === 'OVERDUE').length

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
                </div>
            </header>

            {/* Stats Overview */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
                <div className="card" style={{ padding: "1.5rem" }}>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Total Reports</div>
                    <div style={{ fontSize: "2rem", fontWeight: 700 }}>{total}</div>
                </div>
                <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid #166534" }}>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Filed</div>
                    <div style={{ fontSize: "2rem", fontWeight: 700 }}>{filed}</div>
                </div>
                <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid #f59e0b" }}>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Pending</div>
                    <div style={{ fontSize: "2rem", fontWeight: 700 }}>{pending}</div>
                </div>
                <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid #991b1b" }}>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Overdue</div>
                    <div style={{ fontSize: "2rem", fontWeight: 700 }}>{overdue}</div>
                </div>
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
                                            {report.isExpected ? (
                                                <AddAnnualReportDialog entityId={report.entityId} report={{ year: report.year, status: 'PENDING', entityId: report.entityId, dueDate: report.dueDate } as any} />
                                            ) : (
                                                <Link href={`/entities/${report.entityId}`} style={{ color: "var(--accent)", fontSize: "0.875rem", textDecoration: "underline" }}>
                                                    View/Edit
                                                </Link>
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
    )
}
