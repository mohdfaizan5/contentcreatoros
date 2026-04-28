import { redirect } from 'next/navigation';
import { buildAppPath, LEGACY_APP_ROOT } from '@/features/inspiration/lib/app-shell';

export default function LegacyHomePage() {
    redirect(buildAppPath(LEGACY_APP_ROOT, '/templates'));
}
