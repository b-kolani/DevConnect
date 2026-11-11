import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";

import app from "../src/app.js";
import { mockUserRouteResponses } from "./helpers/mock-prisma.js";

// Test suite for user-related routes
// This suite tests the behavior of the user routes, including fetching all users,
// fetching a user by ID, and handling invalid or missing users.
test("GET /users returns a 200 response with a data array", async () => {
	// Mock the Prisma client responses for the user routes
	// The mockUserRouteResponses function allows us to specify the results for the 
	// findMany and findUnique methods of the Prisma client.
	const restore = mockUserRouteResponses({
		findManyResult: [
			{ id: 1, username: "alice", email: "alice@example.com" },
			{ id: 2, username: "bob", email: "bob@example.com" }
		]
	});

	// Use a try-finally block to ensure that the restore function is called
	// after the test, even if an assertion fails. This prevents side effects on other tests.
	try {
		// Inject a GET request to the /users route of the Fastify application
		// The inject method simulates an HTTP request to the application without starting a server.
		const response = await app.inject({
			method: "GET",
			url: "/users"
		});

		// Assert that the response status code is 200 (OK)
		assert.equal(response.statusCode, 200);

		// Assert that the response body is an object with a data property that is an array
		const body = response.json();
		assert.ok(body && typeof body === "object");
		assert.ok(Array.isArray(body.data));
		assert.equal(body.data.length, 2);
	} finally {
		// Call the restore function to revert the Prisma client methods to their original implementations
		// This ensures that other tests are not affected by the mocked responses.
		restore();
	}
});

test("GET /users returns 500 when reading users fails", async () => {
	const restore = mockUserRouteResponses({
		findManyError: new Error("Database unavailable")
	});

	try {
		const response = await app.inject({
			method: "GET",
			url: "/users"
		});

		assert.equal(response.statusCode, 500);
		assert.deepEqual(response.json(), {
			error: "Something went wrong."
		});
	} finally {
		restore();
	}
});

// Test for invalid user ID handling
test("GET /users/nope rejects invalid IDs with a 400 status", async () => {
	// Mock the Prisma client responses for the user routes
	// The mockUserRouteResponses function allows us to specify the results for the 
	// findMany and findUnique methods of the Prisma client.
	const restore = mockUserRouteResponses({});

	try {
		// Inject a GET request to the /users/nope route of the Fastify application
		// The inject method simulates an HTTP request to the application without starting a server.
		const response = await app.inject({
			method: "GET",
			url: "/users/nope"
		});

		assert.equal(response.statusCode, 400);

		const body = response.json();
		assert.equal(body.error, "invalid_user_id");
	} finally {
		restore();
	}
});

// Test for handling missing users
test("GET /users/999999999 returns 404 when the user is missing", async () => {
	// Mock the Prisma client responses for the user routes
	// The mockUserRouteResponses function allows us to specify the results for the 
	// findMany and findUnique methods of the Prisma client.
	const restore = mockUserRouteResponses({
		findUniqueResult: null
	});

	try {
		const response = await app.inject({
			method: "GET",
			url: "/users/999999999"
		});

		assert.equal(response.statusCode, 404);

		const body = response.json();
		assert.equal(body.error, "user_not_found");
	} finally {
		restore();
	}
});

test("GET /users/:id returns a user with a 200 status", async () => {
	const user = {
		id: 1,
		username: "alice",
		email: "alice@example.com"
	};
	const restore = mockUserRouteResponses({
		findUniqueResult: user
	});

	try {
		const response = await app.inject({
			method: "GET",
			url: "/users/1"
		});

		assert.equal(response.statusCode, 200);
		assert.deepEqual(response.json(), {
			data: user
		});
	} finally {
		restore();
	}
});

test("GET /users/:id returns 500 when reading a user fails", async () => {
	const restore = mockUserRouteResponses({
		findUniqueError: new Error("Database unavailable")
	});

	try {
		const response = await app.inject({
			method: "GET",
			url: "/users/1"
		});

		assert.equal(response.statusCode, 500);
		assert.deepEqual(response.json(), {
			error: "Something went wrong."
		});
	} finally {
		restore();
	}
});

test("GET /users/0 rejects a non-positive user ID with a 400 status", async () => {
	const restore = mockUserRouteResponses({});

	try {
		const response = await app.inject({
			method: "GET",
			url: "/users/0"
		});

		assert.equal(response.statusCode, 400);
		assert.deepEqual(response.json(), {
			error: "invalid_user_id"
		});
	} finally {
		restore();
	}
});

