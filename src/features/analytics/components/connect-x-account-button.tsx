'use client';

import { LockKey } from '@phosphor-icons/react';

import { Button } from '@/shared/components/ui/button';
import type { XAccountRole } from '@/shared/types/database';

export function ConnectXAccountButton({
  hasAccount,
  label,
  role,
}: {
  hasAccount: boolean;
  label?: string;
  role?: XAccountRole | null;
}) {
  const handleClick = () => {
    const roleLabel =
      role === 'company' ? 'company' : role === 'founder' ? 'founder' : 'new';
    const message = role
      ? hasAccount
        ? `Reconnect the ${roleLabel} X account now?`
        : `To connect a different ${roleLabel} X account, make sure you are signed into the right X account in this browser. If X keeps choosing the wrong account, sign out of X or use a private window, then continue.`
      : 'Start a fresh X OAuth flow for another account now? This will save the account separately so you can label it later.';

    if (!window.confirm(message)) {
      return;
    }

    const nextUrl = role ? `/api/x/login?role=${role}` : '/api/x/login';
    window.location.assign(nextUrl);
  };

  return (
    <Button onClick={handleClick} type="button">
      <LockKey className="size-4" />
      {label ?? (hasAccount ? 'Reconnect X' : 'Connect X')}
    </Button>
  );
}
