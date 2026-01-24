'use server'

import { prisma } from '@/lib/db'
import Papa from 'papaparse'

export async function generateEntityBoardReport() {
    const roles = await prisma.boardRole.findMany({
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
        EntityType: role.entity.entityType,
        DirectorName: `${role.person.firstName} ${role.person.lastName}`,
        RoleTitle: role.title,
        RoleType: role.roleType,
        VotingRights: role.votingRights ? 'Yes' : 'No',
        Compensated: role.isCompensated ? 'Yes' : 'No',
        StartDate: role.startDate ? role.startDate.toISOString().split('T')[0] : '',
        EndDate: role.endDate ? role.endDate.toISOString().split('T')[0] : 'Active'
    }))

    return Papa.unparse(data)
}

export async function generatePersonBoardReport() {
    const roles = await prisma.boardRole.findMany({
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
        EntityName: role.entity.legalName,
        RoleTitle: role.title,
        StartDate: role.startDate ? role.startDate.toISOString().split('T')[0] : '',
        EndDate: role.endDate ? role.endDate.toISOString().split('T')[0] : 'Active'
    }))

    return Papa.unparse(data)
}

export async function getReportData() {
    const data = await prisma.entity.findMany({
        orderBy: { legalName: 'asc' },
        include: {
            roles: {
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
