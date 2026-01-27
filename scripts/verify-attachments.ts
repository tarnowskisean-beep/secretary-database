
import { prisma } from '../src/lib/db'
import { createAttachment, deleteAttachment } from '../src/server/actions/attachments'

async function run() {
    console.log("Starting Attachment Verification...")

    // 1. Setup Person
    const person = await prisma.person.create({
        data: { firstName: "Test", lastName: "Attach" }
    })
    console.log("Created Person:", person.id)

    // 2. Add Attachment to Person
    console.log("Adding Attachment to Person...")
    const fd = new FormData()
    fd.append('title', "Test Doc")
    fd.append('url', "https://example.com/doc")
    fd.append('personId', person.id)

    let connectRes;
    try {
        connectRes = await createAttachment(null, fd)
    } catch (e: any) {
        if (e.message.includes('revalidatePath') || e.message.includes('cookies')) {
            console.log("Ignored expected Next.js context error")
            connectRes = { success: true }
        } else {
            throw e
        }
    }

    // Check if result returned failure despite error catch (if action caught it)
    if (connectRes && !connectRes.success) {
        // Action caught the error and returned object
        // If it failed due to context, we might assume success for DB check
        // But let's see. 
    }

    // 3. Verify
    const updatedPerson = await prisma.person.findUnique({
        where: { id: person.id },
        include: { attachments: true }
    })

    if (updatedPerson?.attachments.length !== 1) throw new Error("Attachment not found on Person")
    const attId = updatedPerson.attachments[0].id
    console.log("Person Attachment Verified ✅")

    // 4. Delete Attachment
    await deleteAttachment(attId, `/people/${person.id}`)
    const checkDeleted = await prisma.attachment.findUnique({ where: { id: attId } })
    if (checkDeleted) throw new Error("Attachment not deleted")
    console.log("Person Attachment Deletion Verified ✅")


    // 5. Setup Entity
    const entity = await prisma.entity.create({
        data: { legalName: "Attach Corp", entityType: "LLC" }
    })

    // 6. Add Attachment to Entity
    console.log("Adding Attachment to Entity...")
    const fdE = new FormData()
    fdE.append('title', "Entity Doc")
    fdE.append('url', "https://drive.google.com/file/d/123")
    fdE.append('entityId', entity.id)

    let connectResE;
    try {
        connectResE = await createAttachment(null, fdE)
    } catch (e: any) {
        if (e.message.includes('revalidatePath') || e.message.includes('cookies')) {
            console.log("Ignored expected Next.js context error")
            connectResE = { success: true }
        } else {
            throw e
        }
    }

    // 7. Verify
    const updatedEntity = await prisma.entity.findUnique({
        where: { id: entity.id },
        include: { attachments: true }
    })

    if (updatedEntity?.attachments.length !== 1) throw new Error("Attachment not found on Entity")
    console.log("Entity Attachment Verified ✅")

    // Cleanup
    await prisma.person.delete({ where: { id: person.id } })
    await prisma.entity.delete({ where: { id: entity.id } })
    console.log("Cleanup Done.")
}

run()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
