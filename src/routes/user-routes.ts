import { Elysia, t } from "elysia";
import { registerUser } from "../services/user-service";

export const userRoutes = new Elysia({ prefix: "/api/users" }).post(
  "/",
  async ({ body, set }) => {
    try {
      const user = await registerUser(body.name, body.email, body.password);

      set.status = 201;
      return {
        message: "OK",
        data: user,
      };
    } catch (error) {
      if (error instanceof Error && error.message === "User already exists") {
        set.status = 400;
        return {
          message: "User already exists",
          error: "Bad Request",
        };
      }

      set.status = 500;
      return {
        message: "Internal server error",
        error: "Internal Server Error",
      };
    }
  },
  {
    body: t.Object({
      name: t.String(),
      email: t.String(),
      password: t.String(),
    }),
  }
);
