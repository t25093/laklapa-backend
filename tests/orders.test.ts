import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { OrderStatus, Role } from "@prisma/client";
import {
  api,
  auth,
  createCategory,
  createProduct,
  createUser,
  orderBody,
  prisma,
  resetDb,
  today,
  tomorrow,
} from "./helpers";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

async function setup() {
  const admin = await createUser(Role.ADMIN);
  const noa = await createUser(Role.CUSTOMER, { fullName: "נועה" });
  const tamar = await createUser(Role.CUSTOMER, { fullName: "תמר" });
  const category = await createCategory();
  const bouquet = await createProduct(category.id, { name: "זר", price: 150 });
  const box = await createProduct(category.id, { name: "מארז", price: 89.9 });
  const hidden = await createProduct(category.id, { name: "מוסתר", isActive: false });
  return { admin, noa, tamar, bouquet, box, hidden };
}

describe("POST /api/orders", () => {
  it("לקוחה יוצרת הזמנה מסל עם כמה מוצרים, והשרת מחשב את הסכום", async () => {
    const { noa, bouquet, box } = await setup();
    const body = orderBody(bouquet.id, {
      items: [
        { productId: bouquet.id, quantity: 2, preferredColor: "PINK", notes: "בלי חבצלות" },
        { productId: box.id, quantity: 1, preferredColor: "MIXED" },
      ],
      // ניסיון לשלוח מחיר / משתמשת אחרת - צריך להתעלם
      totalAmount: 1,
      userId: 999,
    });

    const res = await api().post("/api/orders").set(...auth(noa)).send(body);

    expect(res.status).toBe(201);
    const order = res.body.order;
    expect(order.status).toBe("RECEIVED");
    expect(order.totalAmount).toBe(389.9);
    expect(order.items).toHaveLength(2);
    expect(order.items[0]).toMatchObject({ quantity: 2, unitPrice: 150, lineTotal: 300, preferredColor: "PINK" });
    expect(order.items[1].notes).toBeNull();
    expect(order.recipientPhone).toBe("0527654321");

    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.userId).toBe(noa.id);
  });

  it("שינוי מחיר אחרי ההזמנה לא משנה הזמנה קיימת", async () => {
    const { noa, bouquet } = await setup();
    const res = await api().post("/api/orders").set(...auth(noa)).send(orderBody(bouquet.id));
    await prisma.product.update({ where: { id: bouquet.id }, data: { price: 999 } });

    const again = await api().get(`/api/orders/${res.body.order.id}`).set(...auth(noa));
    expect(again.body.order.totalAmount).toBe(300);
  });

  it("איסוף עצמי לא דורש כתובת ושומר כתובת ריקה", async () => {
    const { noa, bouquet } = await setup();
    const res = await api()
      .post("/api/orders")
      .set(...auth(noa))
      .send(orderBody(bouquet.id, { deliveryMethod: "PICKUP", deliveryAddress: "לא אמור להישמר" }));
    expect(res.status).toBe(201);
    expect(res.body.order.deliveryAddress).toBeNull();
  });

  it("משלוח בלי כתובת מחזיר 400", async () => {
    const { noa, bouquet } = await setup();
    const res = await api()
      .post("/api/orders")
      .set(...auth(noa))
      .send(orderBody(bouquet.id, { deliveryAddress: "" }));
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe("deliveryAddress");
  });

  it("תאריך של היום מחזיר 400, ומחר מתקבל", async () => {
    const { noa, bouquet } = await setup();
    const bad = await api().post("/api/orders").set(...auth(noa)).send(orderBody(bouquet.id, { requestedDate: today() }));
    expect(bad.status).toBe(400);
    expect(bad.body.error.details[0].field).toBe("requestedDate");

    const good = await api()
      .post("/api/orders")
      .set(...auth(noa))
      .send(orderBody(bouquet.id, { requestedDate: tomorrow() }));
    expect(good.status).toBe(201);
  });

  it("תאריך לא קיים (31 בפברואר) מחזיר 400", async () => {
    const { noa, bouquet } = await setup();
    const res = await api()
      .post("/api/orders")
      .set(...auth(noa))
      .send(orderBody(bouquet.id, { requestedDate: "2030-02-31" }));
    expect(res.status).toBe(400);
  });

  it("ולידציה: סל ריק, כמות 0, צבע לא קיים", async () => {
    const { noa, bouquet } = await setup();
    const empty = await api().post("/api/orders").set(...auth(noa)).send(orderBody(bouquet.id, { items: [] }));
    expect(empty.status).toBe(400);

    const bad = await api()
      .post("/api/orders")
      .set(...auth(noa))
      .send(orderBody(bouquet.id, { items: [{ productId: bouquet.id, quantity: 0, preferredColor: "BLUE" }] }));
    expect(bad.status).toBe(400);
    const fields = bad.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["items.0.quantity", "items.0.preferredColor"]));
  });

  it("מוצר מוסתר או לא קיים מחזיר 400 ולא נוצרת הזמנה", async () => {
    const { noa, bouquet, hidden } = await setup();
    const res = await api()
      .post("/api/orders")
      .set(...auth(noa))
      .send(
        orderBody(bouquet.id, {
          items: [
            { productId: bouquet.id, quantity: 1, preferredColor: "RED" },
            { productId: hidden.id, quantity: 1, preferredColor: "RED" },
            { productId: 9999, quantity: 1, preferredColor: "RED" },
          ],
        }),
      );
    expect(res.status).toBe(400);
    expect(res.body.error.details).toHaveLength(2);
    expect(await prisma.order.count()).toBe(0);
  });

  it("אורחת מקבלת 401 ומעצבת מקבלת 403", async () => {
    const { admin, bouquet } = await setup();
    expect((await api().post("/api/orders").send(orderBody(bouquet.id))).status).toBe(401);
    expect((await api().post("/api/orders").set(...auth(admin)).send(orderBody(bouquet.id))).status).toBe(403);
  });
});

