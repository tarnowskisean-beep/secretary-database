'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function DateRangeFilter({ defaultStart, defaultEnd }: { defaultStart: string, defaultEnd: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Read from URL if it exists, otherwise use server-provided defaults
    const [startDate, setStartDate] = useState(searchParams?.get('startDate') || defaultStart)
    const [endDate, setEndDate] = useState(searchParams?.get('endDate') || defaultEnd)

    const applyDates = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams(searchParams?.toString())
        params.set('startDate', startDate)
        params.set('endDate', endDate)

        router.push(`/reports/annual?${params.toString()}`)
    }

    return (
        <form onSubmit={applyDates} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--muted)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label htmlFor="start" style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>From:</label>
                <input
                    type="date"
                    id="start"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label htmlFor="end" style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>To:</label>
                <input
                    type="date"
                    id="end"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                />
            </div>
            <button type="submit" className="button" style={{ padding: '0.25rem 0.75rem', height: 'auto', minHeight: 0 }}>Apply</button>
        </form>
    )
}
