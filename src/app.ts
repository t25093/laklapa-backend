import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { corsOrigins } from "./config/env";
import { openApiDocument } from "./docs/openapi";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { categoriesRouter } from "./modules/categories/categories.routes";
import { contactRouter } from "./modules/contact/contact.routes";
import { healthRouter } from "./modules/health/health.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { productsRouter } from "./modules/products/products.routes";
import { usersRouter } from "./modules/users/users.routes";

export function createApp(): Express {
  const app = express();

  // Render ושירותי ענן אחרים עובדים מאחורי Proxy
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // כותרות אבטחה. CSP כבוי כדי ש-Swagger UI יעבוד בלי בעיות
  app.use(helmet({ contentSecurityPolicy: false }));

  app.use(
    cors({
      origin: corsOrigins.includes("*") ? true : corsOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(express.json({ limit: "100kb" }));

  // דף פתיחה קצר
  app.get("/", (_req, res) => {
    res.json({
      name: "Laklapa API",
      docs: "/api-docs",
      health: "/api/health",
    });
  });

  // Swagger
  app.get("/api-docs.json", (_req, res) => {
    res.json(openApiDocument);
  });
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "Laklapa API",
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  // API
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/contact", contactRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
