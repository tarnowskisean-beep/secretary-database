export const dynamic = 'force-dynamic'

import { getPeople } from '@/server/actions/people'
import Link from 'next/link'
import PeopleGrid from '@/components/PeopleGrid'

export default async function PeoplePage() {
    const people = await getPeople()

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>People</h1>
                <Link
                    href="/people/new"
                    className="btn btn-primary"
                    style={{ textDecoration: "none" }}
                >
                    Add Person
                </Link>
            </header>

            <PeopleGrid people={people} />
        </div>
    )
}
