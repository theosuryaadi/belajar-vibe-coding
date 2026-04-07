import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "../db/schema";

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  // Cek apakah email sudah terdaftar
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existing.length > 0) {
    throw new Error("User already exists");
  }

  // Hash password dengan bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user baru
  const result = await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  // Ambil user yang baru dibuat (tanpa password)
  const newUser = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, Number(result[0].insertId)));

  return newUser[0];
}
