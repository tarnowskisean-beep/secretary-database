'use client'

import { useState } from 'react'
import { createAnnualReport, updateAnnualReport, deleteAnnualReport } from '@/server/actions/annualReports'
import { AnnualReport } from '@prisma/client'

export default function AddAnnualReportDialog({
    entityId,
    report
}: {
    entityId: string,
    report?: AnnualReport
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const isEditing = !!report

    async function handleSubmit(formData: FormData) {
        setError(null)
        formData.append('entityId', entityId)

        const action = isEditing
            ? updateAnnualReport.bind(null, report.id)
            : createAnnualReport

        const result = await action(null, formData)

        if (result && !result.success) {
            setError(result.message || 'Failed to save report')
            return
        }

        setIsOpen(false)
    }

    async function handleDelete() {
        if (!report || !confirm('Are you sure you want to delete this report?')) return
        setError(null)
        const result = await deleteAnnualReport(report.id, entityId)
        if (result && !result.success) {
            setError(result.message || 'Failed to delete report')
            return
        }
        setIsOpen(false)
    }

    return (
        <>
            <button
                className={isEditing ? "btn btn-secondary" : "btn btn-primary"}
                onClick={() => setIsOpen(true)}
                style={isEditing ? { padding: "0.25rem 0.5rem", fontSize: "0.75rem" } : {}}
            >
                {isEditing ? 'Edit' : 'Add Report'}
            </button>

            {isOpen && (
                <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{isEditing ? 'Edit Annual Report' : 'Add Annual Report'}</h2>
                            <button className="modal-close" onClick={() => setIsOpen(false)}>×</button>
                        </div>

                        <form action={handleSubmit}>
                            {error && <div style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#991b1b', backgroundColor: '#fee2e2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>{error}</div>}

                            <div className="form-group">
                                <label>Year</label>
                                <input
                                    name="year"
                                    required
                                    defaultValue={report?.year || new Date().getFullYear().toString()}
                                    pattern="\d{4}"
                                    title="Four digit year"
                                    placeholder="YYYY"
                                />
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" defaultValue={report?.status || 'PENDING'}>
                                    <option value="PENDING">Pending</option>
                                    <option value="FILED">Filed</option>
                                    <option value="OVERDUE">Overdue</option>
                                    <option value="EXEMPT">Exempt</option>
                                </select>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        defaultValue={report?.dueDate ? new Date(report.dueDate).toISOString().split('T')[0] : ''}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Filing Date</label>
                                    <input
                                        type="date"
                                        name="filingDate"
                                        defaultValue={report?.filingDate ? new Date(report.filingDate).toISOString().split('T')[0] : ''}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Document URL</label>
                                <input
                                    type="url"
                                    name="documentUrl"
                                    defaultValue={report?.documentUrl || ''}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    name="notes"
                                    defaultValue={report?.notes || ''}
                                    rows={3}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                                {isEditing ? (
                                    <button type="button" onClick={handleDelete} style={{ color: "red", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                        Delete Report
                                    </button>
                                ) : (
                                    <div />
                                )}
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
