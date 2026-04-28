'use client';

import { useEffect, useState, useTransition } from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import { Frame, FrameHeader, FramePanel } from '@/shared/components/ui/frame';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { createClient } from '@/shared/lib/supabase/client';

type User = {
  id: string;
  email: string;
  app_metadata: {
    providers?: string[];
  };
};

export function PasswordSettingsPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user as unknown as User);
        const providers = user.app_metadata?.providers || [];
        setHasPassword(providers.includes('email'));
      }

      setIsLoading(false);
    }

    fetchUser();
  }, []);

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      console.error('Invalid password: New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      console.error('Passwords do not match: New password and confirm password must match.');
      return;
    }

    startTransition(async () => {
      const supabase = createClient();

      if (hasPassword && currentPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user!.email,
          password: currentPassword,
        });

        if (signInError) {
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Failed to update password. Please try again.');
        return;
      }

      setHasPassword(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      console.log('Password updated successfully.');
    });
  };

  if (isLoading) {
    return (
      <Frame className="w-full">
        <FramePanel>
          <div className="text-muted-foreground">Loading...</div>
        </FramePanel>
      </Frame>
    );
  }

  return (
    <Frame className="w-full">
      <Collapsible defaultOpen>
        <FrameHeader className="flex-row items-center justify-between px-2 py-2">
          <p>Password</p>
          <CollapsibleTrigger
            className="data-panel-open:[&_svg]:rotate-180"
            render={<Button variant="ghost" />}
          >
            <ChevronDownIcon className="size-4" />
            Change Password
          </CollapsibleTrigger>
        </FrameHeader>
        <CollapsiblePanel>
          <FramePanel>
            <p className="mb-4 text-sm text-muted-foreground">
              {hasPassword
                ? 'Enter your current password and choose a new one.'
                : 'Set a password to secure your account.'}
            </p>

            {hasPassword && (
              <div className="mb-4">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
            )}

            <div className="mb-4">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={isPending || !newPassword || !confirmPassword}
            >
              {isPending ? 'Saving...' : 'Save Password'}
            </Button>
          </FramePanel>
        </CollapsiblePanel>
      </Collapsible>
    </Frame>
  );
}
