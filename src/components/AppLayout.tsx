'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    return (
        <div style={{ display: "flex" }}>
            <Sidebar isCollapsed={isCollapsed} toggle={() => setIsCollapsed(!isCollapsed)} />
            <main
                style={{
                    flex: 1,
                    marginLeft: isCollapsed ? "70px" : "260px",
                    minHeight: "100vh",
                    transition: "margin-left 0.3s ease",
                    width: "100%"
                }}
            >
                {children}
            </main>
        </div>
    )
}
