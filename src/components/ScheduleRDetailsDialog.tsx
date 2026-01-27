'use client'

import { useState } from 'react'

type ScheduleRStats = {
    disregardedCount: number
    disregardedEntities: { id: string, legalName: string, ownershipPercentage: number | null, parentName: string }[]
    relatedTaxExemptCount: number
    relatedTaxExemptOrgs: { id: string, legalName: string, ownershipPercentage: number | null, parentName: string }[]
    relatedPartnershipCount: number
    relatedPartnerships: { id: string, legalName: string, ownershipPercentage: number | null, parentName: string }[]
    relatedCorpTrustCount: number
    relatedCorpsTrusts: { id: string, legalName: string, ownershipPercentage: number | null, parentName: string }[]
    unrelatedPartnershipCount: number
    unrelatedPartnerships: { id: string, legalName: string, ownershipPercentage: number | null, parentName: string }[]
    transactionCount: number
    reportableTransactionCount: number
    transactions: { id: string, amount: number | null, description: string | null, fromEntity: { legalName: string }, toEntity: { legalName: string }, isReportable: boolean }[]
    totalTransactionVolume: number
    supportingOrgCount: number
    supportingOrgs: { id: string, legalName: string, supportingOrgType: string | null }[]
}

import AddTransactionForm from '@/components/AddTransactionForm'

export default function ScheduleRDetailsDialog({ stats, allEntities }: { stats: ScheduleRStats, allEntities: { id: string, legalName: string }[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'disregarded' | 'exempt' | 'partnerships' | 'corps' | 'unrelated' | 'transactions' | 'supporting'>('disregarded')

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

    const TabButton = ({ id, label, count }: { id: typeof activeTab, label: string, count: number }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                padding: '0.5rem 1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === id ? '2px solid var(--primary)' : 'none',
                fontWeight: activeTab === id ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                color: activeTab === id ? 'var(--foreground)' : 'var(--muted-foreground)'
            }}
        >
            {label} ({count})
        </button>
    )

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
                maxWidth: '900px',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Schedule R Data Details</h3>
                    <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                    <TabButton id="disregarded" label="Part I: Disregarded" count={stats.disregardedCount} />
                    <TabButton id="exempt" label="Part II: Exempt" count={stats.relatedTaxExemptCount} />
                    <TabButton id="partnerships" label="Part III: Partnerships" count={stats.relatedPartnershipCount} />
                    <TabButton id="corps" label="Part IV: Corps" count={stats.relatedCorpTrustCount} />
                    <TabButton id="unrelated" label="Part VI: Unrelated" count={stats.unrelatedPartnershipCount} />
                    <TabButton id="transactions" label="Part V: Txns" count={stats.transactionCount} />
                    <TabButton id="supporting" label="Part I: Supporting" count={stats.supportingOrgCount} />
                </div>

                <div style={{ minHeight: '300px' }}>
                    {activeTab === 'disregarded' && (
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
                                Part I: Disregarded Entities (100% owned, treated as part of the organization).
                            </p>
                            {renderEntityTable(stats.disregardedEntities, 'No disregarded entities found.')}
                        </div>
                    )}

                    {activeTab === 'exempt' && (
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
                                Part II: Related Tax-Exempt Organizations (Controlled or Brother/Sister 501(c) entities).
                            </p>
                            {renderEntityTable(stats.relatedTaxExemptOrgs, 'No related tax-exempt organizations found.')}
                        </div>
                    )}

                    {activeTab === 'partnerships' && (
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
                                Part III: Related Organizations Taxable as a Partnership (Direct or Indirect Control).
                            </p>
                            {renderEntityTable(stats.relatedPartnerships, 'No related partnerships found.')}
                        </div>
                    )}

                    {activeTab === 'corps' && (
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
                                Part IV: Related Organizations Taxable as a Corporation or Trust (Direct or Indirect Control).
                            </p>
                            {renderEntityTable(stats.relatedCorpsTrusts, 'No related corporations or trusts found.')}
                        </div>
                    )}

                    {activeTab === 'unrelated' && (
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
                                Part VI: Unrelated Organizations Taxable as a Partnership (Significant Activity {'>'} 5% but not Controlled).
                            </p>
                            {renderEntityTable(stats.unrelatedPartnerships, 'No significant unrelated partnerships found.')}
                        </div>
                    )}

                    {activeTab === 'transactions' && (
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
                                Part V: Transactions with Related Organizations. <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Amber rows</span> indicate reportable transactions ({'>'}$50k single / {'>'}$100k aggregate).
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
                            <div style={{ borderTop: '1px solid var(--border)', marginTop: '2rem', paddingTop: '1rem' }}>
                                <AddTransactionForm allEntities={allEntities} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'supporting' && (
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
                                Part I (Line 1): Supported Organizations / Supporting Organizations.
                            </p>
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
                </div>

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

function renderEntityTable(entities: any[], emptyMsg: string) {
    if (entities.length === 0) {
        return <p style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{emptyMsg}</p>
    }
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Entity Name</th>
                    <th style={{ padding: '0.5rem' }}>Parent Entity</th>
                    <th style={{ padding: '0.5rem' }}>Ownership %</th>
                </tr>
            </thead>
            <tbody>
                {entities.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.5rem' }}>{e.legalName}</td>
                        <td style={{ padding: '0.5rem' }}>{e.parentName || 'N/A'}</td>
                        <td style={{ padding: '0.5rem' }}>{e.ownershipPercentage ? `${e.ownershipPercentage}%` : 'N/A'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
