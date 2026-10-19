/**
 * תיעוד OpenAPI 3 של Laklapa API.
 * מוצג ב-/api-docs (Swagger UI) וזמין כ-JSON ב-/api-docs.json.
 * העותק docs/openapi.json נוצר מהקובץ הזה בפקודה: npm run openapi
 */

type Json = Record<string, unknown>;

const ref = (name: string): Json => ({ $ref: `#/components/schemas/${name}` });

const jsonBody = (schema: Json, example?: unknown): Json => ({
  required: true,
  content: { "application/json": { schema, ...(example !== undefined ? { example } : {}) } },
});

const ok = (description: string, schema: Json, example?: unknown): Json => ({
  description,
  content: { "application/json": { schema, ...(example !== undefined ? { example } : {}) } },
});

const errorResponses = (...codes: Array<400 | 401 | 403 | 404 | 409>): Json => {
  const names: Record<number, string> = {
    400: "BadRequest",
    401: "Unauthorized",
    403: "Forbidden",
    404: "NotFound",
    409: "Conflict",
  };
  return Object.fromEntries(codes.map((code) => [String(code), { $ref: `#/components/responses/${names[code]}` }]));
};

const bearer = [{ bearerAuth: [] }];
const optionalBearer = [{}, { bearerAuth: [] }];

const idParam = (description: string): Json => ({
  name: "id",
  in: "path",
  required: true,
  description,
  schema: { type: "integer", minimum: 1 },
  example: 1,
});

const exampleUser = {
  id: 2,
  fullName: "נועה כהן",
  email: "noa@laklapa.test",
  phone: "0501234567",
  role: "CUSTOMER",
  createdAt: "2026-10-19T10:00:00.000Z",
};

const exampleProduct = {
  id: 1,
  name: "זר אביבי",
  description: "זר צבעוני של פרחי עונה, עטוף בנייר קראפט וסרט סאטן.",
  price: 180,
  imageUrl: "https://placehold.co/600x400?text=Laklapa",
  isActive: true,
  category: { id: 1, name: "זרים" },
  createdAt: "2026-10-19T10:00:00.000Z",
  updatedAt: "2026-10-19T10:00:00.000Z",
};

const exampleOrder = {
  id: 1,
  status: "RECEIVED",
  deliveryMethod: "DELIVERY",
  deliveryAddress: "רחוב הפרחים 12, תל אביב",
  recipientName: "שרה לוי",
  recipientPhone: "0527654321",
  requestedDate: "2026-10-25",
  greetingText: "מזל טוב!",
  totalAmount: 540,
  items: [
    {
      id: 1,
      product: { id: 1, name: "זר אביבי", imageUrl: "https://placehold.co/600x400?text=Laklapa" },
      quantity: 2,
      preferredColor: "PINK",
      notes: "בלי חבצלות",
      unitPrice: 180,
      lineTotal: 360,
    },
    {
      id: 2,
      product: { id: 3, name: "מארז שוקולד ופרחים", imageUrl: "https://placehold.co/600x400?text=Laklapa" },
      quantity: 1,
      preferredColor: "MIXED",
      notes: null,
      unitPrice: 180,
      lineTotal: 180,
    },
  ],
  createdAt: "2026-10-19T10:00:00.000Z",
  updatedAt: "2026-10-19T10:00:00.000Z",
};

const exampleOrderSummary = {
  id: 1,
  status: "RECEIVED",
  deliveryMethod: "DELIVERY",
  recipientName: "שרה לוי",
  requestedDate: "2026-10-25",
  totalAmount: 540,
  itemsCount: 2,
  createdAt: "2026-10-19T10:00:00.000Z",
};

