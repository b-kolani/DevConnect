import type { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import z from "zod"

const createUserSchema = z.object({
    username: z.string({error: "Invalid Username"}),
    email: z.email({ error: "Invalid Email" })
});

const userRoutes = async(app: FastifyInstance) => {
    app.post("/users", (request, reply) => {
        const result = createUserSchema.safeParse(request.body);

        if (!result.success) {
            return reply
                   .code(400)
                   .send({
                error: result.error.issues[0]
            });
        }

        return reply.send({
            data: result.data
        });
    });
}

export default fp(userRoutes);