'use server'

import { prisma } from '@/lib/db'
import { OverlapResult } from './analysis'
import { detectOverlapsFromRoles } from './analysis'

import { BoardRole, Entity, Person, Relationship, EntityOwner } from '@prisma/client'

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'

export type RiskFlag = {
    id: string
    type: 'SCHEDULE_R' | 'CONFLICT' | 'INDEPENDENCE' | 'CONTROL'
    level: RiskLevel
    message: string
    details?: string
    entity1Id?: string
    entity2Id?: string
    personId?: string
    isNew?: boolean
    // Context names for UI
    entity1Name?: string
    entity2Name?: string
    personName?: string
}

type RoleWithRelations = BoardRole & { person: Person, entity: Entity }
type EntityWithRelations = Entity & {
    owners: (EntityOwner & {
        ownerEntity: Entity | null,
        ownerPerson: Person | null
    })[]
    ownerEntity: Entity | null
    ownerPerson: Person | null
}

export async function analyzeRisksFromData(
    overlaps: OverlapResult[],
    allRoles: RoleWithRelations[],
    allEntities: EntityWithRelations[],
    allRelationships: Relationship[] = [],
    // allTransactions: RelatedTransaction[] = [] // variable unused

): Promise<RiskFlag[]> {
    const risks: RiskFlag[] = []

    // 5-Year Lookback Date for Disqualified Persons (Schedule L)
    const fiveYearsAgo = new Date()
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)


    const getBoardSize = (entityId: string) => {
        return allRoles.filter(r =>
            r.entityId === entityId &&
            (r.roleType === 'DIRECTOR' || r.roleType === 'TRUSTEE') &&
            !r.endDate &&
            r.votingRights
        ).length
    }

    // Helper to check ownership relationship (DIRECT or INDIRECT)
    // Returns the path if found, or null
    const getEffectiveControl = (childId: string, potentialParentId: string): { percentage: number, path: string[] } | null => {
        // BFS for indirect control
        const queue: { id: string, path: string[], pct: number }[] = [{ id: childId, path: [], pct: 100 }]
        const visited = new Set<string>()

        while (queue.length > 0) {
            const current = queue.shift()!
            if (visited.has(current.id)) continue
            visited.add(current.id)

            const currentEntity = allEntities.find(e => e.id === current.id)
            if (!currentEntity) continue

            // Check owners
            for (const owner of currentEntity.owners) {
                if (owner.ownerEntityId) {
                    // Check if this is the target
                    if (owner.ownerEntityId === potentialParentId) {
                        if (owner.percentage > 50) {
                            return { percentage: owner.percentage, path: [...current.path, currentEntity.legalName] }
                        }
                    }
                    // Else add to queue if majority - TRAVERSE UP
                    if (owner.percentage > 50) {
                        queue.push({
                            id: owner.ownerEntityId,
                            path: [...current.path, currentEntity.legalName],
                            pct: owner.percentage
                        })
                    }
                }
            }
        }
        return null
    }

    // Helper to check for common major owner (>50%) or FAMILY GROUP
    const getCommonMajorOwner = (e1: EntityWithRelations, e2: EntityWithRelations) => {
        const e1Owners = e1.owners.filter(o => o.percentage > 50)
        const e2Owners = e2.owners.filter(o => o.percentage > 50)

        for (const o1 of e1Owners) {
            // 1. Entity Owner Match
            if (o1.ownerEntityId) {
                const match = e2Owners.find(o2 => o2.ownerEntityId === o1.ownerEntityId)
                if (match && match.ownerEntity) return { type: 'ENTITY', ...match.ownerEntity, attribution: 'Direct' }
            }

            // 2. Person Owner Match (Direct & Family)
            if (o1.ownerPersonId) {
                // Direct Match
                let match = e2Owners.find(o2 => o2.ownerPersonId === o1.ownerPersonId)
                if (match && match.ownerPerson) {
                    return {
                        type: 'PERSON',
                        legalName: `${match.ownerPerson.firstName} ${match.ownerPerson.lastName}`,
                        id: match.ownerPerson.id,
                        attribution: 'Direct'
                    }
                }

                // Family Attribution Match
                // Look for ANY owner of e2 that is FAMILY with o1.ownerPersonId
                const familyMembers = allRelationships
                    .filter(r =>
                        r.type === 'FAMILY' &&
                        (r.person1Id === o1.ownerPersonId || r.person2Id === o1.ownerPersonId)
                    )
                    .map(r => r.person1Id === o1.ownerPersonId ? r.person2Id : r.person1Id)

                match = e2Owners.find(o2 => o2.ownerPersonId && familyMembers.includes(o2.ownerPersonId))
                if (match && match.ownerPerson) {
                    return {
                        type: 'PERSON',
                        legalName: `${match.ownerPerson.firstName} ${match.ownerPerson.lastName} (Family of Owner)`,
                        id: match.ownerPerson.id,
                        attribution: 'Constructive (Family)'
                    }
                }
            }
        }
        return null
    }

    // 1. Global Ownership & Control Analysis (Prioritized to run independent of overlaps)
    for (let i = 0; i < allEntities.length; i++) {
        for (let j = i + 1; j < allEntities.length; j++) {
            const e1Data = allEntities[i]
            const e2Data = allEntities[j]

            let isRelated = false

            // Check if e1 controls e2 (Direct or Indirect)
            const e1ControlsE2 = getEffectiveControl(e2Data.id, e1Data.id)
            if (e1ControlsE2) {
                const isIndirect = e1ControlsE2.path.length > 0
                risks.push({
                    id: `control-own-${e1Data.id}-${e2Data.id}`,
                    type: 'CONTROL',
                    level: 'INFO',
                    message: `Schedule R Part III: ${e2Data.legalName} is a controlled taxable subsidiary.`,
                    details: isIndirect
                        ? `Indirect Control via ${e1ControlsE2.path.join(' -> ')}. Must report.`
                        : `Direct >50% ownership.`,
                    entity1Id: e1Data.id,
                    entity2Id: e2Data.id,
                    entity1Name: e1Data.legalName,
                    entity2Name: e2Data.legalName
                })
                isRelated = true
            }

            // Check if e2 controls e1
            const e2ControlsE1 = getEffectiveControl(e1Data.id, e2Data.id)
            if (e2ControlsE1) {
                const isIndirect = e2ControlsE1.path.length > 0
                risks.push({
                    id: `control-own-${e2Data.id}-${e1Data.id}`,
                    type: 'CONTROL',
                    level: 'INFO',
                    message: `Schedule R Part III: ${e1Data.legalName} is a controlled taxable subsidiary.`,
                    details: isIndirect
                        ? `Indirect Control via ${e2ControlsE1.path.join(' -> ')}. Must report.`
                        : `Direct >50% ownership.`,
                    entity1Id: e2Data.id,
                    entity2Id: e1Data.id,
                    entity1Name: e2Data.legalName,
                    entity2Name: e1Data.legalName
                })
                isRelated = true
            }

            // Check if they are brother-sister (Common Major Owner)
            if (isRelated === false) { // Don't double flag

                const commonParent = getCommonMajorOwner(e1Data, e2Data)
                if (commonParent) {
                    const parentName = commonParent.legalName
                    const attrib = commonParent.attribution || 'Direct'

                    risks.push({
                        id: `brother-sister-${e1Data.id}-${e2Data.id}`,
                        type: 'SCHEDULE_R',
                        level: 'INFO',
                        message: `Brother-Sister Relationship: ${e1Data.legalName} & ${e2Data.legalName}.`,
                        details: `Common Control Group via ${attrib} Ownership (${parentName}).`,
                        entity1Id: e1Data.id,
                        entity2Id: e2Data.id,
                        entity1Name: e1Data.legalName,
                        entity2Name: e2Data.legalName
                    })
                    isRelated = true
                }
            }
        }
    }

    // 2. Overlap Analysis
    for (const overlap of overlaps) {
        const { entity1, entity2, sharedPeople, overlapCount } = overlap

        const size1 = getBoardSize(entity1.id)
        const size2 = getBoardSize(entity2.id)

        const e1Data = allEntities.find(e => e.id === entity1.id)
        const e2Data = allEntities.find(e => e.id === entity2.id)

        if (!e1Data || !e2Data) continue

        // Quick check for relationship to contextuallize board overlap
        const isRelated = !!(
            getEffectiveControl(e2Data.id, e1Data.id) ||
            getEffectiveControl(e1Data.id, e2Data.id) ||
            getCommonMajorOwner(e1Data, e2Data)
        )

        // Board Overlap Control
        if (size1 > 0 && overlapCount / size1 > 0.5) {
            risks.push({
                id: `control-board-${entity1.id}-${entity2.id}`,
                type: 'CONTROL',
                level: isRelated ? 'INFO' : 'HIGH',
                message: isRelated
                    ? `Verified Common Control: ${entity1.name} (Subsidiary) & ${entity2.name} (Parent/Sister).`
                    : `Potential Common Control: ${entity1.name} has >50% board overlap with ${entity2.name}.`,
                details: isRelated
                    ? `Governance structure is consistent with ownership relationship.`
                    : `${overlapCount}/${size1} members overlapping. May trigger "Related Organization" status via governance vs ownership.`,
                entity1Id: entity1.id,
                entity2Id: entity2.id,
                entity1Name: entity1.name,
                entity2Name: entity2.name
            })
        }

        if (size2 > 0 && overlapCount / size2 > 0.5) {
            risks.push({
                id: `control-board-${entity2.id}-${entity1.id}`,
                type: 'CONTROL',
                level: isRelated ? 'INFO' : 'HIGH',
                message: isRelated
                    ? `Verified Common Control: ${entity2.name} (Subsidiary) & ${entity1.name} (Parent/Sister).`
                    : `Potential Common Control: ${entity2.name} has >50% board overlap with ${entity1.name}.`,
                details: isRelated
                    ? `Governance structure is consistent with ownership relationship.`
                    : `${overlapCount}/${size2} members overlapping.`,
                entity1Id: entity2.id,
                entity2Id: entity1.id,
                entity1Name: entity2.name,
                entity2Name: entity1.name
            })
        }

        // Schedule R Disclosure (Info level for any overlap)
        risks.push({
            id: `sch-r-${entity1.id}-${entity2.id}`,
            type: 'SCHEDULE_R',
            level: 'INFO',
            message: `Overlap detected between ${entity1.name} and ${entity2.name}.`,
            details: `Check if this requires listing on Form 990 Schedule R Part IV if considered "Related".`,
            entity1Id: entity1.id,
            entity2Id: entity2.id,
            entity1Name: entity1.name,
            entity2Name: entity2.name
        })


        // Schedule C Risk (Political/Lobbying)
        const isC3_1 = entity1.type === '501(c)(3)'
        const isC3_2 = entity2.type === '501(c)(3)'
        const isPolitical_1 = ['501(c)(4)', '527'].includes(entity1.type)
        const isPolitical_2 = ['501(c)(4)', '527'].includes(entity2.type)

        if ((isC3_1 && isPolitical_2) || (isC3_2 && isPolitical_1)) {
            risks.push({
                id: `sch-c-${entity1.id}-${entity2.id}`,
                type: 'SCHEDULE_R',
                level: 'HIGH',
                message: `Schedule C Risk: 501(c)(3) overlapping with ${entity1.type === '501(c)(3)' ? entity2.type : entity1.type}.`,
                details: `Strict separation required. Shared directors create risk of impermissible political intervention or private benefit attribution.`,
                entity1Id: entity1.id,
                entity2Id: entity2.id,
                entity1Name: entity1.name,
                entity2Name: entity2.name
            })
        }

        // Conflict of Interest / Compensation
        for (const person of sharedPeople) {
            const compensatedRoles = allRoles.filter(r =>
                r.personId === person.id &&
                (r.entityId === entity1.id || r.entityId === entity2.id) &&
                r.isCompensated
            )

            if (compensatedRoles.length > 0) {
                risks.push({
                    id: `conflict-${person.id}-${entity1.id}-${entity2.id}`,
                    type: 'CONFLICT',
                    level: 'MEDIUM',
                    message: `Compensated Interlock: ${person.name} is compensated.`,
                    details: `Person receives compensation from ${compensatedRoles.length} of the overlapping entities. Review for private inurement or intermediate sanctions risk.`,
                    personId: person.id,
                    personName: person.name,
                    entity1Name: entity1.name,
                    entity2Name: entity2.name
                })
            }
        }
    }

    // 4. Independence Checks (Global)
    for (const entity of allEntities) {
        if (entity.entityType === '501(c)(3)') {
            const directors = allRoles.filter(r =>
                r.entityId === entity.id &&
                (r.roleType === 'DIRECTOR' || r.roleType === 'TRUSTEE' || r.roleType === 'OFFICER') &&
                (!r.endDate || r.endDate >= fiveYearsAgo) && // 5-Year Lookback
                r.votingRights
            )
            const currentDirectors = directors.filter(r => !r.endDate)
            const totalBoard = currentDirectors.length
            if (totalBoard === 0 && directors.length === 0) continue

            let nonIndependentCount = 0

            // Iterate over ALL Disqualified Persons (Current + Former) for Conflict Checks
            for (const directorRole of directors) {
                let isIndependent = true
                const isFormer = !!directorRole.endDate
                const personLabel = isFormer ? `Former ${directorRole.title} (Lookback)` : directorRole.title || 'Director'

                // A. Compensation Test (Only affects independence if current, but we track logic)
                if (directorRole.isCompensated && !isFormer) {
                    isIndependent = false
                }

                // B. Relationship Test (Applies to both for Schedule L)
                if (allRelationships.length > 0) {
                    // Check against CURRENT key people for business relationships
                    const otherKeyPeople = allRoles.filter(r =>
                        r.entityId === entity.id &&
                        r.personId !== directorRole.personId &&
                        !r.endDate // Only care about relationships with CURRENT power players
                    ).map(r => r.personId)

                    const hasDisqualifyingRelationship = allRelationships.some(rel =>
                        (rel.person1Id === directorRole.personId && otherKeyPeople.includes(rel.person2Id)) ||
                        (rel.person2Id === directorRole.personId && otherKeyPeople.includes(rel.person1Id))
                    )

                    if (hasDisqualifyingRelationship && !isFormer) {
                        isIndependent = false
                    }

                    if (hasDisqualifyingRelationship) { // Flag for Schedule L even if former
                        const busRel = allRelationships.find(rel =>
                            rel.type === 'BUSINESS' &&
                            ((rel.person1Id === directorRole.personId && otherKeyPeople.includes(rel.person2Id)) ||
                                (rel.person2Id === directorRole.personId && otherKeyPeople.includes(rel.person1Id)))
                        )

                        if (busRel) {
                            risks.push({
                                id: `sch-l-${entity.id}-${directorRole.personId}`,
                                type: 'CONFLICT',
                                level: 'MEDIUM',
                                message: `Potential Schedule L Transaction: ${directorRole.person.firstName} ${directorRole.person.lastName} (${personLabel})`,
                                details: `${personLabel} has a reported Business Relationship with a current key person at ${entity.legalName}.`,
                                entity1Id: entity.id,
                                personId: directorRole.personId,
                                entity1Name: entity.legalName,
                                personName: `${directorRole.person.firstName} ${directorRole.person.lastName}`
                            })
                        }
                    }
                }

                if (!isIndependent && !isFormer) {
                    nonIndependentCount++
                }
            }

            if (totalBoard > 0 && nonIndependentCount / totalBoard > 0.49) {
                risks.push({
                    id: `indep-${entity.id}`,
                    type: 'INDEPENDENCE',
                    level: 'HIGH',
                    message: `Low Board Independence at ${entity.legalName}.`,
                    details: `${nonIndependentCount}/${totalBoard} members are not independent.`,
                    entity1Id: entity.id,
                    entity1Name: entity.legalName
                })
            }
        }

        // 5. Parent Checks
        // Check if ANY parent appoints board
        if (entity.parentAppointsGoverningBody) {
            // We don't have exact "which parent" if boolean is simple, usually implies major owner
            // If we have owners, we can guess or warn generically
            risks.push({
                id: `control-appoint-${entity.id}`,
                type: 'CONTROL',
                level: 'HIGH',
                message: `Parent Control: Power to Appoint.`,
                details: `Governing documents indicate a Parent has power to appoint the board of ${entity.legalName}.`,
                entity1Id: entity.id,
                entity1Name: entity.legalName
            })
        }
    }

    return risks
}

