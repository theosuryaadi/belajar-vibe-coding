# Belajar Vibe Coding - Backend API

Proyek ini adalah sistem **RESTful API Backend** modern yang difokuskan pada manajemen autentikasi pengguna secara aman, tangguh, dan sangat terstruktur. Dibangun untuk memberikan performa tinggi dan keamanan maksimal mulai dari ujung validasi input hingga ke penyimpanan basis data relasional.

---

## 🛠️ Tech Stack & Ekosistem
- **Runtime Environment:** [Bun](https://bun.sh/) (Runtime super-cepat berbasis Zig)
- **Framework Web:** [ElysiaJS](https://elysiajs.com/) (Framework tercepat untuk Bun dengan integrasi TypeBox)
- **Database Layer / ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database Server:** MySQL
- **Bahasa Pemrograman:** TypeScript (Strict Mode)

### Library Utama yang Digunakan
*   `elysia`: Core framework web.
*   `@elysiajs/swagger`: Auto-generasi dokumentasi Swagger/OpenAPI.
*   `drizzle-orm` & `drizzle-kit`: Pustaka eksekusi database tipe-aman dan alat migrasi.
*   `mysql2`: Driver konektor dari Node/Bun ke server MySQL.
*   `bcryptjs`: Pustaka kriptografi untuk *hashing/salting* keamanan kata sandi.

---

## 📁 Arsitektur Direktori & Struktur File

Sistem ini didesain menggunakan pola pembagian logika (**Separations of Concerns**) agar kode mudah dipelihara, dibaca, dan digeser.

```text
/
├── src/
│   ├── routes/              # Lapisan Presentasi [HTTP Request, TypeBox Validation]
│   │   └── user-routes.ts
│   ├── services/            # Lapisan Bisnis [Logika, Cek Duplikasi, Bcrypt]
│   │   └── user-service.ts
│   ├── db/                  # Lapisan Data [Konfigurasi DB, Tabel, Drizzle]
│   │   ├── index.ts         
│   │   └── schema.ts        
│   ├── utils/               # Modul Pembantu
│   │   └── errors.ts        # Custom Response Error Handling
│   ├── app.ts               # Wadah Elysia Framework (Terisolasi dari port demi Test Runner)
│   └── index.ts             # Main Entry Point (Server Listener / Port Binding)
├── tests/                   # Folder Unit dan E2E Testing (Setup/Teardown logic)
│   └── user.test.ts
├── .env                     # Kredensial Environment (Jangan dikomit)
└── drizzle.config.ts        # Konfigurasi Drizzle Kit Studio
```
*Aturan Penamaan:* Berkas-berkas berorientasi fungsional dinamakan murni memakai format `kebab-case` (contoh: `user-routes.ts`, `user-service.ts`), sementara standar folder dibuat _lowercase_.

---

## 💾 Skema Database (MySQL)

Arsitektur database dirancang mengedepankan efisiensi presisi untuk index B-TREE:

**Tabel `users`**
Menyimpan data otentik anggota secara rahasia.
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR 255)
- `email` (VARCHAR 255) — *[UNIQUE]*
- `password` (VARCHAR 255) — *Disimpan sebagai Bcrypt (Hash)*
- `createdAt` (TIMESTAMP) — *Default Now*

**Tabel `sessions`**
Menyimpan pelacak keping (Token) saat proses Login dengan siklus pemusnahan otomatis.
- `id` (INT, Primary Key, Auto Increment)
- `token` (VARCHAR 36) — UUID v4 presisi *[UNIQUE]*
- `userId` (INT) — Foreign Key yang merujuk ke tabel `users(id)`. *Diatur `ON DELETE CASCADE` sehingga apabila pengguna dihapus, sesi tokennya ikut dihancurkan.*
- `createdAt` (TIMESTAMP) — *Default Now*

---

## ⚙️ Cara Setup Koneksi Database

1. Pertama-tama, buat file `.env` di direktori terdepan proyek (_root_).
2. Tulis variabel *environment* penyusun koneksi *Pool MySQL* milik Anda:
```env
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_anda
DB_NAME=belajar_vibe_coding
```
3. Pastikan peladen (Server) MySQL Anda dalam kondisi _Running_. 
4. Dorong (_Deploy/Sync_) skema `Drizzle` menuju server MySQL agar database menciptakan tabel yang sesuai:
```bash
bun run db:push
```

---

## 🔗 Daftar RESTful API yang Tersedia

Secara default seluruh respon dilapis dalam selubung JSON `{ message, data, error }`. Framework otomatis memotong input payload asing. **Semua endpoint Rute memiliki validasi Limit String untuk mencegah *Server Crash* dan Serangan komputasi CPU.**

| Method | Endpoint | Kegunaan | Autentikasi | Request Payload |
| :---: | :--- | :--- | :--- | :--- |
| `POST` | `/api/users` | Pendaftaran (*Register*) Akun | Tidak Perlu | JSON (`name`, `email`, `password`) |
| `POST` | `/api/users/login` | Akses dan ambil *UUID Token* | Tidak Perlu | JSON (`email`, `password`) |
| `GET` | `/api/users/current` | Akses Metadata Profil rahasia Anda | **Memerlukan Bearer Token** | Kosong |
| `DELETE` | `/api/users/logout` | Melakukan dekstruksi log (*Delete Session*) | **Memerlukan Bearer Token** | Kosong |

*(Anda dapat menguji/melihat rincian struktur balasan lengkap secara interaktif lewat Swagger UI yang bisa diakses via web-browser: `http://localhost:3000/swagger` pada saat peladen diaktifkan).*

---

## 🧪 Cara Test & Validasi Aplikasi

Pengujian Aplikasi sangat komprehensif didukung modul pengujung mutakhir bernama `bun test` bawaan ekosistem Zig. Pipa pengujian yang disertakan secara drastis mendeteksi *Race Condition*, Celah Boundary, hingga isolasi otorisasi Token Usang dan *Null Safety*.

1. Putar peladen dalam proses Mode Pengembangan (*Auto-Reload*) menggunakan:
   ```bash
   bun run dev
   ```
2. Untuk validasi E2E dan mengeksekusi semua Skenario Keamanan yang ada di dalam map `/tests`, tekan terminal dan tulis:
   ```bash
   bun test
   ```
*(Otomatisasi ini akan membersihkan semua data ujicoba sebelum dieksekusi agar database tidak terpolusi).*
