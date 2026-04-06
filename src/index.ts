import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { userRoutes } from "./routes";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Belajar Vibe Coding API",
          version: "1.0.0",
          description: "REST API dengan Bun + ElysiaJS + Drizzle + MySQL",
        },
      },
    })
  )
  .use(userRoutes)
  .get("/", () => ({
    message: "Welcome to Belajar Vibe Coding API",
    docs: "/swagger",
  }))
  .listen(process.env.PORT || 3000);

console.log(
  `🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📚 Swagger docs at http://${app.server?.hostname}:${app.server?.port}/swagger`
);
