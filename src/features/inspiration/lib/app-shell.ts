export const MODERN_APP_ROOT = '/app' as const;
export const LEGACY_APP_ROOT = '/legacy' as const;

export type AppShellRoot = typeof MODERN_APP_ROOT | typeof LEGACY_APP_ROOT;

export function buildAppPath(root: AppShellRoot, path = ''): string {
    if (!path || path === '/') {
        return root;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${root}${normalizedPath}`;
}

export function getAllAppShellPaths(path = ''): string[] {
    return [
        buildAppPath(MODERN_APP_ROOT, path),
        buildAppPath(LEGACY_APP_ROOT, path),
    ];
}
