import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, requireRole } from "../../middleware/auth";
import * as controller from "./orders.controller";

export const ordersRouter = Router();

// כל פעולות ההזמנות דורשות התחברות
ordersRouter.use(authenticate);

ordersRouter.post("/", requireRole(Role.CUSTOMER), controller.create);
ordersRouter.get("/my", requireRole(Role.CUSTOMER), controller.listMine);
ordersRouter.get("/", requireRole(Role.ADMIN), controller.listAll);
ordersRouter.get("/:id", requireRole(Role.CUSTOMER, Role.ADMIN), controller.getById);
ordersRouter.patch("/:id/cancel", requireRole(Role.CUSTOMER), controller.cancel);
ordersRouter.patch("/:id/status", requireRole(Role.ADMIN), controller.updateStatus);
