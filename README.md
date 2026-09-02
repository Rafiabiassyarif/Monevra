# Monevra

Monevra sekarang berjalan dengan React, Express API lokal, dan MySQL Laragon.

## Prasyarat

- Node.js
- Laragon/MySQL aktif
- Database MySQL bernama `monevra`

## Setup Database

Import schema dan data awal:

```bash
mysql -u root < backend/database/monevra.sql
```

Atau kalau database `monevra` sudah ada:

```bash
mysql -u root monevra < backend/database/monevra.sql
```

## Jalankan Development

```bash
npm install
npm run dev
```

Frontend berjalan di `http://localhost:3000`.
API berjalan di `http://localhost:3000`.

## Jalankan Production Lokal

```bash
npm run build
npm start
```

App production akan diserve oleh Express di `http://localhost:3000`.

## Akun Awal

- Admin: `rafiabiassyarif@gmail.com` / `admin123`
- User: `user.demo@monevra.com` / `user123`
