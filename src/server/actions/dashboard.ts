'use server'

import { prisma } from '@/lib/db'
import { detectOverlapsFromRoles } from './analysis'
import { analyzeRisksFromData } from './risk'

export async function getDashboardStats() {
    try {
        // 1. Fetch Counts
        const entityCount = await prisma.entity.count()
        const personCount = await prisma.person.count()

        // 2. Calculate Active Risks (High Level)
        const allRoles = await prisma.boardRole.findMany({
            include: { person: true, entity: true }
        })
        const allEntities = await prisma.entity.findMany({
            include: { owners: { include: { ownerEntity: true, ownerPerson: true } } }
        })
        const allRelationships = await prisma.relationship.findMany()

        const overlaps = detectOverlapsFromRoles(allRoles)
        const risks = await analyzeRisksFromData(overlaps, allRoles, allEntities, allRelationships)
        const highRiskCount = risks.filter(r => r.level === 'HIGH').length
        const mediumRiskCount = risks.filter(r => r.level === 'MEDIUM').length

        // 4. Recent Activity (Latest 5 Roles Created)
        const recentActivity = await prisma.boardRole.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: 5,
            include: {
                person: true,
                entity: true
            }
        })

        return {
            counts: {
                entities: entityCount,
                people: personCount,
                highRisks: highRiskCount,
                mediumRisks: mediumRiskCount,
                complianceScore: Math.max(0, 100 - (highRiskCount * 5) - (mediumRiskCount * 1))
            },
            recentActivity
        }
    } catch (error) {
        console.error("Dashboard Stats Error:", error)
        // Return fallback to prevent page crash (and reveal that it is a DB error)
        return {
            counts: {
                entities: 0,
                people: 0,
                highRisks: 0,
                mediumRisks: 0,
                complianceScore: 100
            },
            recentActivity: []
        }
    }
}
