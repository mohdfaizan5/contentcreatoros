import 'server-only';

import { revalidatePath } from 'next/cache';
import { getAllAppShellPaths } from '@/lib/app-shell';

export function revalidateAppPath(path = '') {
    for (const route of getAllAppShellPaths(path)) {
        revalidatePath(route);
    }
}

export function revalidateAppPaths(paths: string[]) {
    for (const path of paths) {
        revalidateAppPath(path);
    }
}
