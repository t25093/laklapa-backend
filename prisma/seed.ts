/**
 * נתוני הדגמה ל-Laklapa (נתונים מומצאים בלבד).
 *
 * פיתוח / בדיקות (NODE_ENV שאינו production):
 *   יוצר מעצבת, שתי לקוחות, קטגוריות, מוצרים, הזמנות והודעות - עם סיסמאות ידועות לבדיקה.
 *
 * פרודקשן (NODE_ENV=production):
 *   לא נוצרים חשבונות עם סיסמאות קבועות.
 *   מעצבת ראשונה נוצרת רק אם הוגדרו SEED_ADMIN_EMAIL ו-SEED_ADMIN_PASSWORD (וגם SEED_ADMIN_NAME, SEED_ADMIN_PHONE לא חובה).
 *   קטגוריות ומוצרים לדוגמה נוצרים רק אם הקטלוג ריק.
 *
 * אפשר להריץ שוב ושוב - הסקריפט לא יוצר כפילויות.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { DeliveryMethod, FlowerColor, OrderStatus, Prisma, PrismaClient, Role, type Product } from "@prisma/client";

const prisma = new PrismaClient();
const isProduction = process.env.NODE_ENV === "production";
const rounds = Number(process.env.BCRYPT_ROUNDS || 10);

const DEMO_PASSWORDS = {
  admin: "Admin1234",
  customer: "Customer1234",
} as const;

const PLACEHOLDER = (text: string) => `https://placehold.co/600x400?text=${encodeURIComponent(text)}`;

const CATEGORIES = ["זרים", "מארזי מתנה", "עציצים", "אירועים"];

const PRODUCTS: Array<{ name: string; description: string; price: number; category: string; isActive?: boolean }> = [
  {
    name: "זר אביבי",
    description: "זר צבעוני של פרחי עונה, עטוף בנייר קראפט וסרט סאטן.",
    price: 180,
    category: "זרים",
  },
  {
    name: "זר ורדים קלאסי",
    description: "עשרים ורדים עם ירק עונתי ועטיפה אלגנטית. מתאים לכל אירוע.",
    price: 240,
    category: "זרים",
  },
  {
    name: "זר שדה קטן",
    description: "זר עדין של פרחי שדה, מושלם כמתנה קטנה ומשמחת.",
    price: 95,
    category: "זרים",
  },
  {
    name: "מארז שוקולד ופרחים",
    description: "קופסת עץ עם סידור פרחים קטן ומבחר שוקולדים משובחים.",
    price: 180,
    category: "מארזי מתנה",
  },
  {
    name: "מארז פינוק לשבת",
    description: "סלסלה עם פרחים, נרות, יין ענבים ומאפה מתוק.",
    price: 260,
    category: "מארזי מתנה",
  },
  {
    name: "עציץ סחלב לבן",
    description: "סחלב פלנופסיס בכלי קרמיקה לבן. פורח לאורך שבועות רבים.",
    price: 150,
    category: "עציצים",
  },
  {
    name: "סוקולנטים בכלי בטון",
    description: "שלישיית סוקולנטים בכלי בטון מעוצב. דורשים טיפול מינימלי.",
    price: 85,
    category: "עציצים",
  },
  {
    name: "סידור שולחן לאירוע",
    description: "סידור פרחים נמוך למרכז שולחן, מותאם לצבעי האירוע.",
    price: 320,
    category: "אירועים",
  },
  {
    name: "זר חורף (לא זמין)",
    description: "זר עונתי שמוצג רק בחורף. כרגע מוסתר מהקטלוג.",
    price: 200,
    category: "זרים",
    isActive: false,
  },
];

async function upsertUser(data: { fullName: string; email: string; phone: string; password: string; role: Role }) {
  const email = data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      fullName: data.fullName,
      email,
      phone: data.phone,
      role: data.role,
      passwordHash: await bcrypt.hash(data.password, rounds),
    },
  });
}

async function seedCatalog() {
  const categories = new Map<string, number>();
  for (const name of CATEGORIES) {
    const category = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    categories.set(name, category.id);
  }

  if ((await prisma.product.count()) > 0) {
    console.log("• קטלוג קיים - לא נוספו מוצרים");
    return;
  }

  for (const product of PRODUCTS) {
    await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: new Prisma.Decimal(product.price),
        imageUrl: PLACEHOLDER(product.name),
        categoryId: categories.get(product.category)!,
        isActive: product.isActive ?? true,
      },
    });
  }
  console.log(`• נוספו ${PRODUCTS.length} מוצרים ב-${CATEGORIES.length} קטגוריות`);
}

function futureDate(days: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

async function seedDemoOrders(customerIds: number[]) {
  if ((await prisma.order.count()) > 0) {
    console.log("• הזמנות קיימות - לא נוספו הזמנות");
    return;
  }

  const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { id: "asc" } });
  const [first, second, third, fourth] = products;
  if (!first || !second || !third || !fourth) return;

  const plans: Array<{
    userId: number;
    status: OrderStatus;
    deliveryMethod: DeliveryMethod;
    deliveryAddress: string | null;
    recipientName: string;
    recipientPhone: string;
    days: number;
    greetingText: string | null;
    items: Array<{ product: Product; quantity: number; color: FlowerColor; notes: string | null }>;
  }> = [
    {
      userId: customerIds[0]!,
      status: OrderStatus.RECEIVED,
      deliveryMethod: DeliveryMethod.DELIVERY,
      deliveryAddress: "רחוב הפרחים 12, תל אביב",
      recipientName: "שרה לוי",
      recipientPhone: "0527654321",
      days: 5,
      greetingText: "מזל טוב ליום ההולדת!",
      items: [
        { product: first, quantity: 2, color: FlowerColor.PINK, notes: "בלי חבצלות" },
        { product: fourth, quantity: 1, color: FlowerColor.MIXED, notes: null },
      ],
    },
    {
      userId: customerIds[0]!,
      status: OrderStatus.IN_PREPARATION,
      deliveryMethod: DeliveryMethod.PICKUP,
      deliveryAddress: null,
      recipientName: "נועה כהן",
      recipientPhone: "0501234567",
      days: 2,
      greetingText: null,
      items: [{ product: second, quantity: 1, color: FlowerColor.WHITE, notes: null }],
    },
    {
      userId: customerIds[1]!,
      status: OrderStatus.DELIVERED,
      deliveryMethod: DeliveryMethod.DELIVERY,
      deliveryAddress: "שדרות הרצל 5, רמת גן",
      recipientName: "מרים ישראלי",
      recipientPhone: "0548889999",
      days: 1,
      greetingText: "תודה רבה על הכל",
      items: [{ product: third, quantity: 3, color: FlowerColor.YELLOW, notes: "לעטוף כל זר בנפרד" }],
    },
  ];

  for (const plan of plans) {
    const total = plan.items.reduce(
      (sum, item) => sum.plus(item.product.price.times(item.quantity)),
      new Prisma.Decimal(0),
    );
    await prisma.order.create({
      data: {
        userId: plan.userId,
        status: plan.status,
        deliveryMethod: plan.deliveryMethod,
        deliveryAddress: plan.deliveryAddress,
        recipientName: plan.recipientName,
        recipientPhone: plan.recipientPhone,
        requestedDate: futureDate(plan.days),
        greetingText: plan.greetingText,
        totalAmount: total,
        items: {
          create: plan.items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            preferredColor: item.color,
            notes: item.notes,
            unitPrice: item.product.price,
          })),
        },
      },
    });
  }
  console.log(`• נוספו ${plans.length} הזמנות לדוגמה`);
}

async function seedDemoMessages(customerId: number) {
  if ((await prisma.contactMessage.count()) > 0) return;
  await prisma.contactMessage.createMany({
    data: [
      {
        name: "רחל אברהם",
        email: "rachel@example.com",
        phone: "0541112233",
        subject: "שאלה על משלוחים",
        message: "האם יש משלוחים לירושלים?",
      },
      {
        userId: customerId,
        name: "נועה כהן",
        email: "noa@laklapa.test",
        phone: "0501234567",
        subject: "הזמנה לאירוע גדול",
        message: "אשמח לקבל הצעה לסידורי שולחן לחתונה של 200 איש.",
        isHandled: true,
      },
    ],
  });
  console.log("• נוספו 2 הודעות יצירת קשר");
}

async function main() {
  console.log(`🌱 Seed (${isProduction ? "production" : "development"})`);

  if (isProduction) {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (email && password) {
      if (password.length < 8) {
        throw new Error("SEED_ADMIN_PASSWORD חייבת להכיל לפחות 8 תווים");
      }
      await upsertUser({
        fullName: process.env.SEED_ADMIN_NAME || "מעצבת ראשית",
        email,
        phone: process.env.SEED_ADMIN_PHONE || "0500000000",
        password,
        role: Role.ADMIN,
      });
      console.log(`• חשבון מעצבת קיים / נוצר: ${email.toLowerCase()}`);
    } else {
      console.log("• SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD לא הוגדרו - לא נוצרה מעצבת");
    }
    await seedCatalog();
    return;
  }

  await upsertUser({
    fullName: "מעצבת Laklapa",
    email: "admin@laklapa.test",
    phone: "0500000001",
    password: DEMO_PASSWORDS.admin,
    role: Role.ADMIN,
  });
  const noa = await upsertUser({
    fullName: "נועה כהן",
    email: "noa@laklapa.test",
    phone: "0501234567",
    password: DEMO_PASSWORDS.customer,
    role: Role.CUSTOMER,
  });
  const tamar = await upsertUser({
    fullName: "תמר לוי",
    email: "tamar@laklapa.test",
    phone: "0529876543",
    password: DEMO_PASSWORDS.customer,
    role: Role.CUSTOMER,
  });

  await seedCatalog();
  await seedDemoOrders([noa.id, tamar.id]);
  await seedDemoMessages(noa.id);

  console.log("\nחשבונות לבדיקה (פיתוח בלבד):");
  console.log(`  מעצבת: admin@laklapa.test / ${DEMO_PASSWORDS.admin}`);
  console.log(`  לקוחה: noa@laklapa.test / ${DEMO_PASSWORDS.customer}`);
  console.log(`  לקוחה: tamar@laklapa.test / ${DEMO_PASSWORDS.customer}`);
}

main()
  .catch((err) => {
    console.error("❌ Seed נכשל:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
