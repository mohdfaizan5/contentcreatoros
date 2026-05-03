import { PasswordSettingsPanel } from '@/features/settings/components/password-settings-panel';
import { XConnectionsSettingsSection } from '@/features/settings/components/x-connections-settings-section';
import { createClient } from '@/shared/lib/supabase/server';

type SettingsPageProps = {
  searchParams: Promise<{
    connected?: string;
    disconnected?: string;
    error?: string;
    role?: string;
  }>;
};

export default async function SettingPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings, access, and connected publishing accounts here.
        </p>
      </div>
      {user?.email ? (
        <p className="text-sm font-medium text-foreground">{user.email}</p>
      ) : null}

      <XConnectionsSettingsSection
        searchParams={params}
        userEmail={user?.email ?? null}
      />
      <PasswordSettingsPanel />
    </div>
  );
}
