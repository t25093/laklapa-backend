# ⚛️ מדריך API לצד ה־React — Laklapa

המסמך מסביר איך צד ה־React מתקשר עם השרת: אילו כתובות קיימות, מה שולחים, מה מקבלים, ואילו כתובות כל מסך צריך.
**אין כאן קוד React.** את הקומפוננטות, הטפסים וניהול המצב את כותבת בעצמך.

> אפשר לנסות כל קריאה בעצמך ב־Swagger: `<BASE_URL>/api-docs`

---

## 1. כתובת השרת (Base URL)

| סביבה | Base URL |
|---|---|
| שרת מקומי | `http://localhost:3000` |
| אחרי העלאה ל־Render | `https://laklapa-api.onrender.com` (או הכתובת שקיבלת) |

כל הכתובות במסמך מתחילות ב־`/api`, ולכן כתובת מלאה נראית כך: `https://laklapa-api.onrender.com/api/products`.

**טיפ:** שמרי את ה־Base URL במשתנה סביבה של פרויקט ה־React (למשל בקובץ `.env` של Vite), כדי שיהיה קל להחליף בין מקומי לענן.

---

## 2. איך עובדת ההתחברות (Authentication)

1. הלקוחה נרשמת (`POST /api/auth/register`) או מתחברת (`POST /api/auth/login`).
2. השרת מחזיר `token` (JWT) ואובייקט `user`.
3. שומרים את ה־`token` בצד ה־React. איפה בדיוק לשמור, זו החלטה שלך.
4. **בכל בקשה למסך שדורש התחברות** שולחים כותרת (Header):
   ```
   Authorization: Bearer <token>
   ```
   חשוב: המילה `Bearer`, רווח אחד, ואז ה־Token.
5. התוקף של ה־Token הוא **יום אחד**. אחרי זה השרת מחזיר **401**, וצריך להתחבר מחדש.
6. לפי `user.role` יודעים מה להציג:
   - `"CUSTOMER"`: תפריט לקוחה (סל, ההזמנות שלי, צרי קשר).
   - `"ADMIN"`: תפריט מעצבת (ניהול מוצרים, קטגוריות, הזמנות, משתמשים, הודעות). **בלי** "צרי קשר" ו**בלי** "סל קניות".
7. **התנתקות:** פשוט מוחקים את ה־Token בצד ה־React. אין קריאה לשרת.
8. **רענון דף:** אם יש Token שמור, קוראים ל־`GET /api/auth/me` כדי לקבל שוב את פרטי המשתמשת. תשובת 401 אומרת שה־Token כבר לא תקף.

> 🔒 הסתרת כפתורים ב־React היא לנוחות בלבד. ההגנה האמיתית נמצאת בשרת: גם אם מישהו ישלח בקשה ישירות, השרת יחזיר 401 או 403.

**כותרות לכל בקשה עם גוף (POST / PUT / PATCH):**
```
Content-Type: application/json
```

---

## 3. מבני הנתונים

### User
```json
{
  "id": 2,
  "fullName": "נועה כהן",
  "email": "noa@laklapa.test",
  "phone": "0501234567",
  "role": "CUSTOMER",
  "createdAt": "2026-10-19T10:00:00.000Z"
}
```

### Category
```json
{ "id": 1, "name": "זרים", "createdAt": "2026-10-19T10:00:00.000Z" }
```

### Product
```json
{
  "id": 1,
  "name": "זר אביבי",
  "description": "זר צבעוני של פרחי עונה, עטוף בנייר קראפט וסרט סאטן.",
  "price": 180,
  "imageUrl": "https://placehold.co/600x400?text=Laklapa",
  "isActive": true,
  "category": { "id": 1, "name": "זרים" },
  "createdAt": "2026-10-19T10:00:00.000Z",
  "updatedAt": "2026-10-19T10:00:00.000Z"
}
```

