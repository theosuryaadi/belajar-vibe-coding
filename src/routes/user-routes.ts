import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser } from "../services/user-service";

export const userRoutes = new Elysia({ prefix: "/api/users" })
  .post(
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
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const token = await loginUser(body.email, body.password);

        return {
          data: token,
        };
      } catch (error) {
        if (error instanceof Error && error.message === "User not found") {
          set.status = 400;
          return {
            message: "User not found",
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
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get(
    "/current",
    async ({ headers, set }) => {
      try {
        const authorization = headers["authorization"];

        if (!authorization || !authorization.startsWith("Bearer ")) {
          set.status = 401;
          return {
            message: "Unauthorized",
            error: "Bad Request",
          };
        }

        const token = authorization.replace("Bearer ", "");
        const user = await getCurrentUser(token);

        return {
          data: user,
        };
      } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
          set.status = 401;
          return {
            message: "Unauthorized",
            error: "Bad Request",
          };
        }

        set.status = 500;
        return {
          message: "Internal server error",
          error: "Internal Server Error",
        };
      }
    }
  );
