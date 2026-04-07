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
  })
  .delete("/logout", async ({ token }) => {
    await logoutUser(token);
    return {
      data: "OK",
    };
  });