### Order (פרטי הזמנה מלאים)
```json
{
  "id": 1,
  "status": "RECEIVED",
  "deliveryMethod": "DELIVERY",
  "deliveryAddress": "רחוב הפרחים 12, תל אביב",
  "recipientName": "שרה לוי",
  "recipientPhone": "0527654321",
  "requestedDate": "2026-10-25",
  "greetingText": "מזל טוב!",
  "totalAmount": 540,
  "items": [
    {
      "id": 1,
      "product": { "id": 1, "name": "זר אביבי", "imageUrl": "https://..." },
      "quantity": 2,
      "preferredColor": "PINK",
      "notes": "בלי חבצלות",
      "unitPrice": 180,
      "lineTotal": 360
    }
  ],
  "customer": { "id": 2, "fullName": "נועה כהן", "email": "noa@laklapa.test", "phone": "0501234567" },
  "createdAt": "2026-10-19T10:00:00.000Z",
  "updatedAt": "2026-10-19T10:00:00.000Z"
}
```
`customer` מוחזר **רק למעצבת**.

### OrderSummary (שורה ברשימת הזמנות)
```json
{
  "id": 1,
  "status": "RECEIVED",
  "deliveryMethod": "DELIVERY",
  "recipientName": "שרה לוי",
  "requestedDate": "2026-10-25",
  "totalAmount": 540,
  "itemsCount": 2,
  "createdAt": "2026-10-19T10:00:00.000Z"
}
```
ברשימה של המעצבת (`GET /api/orders`) יש גם `"customer": { "id", "fullName" }`.

### ContactMessage
```json
{
  "id": 1,
  "userId": null,
  "name": "רחל אברהם",
  "email": "rachel@example.com",
  "phone": "0541112233",
  "subject": "שאלה על משלוחים",
  "message": "האם יש משלוחים לירושלים?",
  "isHandled": false,
  "createdAt": "2026-10-19T10:00:00.000Z"
}
```

### ערכים קבועים (לתיבות בחירה)

| שדה | ערך שנשלח | להצגה |
|---|---|---|
| `status` | `RECEIVED` | התקבלה |
| | `IN_PREPARATION` | בהכנה |
| | `SHIPPED` | נשלחה / מוכנה לאיסוף |
| | `DELIVERED` | נמסרה |
| | `CANCELLED` | בוטלה |
| `deliveryMethod` | `DELIVERY` | משלוח |
| | `PICKUP` | איסוף עצמי |
| `preferredColor` | `WHITE` | לבן |
| | `PINK` | ורוד |
| | `RED` | אדום |
| | `YELLOW` | צהוב |
| | `PURPLE` | סגול |
| | `MIXED` | צבעוני |
| `role` | `CUSTOMER` | לקוחה |
| | `ADMIN` | מעצבת |

**תאריכים:** `requestedDate` נשלח ומתקבל בפורמט `YYYY-MM-DD`. שדות `createdAt` הם ISO מלא (תאריך ושעה ב־UTC).
**מחירים:** מספרים בש"ח, למשל `180` או `89.9`.

---

## 4. כל ה־Endpoints

🔓 ציבורי · 👤 לקוחה · 👑 מעצבת

### Auth
| Method | URL | הרשאה | Body | תשובה בהצלחה |
|---|---|---|---|---|
| POST | `/api/auth/register` | 🔓 | `fullName, email, phone, password` | **201** `{ token, user }` |
| POST | `/api/auth/login` | 🔓 | `email, password` | **200** `{ token, user }` |
| GET | `/api/auth/me` | 👤👑 | — | **200** `{ user }` |

### Categories
| Method | URL | הרשאה | Body | תשובה בהצלחה |
|---|---|---|---|---|
| GET | `/api/categories` | 🔓 | — | **200** `{ categories: Category[] }` (לפי שם) |
| POST | `/api/categories` | 👑 | `{ name }` | **201** `{ category }` |
| PUT | `/api/categories/:id` | 👑 | `{ name }` | **200** `{ category }` |
| DELETE | `/api/categories/:id` | 👑 | — | **204** (ללא תוכן) |

### Products
| Method | URL | הרשאה | Body / Query | תשובה בהצלחה |
|---|---|---|---|---|
| GET | `/api/products` | 🔓 | Query: `categoryId` (לא חובה), `includeInactive=true` (מעצבת) | **200** `{ products: Product[] }` (מהחדש לישן) |
| GET | `/api/products/:id` | 🔓 | — | **200** `{ product }` |
| POST | `/api/products` | 👑 | `name, description, price, imageUrl, categoryId, isActive` | **201** `{ product }` |
| PUT | `/api/products/:id` | 👑 | רק השדות שמשתנים | **200** `{ product }` |

