import { afterAll, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { api, createUser, expiredTokenFor, PASSWORD, prisma, resetDb, tokenFor } from "./helpers";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("POST /api/auth/register", () => {
  it("יוצרת לקוחה חדשה ומחזירה Token", async () => {
    const res = await api().post("/api/auth/register").send({
      fullName: "דינה מזרחי",
      email: "Dina@Example.com",
      phone: "050-9876543",
      password: "Dina2026x",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      fullName: "דינה מזרחי",
      email: "dina@example.com",
      phone: "0509876543",
      role: "CUSTOMER",
    });
    expect(res.body.user.passwordHash).toBeUndefined();

    const saved = await prisma.user.findUniqueOrThrow({ where: { email: "dina@example.com" } });
    expect(saved.passwordHash).not.toBe("Dina2026x");
    expect(saved.passwordHash.startsWith("$2")).toBe(true);
  });

  it("מתעלמת מ-role שנשלח - תמיד יוצרת לקוחה", async () => {
    const res = await api().post("/api/auth/register").send({
      fullName: "ניסיון פריצה",
      email: "hacker@example.com",
      phone: "0501111111",
      password: "Hacker123",
      role: "ADMIN",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("CUSTOMER");
  });

  it("מחזירה 409 כשהאימייל כבר רשום", async () => {
    await createUser(Role.CUSTOMER, { email: "taken@example.com" });
    const res = await api().post("/api/auth/register").send({
      fullName: "כפולה",
      email: "taken@example.com",
      phone: "0501111111",
      password: "Taken1234",
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("מחזירה 400 עם פירוט שדות כשהנתונים לא תקינים", async () => {
    const res = await api().post("/api/auth/register").send({
      fullName: "א",
      email: "not-an-email",
      phone: "123",
      password: "short",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["fullName", "email", "phone", "password"]));
  });

  it("מחזירה 400 על JSON שבור", async () => {
    const res = await api()
      .post("/api/auth/register")
      .set("Content-Type", "application/json")
      .send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
});

describe("POST /api/auth/login", () => {
  it("התחברות תקינה מחזירה Token ופרטי משתמשת בלי סיסמה", async () => {
    const user = await createUser(Role.ADMIN, { email: "admin@test.local" });
    const res = await api().post("/api/auth/login").send({ email: "ADMIN@test.local", password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ id: user.id, role: "ADMIN" });
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("סיסמה שגויה מחזירה 401", async () => {
    await createUser(Role.CUSTOMER, { email: "noa@test.local" });
    const res = await api().post("/api/auth/login").send({ email: "noa@test.local", password: "Wrong1234" });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("אימייל או סיסמה שגויים");
  });

  it("אימייל לא קיים מחזיר 401 עם אותה הודעה", async () => {
    const res = await api().post("/api/auth/login").send({ email: "nobody@test.local", password: "Wrong1234" });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("אימייל או סיסמה שגויים");
  });

  it("שדות חסרים מחזירים 400", async () => {
    const res = await api().post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("ללא Token מחזיר 401", async () => {
    const res = await api().get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("Token לא תקין מחזיר 401", async () => {
    const res = await api().get("/api/auth/me").set("Authorization", "Bearer not.a.real.token");
    expect(res.status).toBe(401);
  });

  it("פורמט כותרת שגוי מחזיר 401", async () => {
    const user = await createUser(Role.CUSTOMER);
    const res = await api().get("/api/auth/me").set("Authorization", `Token ${tokenFor(user)}`);
    expect(res.status).toBe(401);
  });

  it("Token שפג תוקפו מחזיר 401", async () => {
    const user = await createUser(Role.CUSTOMER);
    const res = await api().get("/api/auth/me").set("Authorization", `Bearer ${expiredTokenFor(user)}`);
    expect(res.status).toBe(401);
  });

  it("Token חתום במפתח אחר מחזיר 401", async () => {
    const user = await createUser(Role.ADMIN);
    const forged = jwt.sign({ sub: String(user.id), role: "ADMIN" }, "some-other-secret-that-is-long-enough-123");
    const res = await api().get("/api/auth/me").set("Authorization", `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it("Token של משתמשת שנמחקה מחזיר 401", async () => {
    const user = await createUser(Role.CUSTOMER);
    const token = tokenFor(user);
    await prisma.user.delete({ where: { id: user.id } });
    const res = await api().get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("Token תקין מחזיר את פרטי המשתמשת", async () => {
    const user = await createUser(Role.CUSTOMER, { fullName: "נועה כהן" });
    const res = await api().get("/api/auth/me").set("Authorization", `Bearer ${tokenFor(user)}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: user.id, fullName: "נועה כהן", role: "CUSTOMER" });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("Token שהתקבל מ-login עובד ב-me", async () => {
    await createUser(Role.CUSTOMER, { email: "flow@test.local" });
    const login = await api().post("/api/auth/login").send({ email: "flow@test.local", password: PASSWORD });
    const res = await api().get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("flow@test.local");
  });
});
