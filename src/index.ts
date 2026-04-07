import { app } from "./app";

app.listen(process.env.PORT || 3000);

console.log(
  `🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📚 Swagger docs at http://${app.server?.hostname}:${app.server?.port}/swagger`
);
