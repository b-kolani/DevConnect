import fastify from "fastify";

import healthRoutes from "./routes/health.js";
import userRoutes from "./routes/users.js";

const app = fastify({ logger: true });

app.register(healthRoutes);
app.register(userRoutes)

export default app;