const exampleMessage = {
  id: 1,
  userId: null,
  name: "רחל אברהם",
  email: "rachel@example.com",
  phone: "0541112233",
  subject: "שאלה על משלוחים",
  message: "האם יש משלוחים לירושלים?",
  isHandled: false,
  createdAt: "2026-10-19T10:00:00.000Z",
};

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Laklapa API",
    version: "1.0.0",
    description: [
      "שרת ה-API של Laklapa - אתר קטלוג והזמנות של מעצבת פרחים ומתנות.",
      "",
      "**איך מתחברים מתוך Swagger:**",
      "1. פתחי את `POST /api/auth/login`, לחצי **Try it out**, הכניסי אימייל וסיסמה ולחצי **Execute**.",
      "2. העתיקי את הערך של `token` מהתשובה (בלי מירכאות).",
      "3. לחצי על הכפתור **Authorize** למעלה, הדביקי את ה-Token ולחצי **Authorize**.",
      "4. מעכשיו כל הקריאות נשלחות עם `Authorization: Bearer <token>`.",
      "",
      "**שגיאות** מוחזרות תמיד בפורמט: `{ \"error\": { \"code\", \"message\", \"details\"? } }`.",
      "",
      "**תפקידים:** אורחת (ללא Token), לקוחה (CUSTOMER), מעצבת (ADMIN).",
    ].join("\n"),
  },
  servers: [{ url: "/", description: "השרת הנוכחי" }],
  tags: [
    { name: "System", description: "בדיקת תקינות" },
    { name: "Auth", description: "הרשמה והתחברות" },
    { name: "Categories", description: "קטגוריות מוצרים" },
    { name: "Products", description: "קטלוג המוצרים" },
    { name: "Orders", description: "הזמנות" },
    { name: "Users", description: "ניהול משתמשים (מעצבת)" },
    { name: "Contact", description: "הודעות יצירת קשר" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "הדביקי כאן את ה-Token שהתקבל מ-login או register (בלי המילה Bearer)",
      },
    },
    responses: {
      BadRequest: ok("נתונים לא תקינים", ref("Error"), {
        error: {
          code: "VALIDATION_ERROR",
          message: "הנתונים שנשלחו אינם תקינים",
          details: [{ field: "email", message: "כתובת אימייל לא תקינה" }],
        },
      }),
      Unauthorized: ok("לא מחוברת, או Token חסר / לא תקין / פג תוקף", ref("Error"), {
        error: { code: "UNAUTHORIZED", message: "יש להתחבר כדי לבצע פעולה זו" },
      }),
      Forbidden: ok("אין הרשאה לפעולה", ref("Error"), {
        error: { code: "FORBIDDEN", message: "אין לך הרשאה לבצע פעולה זו" },
      }),
      NotFound: ok("לא נמצא", ref("Error"), {
        error: { code: "NOT_FOUND", message: "הפריט המבוקש לא נמצא" },
      }),
      Conflict: ok("התנגשות עם המצב הקיים", ref("Error"), {
        error: { code: "CONFLICT", message: "כתובת האימייל כבר רשומה במערכת" },
      }),
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "הנתונים שנשלחו אינם תקינים" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: { field: { type: "string" }, message: { type: "string" } },
                },
              },
            },
          },
        },
      },
      Role: { type: "string", enum: ["CUSTOMER", "ADMIN"] },
      OrderStatus: {
        type: "string",
        enum: ["RECEIVED", "IN_PREPARATION", "SHIPPED", "DELIVERED", "CANCELLED"],
        description: "התקבלה / בהכנה / נשלחה או מוכנה לאיסוף / נמסרה / בוטלה",
      },
      DeliveryMethod: { type: "string", enum: ["DELIVERY", "PICKUP"], description: "משלוח / איסוף עצמי" },
      FlowerColor: {
        type: "string",
        enum: ["WHITE", "PINK", "RED", "YELLOW", "PURPLE", "MIXED"],
        description: "לבן / ורוד / אדום / צהוב / סגול / צבעוני",
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          fullName: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          role: ref("Role"),
          createdAt: { type: "string", format: "date-time" },
        },
        example: exampleUser,
      },
      UserListItem: {
        allOf: [ref("User"), { type: "object", properties: { ordersCount: { type: "integer" } } }],
      },
      UserDetails: {
        allOf: [
          ref("User"),
          {
            type: "object",
            properties: {
              ordersCount: { type: "integer" },
              orders: { type: "array", items: ref("OrderSummary") },
            },
          },
        ],
      },
      AuthResponse: {
        type: "object",
        properties: { token: { type: "string", description: "JWT Access Token" }, user: ref("User") },
      },
      RegisterInput: {
        type: "object",
        required: ["fullName", "email", "phone", "password"],
        properties: {
          fullName: { type: "string", minLength: 2, maxLength: 60 },
          email: { type: "string", format: "email" },
          phone: { type: "string", description: "טלפון ישראלי, 9-10 ספרות שמתחילות ב-0" },
          password: {
            type: "string",
            minLength: 8,
            maxLength: 72,
            description: "לפחות 8 תווים, לפחות אות אחת באנגלית וספרה אחת",
          },
        },
        example: { fullName: "דינה מזרחי", email: "dina@example.com", phone: "050-9876543", password: "Dina2026" },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: { email: { type: "string", format: "email" }, password: { type: "string" } },
        example: { email: "admin@laklapa.test", password: "Admin1234" },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
        example: { id: 1, name: "זרים", createdAt: "2026-10-19T10:00:00.000Z" },
      },
      CategoryInput: {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string", minLength: 2, maxLength: 40 } },
        example: { name: "עציצים" },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number", description: "מחיר בש\"ח" },
          imageUrl: { type: "string", format: "uri" },
          isActive: { type: "boolean", description: "false = מוסתר מהקטלוג" },
          category: {
            type: "object",
            properties: { id: { type: "integer" }, name: { type: "string" } },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        example: exampleProduct,
      },
      ProductInput: {
        type: "object",
        required: ["name", "description", "price", "imageUrl", "categoryId"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80 },
          description: { type: "string", minLength: 10, maxLength: 1000 },
          price: { type: "number", exclusiveMinimum: true, minimum: 0, description: "עד 2 ספרות אחרי הנקודה" },
          imageUrl: { type: "string", format: "uri" },
          categoryId: { type: "integer" },
          isActive: { type: "boolean", default: true },
        },
        example: {
          name: "זר ורדים לבנים",
          description: "עשרים ורדים לבנים עם ירק עונתי ועטיפה אלגנטית.",
          price: 220,
          imageUrl: "https://placehold.co/600x400?text=Roses",
          categoryId: 1,
          isActive: true,
        },
      },
      ProductUpdateInput: {
        type: "object",
        description: "שולחים רק את השדות שמשתנים (לפחות אחד)",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80 },
          description: { type: "string", minLength: 10, maxLength: 1000 },
          price: { type: "number" },
          imageUrl: { type: "string", format: "uri" },
          categoryId: { type: "integer" },
          isActive: { type: "boolean" },
        },
        example: { price: 199.9, isActive: false },
      },
      OrderItem: {
        type: "object",
        properties: {
          id: { type: "integer" },
          product: {
            type: "object",
            properties: { id: { type: "integer" }, name: { type: "string" }, imageUrl: { type: "string" } },
          },
          quantity: { type: "integer" },
          preferredColor: ref("FlowerColor"),
          notes: { type: "string", nullable: true },
          unitPrice: { type: "number", description: "המחיר ליחידה ברגע ההזמנה" },
          lineTotal: { type: "number" },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "integer", description: "גם מספר ההזמנה" },
          status: ref("OrderStatus"),
          deliveryMethod: ref("DeliveryMethod"),
          deliveryAddress: { type: "string", nullable: true },
          recipientName: { type: "string" },
          recipientPhone: { type: "string" },
          requestedDate: { type: "string", format: "date" },
          greetingText: { type: "string", nullable: true },
          totalAmount: { type: "number", description: "מחושב בשרת" },
          items: { type: "array", items: ref("OrderItem") },
          customer: {
            description: "מוחזר רק למעצבת",
            type: "object",
            properties: {
              id: { type: "integer" },
              fullName: { type: "string" },
              email: { type: "string" },
              phone: { type: "string" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        example: exampleOrder,
      },
      OrderSummary: {
        type: "object",
        properties: {
          id: { type: "integer" },
          status: ref("OrderStatus"),
          deliveryMethod: ref("DeliveryMethod"),
          recipientName: { type: "string" },
          requestedDate: { type: "string", format: "date" },
          totalAmount: { type: "number" },
          itemsCount: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
        example: exampleOrderSummary,
      },
      AdminOrderSummary: {
        allOf: [
          ref("OrderSummary"),
          {
            type: "object",
            properties: {
              customer: {
                type: "object",
                properties: { id: { type: "integer" }, fullName: { type: "string" } },
              },
            },
          },
        ],
      },
      CreateOrderInput: {
        type: "object",
        required: ["items", "deliveryMethod", "recipientName", "recipientPhone", "requestedDate"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            maxItems: 20,
            items: {
              type: "object",
              required: ["productId", "quantity", "preferredColor"],
              properties: {
                productId: { type: "integer" },
                quantity: { type: "integer", minimum: 1, maximum: 20 },
                preferredColor: ref("FlowerColor"),
                notes: { type: "string", maxLength: 300, nullable: true },
              },
            },
          },
          deliveryMethod: ref("DeliveryMethod"),
          deliveryAddress: { type: "string", maxLength: 200, nullable: true, description: "חובה במשלוח (DELIVERY)" },
          recipientName: { type: "string", minLength: 2, maxLength: 60 },
          recipientPhone: { type: "string" },
          requestedDate: { type: "string", format: "date", description: "YYYY-MM-DD, מחר או מאוחר יותר" },
          greetingText: { type: "string", maxLength: 300, nullable: true },
        },
        example: {
          items: [
            { productId: 1, quantity: 2, preferredColor: "PINK", notes: "בלי חבצלות" },
            { productId: 3, quantity: 1, preferredColor: "MIXED" },
          ],
          deliveryMethod: "DELIVERY",
          deliveryAddress: "רחוב הפרחים 12, תל אביב",
          recipientName: "שרה לוי",
          recipientPhone: "052-7654321",
          requestedDate: "2026-12-25",
          greetingText: "מזל טוב!",
        },
      },
      UpdateStatusInput: {
        type: "object",
        required: ["status"],
        properties: { status: ref("OrderStatus") },
        example: { status: "IN_PREPARATION" },
      },
      ContactMessage: {
        type: "object",
        properties: {
          id: { type: "integer" },
          userId: { type: "integer", nullable: true, description: "מזהה הלקוחה אם הייתה מחוברת" },
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string", nullable: true },
          subject: { type: "string" },
          message: { type: "string" },
          isHandled: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
        example: exampleMessage,
      },
      ContactInput: {
        type: "object",
        required: ["name", "email", "subject", "message"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 60 },
          email: { type: "string", format: "email" },
          phone: { type: "string", nullable: true },
          subject: { type: "string", minLength: 2, maxLength: 100 },
          message: { type: "string", minLength: 5, maxLength: 2000 },
        },
        example: {
          name: "רחל אברהם",
          email: "rachel@example.com",
          phone: "054-1112233",
          subject: "שאלה על משלוחים",
          message: "האם יש משלוחים לירושלים?",
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "בדיקת תקינות השרת והחיבור למסד הנתונים",
        security: [],
        responses: {
          "200": ok("השרת תקין", { type: "object" }, {
            status: "ok",
            database: "connected",
            timestamp: "2026-10-19T10:00:00.000Z",
          }),
          "503": ok("אין חיבור למסד הנתונים", { type: "object" }, {
            status: "error",
            database: "disconnected",
            timestamp: "2026-10-19T10:00:00.000Z",
          }),
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "הרשמת לקוחה חדשה",
        description: "יוצרת תמיד משתמשת מסוג CUSTOMER. מחזירה Token, כך שהלקוחה מחוברת מיד. 🔓 ציבורי",
        security: [],
        requestBody: jsonBody(ref("RegisterInput")),
        responses: {
          "201": ok("נרשמה בהצלחה", ref("AuthResponse"), { token: "eyJhbGciOi...", user: exampleUser }),
          ...errorResponses(400, 409),
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "התחברות",
        description: "מחזירה JWT. התוקף נקבע ב-JWT_EXPIRES_IN (ברירת מחדל: יום אחד). 🔓 ציבורי",
        security: [],
        requestBody: jsonBody(ref("LoginInput")),
        responses: {
          "200": ok("התחברות הצליחה", ref("AuthResponse"), { token: "eyJhbGciOi...", user: exampleUser }),
          ...errorResponses(400, 401),
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "פרטי המשתמשת המחוברת",
        description: "👤👑 כל משתמשת מחוברת",
        security: bearer,
        responses: {
          "200": ok("פרטי המשתמשת", { type: "object", properties: { user: ref("User") } }, { user: exampleUser }),
          ...errorResponses(401),
        },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "רשימת כל הקטגוריות (לפי שם)",
        description: "🔓 ציבורי",
        security: [],
        responses: {
          "200": ok("רשימת קטגוריות", {
            type: "object",
            properties: { categories: { type: "array", items: ref("Category") } },
          }),
        },
      },
      post: {
        tags: ["Categories"],
        summary: "הוספת קטגוריה",
        description: "👑 מעצבת בלבד",
        security: bearer,
        requestBody: jsonBody(ref("CategoryInput")),
        responses: {
          "201": ok("נוצרה", { type: "object", properties: { category: ref("Category") } }),
          ...errorResponses(400, 401, 403, 409),
        },
      },
    },
    "/api/categories/{id}": {
      put: {
        tags: ["Categories"],
        summary: "עריכת שם קטגוריה",
        description: "👑 מעצבת בלבד",
        security: bearer,
        parameters: [idParam("מזהה הקטגוריה")],
        requestBody: jsonBody(ref("CategoryInput")),
        responses: {
          "200": ok("עודכנה", { type: "object", properties: { category: ref("Category") } }),
          ...errorResponses(400, 401, 403, 404, 409),
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "מחיקת קטגוריה",
        description: "👑 מעצבת בלבד. קטגוריה שיש בה מוצרים לא נמחקת (409).",
        security: bearer,
        parameters: [idParam("מזהה הקטגוריה")],
        responses: {
          "204": { description: "נמחקה (ללא תוכן)" },
          ...errorResponses(400, 401, 403, 404, 409),
        },
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "רשימת מוצרים (מהחדש לישן)",
        description:
          "🔓 ציבורי. ברירת מחדל: רק מוצרים זמינים. מעצבת מחוברת יכולה להוסיף includeInactive=true כדי לראות גם מוסתרים.",
        security: optionalBearer,
        parameters: [
          {
            name: "categoryId",
            in: "query",
            required: false,
            description: "סינון לפי קטגוריה",
            schema: { type: "integer", minimum: 1 },
          },
          {
            name: "includeInactive",
            in: "query",
            required: false,
            description: "למעצבת בלבד: true כדי לכלול מוצרים מוסתרים",
            schema: { type: "string", enum: ["true", "false"] },
          },
        ],
        responses: {
          "200": ok(
            "רשימת מוצרים",
            { type: "object", properties: { products: { type: "array", items: ref("Product") } } },
            { products: [exampleProduct] },
          ),
          ...errorResponses(400, 401),
        },
      },
      post: {
        tags: ["Products"],
        summary: "הוספת מוצר",
        description: "👑 מעצבת בלבד",
        security: bearer,
        requestBody: jsonBody(ref("ProductInput")),
        responses: {
          "201": ok("נוצר", { type: "object", properties: { product: ref("Product") } }),
          ...errorResponses(400, 401, 403),
        },
      },
    },
    "/api/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "פרטי מוצר",
        description: "🔓 ציבורי. מוצר מוסתר מחזיר 404 למי שאינה מעצבת.",
        security: optionalBearer,
        parameters: [idParam("מזהה המוצר")],
        responses: {
          "200": ok("פרטי המוצר", { type: "object", properties: { product: ref("Product") } }, {
            product: exampleProduct,
          }),
          ...errorResponses(400, 401, 404),
        },
      },
      put: {
        tags: ["Products"],
        summary: "עריכת מוצר (כולל הסתרה / הצגה)",
        description: "👑 מעצבת בלבד. שולחים רק את השדות שמשתנים. להסתרה: { \"isActive\": false }",
        security: bearer,
        parameters: [idParam("מזהה המוצר")],
        requestBody: jsonBody(ref("ProductUpdateInput")),
        responses: {
          "200": ok("עודכן", { type: "object", properties: { product: ref("Product") } }),
          ...errorResponses(400, 401, 403, 404),
        },
      },
    },
    "/api/orders": {
      post: {
        tags: ["Orders"],
        summary: "יצירת הזמנה מהסל",
        description:
          "👤 לקוחה בלבד. המחיר והסכום הכולל מחושבים בשרת. מעצבת מקבלת 403. מוצר מוסתר או לא קיים מחזיר 400.",
        security: bearer,
        requestBody: jsonBody(ref("CreateOrderInput")),
        responses: {
          "201": ok("ההזמנה נוצרה", { type: "object", properties: { order: ref("Order") } }, { order: exampleOrder }),
          ...errorResponses(400, 401, 403),
        },
      },
      get: {
        tags: ["Orders"],
        summary: "כל ההזמנות עם סינון וחיפוש",
        description: "👑 מעצבת בלבד. מהחדשה לישנה. from/to מסננים לפי תאריך המסירה המבוקש.",
        security: bearer,
        parameters: [
          { name: "status", in: "query", required: false, schema: ref("OrderStatus") },
          {
            name: "from",
            in: "query",
            required: false,
            description: "תאריך מסירה מ- (YYYY-MM-DD)",
            schema: { type: "string", format: "date" },
          },
          {
            name: "to",
            in: "query",
            required: false,
            description: "תאריך מסירה עד (YYYY-MM-DD)",
            schema: { type: "string", format: "date" },
          },
          {
            name: "search",
            in: "query",
            required: false,
            description: "שם המקבל/ת או מספר הזמנה",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": ok("רשימת הזמנות", {
            type: "object",
            properties: { orders: { type: "array", items: ref("AdminOrderSummary") } },
          }),
          ...errorResponses(400, 401, 403),
        },
      },
    },
    "/api/orders/my": {
      get: {
        tags: ["Orders"],
        summary: "ההזמנות שלי",
        description: "👤 לקוחה בלבד. רק ההזמנות של הלקוחה המחוברת.",
        security: bearer,
        responses: {
          "200": ok(
            "רשימת ההזמנות שלי",
            { type: "object", properties: { orders: { type: "array", items: ref("OrderSummary") } } },
            { orders: [exampleOrderSummary] },
          ),
          ...errorResponses(401, 403),
        },
      },
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "פרטי הזמנה",
        description: "👤👑 לקוחה רואה רק הזמנה שלה (הזמנה של אחרת = 404). מעצבת רואה הכל, כולל פרטי הלקוחה.",
        security: bearer,
        parameters: [idParam("מספר ההזמנה")],
        responses: {
          "200": ok("פרטי ההזמנה", { type: "object", properties: { order: ref("Order") } }, { order: exampleOrder }),
          ...errorResponses(400, 401, 404),
        },
      },
    },
    "/api/orders/{id}/cancel": {
      patch: {
        tags: ["Orders"],
        summary: "ביטול הזמנה על ידי הלקוחה",
        description: "👤 לקוחה בלבד, רק הזמנה שלה ורק בסטטוס RECEIVED. אחרת 409.",
        security: bearer,
        parameters: [idParam("מספר ההזמנה")],
        responses: {
          "200": ok("ההזמנה בוטלה", { type: "object", properties: { order: ref("Order") } }),
          ...errorResponses(400, 401, 403, 404, 409),
        },
      },
    },
    "/api/orders/{id}/status": {
      patch: {
        tags: ["Orders"],
        summary: "שינוי סטטוס הזמנה",
        description: "👑 מעצבת בלבד. הזמנה שנמסרה או בוטלה לא ניתנת לשינוי (409).",
        security: bearer,
        parameters: [idParam("מספר ההזמנה")],
        requestBody: jsonBody(ref("UpdateStatusInput")),
        responses: {
          "200": ok("הסטטוס עודכן", { type: "object", properties: { order: ref("Order") } }),
          ...errorResponses(400, 401, 403, 404, 409),
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "רשימת משתמשות לפי תפקיד, עם חיפוש",
        description: "👑 מעצבת בלבד. ברירת מחדל: לקוחות. כולל מספר הזמנות לכל משתמשת.",
        security: bearer,
        parameters: [
          {
            name: "role",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["CUSTOMER", "ADMIN"], default: "CUSTOMER" },
          },
          {
            name: "search",
            in: "query",
            required: false,
            description: "חיפוש לפי שם, אימייל או טלפון",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": ok("רשימת משתמשות", {
            type: "object",
            properties: { users: { type: "array", items: ref("UserListItem") } },
          }),
          ...errorResponses(400, 401, 403),
        },
      },
    },
    "/api/users/admins": {
      post: {
        tags: ["Users"],
        summary: "יצירת מעצבת חדשה",
        description: "👑 מעצבת בלבד. זו הדרך היחידה ליצור חשבון מעצבת.",
        security: bearer,
        requestBody: jsonBody(ref("RegisterInput")),
        responses: {
          "201": ok("המעצבת נוצרה", { type: "object", properties: { user: ref("User") } }),
          ...errorResponses(400, 401, 403, 409),
        },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "פרטי משתמשת והזמנותיה",
        description: "👑 מעצבת בלבד",
        security: bearer,
        parameters: [idParam("מזהה המשתמשת")],
        responses: {
          "200": ok("פרטי המשתמשת", { type: "object", properties: { user: ref("UserDetails") } }),
          ...errorResponses(400, 401, 403, 404),
        },
      },
    },
    "/api/contact": {
      post: {
        tags: ["Contact"],
        summary: "שליחת הודעת יצירת קשר",
        description: "🔓👤 אורחת או לקוחה. מעצבת מחוברת מקבלת 403. אם לקוחה מחוברת - ההודעה משויכת אליה.",
        security: optionalBearer,
        requestBody: jsonBody(ref("ContactInput")),
        responses: {
          "201": ok("ההודעה נשלחה", { type: "object", properties: { message: ref("ContactMessage") } }),
          ...errorResponses(400, 401, 403),
        },
      },
      get: {
        tags: ["Contact"],
        summary: "רשימת הודעות",
        description: "👑 מעצבת בלבד. מהחדשה לישנה.",
        security: bearer,
        parameters: [
          {
            name: "isHandled",
            in: "query",
            required: false,
            description: "true = טופלו, false = לא טופלו",
            schema: { type: "string", enum: ["true", "false"] },
          },
        ],
        responses: {
          "200": ok("רשימת הודעות", {
            type: "object",
            properties: { messages: { type: "array", items: ref("ContactMessage") } },
          }),
          ...errorResponses(400, 401, 403),
        },
      },
    },
    "/api/contact/{id}": {
      patch: {
        tags: ["Contact"],
        summary: "סימון הודעה כטופלה / לא טופלה",
        description: "👑 מעצבת בלבד",
        security: bearer,
        parameters: [idParam("מזהה ההודעה")],
        requestBody: jsonBody(
          {
            type: "object",
            required: ["isHandled"],
            properties: { isHandled: { type: "boolean" } },
          },
          { isHandled: true },
        ),
        responses: {
          "200": ok("עודכן", { type: "object", properties: { message: ref("ContactMessage") } }),
          ...errorResponses(400, 401, 403, 404),
        },
      },
    },
  },
};
