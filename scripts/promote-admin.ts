import { prisma } from '@/lib/db'

async function main() {
    const users = await prisma.user.findMany()
    console.log("Found users:", users)

    if (users.length > 0) {
        const firstUser = users[0]
        console.log(`Promoting ${firstUser.email} to ADMIN...`)

        await prisma.user.update({
            where: { id: firstUser.id },
            data: { role: 'ADMIN' }
        })
        console.log("Success!")
    } else {
        console.log("No users found.")
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
