import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, optionalAuthenticate, requireRole } from "../../middleware/auth";
import * as controller from "./products.controller";

export const productsRouter = Router();

productsRouter.get("/", optionalAuthenticate, controller.list);
productsRouter.get("/:id", optionalAuthenticate, controller.getById);
productsRouter.post("/", authenticate, requireRole(Role.ADMIN), controller.create);
productsRouter.put("/:id", authenticate, requireRole(Role.ADMIN), controller.update);
