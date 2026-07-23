import { PrismaClient, UserRole } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();
const email = (process.env.ADMIN_EMAIL ?? "admin@savor.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
const salt = randomBytes(16).toString("hex");
const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;

await prisma.user.upsert({
  where: { email },
  update: {
    name: process.env.ADMIN_NAME ?? "Restaurant Admin",
    passwordHash,
    role: UserRole.ADMIN,
    isActive: true,
  },
  create: {
    name: process.env.ADMIN_NAME ?? "Restaurant Admin",
    email,
    passwordHash,
    role: UserRole.ADMIN,
  },
});

console.log(`Admin user ready: ${email}`);
await prisma.$disconnect();
