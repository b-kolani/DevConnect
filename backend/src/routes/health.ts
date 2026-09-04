import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

const healthRoutes = async(app: FastifyInstance) => {
    app.get("/health", (_request, reply) => {
        return reply.send({
            status: "OK",
            message: "DevConnect API is running"
        });
    });

    app.get("/hello", (_request, reply) => {
        return reply.send({
            message: "Hello DevConnect"
        });
    });
}

export default fp(healthRoutes);