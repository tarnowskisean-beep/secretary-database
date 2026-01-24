
import { describe, it, expect, vi } from 'vitest'
import { analyzeRisks } from '@/server/actions/risk'
import { OverlapResult } from '@/server/actions/analysis'

// Mock Prisma
vi.mock('@/lib/db', () => ({
    prisma: {
        boardRole: {
            count: vi.fn(),
            findMany: vi.fn(),
        },
        entity: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
        person: {
            findUnique: vi.fn(),
        },
        relationship: {
            findMany: vi.fn().mockResolvedValue([]),
        }
    }
}))

import { prisma } from '@/lib/db'

describe('Risk Engine', () => {

    it('should detect Control Risk when overlap > 50%', async () => {
        // Mock Roles to determine board size
        // valid 'size' requires DIRECTOR/TRUSTEE and no endDate
        const mockRoles = [
            { entityId: 'e1', roleType: 'DIRECTOR', endDate: null, votingRights: true, person: { id: 'p1', firstName: 'D1', lastName: 'L1' } },
            { entityId: 'e1', roleType: 'DIRECTOR', endDate: null, votingRights: true, person: { id: 'p2', firstName: 'D2', lastName: 'L2' } },
            { entityId: 'e1', roleType: 'DIRECTOR', endDate: null, votingRights: true, person: { id: 'p3', firstName: 'D3', lastName: 'L3' } },
            { entityId: 'e1', roleType: 'DIRECTOR', endDate: null, votingRights: true, person: { id: 'p4', firstName: 'D4', lastName: 'L4' } },
            { entityId: 'e1', roleType: 'DIRECTOR', endDate: null, votingRights: true, person: { id: 'p5', firstName: 'D5', lastName: 'L5' } }, // Size 5
        ]
        vi.mocked(prisma.boardRole.findMany).mockResolvedValue(mockRoles as unknown as import('@prisma/client').BoardRole[])
        vi.mocked(prisma.entity.findMany).mockResolvedValue([])

        // Mock Overlap: 3 out of 5 shared
        const overlaps: OverlapResult[] = [{
            entity1: { id: 'e1', name: 'Parent', type: 'c3' },
            entity2: { id: 'e2', name: 'Sub', type: 'c3' },
            overlapCount: 3,
            sharedPeople: []
        }]

        const risks = await analyzeRisks(overlaps)

        expect(risks).toEqual(expect.arrayContaining([
            expect.objectContaining({ type: 'CONTROL', level: 'HIGH' })
        ]))
    })

    it('should detect Schedule R disclosure for any overlap', async () => {
        vi.mocked(prisma.boardRole.findMany).mockResolvedValue([])
        vi.mocked(prisma.entity.findMany).mockResolvedValue([])

        const overlaps: OverlapResult[] = [{
            entity1: { id: 'e1', name: 'A', type: 'c3' },
            entity2: { id: 'e2', name: 'B', type: 'c3' },
            overlapCount: 1, // 10% overlap (low)
            sharedPeople: []
        }]

        const risks = await analyzeRisks(overlaps)

        expect(risks).toEqual(expect.arrayContaining([
            expect.objectContaining({ type: 'SCHEDULE_R', level: 'INFO' })
        ]))
    })

    it('should detect Independence Risk if compensated members are majority', async () => {
        // Mock 5 total members, 3 compensated
        vi.mocked(prisma.boardRole.findMany).mockResolvedValue([
            { entityId: 'e1', roleType: 'DIRECTOR', endDate: null, votingRights: true, isCompensated: true, person: { id: 'p1', firstName: 'D1', lastName: 'L1' } },
            { entityId: 'e1', roleType: 'DIRECTOR', endDate: null, votingRights: true, isCompensated: true, person: { id: 'p2', firstName: 'D2', lastName: 'L2' } },
            { entityId: 'e1', roleType: 'DIRECTOR', endDate: null, votingRights: true, isCompensated: true, person: { id: 'p3', firstName: 'D3', lastName: 'L3' } },
            { entityId: 'e1', roleType: 'DIRECTOR', endDate: null, votingRights: true, isCompensated: false, person: { id: 'p4', firstName: 'D4', lastName: 'L4' } },
            { entityId: 'e1', roleType: 'DIRECTOR', endDate: null, votingRights: true, isCompensated: false, person: { id: 'p5', firstName: 'D5', lastName: 'L5' } },
        ] as unknown as import('@prisma/client').BoardRole[])

        // Mock entity list
        vi.mocked(prisma.entity.findMany).mockResolvedValue([
            { id: 'e1', legalName: 'Charity', entityType: '501(c)(3)', owners: [] } as unknown as import('@prisma/client').Entity
        ])


        const risks = await analyzeRisks([])

        expect(risks).toEqual(expect.arrayContaining([
            expect.objectContaining({ type: 'INDEPENDENCE', level: 'HIGH' })
        ]))
    })

    it('should detect Brother-Sister overlap (Common Control Group)', async () => {
        vi.mocked(prisma.boardRole.findMany).mockResolvedValue([])

        // Mock entities sharing same parent
        vi.mocked(prisma.entity.findMany).mockResolvedValue([
            {
                id: 'sub1',
                legalName: 'Sub A',
                owners: [{ ownerEntityId: 'parent-id', percentage: 100, ownerEntity: { id: 'parent-id', legalName: 'Parent' } }]
            } as unknown as import('@prisma/client').Entity,
            {
                id: 'sub2',
                legalName: 'Sub B',
                owners: [{ ownerEntityId: 'parent-id', percentage: 100, ownerEntity: { id: 'parent-id', legalName: 'Parent' } }]
            } as unknown as import('@prisma/client').Entity
        ])

        const overlaps: OverlapResult[] = [{
            entity1: { id: 'sub1', name: 'Sub A', type: 'c3' },
            entity2: { id: 'sub2', name: 'Sub B', type: 'c3' },
            overlapCount: 2,
            sharedPeople: []
        }]

        const risks = await analyzeRisks(overlaps)

        expect(risks).toEqual(expect.arrayContaining([
            expect.objectContaining({
                type: 'SCHEDULE_R',
                message: expect.stringContaining('Brother-Sister Overlap')
            })
        ]))
    })

    it('should correctly simulate adding a role', async () => {
        // Base state: 1 existing role with full relations
        vi.mocked(prisma.boardRole.findMany).mockResolvedValue([
            {
                personId: 'p1',
                entityId: 'e1',
                roleType: 'DIRECTOR',
                endDate: null,
                votingRights: true,
                person: { id: 'p1', firstName: 'John', lastName: 'Doe' },
                entity: { id: 'e1', legalName: 'Entity 1', entityType: '501(c)(3)', owners: [] }
            }
        ] as unknown as import('@prisma/client').BoardRole[])
        vi.mocked(prisma.entity.findMany).mockResolvedValue([])

        // Mock Person/Entity lookup for simulation hydration
        vi.mocked(prisma.person.findUnique).mockResolvedValue({ id: 'p1', firstName: 'John', lastName: 'Doe' } as unknown as import('@prisma/client').Person)
        vi.mocked(prisma.entity.findUnique).mockResolvedValue({ id: 'e2', legalName: 'New Entity' } as unknown as import('@prisma/client').Entity)

        const { simulateRisks } = await import('@/server/actions/risk')

        const result = await simulateRisks([{
            type: 'ADD',
            personId: 'p1',
            entityId: 'e2', // Check for overlap between e1 and e2
            roleType: 'DIRECTOR'
        }])

        // Should detect overlap between e1 and e2
        expect(result.overlaps).toHaveLength(1)
        expect(result.overlaps[0].overlapCount).toBe(1)

        // Should trigger Schedule R warning
        expect(result.risks).toEqual(expect.arrayContaining([
            expect.objectContaining({ type: 'SCHEDULE_R' })
        ]))
    })
    it('should correctly simulate adding a relationship', async () => {
        // Base state: 3 independent directors
        vi.mocked(prisma.boardRole.findMany).mockResolvedValue([
            { entityId: 'e1', roleType: 'DIRECTOR', endDate: null, votingRights: true, personId: 'p1', person: { id: 'p1', firstName: 'D1' } },
            { entityId: 'e1', roleType: 'DIRECTOR', endDate: null, votingRights: true, personId: 'p2', person: { id: 'p2', firstName: 'D2' } },
            { entityId: 'e1', roleType: 'DIRECTOR', endDate: null, votingRights: true, personId: 'p3', person: { id: 'p3', firstName: 'D3' } }
        ] as unknown as import('@prisma/client').BoardRole[])

        vi.mocked(prisma.entity.findMany).mockResolvedValue([
            { id: 'e1', legalName: 'Entity 1', entityType: '501(c)(3)', owners: [] } as unknown as import('@prisma/client').Entity
        ])

        vi.mocked(prisma.relationship.findMany).mockResolvedValue([])

        const { simulateRisks } = await import('@/server/actions/risk')

        const result = await simulateRisks([{
            type: 'ADD_RELATIONSHIP',
            personId: 'p1',
            person2Id: 'p2', // Simulating Family relationship between D1 and D2
            relType: 'FAMILY'
        }])

        // Should trigger Independence Risk because 2/3 directors are now "Related" (not independent)
        expect(result.risks).toEqual(expect.arrayContaining([
            expect.objectContaining({ type: 'INDEPENDENCE', level: 'HIGH' })
        ]))
    })
})
