# Turborepo Project

## Prerequisites

- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

## Install packages

```sh
pnpm install
```

## Generate the Prisma client

Installs the Prisma client and types used across the app:

```sh
pnpm dlx turbo run db:generate
```

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
