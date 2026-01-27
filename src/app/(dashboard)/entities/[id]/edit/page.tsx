
import { getEntity, getEntities } from '@/server/actions/entities'
import { getPeople } from '@/server/actions/people'
import EditEntityForm from './EditEntityForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function EditEntityPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const entity = await getEntity(id)
    const allEntities = await getEntities()
    const allPeople = await getPeople()

    if (!entity) {
        notFound()
    }

    return (
        <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem" }}>
                <Link href="/entities" style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                    ← Back to Entities
                </Link>
                <h1 style={{ marginTop: "0.5rem" }}>Edit Entity: {entity.legalName}</h1>
            </header>

            <EditEntityForm entity={entity} allEntities={allEntities} allPeople={allPeople} />
        </div>
    )
}
