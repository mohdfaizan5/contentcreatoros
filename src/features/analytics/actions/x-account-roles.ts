'use server';

import { revalidatePath } from 'next/cache';

import {
  assignCurrentUserXAccountRole,
  parseXAccountRole,
} from '@/features/x/lib/x-auth';

export async function assignSavedXAccountRole(formData: FormData) {
  const accountId = String(formData.get('accountId') ?? '');
  const role = parseXAccountRole(String(formData.get('role') ?? ''));

  if (!accountId || !role) {
    throw new Error('Choose a saved X account and a role.');
  }

  await assignCurrentUserXAccountRole(accountId, role);
  revalidatePath('/app/settings');
  revalidatePath('/app/analytics');
}
