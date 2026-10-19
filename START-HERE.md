# 🌸 START HERE — איך מעלים את השרת של Laklapa לאינטרנט

המדריך הזה מיועד למי שמעולם לא העלתה שרת לאינטרנט. עברי על השלבים לפי הסדר.

**מה נעשה, בגדול:**
1. נעלה את הקבצים ל־**GitHub**, שהוא מקום אחסון לקוד.
2. נפתח מסד נתונים חינמי ב־**Neon**.
3. נפעיל את השרת ב־**Render**, שמושך את הקוד מ־GitHub ומריץ אותו.
4. נבדוק שהכל עובד דרך **Swagger**.

> ⚠️ **הערה חשובה על המסכים:** אני לא יכול לראות את האתרים של GitHub, Neon ו־Render כפי שהם נראים היום. שמות הכפתורים במדריך נכונים למיטב ידיעתי, אבל לפעמים האתרים משנים עיצוב. אם כפתור נקרא קצת אחרת, חפשי משהו דומה במשמעות.

> 💡 **חשוב לדעת על המסלולים החינמיים:** לכל מסלול חינמי יש מגבלות. ב־Render השרת **"נרדם" אחרי 15 דקות בלי שימוש**, והפנייה הראשונה אחרי זה יכולה לקחת עד דקה. זה תקין לגמרי לפרויקט גמר. כדאי לפתוח את האתר כמה דקות לפני הצגה.

---

## חלק א — GitHub

### 1. פתיחת חשבון
1. היכנסי ל־https://github.com
2. לחצי **Sign up**.
3. הכניסי אימייל, סיסמה ושם משתמש, ואשרי את האימייל שתקבלי.

### 2. יצירת Repository (מאגר לקוד)
1. אחרי ההתחברות, לחצי על **+** בפינה העליונה, ואז על **New repository**.
2. **Repository name:** `laklapa-backend`
3. בחרי **Private** (רק את רואה את הקוד) או **Public**. שתי האפשרויות עובדות עם Render.
4. **אל תסמני** "Add a README file", כי יש לנו כבר README.
5. לחצי **Create repository**.

### 3. חילוץ קובץ ה־ZIP
- **Windows:** לחיצה ימנית על הקובץ, ואז **Extract All** / **חלץ הכל**.
- **Mac:** לחיצה כפולה על הקובץ.

תיווצר תיקייה בשם `laklapa-backend`. בתוכה תמצאי את `src`, `prisma`, `package.json` ועוד.

> **Mac:** קבצים ששמם מתחיל בנקודה (`.gitignore`, `.env.example`, `.node-version`) מוסתרים כברירת מחדל. ב־Finder לחצי **Cmd + Shift + .** (נקודה) כדי להציג אותם. חשוב להעלות גם אותם.

### 4. העלאת הקבצים דרך הדפדפן
1. בדף ה־Repository החדש, לחצי על הקישור **uploading an existing file**. אפשר גם: **Add file**, ואז **Upload files**.
2. פתחי את התיקייה `laklapa-backend` במחשב.
3. **סמני את כל מה שבתוכה** (Ctrl+A ב־Windows, או Cmd+A ב־Mac), כלומר את התיקיות והקבצים עצמם ולא את התיקייה החיצונית, וגררי אל חלון הדפדפן.
4. חכי שכל הקבצים יסיימו לעלות.
5. למטה, בשדה ההודעה, כתבי למשל: `Initial upload`.
6. לחצי **Commit changes**.

### 5. בדיקה שהקבצים ב־GitHub
בדף הראשי של ה־Repository צריכים להופיע **ישירות** (לא בתוך תיקייה נוספת):

`src` · `prisma` · `tests` · `docs` · `scripts` · `package.json` · `tsconfig.json` · `render.yaml` · `README.md` · `.gitignore`

היכנסי גם ל־`prisma`, ואז ל־`migrations`, ובדקי שקיימת תיקייה שמתחילה ב־`20261019`.

> ❌ **אם הכל נמצא בתוך תיקייה `laklapa-backend`:** העלית את התיקייה החיצונית. מחקי את ה־Repository (**Settings**, ואז למטה **Delete this repository**) ונסי שוב, הפעם עם גרירת **התוכן** של התיקייה.

