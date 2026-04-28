import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import {
  buildBrandVisualIdentity,
  hexToRgba,
  pickReadableText,
  toBrandPreviewTheme,
  type BrandVisualIdentity,
} from '@/features/inspiration/lib/brand-visuals';

type BrandVisualOverviewProps = {
  identity: Partial<BrandVisualIdentity>;
  className?: string;
  title?: string;
};

const KEY_COLOR_LABELS = ['Link', 'Accent', 'Primary', 'Background', 'Text Primary'] as const;

function getInitials(value: string) {
  const words = value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);

  return words.map((word) => word.charAt(0).toUpperCase()).join('') || 'BR';
}

export function BrandVisualOverview({
  identity,
  className,
  title = 'Brand Visual Overview',
}: BrandVisualOverviewProps) {
  const brand = buildBrandVisualIdentity(identity);
  const theme = toBrandPreviewTheme(brand);
  const displayName = brand.companyName || brand.sourceDomain || 'Brand Profile';
  const initials = getInitials(displayName);
  const swatches = theme.swatches;

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 shadow-[0_20px_55px_-40px_rgba(2,6,23,0.75)]',
        className,
      )}
      style={{
        backgroundColor: theme.background,
        borderColor: hexToRgba(theme.foreground, 0.16),
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(420px 140px at 70% 0%, ${hexToRgba(theme.secondary, 0.35)}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: hexToRgba(theme.foreground, 0.72) }}
            >
              {title}
            </p>
            <h3 className="mt-1 text-lg font-semibold" style={{ color: theme.foreground }}>
              {displayName}
            </h3>
            {brand.sourceDomain ? (
              <p
                className="mt-1 text-sm"
                style={{ color: hexToRgba(theme.foreground, 0.62) }}
              >
                {brand.sourceDomain}
              </p>
            ) : null}
          </div>

          <Badge
            className="border-0"
            style={{
              backgroundColor: hexToRgba(theme.foreground, 0.14),
              color: theme.foreground,
            }}
            variant="secondary"
          >
            {brand.colors.length}/5 key colors
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-12">
          <div
            className="rounded-2xl border p-3 col-span-2"
            style={{
              borderColor: hexToRgba(theme.foreground, 0.16),
              backgroundColor: theme.surface,
              color: theme.surfaceText,
            }}
          >
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.15em]"
              style={{ color: hexToRgba(theme.surfaceText, 0.7) }}
            >
              Logo
            </p>
            <div
              className="flex h-20 w-20 items-center justify-center overflow-hidden "
              style={{
                borderColor: hexToRgba(theme.foreground, 0.14),
                backgroundColor: hexToRgba(theme.background, 0.35),
              }}
            >
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={`${displayName} logo`}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-xl font-semibold">{initials}</span>
              )}
            </div>
          </div>

          <div
            className="rounded-2xl border p-3 col-span-4"
            style={{
              borderColor: hexToRgba(theme.foreground, 0.14),
              backgroundColor: theme.surface,
              color: theme.surfaceText,
            }}
          >
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.15em]"
              style={{ color: hexToRgba(theme.surfaceText, 0.7) }}
            >
              OG Image
            </p>
            <div
              className="h-20 w-full overflow-hidden rounded-xl border"
              style={{
                borderColor: hexToRgba(theme.foreground, 0.14),
                backgroundColor: hexToRgba(theme.background, 0.35),
              }}
            >
              {brand.ogImageUrl ? (
                <img
                  src={brand.ogImageUrl}
                  alt={`${displayName} OG image`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className="flex h-full items-center justify-center text-xs"
                  style={{ color: theme.mutedSurfaceText }}
                >
                  No OG image detected
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {KEY_COLOR_LABELS.map((label, index) => {
            const color = swatches[index];

            return (
              <div key={label} className="rounded-lg border p-1.5" style={{ borderColor: hexToRgba(theme.foreground, 0.14) }}>
                <p
                  className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: hexToRgba(theme.foreground, 0.72) }}
                >
                  {label}
                </p>
                <div className="h-11 rounded-md px-1.5 py-1" style={{ backgroundColor: color }}>
                  <span
                    className="text-[10px] font-semibold uppercase"
                    style={{ color: pickReadableText(color, '#FFFFFF', 4.5) }}
                  >
                    {color}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
