# Laklapa — Backend

שרת ה־API של **Laklapa**, אתר קטלוג והזמנות של מעצבת פרחים ומתנות.

- 📄 אפיון מלא: [`docs/SPEC-laklapa.md`](docs/SPEC-laklapa.md)
- 🚀 העלאה לאינטרנט, צעד אחר צעד: [`START-HERE.md`](START-HERE.md)
- ⚛️ מדריך חיבור לצד ה־React: [`FRONTEND-API-GUIDE.md`](FRONTEND-API-GUIDE.md)
- 📘 Swagger: `/api-docs` (וקובץ [`docs/openapi.json`](docs/openapi.json))

## טכנולוגיות

Node.js 22 · Express 5 · TypeScript (strict) · PostgreSQL · Prisma 6 · Zod · JWT · bcryptjs · Swagger UI (OpenAPI 3) · Vitest + Supertest

## מבנה התיקיות

```
laklapa-backend/
├── src/
│   ├── app.ts                 # הרכבת השרת: middleware, Swagger, נתבים
│   ├── server.ts              # הפעלת השרת
│   ├── config/env.ts          # קריאה ובדיקה של משתני סביבה
│   ├── db/prisma.ts           # חיבור למסד הנתונים
│   ├── docs/openapi.ts        # תיעוד Swagger / OpenAPI
│   ├── middleware/
│   │   ├── auth.ts            # Authentication (JWT) + Authorization (תפקידים)
│   │   └── errorHandler.ts    # טיפול אחיד בשגיאות
│   ├── modules/               # כל נושא בתיקייה משלו
│   │   ├── auth/              # *.routes.ts → *.controller.ts → *.service.ts + *.schemas.ts
│   │   ├── categories/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── users/
│   │   ├── contact/
│   │   └── health/
│   ├── types/express.d.ts     # הוספת req.user לטיפוסים של Express
│   └── utils/                 # שגיאות, JWT, סיסמאות, תאריכים, ולידציה, המרת תשובות
├── prisma/
│   ├── schema.prisma          # מבנה מסד הנתונים
│   ├── migrations/            # Migrations
│   └── seed.ts                # נתוני הדגמה
├── tests/                     # בדיקות אוטומטיות
├── scripts/export-openapi.ts  # יצירת docs/openapi.json
├── docs/                      # אפיון ו-openapi.json
├── render.yaml                # הגדרות פריסה ל-Render
└── .env.example               # דוגמה למשתני סביבה
```

**חלוקת האחריות בכל מודול:**
- `routes`: אילו כתובות קיימות ואילו הרשאות נדרשות.
- `controller`: קורא את הבקשה, מפעיל ולידציה ומחזיר תשובה.
- `service`: הלוגיקה העסקית והעבודה מול מסד הנתונים.
- `schemas`: כללי הוולידציה (Zod), עם הודעות שגיאה בעברית.

## הרצה מקומית במחשב

**דרישות:** Node.js 22 (או 20.19 ומעלה) ו־PostgreSQL. אם אין לך PostgreSQL במחשב, אפשר להשתמש במסד חינמי ב־Neon (ראי `START-HERE.md`).

```bash
npm install                 # התקנת תלויות (מריץ גם prisma generate)
cp .env.example .env        # ואז לערוך את .env: DATABASE_URL ו-JWT_SECRET
npx prisma migrate deploy   # יצירת הטבלאות
npm run db:seed             # נתוני הדגמה
npm run dev                 # הפעלה במצב פיתוח
```

לאחר ההפעלה:
- http://localhost:3000/api/health
- http://localhost:3000/api-docs

### חשבונות הדגמה (פיתוח בלבד)

| תפקיד | אימייל | סיסמה |
|---|---|---|
| מעצבת | admin@laklapa.test | Admin1234 |
| לקוחה | noa@laklapa.test | Customer1234 |
| לקוחה | tamar@laklapa.test | Customer1234 |