### Orders
| Method | URL | הרשאה | Body / Query | תשובה בהצלחה |
|---|---|---|---|---|
| POST | `/api/orders` | 👤 | ראי סעיף 6 | **201** `{ order }` |
| GET | `/api/orders/my` | 👤 | — | **200** `{ orders: OrderSummary[] }` |
| GET | `/api/orders/:id` | 👤👑 | — | **200** `{ order }` |
| PATCH | `/api/orders/:id/cancel` | 👤 | — | **200** `{ order }` |
| GET | `/api/orders` | 👑 | Query: `status`, `from`, `to`, `search` | **200** `{ orders: [...] }` |
| PATCH | `/api/orders/:id/status` | 👑 | `{ status }` | **200** `{ order }` |

### Users
| Method | URL | הרשאה | Body / Query | תשובה בהצלחה |
|---|---|---|---|---|
| GET | `/api/users` | 👑 | Query: `role` (`CUSTOMER` ברירת מחדל / `ADMIN`), `search` | **200** `{ users: [User + ordersCount] }` |
| GET | `/api/users/:id` | 👑 | — | **200** `{ user: User + ordersCount + orders[] }` |
| POST | `/api/users/admins` | 👑 | `fullName, email, phone, password` | **201** `{ user }` |

### Contact
| Method | URL | הרשאה | Body / Query | תשובה בהצלחה |
|---|---|---|---|---|
| POST | `/api/contact` | 🔓👤 | `name, email, phone?, subject, message` | **201** `{ message }` |
| GET | `/api/contact` | 👑 | Query: `isHandled=true/false` (לא חובה) | **200** `{ messages: ContactMessage[] }` |
| PATCH | `/api/contact/:id` | 👑 | `{ isHandled }` | **200** `{ message }` |

### System
| Method | URL | הרשאה | תשובה |
|---|---|---|---|
| GET | `/api/health` | 🔓 | **200** `{ status: "ok", database: "connected" }` |

---

## 5. אילו Endpoints צריך כל מסך

| # | מסך | קריאות לשרת |
|---|---|---|
| 1 | **קטלוג (דף הבית)** | `GET /api/categories` לכפתורי הסינון. `GET /api/products` לכל המוצרים, או `GET /api/products?categoryId=3` לפי קטגוריה |
| 2 | **פרטי מוצר** | `GET /api/products/:id` |
| 3 | **סל קניות** | אין קריאה לשרת. הסל נשמר אצלך. הסכום שמוצג הוא הערכה, והסכום הסופי נקבע בשרת |
| 4 | **התחברות** | `POST /api/auth/login` |
| 5 | **הרשמה** | `POST /api/auth/register` |
| 6 | **צרי קשר** (אורחת / לקוחה) | `POST /api/contact`. ללקוחה מחוברת שולחים גם את ה־Token, ואפשר למלא מראש מ־`user` |
| 7 | **השלמת הזמנה** | `POST /api/orders` |
| 8 | **ההזמנות שלי** | `GET /api/orders/my` |
| 9 | **פרטי הזמנה** (לקוחה) | `GET /api/orders/:id`. לביטול: `PATCH /api/orders/:id/cancel` (להציג רק כש־`status === "RECEIVED"`) |
| 10 | **ניהול מוצרים** | `GET /api/products?includeInactive=true` |
| 11 | **טופס מוצר** | `GET /api/categories` לתיבת הבחירה. `POST /api/products` להוספה, `GET` ואז `PUT /api/products/:id` לעריכה |
| 12 | **ניהול קטגוריות** | `GET`, `POST`, `PUT` ו־`DELETE` של `/api/categories` |
| 13 | **ניהול הזמנות** | `GET /api/orders?status=...&from=...&to=...&search=...` |
| 14 | **פרטי הזמנה** (מעצבת) | `GET /api/orders/:id` ו־`PATCH /api/orders/:id/status` |
| 15 | **הודעות** | `GET /api/contact?isHandled=false` ו־`PATCH /api/contact/:id` |
| 16 | **ניהול משתמשים** | לשונית לקוחות: `GET /api/users?role=CUSTOMER&search=...`. לשונית מעצבות: `GET /api/users?role=ADMIN`, ולטופס מעצבת חדשה `POST /api/users/admins` |
| 17 | **פרטי לקוחה** | `GET /api/users/:id`. לחיצה על הזמנה פותחת את מסך 14 |
| — | **בכל טעינת אתר** | אם יש Token שמור: `GET /api/auth/me` |

