import type { FastifyInstance, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import z from "zod";
import prisma from "../lib/prisma.js";
import { Prisma } from '@prisma/client';

// Define the schema for creating a user
// The schema requires a username and an email, 
// both of which must be strings.
const createUserSchema = z.object({
    username: z.string({error: "Invalid Username"}),
    email: z.email({ error: "Invalid Email" })
});

// Define the schema for user ID validation
// The schema coerces the input to a number, 
// checks if it's an integer, and ensures it's positive.
const userIdSchema = z.coerce.number().int().positive();

// Type guard to check if a value is an object
// This function checks if the provided value is 
// of type 'object' and not null.
function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

// Mapping of database constraint names to user-friendly field names
// This object maps the database constraint names to
// more user-friendly field names that can be returned in error responses.
const errorMap = {
    "User_username_key": "username",
    "User_email_key": "email"
};

// Define a type for the keys of the errorMap object
// This type represents the keys of the errorMap object,
// which correspond to the database constraint names.
type ErrorMapKey = keyof typeof errorMap;

// Type guard to check if a value is a key of the errorMap
// This function checks if the provided value is a key of the errorMap object.
function isErrorMapKey(value: string): value is ErrorMapKey {
    return value in errorMap;
}

function sendInternalServerError(reply: FastifyReply) {
    return reply
        .code(500)
        .send({
            error: "Something went wrong."
        });
};

// Define the user routes for the Fastify application
// This function registers the user-related routes with the Fastify application.
const userRoutes = (app: FastifyInstance) => {
    // Route to get all users
    app.get("/users", async (_request, reply) => {
        try {
            const users = await prisma.user.findMany({
                orderBy: {
                    id: "asc"
                }
            });

            return reply.send({
                data: users
            });
        } catch {
            return sendInternalServerError(reply);
        }
    });

    // Route to get a user by ID
    app.get("/users/:id", async (request, reply) => {
        // Extract the user ID from the request parameters 
        // and validate it using the userIdSchema
        const params = request.params as { id?: string };
        // Validate the user ID using the userIdSchema
        // The safeParse method returns an object with a success property
        const result = userIdSchema.safeParse(params.id);

        if (!result.success) {
            return reply
                .code(400)
                .send({
                    error: "invalid_user_id"
                });
        }

        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: result.data
                }
            });

            if (user === null) {
                return reply
                    .code(404)
                    .send({
                        error: "user_not_found"
                    });
            }

            return reply.send({
                data: user
            });
        } catch {
            return sendInternalServerError(reply);
        }
    });

    // Route to create a new user
    app.post("/users", async(request, reply) => {
        // Validate the request body against the createUserSchema
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

                if (error.code === 'P2002') {
                    if (isObject(error.meta)) {
                        const driverAdapterError = error.meta.driverAdapterError;
                        if (isObject(driverAdapterError)) {
                            const cause = driverAdapterError.cause;
                            if (isObject(cause)) {
                                const constraint = cause.constraint;
                                if (isObject(constraint)) {
                                    const index = constraint.index;
                                    if (typeof index === 'string') {
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
                    return sendInternalServerError(reply);
                }
                
            } else {
                return sendInternalServerError(reply);
            }
        }
    });
}

export default fp(userRoutes);