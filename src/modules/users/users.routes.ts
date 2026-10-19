import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, requireRole } from "../../middleware/auth";
import * as controller from "./users.controller";

export const usersRouter = Router();

// ניהול משתמשים - למעצבות בלבד
usersRouter.use(authenticate, requireRole(Role.ADMIN));

usersRouter.get("/", controller.list);
usersRouter.post("/admins", controller.createAdmin);
usersRouter.get("/:id", controller.getById);
