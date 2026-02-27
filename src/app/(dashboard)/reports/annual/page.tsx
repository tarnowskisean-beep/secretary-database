import { prisma } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GlobalAnnualReportsPage() {
    // Fetch all annual reports with their associated entities
    const reports = await prisma.annualReport.findMany({
        include: {
            entity: {
                select: { id: true, legalName: true, ein: true, entityType: true }
            }
        },
        orderBy: [
            { dueDate: 'asc' },
        ]
    })

    function getStatusBadge(status: string) {
        switch (status) {
            case 'FILED': return <span className="badge badge-success" style={{ background: '#dcfce7', color: '#166534' }}>Filed</span>;
            case 'PENDING': return <span className="badge badge-warning">Pending</span>;
            case 'OVERDUE': return <span className="badge badge-error" style={{ background: '#fee2e2', color: '#991b1b' }}>Overdue</span>;
            case 'EXEMPT': return <span className="badge badge-secondary">Exempt</span>;
            default: return <span className="badge badge-outline">{status}</span>;
        }
    }

    // Quick stats
    const total = reports.length
    const filed = reports.filter(r => r.status === 'FILED').length
    const pending = reports.filter(r => r.status === 'PENDING').length
    const overdue = reports.filter(r => r.status === 'OVERDUE').length

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
                {reports.length === 0 ? (
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
                                {reports.map(report => (
                                    <tr key={report.id}>
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
                                            <Link href={`/entities/${report.entityId}`} style={{ color: "var(--accent)", fontSize: "0.875rem", textDecoration: "underline" }}>
                                                View/Edit
                                            </Link>
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
