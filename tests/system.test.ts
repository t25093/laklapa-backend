import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { openApiDocument } from "../src/docs/openapi";
import { api, prisma } from "./helpers";

afterAll(() => prisma.$disconnect());

/** כל ה-Endpoints שאושרו באפיון */
const SPEC_ENDPOINTS = [
  "GET /api/health",
  "POST /api/auth/register",
  "POST /api/auth/login",
  "GET /api/auth/me",
  "GET /api/categories",
  "POST /api/categories",
  "PUT /api/categories/{id}",
  "DELETE /api/categories/{id}",
  "GET /api/products",
  "POST /api/products",
  "GET /api/products/{id}",
  "PUT /api/products/{id}",
  "POST /api/orders",
  "GET /api/orders",
  "GET /api/orders/my",
  "GET /api/orders/{id}",
  "PATCH /api/orders/{id}/cancel",
  "PATCH /api/orders/{id}/status",
  "GET /api/users",
  "POST /api/users/admins",
  "GET /api/users/{id}",
  "POST /api/contact",
  "GET /api/contact",
  "PATCH /api/contact/{id}",
];

type Operation = {
  summary?: string;
  tags?: string[];
  security?: unknown[];
  responses?: Record<string, unknown>;
  parameters?: Array<{ in: string; name: string }>;
};

const paths = openApiDocument.paths as Record<string, Record<string, Operation>>;
const documented = Object.entries(paths).flatMap(([path, methods]) =>
  Object.keys(methods).map((method) => `${method.toUpperCase()} ${path}`),
);

describe("מערכת", () => {
  it("GET /api/health מחזיר ok כשמסד הנתונים מחובר", async () => {
    const res = await api().get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", database: "connected" });
  });

  it("כתובת לא קיימת מחזירה 404 בפורמט JSON אחיד", async () => {
    const res = await api().get("/api/nothing-here");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("CORS מחזיר כותרת Access-Control-Allow-Origin", async () => {
    const res = await api().get("/api/health").set("Origin", "http://localhost:5173");
    expect(res.headers["access-control-allow-origin"]).toBeDefined();
  });
});

describe("Swagger / OpenAPI", () => {
  it("Swagger UI נפתח ב-/api-docs", async () => {
    const res = await api().get("/api-docs/").redirects(1);
    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger-ui");
  });

  it("המסמך זמין ב-/api-docs.json", async () => {
    const res = await api().get("/api-docs.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
  });

  it("כל ה-Endpoints מהאפיון מתועדים, ואין Endpoints מיותרים", () => {
    expect([...documented].sort()).toEqual([...SPEC_ENDPOINTS].sort());
  });

  it("קיים Security Scheme מסוג HTTP Bearer JWT (כפתור Authorize)", () => {
    expect(openApiDocument.components.securitySchemes.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
  });

  it("לכל Endpoint יש תיאור, תגית, הגדרת אבטחה, תשובות, ופרמטר לכל {id}", () => {
    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, op] of Object.entries(methods)) {
        const label = `${method.toUpperCase()} ${path}`;
        expect(op.summary, label).toBeTruthy();
        expect(op.tags?.length, label).toBeGreaterThan(0);
        expect(op.security, label).toBeDefined();
        expect(Object.keys(op.responses ?? {}).length, label).toBeGreaterThan(0);
        if (path.includes("{id}")) {
          expect(op.parameters?.some((p) => p.in === "path" && p.name === "id"), label).toBe(true);
        }
      }
    }
  });

  it("Endpoint פרטי מתעד 401, וכל $ref מצביע לרכיב קיים", () => {
    const doc = openApiDocument as unknown as Record<string, unknown>;
    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, op] of Object.entries(methods)) {
        const isPrivate = JSON.stringify(op.security) === JSON.stringify([{ bearerAuth: [] }]);
        if (isPrivate) {
          expect(op.responses?.["401"], `${method} ${path}`).toBeDefined();
        }
      }
    }
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (node && typeof node === "object") {
        for (const [key, value] of Object.entries(node)) {
          if (key === "$ref" && typeof value === "string") {
            const target = value
              .replace(/^#\//, "")
              .split("/")
              .reduce<unknown>((acc, part) => (acc as Record<string, unknown> | undefined)?.[part], doc);
            expect(target, value).toBeDefined();
          } else {
            walk(value);
          }
        }
      }
    };
    walk(doc);
  });

  it("docs/openapi.json מעודכן ותואם לתיעוד בקוד", () => {
    const file = JSON.parse(readFileSync(join(__dirname, "..", "docs", "openapi.json"), "utf8"));
    expect(file).toEqual(JSON.parse(JSON.stringify(openApiDocument)));
  });
});

describe("Prisma", () => {
  it("כל הטבלאות מהאפיון קיימות במסד הנתונים", async () => {
    const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    const tables = rows.map((r) => r.table_name);
    expect(tables).toEqual(
      expect.arrayContaining(["users", "categories", "products", "orders", "order_items", "contact_messages"]),
    );
  });
});
