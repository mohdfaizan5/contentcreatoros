import { redirect } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { UserDropdown } from '@/components/user-dropdown';
import { ONBOARDING_FLOW_KEY } from '@/lib/onboarding';
import { createClient } from '@/lib/server';
import AppNotifications from '@/components/app-notifications';
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        redirect('/login');
    }

    const { count: onboardingAnswerCount, error: onboardingAnswersError } = await supabase
        .from('onboarding_answers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', data.user.id)
        .eq('flow_key', ONBOARDING_FLOW_KEY);

    if (!onboardingAnswersError && (onboardingAnswerCount ?? 0) === 0) {
        redirect('/onboarding');
    }

    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="bg-content-gradient">
                    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b px-6 header-blur">
                        <SidebarTrigger className="-ml-2 transition-transform hover:scale-110" />
                        <div className="flex-1" />
                        <div className='flex gap-2 items-center'>
                            <AppNotifications />
                            <UserDropdown email={data.user.email} />
                        </div>
                    </header>
                    <ToastProvider>
                        <AnchoredToastProvider>
                            <main className="flex-1 overflow-auto px-6 pb-4 pt-2">
                                {children}
                            </main>
                        </AnchoredToastProvider>
                    </ToastProvider>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
