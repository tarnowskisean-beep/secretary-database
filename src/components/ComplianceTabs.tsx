'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function ComplianceTabs() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentTab = searchParams.get('tab') || 'risks'

    const handleTabChange = (tab: string) => {
        const params = new URLSearchParams(searchParams)
        params.set('tab', tab)
        router.push(`/compliance?${params.toString()}`)
    }

    return (
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "2rem" }}>
            <button
                onClick={() => handleTabChange('risks')}
                style={{
                    padding: "0.75rem 1.5rem",
                    background: "none",
                    border: "none",
                    borderBottom: currentTab === 'risks' ? "2px solid var(--primary)" : "2px solid transparent",
                    color: currentTab === 'risks' ? "var(--foreground)" : "var(--muted-foreground)",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.875rem"
                }}
            >
                Risk Analysis
            </button>
            <button
                onClick={() => handleTabChange('overlap')}
                style={{
                    padding: "0.75rem 1.5rem",
                    background: "none",
                    border: "none",
                    borderBottom: currentTab === 'overlap' ? "2px solid var(--primary)" : "2px solid transparent",
                    color: currentTab === 'overlap' ? "var(--foreground)" : "var(--muted-foreground)",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.875rem"
                }}
            >
                Board Overlap Details
            </button>
        </div>
    )
}
