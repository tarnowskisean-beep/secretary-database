'use client'

import { useState } from 'react'

type ScheduleRStats = {
    disregardedCount: number
    disregardedEntities: { id: string, legalName: string, ownershipPercentage: number | null, parentName: string }[]
    taxableCount: number
    taxableRelatedOrgs: { id: string, legalName: string, ownershipPercentage: number | null, parentName: string }[]
    transactionCount: number
    reportableTransactionCount: number
    transactions: { id: string, amount: number | null, description: string | null, fromEntity: { legalName: string }, toEntity: { legalName: string }, isReportable: boolean }[]
    totalTransactionVolume: number
    supportingOrgCount: number
    supportingOrgs: { id: string, legalName: string, supportingOrgType: string | null }[]
}

export default function ScheduleRDetailsDialog({ stats }: { stats: ScheduleRStats }) {
    const [isOpen, setIsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'disregarded' | 'taxable' | 'transactions' | 'supporting'>('disregarded')

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-secondary"
                style={{ height: 'fit-content', fontSize: '0.875rem' }}
            >
                View Details
            </button>
        )
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
        }}>
            <div style={{
                background: 'var(--background)',
                padding: '2rem',
                borderRadius: 'var(--radius)',
                width: '90%',
                maxWidth: '800px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Schedule R Data Details</h3>
                    <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                    <button
                        onClick={() => setActiveTab('disregarded')}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'disregarded' ? '2px solid var(--primary)' : 'none',
                            fontWeight: activeTab === 'disregarded' ? 600 : 400,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Part I: Disregarded ({stats.disregardedCount})
                    </button>
                    <button
                        onClick={() => setActiveTab('taxable')}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'taxable' ? '2px solid var(--primary)' : 'none',
                            fontWeight: activeTab === 'taxable' ? 600 : 400,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Part III: Taxable ({stats.taxableCount})
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'transactions' ? '2px solid var(--primary)' : 'none',
                            fontWeight: activeTab === 'transactions' ? 600 : 400,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Part V: Transactions ({stats.transactionCount})
                    </button>
                    <button
                        onClick={() => setActiveTab('supporting')}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'supporting' ? '2px solid var(--primary)' : 'none',
                            fontWeight: activeTab === 'supporting' ? 600 : 400,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Part I: Supporting ({stats.supportingOrgCount})
                    </button>
                </div>

                {activeTab === 'disregarded' && (
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
                            Entities 100% owned by the organization (Disregarded Entities).
                        </p>
                        {stats.disregardedCount === 0 ? (
                            <p style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No disregarded entities found.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem' }}>Entity Name</th>
                                        <th style={{ padding: '0.5rem' }}>Parent Entity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.disregardedEntities.map(sub => (
                                        <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.5rem' }}>{sub.legalName}</td>
                                            <td style={{ padding: '0.5rem' }}>{sub.parentName || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'taxable' && (
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
                            Related Organizations Taxable as a Corporation or Trust (Start at &gt;50% ownership).
                        </p>
                        {stats.taxableCount === 0 ? (
                            <p style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No controlled taxable subsidiaries found.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem' }}>Entity Name</th>
                                        <th style={{ padding: '0.5rem' }}>Parent Entity</th>
                                        <th style={{ padding: '0.5rem' }}>Ownership %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.taxableRelatedOrgs.map(sub => (
                                        <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.5rem' }}>{sub.legalName}</td>
                                            <td style={{ padding: '0.5rem' }}>{sub.parentName || 'N/A'}</td>
                                            <td style={{ padding: '0.5rem' }}>{sub.ownershipPercentage}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
                            Transactions with Related Organizations. <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Amber rows</span> indicate transactions &gt; $50,000 which may be reportable.
                        </p>
                        {stats.transactionCount === 0 ? (
                            <p style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No related transactions found.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem' }}>From</th>
                                        <th style={{ padding: '0.5rem' }}>To</th>
                                        <th style={{ padding: '0.5rem' }}>Description</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.transactions.map(tx => (
                                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)', background: tx.isReportable ? 'rgba(245, 158, 11, 0.1)' : 'transparent' }}>
                                            <td style={{ padding: '0.5rem' }}>{tx.fromEntity.legalName}</td>
                                            <td style={{ padding: '0.5rem' }}>{tx.toEntity.legalName}</td>
                                            <td style={{ padding: '0.5rem' }}>{tx.description}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                ${tx.amount?.toLocaleString()} {tx.isReportable && '⚠️'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'supporting' && (
                    <div>
                        {stats.supportingOrgCount === 0 ? (
                            <p style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No supporting organizations found.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem' }}>Entity Name</th>
                                        <th style={{ padding: '0.5rem' }}>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.supportingOrgs.map(org => (
                                        <tr key={org.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.5rem' }}>{org.legalName}</td>
                                            <td style={{ padding: '0.5rem' }}>{org.supportingOrgType}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="btn btn-secondary"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