---

## חלק ב — מסד נתונים (Neon PostgreSQL)

ל־Render יש גם PostgreSQL חינמי, אבל **הוא נמחק אחרי 30 יום**. לכן נשתמש ב־**Neon**, שגם לו יש מסלול חינמי (עם מגבלות נפח ושימוש שמספיקות לפרויקט גמר).

### 1. פתיחת חשבון
1. היכנסי ל־https://neon.com
2. לחצי **Sign up**. הכי פשוט להתחבר עם חשבון ה־GitHub שפתחת.

### 2. יצירת Database
1. ייפתח מסך ליצירת Project. אם לא, לחצי **New Project**.
2. **Project name:** `laklapa`
3. **Region:** בחרי אזור באירופה, למשל **AWS Europe Central 1 (Frankfurt)**. כדאי שיהיה באותו אזור כמו Render.
4. את שאר ההגדרות השאירי כברירת מחדל, ולחצי **Create project**.

### 3. קבלת Connection String
1. בדף ה־Project לחצי **Connect**.
2. **חשוב:** כבי את האפשרות **Connection pooling** (Pooled connection). אנחנו צריכות את החיבור **הישיר**, כלומר כתובת **בלי** המילה `-pooler`.
3. העתיקי את הכתובת. היא נראית בערך כך:
   ```
   postgresql://neondb_owner:xxxxxxxx@ep-xxxx-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

### 4. שמירה בטוחה
- הכתובת כוללת **סיסמה**. אל תכתבי אותה ב־GitHub, בקוד או בצ'אט.
- שמרי אותה זמנית בפתק במחשב. בשלב הבא נדביק אותה ב־Render.

### 5. חיבור השרת למסד
החיבור נעשה דרך משתנה הסביבה `DATABASE_URL` ב־Render (בחלק הבא). את הטבלאות לא צריך ליצור ידנית: השרת יוצר אותן אוטומטית בהפעלה הראשונה, באמצעות Prisma Migrations.

---

## חלק ג — Render

### 1. פתיחת חשבון
1. היכנסי ל־https://render.com
2. לחצי **Get Started** / **Sign up**, ובחרי **GitHub**. כך החשבונות מתחברים מיד.

### 2. חיבור GitHub
אם Render יבקש הרשאה ל־GitHub, אשרי. אפשר לבחור **Only select repositories** ולסמן את `laklapa-backend`.

### 3–6. יצירת השרת

יש שתי דרכים. **אפשרות א' מהירה יותר**, כי היא משתמשת בקובץ `render.yaml` שכבר הכנתי.

#### אפשרות א' — Blueprint (מומלץ)
1. ב־Dashboard לחצי **New +**, ואז **Blueprint**.
2. בחרי את ה־Repository `laklapa-backend` ולחצי **Connect**.
3. Render יקרא את `render.yaml` ויציג שירות בשם `laklapa-api`.
4. הוא יבקש למלא כמה ערכים:

| משתנה | מה לכתוב |
|---|---|
| `DATABASE_URL` | הכתובת מ־Neon |
| `SEED_ADMIN_EMAIL` | האימייל שלך, לחשבון המעצבת הראשונה |
| `SEED_ADMIN_PASSWORD` | סיסמה חזקה שתבחרי, לפחות 8 תווים, עם אות באנגלית וספרה |
| `SEED_ADMIN_NAME` | שם המעצבת (לא חובה) |

5. לחצי **Apply** / **Deploy Blueprint**.

`JWT_SECRET` נוצר אוטומטית כמפתח אקראי ואין צורך לגעת בו.

#### אפשרות ב' — Web Service ידני
1. **New +**, ואז **Web Service**.
2. בחרי את ה־Repository `laklapa-backend`.
3. מלאי:

| שדה | ערך |
|---|---|
| **Name** | `laklapa-api` |
| **Region** | `Frankfurt (EU Central)` |
| **Branch** | `main` |
| **Runtime / Language** | `Node` |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Instance Type** | **Free** |

4. ב־**Environment Variables** הוסיפי (**Add Environment Variable**):

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `DATABASE_URL` | הכתובת מ־Neon |
| `JWT_SECRET` | מחרוזת אקראית של לפחות 32 תווים. יש ליד השדה כפתור **Generate** |
| `JWT_EXPIRES_IN` | `1d` |
| `CORS_ORIGINS` | `*` (אחרי שהאתר שלך יעלה, אפשר לשים את הכתובת שלו) |
| `SEED_ADMIN_EMAIL` | האימייל שלך |
| `SEED_ADMIN_PASSWORD` | סיסמה חזקה שתבחרי |

5. תחת **Advanced**, בשדה **Health Check Path**, כתבי `/api/health`.
6. לחצי **Create Web Service** / **Deploy Web Service**.

### 7. Prisma Migrations
אין צורך לעשות כלום. פקודת ההפעלה `npm run start:prod` מבצעת בכל הפעלה:
1. `prisma migrate deploy`: יוצרת או מעדכנת את הטבלאות.
2. Seed בטוח לפרודקשן: יוצר את המעצבת הראשונה מ־`SEED_ADMIN_EMAIL` ו־`SEED_ADMIN_PASSWORD` (רק אם היא עוד לא קיימת), ומוסיף קטגוריות ומוצרים לדוגמה אם הקטלוג ריק.
3. הפעלת השרת.

**בפרודקשן לא נוצרים חשבונות הדגמה עם סיסמאות ידועות.**

### 8. Deploy
אחרי היצירה, Render מתחיל לבנות. אפשר לעקוב בלשונית **Logs**. בסיום תופיע שורה כמו:
```
✅ Laklapa API פועל על פורט 10000
```
והסטטוס יהפוך ל־**Live** (ירוק). הבנייה הראשונה לוקחת כמה דקות.

כל העלאה חדשה של קבצים ל־GitHub תפעיל Deploy אוטומטי.

### 9. בדיקה שהשרת פעיל
למעלה בדף השירות מופיעה הכתובת שלו, למשל:
```
https://laklapa-api.onrender.com
```
(הכתובת שלך עשויה להיות קצת שונה.) זו הכתובת שתשתמשי בה ב־React.

---

## חלק ד — בדיקה שהכל עובד

החליפי את `https://laklapa-api.onrender.com` בכתובת שלך.

