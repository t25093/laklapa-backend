import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import {
  api,
  auth,
  createCategory,
  createProduct,
  createUser,
  orderBody,
  PASSWORD,
  prisma,
  resetDb,
} from "./helpers";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("ניהול משתמשים", () => {
  it("רק מעצבת יכולה לגשת (401 לאורחת, 403 ללקוחה)", async () => {
    const customer = await createUser(Role.CUSTOMER);
    expect((await api().get("/api/users")).status).toBe(401);
    expect((await api().get("/api/users").set(...auth(customer))).status).toBe(403);
    expect((await api().get(`/api/users/${customer.id}`).set(...auth(customer))).status).toBe(403);
    expect((await api().post("/api/users/admins").set(...auth(customer)).send({})).status).toBe(403);
  });

  it("רשימת לקוחות כוללת מספר הזמנות ולא כוללת מעצבות או סיסמאות", async () => {
    const admin = await createUser(Role.ADMIN);
    const noa = await createUser(Role.CUSTOMER, { fullName: "נועה כהן", email: "noa@test.local" });
    await createUser(Role.CUSTOMER, { fullName: "תמר לוי", email: "tamar@test.local", phone: "0529876543" });
    const category = await createCategory();
    const product = await createProduct(category.id);
    await api().post("/api/orders").set(...auth(noa)).send(orderBody(product.id));

    const res = await api().get("/api/users").set(...auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    expect(res.body.users.every((u: { role: string }) => u.role === "CUSTOMER")).toBe(true);
    const noaRow = res.body.users.find((u: { id: number }) => u.id === noa.id);
    expect(noaRow.ordersCount).toBe(1);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("חיפוש לקוחות לפי שם, אימייל וטלפון", async () => {
    const admin = await createUser(Role.ADMIN);
    await createUser(Role.CUSTOMER, { fullName: "נועה כהן", email: "noa@test.local", phone: "0501234567" });
    await createUser(Role.CUSTOMER, { fullName: "תמר לוי", email: "tamar@test.local", phone: "0529876543" });

    const byName = await api().get(`/api/users?search=${encodeURIComponent("נועה")}`).set(...auth(admin));
    expect(byName.body.users.map((u: { email: string }) => u.email)).toEqual(["noa@test.local"]);

    const byEmail = await api().get("/api/users?search=TAMAR").set(...auth(admin));
    expect(byEmail.body.users.map((u: { email: string }) => u.email)).toEqual(["tamar@test.local"]);

    const byPhone = await api().get("/api/users?search=052-987").set(...auth(admin));
    expect(byPhone.body.users.map((u: { email: string }) => u.email)).toEqual(["tamar@test.local"]);
  });

  it("רשימת מעצבות עם role=ADMIN", async () => {
    const admin = await createUser(Role.ADMIN);
    await createUser(Role.CUSTOMER);
    const res = await api().get("/api/users?role=ADMIN").set(...auth(admin));
    expect(res.body.users.map((u: { id: number }) => u.id)).toEqual([admin.id]);
    expect((await api().get("/api/users?role=BOSS").set(...auth(admin))).status).toBe(400);
  });

  it("פרטי לקוחה כוללים את ההזמנות שלה", async () => {
    const admin = await createUser(Role.ADMIN);
    const noa = await createUser(Role.CUSTOMER);
    const category = await createCategory();
    const product = await createProduct(category.id);
    await api().post("/api/orders").set(...auth(noa)).send(orderBody(product.id));

    const res = await api().get(`/api/users/${noa.id}`).set(...auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: noa.id, ordersCount: 1 });
    expect(res.body.user.orders[0]).toMatchObject({ totalAmount: 200, itemsCount: 1 });
    expect(res.body.user.passwordHash).toBeUndefined();

    expect((await api().get("/api/users/999").set(...auth(admin))).status).toBe(404);
  });

  it("מעצבת יוצרת מעצבת חדשה שיכולה להתחבר", async () => {
    const admin = await createUser(Role.ADMIN);
    const res = await api().post("/api/users/admins").set(...auth(admin)).send({
      fullName: "עובדת חדשה",
      email: "worker@laklapa.test",
      phone: "0507777777",
      password: "Worker2026",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("ADMIN");

    const login = await api().post("/api/auth/login").send({ email: "worker@laklapa.test", password: "Worker2026" });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe("ADMIN");

    // המעצבת החדשה יכולה לבצע פעולת ניהול
    const asNewAdmin = await api().get("/api/users").set("Authorization", `Bearer ${login.body.token}`);
    expect(asNewAdmin.status).toBe(200);
  });

  it("יצירת מעצבת עם אימייל קיים מחזירה 409 ועם נתונים חסרים 400", async () => {
    const admin = await createUser(Role.ADMIN, { email: "admin@test.local" });
    const dup = await api().post("/api/users/admins").set(...auth(admin)).send({
      fullName: "כפולה",
      email: "admin@test.local",
      phone: "0507777777",
      password: PASSWORD,
    });
    expect(dup.status).toBe(409);
    expect((await api().post("/api/users/admins").set(...auth(admin)).send({ email: "x" })).status).toBe(400);
  });
});
