import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, optionalAuthenticate, requireRole } from "../../middleware/auth";
import * as controller from "./contact.controller";

export const contactRouter = Router();

contactRouter.post("/", optionalAuthenticate, controller.create);
contactRouter.get("/", authenticate, requireRole(Role.ADMIN), controller.list);
contactRouter.patch("/:id", authenticate, requireRole(Role.ADMIN), controller.update);