// Modification type for simulation
export type SimulationModification = {
    type: 'ADD' | 'REMOVE' | 'ADD_RELATIONSHIP' | 'REMOVE_RELATIONSHIP'
    personId: string
    entityId?: string
    title?: string
    roleType?: string
    isCompensated?: boolean
    votingRights?: boolean
    person2Id?: string
    relType?: string
}

export async function analyzeRisks(overlaps: OverlapResult[]): Promise<RiskFlag[]> {
    const allRoles: RoleWithRelations[] = await prisma.boardRole.findMany({
        include: { person: true, entity: true }
    })

    const allEntities = await prisma.entity.findMany({
        include: { owners: { include: { ownerEntity: true, ownerPerson: true } } }
    }) as unknown as EntityWithRelations[]

    const allRelationships = await prisma.relationship.findMany()

    return analyzeRisksFromData(overlaps, allRoles, allEntities, allRelationships)
}

export async function simulateRisks(modifications: SimulationModification[]) {
    let roles = await prisma.boardRole.findMany({
        include: {
            person: true,
            entity: true
        }
    })

    const allEntities = await prisma.entity.findMany({
        include: { owners: { include: { ownerEntity: true, ownerPerson: true } } }
    }) as unknown as EntityWithRelations[]

    let allRelationships = await prisma.relationship.findMany()

    const baseRoles = [...roles]
    const baseOverlaps = detectOverlapsFromRoles(baseRoles)
    const baseRisks = await analyzeRisksFromData(baseOverlaps, baseRoles, allEntities, allRelationships)
    const baseRiskIds = new Set(baseRisks.map(r => r.id))

    // Application of mods (omitted details for brevity as they are unchanged usually, but copying logic)
    const additions = modifications.filter(m => m.type === 'ADD')
    const removals = modifications.filter(m => m.type === 'REMOVE')
    const relAdditions = modifications.filter(m => m.type === 'ADD_RELATIONSHIP')
    const relRemovals = modifications.filter(m => m.type === 'REMOVE_RELATIONSHIP')

    for (const mod of removals) {
        roles = roles.filter(r => !(r.personId === mod.personId && r.entityId === mod.entityId))
    }

    for (const mod of additions) {
        if (roles.find(r => r.personId === mod.personId && r.entityId === mod.entityId)) continue

        const person = await prisma.person.findUnique({ where: { id: mod.personId } })
        const entity = await prisma.entity.findUnique({ where: { id: mod.entityId } })

        if (person && entity) {
            const virtualRole: RoleWithRelations = {
                id: `virtual-${Math.random()}`,
                personId: person.id,
                entityId: entity.id,
                title: mod.title || 'Director',
                roleType: (mod.roleType as string) || 'DIRECTOR',
                isCompensated: mod.isCompensated ?? false,
                votingRights: mod.votingRights ?? true,
                startDate: new Date(),
                endDate: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                person: person,
                entity: entity,
                appointmentDocUrl: null,
                resignationDocUrl: null
            }
            roles.push(virtualRole)
        }
    }

    for (const mod of relRemovals) {
        if (!mod.person2Id) continue
        allRelationships = allRelationships.filter(r =>
            !((r.person1Id === mod.personId && r.person2Id === mod.person2Id) ||
                (r.person1Id === mod.person2Id && r.person2Id === mod.personId))
        )
    }

    for (const mod of relAdditions) {
        if (!mod.person2Id || !mod.relType) continue
        const exists = allRelationships.some(r =>
            (r.person1Id === mod.personId && r.person2Id === mod.person2Id) ||
            (r.person1Id === mod.person2Id && r.person2Id === mod.personId)
        )
        if (exists) continue

        allRelationships.push({
            id: `virtual-rel-${Math.random()}`,
            person1Id: mod.personId,
            person2Id: mod.person2Id,
            type: mod.relType,
            details: 'Simulated Relationship',
            createdAt: new Date(),
            updatedAt: new Date()
        })
    }

    const overlaps = detectOverlapsFromRoles(roles)
    const risks = await analyzeRisksFromData(overlaps, roles, allEntities, allRelationships)

    const risksWithFlag = risks.map(r => ({
        ...r,
        isNew: !baseRiskIds.has(r.id)
    }))

    return {
        risks: risksWithFlag,
        overlaps
    }
}

