import type { BrandVisualIdentity } from '@/features/inspiration/lib/brand-visuals';

export const IMAGE_TWEET_CHARACTER_LIMIT = 280;

export type ImageTemplateId = 'template-1' | 'template-2';

export const IMAGE_TEMPLATE_METADATA = {
  'template-1': {
    contentMaxLength: {
      badge: 24,
      headline: 35,
      cta: 28,
    },
    aspectRatio: '16/9',
  },
  'template-2': {
    contentMaxLength: {
      badge: 24,
      headline: 42,
      description: 100,
      cta: 34,
    },
    aspectRatio: '16/9',
  },
} as const;

export type ImageTemplateFieldKey =
  | 'eyebrow'
  | 'headline'
  | 'supporting'
  | 'proofValue'
  | 'proofLabel'
  | 'cta'
  | 'footer'
  | 'quote';

export type ImageTemplateCopy = Partial<Record<ImageTemplateFieldKey, string>>;

export type ImageTemplateFieldDefinition = {
  key: ImageTemplateFieldKey;
  label: string;
  maxChars: number;
  helper: string;
  multiline?: boolean;
  optional?: boolean;
};

export type ImageTemplateDefinition = {
  id: ImageTemplateId;
  name: string;
  description: string;
  fields: ImageTemplateFieldDefinition[];
};

export const IMAGE_TEMPLATE_DEFINITIONS: Record<ImageTemplateId, ImageTemplateDefinition> = {
  'template-1': {
    id: 'template-1',
    name: 'Template 1 - Hero CTA',
    description: 'A bold headline layout with a small badge and compact CTA button.',
    fields: [
      {
        key: 'eyebrow',
        label: 'Badge',
        maxChars: IMAGE_TEMPLATE_METADATA['template-1'].contentMaxLength.badge,
        helper: 'Small badge text shown above the headline.',
        optional: true,
      },
      {
        key: 'headline',
        label: 'Headline',
        maxChars: IMAGE_TEMPLATE_METADATA['template-1'].contentMaxLength.headline,
        helper: 'Primary hook line in the hero section.',
      },
      {
        key: 'cta',
        label: 'CTA',
        maxChars: IMAGE_TEMPLATE_METADATA['template-1'].contentMaxLength.cta,
        helper: 'Final call to action chip text.',
        optional: true,
      },
    ],
  },
  'template-2': {
    id: 'template-2',
    name: 'Template 2 - Editorial Panel',
    description: 'A centered editorial layout with badge, headline, description, and CTA.',
    fields: [
      {
        key: 'eyebrow',
        label: 'Badge',
        maxChars: IMAGE_TEMPLATE_METADATA['template-2'].contentMaxLength.badge,
        helper: 'Small badge text shown above the headline.',
        optional: true,
      },
      {
        key: 'headline',
        label: 'Headline',
        maxChars: IMAGE_TEMPLATE_METADATA['template-2'].contentMaxLength.headline,
        helper: 'Main statement in the center of the canvas.',
      },
      {
        key: 'supporting',
        label: 'Description',
        maxChars: IMAGE_TEMPLATE_METADATA['template-2'].contentMaxLength.description,
        helper: 'Optional supporting detail below the headline.',
        multiline: true,
        optional: true,
      },
      {
        key: 'cta',
        label: 'CTA',
        maxChars: IMAGE_TEMPLATE_METADATA['template-2'].contentMaxLength.cta,
        helper: 'Button label shown at the bottom.',
        optional: true,
      },
    ],
  },
};

export const IMAGE_TEMPLATE_IDS = Object.keys(IMAGE_TEMPLATE_DEFINITIONS) as ImageTemplateId[];

function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function sanitizeFieldValue(value: string, multiline: boolean) {
  const normalized = value.replace(/\r\n?/g, '\n').trim();

  if (!normalized) {
    return '';
  }

  if (multiline) {
    return normalized.replace(/\n{3,}/g, '\n\n');
  }

  return normalized.replace(/\s+/g, ' ');
}

