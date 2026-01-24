import { prisma } from '@/lib/db'
import SimulationClient from './SimulationClient'
import Link from 'next/link'

export default async function SimulationPage() {
    const people = await prisma.person.findMany({
        select: { id: true, firstName: true, lastName: true },
        orderBy: { lastName: 'asc' }
    })

    const entities = await prisma.entity.findMany({
        select: { id: true, legalName: true },
        orderBy: { legalName: 'asc' }
    })

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem" }}>
                <Link href="/compliance" style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                    ← Back to Compliance Center
                </Link>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "0.5rem" }}>
                    <div>
                        <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>What-If Scenario Planner</h1>
                        <p style={{ color: "var(--muted-foreground)" }}>
                            Simulate board changes to forecast risk impacts without affecting live data.
                        </p>
                    </div>
                </div>
            </header>

            <SimulationClient initialPeople={people} initialEntities={entities} />
        </div>
    )
}