---

## 6. טפסים: שדות חובה ודוגמאות

### הרשמה / יצירת מעצבת — `POST /api/auth/register` / `POST /api/users/admins`
| שדה | חובה | כללים |
|---|:-:|---|
| `fullName` | ✅ | 2 עד 60 תווים |
| `email` | ✅ | אימייל תקין, ייחודי |
| `phone` | ✅ | טלפון ישראלי, 9 עד 10 ספרות שמתחילות ב־0. מקפים ורווחים מותרים |
| `password` | ✅ | לפחות 8 תווים, לפחות אות אחת באנגלית וספרה אחת |

```json
{ "fullName": "דינה מזרחי", "email": "dina@example.com", "phone": "050-9876543", "password": "Dina2026" }
```

### התחברות — `POST /api/auth/login`
```json
{ "email": "noa@laklapa.test", "password": "Customer1234" }
```
תשובה:
```json
{ "token": "eyJhbGciOiJIUzI1NiIs...", "user": { "id": 2, "fullName": "נועה כהן", "role": "CUSTOMER", "...": "..." } }
```

### מוצר — `POST /api/products`
| שדה | חובה | כללים |
|---|:-:|---|
| `name` | ✅ | 2 עד 80 תווים |
| `description` | ✅ | 10 עד 1000 תווים |
| `price` | ✅ | **מספר** (לא מחרוזת) גדול מ־0, עד 2 ספרות אחרי הנקודה |
| `imageUrl` | ✅ | קישור שמתחיל ב־`https://` |
| `categoryId` | ✅ | **מספר**, מזהה של קטגוריה קיימת |
| `isActive` | ❌ | `true` / `false`, ברירת מחדל `true` |

```json
{
  "name": "זר ורדים לבנים",
  "description": "עשרים ורדים לבנים עם ירק עונתי ועטיפה אלגנטית.",
  "price": 220,
  "imageUrl": "https://placehold.co/600x400?text=Roses",
  "categoryId": 1,
  "isActive": true
}
```
**עריכה (`PUT`):** שולחים רק את מה שהשתנה. להסתרת מוצר: `{ "isActive": false }`.

> ⚠️ שדות מספר מטופס HTML מגיעים כמחרוזת (`"220"`). צריך להמיר אותם למספר לפני השליחה, אחרת תתקבל שגיאת 400.

### הזמנה — `POST /api/orders`
| שדה | חובה | כללים |
|---|:-:|---|
| `items` | ✅ | רשימה של 1 עד 20 פריטים |
| `items[].productId` | ✅ | מספר |
| `items[].quantity` | ✅ | 1 עד 20 |
| `items[].preferredColor` | ✅ | אחד מערכי הצבע בטבלה למעלה |
| `items[].notes` | ❌ | עד 300 תווים |
| `deliveryMethod` | ✅ | `DELIVERY` או `PICKUP` |
| `deliveryAddress` | רק ב־`DELIVERY` | 5 עד 200 תווים. באיסוף עצמי השרת מתעלם ממנה |
| `recipientName` | ✅ | 2 עד 60 תווים |
| `recipientPhone` | ✅ | טלפון ישראלי |
| `requestedDate` | ✅ | `YYYY-MM-DD`, **מחר או מאוחר יותר** |
| `greetingText` | ❌ | עד 300 תווים |

```json
{
  "items": [
    { "productId": 1, "quantity": 2, "preferredColor": "PINK", "notes": "בלי חבצלות" },
    { "productId": 3, "quantity": 1, "preferredColor": "MIXED" }
  ],
  "deliveryMethod": "DELIVERY",
  "deliveryAddress": "רחוב הפרחים 12, תל אביב",
  "recipientName": "שרה לוי",
  "recipientPhone": "052-7654321",
  "requestedDate": "2026-12-25",
  "greetingText": "מזל טוב!"
}
```
- **לא שולחים** מחיר, סכום או מזהה לקוחה. השרת מחשב אותם ומזהה את הלקוחה לפי ה־Token.
- אם מוצר הוסתר או נמחק בזמן שהיה בסל, יחזור 400 עם פירוט לכל פריט (`items.1.productId`).
- אותו מוצר יכול להופיע פעמיים בסל עם צבעים שונים.

