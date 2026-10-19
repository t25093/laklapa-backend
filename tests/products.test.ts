import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { api, auth, createCategory, createProduct, createUser, prisma, resetDb } from "./helpers";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const validProduct = (categoryId: number) => ({
  name: "זר ורדים לבנים",
  description: "עשרים ורדים לבנים עם ירק עונתי ועטיפה אלגנטית.",
  price: 219.9,
  imageUrl: "https://placehold.co/600x400?text=Roses",
  categoryId,
});

describe("GET /api/products", () => {
  it("מציג רק מוצרים זמינים, מהחדש לישן, עם מחיר כמספר", async () => {
    const category = await createCategory("זרים");
    await createProduct(category.id, { name: "ישן", price: 99.5 });
    await createProduct(category.id, { name: "מוסתר", isActive: false });
    await createProduct(category.id, { name: "חדש" });

    const res = await api().get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.products.map((p: { name: string }) => p.name)).toEqual(["חדש", "ישן"]);
    expect(res.body.products[1].price).toBe(99.5);
    expect(res.body.products[0].category).toEqual({ id: category.id, name: "זרים" });
  });

  it("מסנן לפי קטגוריה", async () => {
    const flowers = await createCategory("זרים");
    const plants = await createCategory("עציצים");
    await createProduct(flowers.id, { name: "זר" });
    await createProduct(plants.id, { name: "סחלב" });

    const res = await api().get(`/api/products?categoryId=${plants.id}`);
    expect(res.status).toBe(200);
    expect(res.body.products.map((p: { name: string }) => p.name)).toEqual(["סחלב"]);
  });

  it("categoryId לא תקין מחזיר 400", async () => {
    const res = await api().get("/api/products?categoryId=abc");
    expect(res.status).toBe(400);
  });

  it("מעצבת עם includeInactive=true רואה גם מוסתרים", async () => {
    const admin = await createUser(Role.ADMIN);
    const category = await createCategory();
    await createProduct(category.id, { name: "זמין" });
    await createProduct(category.id, { name: "מוסתר", isActive: false });

    const res = await api().get("/api/products?includeInactive=true").set(...auth(admin));
    expect(res.body.products).toHaveLength(2);
  });

  it("לקוחה עם includeInactive=true עדיין רואה רק זמינים", async () => {
    const customer = await createUser(Role.CUSTOMER);
    const category = await createCategory();
    await createProduct(category.id, { name: "זמין" });
    await createProduct(category.id, { name: "מוסתר", isActive: false });

    const res = await api().get("/api/products?includeInactive=true").set(...auth(customer));
    expect(res.body.products).toHaveLength(1);
  });
});

describe("GET /api/products/:id", () => {
  it("מחזיר מוצר זמין לכולם", async () => {
    const category = await createCategory();
    const product = await createProduct(category.id);
    const res = await api().get(`/api/products/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.product.id).toBe(product.id);
  });

  it("מוצר מוסתר מחזיר 404 לאורחת ו-200 למעצבת", async () => {
    const admin = await createUser(Role.ADMIN);
    const category = await createCategory();
    const hidden = await createProduct(category.id, { isActive: false });

    expect((await api().get(`/api/products/${hidden.id}`)).status).toBe(404);
    const asAdmin = await api().get(`/api/products/${hidden.id}`).set(...auth(admin));
    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body.product.isActive).toBe(false);
  });

  it("מוצר שלא קיים מחזיר 404", async () => {
    expect((await api().get("/api/products/12345")).status).toBe(404);
  });
});

describe("POST /api/products", () => {
  it("מעצבת יוצרת מוצר", async () => {
    const admin = await createUser(Role.ADMIN);
    const category = await createCategory();
    const res = await api().post("/api/products").set(...auth(admin)).send(validProduct(category.id));

    expect(res.status).toBe(201);
    expect(res.body.product).toMatchObject({ name: "זר ורדים לבנים", price: 219.9, isActive: true });
    expect(await prisma.product.count()).toBe(1);
  });

  it("לקוחה מקבלת 403 ואורחת מקבלת 401", async () => {
    const customer = await createUser(Role.CUSTOMER);
    const category = await createCategory();
    expect((await api().post("/api/products").send(validProduct(category.id))).status).toBe(401);
    expect(
      (await api().post("/api/products").set(...auth(customer)).send(validProduct(category.id))).status,
    ).toBe(403);
  });

  it("ולידציה: מחיר שלילי, שם קצר, קישור לא תקין ושדות חסרים", async () => {
    const admin = await createUser(Role.ADMIN);
    const res = await api()
      .post("/api/products")
      .set(...auth(admin))
      .send({ name: "א", price: -5, imageUrl: "not a url" });

    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["name", "price", "imageUrl", "description", "categoryId"]));
  });

  it("מחיר עם יותר מ-2 ספרות אחרי הנקודה מחזיר 400", async () => {
    const admin = await createUser(Role.ADMIN);
    const category = await createCategory();
    const res = await api()
      .post("/api/products")
      .set(...auth(admin))
      .send({ ...validProduct(category.id), price: 10.555 });
    expect(res.status).toBe(400);
  });

  it("קטגוריה שלא קיימת מחזירה 400", async () => {
    const admin = await createUser(Role.ADMIN);
    const res = await api().post("/api/products").set(...auth(admin)).send(validProduct(999));
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe("categoryId");
  });
});

describe("PUT /api/products/:id", () => {
  it("מעצבת עורכת מחיר ומסתירה מוצר", async () => {
    const admin = await createUser(Role.ADMIN);
    const category = await createCategory();
    const product = await createProduct(category.id, { price: 100 });

    const res = await api()
      .put(`/api/products/${product.id}`)
      .set(...auth(admin))
      .send({ price: 120.5, isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.product).toMatchObject({ price: 120.5, isActive: false });
    expect((await api().get("/api/products")).body.products).toHaveLength(0);
  });

  it("גוף ריק מחזיר 400", async () => {
    const admin = await createUser(Role.ADMIN);
    const category = await createCategory();
    const product = await createProduct(category.id);
    const res = await api().put(`/api/products/${product.id}`).set(...auth(admin)).send({});
    expect(res.status).toBe(400);
  });

  it("לקוחה לא יכולה לערוך (403) ומוצר לא קיים מחזיר 404", async () => {
    const admin = await createUser(Role.ADMIN);
    const customer = await createUser(Role.CUSTOMER);
    const category = await createCategory();
    const product = await createProduct(category.id);

    expect((await api().put(`/api/products/${product.id}`).set(...auth(customer)).send({ price: 1 })).status).toBe(403);
    expect((await api().put("/api/products/999").set(...auth(admin)).send({ price: 1 })).status).toBe(404);
  });
});
