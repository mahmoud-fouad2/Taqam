"use client";

import { useEffect, useMemo, useState } from "react";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; spec: any };

export default function OpenApiViewer() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/openapi", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load spec: ${res.status}`);
        const json = await res.json();
        if (!cancelled) setState({ status: "ready", spec: json });
      } catch (e: any) {
        if (!cancelled) setState({ status: "error", message: e?.message ?? "Unknown error" });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const downloadHref = useMemo(() => {
    if (state.status !== "ready") return null;
    const blob = new Blob([JSON.stringify(state.spec, null, 2)], { type: "application/json" });
    return URL.createObjectURL(blob);
  }, [state]);

  if (state.status === "loading") {
    return <div className="text-muted-foreground text-sm">Loading OpenAPI spec…</div>;
  }

  if (state.status === "error") {
    return (
      <div className="space-y-2">
        <div className="text-destructive text-sm">{state.message}</div>
        <a className="text-sm underline" href="/api/openapi" target="_blank" rel="noreferrer">
          Open JSON
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <a className="text-sm underline" href="/api/openapi" target="_blank" rel="noreferrer">
          Open JSON
        </a>
        {downloadHref ? (
          <a className="text-sm underline" href={downloadHref} download="openapi.json">
            Download
          </a>
        ) : null}
      </div>

      <pre className="bg-muted/30 max-h-[70vh] overflow-auto rounded-md border p-3 text-xs">
        {JSON.stringify(state.spec, null, 2)}
      </pre>
    </div>
  );
}