export async function getScheduleRSummary(startDate?: Date, endDate?: Date) {
    // 1. Fetch all owners table entries where pct > 50
    // We join with Entity to get details
    const controlOwners = await prisma.entityOwner.findMany({
        where: {
            percentage: { gt: 50 },
            childEntity: { entityType: { not: '501(c)(3)' } }
        },
        include: {
            childEntity: true,
            ownerEntity: true,
            ownerPerson: true
        }
    })

    const getParentName = (o: any) => {
        return o.ownerEntity
            ? o.ownerEntity.legalName
            : (o.ownerPerson ? `${o.ownerPerson.firstName} ${o.ownerPerson.lastName}` : 'Unknown')
    }

    // Part I: Disregarded Entities (100% Ownership)
    // Map to a struct that looks like an Entity for the UI
    const disregardedEntities = controlOwners
        .filter(o => o.percentage === 100)
        .map(o => ({
            ...o.childEntity,
            ownershipPercentage: o.percentage, // Helper for UI
            parentName: getParentName(o)
        }))

    // Part III: Taxable Related Orgs (>50% but <100%)
    const taxableRelatedOrgs = controlOwners
        .filter(o => o.percentage < 100)
        .map(o => ({
            ...o.childEntity,
            ownershipPercentage: o.percentage,
            parentName: getParentName(o)
        }))


    // 2. Financial Transactions (Part V)
    const transactionFilter: any = {}
    if (startDate && endDate) {
        transactionFilter.date = {
            gte: startDate,
            lte: endDate
        }
    }

    const allTransactions = await prisma.relatedTransaction.findMany({
        where: transactionFilter,
        include: { fromEntity: true, toEntity: true },
        orderBy: { amount: 'desc' }
    })

    // Calculate Aggregates per Entity Pair (to catch "multiple small transactions" rule)
    const pairTotals = new Map<string, number>()
    for (const t of allTransactions) {
        // Sort IDs to treat A->B and B->A as the same "relationship" for aggregation volume
        const ids = [t.fromEntityId, t.toEntityId].sort()
        const key = `${ids[0]}-${ids[1]}`
        const amount = t.amount || 0
        pairTotals.set(key, (pairTotals.get(key) || 0) + amount)
    }

    const transactions = allTransactions.map(t => {
        const ids = [t.fromEntityId, t.toEntityId].sort()
        const key = `${ids[0]}-${ids[1]}`
        const totalPairAmount = pairTotals.get(key) || 0

        // Reportable if SINGLE > 50k OR AGGREGATE > 100k
        const isReportable = (t.amount || 0) >= 50000 || totalPairAmount >= 100000

        return {
            ...t,
            isReportable,
            aggregateTotal: totalPairAmount
        }
    })

    const reportableTransactionCount = transactions.filter(t => t.isReportable).length
    const totalTransactionVolume = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)

    // 3. Supporting Orgs (Part I - specialized)
    const supportingOrgs = await prisma.entity.findMany({
        where: {
            supportingOrgType: { not: null }
        },
        select: { id: true, legalName: true, supportingOrgType: true }
    })

    return {
        disregardedCount: disregardedEntities.length,
        disregardedEntities,
        taxableCount: taxableRelatedOrgs.length,
        taxableRelatedOrgs,
        transactionCount: transactions.length,
        reportableTransactionCount,
        transactions,
        totalTransactionVolume,
        supportingOrgCount: supportingOrgs.length,
        supportingOrgs
    }
}