function getFieldDefinition(templateId: ImageTemplateId, key: ImageTemplateFieldKey) {
  return IMAGE_TEMPLATE_DEFINITIONS[templateId].fields.find((field) => field.key === key);
}

function trimToCharacterLimit(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return value.slice(0, limit).trimEnd();
}

export function isImageTemplateId(value: string): value is ImageTemplateId {
  return value in IMAGE_TEMPLATE_DEFINITIONS;
}

export function getImageTemplateDefinition(templateId: ImageTemplateId) {
  return IMAGE_TEMPLATE_DEFINITIONS[templateId];
}

export function createEmptyImageTemplateCopy(templateId: ImageTemplateId): ImageTemplateCopy {
  return IMAGE_TEMPLATE_DEFINITIONS[templateId].fields.reduce<ImageTemplateCopy>((copy, field) => {
    copy[field.key] = '';
    return copy;
  }, {});
}

export function limitImageCopyFieldValue(
  templateId: ImageTemplateId,
  key: ImageTemplateFieldKey,
  value: string,
) {
  const definition = getFieldDefinition(templateId, key);

  if (!definition) {
    return trimToCharacterLimit(sanitizeFieldValue(value, false), 180);
  }

  return trimToCharacterLimit(sanitizeFieldValue(value, Boolean(definition.multiline)), definition.maxChars);
}

export function normalizeImageTemplateCopy(templateId: ImageTemplateId, copy: ImageTemplateCopy) {
  const definition = IMAGE_TEMPLATE_DEFINITIONS[templateId];
  const nextCopy: ImageTemplateCopy = createEmptyImageTemplateCopy(templateId);

  definition.fields.forEach((field) => {
    const rawValue = readString(copy[field.key]);
    nextCopy[field.key] = limitImageCopyFieldValue(templateId, field.key, rawValue);
  });

  return nextCopy;
}

export function trimTweetToLimit(tweet: string) {
  const normalized = tweet.replace(/\r\n?/g, '\n').trim();

  if (!normalized) {
    return '';
  }

  if (normalized.length <= IMAGE_TWEET_CHARACTER_LIMIT) {
    return normalized;
  }

  const trimmed = normalized.slice(0, IMAGE_TWEET_CHARACTER_LIMIT - 1);
  const lastWhitespaceIndex = trimmed.lastIndexOf(' ');

  if (lastWhitespaceIndex > 0) {
    return `${trimmed.slice(0, lastWhitespaceIndex).trimEnd()}...`;
  }

  return `${trimmed.trimEnd()}...`;
}

function firstSentence(value: string, maxChars: number) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '';
  }

  const sentenceEnd = normalized.search(/[.!?](\s|$)/);

  if (sentenceEnd > 0 && sentenceEnd < maxChars) {
    return normalized.slice(0, sentenceEnd + 1);
  }

  return trimToCharacterLimit(normalized, maxChars);
}

export function getSeedImageTemplateCopy(
  identity: BrandVisualIdentity,
  companyOverview: string,
): Record<ImageTemplateId, ImageTemplateCopy> {
  const companyName = identity.companyName || identity.sourceDomain || 'Your Brand';
  const shortOverview = firstSentence(companyOverview || identity.description || '', 150);
  const sourceDomain = identity.sourceDomain || '';

  return {
    'template-1': normalizeImageTemplateCopy('template-1', {
      eyebrow: sourceDomain ? `${sourceDomain.toUpperCase()} PLAYBOOK` : `${companyName.toUpperCase()} PLAYBOOK`,
      headline: `${companyName} insight to steal`,
      cta: 'Get the full breakdown',
    }),
    'template-2': normalizeImageTemplateCopy('template-2', {
      eyebrow: sourceDomain ? sourceDomain.toUpperCase() : 'EDITORIAL',
      headline: `${companyName} growth notes for creators`,
      supporting: shortOverview,
      cta: 'Steal this structure',
    }),
  };
}