בפרודקשן (`NODE_ENV=production`) החשבונות האלה **לא נוצרים**. את המעצבת הראשונה יוצרים בעזרת `SEED_ADMIN_EMAIL` ו־`SEED_ADMIN_PASSWORD`.

## פקודות

| פקודה | מה היא עושה |
|---|---|
| `npm run dev` | הפעלה במצב פיתוח עם רענון אוטומטי |
| `npm run build` | `prisma generate` ובניית TypeScript לתיקייה `dist/` |
| `npm start` | הפעלת הגרסה הבנויה |
| `npm run start:prod` | Migrations, Seed ואז הפעלה (משמש את Render) |
| `npm run typecheck` | בדיקת טיפוסים של TypeScript |
| `npm test` | הרצת הבדיקות האוטומטיות |
| `npm run check` | בדיקת Prisma, טיפוסים, בנייה ובדיקות, הכל ביחד |
| `npm run db:seed` | הוספת נתוני הדגמה |
| `npm run db:reset` | ⚠️ מחיקת כל הנתונים ויצירה מחדש |
| `npm run openapi` | עדכון `docs/openapi.json` אחרי שינוי בתיעוד |

## בדיקות אוטומטיות

הבדיקות רצות מול **PostgreSQL אמיתי, במסד נפרד** ששמו חייב להכיל `test`, כי הן מוחקות את כל הנתונים במסד הזה.

```bash
# פעם אחת: ליצור מסד בדיקות (במחשב עם PostgreSQL)
createdb laklapa_test

# ברירת המחדל: postgresql://postgres:postgres@localhost:5432/laklapa_test
# אם הפרטים אצלך שונים:
#   TEST_DATABASE_URL=postgresql://USER:PASS@HOST:5432/laklapa_test npm test
npm test
```

אפשר גם לפתוח ב־Neon מסד נוסף בשם `laklapa_test` ולהריץ:
`TEST_DATABASE_URL="<connection string>" npm test`

**מה נבדק:** התחברות תקינה ושגויה, Token חסר, לא תקין, פג תוקף או חתום במפתח אחר, הרשאות מעצבת ולקוחה (401/403), CRUD של קטגוריות ומוצרים, ולידציה, יצירת הזמנה וחישוב מחיר בשרת, סינון וחיפוש, מניעת גישה להזמנות של אחרות, ביטול ושינוי סטטוס, ניהול משתמשים, יצירת קשר, Health, Swagger (כל ה־Endpoints מתועדים), התאמת `openapi.json` וקיום הטבלאות.

## אבטחה

- סיסמאות נשמרות כ־Hash באמצעות bcrypt, ולעולם לא מוחזרות ב־API.
- JWT (HS256) עם תוקף מוגבל (`JWT_EXPIRES_IN`), והמפתח נשמר במשתנה סביבה.
- המשתמשת המזוהה נקבעת רק לפי ה־Token. מזהים שנשלחים בגוף הבקשה לא נלקחים בחשבון.
- בכל בקשה בודקים שהמשתמשת עדיין קיימת, וטוענים את התפקיד העדכני שלה ממסד הנתונים.
- לקוחה לא יכולה לראות או לבטל הזמנה של לקוחה אחרת (מוחזר 404).
- מחירים וסכומים מחושבים בשרת בלבד.
- Helmet, הגבלת גודל בקשה ל־100KB ו־CORS שניתן להגדרה.
- אילוצי תקינות גם ברמת מסד הנתונים: מחיר חיובי, כמות 1 עד 20, וכתובת חובה במשלוח.

## פורמט שגיאות

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "הנתונים שנשלחו אינם תקינים",
    "details": [{ "field": "email", "message": "כתובת אימייל לא תקינה" }]
  }
}
```

קודים: `400` נתונים לא תקינים · `401` לא מחוברת · `403` אין הרשאה · `404` לא נמצא · `409` התנגשות · `500` שגיאת שרת.
