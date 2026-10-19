import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { api, auth, createCategory, createProduct, createUser, prisma, resetDb } from "./helpers";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("Categories", () => {
  it("רשימת קטגוריות פתוחה לכולם וממוינת לפי שם", async () => {
    await createCategory("עציצים");
    await createCategory("אירועים");
    const res = await api().get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.categories.map((c: { name: string }) => c.name)).toEqual(["אירועים", "עציצים"]);
  });

  it("אורחת לא יכולה להוסיף קטגוריה (401)", async () => {
    const res = await api().post("/api/categories").send({ name: "חדשה" });
    expect(res.status).toBe(401);
  });

  it("לקוחה לא יכולה להוסיף קטגוריה (403)", async () => {
    const customer = await createUser(Role.CUSTOMER);
    const res = await api().post("/api/categories").set(...auth(customer)).send({ name: "חדשה" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("מעצבת מוסיפה, עורכת ומוחקת קטגוריה", async () => {
    const admin = await createUser(Role.ADMIN);

    const created = await api().post("/api/categories").set(...auth(admin)).send({ name: "  מארזים  " });
    expect(created.status).toBe(201);
    expect(created.body.category.name).toBe("מארזים");
    const id = created.body.category.id;

    const updated = await api().put(`/api/categories/${id}`).set(...auth(admin)).send({ name: "מארזי מתנה" });
    expect(updated.status).toBe(200);
    expect(updated.body.category.name).toBe("מארזי מתנה");

    const removed = await api().delete(`/api/categories/${id}`).set(...auth(admin));
    expect(removed.status).toBe(204);
    expect(await prisma.category.count()).toBe(0);
  });

  it("שם כפול מחזיר 409", async () => {
    const admin = await createUser(Role.ADMIN);
    await createCategory("זרים");
    const res = await api().post("/api/categories").set(...auth(admin)).send({ name: "זרים" });
    expect(res.status).toBe(409);
  });

  it("שם קצר מדי מחזיר 400", async () => {
    const admin = await createUser(Role.ADMIN);
    const res = await api().post("/api/categories").set(...auth(admin)).send({ name: "א" });
    expect(res.status).toBe(400);
  });

  it("אי אפשר למחוק קטגוריה שיש בה מוצרים (409)", async () => {
    const admin = await createUser(Role.ADMIN);
    const category = await createCategory("זרים");
    await createProduct(category.id);
    const res = await api().delete(`/api/categories/${category.id}`).set(...auth(admin));
    expect(res.status).toBe(409);
    expect(await prisma.category.count()).toBe(1);
  });

  it("עריכה ומחיקה של קטגוריה שלא קיימת מחזירות 404", async () => {
    const admin = await createUser(Role.ADMIN);
    expect((await api().put("/api/categories/999").set(...auth(admin)).send({ name: "שם" })).status).toBe(404);
    expect((await api().delete("/api/categories/999").set(...auth(admin))).status).toBe(404);
  });

  it("מזהה לא מספרי מחזיר 400", async () => {
    const admin = await createUser(Role.ADMIN);
    const res = await api().delete("/api/categories/abc").set(...auth(admin));
    expect(res.status).toBe(400);
  });
});
