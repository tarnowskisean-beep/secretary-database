
import { getEntities, getUniqueStates } from '@/server/actions/entities'
import Link from 'next/link'
import EntityFilter from '@/components/EntityFilter'
import EntitiesGrid from '@/components/EntitiesGrid'

export default async function EntitiesPage({ searchParams }: { searchParams: Promise<{ type?: string, state?: string }> }) {
    const filters = await searchParams
    const [entities, states] = await Promise.all([
        getEntities(filters),
        getUniqueStates()
    ])

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h1>Entities</h1>
                    <Link
                        href="/entities/new"
                        className="btn btn-primary"
                        style={{ textDecoration: "none" }}
                    >
                        Add Entity
                    </Link>
                </div>
                <EntityFilter states={states} />
            </header>

            <EntitiesGrid entities={entities} />
        </div>
    )
}
