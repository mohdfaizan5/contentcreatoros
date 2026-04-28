import type { BrandPreviewTheme } from '@/features/inspiration/lib/brand-visuals';
import { IMAGE_TEMPLATE_METADATA, type ImageTemplateCopy } from '@/features/image-studio/lib/image-templates';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';

type ImageTemplatePreviewProps = {
  copy: ImageTemplateCopy;
  companyName: string;
  theme: BrandPreviewTheme;
  className?: string;
};

function readCopy(copy: ImageTemplateCopy, key: keyof ImageTemplateCopy, fallback = '') {
  const value = copy[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function limitCopyValue(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return value;
  }

  return value.slice(0, maxChars).trimEnd();
}

function readLimitedCopy(
  copy: ImageTemplateCopy,
  key: keyof ImageTemplateCopy,
  maxChars: number,
  fallback = '',
) {
  return limitCopyValue(readCopy(copy, key, fallback), maxChars);
}

export function ImageTemplateOnePreview({
  copy,
  companyName,
  theme,
  className,
}: ImageTemplatePreviewProps) {
  const templateMetadata = IMAGE_TEMPLATE_METADATA['template-1'];
  const eyebrow = readLimitedCopy(
    copy,
    'eyebrow',
    templateMetadata.contentMaxLength.badge,
  );
  const headline = readLimitedCopy(
    copy,
    'headline',
    templateMetadata.contentMaxLength.headline,
    `${companyName} insight`,
  );
  const cta = readLimitedCopy(copy, 'cta', templateMetadata.contentMaxLength.cta);

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden p-8 sm:p-10', className)}
      style={{
        // background: `linear-gradient(136deg, ${theme.background} 0%, ${theme.primary} 45%, ${theme.secondary} 100%)`,
        background: theme.primary,
        // color: theme.foreground,
        fontFamily: '"Poppins", "Avenir Next", "Segoe UI", sans-serif',
      }}
    >
      {/* <div
        className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full blur-2xl"
        style={{ backgroundColor: `${theme.secondary}A6` }}
      /> */}
      <div
        className="pointer-events-none absolute -bottom-20 left-12 h-60 w-60 rounded-full blur-2xl"
        style={{ backgroundColor: `${theme.primary}8C` }}
      />

      <div className="relative flex h-full flex-col justify-end gap-6">
        <div className="space-y-3">
          {eyebrow ? (
            <p
              className="inline-flex py-1 text-[11px] font-semibold  font-mono"
              style={{
                color: theme.foreground,
              }}
            >
              {eyebrow}
            </p>
          ) : null}

          <h2
            className="max-w-[18ch] text-4xl font-semibold sm:text-5xl"
            style={{ fontFamily: '"Bebas Neue", "Oswald", "Arial Narrow", sans-serif' }}
          >
            {headline}
          </h2>
        </div>

        <div className="mt-3 flex items-end justify-between gap-5">
          {cta ? (
            <Button
              className="inline-flex rounded-full px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: theme.textOnPrimary,
                color: theme.primary,
              }}
            >
              {cta}
            </Button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}

export function ImageTemplateTwoPreview({
  copy,
  companyName,
  theme,
  className,
}: ImageTemplatePreviewProps) {
  const templateMetadata = IMAGE_TEMPLATE_METADATA['template-2'];
  const eyebrow = readLimitedCopy(
    copy,
    'eyebrow',
    templateMetadata.contentMaxLength.badge,
  );
  const headline = readLimitedCopy(
    copy,
    'headline',
    templateMetadata.contentMaxLength.headline,
    `${companyName} field notes`,
  );
  const supporting = readLimitedCopy(
    copy,
    'supporting',
    templateMetadata.contentMaxLength.description,
  );
  const cta = readLimitedCopy(copy, 'cta', templateMetadata.contentMaxLength.cta);

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden px-8 py-4', className)}
      style={{
        background: theme.foreground,
        color: theme.foreground,
        fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-2"
        style={{ backgroundColor: theme.secondary }}
      />
      <div
        className="pointer-events-none absolute right-8 top-6 h-44 w-44 rounded-full blur-3xl"
        style={{ backgroundColor: `${theme.secondary}66` }}
      />

      <div className="relative flex h-full flex-col items-center justify-center gap-6">
        <div className="mx-auto flex flex-col items-center space-y-4">
          {eyebrow ? <Badge variant="outline">{eyebrow}</Badge> : null}
          <h2
            className="max-w-[25ch] text-center text-4xl font-semibold sm:text-[2.5rem]"
            style={{
              color: theme.textOnSecondary,
            }}
          >
            {headline}
          </h2>
          {supporting ? (
            <p className="max-w-[45ch] whitespace-pre-line text-center text-sm text-white/82">
              {supporting}
            </p>
          ) : null}
        </div>
        {cta ? (
          <Button
            style={{
              backgroundColor: `${theme.primary}D9`,
              color: theme.textOnPrimary,
            }}
          >
            {cta}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
