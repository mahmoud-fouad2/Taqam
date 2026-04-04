function parseFilenameFromDisposition(disposition: string | null, fallback: string) {
  if (!disposition) return fallback;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] || fallback;
}

async function parseErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    if (payload && typeof payload === "object") {
      return payload.error || payload.message || "Request failed";
    }
  }

  return (await response.text().catch(() => "")) || "Request failed";
}

export async function fetchBlobOrThrow(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const blob = await response.blob();
  const filename = parseFilenameFromDisposition(response.headers.get("content-disposition"), "download.bin");
  return { blob, filename, contentType: response.headers.get("content-type") || blob.type };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function openBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}