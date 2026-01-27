import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createAdminClient } from '../src/utils/supabase/admin'

async function main() {
    const email = 'achang@compassprofessional.com'
    console.log(`Attempting to delete auth user: ${email}`)

    const supabase = createAdminClient()

    // 1. List users to find ID (admin.listUsers)
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
        console.error("Error listing users:", error)
        return
    }

    const targetUser = users.find(u => u.email === email)

    if (!targetUser) {
        console.log("User not found in Auth system.")
        return
    }

    console.log(`Found user ${targetUser.id}. Deleting...`)

    // 2. Delete user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUser.id)

    if (deleteError) {
        console.error("Failed to delete:", deleteError)
    } else {
        console.log("Successfully deleted user from Auth.")
    }
}

main()
