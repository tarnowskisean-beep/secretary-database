'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/')
            router.refresh()
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', // Premium Slate Gradient
            padding: '20px'
        }}>
            {/* Main Card */}
            <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '0', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ padding: '40px 40px 30px', borderBottom: '1px solid var(--border)', background: 'white' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        {/* Logo Section */}
                        <div style={{ marginBottom: '24px', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: '#f8fafc' }}>
                            <img
                                src="/logo.png"
                                alt="Compass Professional Logo"
                                style={{ height: '48px', width: 'auto', filter: 'grayscale(100%)', opacity: 0.9 }}
                            />
                        </div>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
                            Governance Intelligence
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontWeight: '500' }}>
                            Secure Client Compass Portal
                        </p>
                    </div>
                </div>

                <div style={{ padding: '40px' }}>
                    {error && (
                        <div style={{
                            marginBottom: '24px',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            border: '1px solid #fecaca',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label htmlFor="email-address" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                                    Email Address
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="input"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ padding: '12px 16px', fontSize: '0.95rem' }}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ padding: '12px 16px', fontSize: '0.95rem' }}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '14px', fontSize: '0.95rem', fontWeight: '600' }}
                            >
                                {loading ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
                            </button>
                        </div>
                    </form>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px 40px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ height: '8px', width: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Operational</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>SOC 2 Compliant</span>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                <p>&copy; {new Date().getFullYear()} Compass Professional. All rights reserved.</p>
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <a href="#" style={{ transition: 'color 0.2s', textDecoration: 'none' }}>Privacy Policy</a>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <a href="#" style={{ transition: 'color 0.2s', textDecoration: 'none' }}>Terms of Service</a>
                </div>
            </div>
        </div>
    )
}
