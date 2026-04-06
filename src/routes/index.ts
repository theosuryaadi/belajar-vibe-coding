import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const userRoutes = new Elysia({ prefix: "/users" })
  // GET /users — list semua users
  .get("/", async () => {
    const allUsers = await db.select().from(users);
    return allUsers;
  })

  // GET /users/:id — get user by id
  .get(
    "/:id",
    async ({ params, set }) => {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(params.id)));

      if (user.length === 0) {
        set.status = 404;
        return { message: "User not found" };
      }

      return user[0];
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // POST /users — create user baru
  .post(
    "/",
    async ({ body, set }) => {
      const result = await db.insert(users).values({
        name: body.name,
        email: body.email,
      });

      set.status = 201;
      return {
        message: "User created successfully",
        id: Number(result[0].insertId),
      };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    }
  )

  // PUT /users/:id — update user
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(params.id)));

      if (existing.length === 0) {
        set.status = 404;
        return { message: "User not found" };
      }

      await db
        .update(users)
        .set({
          name: body.name,
          email: body.email,
        })
        .where(eq(users.id, Number(params.id)));

      return { message: "User updated successfully" };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    }
  )

  // DELETE /users/:id — delete user
  .delete(
    "/:id",
    async ({ params, set }) => {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(params.id)));

      if (existing.length === 0) {
        set.status = 404;
        return { message: "User not found" };
      }

      await db.delete(users).where(eq(users.id, Number(params.id)));

      return { message: "User deleted successfully" };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );
