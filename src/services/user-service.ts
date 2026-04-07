import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users, sessions } from "../db/schema";

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

export async function loginUser(email: string, password: string) {
  // Cari user berdasarkan email
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (user.length === 0) {
    throw new Error("User not found");
  }

  const foundUser = user[0]!;

  // Verifikasi password
  const isValid = await bcrypt.compare(password, foundUser.password);

  if (!isValid) {
    throw new Error("User not found");
  }

  // Generate UUID token
  const token = crypto.randomUUID();

  // Simpan session ke database
  await db.insert(sessions).values({
    token,
    userId: foundUser.id,
  });

  return token;
}

export async function getCurrentUser(token: string) {
  // Cari session berdasarkan token
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token));

  if (session.length === 0) {
    throw new Error("Unauthorized");
  }

  const foundSession = session[0]!;

  // Ambil data user tanpa password
  const user = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, foundSession.userId!));

  if (user.length === 0) {
    throw new Error("Unauthorized");
  }

  return user[0]!;
}

export async function logoutUser(token: string) {
  // Cari session berdasarkan token
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token));

  if (session.length === 0) {
    throw new Error("Unauthorized");
  }

  // Hapus session dari database
  await db.delete(sessions).where(eq(sessions.token, token));

  return "OK";
}
