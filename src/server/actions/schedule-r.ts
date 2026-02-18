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
    const unrelatedPartnershipsMap = new Map<string, any>();

    // Helper to add entity
    const addFn = (e: any, relationType: string, percentage: number, parentName: string) => {
        if (e.id === filer.id) return;
        if (!relatedEntities.has(e.id)) {
            relatedEntities.set(e.id, { ...e, _relation: relationType, _percentage: percentage, parentName });
        }
    };

    // A. Downstream (Subsidiaries)
    filer.subsidiaries.forEach(sub => {
        // Control: >50% Ownership OR Power to Appoint Board
        // If we appoint their board, we control them.
        const isControlled = sub.percentage > 50 || sub.childEntity.parentAppointsGoverningBody;

        if (isControlled) {
            addFn(sub.childEntity, 'SUBSIDIARY', sub.percentage, filer.legalName);
        } else if (sub.percentage > 5) {
            // Part VI Check: Unrelated Partnership (> 5% but not controlled)
            // Must be treated as a partnership (LLC or Partnership)
            const type = sub.childEntity.entityType || '';
            const tax = sub.childEntity.taxClassification || '';
            const isPartnership = type.includes('Partnership') || tax.includes('Partnership') || type.includes('LLC');

            if (isPartnership) {
                if (!unrelatedPartnershipsMap.has(sub.childEntity.id)) {
                    unrelatedPartnershipsMap.set(sub.childEntity.id, { ...sub.childEntity, _percentage: sub.percentage, parentName: filer.legalName });
                }
            }
        }
    });

    // B. Upstream (Parents)
    filer.owners.forEach(owner => {
        const parentEntity = owner.ownerEntity;
        if (parentEntity) {
            // Control: Owners > 50% OR Parent Appoints Our Board
            // Note: If filer.parentAppointsGoverningBody is true, one of the parents appoints it. 
            // We assume significant owners are the ones likely to have this power.
            const isParentControl = owner.percentage > 50 || filer.parentAppointsGoverningBody;

            if (isParentControl) {
                addFn(parentEntity, 'PARENT', owner.percentage, parentEntity.legalName);
            }

            // C. Brother/Sister (Common Control)
            // If Parent controls ME, and Parent controls THEM, we are brother/sister.
            if (isParentControl) {
                parentEntity.subsidiaries.forEach(sibling => {
                    const siblingEntity = sibling.childEntity;
                    if (siblingEntity.id !== filer.id) {
                        // Check if Parent controls Sibling
                        const parentControlsSibling = sibling.percentage > 50 || siblingEntity.parentAppointsGoverningBody;

                        if (parentControlsSibling) {
                            addFn(siblingEntity, 'BROTHER_SISTER', sibling.percentage, parentEntity.legalName); // Parent is the common link
                        }
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
    const partVI_Unrelated: any[] = [];

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

    // Add Part VI
    unrelatedPartnershipsMap.forEach(e => {
        addToList(partVI_Unrelated, e);
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
    // Threshold: > $100,000 generally
    const GENERAL_THRESHOLD = 100000;
    // Types with $0 Threshold if Controlled (Line 2a-2d)
    const ZERO_THRESHOLD_PATTERNS = ['INTEREST', 'ANNUIT', 'ROYALT', 'RENT'];

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
            const typeUpper = (t.type || '').toUpperCase();
            const descriptionUpper = (t.description || '').toUpperCase();

            // Check for Zero Threshold Types
            const isZeroThresholdType = ZERO_THRESHOLD_PATTERNS.some(p =>
                typeUpper.includes(p) || descriptionUpper.includes(p)
            );

            const isReportable = (t.amount || 0) >= GENERAL_THRESHOLD || (isZeroThresholdType && (t.amount || 0) > 0);

            if (isReportable) reportableTransactionCount++;

            // Note: Total Volume typically includes all related transactions, but for reporting purposes 
            // we often focus on the reportable ones. We will sum all related volume here for completeness.
            totalTransactionVolume += (t.amount || 0);

            transactions.push({
                id: t.id,
                amount: t.amount,
                description: t.description,
                type: t.type,
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
        unrelatedPartnershipCount: partVI_Unrelated.length,
        unrelatedPartnerships: partVI_Unrelated,
        transactionCount: transactions.length,
        reportableTransactionCount,
        transactions,
        totalTransactionVolume,
        supportingOrgCount: 0,
        supportingOrgs: []
    };
}
