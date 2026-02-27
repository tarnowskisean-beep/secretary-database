import AddAnnualReportDialog from './AddAnnualReportDialog'
import { AnnualReport } from '@prisma/client'

export default function AnnualReportsCard({ entityId, reports = [] }: { entityId: string, reports: AnnualReport[] }) {
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                <div>
                    <h3 style={{ fontSize: "1.25rem", margin: 0 }}>Annual Reports</h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>State & Federal filing tracking</p>
                </div>
                <AddAnnualReportDialog entityId={entityId} />
            </div>

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
                                        <AddAnnualReportDialog entityId={entityId} report={report} />
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
