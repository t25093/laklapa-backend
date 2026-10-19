import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import { idParamSchema } from "../../utils/validation";
import { createProductSchema, listProductsQuerySchema, updateProductSchema } from "./products.schemas";
import * as service from "./products.service";

const isAdmin = (req: Request): boolean => req.user?.role === Role.ADMIN;

export async function list(req: Request, res: Response): Promise<void> {
  const query = listProductsQuerySchema.parse(req.query);
  res.json({ products: await service.listProducts(query, isAdmin(req)) });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  res.json({ product: await service.getProduct(id, isAdmin(req)) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createProductSchema.parse(req.body);
  res.status(201).json({ product: await service.createProduct(input) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const input = updateProductSchema.parse(req.body);
  res.json({ product: await service.updateProduct(id, input) });
}
