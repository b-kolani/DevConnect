import prisma from "../../src/lib/prisma.js";
import type { User } from "@prisma/client";

type UserClientForMocking = {
	findMany: (...args: never[]) => Promise<User[]>;
	findUnique: (...args: never[]) => Promise<User | null>;
	create: (...args: never[]) => Promise<User | null>;
};

const userClient = prisma.user as unknown as UserClientForMocking;

// Mock user-related Prisma client methods and return a function that restores them.
export function mockUserRouteResponses({
	findManyResult,
	findUniqueResult,
	createResult,
	findManyError,
	findUniqueError,
	createError,
}: {
	findManyResult?: User[];
	findUniqueResult?: User | null;
	createResult?: User | null;
	findManyError?: unknown;
	findUniqueError?: unknown;
	createError?: unknown;
}) {
	// Bind the original methods to preserve their context when restoring them.
	const originalFindMany = userClient.findMany.bind(userClient);
	const originalFindUnique = userClient.findUnique.bind(userClient);
	const originalCreate = userClient.create.bind(userClient);

	// Return configured results, or throw the configured create error.
	userClient.findMany = async () => {
		if (findManyError !== undefined) {
			throw findManyError;
		}

		return findManyResult ?? [];
	};
	userClient.findUnique = async () => {
		if (findUniqueError !== undefined) {
			throw findUniqueError;
		}

		return findUniqueResult ?? null;
	};
	userClient.create = async () => {
		if (createError !== undefined) {
			throw createError;
		}

		return createResult ?? null;
	};

	// Return a restore function that can be called to revert the Prisma client methods to their original implementations
	// This allows tests to clean up after themselves and avoid side effects on other tests
	return () => {
		userClient.findMany = originalFindMany;
		userClient.findUnique = originalFindUnique;
		userClient.create = originalCreate;
	};
}