1. **Health:** פתחי `https://laklapa-api.onrender.com/api/health`. צריך להופיע:
   ```json
   { "status": "ok", "database": "connected", "timestamp": "..." }
   ```
2. **Swagger:** פתחי `https://laklapa-api.onrender.com/api-docs`
3. **התחברות מתוך Swagger:** פתחי את **POST /api/auth/login**, לחצי **Try it out**, ובתיבה כתבי:
   ```json
   { "email": "האימייל-שהגדרת", "password": "הסיסמה-שהגדרת" }
   ```
   ולחצי **Execute**.
4. **קבלת JWT:** בתשובה (Response body) העתיקי את הערך של `token`, בלי המירכאות.
5. **Authorize:** למעלה לחצי על הכפתור **Authorize** 🔓, הדביקי את ה־Token בשדה **Value**, ולחצי **Authorize** ואז **Close**.
6. **קריאה מוגנת:** פתחי **GET /api/auth/me**, ואז **Try it out** ו־**Execute**. צריך לחזור `200` עם הפרטים שלך ו־`"role": "ADMIN"`.
7. **הוספת רשומה:** פתחי **POST /api/categories**, ואז **Try it out**, כתבי `{ "name": "קטגוריית בדיקה" }` ולחצי **Execute**. צריך לחזור `201`.
8. **שליפה ממסד הנתונים:** פתחי **GET /api/categories** ולחצי **Execute**. הקטגוריה החדשה מופיעה ברשימה, והיא נשמרה ב־Neon.

**בדיקת הרשאות:**
- לחצי **Authorize** ואז **Logout**, ונסי שוב את **GET /api/auth/me**. אמור לחזור **401**.
- הירשמי כלקוחה (**POST /api/auth/register**), עשי Authorize עם ה־Token החדש, ונסי **POST /api/categories**. אמור לחזור **403**.

