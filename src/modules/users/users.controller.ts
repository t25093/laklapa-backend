import type { Request, Response } from "express";
import { idParamSchema } from "../../utils/validation";
import { createAdminSchema, listUsersQuerySchema } from "./users.schemas";
import * as service from "./users.service";

export async function list(req: Request, res: Response): Promise<void> {
  const query = listUsersQuerySchema.parse(req.query);
  res.json({ users: await service.listUsers(query) });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  res.json({ user: await service.getUser(id) });
}

export async function createAdmin(req: Request, res: Response): Promise<void> {
  const input = createAdminSchema.parse(req.body);
  res.status(201).json({ user: await service.createAdmin(input) });
}
