import { redirect } from 'next/navigation';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/shared/components/ui/sidebar';
import { UserDropdown } from '@/shared/components/user-dropdown';
import { createClient } from '@/shared/lib/supabase/server';
import { LegacyAppSidebar } from '@/features/dashboard/components/legacy-app-sidebar';

export default async function DashboardLayout({ children }: {
    children: React.ReactNode
}) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        redirect('/login');
    }

    return (
        <TooltipProvider>
            <SidebarProvider>
                <LegacyAppSidebar />
                <SidebarInset className="bg-content-gradient">
                    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b px-6 header-blur">
                        <SidebarTrigger
                            className="-ml-2 transition-transform hover:scale-110"
                        />
                        <div className="flex-1" />
                        <UserDropdown email={data.user.email} />
                    </header>
                    <main className="flex-1 overflow-auto p-6">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
