'use client'

import { useState } from 'react'
import { updateRecurringSettings } from '@/server/actions/entities'

export default function RecurringSettingsDialog({
    entityId,
    hasRecurringAnnualReport,
    recurringReportDueMonth,
    recurringReportDueDay
}: {
    entityId: string,
    hasRecurringAnnualReport: boolean,
    recurringReportDueMonth: number | null,
    recurringReportDueDay: number | null
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isRecurring, setIsRecurring] = useState(hasRecurringAnnualReport)

    async function handleSubmit(formData: FormData) {
        setError(null)
        formData.append('entityId', entityId)

        const result = await updateRecurringSettings(null, formData)

        if (result && !result.success) {
            setError(result.message || 'Failed to save settings')
            return
        }

        setIsOpen(false)
    }

    return (
        <>
            <button
                className="btn btn-outline"
                onClick={() => setIsOpen(true)}
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "flex", gap: "0.25rem", alignItems: "center" }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Recurring Config
            </button>

            {isOpen && (
                <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Recurring Annual Report Configuration</h2>
                            <button className="modal-close" onClick={() => setIsOpen(false)}>×</button>
                        </div>

                        <form action={handleSubmit}>
                            {error && <div style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#991b1b', backgroundColor: '#fee2e2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>{error}</div>}

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="hasRecurringAnnualReport"
                                    name="hasRecurringAnnualReport"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    style={{ width: 'auto' }}
                                />
                                <label htmlFor="hasRecurringAnnualReport" style={{ margin: 0, cursor: 'pointer' }}>Track recurring annual report for this entity</label>
                            </div>

                            {isRecurring && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label>Due Month (1-12)</label>
                                        <input
                                            type="number"
                                            name="recurringReportDueMonth"
                                            required={isRecurring}
                                            min="1"
                                            max="12"
                                            defaultValue={recurringReportDueMonth || ''}
                                            placeholder="Ext: 4 for April"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Due Day (1-31)</label>
                                        <input
                                            type="number"
                                            name="recurringReportDueDay"
                                            required={isRecurring}
                                            min="1"
                                            max="31"
                                            defaultValue={recurringReportDueDay || ''}
                                            placeholder="Ex: 15"
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Configuration</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
