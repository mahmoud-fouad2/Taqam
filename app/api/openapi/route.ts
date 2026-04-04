import { NextResponse } from "next/server";

/**
 * Minimal OpenAPI spec endpoint.
 * Start small (audit endpoints) and extend incrementally.
 */
export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Taqam API",
      version: "0.1.0",
      description: "Incremental OpenAPI spec for Taqam.",
    },
    tags: [{ name: "Audit" }, { name: "Employees" }],
    paths: {
      "/api/audit-logs": {
        get: {
          tags: ["Audit"],
          summary: "List audit logs",
          description: "Admin-only. Supports filtering and pagination.",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
            {
              name: "pageSize",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 200 },
            },
            { name: "userId", in: "query", schema: { type: "string" } },
            { name: "entity", in: "query", schema: { type: "string" } },
            { name: "entityId", in: "query", schema: { type: "string" } },
            {
              name: "action",
              in: "query",
              schema: { type: "string" },
              description: "AuditAction string",
            },
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date-time" },
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date-time" },
            },
          ],
          responses: {
            "200": {
              description: "Audit logs",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { type: "object" } },
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "integer" },
                          pageSize: { type: "integer" },
                          total: { type: "integer" },
                          totalPages: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/api/audit-logs/stats": {
        get: {
          tags: ["Audit"],
          summary: "Audit stats",
          description: "Admin-only. Returns aggregated statistics.",
          responses: {
            "200": {
              description: "Stats",
              content: {
                "application/json": {
                  schema: { type: "object" },
                },
              },
            },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/api/employees/bulk": {
        post: {
          tags: ["Employees"],
          summary: "Bulk import employees",
          description:
            "Creates employees in bulk. Supports dryRun and atomic modes. Tenant-admin/HR only.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tenantId: { type: "string", description: "Required for SUPER_ADMIN" },
                    dryRun: { type: "boolean", default: false },
                    atomic: { type: "boolean", default: false },
                    employees: { type: "array", items: { type: "object" } },
                  },
                  required: ["employees"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Result summary" },
            "400": { description: "Invalid payload / atomic failure" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/api/employees/import": {
        post: {
          tags: ["Employees"],
          summary: "Import employees from CSV",
          description:
            "Uploads a CSV file (multipart/form-data) and imports valid rows. Returns imported count and row-level errors.",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: { type: "string", format: "binary" },
                    tenantId: { type: "string", description: "Required for SUPER_ADMIN" },
                  },
                  required: ["file"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Import result" },
            "400": { description: "Missing/invalid file or tenant" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/api/employees/export": {
        get: {
          tags: ["Employees"],
          summary: "Export employees to CSV",
          description: "Returns a CSV file of employees for the current tenant (supports basic filters).",
          parameters: [
            { name: "departmentId", in: "query", schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "CSV file" },
            "401": { description: "Unauthorized" },
            "400": { description: "Tenant required" },
          },
        },
      },
    },
  } as const;

  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
