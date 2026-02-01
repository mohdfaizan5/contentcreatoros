import { redirect } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { UserDropdown } from '@/components/user-dropdown';
import { createClient } from '@/lib/server';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        redirect('/auth/login');
    }

    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="bg-content-gradient">
                    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b px-6 header-blur">
                        <SidebarTrigger className="-ml-2 transition-transform hover:scale-110" />
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
