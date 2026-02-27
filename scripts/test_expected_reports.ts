import { prisma } from '../src/lib/db'

async function testExpectedReports() {
    console.log("Fetching tracked reports...");
    const trackedReports = await prisma.annualReport.findMany();
    console.log(`Found ${trackedReports.length} tracked reports.`);

    console.log("Fetching recurring entities...");
    const recurringEntities = await prisma.entity.findMany({
        where: { hasRecurringAnnualReport: true },
        select: {
            id: true,
            // @ts-ignore
            recurringReportFrequency: true,
            // @ts-ignore
            recurringReportDueMonth: true,
            // @ts-ignore
            recurringReportDueDay: true
        }
    });
    console.log(`Found ${recurringEntities.length} entities with recurring reports enabled.`);

    const currentYear = new Date().getFullYear().toString();

    const expectedReports = recurringEntities.map(entity => {
        const hasReportThisYear = trackedReports.some(r => r.entityId === entity.id && r.year === currentYear);
        if (hasReportThisYear) return null;

        let dueDate: Date | null = null;
        // @ts-ignore
        if (entity.recurringReportDueMonth && entity.recurringReportDueDay) {
            // @ts-ignore
            dueDate = new Date(parseInt(currentYear), entity.recurringReportDueMonth - 1, entity.recurringReportDueDay);
        }

        return {
            entityId: entity.id,
            status: 'EXPECTED',
            // @ts-ignore
            frequency: entity.recurringReportFrequency,
            dueDate
        }
    }).filter(Boolean);

    console.log(`Generated ${expectedReports.length} expected reports for ${currentYear}:`);
    console.dir(expectedReports, { depth: null });
}

testExpectedReports()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
