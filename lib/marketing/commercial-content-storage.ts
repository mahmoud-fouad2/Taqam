import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

type ReadCommercialContentOptions<T> = {
  filePath: string;
  remoteKey: string;
  normalize: (value: unknown) => T;
};

function hasCommercialR2Config() {
  return Boolean(
    (process.env.R2_ENDPOINT || process.env.R2_ACCOUNT_ID) &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
  );
}

async function getCommercialRemoteStorage() {
  if (!hasCommercialR2Config()) {
    return null;
  }

  const remoteStorage = await import("@/lib/r2-storage");
  return {
    getFile: remoteStorage.getFile,
    headFile: remoteStorage.headFile,
    putFile: remoteStorage.putFile
  };
}

function safeParseJson(value: string): unknown {
  return JSON.parse(value);
}

async function readLocalJson<T>({
  filePath,
  normalize
}: Pick<ReadCommercialContentOptions<T>, "filePath" | "normalize">): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return normalize(safeParseJson(raw));
  } catch {
    return null;
  }
}

async function writeLocalFileAtomically(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });

  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    await writeFile(tempPath, content, "utf8");
    await rename(tempPath, filePath);
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

export async function readCommercialContent<T>(
  options: ReadCommercialContentOptions<T>
): Promise<T | null> {
  const remoteStorage = await getCommercialRemoteStorage();

  if (remoteStorage) {
    const remoteBuffer = await remoteStorage.getFile(options.remoteKey);
    if (remoteBuffer) {
      try {
        return options.normalize(safeParseJson(remoteBuffer.toString("utf8")));
      } catch {
        // Fall through to the local fallback for recovery from malformed remote content.
      }
    }
  }

  return readLocalJson(options);
}

export async function readCommercialContentTimestamp(options: {
  filePath: string;
  remoteKey: string;
}): Promise<string | null> {
  const remoteStorage = await getCommercialRemoteStorage();

  if (remoteStorage) {
    const remoteMetadata = await remoteStorage.headFile(options.remoteKey);
    if (remoteMetadata?.lastModified) {
      return remoteMetadata.lastModified.toISOString();
    }
  }

  try {
    const result = await stat(options.filePath);
    return result.mtime.toISOString();
  } catch {
    return null;
  }
}

export async function writeCommercialContent(options: {
  filePath: string;
  remoteKey: string;
  value: unknown;
}): Promise<void> {
  const payload = `${JSON.stringify(options.value, null, 2)}\n`;
  const remoteStorage = await getCommercialRemoteStorage();

  if (remoteStorage) {
    const storedRemotely = await remoteStorage.putFile(
      options.remoteKey,
      Buffer.from(payload, "utf8"),
      "application/json",
      {
        source: "commercial-content",
        updatedAt: new Date().toISOString()
      }
    );

    if (!storedRemotely) {
      throw new Error(`Failed to persist commercial content to R2: ${options.remoteKey}`);
    }
  }

  await writeLocalFileAtomically(options.filePath, payload);
}