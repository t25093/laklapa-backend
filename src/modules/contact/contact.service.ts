import { prisma } from "../../db/prisma";
import { notFound } from "../../utils/AppError";
import { serializeContactMessage } from "../../utils/serializers";
import type { CreateContactInput } from "./contact.schemas";

export async function createMessage(input: CreateContactInput, userId: number | null) {
  const message = await prisma.contactMessage.create({
    data: {
      userId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
    },
  });
  return serializeContactMessage(message);
}

export async function listMessages(isHandled?: boolean) {
  const messages = await prisma.contactMessage.findMany({
    where: isHandled === undefined ? {} : { isHandled },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return messages.map(serializeContactMessage);
}

export async function setHandled(id: number, isHandled: boolean) {
  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) throw notFound("ההודעה לא נמצאה");
  const message = await prisma.contactMessage.update({ where: { id }, data: { isHandled } });
  return serializeContactMessage(message);
}
