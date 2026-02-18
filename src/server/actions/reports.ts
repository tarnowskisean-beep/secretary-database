'use server'

import { prisma } from '@/lib/db'
import Papa from 'papaparse'

export async function generateEntityBoardReport(status: 'ACTIVE' | 'INACTIVE' | 'ALL' = 'ALL') {
    const whereClause: any = {}

    if (status === 'ACTIVE') {
        whereClause.OR = [
            { endDate: null },
            { endDate: { gt: new Date() } }
        ]
    } else if (status === 'INACTIVE') {
        whereClause.endDate = { lte: new Date() }
    }

    const roles = await prisma.boardRole.findMany({
        where: whereClause,
        include: {
            entity: true,
            person: true
        },
        orderBy: [
            { entity: { legalName: 'asc' } },
            { person: { lastName: 'asc' } }
        ]
    })

    const data = roles.map(role => ({
        EntityName: role.entity.legalName,
        EIN: role.entity.ein || '',
        EntityType: role.entity.entityType,
        StateOfInc: role.entity.stateOfIncorporation || '',
        TaxClassification: role.entity.taxClassification || '',
        // FiscalYearEnd removed per user request
        SupportingOrgType: role.entity.supportingOrgType || '',
        ParentAppointsBoard: role.entity.parentAppointsGoverningBody ? 'Yes' : 'No',
        DirectorName: `${role.person.firstName} ${role.person.lastName}`,
        PersonInternalID: role.person.internalId || '',
        RoleTitle: role.title,
        RoleType: role.roleType,
        VotingRights: role.votingRights ? 'Yes' : 'No',
        Compensated: role.isCompensated ? 'Yes' : 'No',
        StartDate: role.startDate ? role.startDate.toISOString().split('T')[0] : '',
        EndDate: role.endDate ? role.endDate.toISOString().split('T')[0] : 'Active'
    }))

    return Papa.unparse(data)
}

export async function generatePersonBoardReport(status: 'ACTIVE' | 'INACTIVE' | 'ALL' = 'ALL') {
    const whereClause: any = {}

    if (status === 'ACTIVE') {
        whereClause.OR = [
            { endDate: null },
            { endDate: { gt: new Date() } }
        ]
    } else if (status === 'INACTIVE') {
        whereClause.endDate = { lte: new Date() }
    }

    const roles = await prisma.boardRole.findMany({
        where: whereClause,
        include: {
            person: true,
            entity: true
        },
        orderBy: [
            { person: { lastName: 'asc' } },
            { entity: { legalName: 'asc' } }
        ]
    })

    // Normalize data for people report
    const data = roles.map(role => ({
        PersonName: `${role.person.lastName}, ${role.person.firstName}`,
        InternalID: role.person.internalId || '',
        EntityName: role.entity.legalName,
        EIN: role.entity.ein || '',
        RoleTitle: role.title,
        RoleType: role.roleType,
        StartDate: role.startDate ? role.startDate.toISOString().split('T')[0] : '',
        EndDate: role.endDate ? role.endDate.toISOString().split('T')[0] : 'Active',
        VotingRights: role.votingRights ? 'Yes' : 'No',
        Compensated: role.isCompensated ? 'Yes' : 'No'
    }))

    return Papa.unparse(data)
}

export async function getReportData(status: 'ACTIVE' | 'INACTIVE' | 'ALL' = 'ALL') {
    const whereClause: any = {}

    if (status === 'ACTIVE') {
        whereClause.OR = [
            { endDate: null },
            { endDate: { gt: new Date() } }
        ]
    } else if (status === 'INACTIVE') {
        whereClause.endDate = { lte: new Date() }
    }

    const data = await prisma.entity.findMany({
        orderBy: { legalName: 'asc' },
        include: {
            roles: {
                where: whereClause,
                include: {
                    person: true
                },
                orderBy: {
                    person: { lastName: 'asc' }
                }
            }
        }
    })
    return data
}
export async function getPersonReportData(personId: string) {
    const person = await prisma.person.findUnique({
        where: { id: personId },
        include: {
            roles: {
                include: { entity: true },
                orderBy: { startDate: 'desc' }
            },
            relationshipsAsPerson1: {
                include: { person2: true }
            },
            relationshipsAsPerson2: {
                include: { person1: true }
            }
        }
    })

    if (!person) return null

    // Process relationships
    const relationships = [
        ...person.relationshipsAsPerson1.map(r => ({
            otherPerson: `${r.person2.firstName} ${r.person2.lastName}`,
            type: r.type,
            details: r.details
        })),
        ...person.relationshipsAsPerson2.map(r => ({
            otherPerson: `${r.person1.firstName} ${r.person1.lastName}`,
            type: r.type,
            details: r.details
        }))
    ]

    return {
        firstName: person.firstName,
        lastName: person.lastName,
        internalId: person.internalId,
        roles: person.roles.map(r => ({
            entity: r.entity.legalName,
            title: r.title,
            type: r.roleType,
            start: r.startDate ? r.startDate.toLocaleDateString() : '',
            end: r.endDate ? r.endDate.toLocaleDateString() : 'Active',
            voting: r.votingRights,
            compensated: r.isCompensated
        })),
        relationships
    }
}

export async function getEntityReportData(entityId: string) {
    const entity = await prisma.entity.findUnique({
        where: { id: entityId },
        include: {
            roles: {
                include: { person: true },
                orderBy: { title: 'asc' }
            },
            transactionsOut: { include: { toEntity: true } },
            transactionsIn: { include: { fromEntity: true } },
            owners: { include: { ownerEntity: true, ownerPerson: true } },
            subsidiaries: { include: { childEntity: true } }
        }
    })

    if (!entity) return null

    return entity
}

export async function fetchImageBase64(url: string) {
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch image')

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString('base64')
        const contentType = response.headers.get('content-type') || 'image/png'

        return `data:${contentType};base64,${base64}`
    } catch (e) {
        console.error("Server image fetch failed", e)
        return null
    }
}
