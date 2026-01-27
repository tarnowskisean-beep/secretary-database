import AppLayout from "@/components/AppLayout";

import { syncUser } from "@/server/actions/auth";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Ensure user is synced with DB whenever they access the dashboard
    await syncUser();

    return (
        <AppLayout>
            {children}
        </AppLayout>
    );
}
