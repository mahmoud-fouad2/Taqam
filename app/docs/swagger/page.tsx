import SwaggerUi from "./swagger-ui";

export const metadata = {
  title: "Swagger UI"
};

export default function SwaggerPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="mb-4 space-y-1">
          <h1 className="text-2xl font-semibold">Swagger UI</h1>
          <p className="text-muted-foreground text-sm">Powered by /api/openapi</p>
        </div>
        <div className="bg-card rounded-md border p-2">
          <SwaggerUi />
        </div>
      </div>
    </div>
  );
}
