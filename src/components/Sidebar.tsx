'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useEffect } from 'react'
import { syncUser } from '@/server/actions/auth'

export default function Sidebar({ isCollapsed, toggle }: { isCollapsed: boolean, toggle: () => void }) {
    const pathname = usePathname()

    useEffect(() => {
        // Sync user on initial load to ensure DB record exists
        syncUser()
    }, [])

    const navItems = [
        { name: 'Dashboard', path: '/', icon: '📊' },
        { name: 'Entities', path: '/entities', icon: '🏢' },
        { name: 'People', path: '/people', icon: '👥' },
        { name: 'Compliance', path: '/compliance', icon: '⚖️' },
        { name: 'Reports', path: '/reports', icon: '📄' },
        { name: 'Users', path: '/admin/users', icon: '👤' },
        { name: 'Activity', path: '/admin/activity', icon: '📜' },
    ]

    return (
        <aside style={{
            width: isCollapsed ? "70px" : "260px",
            background: "#27272a", // Zinc 800 (Neutral Dark Grey)
            color: "#f8fafc", // Slate 50
            borderRight: "1px solid #3f3f46", // Zinc 700
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            padding: "1.5rem 1rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "4px 0 24px rgba(0,0,0,0.1)", // Enhanced shadow for depth
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
            zIndex: 50
        }}>
            <div style={{ marginBottom: "2.5rem", display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between" }}>
                {!isCollapsed && (
                    <div style={{ fontWeight: 700, fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Image src="/logo.png" alt="Compass Professional" width={150} height={40} style={{ objectFit: "contain", height: "auto" }} />
                    </div>
                )}
                <button
                    onClick={toggle}
                    style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        color: "#a1a1aa", // Zinc 400
                        padding: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    title={isCollapsed ? "Expand" : "Collapse"}
                >
                    {isCollapsed ? "»" : "«"}
                </button>
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {navItems.map((item) => {
                    // Exact dashboard match handling
                    const isDashboard = item.path === '/'
                    const isReallyActive = isDashboard ? pathname === '/' : pathname.startsWith(item.path)

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            title={isCollapsed ? item.name : ""}
                            style={{
                                padding: "0.75rem 0.5rem",
                                borderRadius: "8px",
                                textDecoration: "none",
                                fontSize: "0.925rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: isCollapsed ? "center" : "flex-start",
                                gap: "0.75rem",
                                transition: "all 0.2s ease",
                                background: isReallyActive ? "#52525b" : "transparent", // Zinc 600
                                color: isReallyActive ? "#ffffff" : "#a1a1aa", // White vs Zinc 400
                                fontWeight: isReallyActive ? 600 : 500,
                                border: "1px solid transparent"
                            }}
                            onMouseOver={(e) => {
                                if (!isReallyActive) {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.05)"
                                    e.currentTarget.style.color = "#f4f4f5"
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!isReallyActive) {
                                    e.currentTarget.style.background = "transparent"
                                    e.currentTarget.style.color = "#a1a1aa"
                                }
                            }}
                        >
                            <span style={{ fontSize: "1.2rem", filter: isReallyActive ? "none" : "grayscale(30%)" }}>{item.icon}</span>
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>

            <div style={{ marginTop: "auto", borderTop: "1px solid #3f3f46", paddingTop: "1.5rem" }}>
                {!isCollapsed ? (
                    <div style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>
                        Logged in as<br />
                        <strong style={{ color: "#f8fafc" }}>Admin User</strong>
                    </div>
                ) : (
                    <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#a1a1aa" }}>
                        AU
                    </div>
                )}
            </div>
        </aside>
    )
}
