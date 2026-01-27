import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Starting soft reset (keeping Users)...')

    // Transactional deletion to ensure consistency
    // Order matters for some databases, but CASCADE usually handles it. 
    // We delete "join" tables or dependent tables first to be safe and explicit.

    console.log('Deleting Audit Logs...')
    await prisma.auditLog.deleteMany({})

    console.log('Deleting Transactions...')
    await prisma.relatedTransaction.deleteMany({})

    console.log('Deleting Ownerships...')
    await prisma.entityOwner.deleteMany({})

    console.log('Deleting Board Roles...')
    await prisma.boardRole.deleteMany({})

    console.log('Deleting Relationships...')
    await prisma.relationship.deleteMany({})

    console.log('Deleting Person Aliases...')
    await prisma.personAlias.deleteMany({})

    // Now delete core entities
    console.log('Deleting Entities...')
    await prisma.entity.deleteMany({})

    console.log('Deleting People...')
    await prisma.person.deleteMany({})

    console.log('✅ Data cleared successfully. Users table preserved.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
