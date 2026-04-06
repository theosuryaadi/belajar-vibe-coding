# Belajar Vibe Coding API

REST API backend menggunakan **Bun** + **ElysiaJS** + **Drizzle ORM** + **MySQL**.

## Prerequisites

- [Bun](https://bun.sh/) (>= 1.0)
- MySQL Server (running)

## Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Setup database

Copy file `.env.example` dan isi credentials MySQL kamu:

```bash
cp .env.example .env
```

Edit `.env` sesuai konfigurasi MySQL kamu:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=belajar_vibe_coding
```

Pastikan database `belajar_vibe_coding` sudah dibuat di MySQL:

```sql
CREATE DATABASE belajar_vibe_coding;
```

### 3. Jalankan migration

Push schema ke database:

```bash
bun run db:push
```

Atau generate migration files:

```bash
bun run db:generate
```

### 4. Jalankan server development

```bash
bun run dev
```

Server akan berjalan di `http://localhost:3000` dengan hot reload.

Dokumentasi API (Swagger) tersedia di `http://localhost:3000/swagger`.

## Scripts

| Script           | Deskripsi                                    |
| ---------------- | -------------------------------------------- |
| `bun run dev`    | Jalankan server development (hot reload)     |
| `bun run db:generate` | Generate migration files dari schema   |
| `bun run db:push`     | Push schema langsung ke database       |
| `bun run db:studio`   | Buka Drizzle Studio (visualisasi DB)   |

## API Endpoints

| Method | Endpoint      | Deskripsi          |
| ------ | ------------- | ------------------ |
| GET    | `/`           | Welcome message    |
| GET    | `/users`      | List semua users   |
| GET    | `/users/:id`  | Get user by ID     |
| POST   | `/users`      | Create user baru   |
| PUT    | `/users/:id`  | Update user        |
| DELETE | `/users/:id`  | Delete user        |

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: MySQL
