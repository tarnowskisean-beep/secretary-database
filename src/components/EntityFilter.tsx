'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function EntityFilter({ states = [] }: { states?: string[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`/entities?${params.toString()}`)
    }

    return (
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <label htmlFor="type-filter" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Type:</label>
                <select
                    id="type-filter"
                    className="input"
                    style={{ padding: "0.25rem 0.5rem" }}
                    value={searchParams.get('type') || ''}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                    <option value="">All Types</option>
                    <option value="501(c)(3)">501(c)(3)</option>
                    <option value="501(c)(4)">501(c)(4)</option>
                    <option value="527">527</option>
                    <option value="LLC">LLC</option>
                    <option value="S Corporation">S Corporation</option>
                    <option value="C Corporation">C Corporation</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <label htmlFor="state-filter" style={{ fontSize: "0.875rem", fontWeight: 500 }}>State:</label>
                <select
                    id="state-filter"
                    className="input"
                    style={{ padding: "0.25rem 0.5rem", minWidth: "120px" }}
                    value={searchParams.get('state') || ''}
                    onChange={(e) => handleFilterChange('state', e.target.value)}
                >
                    <option value="">All States</option>
                    {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}
