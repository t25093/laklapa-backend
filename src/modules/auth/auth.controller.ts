import type { Request, Response } from "express";
import { currentUser } from "../../middleware/auth";
import { loginSchema, registerSchema } from "./auth.schemas";
import * as authService from "./auth.service";

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(currentUser(req).id);
  res.json({ user });
}
