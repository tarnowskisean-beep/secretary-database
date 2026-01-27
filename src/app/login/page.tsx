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
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            {/* Main Card */}
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="p-10 pb-8 border-b border-slate-100">
                    <div className="flex flex-col items-center text-center">
                        {/* Logo Section */}
                        <div className="mb-8 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <img
                                src="/logo.png"
                                alt="Compass Professional Logo"
                                className="h-12 w-auto object-contain grayscale opacity-90 hover:grayscale-0 transition-all duration-500"
                            />
                        </div>

                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            Governance Intelligence
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 font-medium">
                            Secure Client Compass Portal
                        </p>
                    </div>
                </div>

                <div className="p-10 pt-8">
                    {error && (
                        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg text-sm flex items-center gap-3 border border-red-100 shadow-sm">
                            <svg className="h-5 w-5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email-address" className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                                    Email Address
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all hover:bg-white text-sm"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all hover:bg-white text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98]"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying Credentials...
                                    </span>
                                ) : (
                                    'Sign In to Dashboard'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-10 py-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Operational</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">SOC 2 Compliant</span>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-slate-500 text-xs">
                <p>&copy; {new Date().getFullYear()} Compass Professional. All rights reserved.</p>
                <div className="mt-2 flex justify-center gap-4">
                    <a href="#" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
                    <span className="text-slate-300">•</span>
                    <a href="#" className="hover:text-slate-800 transition-colors">Terms of Service</a>
                </div>
            </div>
        </div>
    )
}