test("GET /users/-1 rejects a negative user ID with a 400 status", async () => {
	const restore = mockUserRouteResponses({});

	try {
		const response = await app.inject({
			method: "GET",
			url: "/users/-1"
		});

		assert.equal(response.statusCode, 400);
		assert.deepEqual(response.json(), {
			error: "invalid_user_id"
		});
	} finally {
		restore();
	}
});

test("POST /users rejects invalid request bodies with a 400 status", async () => {
	// Mock the Prisma client responses for the user routes
	// The mockUserRouteResponses function allows us to specify the results for the 
	// findMany, findUnique, and create methods of the Prisma client.
	const restore = mockUserRouteResponses({});

	try {
		const response = await app.inject({
			method: "POST",
			url: "/users",
			payload: {
				username: "alice",
				email: "not-an-email" // Invalid email format
			}
		});

		assert.equal(response.statusCode, 400);

		const body = response.json();
		assert.equal(body.error.code, "invalid_format");
	} finally {
		restore();
	}
});

test("POST /users creates a new user and returns 201 with the created user", async () => {
	// Define the expected created user object
	const createUser = {
		id: 3,
		username: "charlie",
		email: "charlie@example.com"
	};

	// Mock the Prisma client responses for the user routes
	// The mockUserRouteResponses function allows us to specify the results for the 
	// user's methods of the Prisma client.
	const restore = mockUserRouteResponses({
		createResult: createUser
	});

	try {
		const response = await app.inject({
			method: "POST",
			url: "/users",
			payload: {
				username: "charlie",
				email: "charlie@example.com"
			}
		});

		assert.equal(response.statusCode, 201);

		const body = response.json();
		assert.ok(body && typeof body === "object");
		assert.ok(body.data && typeof body.data === "object");
		assert.deepEqual(body, { data: createUser });
	} finally {
		restore();
	}
});

test("POST /users returns 400 when the username is missing", async () => {
	// Mock the Prisma client responses for the user routes
	// The mockUserRouteResponses function allows us to specify the results for the 
	// user's methods of the Prisma client.
	const restore = mockUserRouteResponses({});

	try {
		const response = await app.inject({
			method: "POST",
			url: "/users",
			payload: {
				email: "charlie@example.com"
			}
		});

		assert.equal(response.statusCode, 400);

		const body = response.json();
		assert.equal(body.error.code, "invalid_type");
	} finally {
		restore();
	}
});

test("POST /users returns 400 when the email is missing", async () => {
	const restore = mockUserRouteResponses({});

	try {
		const response = await app.inject({
			method: "POST",
			url: "/users",
			payload: {
				username: "charlie"
			}
		});

		assert.equal(response.statusCode, 400);

		const body = response.json();
		assert.equal(body.error.code, "invalid_type");
	} finally {
		restore();
	}
});

test("POST /users returns 409 when the username already exists", async () => {
	const createError = new Prisma.PrismaClientKnownRequestError(
		"Unique constraint failed on the username",
		{
			code: "P2002",
			clientVersion: "7.10.0",
			meta: {
				driverAdapterError: {
					cause: {
						constraint: {
							index: "User_username_key"
						}
					}
				}
			}
		}
	);

	const restore = mockUserRouteResponses({
		createError
	});

	try {
		const response = await app.inject({
			method: "POST",
			url: "/users",
			payload: {
				username: "alice",
				email: "alice@example.com"
			}
		});

		assert.equal(response.statusCode, 409);
		assert.deepEqual(response.json(), {
			error: "unique_constraint",
			field: "username"
		});
	} finally {
		restore();
	}
});

test("POST /users returns 409 when the email already exists", async () => {
	const createError = new Prisma.PrismaClientKnownRequestError(
		"Unique constraint failed on the email",
		{
			code: "P2002",
			clientVersion: "7.10.0",
			meta: {
				driverAdapterError: {
					cause: {
						constraint: {
							index: "User_email_key"
						}
					}
				}
			}
		}
	);

	const restore = mockUserRouteResponses({
		createError
	});

	try {
		const response = await app.inject({
			method: "POST",
			url: "/users",
			payload: {
				username: "charlie",
				email: "alice@example.com"
			}
		});

		assert.equal(response.statusCode, 409);
		assert.deepEqual(response.json(), {
			error: "unique_constraint",
			field: "email"
		});
	} finally {
		restore();
	}
});

test("POST /users returns 500 when user creation fails unexpectedly", async () => {
	const createError = new Error("Database unavailable");
	const restore = mockUserRouteResponses({
		createError
	});

	try {
		const response = await app.inject({
			method: "POST",
			url: "/users",
			payload: {
				username: "charlie",
				email: "charlie@example.com"
			}
		});

		assert.equal(response.statusCode, 500);
		assert.deepEqual(response.json(), {
			error: "Something went wrong."
		});
	} finally {
		restore();
	}
});
