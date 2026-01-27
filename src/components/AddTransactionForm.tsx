'use client'

import { createTransaction } from '@/server/actions/entities'
import { useActionState, useState } from 'react'

export default function AddTransactionForm({
    currentEntityId,
    allEntities
}: {
    currentEntityId?: string,
    allEntities: { id: string, legalName: string }[]
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [state, formAction] = useActionState(createTransaction, { message: '', errors: {} })

    if (state.success && isOpen) {
        setIsOpen(false)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-secondary"
                style={{ fontSize: "0.875rem", padding: "0.25rem 0.75rem" }}
            >
                + Add Transaction
            </button>
        )
    }

    return (
        <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--card)" }}>
            <h4 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Record New Transaction</h4>
            <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                {currentEntityId ? (
                    <input type="hidden" name="fromEntityId" value={currentEntityId} />
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label className="text-sm font-medium">From Entity</label>
                        <select name="fromEntityId" className="input" required defaultValue="">
                            <option value="" disabled>Select Entity...</option>
                            {allEntities.map(e => (
                                <option key={e.id} value={e.id}>{e.legalName}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label className="text-sm font-medium">To Entity</label>
                        <select name="toEntityId" className="input" required defaultValue="">
                            <option value="" disabled>Select Entity...</option>
                            {allEntities
                                .filter(e => e.id !== currentEntityId)
                                .map(e => (
                                    <option key={e.id} value={e.id}>{e.legalName}</option>
                                ))}
                        </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label className="text-sm font-medium">Type</label>
                        <select name="type" className="input" required>
                            <option value="GRANT">Grant</option>
                            <option value="LOAN">Loan</option>
                            <option value="LOAN_REPAYMENT">Loan Repayment</option>
                            <option value="SHARED_SERVICES">Shared Services</option>
                            <option value="GIFT">Gift</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label className="text-sm font-medium">Amount ($)</label>
                        <input type="number" name="amount" className="input" min="0" step="0.01" required />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label className="text-sm font-medium">Date</label>
                        <input type="date" name="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} required />
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label className="text-sm font-medium">Description</label>
                    <input type="text" name="description" className="input" placeholder="e.g. General operating support" />
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                        Save Transaction
                    </button>
                </div>
                {state.message && <p style={{ fontSize: "0.875rem", color: state.success ? "green" : "red" }}>{state.message}</p>}
            </form>
        </div>
    )
}
