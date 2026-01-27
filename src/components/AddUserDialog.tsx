'use client'

import { useState } from 'react'
import { createUser } from '@/server/actions/users'
import { UserRole } from '@prisma/client'

export default function AddUserDialog({ onClose, onUserCreated }: { onClose: () => void, onUserCreated: () => void }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const role = formData.get('role') as string
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        const res = await createUser({ email, password, role: role as UserRole })

        if (res.success) {
            onUserCreated()
            onClose()
        } else {
            setError(res.error || "Failed to create user")
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
            <div style={{ background: "white", padding: "2rem", borderRadius: "12px", width: "400px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Add New User</h2>

                {error && <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "0.5rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
                        <input type="email" name="email" required className="input" style={{ width: "100%" }} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
                        <input type="password" name="password" required minLength={6} className="input" style={{ width: "100%" }} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Role</label>
                        <select name="role" className="input" style={{ width: "100%" }}>
                            <option value="VIEWER">Viewer</option>
                            <option value="EDITOR">Editor</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? "Creating..." : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
