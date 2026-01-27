
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding comprehensive real-world data (Schedule R Updated)...')

    // Clean up
    await prisma.relatedTransaction.deleteMany()
    await prisma.boardRole.deleteMany()
    await prisma.relationship.deleteMany()
    await prisma.personAlias.deleteMany()
    await prisma.person.deleteMany()
    await prisma.entity.deleteMany()

    // 1. Create Entities (Updated with Ownership & Types)
    const entitiesData = [
        { acronym: 'CPI', name: 'Conservative Partnership Institute, Inc.', type: '501(c)(3)' },
        { acronym: 'AFL', name: 'America First Legal Foundation', type: '501(c)(3)' },
        { acronym: 'SFCN', name: 'State Freedom Caucus Network, Inc.', type: '501(c)(3)' },
        { acronym: 'SFCF', name: 'State Freedom Caucus Foundation', type: '501(c)(3)' },
        { acronym: 'PPO', name: 'Personnel Policy Operations, Inc.', type: '501(c)(3)' },
        { acronym: 'EINA', name: 'Election Integrity Action, Inc.', type: '501(c)(4)' },
        { acronym: 'CFS', name: 'Citizens for Sanity, Inc.', type: '501(c)(3)' },
        { acronym: 'AMSI', name: 'The American Main Street Initiative, Inc.', type: '501(c)(3)' },
        { acronym: 'AAF', name: 'American Accountability Foundation', type: '501(c)(3)' },
        // For-Profit Subsidiaries (Ownership examples)
        { acronym: 'CPRO', name: 'Compass Professional, Inc.', type: 'For-Profit', ownership: 100 },
        { acronym: 'CLG', name: 'Compass Legal Group, Inc.', type: 'For-Profit', ownership: 49 },
        { acronym: 'CPM', name: 'Compass Property Management, Inc.', type: 'For-Profit' },

        { acronym: 'CPCI', name: 'Conservative Partnership Campus, Inc.', type: '501(c)(3)' },
        { acronym: 'CPIN', name: 'Conservative Partnership Initiative, Inc.', type: '501(c)(3)' },
        { acronym: 'CRA', name: 'Center for Renewing America, Inc.', type: '501(c)(3)' },
        { acronym: 'CFRA', name: 'Citizens for Renewing America, Inc.', type: '501(c)(4)' },
        { acronym: 'AM', name: 'American Moment', type: '501(c)(3)' },
        { acronym: 'CRDF', name: 'Constitutional Rights Defense Fund', type: '501(c)(3)' },
        { acronym: 'AVRF', name: 'American Voting Rights Foundation', type: '501(c)(3)' },
        { acronym: 'FAIR', name: 'Foundation for Accountability, Integrity, and Research in Elections Fund', type: '501(c)(3)' },
        { acronym: 'AAFA', name: 'American Accountability Foundation Action, Inc.', type: '501(c)(4)' },
        { acronym: 'CPNT', name: 'Conservative Partnership International, Inc.', type: '501(c)(3)' },
        { acronym: 'RMCF', name: 'Renew Massachusetts Coalition Foundation, Inc.', type: '501(c)(3)' },
        { acronym: 'RMC', name: 'Renew Massachusetts Coalition, Inc.', type: '501(c)(4)' },
        { acronym: 'EIN', name: 'Election Integrity Network, Inc.', type: '501(c)(3)' },
        { acronym: 'CSF', name: 'The CongressStrong Foundation', type: '501(c)(3)' },
        { acronym: 'CSA', name: 'CongressStrong Action, Inc.', type: '501(c)(4)' },
        { acronym: 'CSTRA', name: 'Compass Strategies, Inc.', type: 'For-Profit' },
        { acronym: 'SLF', name: 'State Leadership Foundation', type: '501(c)(3)' },
        { acronym: 'SLI', name: 'Semper Libertas Inc.', type: '501(c)(3)' },
        { acronym: 'SLA', name: 'Semper Libertas Action, Inc.', type: '501(c)(4)' },
        { acronym: 'IAP', name: 'Immigration Accountability Project', type: '501(c)(3)' },
    ]

    const entityMap = new Map()
    let counter = 100
    for (const e of entitiesData) {
        counter++
        const entity = await prisma.entity.create({
            data: {
                legalName: e.name,
                entityType: e.type,
                ein: `00-0000${counter}`,
                taxClassification: e.type === 'For-Profit' ? 'C-Corp' : 'Exempt',
                stateOfIncorporation: 'DE',
                // New Schedule R Fields
                primaryActivity: 'Public Policy Research & Education',
                legalDomicile: 'DC',
                exemptCodeSection: e.type.includes('501') ? e.type : null,
                publicCharityStatus: e.type === '501(c)(3)' ? '170(b)(1)(A)(vi)' : null,
                isSection512Controlled: false,
                predominantIncomeType: 'Program',
                shareOfTotalIncome: 0,
                shareOfEndOfYearAssets: 0,
                ubtiAmount: 0
            }
        })
        entityMap.set(e.acronym, entity.id)
    }

    // Link ownerships after creating all entities
    // Hardcoding some parent-subsidiary relationships based on acronyms for seed data
    // Link ownerships after creating all entities
    // Hardcoding some parent-subsidiary relationships based on acronyms for seed data
    const cpiOwnerId = entityMap.get('CPI')
    if (cpiOwnerId) {
        const subs = ['CPRO', 'CLG', 'CPM']
        for (const subAc of subs) {
            const subId = entityMap.get(subAc)
            if (subId) {
                const subData = entitiesData.find(e => e.acronym === subAc)
                // Start with CPI owning them
                await prisma.entityOwner.create({
                    data: {
                        childEntityId: subId,
                        ownerEntityId: cpiOwnerId,
                        percentage: subData?.ownership || 100
                    }
                })
            }
        }
    }
    console.log(`Created ${entitiesData.length} entities.`)


    // 2. People Data Holders
    const rawBoardRoles = [
        { acronym: 'AAF', name: 'Brian Darling', start: '4/7/2022', end: '' },
        { acronym: 'AAF', name: 'Ed Corrigan', start: '1/21/2021', end: '4/7/2022' },
        { acronym: 'AAF', name: 'Tom Jones', start: '1/21/2021', end: '' },
        { acronym: 'AAF', name: 'Tripp Baird', start: '4/7/2022', end: '' },
        { acronym: 'AAF', name: 'Wesley Denton', start: '1/21/2021', end: '4/7/2022' },
        { acronym: 'AAFA', name: 'Rober Donachie', start: '12/8/2023', end: '' },
        { acronym: 'AAFA', name: 'Tom Jones', start: '12/8/2023', end: '' },
        { acronym: 'AAFA', name: 'Tripp Baird', start: '12/8/2023', end: '' },
        { acronym: 'AFL', name: 'Blake Masters', start: '12/22/2022', end: '' },
        { acronym: 'AFL', name: 'Ed Corrigan', start: '3/8/2021', end: '' },
        { acronym: 'AFL', name: 'Gene Hamilton', start: '6/7/2025', end: '' },
        { acronym: 'AFL', name: 'Gene Hamilton', start: '3/8/2021', end: '1/20/2025' },
        { acronym: 'AFL', name: 'John Zadrozny', start: '', end: '' },
        { acronym: 'AFL', name: 'Mark Meadows', start: '3/8/2021', end: '12/22/2022' },
        { acronym: 'AFL', name: 'Matt Whitaker', start: '3/8/2021', end: '1/20/2025' },
        { acronym: 'AFL', name: 'Rebecca Hamilton', start: '2/24/2025', end: '' },
        { acronym: 'AFL', name: 'Reed Rubinstein', start: '2/24/2025', end: '5/15/2025' },
        { acronym: 'AFL', name: 'Russ Vought', start: '3/8/2021', end: '1/20/2025' },
        { acronym: 'AFL', name: 'Stephen Miller', start: '3/8/2021', end: '1/20/2025' },
        { acronym: 'AFL', name: 'Wesley Denton', start: '3/8/2021', end: '12/22/2022' },
        { acronym: 'AFL', name: 'Wesley Denton', start: '2/24/2025', end: '' },
        { acronym: 'AM', name: 'Jack Mercier', start: '7/14/2020', end: '' },
        { acronym: 'AM', name: 'Nick Solheim', start: '7/14/2020', end: '' },
        { acronym: 'AM', name: 'Saurabh Sharma', start: '7/14/2020', end: '' },
        { acronym: 'AMSI', name: 'Ed Corrigan', start: '11/10/2021', end: '' },
        { acronym: 'AMSI', name: 'Jeff Anderson', start: '11/10/2021', end: '' },
        { acronym: 'AMSI', name: 'Peter Rough', start: '11/10/2021', end: '' },
        { acronym: 'AVRF', name: 'Russ Vought', start: '7/28/2021', end: '12/23/2022' },
        { acronym: 'AVRF', name: 'Stephen Miller', start: '7/28/2021', end: '12/23/2022' },
        { acronym: 'AVRF', name: 'Thomas Datwyler', start: '7/28/2021', end: '12/23/2022' },
        { acronym: 'CFRA', name: 'Ed Corrigan', start: '1/29/2021', end: '' },
        { acronym: 'CFRA', name: 'Jen Baird', start: '1/29/2021', end: '' },
        { acronym: 'CFRA', name: 'Kevin Kookogey', start: '1/29/2021', end: '' },
        { acronym: 'CFRA', name: 'Russ Vought', start: '1/29/2021', end: '1/20/2025' },
        { acronym: 'CFRA', name: 'Wesley Denton', start: '1/29/2021', end: '' },
        { acronym: 'CFS', name: 'Gene Hamilton', start: '6/23/2022', end: '1/20/2025' },
        { acronym: 'CFS', name: 'Ian Prior', start: '6/23/2022', end: '' },
        { acronym: 'CFS', name: 'John Zadrozny', start: '6/23/2022', end: '1/20/2025' },
        { acronym: 'CLG', name: 'Brian Darling', start: '12/16/2022', end: '' },
        { acronym: 'CLG', name: 'Cameron Seward', start: '6/1/2021', end: '' },
        { acronym: 'CLG', name: 'Charlotte Davis', start: '6/1/2021', end: '12/31/2022' },
        { acronym: 'CLG', name: 'Charlotte Davis', start: '6/16/2025', end: '' },
        { acronym: 'CLG', name: 'Cleta Mitchell', start: '6/1/2021', end: '12/16/2022' },
        { acronym: 'CLG', name: 'Cleta Mitchell', start: '3/19/2025', end: '' },
        { acronym: 'CLG', name: 'Don Workman', start: '1/1/2022', end: '' },
        { acronym: 'CLG', name: 'Ed Corrigan', start: '', end: '' },
        { acronym: 'CLG', name: 'Ed Corrigan', start: '', end: '' },
        { acronym: 'CLG', name: 'Gene Hamilton', start: '4/14/2022', end: '1/20/2025' },
        { acronym: 'CLG', name: 'Patrick Corrigan', start: '', end: '' },
        { acronym: 'CLG', name: 'Scott Gast', start: '12/21/2023', end: '12/31/2024' },
        { acronym: 'CLG', name: 'Wesley Denton', start: '', end: '' },
        { acronym: 'CPCI', name: 'Cameron Seward', start: '6/17/2022', end: '12/5/2023' },
        { acronym: 'CPCI', name: 'Ed Corrigan', start: '6/17/2022', end: '12/8/2022' },
        { acronym: 'CPCI', name: 'Ed Corrigan', start: '12/2/2024', end: '' },
        { acronym: 'CPCI', name: 'James Holland', start: '12/5/2023', end: '' },
        { acronym: 'CPCI', name: 'Jim DeMint', start: '6/17/2022', end: '' },
        { acronym: 'CPCI', name: 'Mark Meadows', start: '6/17/2022', end: '' },
        { acronym: 'CPCI', name: 'Patrick Corrigan', start: '', end: '' },
        { acronym: 'CPCI', name: 'Rachel Bovard', start: '6/17/2022', end: '12/31/2022' },
        { acronym: 'CPCI', name: 'Sean Davis', start: '6/17/2022', end: '6/16/2025' },
        { acronym: 'CPCI', name: 'Sean McMahon', start: '6/17/2022', end: '' },
        { acronym: 'CPCI', name: 'Sean McMahon', start: '', end: '' },
        { acronym: 'CPCI', name: 'Wesley Denton', start: '6/17/2022', end: '' },
        { acronym: 'CPI', name: 'Brett Bernhardt', start: '5/22/2017', end: '' },
        { acronym: 'CPI', name: 'Cameron Seward', start: '', end: '' },
        { acronym: 'CPI', name: 'Cameron Seward', start: '', end: '' },
        { acronym: 'CPI', name: 'Charlotte Davis', start: '5/22/2017', end: '6/16/2025' },
        { acronym: 'CPI', name: 'Cleta Mitchell', start: '', end: '' },
        { acronym: 'CPI', name: 'Ed Corrigan', start: '5/22/2017', end: '' },
        { acronym: 'CPI', name: 'Gaston Mooney', start: '5/22/2017', end: '' },
        { acronym: 'CPI', name: 'Jim Demint', start: '5/22/2017', end: '' },
        { acronym: 'CPI', name: 'Mark Meadows', start: '', end: '' },
        { acronym: 'CPI', name: 'Sean Davis', start: '6/16/2025', end: '' },
        { acronym: 'CPI', name: 'Tom Jones', start: '5/22/2017', end: '' },
        { acronym: 'CPI', name: 'Wesley Denton', start: '5/22/2017', end: '' },
        { acronym: 'CPIN', name: 'Angela Seward', start: '9/9/2022', end: '12/5/2023' },
        { acronym: 'CPIN', name: 'Becky Holand', start: '1/20/2025', end: '' },
        { acronym: 'CPIN', name: 'Ed Corrigan', start: '9/9/2022', end: '' },
        { acronym: 'CPIN', name: 'Rober Donachie', start: '9/9/2022', end: '' },
        { acronym: 'CPIN', name: 'Troup Hemenway', start: '12/5/2023', end: '1/20/2025' },
        { acronym: 'CPIN', name: 'Wesley Denton', start: '9/9/2022', end: '' },
        { acronym: 'CPM', name: 'Andrew Roth', start: '1/6/2022', end: '12/31/2024' },
        { acronym: 'CPM', name: 'Cameron Seward', start: '1/6/2022', end: '12/5/2023' },
        { acronym: 'CPM', name: 'Daniel Wolternist', start: '1/6/2022', end: '12/31/2024' },
        { acronym: 'CPM', name: 'Ed Corrigan', start: '1/6/2022', end: '12/1/2022' },
        { acronym: 'CPM', name: 'Hugh Fike', start: '12/5/2023', end: '12/31/2024' },
        { acronym: 'CPM', name: 'Jacob Reses', start: '1/6/2022', end: '12/29/2022' },
        { acronym: 'CPM', name: 'Patrick Corrigan', start: '', end: '' },
        { acronym: 'CPM', name: 'Sean Davis', start: '1/6/2022', end: '12/31/2024' },
        { acronym: 'CPM', name: 'Wesley Denton', start: '1/6/2022', end: '12/31/2024' },
        { acronym: 'CPNT', name: 'Joseph Guy', start: '9/27/2023', end: '1/20/2025' },
        { acronym: 'CPNT', name: 'Justin Ouimette', start: '9/27/2023', end: '' },
        { acronym: 'CPNT', name: 'Mark Meadows', start: '9/27/2023', end: '' },
        { acronym: 'CPNT', name: 'Scott Parkinson', start: '9/27/2023', end: '' },
        { acronym: 'CPNT', name: 'Wesley Denton', start: '9/27/2023', end: '' },
        { acronym: 'CPRO', name: 'Brian Darling', start: '12/5/2023', end: '' },
        { acronym: 'CPRO', name: 'Clint Brown', start: '5/2/2024', end: '' },
        { acronym: 'CPRO', name: 'Ed Corrigan', start: '3/18/2021', end: '12/1/2022' },
        { acronym: 'CPRO', name: 'James Holland', start: '3/18/2021', end: '12/1/2022' },
        { acronym: 'CPRO', name: 'Matthew Buckham', start: '12/5/2023', end: '1/14/2025' },
        { acronym: 'CPRO', name: 'Patrick Corrigan', start: '12/1/2022', end: '' },
        { acronym: 'CPRO', name: 'Patrick Corrigan', start: '', end: '' },
        { acronym: 'CPRO', name: 'Russ Vought', start: '3/18/2021', end: '2/7/2023' },
        { acronym: 'CPRO', name: 'Sean Davis', start: '12/1/2022', end: '12/5/2023' },
        { acronym: 'CPRO', name: 'Sean McMahon', start: '3/18/2021', end: '' },
        { acronym: 'CPRO', name: 'Wesley Denton', start: '3/18/2021', end: '12/5/2023' },
        { acronym: 'CPRO', name: 'Wesley Denton', start: '1/14/2025', end: '12/5/2023' },
        { acronym: 'CRA', name: 'Ed Corrigan', start: '1/20/2021', end: '' },
        { acronym: 'CRA', name: 'Jen Baird', start: '1/20/2021', end: '' },
        { acronym: 'CRA', name: 'Kevin Kookogey', start: '1/20/2021', end: '' },
        { acronym: 'CRA', name: 'Russ Vought', start: '1/20/2021', end: '1/20/2025' },
        { acronym: 'CRA', name: 'Wesley Denton', start: '1/20/2021', end: '' },
        { acronym: 'CRDF', name: 'Thomas Datwyler', start: '3/28/2022', end: '' },
        { acronym: 'CSA', name: 'Bob McEwen', start: '9/5/2024', end: '' },
        { acronym: 'CSA', name: 'James Derderian', start: '9/5/2024', end: '' },
        { acronym: 'CSA', name: 'Matthew Faraci', start: '', end: '' },
        { acronym: 'CSA', name: 'Phil Kiko', start: '9/5/2024', end: '' },
        { acronym: 'CSF', name: 'Eric O\'Keefe', start: '8/8/2024', end: '' },
        { acronym: 'CSF', name: 'John Pallasch', start: '8/8/2024', end: '' },
        { acronym: 'CSF', name: 'Matthew Faraci', start: '8/8/2024', end: '' },
        { acronym: 'CSTRA', name: 'Benjamin Stout', start: '8/8/2024', end: '' },
        { acronym: 'CSTRA', name: 'Ed Corrigan', start: '8/8/2024', end: '' },
        { acronym: 'CSTRA', name: 'Luke Ball', start: '8/8/2024', end: '' },
        { acronym: 'CSTRA', name: 'Timothy Reitz', start: '8/8/2024', end: '' },
        { acronym: 'CSTRA', name: 'Wesley Denton', start: '8/8/2024', end: '' },
        { acronym: 'EIN', name: 'Cleta Mitchell', start: '12/30/2024', end: '' },
        { acronym: 'EIN', name: 'Kerri Toloczko', start: '', end: '' },
        { acronym: 'EIN', name: 'Lynn Taylor', start: '12/30/2024', end: '' },
        { acronym: 'EIN', name: 'Sharon P. Bemis', start: '12/30/2024', end: '' },
        { acronym: 'EIN', name: 'Patrick Corrigan', start: '', end: '' },
        { acronym: 'EINA', name: 'Alexei Wolternist', start: '4/14/2022', end: '7/27/2023' },
        { acronym: 'EINA', name: 'Cleta Mitchell', start: '7/27/2023', end: '' },
        { acronym: 'EINA', name: 'Gene Hamilton', start: '4/14/2022', end: '7/27/2023' },
        { acronym: 'EINA', name: 'Lynn Taylor', start: '7/27/2023', end: '' },
        { acronym: 'EINA', name: 'Patrice Johnson', start: '7/27/2023', end: '' },
        { acronym: 'EINA', name: 'Patrick Corrigan', start: '', end: '' },
        { acronym: 'EINA', name: 'Wade Miller', start: '4/14/2022', end: '7/27/2023' },
        { acronym: 'FAIR', name: 'Cleta Mitchell', start: '6/13/2023', end: '' },
        { acronym: 'FAIR', name: 'Daniel Bean', start: '6/13/2023', end: '' },
        { acronym: 'FAIR', name: 'Don Workman', start: '6/13/2023', end: '' },
        { acronym: 'FAIR', name: 'Heather Honey', start: '6/13/2023', end: '8/11/2025' },
        { acronym: 'FAIR', name: 'Patrick Corrigan', start: '', end: '' },
        { acronym: 'IAP', name: 'Chris Chmielensky', start: '8/23/2024', end: '' },
        { acronym: 'IAP', name: 'Dave Brat', start: '8/23/2024', end: '' },
        { acronym: 'IAP', name: 'Ed Corrigan', start: '8/23/2024', end: '' },
        { acronym: 'IAP', name: 'John Zadrozny', start: '8/23/2024', end: '' },
        { acronym: 'IAP', name: 'Rosemary Jenks', start: '8/23/2024', end: '' },
        { acronym: 'IAP', name: 'Tom Tancredo', start: '8/23/2024', end: '8/24/2024' },
        { acronym: 'IAP', name: 'Wesley Denton', start: '8/23/2024', end: '' },
        { acronym: 'PPO', name: 'Alexei Wolternist', start: '4/14/2021', end: '' },
        { acronym: 'PPO', name: 'Joshua Whitehouse', start: '2/22/2024', end: '' },
        { acronym: 'PPO', name: 'Matthew Buckham', start: '4/14/2021', end: '1/14/2025' },
        { acronym: 'PPO', name: 'Troup Hemenway', start: '4/14/2021', end: '1/20/2025' },
        { acronym: 'RMC', name: 'Andrew Roth', start: '9/30/2024', end: '' },
        { acronym: 'RMC', name: 'Bradford Wyatt', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMC', name: 'Chanel Prunier', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMC', name: 'John Hajjar', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMC', name: 'Justin Ouimette', start: '', end: '' },
        { acronym: 'RMC', name: 'Mark Soukup', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMC', name: 'Patrick Corrigan', start: '', end: '' },
        { acronym: 'RMC', name: 'Ray Ruddy', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMC', name: 'Tom Jones', start: '9/30/2024', end: '' },
        { acronym: 'RMC', name: 'Wade Miller', start: '9/30/2024', end: '' },
        { acronym: 'RMC', name: 'Walter Weld', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMC', name: 'William Gillmeister', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMCF', name: 'Andrew Roth', start: '9/30/2024', end: '' },
        { acronym: 'RMCF', name: 'Bradford Wyatt', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMCF', name: 'Chanel Prunier', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMCF', name: 'John Hajjar', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMCF', name: 'Justin Ouimette', start: '', end: '' },
        { acronym: 'RMCF', name: 'Mark Soukup', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMCF', name: 'Patrick Corrigan', start: '', end: '' },
        { acronym: 'RMCF', name: 'Ray Ruddy', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMCF', name: 'Tom Jones', start: '9/30/2024', end: '' },
        { acronym: 'RMCF', name: 'Wade Miller', start: '9/30/2024', end: '' },
        { acronym: 'RMCF', name: 'Walter Weld', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMCF', name: 'William Gillmeister', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'SFCF', name: 'Andrew Roth', start: '6/24/2022', end: '' },
        { acronym: 'SFCF', name: 'Ed Corrigan', start: '6/24/2022', end: '' },
        { acronym: 'SFCF', name: 'Justin Ouimette', start: '6/24/2022', end: '' },
        { acronym: 'SFCF', name: 'Patrick Corrigan', start: '', end: '' },
        { acronym: 'SFCF', name: 'Timothy Reitz', start: '6/24/2022', end: '' },
        { acronym: 'SFCN', name: 'Andrew Roth', start: '11/17/2021', end: '' },
        { acronym: 'SFCN', name: 'Ed Corrigan', start: '11/17/2021', end: '' },
        { acronym: 'SFCN', name: 'Justin Ouimette', start: '4/12/2022', end: '' },
        { acronym: 'SFCN', name: 'Mark Meadows', start: '11/17/2021', end: '' },
        { acronym: 'SFCN', name: 'Matthew Buckham', start: '11/17/2021', end: '1/14/2025' },
        { acronym: 'SFCN', name: 'Patrick Corrigan', start: '', end: '' },
        { acronym: 'SLA', name: 'Edie Guy', start: '9/17/2024', end: '' },
        { acronym: 'SLA', name: 'L. Mary Thomas', start: '9/17/2024', end: '' },
        { acronym: 'SLA', name: 'Reed Rubinstein', start: '9/17/2024', end: '' },
        { acronym: 'SLF', name: 'Ed Corrigan', start: '11/26/2024', end: '' },
        { acronym: 'SLF', name: 'Kevin D Roberts', start: '1/9/2025', end: '' },
        { acronym: 'SLF', name: 'Nathan Fisher', start: '11/26/2024', end: '' },
        { acronym: 'SLF', name: 'Noah W. Wall', start: '11/26/2024', end: '' },
        { acronym: 'SLF', name: 'Rene Alexander Acosta', start: '11/26/2024', end: '' },
        { acronym: 'SLI', name: 'Edie Guy', start: '8/23/2024', end: '' },
        { acronym: 'SLI', name: 'L. Mary Thomas', start: '8/23/2024', end: '' },
        { acronym: 'SLI', name: 'Reed Rubinstein', start: '8/23/2024', end: '5/19/2025' }
    ]

    const rawOfficerRoles = [
        { acronym: 'AAF', name: 'Brian Darling', title: 'Secretary', start: '12/1/2022', end: '' },
        { acronym: 'AAF', name: 'Ed Corrigan', title: 'Treasurer', start: '1/21/2021', end: '12/1/2022' },
        { acronym: 'AAF', name: 'Tom Jones', title: 'President', start: '1/21/2021', end: '' },
        { acronym: 'AAF', name: 'Tripp Baird', title: 'Treasurer', start: '12/1/2022', end: '' },
        { acronym: 'AAF', name: 'Wesley Denton', title: 'Secretary', start: '1/21/2021', end: '12/1/2022' },
        { acronym: 'AAFA', name: 'Rober Donachie', title: 'Secretary', start: '12/8/2023', end: '' },
        { acronym: 'AAFA', name: 'Tom Jones', title: 'President', start: '12/8/2023', end: '' },
        { acronym: 'AAFA', name: 'Tripp Baird', title: 'Treasurer', start: '12/8/2023', end: '' },
        { acronym: 'AFL', name: 'Gene Hamilton', title: 'President', start: '6/7/2025', end: '' },
        { acronym: 'AFL', name: 'Gene Hamilton', title: 'Vice President, General Counsel, Secretary', start: '3/8/2021', end: '1/20/2025' },
        { acronym: 'AFL', name: 'John Zadrozny', title: 'Key Employee', start: '1/1/2022', end: '' },
        { acronym: 'AFL', name: 'Reed Rubinstein', title: 'President', start: '2/24/2025', end: '5/15/2025' },
        { acronym: 'AFL', name: 'Russ Vought', title: 'Treasurer', start: '3/8/2021', end: '1/20/2025' },
        { acronym: 'AFL', name: 'Stephen Miller', title: 'President, Executive Director', start: '3/8/2021', end: '1/20/2025' },
        { acronym: 'AFL', name: 'Wesley Denton', title: 'Secretary', start: '5/15/2025', end: '' },
        { acronym: 'AM', name: 'Jack Mercier', title: 'Executive Director', start: '7/14/2020', end: '' },
        { acronym: 'AM', name: 'Nick Solheim', title: 'Secretary/Treasurer/Vice President/ Chief Operating Officer', start: '7/14/2020', end: '' },
        { acronym: 'AM', name: 'Saurabh Sharma', title: 'President', start: '7/14/2020', end: '' },
        { acronym: 'AMSI', name: 'Ed Corrigan', title: 'Treasurer', start: '', end: '' },
        { acronym: 'AMSI', name: 'Jeff Anderson', title: 'President', start: '', end: '' },
        { acronym: 'AMSI', name: 'Peter Rough', title: 'Secretary', start: '', end: '' },
        { acronym: 'AVRF', name: 'Russ Vought', title: 'President and Treasurer', start: '7/28/2021', end: '12/23/2022' },
        { acronym: 'AVRF', name: 'Thomas Datwyler', title: 'President and Treasufer', start: '7/28/2021', end: '12/23/2022' },
        { acronym: 'CFRA', name: 'Kevin Kookogey', title: 'Secretary', start: '1/29/2021', end: '' },
        { acronym: 'CFRA', name: 'Russ Vought', title: 'President', start: '1/29/2021', end: '' },
        { acronym: 'CFRA', name: 'Wesley Denton', title: 'Treasurer', start: '1/29/2021', end: '' },
        { acronym: 'CFS', name: 'Gene Hamilton', title: 'President', start: '6/22/2022', end: '1/20/2025' },
        { acronym: 'CFS', name: 'Ian Prior', title: 'Secretary', start: '6/22/2022', end: '' },
        { acronym: 'CFS', name: 'John Zadrozny', title: 'Treasurer', start: '6/22/2022', end: '1/20/2025' },
        { acronym: 'CLG', name: 'Cameron Seward', title: 'Secretary', start: '1/1/2022', end: '' },
        { acronym: 'CLG', name: 'Charlotte Davis', title: 'President', start: '6/16/2025', end: '' },
        { acronym: 'CLG', name: 'Cleta Mitchell', title: 'President', start: '3/19/2025', end: '6/16/2025' },
        { acronym: 'CLG', name: 'Don Workman', title: 'Chairman', start: '12/16/2022', end: '' },
        { acronym: 'CLG', name: 'Ed Corrigan', title: 'Secretary', start: '6/1/2021', end: '12/31/2021' },
        { acronym: 'CLG', name: 'Ed Corrigan', title: 'Vice President of Development', start: '1/1/2022', end: '3/19/2025' },
        { acronym: 'CLG', name: 'Patrick Corrigan', title: 'Treasurer', start: '6/1/2021', end: '' },
        { acronym: 'CLG', name: 'Scott Gast', title: 'President', start: '12/16/2022', end: '12/31/2024' },
        { acronym: 'CLG', name: 'Wesley Denton', title: 'Vice Presidnet of Operations', start: '1/1/2022', end: '3/19/2025' },
        { acronym: 'CPCI', name: 'Cameron Seward', title: 'Secretary', start: '8/23/2022', end: '12/12/2022' },
        { acronym: 'CPCI', name: 'Ed Corrigan', title: 'President', start: '8/23/2022', end: '12/12/2022' },
        { acronym: 'CPCI', name: 'James Holland', title: 'President', start: '8/23/2022', end: '' },
        { acronym: 'CPCI', name: 'Jim DeMint', title: 'Chairman', start: '8/23/2022', end: '' },
        { acronym: 'CPCI', name: 'Patrick Corrigan', title: 'Treasurer', start: '8/23/2022', end: '' },
        { acronym: 'CPCI', name: 'Sean McMahon', title: 'Secretary', start: '8/23/2022', end: '' },
        { acronym: 'CPI', name: 'Brett Bernhardt', title: 'Treasurer', start: '5/25/2017', end: '2/10/2022' },
        { acronym: 'CPI', name: 'Cameron Seward', title: 'Secretary', start: '2/10/2022', end: '5/1/2023' },
        { acronym: 'CPI', name: 'Cameron Seward', title: 'Key Employee', start: '5/10/2017', end: '2/9/2022' },
        { acronym: 'CPI', name: 'Charlotte Davis', title: 'Secretary', start: '5/1/2023', end: '' },
        { acronym: 'CPI', name: 'Cleta Mitchell', title: 'Secretary', start: '5/25/2017', end: '2/10/2022' },
        { acronym: 'CPI', name: 'Ed Corrigan', title: 'President (formerly Executive Director)', start: '5/25/2017', end: '' },
        { acronym: 'CPI', name: 'Jim Demint', title: 'Chairman', start: '5/25/2017', end: '' },
        { acronym: 'CPI', name: 'Mark Meadows', title: 'Key Employee', start: '1/27/2021', end: '' },
        { acronym: 'CPI', name: 'Wesley Denton', title: 'Vice President & Treasurer', start: '2/10/2022', end: '' },
        { acronym: 'CPIN', name: 'Ed Corrigan', title: 'President', start: '9/9/2022', end: '' },
        { acronym: 'CPIN', name: 'Wesley Denton', title: 'Secretary & Treasurer', start: '9/9/2022', end: '' },
        { acronym: 'CPM', name: 'Andrew Roth', title: 'Secretary', start: '12/5/2023', end: '12/31/2024' },
        { acronym: 'CPM', name: 'Cameron Seward', title: 'Secretary', start: '1/6/2022', end: '12/5/2023' },
        { acronym: 'CPM', name: 'Ed Corrigan', title: 'President', start: '1/6/2022', end: '12/1/2022' },
        { acronym: 'CPM', name: 'Hugh Fike', title: 'Treasurer', start: '12/5/2023', end: '12/31/2024' },
        { acronym: 'CPM', name: 'Patrick Corrigan', title: 'Treasurer', start: '1/6/2022', end: '12/5/2023' },
        { acronym: 'CPM', name: 'Wesley Denton', title: 'President & Vice President', start: '1/6/2022', end: '12/31/2024' },
        { acronym: 'CPNT', name: 'Joseph Guy', title: 'Secretary', start: '9/27/2023', end: '' },
        { acronym: 'CPNT', name: 'Justin Ouimette', title: 'President', start: '9/27/2023', end: '' },
        { acronym: 'CPNT', name: 'Wesley Denton', title: 'Treasurer', start: '9/27/2023', end: '' },
        { acronym: 'CPRO', name: 'Ed Corrigan', title: 'President', start: '4/13/2021', end: '12/1/2022' },
        { acronym: 'CPRO', name: 'Patrick Corrigan', title: 'President', start: '12/1/2022', end: '' },
        { acronym: 'CPRO', name: 'Patrick Corrigan', title: 'Treasurer', start: '4/13/2021', end: '12/5/2023' },
        { acronym: 'CPRO', name: 'Sean McMahon', title: 'Vice President, Treasurer & Secretary', start: '12/5/2023', end: '' },
        { acronym: 'CPRO', name: 'Wesley Denton', title: 'Secretary & Vice President', start: '4/13/2021', end: '12/5/2023' },
        { acronym: 'CRA', name: 'Jen Baird', title: 'Secretary', start: '1/20/2021', end: '' },
        { acronym: 'CRA', name: 'Russ Vought', title: 'President', start: '1/20/2021', end: '' },
        { acronym: 'CRA', name: 'Wesley Denton', title: 'Treasurer', start: '1/20/2021', end: '' },
        { acronym: 'CRDF', name: 'Thomas Datwyler', title: 'President, Secretary, Treasurer', start: '11/18/2021', end: '' },
        { acronym: 'CSA', name: 'Bob McEwen', title: 'Secretary', start: '9/5/2024', end: '' },
        { acronym: 'CSA', name: 'Matthew Faraci', title: 'CEO', start: '9/5/2024', end: '' },
        { acronym: 'CSA', name: 'Phil Kiko', title: 'Treasurer', start: '9/5/2024', end: '' },
        { acronym: 'CSF', name: 'Eric O\'Keefe', title: 'Treasurer', start: '8/8/2024', end: '' },
        { acronym: 'CSF', name: 'John Pallasch', title: 'Secretary', start: '8/8/2024', end: '' },
        { acronym: 'CSF', name: 'Matthew Faraci', title: 'Chief Executive Officer', start: '8/8/2024', end: '' },
        { acronym: 'CSTRA', name: 'Benjamin Stout', title: 'Treasurer', start: '8/5/2024', end: '' },
        { acronym: 'CSTRA', name: 'Luke Ball', title: 'President', start: '8/5/2024', end: '' },
        { acronym: 'CSTRA', name: 'Timothy Reitz', title: 'Secretary', start: '8/5/2024', end: '' },
        { acronym: 'EIN', name: 'Cleta Mitchell', title: 'Chair', start: '12/30/2024', end: '' },
        { acronym: 'EIN', name: 'Kerri Toloczko', title: 'Secretary', start: '12/30/2024', end: '' },
        { acronym: 'EIN', name: 'Sharon P. Bemis', title: 'President', start: '12/30/2024', end: '' },
        { acronym: 'EIN', name: 'Patrick Corrigan', title: 'Treasurer', start: '9/9/2025', end: '' },
        { acronym: 'EINA', name: 'Cleta Mitchell', title: 'President', start: '4/14/2022', end: '' },
        { acronym: 'EINA', name: 'Gene Hamilton', title: 'Secretary', start: '4/14/2022', end: '7/27/2023' },
        { acronym: 'EINA', name: 'Lynn Taylor', title: 'Secretary & Treasurer', start: '7/27/2023', end: '' },
        { acronym: 'EINA', name: 'Patrice Johnson', title: 'Chair & President', start: '7/27/2023', end: '' },
        { acronym: 'EINA', name: 'Patrick Corrigan', title: 'Treasurer', start: '4/14/2022', end: '7/27/2023' },
        { acronym: 'EINA', name: 'Wade Miller', title: 'Chair', start: '4/14/2022', end: '7/27/2023' },
        { acronym: 'FAIR', name: 'Cleta Mitchell', title: 'President / CEO', start: '6/13/2023', end: '' },
        { acronym: 'FAIR', name: 'Daniel Bean', title: 'Vice President', start: '6/13/2023', end: '' },
        { acronym: 'FAIR', name: 'Don Workman', title: 'Secretary', start: '6/13/2023', end: '' },
        { acronym: 'FAIR', name: 'Heather Honey', title: 'Vice President', start: '6/13/2023', end: '8/11/2025' },
        { acronym: 'FAIR', name: 'Patrick Corrigan', title: 'Treasurer', start: '6/13/2023', end: '' },
        { acronym: 'IAP', name: 'Chris Chmielensky', title: 'President', start: '10/5/2023', end: '' },
        { acronym: 'IAP', name: 'Dave Brat', title: 'Chairman', start: '10/5/2023', end: '' },
        { acronym: 'IAP', name: 'Rosemary Jenks', title: 'Director Government Relations', start: '10/5/2023', end: '' },
        { acronym: 'PPO', name: 'Alexei Wolternist', title: 'Treasurer', start: '4/19/2022', end: '2/22/2024' },
        { acronym: 'PPO', name: 'Joshua Whitehouse', title: 'Treasurer', start: '2/22/2024', end: '' },
        { acronym: 'PPO', name: 'Matthew Buckham', title: 'Vice Chair, Secretary', start: '4/19/2022', end: '1/17/2025' },
        { acronym: 'PPO', name: 'Troup Hemenway', title: 'Chair, Executive Director', start: '4/19/2022', end: '1/20/2025' },
        { acronym: 'RMC', name: 'Andrew Roth', title: 'President', start: '9/30/2024', end: '' },
        { acronym: 'RMC', name: 'Bradford Wyatt', title: 'Clerk', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMC', name: 'Justin Ouimette', title: 'Clerk', start: '9/30/2024', end: '' },
        { acronym: 'RMC', name: 'Patrick Corrigan', title: 'Treasurer', start: '9/30/2024', end: '' },
        { acronym: 'RMC', name: 'Ray Ruddy', title: 'Treasurer', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMC', name: 'Walter Weld', title: 'Board Chairman', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMC', name: 'William Gillmeister', title: 'President and Executive Director', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMCF', name: 'Andrew Roth', title: 'President', start: '9/30/2024', end: '' },
        { acronym: 'RMCF', name: 'Bradford Wyatt', title: 'Clerk', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMCF', name: 'Justin Ouimette', title: 'Clerk', start: '9/30/2024', end: '' },
        { acronym: 'RMCF', name: 'Patrick Corrigan', title: 'Treasurer', start: '9/30/2024', end: '' },
        { acronym: 'RMCF', name: 'Ray Ruddy', title: 'Treasurer', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMCF', name: 'Walter Weld', title: 'Board Chairman', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'RMCF', name: 'William Gillmeister', title: 'President and Executive Director', start: '1/1/2022', end: '9/30/2024' },
        { acronym: 'SFCF', name: 'Andrew Roth', title: 'President', start: '6/24/2022', end: '' },
        { acronym: 'SFCF', name: 'Patrick Corrigan', title: 'Treasurer', start: '6/24/2022', end: '' },
        { acronym: 'SFCF', name: 'Timothy Reitz', title: 'Secretary', start: '6/24/2022', end: '' },
        { acronym: 'SFCN', name: 'Andrew Roth', title: 'President', start: '11/17/2021', end: '' },
        { acronym: 'SFCN', name: 'Ed Corrigan', title: 'Secretary', start: '11/17/2021', end: '' },
        { acronym: 'SFCN', name: 'Patrick Corrigan', title: 'Treasurer', start: '11/17/2021', end: '' },
        { acronym: 'SLA', name: 'Edie Guy', title: 'Treasurer', start: '9/17/2024', end: '' },
        { acronym: 'SLA', name: 'L. Mary Thomas', title: 'President', start: '9/17/2024', end: '' },
        { acronym: 'SLA', name: 'Reed Rubinstein', title: 'Secretary', start: '9/17/2024', end: '' },
        { acronym: 'SLF', name: 'Noah W. Wall', title: 'President, Treasurer, and Secretary', start: '11/26/2024', end: '' },
        { acronym: 'SLF', name: 'Rene Alexander Acosta', title: 'Chairman', start: '11/26/2024', end: '' },
        { acronym: 'SLI', name: 'Edie Guy', title: 'Treasurer', start: '8/23/2024', end: '' },
        { acronym: 'SLI', name: 'L. Mary Thomas', title: 'President', start: '8/23/2024', end: '' },
        { acronym: 'SLI', name: 'Reed Rubinstein', title: 'Secretary', start: '8/23/2024', end: '5/19/2025' }
    ]


    // Create People & Roles
    const boardNames = rawBoardRoles.map(r => r.name)
    const officerNames = rawOfficerRoles.map(r => r.name)
    const uniqueNames = new Set([...boardNames, ...officerNames])
    const personMap = new Map()

    for (const fullName of uniqueNames) {
        const parts = fullName.trim().split(' ')
        let firstName = parts[0]
        let lastName = parts.slice(1).join(' ')
        if (!lastName) { lastName = firstName; firstName = "" }

        const internalId = `P-${lastName.replace(/[^a-zA-Z]/g, '').toUpperCase()}-${firstName.replace(/[^a-zA-Z]/g, '').toUpperCase()}`

        try {
            const person = await prisma.person.create({
                data: { firstName, lastName, internalId }
            })
            personMap.set(fullName, person.id)
        } catch (e) {
            const person = await prisma.person.create({
                data: { firstName, lastName, internalId: internalId + Math.floor(Math.random() * 1000) }
            })
            personMap.set(fullName, person.id)
        }
    }
    console.log(`Created ${uniqueNames.size} people.`)

    // Create Board Roles
    for (const r of rawBoardRoles) {
        const personId = personMap.get(r.name)
        const entityId = entityMap.get(r.acronym)
        if (personId && entityId) {
            await prisma.boardRole.create({
                data: {
                    personId,
                    entityId,
                    title: 'Director',
                    roleType: 'DIRECTOR',
                    votingRights: true,
                    isCompensated: false,
                    startDate: r.start ? new Date(r.start) : null,
                    endDate: r.end ? new Date(r.end) : null
                }
            })
        }
    }

    // Create Officer Roles
    for (const r of rawOfficerRoles) {
        const personId = personMap.get(r.name)
        const entityId = entityMap.get(r.acronym)
        if (personId && entityId) {
            let roleType = 'OFFICER'
            if (r.title.includes('Key Employee')) roleType = 'KEY_EMPLOYEE'

            await prisma.boardRole.create({
                data: {
                    personId,
                    entityId,
                    title: r.title,
                    roleType,
                    votingRights: false,
                    isCompensated: true,
                    startDate: r.start ? new Date(r.start) : null,
                    endDate: r.end ? new Date(r.end) : null
                }
            })
        }
    }

    // 3. Transactions (Part V Financials)
    const cpiId = entityMap.get('CPI')
    const aflId = entityMap.get('AFL')
    const cproId = entityMap.get('CPRO')
    const cpinId = entityMap.get('CPIN')

    if (cpiId && aflId) {
        await prisma.relatedTransaction.create({
            data: { fromEntityId: cpiId, toEntityId: aflId, type: 'GRANT', amount: 1250000.00, description: 'General operating support grant.', date: new Date('2023-06-15') }
        })
    }
    if (cpiId && cpinId) {
        await prisma.relatedTransaction.create({
            data: { fromEntityId: cpiId, toEntityId: cpinId, type: 'SHARED_SERVICES', amount: 15000.00, description: 'Reimbursement for shared office space and personnel.', date: new Date('2023-12-31') }
        })
    }
    if (cproId && cpiId) {
        await prisma.relatedTransaction.create({
            data: { fromEntityId: cproId, toEntityId: cpiId, type: 'LOAN_REPAYMENT', amount: 50000.00, description: 'Partial repayment of startup loan.', date: new Date('2023-09-01') }
        })
    }

    console.log('Seeding finished.')
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