אפשר לראות את הנתונים גם ב־Neon: בתפריט של ה־Project, תחת **Tables**.

---

## חלק ה — פתרון תקלות

| תקלה | מה רואים | פתרון |
|---|---|---|
| **Build Failed** | הבנייה נכשלת ב־Logs | בדקי שה־Build Command הוא בדיוק `npm install --include=dev && npm run build`, ושהקבצים בשורש ה־Repository (חלק א, שלב 5). קראי את השורות האדומות הראשונות ב־Logs. |
| **`DATABASE_URL` שגוי** | `DATABASE_URL חייב להתחיל ב-postgresql://` או `Can't reach database server` | העתיקי שוב מ־Neon, בלי רווחים ובלי מירכאות. ודאי שהכתובת מסתיימת ב־`?sslmode=require`. |
| **בעיית Prisma** | `P1001`, `P1000` או `prepared statement` | `P1001`: אין חיבור, בדקי את הכתובת. `P1000`: סיסמה שגויה. `prepared statement`: השתמשת בכתובת עם `-pooler`, אז החליפי לכתובת הישירה. |
| **`JWT_SECRET` חסר** | `JWT_SECRET חסר` או `לפחות 32 תווים` | הוסיפי ב־**Environment** את `JWT_SECRET` עם מחרוזת אקראית ארוכה (כפתור **Generate**), ושמרי. |
| **שגיאת CORS** | בדפדפן: `blocked by CORS policy` | ב־Render, ב־`CORS_ORIGINS`, שימי `*` או את כתובת אתר ה־React בדיוק (למשל `http://localhost:5173`), בלי `/` בסוף. אפשר כמה כתובות עם פסיק. |
| **401** | `יש להתחבר` או `Token אינו תקין` | לא נשלח Token, הוא שגוי, או שפג תוקפו (אחרי יום). התחברי מחדש. ודאי שהכותרת היא `Authorization: Bearer <token>`. אם `JWT_SECRET` שונה, כל ה־Tokens הישנים מפסיקים לעבוד. |
| **403** | `אין לך הרשאה` | הפעולה לא מותרת לתפקיד שלך. למשל, לקוחה מנסה לנהל מוצרים, או מעצבת מנסה להזמין. זה מכוון. |
| **Swagger לא נפתח** | דף ריק או 404 | ודאי שהכתובת מסתיימת ב־`/api-docs`. אם השרת "ישן", חכי דקה ורענני. |
| **השרת לא עולה** | הסטטוס לא הופך ל־Live | פתחי **Logs**. בדרך כלל יש שם הודעה בעברית שמסבירה איזה משתנה חסר. אחרי תיקון לחצי **Manual Deploy** ואז **Deploy latest commit**. |
| **הפנייה הראשונה איטית** | לוקח עד דקה | זה תקין במסלול החינמי, כי השרת נרדם אחרי 15 דקות בלי שימוש. |
| **אין מעצבת / לא מצליחה להתחבר** | `אימייל או סיסמה שגויים` | בדקי ב־Logs שמופיע `חשבון מעצבת קיים / נוצר`. אם לא, הגדירי `SEED_ADMIN_EMAIL` ו־`SEED_ADMIN_PASSWORD` ועשי Deploy מחדש. |

---

## אם Render לא זמין במסלול חינמי

המסלולים החינמיים משתנים מדי פעם. אם Render ידרוש תשלום:
- השרת לא תלוי ב־Render. הוא שרת Node.js רגיל שאפשר להריץ בכל שירות שתומך ב־Node.js, עם אותן הגדרות:
  - Build: `npm install --include=dev && npm run build`
  - Start: `npm run start:prod`
  - משתני סביבה: כמו בטבלה של אפשרות ב'.
- חלופות שבדרך כלל מציעות מסלול חינמי או ניסיון: **Koyeb**, **Railway** ו־**Fly.io**. בדקי באתר שלהן את התנאים העדכניים לפני שאת נרשמת.
- מסד הנתונים ב־Neon נשאר אותו דבר.

---

## הרצה במחשב (לא חובה)

אם תרצי להריץ את השרת במחשב או להריץ את הבדיקות האוטומטיות, ההוראות נמצאות ב־`README.md`.
