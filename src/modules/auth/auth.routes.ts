import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import * as controller from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", controller.register);
authRouter.post("/login", controller.login);
authRouter.get("/me", authenticate, controller.me);
