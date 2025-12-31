// Comic Episode - matches Sanity schema
export interface Comic {
  _id: string;
  _type: 'comicEpisode';
  title: string;
  slug: {
    _type: 'slug';
    current: string;
  };
  publishedAt: string;
  image: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  altText?: string;
  transcript?: string;
  hidden?: boolean;
}

// For displaying comics (with resolved image URL)
export interface ComicWithImageUrl extends Omit<Comic, 'image'> {
  imageUrl: string;
}

// Request body for creating a comic via API
export interface CreateComicBody {
  title: string;
  slug: string;
  publishedAt?: string; // ISO datetime, defaults to now
  altText?: string;
  transcript?: string;
}

// Request body for patching a comic via API
export interface PatchComicBody {
  title?: string;
  slug?: string;
  publishedAt?: string;
  altText?: string;
  transcript?: string;
  hidden?: boolean;
}

// API response types
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Allowed image types
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

// Max image size in bytes (40MB)
export const MAX_IMAGE_SIZE = 40 * 1024 * 1024;

// Validate image file
export function validateImageFile(
  file: { size: number; type: string },
  fieldName = 'image'
): string | null {
  if (file.size > MAX_IMAGE_SIZE) {
    return `${fieldName} exceeds maximum size of 40MB`;
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return `${fieldName} must be png, jpg, webp, gif, or avif. Got: ${file.type}`;
  }
  return null;
}
