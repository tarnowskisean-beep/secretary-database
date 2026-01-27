'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'red' }}>
                Something went wrong!
            </h2>
            <div style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                padding: '1rem',
                borderRadius: '0.5rem',
                color: '#991b1b',
                fontFamily: 'monospace',
                marginBottom: '1.5rem',
                textAlign: 'left',
                whiteSpace: 'pre-wrap'
            }}>
                {error.message}
                {error.digest && <div><br /><small>Digest: {error.digest}</small></div>}
            </div>
            <button
                onClick={() => reset()}
                className="btn btn-primary"
            >
                Try again
            </button>
        </div>
    )
}
