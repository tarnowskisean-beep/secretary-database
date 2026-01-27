'use client'

import { createTransaction } from '@/server/actions/transactions'
import { useActionState, useState, useEffect } from 'react'

export default function AddTransactionForm({
    currentEntityId,
    allEntities
}: {
    currentEntityId?: string,
    allEntities: { id: string, legalName: string }[]
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [state, formAction] = useActionState(createTransaction, { message: '', errors: {} })

    // "OUT" = Current Entity pays Others (Expense/Grant)
    // "IN" = Others pay Current Entity (Income/Loan)
    const [direction, setDirection] = useState<'OUT' | 'IN'>('OUT')

    useEffect(() => {
        if (state.success && isOpen) {
            setIsOpen(false)
        }
    }, [state.success, isOpen])

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

    // Filter potentially valid counterparties (exclude self)
    const counterparties = allEntities.filter(e => e.id !== currentEntityId)

    return (
        <div style={{ marginTop: "1rem", padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--card)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h4 style={{ fontSize: "1.1rem", marginBottom: "1.25rem", fontWeight: 600 }}>Record New Transaction</h4>

            <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                {/* Direction Toggle */}
                {currentEntityId && (
                    <div style={{ display: "flex", background: "var(--muted)", padding: "0.25rem", borderRadius: "var(--radius)", marginBottom: "0.5rem" }}>
                        <button
                            type="button"
                            onClick={() => setDirection('OUT')}
                            style={{
                                flex: 1,
                                padding: "0.5rem",
                                borderRadius: "calc(var(--radius) - 2px)",
                                border: "none",
                                background: direction === 'OUT' ? "var(--background)" : "transparent",
                                boxShadow: direction === 'OUT' ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                fontWeight: direction === 'OUT' ? 600 : 500,
                                color: direction === 'OUT' ? "var(--foreground)" : "var(--muted-foreground)",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            Outgoing (To)
                        </button>
                        <button
                            type="button"
                            onClick={() => setDirection('IN')}
                            style={{
                                flex: 1,
                                padding: "0.5rem",
                                borderRadius: "calc(var(--radius) - 2px)",
                                border: "none",
                                background: direction === 'IN' ? "var(--background)" : "transparent",
                                boxShadow: direction === 'IN' ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                fontWeight: direction === 'IN' ? 600 : 500,
                                color: direction === 'IN' ? "var(--foreground)" : "var(--muted-foreground)",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            Incoming (From)
                        </button>
                    </div>
                )}

                {/* Hidden logic for From/To based on direction */}
                {currentEntityId && (
                    <>
                        <input type="hidden" name={direction === 'OUT' ? "fromEntityId" : "toEntityId"} value={currentEntityId} />
                    </>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <label className="text-sm font-medium">
                            {direction === 'OUT' ? 'Pay To (Counterparty)' : 'Receive From (Counterparty)'}
                        </label>
                        <select
                            name={direction === 'OUT' ? "toEntityId" : "fromEntityId"}
                            className="input"
                            required
                            defaultValue=""
                        >
                            <option value="" disabled>Select Entity...</option>
                            {counterparties.map(e => (
                                <option key={e.id} value={e.id}>{e.legalName}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <label className="text-sm font-medium">Transaction Type</label>
                        <select name="type" className="input" required defaultValue="GRANT">
                            {direction === 'OUT' && <option value="GRANT">Grant Payment</option>}
                            {direction === 'IN' && <option value="GRANT">Grant Received</option>}
                            <option value="LOAN">Loan</option>
                            <option value="LOAN_REPAYMENT">Loan Repayment</option>
                            <option value="SHARED_SERVICES">Shared Services</option>
                            <option value="GIFT">Gift</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <label className="text-sm font-medium">Amount ($)</label>
                        <input type="number" name="amount" className="input" min="0" step="0.01" required placeholder="0.00" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <label className="text-sm font-medium">Date</label>
                        <input type="date" name="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} required />
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <label className="text-sm font-medium">Description</label>
                    <input type="text" name="description" className="input" placeholder="e.g. Q1 Operating Support" />
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                        Save Record
                    </button>
                </div>
                {state.message && <p style={{ fontSize: "0.875rem", textAlign: "center", color: state.success ? "green" : "red" }}>{state.message}</p>}
            </form>
        </div>
    )
}
