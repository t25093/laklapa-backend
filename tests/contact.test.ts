import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { api, auth, createUser, prisma, resetDb } from "./helpers";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const message = {
  name: "רחל אברהם",
  email: "rachel@example.com",
  phone: "054-1112233",
  subject: "שאלה על משלוחים",
  message: "האם יש משלוחים לירושלים?",
};

describe("Contact", () => {
  it("אורחת שולחת הודעה בלי התחברות", async () => {
    const res = await api().post("/api/contact").send(message);
    expect(res.status).toBe(201);
    expect(res.body.message).toMatchObject({ userId: null, isHandled: false, phone: "0541112233" });
  });

  it("טלפון הוא לא חובה", async () => {
    const res = await api().post("/api/contact").send({ ...message, phone: "" });
    expect(res.status).toBe(201);
    expect(res.body.message.phone).toBeNull();
  });

  it("הודעה של לקוחה מחוברת משויכת אליה", async () => {
    const customer = await createUser(Role.CUSTOMER);
    const res = await api().post("/api/contact").set(...auth(customer)).send(message);
    expect(res.status).toBe(201);
    expect(res.body.message.userId).toBe(customer.id);
  });

  it("מעצבת מחוברת לא יכולה לשלוח הודעה (403)", async () => {
    const admin = await createUser(Role.ADMIN);
    const res = await api().post("/api/contact").set(...auth(admin)).send(message);
    expect(res.status).toBe(403);
    expect(await prisma.contactMessage.count()).toBe(0);
  });

  it("Token לא תקין בשליחת הודעה מחזיר 401", async () => {
    const res = await api().post("/api/contact").set("Authorization", "Bearer broken").send(message);
    expect(res.status).toBe(401);
  });

  it("ולידציה של שדות חובה", async () => {
    const res = await api().post("/api/contact").send({ name: "ר", email: "bad" });
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["name", "email", "subject", "message"]));
  });

  it("רק מעצבת רואה הודעות ומסמנת אותן כטופלו", async () => {
    const admin = await createUser(Role.ADMIN);
    const customer = await createUser(Role.CUSTOMER);
    const first = await api().post("/api/contact").send(message);
    await api().post("/api/contact").send({ ...message, subject: "נושא שני" });

    expect((await api().get("/api/contact")).status).toBe(401);
    expect((await api().get("/api/contact").set(...auth(customer))).status).toBe(403);

    const all = await api().get("/api/contact").set(...auth(admin));
    expect(all.status).toBe(200);
    expect(all.body.messages).toHaveLength(2);

    const id = first.body.message.id;
    expect((await api().patch(`/api/contact/${id}`).set(...auth(customer)).send({ isHandled: true })).status).toBe(403);
    const handled = await api().patch(`/api/contact/${id}`).set(...auth(admin)).send({ isHandled: true });
    expect(handled.status).toBe(200);
    expect(handled.body.message.isHandled).toBe(true);

    const open = await api().get("/api/contact?isHandled=false").set(...auth(admin));
    expect(open.body.messages.map((m: { subject: string }) => m.subject)).toEqual(["נושא שני"]);
    const done = await api().get("/api/contact?isHandled=true").set(...auth(admin));
    expect(done.body.messages.map((m: { id: number }) => m.id)).toEqual([id]);
  });

  it("סימון עם ערך לא בוליאני מחזיר 400, והודעה לא קיימת 404", async () => {
    const admin = await createUser(Role.ADMIN);
    expect((await api().patch("/api/contact/1").set(...auth(admin)).send({ isHandled: "yes" })).status).toBe(400);
    expect((await api().patch("/api/contact/999").set(...auth(admin)).send({ isHandled: true })).status).toBe(404);
    expect((await api().get("/api/contact?isHandled=maybe").set(...auth(admin))).status).toBe(400);
  });
});
