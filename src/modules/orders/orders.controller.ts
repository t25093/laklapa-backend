import type { Request, Response } from "express";
import { currentUser } from "../../middleware/auth";
import { idParamSchema } from "../../utils/validation";
import { adminListQuerySchema, createOrderSchema, updateStatusSchema } from "./orders.schemas";
import * as service from "./orders.service";

export async function create(req: Request, res: Response): Promise<void> {
  const input = createOrderSchema.parse(req.body);
  // מזהה הלקוחה נלקח מה-Token בלבד
  res.status(201).json({ order: await service.createOrder(currentUser(req).id, input) });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  res.json({ orders: await service.listMyOrders(currentUser(req).id) });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  res.json({ order: await service.getOrder(id, currentUser(req)) });
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  res.json({ order: await service.cancelMyOrder(id, currentUser(req).id) });
}

export async function listAll(req: Request, res: Response): Promise<void> {
  const query = adminListQuerySchema.parse(req.query);
  res.json({ orders: await service.listAllOrders(query) });
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const { status } = updateStatusSchema.parse(req.body);
  res.json({ order: await service.updateOrderStatus(id, status) });
}
