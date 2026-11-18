# DevConnect

DevConnect is a social network for developers. The planned product allows
developers to share projects, exchange knowledge, and connect with one another.

The repository is currently at the beginning of the MVP: the backend has a
working Fastify API, a PostgreSQL database managed with Prisma, and the first
User endpoints. The mobile application is planned but has not been started
yet.

## Repository structure

```text
DevConnect/
├── backend/
│   ├── src/
│   │   ├── lib/              # Shared backend services, including Prisma
│   │   ├── routes/            # Fastify route modules
│   │   ├── app.ts             # Fastify app and route registration
│   │   └── server.ts          # HTTP server entry point
│   ├── prisma/
│   │   ├── migrations/        # Committed database migrations
│   │   └── schema.prisma      # Database model definitions
│   ├── tests/                 # Backend tests
│   ├── docker-compose.yml     # Local PostgreSQL service
│   ├── package.json
│   └── tsconfig.json
├── mobile/                    # Planned mobile client
└── README.md
```

## Prerequisites

- Node.js 24 or a compatible modern Node.js version
- npm
- Docker Desktop with Docker Compose
- Git

## Backend setup

From the repository root:

```powershell
cd backend
npm install
docker compose up -d
```

Create `backend/.env` with a local PostgreSQL connection string:

```env
DATABASE_URL="postgresql://devconnect:devconnect@localhost:5433/devconnect"
```

Apply the committed Prisma migrations:

```powershell
npx prisma migrate deploy
```

Start the development server:

```powershell
npm run dev
```

The API listens on `http://localhost:3000`.

## Useful commands

Run these commands from `backend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development API |
| `npm test` | Run the backend test suite |
| `npm run typecheck` | Type-check the backend |
| `npx prisma validate` | Validate the Prisma schema |
| `npx prisma migrate status` | Check migration status |
| `npx prisma migrate deploy` | Apply committed migrations |
| `docker compose up -d` | Start PostgreSQL |
| `docker compose down` | Stop PostgreSQL |

## Current API

### Health checks

```text
GET /health
GET /hello
```

### Users

```text
GET  /users
GET  /users/:id
POST /users
```

Create a user:

```powershell
curl.exe -X POST http://localhost:3000/users `
  -H "Content-Type: application/json" `
  -d '{"username":"ada","email":"ada@example.com"}'
```

The user endpoints currently support:

- Required `username` and `email` validation
- Unique username and email constraints
- Listing users ordered by ID
- Lookup by numeric user ID
- `400` responses for invalid IDs or request bodies
- `404` responses when a user does not exist
- `409` responses for duplicate usernames or email addresses
- `500` responses for unexpected database failures

## Database

The current database contains one model:

```text
User
├── id
├── username (unique)
└── email (unique)
```

When the schema changes during development:

```powershell
npx prisma migrate dev --name describe-your-change
```

Commit both the updated `prisma/schema.prisma` and the generated migration.
Do not edit an already-applied migration; create a new one instead.

## Development workflow

1. Check the existing routes, schema, and tests before changing behavior.
2. Start PostgreSQL with Docker Compose.
3. Make a focused change in `backend/src/`.
4. Add or update tests in `backend/tests/`.
5. Run `npm test`, `npx tsc --noEmit`, and `npx prisma validate`.
6. Update this README when setup or public API behavior changes.

## MVP direction

### Entity relationship overview

```text
User
├── Profile
├── Post
│   ├── Image
│   ├── Comment
│   └── Like
├── Project
├── Following users
├── Conversation members
│   └── Messages
└── Notifications

User ───────── Technology ───────── Technology
```

The product model is expected to grow toward:

- User profiles
- Posts, images, comments, and likes
- Projects and technologies
- Following developers
- Conversations and messages
- Notifications

These are product goals, not implemented API features yet. Build each area
incrementally by adding its Prisma models, migration, route module, tests, and
documentation.

## Status

Implemented:

- Fastify backend
- PostgreSQL development database
- Prisma schema and initial migration
- Health endpoints
- User creation and read endpoints
- Comprehensive user route tests

Next recommended slice: implement profiles on top of the existing User model.
