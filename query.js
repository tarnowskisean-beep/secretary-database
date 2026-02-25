const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const types = await prisma.entity.findMany({
    select: { entityType: true },
    distinct: ['entityType']
  })
  console.log(types)
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
