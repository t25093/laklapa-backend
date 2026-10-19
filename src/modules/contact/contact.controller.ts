import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import { forbidden } from "../../utils/AppError";
import { idParamSchema } from "../../utils/validation";
import { createContactSchema, listContactQuerySchema, updateContactSchema } from "./contact.schemas";
import * as service from "./contact.service";

export async function create(req: Request, res: Response): Promise<void> {
  // יצירת קשר מיועדת לאורחות וללקוחות בלבד
  if (req.user?.role === Role.ADMIN) {
    throw forbidden("מעצבות אינן שולחות הודעות יצירת קשר");
  }
  const input = createContactSchema.parse(req.body);
  const message = await service.createMessage(input, req.user?.id ?? null);
  res.status(201).json({ message });
}

export async function list(req: Request, res: Response): Promise<void> {
  const { isHandled } = listContactQuerySchema.parse(req.query);
  res.json({ messages: await service.listMessages(isHandled) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const { isHandled } = updateContactSchema.parse(req.body);
  res.json({ message: await service.setHandled(id, isHandled) });
}
