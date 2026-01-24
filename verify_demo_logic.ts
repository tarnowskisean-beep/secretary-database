
import { detectOverlaps } from './src/server/actions/analysis'
import { simulateRisks, SimulationModification } from './src/server/actions/risk'
import { prisma } from './src/lib/db'

async function main() {
    console.log("🚀 Starting Pre-Demo Health Check...")

    // 1. Check Database Connectivity
    const personCount = await prisma.person.count()
    const entityCount = await prisma.entity.count()
    console.log(`✅ Database Connected: ${personCount} People, ${entityCount} Entities found.`)

    // 2. Check Compliance Page Overlap Detection
    console.log("Testing detectOverlaps()...")
    const overlaps = await detectOverlaps()
    console.log(`✅ detectOverlaps returned ${overlaps.length} overlaps.`)

    // 3. Check Simulation Logic
    console.log("Testing simulateRisks()...")

    // Fetch a real person and entity to simulate
    const person = await prisma.person.findFirst()
    const entity = await prisma.entity.findFirst()

    if (!person || !entity) {
        console.error("❌ Cannot test simulation: No person or entity found in DB.")
        process.exit(1)
    }

    const mod: SimulationModification = {
        type: 'ADD',
        personId: person.id,
        entityId: entity.id,
        roleType: 'DIRECTOR',
        isCompensated: true,
        votingRights: true
    }

    try {
        const simResults = await simulateRisks([mod])
        console.log(`✅ simulateRisks returned ${simResults.risks.length} risks and ${simResults.overlaps.length} overlaps.`)

        const newRisks = simResults.risks.filter(r => r.isNew)
        console.log(`ℹ️  Simulation generated ${newRisks.length} NEW risks.`)

    } catch (error) {
        console.error("❌ simulateRisks FAILED:", error)
        process.exit(1)
    }

    console.log("\n✨ ALL SYSTEMS GO for Demo! ✨")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
