
import { prisma } from '@/lib/db'

export type OverlapResult = {
    entity1: { id: string, name: string, type: string }
    entity2: { id: string, name: string, type: string }
    sharedPeople: { id: string, name: string, roles1: string[], roles2: string[] }[]
    overlapCount: number
}

// Helper to check if two time ranges overlap
function checkTimeOverlap(
    start1: Date | null, end1: Date | null,
    start2: Date | null, end2: Date | null
): boolean {
    const s1 = start1 ? start1.getTime() : -Infinity
    const e1 = end1 ? end1.getTime() : Infinity
    const s2 = start2 ? start2.getTime() : -Infinity
    const e2 = end2 ? end2.getTime() : Infinity

    return Math.max(s1, s2) <= Math.min(e1, e2)
}

import { BoardRole, Person, Entity } from '@prisma/client'

type RoleWithRelations = BoardRole & {
    person: Person
    entity: Entity & { legalName: string, entityType: string }
}

export function detectOverlapsFromRoles(roles: RoleWithRelations[]): OverlapResult[] {
    // Group by Person
    const personRoles = new Map<string, RoleWithRelations[]>()
    roles.forEach(role => {
        if (!personRoles.has(role.personId)) {
            personRoles.set(role.personId, [])
        }
        personRoles.get(role.personId)!.push(role)
    })

    // Find Overlaps
    const overlaps = new Map<string, OverlapResult>()

    personRoles.forEach((roles, personId) => {
        const entities = Array.from(new Set(roles.map(r => r.entityId)))
        if (entities.length < 2) return

        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const id1 = entities[i]
                const id2 = entities[j]
                const [e1, e2] = id1 < id2 ? [id1, id2] : [id2, id1]
                const key = `${e1}:${e2}`

                const roles1 = roles.filter(r => r.entityId === e1)
                const roles2 = roles.filter(r => r.entityId === e2)

                // Check for ANY temporal overlap between any role in Entity 1 and Entity 2
                const hasTimeOverlap = roles1.some(r1 =>
                    roles2.some(r2 =>
                        checkTimeOverlap(r1.startDate, r1.endDate, r2.startDate, r2.endDate)
                    )
                )

                if (!hasTimeOverlap) continue

                if (!overlaps.has(key)) {
                    const role1 = roles1[0]
                    const role2 = roles2[0]
                    overlaps.set(key, {
                        entity1: {
                            id: role1.entity.id,
                            name: role1.entity.legalName,
                            type: role1.entity.entityType
                        },
                        entity2: {
                            id: role2.entity.id,
                            name: role2.entity.legalName,
                            type: role2.entity.entityType
                        },
                        sharedPeople: [],
                        overlapCount: 0
                    })
                }

                const overlap = overlaps.get(key)!
                // Need to filter display roles to only show relevant ones? 
                // For simplicity, showing all titles held by this person in these entities
                const personName = `${roles[0].person.firstName} ${roles[0].person.lastName}`

                if (!overlap.sharedPeople.find(p => p.id === personId)) {
                    overlap.sharedPeople.push({
                        id: personId,
                        name: personName,
                        roles1: roles1.map(r => r.title),
                        roles2: roles2.map(r => r.title)
                    })
                    overlap.overlapCount++
                }
            }
        }
    })

    return Array.from(overlaps.values()).sort((a, b) => b.overlapCount - a.overlapCount)
}

export async function detectOverlaps(startStr?: string, endStr?: string): Promise<OverlapResult[]> {
    const start = startStr ? new Date(startStr) : new Date()
    const end = endStr ? new Date(endStr) : start

    // Fetch active roles in the range
    const roles = await prisma.boardRole.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { startDate: null },
                        { startDate: { lte: end } }
                    ]
                },
                {
                    OR: [
                        { endDate: null },
                        { endDate: { gte: start } }
                    ]
                }
            ]
        },
        include: {
            person: true,
            entity: true
        },
    })

    return detectOverlapsFromRoles(roles)
}
