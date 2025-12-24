/**
 * Common MIME type constants for file upload validation
 */

// Image types
export const IMAGE_MIME_TYPES = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  SVG: 'image/svg+xml',
} as const;

// Document types
export const DOCUMENT_MIME_TYPES = {
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PPT: 'application/vnd.ms-powerpoint',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  TXT: 'text/plain',
} as const;

// Video types
export const VIDEO_MIME_TYPES = {
  MP4: 'video/mp4',
  WEBM: 'video/webm',
  OGG: 'video/ogg',
  AVI: 'video/x-msvideo',
} as const;

// Audio types
export const AUDIO_MIME_TYPES = {
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
  OGG: 'audio/ogg',
} as const;

// Common combinations
export const ALLOWED_IMAGE_TYPES = [
  IMAGE_MIME_TYPES.JPEG,
  IMAGE_MIME_TYPES.PNG,
  IMAGE_MIME_TYPES.WEBP,
];

export const ALLOWED_DOCUMENT_TYPES = [
  DOCUMENT_MIME_TYPES.PDF,
  DOCUMENT_MIME_TYPES.DOC,
  DOCUMENT_MIME_TYPES.DOCX,
];

export const ALLOWED_CERTIFICATION_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];
