import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("User API Authorization & Registration", () => {
  // Setup: Membersihkan database sebelum tiap test
  beforeEach(async () => {
    await db.delete(sessions);
    await db.delete(users);
  });

  describe("POST /api/users (Registration)", () => {
    it("harus berhasil mendaftar dengan payload valid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Tester",
            email: "test@example.com",
            password: "password123",
          }),
        })
      );

      const body = (await response.json()) as any;
      expect(response.status).toBe(201);
      expect(body.message).toBe("OK");
      expect(body.data.name).toBe("Tester");
      expect(body.data.email).toBe("test@example.com");
      expect(body.data.password).toBeUndefined();
    });

    it("harus gagal mendaftar dengan email duplikat", async () => {
      // Masukkan user pertama
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "User 1",
            email: "dup@example.com",
            password: "password123",
          }),
        })
      );

      // Coba masukkan email yang sama
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "User 2",
            email: "dup@example.com",
            password: "password123",
          }),
        })
      );

      const body = (await response.json()) as any;
      expect(response.status).toBe(400);
      expect(body.message).toBe("User already exists");
    });

    it("harus gagal jika validasi format salah (email/password pendek)", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "A", // too short (min 2)
            email: "not-email", // invalid format
            password: "123", // too short (min 6)
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = (await response.json()) as any;
      expect(body.message).toBe("Validation failed");
    });

    it("harus gagal jika melebihi batas maxLength", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "a".repeat(256),
            email: "test@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/users/login (Login)", () => {
    beforeEach(async () => {
      // Register user untuk testing login
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Login User",
            email: "login@example.com",
            password: "password123",
          }),
        })
      );
    });

    it("harus berhasil login dengan kredensial benar", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "password123",
          }),
        })
      );

      const body = (await response.json()) as any;
      expect(response.status).toBe(200);
      expect(body.data).toBeDefined(); // token
    });

    it("harus gagal login dengan password salah", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "wrongpassword",
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = (await response.json()) as any;
      expect(body.message).toBe("User not found");
    });
  });

  describe("GET /api/users/current (Profile)", () => {
    let token: string;

    beforeEach(async () => {
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Profile User",
            email: "profile@example.com",
            password: "password123",
          }),
        })
      );

      const loginResponse = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "profile@example.com",
            password: "password123",
          }),
        })
      );
      const loginBody = (await loginResponse.json()) as any;
      token = loginBody.data;
    });

    it("harus berhasil mengambil profil dengan token valid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const body = (await response.json()) as any;
      expect(response.status).toBe(200);
      expect(body.data.email).toBe("profile@example.com");
      expect(body.data.password).toBeUndefined();
    });

    it("harus gagal tanpa header Authorization", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
    });

    it("harus gagal dengan token invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { Authorization: "Bearer salah-token" },
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/users/logout (Logout)", () => {
    let token: string;

    beforeEach(async () => {
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Logout User",
            email: "logout@example.com",
            password: "password123",
          }),
        })
      );

      const loginResponse = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "logout@example.com",
            password: "password123",
          }),
        })
      );
      const loginBody = (await loginResponse.json()) as any;
      token = loginBody.data;
    });


    it("harus berhasil logout dan menghapus session dari DB", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(200);
      
      // Verifikasi token sudah tidak bisa digunakan
      const profileResponse = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      expect(profileResponse.status).toBe(401);

      // Verifikasi di database
      const dbSession = await db.select().from(sessions).where(eq(sessions.token, token));
      expect(dbSession.length).toBe(0);
    });
  });
});
