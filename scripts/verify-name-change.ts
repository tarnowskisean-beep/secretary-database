
import { prisma } from '../src/lib/db'
import { changePersonName } from '../src/server/actions/people'
import { changeEntityName } from '../src/server/actions/entities'

async function run() {
    console.log("Starting Verification...")

    // 1. Setup Person
    const person = await prisma.person.create({
        data: { firstName: "Test", lastName: "Original" }
    })
    console.log("Created Person:", person.id)

    // 2. Change Person Name
    console.log("Changing Person Name...")
    const fd = new FormData()
    fd.append('personId', person.id)
    fd.append('firstName', "Test")
    fd.append('lastName', "Changed")
    fd.append('effectiveDate', new Date().toISOString())
    // Mock document
    fd.append('documentUrl', "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")

    await changePersonName({} as any, fd)

    // 3. Verify
    const updatedPerson = await prisma.person.findUnique({
        where: { id: person.id },
        include: { nameChanges: true }
    })

    if (updatedPerson?.lastName !== "Changed") {
        throw new Error("Person name did not update!")
    }
    if (updatedPerson.nameChanges.length !== 1) {
        throw new Error("History record not created!")
    }
    console.log("Person Verification Passed ✅")

    // 4. Setup Entity
    const entity = await prisma.entity.create({
        data: { legalName: "Original Corp", entityType: "C-CORP" }
    })
    console.log("Created Entity:", entity.id)

    // 5. Change Entity Name
    console.log("Changing Entity Name...")
    const fdEntity = new FormData()
    fdEntity.append('entityId', entity.id)
    fdEntity.append('legalName', "Changed Corp")

    await changeEntityName({} as any, fdEntity)

    // 6. Verify
    const updatedEntity = await prisma.entity.findUnique({
        where: { id: entity.id },
        include: { nameChanges: true }
    })

    if (updatedEntity?.legalName !== "Changed Corp") {
        throw new Error("Entity name did not update!")
    }
    if (updatedEntity.nameChanges.length !== 1) {
        throw new Error("Entity history not created!")
    }
    console.log("Entity Verification Passed ✅")

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