describe("צפייה בהזמנות והגנה על מידע פרטי", () => {
  async function withOrders() {
    const data = await setup();
    const noaOrder = await api().post("/api/orders").set(...auth(data.noa)).send(orderBody(data.bouquet.id));
    const tamarOrder = await api()
      .post("/api/orders")
      .set(...auth(data.tamar))
      .send(orderBody(data.box.id, { recipientName: "משה דוד" }));
    return { ...data, noaOrderId: noaOrder.body.order.id as number, tamarOrderId: tamarOrder.body.order.id as number };
  }

  it("GET /api/orders/my מחזיר רק את ההזמנות של הלקוחה המחוברת", async () => {
    const { noa, noaOrderId } = await withOrders();
    const res = await api().get("/api/orders/my").set(...auth(noa));
    expect(res.status).toBe(200);
    expect(res.body.orders.map((o: { id: number }) => o.id)).toEqual([noaOrderId]);
    expect(res.body.orders[0]).toMatchObject({ itemsCount: 1, totalAmount: 300 });
  });

  it("לקוחה לא יכולה לראות הזמנה של לקוחה אחרת (404)", async () => {
    const { noa, tamarOrderId } = await withOrders();
    const res = await api().get(`/api/orders/${tamarOrderId}`).set(...auth(noa));
    expect(res.status).toBe(404);
  });

  it("לקוחה רואה את ההזמנה שלה בלי פרטי customer", async () => {
    const { noa, noaOrderId } = await withOrders();
    const res = await api().get(`/api/orders/${noaOrderId}`).set(...auth(noa));
    expect(res.status).toBe(200);
    expect(res.body.order.customer).toBeUndefined();
  });

  it("מעצבת רואה כל הזמנה כולל פרטי הלקוחה", async () => {
    const { admin, tamar, tamarOrderId } = await withOrders();
    const res = await api().get(`/api/orders/${tamarOrderId}`).set(...auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.order.customer).toMatchObject({ id: tamar.id, fullName: "תמר" });
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("לקוחה לא יכולה לראות את רשימת כל ההזמנות (403), ומעצבת לא משתמשת ב-my (403)", async () => {
    const { admin, noa } = await withOrders();
    expect((await api().get("/api/orders").set(...auth(noa))).status).toBe(403);
    expect((await api().get("/api/orders/my").set(...auth(admin))).status).toBe(403);
    expect((await api().get("/api/orders/my")).status).toBe(401);
  });

  it("מעצבת רואה את כל ההזמנות ומסננת לפי סטטוס, חיפוש ותאריכים", async () => {
    const { admin, noaOrderId, tamarOrderId } = await withOrders();
    await prisma.order.update({ where: { id: tamarOrderId }, data: { status: OrderStatus.IN_PREPARATION } });

    const all = await api().get("/api/orders").set(...auth(admin));
    expect(all.status).toBe(200);
    expect(all.body.orders).toHaveLength(2);
    expect(all.body.orders[0].customer).toEqual(expect.objectContaining({ fullName: expect.any(String) }));

    const byStatus = await api().get("/api/orders?status=IN_PREPARATION").set(...auth(admin));
    expect(byStatus.body.orders.map((o: { id: number }) => o.id)).toEqual([tamarOrderId]);

    const byName = await api().get(`/api/orders?search=${encodeURIComponent("משה")}`).set(...auth(admin));
    expect(byName.body.orders.map((o: { id: number }) => o.id)).toEqual([tamarOrderId]);

    const byNumber = await api().get(`/api/orders?search=${noaOrderId}`).set(...auth(admin));
    expect(byNumber.body.orders.map((o: { id: number }) => o.id)).toEqual([noaOrderId]);

    const order = await prisma.order.findUniqueOrThrow({ where: { id: noaOrderId } });
    const date = order.requestedDate.toISOString().slice(0, 10);
    const byDate = await api().get(`/api/orders?from=${date}&to=${date}`).set(...auth(admin));
    expect(byDate.body.orders).toHaveLength(2);

    const none = await api().get("/api/orders?from=2099-01-01").set(...auth(admin));
    expect(none.body.orders).toHaveLength(0);
  });

  it("פרמטרי סינון לא תקינים מחזירים 400", async () => {
    const { admin } = await withOrders();
    expect((await api().get("/api/orders?status=LOST").set(...auth(admin))).status).toBe(400);
    expect((await api().get("/api/orders?from=2026-05-10&to=2026-05-01").set(...auth(admin))).status).toBe(400);
  });
});

describe("ביטול ושינוי סטטוס", () => {
  it("לקוחה מבטלת הזמנה שלה בסטטוס RECEIVED", async () => {
    const { noa, bouquet } = await setup();
    const created = await api().post("/api/orders").set(...auth(noa)).send(orderBody(bouquet.id));
    const res = await api().patch(`/api/orders/${created.body.order.id}/cancel`).set(...auth(noa));
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("CANCELLED");
  });

  it("אחרי שהמעצבת התחילה להכין - הלקוחה לא יכולה לבטל (409)", async () => {
    const { admin, noa, bouquet } = await setup();
    const created = await api().post("/api/orders").set(...auth(noa)).send(orderBody(bouquet.id));
    const id = created.body.order.id;

    const status = await api().patch(`/api/orders/${id}/status`).set(...auth(admin)).send({ status: "IN_PREPARATION" });
    expect(status.status).toBe(200);
    expect(status.body.order.status).toBe("IN_PREPARATION");

    const cancel = await api().patch(`/api/orders/${id}/cancel`).set(...auth(noa));
    expect(cancel.status).toBe(409);
  });

  it("לקוחה לא יכולה לבטל הזמנה של אחרת (404) ולא לשנות סטטוס (403)", async () => {
    const { noa, tamar, bouquet } = await setup();
    const created = await api().post("/api/orders").set(...auth(noa)).send(orderBody(bouquet.id));
    const id = created.body.order.id;

    expect((await api().patch(`/api/orders/${id}/cancel`).set(...auth(tamar))).status).toBe(404);
    expect(
      (await api().patch(`/api/orders/${id}/status`).set(...auth(noa)).send({ status: "DELIVERED" })).status,
    ).toBe(403);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(saved.status).toBe(OrderStatus.RECEIVED);
  });

  it("הזמנה שנמסרה לא ניתנת לשינוי (409) וסטטוס לא תקין מחזיר 400", async () => {
    const { admin, noa, bouquet } = await setup();
    const created = await api().post("/api/orders").set(...auth(noa)).send(orderBody(bouquet.id));
    const id = created.body.order.id;

    expect((await api().patch(`/api/orders/${id}/status`).set(...auth(admin)).send({ status: "WRONG" })).status).toBe(400);
    expect((await api().patch(`/api/orders/${id}/status`).set(...auth(admin)).send({ status: "DELIVERED" })).status).toBe(200);
    expect(
      (await api().patch(`/api/orders/${id}/status`).set(...auth(admin)).send({ status: "CANCELLED" })).status,
    ).toBe(409);
  });

  it("הזמנה שלא קיימת מחזירה 404", async () => {
    const { admin } = await setup();
    expect((await api().patch("/api/orders/999/status").set(...auth(admin)).send({ status: "SHIPPED" })).status).toBe(404);
    expect((await api().get("/api/orders/999").set(...auth(admin))).status).toBe(404);
  });
});
