import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, requireRole } from "../../middleware/auth";
import * as controller from "./categories.controller";

export const categoriesRouter = Router();

categoriesRouter.get("/", controller.list);
categoriesRouter.post("/", authenticate, requireRole(Role.ADMIN), controller.create);
categoriesRouter.put("/:id", authenticate, requireRole(Role.ADMIN), controller.update);
categoriesRouter.delete("/:id", authenticate, requireRole(Role.ADMIN), controller.remove);
