import type { Request, Response } from "express";
import { idParamSchema } from "../../utils/validation";
import { categoryBodySchema } from "./categories.schemas";
import * as service from "./categories.service";

export async function list(_req: Request, res: Response): Promise<void> {
  res.json({ categories: await service.listCategories() });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = categoryBodySchema.parse(req.body);
  res.status(201).json({ category: await service.createCategory(input) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const input = categoryBodySchema.parse(req.body);
  res.json({ category: await service.updateCategory(id, input) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  await service.deleteCategory(id);
  res.status(204).send();
}
