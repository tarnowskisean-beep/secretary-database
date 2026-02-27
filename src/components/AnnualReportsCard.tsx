import AddAnnualReportDialog from './AddAnnualReportDialog'
import { AnnualReport } from '@prisma/client'

// Use a custom loose type until local TS Server catches up with Prisma Generate
type EntityWithRecurring = any;

export default function AnnualReportsCard({ entity, reports = [] }: { entity: EntityWithRecurring, reports: AnnualReport[] }) {
    function getStatusBadge(status: string) {
        switch (status) {
            case 'FILED': return <span className="badge badge-success" style={{ background: '#dcfce7', color: '#166534' }}>Filed</span>;
            case 'PENDING': return <span className="badge badge-warning">Pending</span>;
            case 'OVERDUE': return <span className="badge badge-error" style={{ background: '#fee2e2', color: '#991b1b' }}>Overdue</span>;
            case 'EXEMPT': return <span className="badge badge-secondary">Exempt</span>;
            default: return <span className="badge badge-outline">{status}</span>;
        }
    }

    return (
        <div className="card">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Annual Reports</h2>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>State & Federal filing tracking</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <AddAnnualReportDialog
                        entityId={entity.id}
                        hasRecurringAnnualReport={entity.hasRecurringAnnualReport}
                        recurringReportFrequency={entity.recurringReportFrequency}
                        recurringReportDueMonth={entity.recurringReportDueMonth}
                        recurringReportDueDay={entity.recurringReportDueDay}
                    />
                </div>
            </header>

            {reports.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted-foreground)", background: "var(--muted)", borderRadius: "var(--radius)" }}>
                    No annual reports tracked yet.
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Year</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th>Filing Date</th>
                                <th>Documents</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(report => (
                                <tr key={report.id}>
                                    <td style={{ fontWeight: 600 }}>{report.year}</td>
                                    <td>{getStatusBadge(report.status)}</td>
                                    <td>{report.dueDate ? new Date(report.dueDate).toLocaleDateString() : '-'}</td>
                                    <td>{report.filingDate ? new Date(report.filingDate).toLocaleDateString() : '-'}</td>
                                    <td>
                                        {report.documentUrl ? (
                                            <a href={report.documentUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline", fontSize: "0.875rem" }}>
                                                View Doc
                                            </a>
                                        ) : (
                                            <span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        <AddAnnualReportDialog
                                            entityId={entity.id}
                                            report={report}
                                            hasRecurringAnnualReport={entity.hasRecurringAnnualReport}
                                            recurringReportFrequency={entity.recurringReportFrequency}
                                            recurringReportDueMonth={entity.recurringReportDueMonth}
                                            recurringReportDueDay={entity.recurringReportDueDay}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
