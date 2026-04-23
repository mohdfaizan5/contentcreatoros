import type { PostMediaAttachment } from '@/types/database';

export const POST_MEDIA_BUCKET = 'post-media';
export const POST_MEDIA_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const POST_GIF_MAX_BYTES = 15 * 1024 * 1024;
export const POST_MEDIA_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

const MIME_EXTENSION_BY_TYPE: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function getPostMediaKind(mimeType: string) {
  return mimeType === 'image/gif' ? 'gif' : 'image';
}

export function getPostMediaMaxBytes(mimeType: string) {
  return mimeType === 'image/gif' ? POST_GIF_MAX_BYTES : POST_IMAGE_MAX_BYTES;
}

export function formatPostMediaSize(bytes: number) {
  return `${Math.ceil(bytes / (1024 * 1024))}MB`;
}

export function validatePostMediaFile(params: {
  mimeType: string;
  sizeBytes: number;
}) {
  if (
    !POST_MEDIA_ALLOWED_MIME_TYPES.includes(
      params.mimeType as (typeof POST_MEDIA_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw new Error('Upload a JPG, PNG, WebP, or GIF file.');
  }

  const maxBytes = getPostMediaMaxBytes(params.mimeType);

  if (params.sizeBytes > maxBytes) {
    const mediaLabel = params.mimeType === 'image/gif' ? 'GIFs' : 'Images';
    throw new Error(`${mediaLabel} must be ${formatPostMediaSize(maxBytes)} or smaller.`);
  }

  return getPostMediaKind(params.mimeType);
}

export function validatePostMediaAttachmentSet(attachments: PostMediaAttachment[]) {
  const gifs = attachments.filter((attachment) => attachment.media_type === 'gif');
  const images = attachments.filter((attachment) => attachment.media_type === 'image');

  if (gifs.length > 1) {
    throw new Error('X supports only 1 GIF per post.');
  }

  if (gifs.length > 0 && attachments.length > 1) {
    throw new Error('A GIF cannot be mixed with other images on X.');
  }

  if (images.length > 4) {
    throw new Error('X supports up to 4 images per post.');
  }
}

export function normalizePostMediaAttachments(value: unknown): PostMediaAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const record = item as Record<string, unknown>;
    const id = typeof record.id === 'string' ? record.id : '';
    const path = typeof record.path === 'string' ? record.path : '';
    const mimeType = typeof record.mime_type === 'string' ? record.mime_type : '';
    const mediaType =
      record.media_type === 'gif' || mimeType === 'image/gif' ? 'gif' : 'image';
    const sizeBytes =
      typeof record.size_bytes === 'number' && Number.isFinite(record.size_bytes)
        ? record.size_bytes
        : 0;

    if (!id || !path || !mimeType || sizeBytes <= 0) {
      return [];
    }

    return [
      {
        bucket: typeof record.bucket === 'string' ? record.bucket : POST_MEDIA_BUCKET,
        file_name: typeof record.file_name === 'string' ? record.file_name : 'media',
        id,
        media_type: mediaType,
        mime_type: mimeType,
        path,
        signed_url: typeof record.signed_url === 'string' ? record.signed_url : null,
        size_bytes: sizeBytes,
        uploaded_at:
          typeof record.uploaded_at === 'string'
            ? record.uploaded_at
            : new Date().toISOString(),
      } satisfies PostMediaAttachment,
    ];
  });
}

export function stripPostMediaSignedUrls(attachments: PostMediaAttachment[]) {
  return attachments.map((attachment) => ({
    bucket: attachment.bucket,
    file_name: attachment.file_name,
    id: attachment.id,
    media_type: attachment.media_type,
    mime_type: attachment.mime_type,
    path: attachment.path,
    size_bytes: attachment.size_bytes,
    uploaded_at: attachment.uploaded_at,
  }));
}

export function getPostMediaExtension(fileName: string, mimeType: string) {
  const fromMimeType = MIME_EXTENSION_BY_TYPE[mimeType];

  if (fromMimeType) {
    return fromMimeType;
  }

  const extension = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  return extension || 'jpg';
}
