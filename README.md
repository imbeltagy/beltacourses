# Turborepo Project

## Prerequisites

- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

## Install packages

```sh
pnpm install
```

This will automatically trigger two commands after finish:

```
pnpm dlx turbo run db:generate
pnpm dlx turbo run db:build
```

`@repo/db` is consumed as a compiled package (not raw source), so its `dist/`
output must exist before apps that depend on it (e.g. `backend`) can
type-check, build, or run

## Run for development

Start the database:

```sh
docker compose -f ./compose/dev.yml up --build -d
```

Start the apps:

```sh
pnpm dlx turbo run dev
```

## Database commands

Migrate the database after updating the Prisma schema:

```sh
pnpm dlx turbo run db:migrate
```

Deploy migrations to the database:

```sh
pnpm dlx turbo run db:deploy
```

Reset the database and seed data:

```sh
pnpm dlx turbo run db:seed
```

Live preview the database:

```sh
pnpm dlx turbo run db:preview
```