### שינוי סטטוס — `PATCH /api/orders/:id/status`
```json
{ "status": "IN_PREPARATION" }
```
הזמנה בסטטוס `DELIVERED` או `CANCELLED` לא ניתנת לשינוי (409).

### צרי קשר — `POST /api/contact`
| שדה | חובה | כללים |
|---|:-:|---|
| `name` | ✅ | 2 עד 60 תווים |
| `email` | ✅ | אימייל תקין |
| `phone` | ❌ | טלפון ישראלי, או ריק |
| `subject` | ✅ | 2 עד 100 תווים |
| `message` | ✅ | 5 עד 2000 תווים |

### סימון הודעה — `PATCH /api/contact/:id`
```json
{ "isHandled": true }
```

### פרמטרי סינון (Query)
| מסך | דוגמה | הסבר |
|---|---|---|
| קטלוג | `/api/products?categoryId=2` | בלי `categoryId` מוחזרים כל המוצרים |
| ניהול הזמנות | `/api/orders?status=RECEIVED&from=2026-10-20&to=2026-10-31&search=שרה` | כל הפרמטרים לא חובה. `from`/`to` לפי **תאריך המסירה**. `search` לפי שם המקבל/ת או מספר הזמנה |
| לקוחות | `/api/users?role=CUSTOMER&search=0501234` | חיפוש לפי שם, אימייל או טלפון |
| הודעות | `/api/contact?isHandled=false` | בלי הפרמטר מוחזרות כל ההודעות |

ערכים עם עברית או רווחים ב־Query צריך לקודד ל־URL (URL encoding).

---

## 7. שגיאות

כל שגיאה מוחזרת באותו מבנה:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "הנתונים שנשלחו אינם תקינים",
    "details": [
      { "field": "email", "message": "כתובת אימייל לא תקינה" },
      { "field": "items.0.quantity", "message": "כמות מינימלית היא 1" }
    ]
  }
}
```
- `message`: הודעה בעברית שאפשר להציג למשתמשת.
- `details`: מופיע בשגיאות ולידציה. `field` הוא שם השדה בטופס, כך שאפשר להציג את השגיאה ליד השדה המתאים.

| קוד HTTP | `code` | מתי | מה כדאי לעשות ב־React |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` / `INVALID_JSON` | נתונים לא תקינים | להציג את `details` ליד השדות |
| 401 | `UNAUTHORIZED` | אין Token, הוא שגוי או פג תוקף | למחוק את ה־Token ולהעביר למסך התחברות |
| 403 | `FORBIDDEN` | אין הרשאה לפעולה | להציג "אין הרשאה" |
| 404 | `NOT_FOUND` | הפריט לא קיים, או לא שלך | להציג "לא נמצא" |
| 409 | `CONFLICT` | אימייל קיים, ביטול לא אפשרי, קטגוריה עם מוצרים | להציג את `message` |
| 500 | `INTERNAL_ERROR` | תקלה בשרת | להציג "נסי שוב מאוחר יותר" |

---

## 8. סיכום הרשאות

| פעולה | אורחת | לקוחה | מעצבת |
|---|:-:|:-:|:-:|
| צפייה בקטלוג ובקטגוריות | ✅ | ✅ | ✅ |
| צפייה במוצרים מוסתרים | ❌ | ❌ | ✅ |
| הרשמה | ✅ | – | – |
| שליחת הודעת יצירת קשר | ✅ | ✅ | ❌ |
| יצירת הזמנה | ❌ | ✅ | ❌ |
| צפייה בהזמנות | ❌ | רק שלה | כולן |
| ביטול הזמנה | ❌ | רק שלה, בסטטוס RECEIVED | דרך שינוי סטטוס |
| ניהול מוצרים, קטגוריות, הזמנות, משתמשים והודעות | ❌ | ❌ | ✅ |

---

## 9. CORS

אם אתר ה־React רץ בכתובת אחרת מהשרת (למשל `http://localhost:5173`), צריך שהכתובת תהיה מורשית ב־`CORS_ORIGINS` בשרת. כברירת מחדל מוגדר `*` (כל הכתובות). אם מופיעה שגיאת CORS בדפדפן, ראי את פרק פתרון התקלות ב־`START-HERE.md`.
