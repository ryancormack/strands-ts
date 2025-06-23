/**
 * Media-related type definitions
 */

export type ImageFormat = 'jpeg' | 'png' | 'gif' | 'webp';

export interface ImageContent {
  format: ImageFormat;
  source: {
    bytes?: Uint8Array;
    base64?: string;
  };
}

export interface DocumentContent {
  format: string;
  name: string;
  source: {
    bytes?: Uint8Array;
    base64?: string;
  };
}

export interface VideoContent {
  format: string;
  source: {
    s3Location?: {
      uri: string;
      bucketOwner?: string;
    };
    bytes?: Uint8Array;
  };
}