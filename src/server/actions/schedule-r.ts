'use server'

import { prisma } from "@/lib/db";

export type ScheduleRData = {
    disregardedCount: number;
    disregardedEntities: any[];
    relatedTaxExemptCount: number;
    relatedTaxExemptOrgs: any[];
    relatedPartnershipCount: number;
    relatedPartnerships: any[];
    relatedCorpTrustCount: number;
    relatedCorpsTrusts: any[];
    unrelatedPartnershipCount: number;
    unrelatedPartnerships: any[];
    transactionCount: number;
    reportableTransactionCount: number;
    transactions: any[];
    totalTransactionVolume: number;
    supportingOrgCount: number;
    supportingOrgs: any[];
};

export async function generateScheduleR(filingEntityId: string): Promise<ScheduleRData> {
    // 1. Fetch the Filing Entity and its Relationships (Owners and Subsidiaries)
    // We need recursive control, but for now we look at direct relationships + brother/sister via common parent.
    const filer = await prisma.entity.findUnique({
        where: { id: filingEntityId },
        include: {
            subsidiaries: { include: { childEntity: true } }, // Entities we own
            owners: { include: { ownerEntity: { include: { subsidiaries: { include: { childEntity: true } } } } } }, // Entities that own us (Parent) + their other kids (Brother/Sister)
            transactionsOut: { include: { toEntity: true } },
            transactionsIn: { include: { fromEntity: true } }
        }
    });

    if (!filer) throw new Error("Filing Entity not found");

    const relatedEntities = new Map<string, any>();

    // Helper to add entity
    const addFn = (e: any, relationType: string, percentage: number, parentName: string) => {
        if (e.id === filer.id) return;
        if (!relatedEntities.has(e.id)) {
            relatedEntities.set(e.id, { ...e, _relation: relationType, _percentage: percentage, parentName });
        }
    };

    // A. Downstream (Subsidiaries)
    filer.subsidiaries.forEach(sub => {
        // defined as > 50% for control, usually.
        if (sub.percentage > 50) {
            addFn(sub.childEntity, 'SUBSIDIARY', sub.percentage, filer.legalName);
        }
    });

    // B. Upstream (Parents)
    filer.owners.forEach(owner => {
        if (owner.ownerEntity) {
            if (owner.percentage > 50) {
                addFn(owner.ownerEntity, 'PARENT', owner.percentage, owner.ownerEntity.legalName);
            }
            // C. Brother/Sister (Common Control)
            // If Parent owns > 50% of ME, and > 50% of THEM, we are brother/sister.
            if (owner.percentage > 50) {
                owner.ownerEntity.subsidiaries.forEach(sibling => {
                    if (sibling.percentage > 50 && sibling.childEntityId !== filer.id) {
                        addFn(sibling.childEntity, 'BROTHER_SISTER', sibling.percentage, owner.ownerEntity.legalName); // Parent is the common link
                    }
                });
            }
        }
    });

    // 2. Categorize into Parts
    const partI_Disregarded: any[] = [];
    const partII_RelatedExempt: any[] = [];
    const partIII_Partnerships: any[] = [];
    const partIV_CorpsTrusts: any[] = [];

    relatedEntities.forEach(e => {
        const type = e.entityType || '';
        const taxClass = e.taxClassification || '';

        // Logic 1: Part I Disregarded
        // Usually single member LLCs treated as branches. 
        if (taxClass === 'Disregarded' || (type.includes('LLC') && e._percentage === 100)) {
            addToList(partI_Disregarded, e);
        }
        // Logic 2: Part II Related Exempt
        // Must be 501(c) type
        else if (type.includes('501(c)') || taxClass === 'Exempt') {
            addToList(partII_RelatedExempt, e);
        }
        // Logic 3: Part III Partnerships
        else if (type.includes('Partnership') || taxClass.includes('Partnership')) {
            addToList(partIII_Partnerships, e);
        }
        // Logic 4: Part IV Corps
        else {
            addToList(partIV_CorpsTrusts, e);
        }
    });

    function addToList(list: any[], e: any) {
        list.push({
            id: e.id,
            legalName: e.legalName,
            ownershipPercentage: e._percentage,
            parentName: e.parentName
        });
    }

    // 3. Part V Transactions
    // Threshold: > $50,000 for 501(c)(3)s
    const THRESHOLD = 50000;

    // Flatten transactions
    const rawTransactions = [
        ...filer.transactionsOut.map(t => ({
            ...t,
            direction: 'OUT',
            otherEntity: t.toEntity,
        })),
        ...filer.transactionsIn.map(t => ({
            ...t,
            direction: 'IN',
            otherEntity: t.fromEntity
        }))
    ];

    const transactions: any[] = [];
    let totalTransactionVolume = 0;
    let reportableTransactionCount = 0;

    rawTransactions.forEach(t => {
        // Must be with a Related Organization (Part I-IV)
        if (relatedEntities.has(t.otherEntity.id)) {
            const isReportable = (t.amount || 0) >= THRESHOLD;

            if (isReportable) reportableTransactionCount++;
            totalTransactionVolume += (t.amount || 0);

            transactions.push({
                id: t.id,
                amount: t.amount,
                description: t.description,
                fromEntity: t.direction === 'OUT' ? filer : t.otherEntity,
                toEntity: t.direction === 'OUT' ? t.otherEntity : filer,
                isReportable
            });
        }
    });

    // Sort transactions by amount desc
    transactions.sort((a, b) => (b.amount || 0) - (a.amount || 0));

    return {
        disregardedCount: partI_Disregarded.length,
        disregardedEntities: partI_Disregarded,
        relatedTaxExemptCount: partII_RelatedExempt.length,
        relatedTaxExemptOrgs: partII_RelatedExempt,
        relatedPartnershipCount: partIII_Partnerships.length,
        relatedPartnerships: partIII_Partnerships,
        relatedCorpTrustCount: partIV_CorpsTrusts.length,
        relatedCorpsTrusts: partIV_CorpsTrusts,
        unrelatedPartnershipCount: 0,
        unrelatedPartnerships: [],
        transactionCount: transactions.length,
        reportableTransactionCount,
        transactions,
        totalTransactionVolume,
        supportingOrgCount: 0,
        supportingOrgs: []
    };
}
