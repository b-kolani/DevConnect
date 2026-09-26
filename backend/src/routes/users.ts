import type { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import z from "zod"
import prisma from "../lib/prisma.js";
import { Prisma } from '@prisma/client';

const createUserSchema = z.object({
    username: z.string({error: "Invalid Username"}),
    email: z.email({ error: "Invalid Email" })
});

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

const errorMap = {
    "User_username_key": "username",
    "User_email_key": "email"
}

type ErrorMapKey = keyof typeof errorMap;

function isErrorMapKey(value: string): value is ErrorMapKey {
    return value in errorMap;
}

const userRoutes = (app: FastifyInstance) => {
    app.post("/users", async(request, reply) => {
        const result = createUserSchema.safeParse(request.body);

        if (!result.success) {
            return reply
                   .code(400)
                   .send({
                error: result.error.issues[0]
            });
        }

        try {

            const user = await prisma.user.create({
                data: result.data
            });

            return reply
                .code(201)
                .send({
                    data: user
                });
        } catch(error) {
            let errorField: string | undefined;

            if (error instanceof Prisma.PrismaClientKnownRequestError) {

                if (error.code == 'P2002') {
                    if (isObject(error.meta)) {
                        // console.log(error.meta);
                        const driverAdapterError = error.meta.driverAdapterError;
                        // console.log(driverAdapterError);
                        if (isObject(driverAdapterError)) {
                            const cause = driverAdapterError.cause;
                            if (isObject(cause)) {
                                // console.log(cause.constraint);
                                const constraint = cause.constraint;
                                if (isObject(constraint)) {
                                    // console.log(constraint.index);
                                    const index = constraint.index;
                                    if (typeof index === 'string') {
                                        // console.log(index);
                                        if (isErrorMapKey(index)) {
                                            errorField = errorMap[index];
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (errorField !== undefined) {
                        return reply
                            .code(409)
                            .send({
                                error: "unique_constraint",
                                field: errorField
                            });
                    } else {
                        return reply
                            .code(409)
                            .send({
                                error: "unique_constraint"
                            });
                    }
                } else {
                    return reply
                        .code(500)
                        .send({
                            error: "Something went wrong."
                        });
                }
                
            } else {
                return reply
                       .code(500)
                       .send({
                            error: "Something went wrong."
                       });
            }
        }
    });
}

export default fp(userRoutes);