
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Verifying Schedule R Data...')

    const transactions = await prisma.relatedTransaction.findMany({
        include: { fromEntity: true, toEntity: true }
    })
    console.log(`Transactions Found: ${transactions.length}`)
    transactions.forEach(t => {
        console.log(` - ${t.amount} from ${t.fromEntity.legalName} to ${t.toEntity.legalName} (${t.type})`)
    })

    const taxable = await prisma.entity.findMany({
        where: { ownershipPercentage: { not: null } }
    })
    console.log(`Taxable Entities with Ownership Found: ${taxable.length}`)
    taxable.forEach(e => {
        console.log(` - ${e.legalName}: ${e.ownershipPercentage}%`)
    })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
