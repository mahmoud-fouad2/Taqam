import OpenApiViewer from "./openapi-viewer";

export const metadata = {
  title: "API Docs"
};

export default function DocsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">API Docs</h1>
        <p className="text-muted-foreground text-sm">
          This page shows the current OpenAPI JSON (incremental).
        </p>
      </div>
      <OpenApiViewer />
    </div>
  );
}
