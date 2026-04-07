import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/user-service";
import { ResponseError } from "../utils/errors";

export const userRoutes = new Elysia({ prefix: "/api/users" })
  .error({
    ResponseError,
  })
  .onError(({ code, error, set }) => {
    if (code === "ResponseError") {
      set.status = error.statusCode;
      return {
        message: error.message,
        error: "Bad Request",
      };
    }

    if (code === "VALIDATION" || code === "PARSE") {
      set.status = 400;
      return {
        message: code === "VALIDATION" ? "Validation failed" : "Parse error",
        error: code === "VALIDATION" ? error.all.map((e) => ({
          path: e.path,
          message: e.message,
        })) : error.message,
      };
    }

    if (error && (error as any).code === "ER_DUP_ENTRY") {
      set.status = 400;
      return {
        message: "Email is already registered",
        error: "Bad Request",
      };
    }

    console.error("[Server Error]:", error);
    set.status = 500;
    return {
      message: "Internal server error",
      error: "Internal Server Error",
    };
  })
  .post(
    "/",
    async ({ body, set }) => {
      const user = await registerUser(body.name, body.email, body.password);
      set.status = 201;
      return {
        message: "OK",
        data: user,
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 255 }),
        email: t.String({ format: "email", maxLength: 255 }),
        password: t.String({ minLength: 6, maxLength: 128 }),
      }),
      detail: {
        tags: ["Authentication"],
        summary: "Mendaftarkan Pengguna Baru",
        description: "Menambahkan user baru ke sistem. Password akan di-hash menggunakan Bcrypt.",
        responses: {
          201: { description: "User berhasil dibuat" },
          400: { description: "Validasi gagal atau user sudah terdaftar" },
        },
      },
    }
  )
  .post(
    "/login",
    async ({ body }) => {
      const token = await loginUser(body.email, body.password);
      return {
        data: token,
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email", maxLength: 255 }),
        password: t.String({ minLength: 6, maxLength: 128 }),
      }),
      detail: {
        tags: ["Authentication"],
        summary: "Login Pengguna",
        description: "Memverifikasi kredensial dan mengembalikan token UUID.",
        responses: {
          200: { description: "Login berhasil, mengembalikan token" },
          400: { description: "Email atau password salah" },
        },
      },
    }
  )
  .derive(async ({ headers }) => {
    const auth = headers["authorization"];
    if (!auth || !auth.startsWith("Bearer ")) {
      throw new ResponseError(401, "Unauthorized");
    }
    const token = auth.replace("Bearer ", "");
    const user = await getCurrentUser(token);
    return { user, token };
  })
  .get("/current", ({ user }) => {
    return {
      data: user,
    };
  }, {
    detail: {
      tags: ["Authentication"],
      summary: "Ambil Profil User",
      description: "Mendapatkan data user yang sedang login (Membutuhkan Bearer Token).",
      responses: {
        200: { description: "Data user berhasil diambil" },
        401: { description: "Tidak terautentikasi" },
      },
    },
  })
  .delete("/logout", async ({ token }) => {
    await logoutUser(token);
    return {
      data: "OK",
    };
  }, {
    detail: {
      tags: ["Authentication"],
      summary: "Logout Sesi",
      description: "Menghapus session token dari database.",
      responses: {
        200: { description: "Logout berhasil" },
        401: { description: "Token tidak valid atau sudah kadaluwarsa" },
      },
    },
  });
