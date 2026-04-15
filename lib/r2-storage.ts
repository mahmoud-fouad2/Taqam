/**
 * Cloudflare R2 Storage Service
 * Handles file uploads/downloads to R2 bucket
 */

import "server-only";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getStorageRuntimeStatus } from "@/lib/runtime-integrations";

// R2 Client Configuration
const R2_ENDPOINT =
  process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

let r2Client: S3Client | null = null;

function getR2Client() {
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ""
      }
    });
  }

  return r2Client;
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

function isR2ObjectMissing(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    Code?: string;
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };

  return (
    maybeError.Code === "NoSuchKey" ||
    maybeError.name === "NoSuchKey" ||
    maybeError.$metadata?.httpStatusCode === 404
  );
}

export function isR2Configured() {
  return getStorageRuntimeStatus().configured;
}

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

export interface FileMetadata {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

type R2ReadOptions = {
  suppressErrorLog?: boolean;
  timeoutMs?: number;
};

export async function putFile(
  key: string,
  file: Buffer | Uint8Array,
  contentType: string,
  metadata?: Record<string, string>
): Promise<boolean> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata
    });

    await getR2Client().send(command);
    return true;
  } catch (error) {
    console.error("R2 Put Error:", error);
    return false;
  }
}

/**
 * Generate a unique file key with folder structure
 */
function generateFileKey(tenantId: string, category: string, fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = fileName.split(".").pop() || "";
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);

  return `${tenantId}/${category}/${timestamp}-${random}-${safeName}`;
}

/**
 * Upload a file to R2
 */
export async function uploadFile(
  file: Buffer | Uint8Array,
  fileName: string,
  contentType: string,
  tenantId: string,
  category: string = "documents"
): Promise<UploadResult> {
  try {
    const key = generateFileKey(tenantId, category, fileName);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: {
        originalName: fileName,
        tenantId,
        category,
        uploadedAt: new Date().toISOString()
      }
    });

    await getR2Client().send(command);

    // Return public URL if available, otherwise the key
    const url = PUBLIC_URL ? `${PUBLIC_URL}/${key}` : key;

    return {
      success: true,
      key,
      url
    };
  } catch (error) {
    console.error("R2 Upload Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "فشل رفع الملف"
    };
  }
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const url = await getSignedUrl(getR2Client(), command, { expiresIn });
    return url;
  } catch (error) {
    console.error("R2 Signed URL Error:", error);
    return null;
  }
}

/**
 * Get a signed URL for uploading (client-side upload)
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });

    const url = await getSignedUrl(getR2Client(), command, { expiresIn });
    return url;
  } catch (error) {
    console.error("R2 Upload URL Error:", error);
    return null;
  }
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await getR2Client().send(command);
    return true;
  } catch (error) {
    console.error("R2 Delete Error:", error);
    return false;
  }
}

/**
 * List files in a folder
 */
export async function listFiles(prefix: string, maxKeys: number = 100): Promise<FileMetadata[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys
    });

    const response = await getR2Client().send(command);

    return (response.Contents || []).map((obj) => ({
      key: obj.Key || "",
      size: obj.Size || 0,
      lastModified: obj.LastModified || new Date()
    }));
  } catch (error) {
    console.error("R2 List Error:", error);
    return [];
  }
}

/**
 * Get file as buffer (for server-side processing)
 */
export async function getFile(key: string, options: R2ReadOptions = {}): Promise<Buffer | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const response = await getR2Client().send(command, {
      ...(options.timeoutMs ? { abortSignal: AbortSignal.timeout(options.timeoutMs) } : {})
    });

    if (!response.Body) return null;

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    if (isR2ObjectMissing(error)) {
      return null;
    }

    if (!options.suppressErrorLog) {
      console.error("R2 Get Error:", error);
    }

    return null;
  }
}

export async function headFile(
  key: string,
  options: R2ReadOptions = {}
): Promise<FileMetadata | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const response = await getR2Client().send(command, {
      ...(options.timeoutMs ? { abortSignal: AbortSignal.timeout(options.timeoutMs) } : {})
    });

    return {
      key,
      size: Number(response.ContentLength ?? 0),
      lastModified: response.LastModified ?? new Date(),
      contentType: response.ContentType
    };
  } catch (error) {
    if (isR2ObjectMissing(error)) {
      return null;
    }

    if (!options.suppressErrorLog) {
      console.error("R2 Head Error:", error);
    }

    return null;
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(key: string): string {
  return PUBLIC_URL ? `${PUBLIC_URL}/${key}` : key;
}

/**
 * Validate file type
 */
export function isAllowedFileType(
  mimeType: string,
  allowedTypes: string[] = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]
): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size (in bytes)
 */
export function isAllowedFileSize(size: number, maxSizeMB: number = 10): boolean {
  return size <= maxSizeMB * 1024 * 1024;
}

export const r2Storage = {
  uploadFile,
  putFile,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  deleteFile,
  listFiles,
  getFile,
  headFile,
  getPublicUrl,
  isAllowedFileType,
  isAllowedFileSize,
  isR2Configured,
  generateFileKey
};

export default r2Storage;
