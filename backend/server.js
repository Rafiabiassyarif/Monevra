import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import nodemailer from 'nodemailer';
import { spawn } from 'child_process';
import { randomBytes, randomInt } from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import multer from 'multer';

import { hashPassword, comparePassword, signToken, authenticateToken, requireAdmin } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();
const port = Number(process.env.PORT || process.env.SERVER_PORT || 3001);

// Fail-fast di production: jangan start kalau JWT_SECRET lemah/tidak ada.
if (process.env.NODE_ENV === 'production') {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'dev_secret_change_in_production' || secret.length < 32) {
    console.error('❌ JWT_SECRET tidak valid untuk production. Set JWT_SECRET (min 32 karakter) di .env sebelum start.');
    process.exit(1);
  }
}

// In-memory store for OTP codes (For demo/local use only. Real app would use Redis or DB table)
const resetCodes = new Map();

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this or use host/port for other SMTP providers
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'monevra',
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(helmet({ contentSecurityPolicy: false }));
const allowedOrigins = process.env.APP_URL ? process.env.APP_URL.split(',') : ['http://localhost:3000'];
app.use(cors({ origin: allowedOrigins, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }));

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { message: 'Terlalu banyak permintaan.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: 'Terlalu banyak percobaan, coba lagi dalam 15 menit.' } });
app.use('/api', globalLimiter);
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Protect user data routes — require valid JWT + ownership
app.use('/api/users/:userId', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  authenticateToken(req, res, () => {
    if (String(req.user.userId) !== String(req.params.userId)) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke data ini.' });
    }
    next();
  });
});

// Protect admin routes — require valid JWT + admin role
app.use('/api/admin', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  authenticateToken(req, res, () => requireAdmin(req, res, next));
});

// Wrap async route handlers to catch errors automatically
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;',
}[char]));

const toDateString = value => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
};

const mapUser = row => ({
  uid: String(row.id),
  id: String(row.id),
  name: row.name,
  displayName: row.name,
  email: row.email,
  role: row.role,
  currency: row.currency || 'IDR',
  language: row.language || 'id',
  phone: row.phone || '',
  avatar: row.avatar || null,
  twoFactorEnabled: Boolean(row.two_factor_enabled),
  notifEmail: Boolean(row.notif_email ?? 1),
  notifPush: Boolean(row.notif_push ?? 0),
  createdAt: row.created_at,
});

const mapTransaction = row => ({
  id: String(row.id),
  title: row.title,
  category: row.category,
  amount: Number(row.amount),
  wallet: row.wallet_name,
  date: toDateString(row.transaction_date),
  status: row.status,
  type: row.type,
});

const mapWallet = row => ({
  id: String(row.id),
  name: row.name,
  balance: Number(row.balance),
  type: row.type,
  accountNumber: row.account_number || undefined,
});

const mapBudget = row => ({
  id: String(row.id),
  category: row.category,
  limit: Number(row.limit_amount),
});

const mapGoal = row => ({
  id: String(row.id),
  name: row.name,
  targetAmount: Number(row.target_amount),
  currentAmount: Number(row.current_amount),
  deadline: toDateString(row.deadline),
});

async function getUserById(id) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] ? mapUser(rows[0]) : null;
}

async function getFinance(userId) {
  const [[userRows], [txRows], [walletRows], [budgetRows]] = await Promise.all([
    pool.execute('SELECT * FROM users WHERE id = ?', [userId]),
    pool.execute('SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC, id DESC', [userId]),
    pool.execute('SELECT * FROM wallets WHERE user_id = ? ORDER BY id DESC', [userId]),
    pool.execute('SELECT * FROM budgets WHERE user_id = ? ORDER BY id DESC', [userId]),
  ]);

  // Goals table may not exist yet, handle gracefully
  let goalRows = [];
  try {
    const [rows] = await pool.execute('SELECT * FROM goals WHERE user_id = ? ORDER BY deadline ASC', [userId]);
    goalRows = rows;
  } catch (_) { /* goals table may not exist */ }

  if (!userRows[0]) return null;
  return {
    profile: {
      name: userRows[0].name,
      email: userRows[0].email,
      currency: userRows[0].currency || 'IDR',
      language: userRows[0].language || 'id',
      phone: userRows[0].phone || '',
      avatar: userRows[0].avatar || null,
      twoFactorEnabled: Boolean(userRows[0].two_factor_enabled),
      notifEmail: Boolean(userRows[0].notif_email ?? 1),
      notifPush: Boolean(userRows[0].notif_push ?? 0),
      gemini_api_key: userRows[0].gemini_api_key || '',
    },
    transactions: txRows.map(mapTransaction),
    wallets: walletRows.map(mapWallet),
    budgets: budgetRows.map(mapBudget),
    goals: goalRows.map(mapGoal),
  };
}

// --- Public API ---
app.post('/api/contact', asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Nama, email, dan pesan wajib diisi.' });
  }

  const [settingsRows] = await pool.execute('SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ("smtp_host", "smtp_port", "smtp_user", "smtp_pass", "sender_email")');
  const settings = {};
  settingsRows.forEach(r => settings[r.setting_key] = r.setting_value);

  const smtpHost = settings.smtp_host || 'smtp.gmail.com';
  const smtpPort = settings.smtp_port ? Number(settings.smtp_port) : 465;
  const smtpUser = settings.smtp_user || process.env.SMTP_USER;
  const smtpPass = settings.smtp_pass || process.env.SMTP_PASS;
  const senderEmail = settings.sender_email || smtpUser;

  if (!smtpUser || !smtpPass) {
    console.warn('⚠️ SMTP credentials not fully configured! Pesan tersimpan di console:', { name, email, message });
    return res.json({ ok: true, message: 'Pesan berhasil dicatat (SMTP belum dikonfigurasi).' });
  }

  const isGmail = smtpUser && smtpUser.endsWith('@gmail.com');
  const transportConfig = isGmail 
    ? { service: 'gmail', auth: { user: smtpUser, pass: smtpPass } }
    : { host: smtpHost, port: smtpPort, secure: smtpPort === 465, auth: { user: smtpUser, pass: smtpPass } };

  const dynamicTransporter = nodemailer.createTransport(transportConfig);

  try {
    await dynamicTransporter.sendMail({
      from: `"${name}" <${senderEmail}>`,
      replyTo: email,
      to: 'appsmonevra@gmail.com',
      subject: 'Pesan Baru dari Landing Page Monevra',
      text: `Nama: ${name}\nEmail: ${email}\n\nPesan:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; color: #0f172a;">
          <h2>Pesan Baru dari Landing Page Monevra</h2>
          <p><strong>Nama:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Pesan:</strong></p>
          <p style="white-space: pre-wrap; background: #e2e8f0; padding: 15px; border-radius: 8px;">${escapeHtml(message)}</p>
        </div>
      `
    });
    res.json({ ok: true, message: 'Pesan berhasil dikirim.' });
  } catch (error) {
    console.error('SMTP Error (Gagal mengirim email yang sebenarnya):', error.message);
    console.log('--- Detail Pesan yang Gagal Terkirim ---', { name, email, message });
    // Mengembalikan status 200 OK agar frontend tetap menampilkan sukses (simulasi)
    res.json({ ok: true, message: 'Pesan berhasil dicatat di server (simulasi).' });
  }
}));

// --- Health ---
app.get('/api/health', asyncHandler(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

// --- Auth ---
const verifyCaptcha = async (req, res, next) => {
  const token = req.body.captchaToken;
  if (!token) return res.status(400).json({ message: 'Verifikasi Puzzle gagal. Harap geser puzzle.' });

  // Custom Slider Puzzle Validation
  if (!token.startsWith('monevra_custom_verified_token_')) {
    return res.status(400).json({ message: 'Verifikasi Puzzle tidak valid atau kadaluarsa.' });
  }

  // Opsional: Validasi waktu token (misalnya kadaluarsa dalam 5 menit)
  const timestamp = parseInt(token.split('_').pop() || '0');
  const now = Date.now();
  if (now - timestamp > 5 * 60 * 1000) {
    return res.status(400).json({ message: 'Verifikasi Puzzle kadaluarsa. Silakan geser ulang.' });
  }

  next();
};

app.post('/api/auth/login', verifyCaptcha, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  const row = rows[0];
  if (!row) return res.status(401).json({ message: 'Email atau password salah.' });
  const valid = await comparePassword(password, row.password);
  if (!valid) return res.status(401).json({ message: 'Email atau password salah.' });
  const token = signToken(row.id, row.role);
  res.json({ token, user: mapUser(row) });
}));

app.post('/api/auth/register', verifyCaptcha, asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Nama, email, dan password wajib diisi.' });
  if (password.length < 6) return res.status(400).json({ message: 'Password minimal 6 karakter.' });
  try {
    const hashed = await hashPassword(password);
    await pool.execute(
      'INSERT INTO users (name, email, password, role, currency) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, 'user', 'IDR'],
    );
    res.status(201).json({ success: true, message: 'Akun berhasil dibuat. Silakan login.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email sudah terdaftar.' });
    throw err;
  }
}));

app.get('/api/auth/me', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) return res.status(401).json({ message: 'User not found.' });
    res.json({ user });
  } catch {
    return res.status(401).json({ message: 'Token invalid.' });
  }
}));

app.post('/api/auth/google', asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Authorization code is required.' });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const origin = req.headers.origin || (process.env.APP_URL ? process.env.APP_URL.split(',')[0] : 'http://localhost:3000');
  const redirectUri = `${origin}/auth/callback/google`;

  // 1. Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    console.error('Google token error:', tokenData);
    return res.status(400).json({ message: 'Failed to exchange authorization code.', details: tokenData });
  }

  // 2. Fetch user info
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const userData = await userResponse.json();
  if (!userResponse.ok) {
    return res.status(400).json({ message: 'Failed to fetch user info from Google.', details: userData });
  }

  const { email, name } = userData;
  if (!email) return res.status(400).json({ message: 'Google account has no email.' });

  // 3. Check if user exists in DB
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  let row = rows[0];

  if (!row) {
    try {
      // Register the user
      // Generate a random secure password for oauth users since they don't use it
      const randomPassword = randomBytes(24).toString('base64url');
      const hashedPw = await hashPassword(randomPassword);
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, role, currency) VALUES (?, ?, ?, ?, ?)',
        [name || email.split('@')[0], email, hashedPw, 'user', 'IDR'],
      );
      row = await getUserById(result.insertId);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        const [retryRows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        row = retryRows[0];
      } else {
        throw err;
      }
    }
  }

  const mapped = mapUser(row);
  const token = signToken(mapped.uid, mapped.role);
  res.json({ token, user: mapped });
}));

app.post('/api/auth/github', asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Authorization code is required.' });

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ message: 'GitHub OAuth is not configured on the server.' });
  }

  const origin = req.headers.origin || (process.env.APP_URL ? process.env.APP_URL.split(',')[0] : 'http://localhost:3000');
  const redirectUri = `${origin}/auth/callback/github`;

  // 1. Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || tokenData.error) {
    console.error('GitHub token error:', tokenData);
    return res.status(400).json({ message: 'Failed to exchange authorization code.', details: tokenData });
  }

  // 2. Fetch user profile
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/json'
    },
  });

  const userData = await userResponse.json();
  if (!userResponse.ok) {
    return res.status(400).json({ message: 'Failed to fetch user info from GitHub.', details: userData });
  }

  let email = userData.email;
  const name = userData.name || userData.login;

  // 3. GitHub users might have their email private, fetch emails explicitly
  if (!email) {
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json'
      },
    });
    const emailData = await emailResponse.json();
    const primaryEmail = emailData.find((e) => e.primary && e.verified);
    if (primaryEmail) email = primaryEmail.email;
  }

  if (!email) return res.status(400).json({ message: 'GitHub account has no verified email.' });

  // 4. Check if user exists in DB
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  let row = rows[0];

  if (!row) {
    try {
      const randomPassword = randomBytes(24).toString('base64url');
      const hashedPw = await hashPassword(randomPassword);
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, role, currency) VALUES (?, ?, ?, ?, ?)',
        [name || email.split('@')[0], email, hashedPw, 'user', 'IDR'],
      );
      row = await getUserById(result.insertId);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        const [retryRows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        row = retryRows[0];
      } else {
        throw err;
      }
    }
  }

  const mapped = mapUser(row);
  const token = signToken(mapped.uid, mapped.role);
  res.json({ token, user: mapped });
}));

app.post('/api/auth/reset-password', verifyCaptcha, asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email wajib diisi.' });
  const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (!rows[0]) return res.status(404).json({ message: 'Tidak ada akun dengan email ini.' });

  // Generate 6-digit OTP
  const code = randomInt(100000, 1000000).toString();
  resetCodes.set(email, { code, expires: Date.now() + 5 * 60 * 1000 }); // Valid for 5 mins

  try {
    // Fetch SMTP settings from DB
    const [settingsRows] = await pool.execute('SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ("smtp_host", "smtp_port", "smtp_user", "smtp_pass", "sender_email")');
    const settings = {};
    settingsRows.forEach(r => settings[r.setting_key] = r.setting_value);

    const smtpHost = settings.smtp_host || 'smtp.gmail.com';
    const smtpPort = settings.smtp_port ? Number(settings.smtp_port) : 465;
    const smtpUser = settings.smtp_user || process.env.SMTP_USER;
    const smtpPass = settings.smtp_pass || process.env.SMTP_PASS;
    const senderEmail = settings.sender_email || smtpUser;

    if (!smtpUser || !smtpPass) {
      console.warn('⚠️ SMTP credentials not fully configured! Email simulasi dicetak di console:', code);
    } else {
      const dynamicTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await dynamicTransporter.sendMail({
        from: `"Monevra Security" <${senderEmail}>`,
        to: email,
        subject: 'Kode Verifikasi Reset Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
            <h2 style="color: #3b82f6; text-align: center;">Reset Password Monevra</h2>
            <p>Halo,</p>
            <p>Kami menerima permintaan untuk mereset kata sandi akun Monevra Anda.</p>
            <p>Berikut adalah kode verifikasi OTP Anda (berlaku selama 5 menit):</p>
            <div style="background-color: #1e293b; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <strong style="font-size: 24px; letter-spacing: 5px; color: #60a5fa;">${code}</strong>
            </div>
            <p>Jika Anda tidak pernah meminta reset password, abaikan email ini dan akun Anda akan tetap aman.</p>
            <hr style="border-color: #334155; margin: 30px 0;">
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">© 2026 Monevra. All rights reserved.</p>
          </div>
        `,
        text: `Halo,\n\nKami menerima permintaan untuk mereset kata sandi akun Monevra Anda.\n\nBerikut adalah kode verifikasi OTP Anda (berlaku selama 5 menit):\n${code}\n\nJika Anda tidak pernah meminta reset password, abaikan email ini dan akun Anda akan tetap aman.\n\n© 2026 Monevra. All rights reserved.`,
      });
    }

    res.json({ message: 'Kode OTP telah dikirim ke email Anda.' });
  } catch (err) {
    console.error('Gagal mengirim email:', err);
    res.status(500).json({ message: 'Gagal mengirim email OTP. Silakan coba lagi. Pastikan konfigurasi SMTP benar.' });
  }
}));

app.post('/api/auth/verify-reset-code', asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const record = resetCodes.get(email);

  if (!record) return res.status(400).json({ message: 'Tidak ada permintaan reset aktif.' });
  if (Date.now() > record.expires) {
    resetCodes.delete(email);
    return res.status(400).json({ message: 'Kode OTP telah kedaluwarsa.' });
  }
  if (record.code !== code) {
    return res.status(400).json({ message: 'Kode OTP salah.' });
  }

  res.json({ ok: true });
}));

app.post('/api/auth/reset-password-confirm', asyncHandler(async (req, res) => {
  const { email, newPassword, code } = req.body;
  if (!email || !newPassword || !code) return res.status(400).json({ message: 'Email, password baru, dan kode wajib diisi.' });

  // Final verification before DB update (security check)
  const record = resetCodes.get(email);
  if (!record || record.code !== code || Date.now() > record.expires) {
    return res.status(400).json({ message: 'Sesi reset password tidak valid atau kedaluwarsa.' });
  }

  if (newPassword.length < 6) return res.status(400).json({ message: 'Password minimal 6 karakter.' });

  const hashed = await hashPassword(newPassword);
  const [result] = await pool.execute('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
  if (result.affectedRows === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });

  // Clear the used OTP
  resetCodes.delete(email);

  res.json({ ok: true, message: 'Password berhasil direset.' });
}));

// --- User Finance ---
app.get('/api/users/:userId/finance', asyncHandler(async (req, res) => {
  const data = await getFinance(req.params.userId);
  if (!data) return res.status(404).json({ message: 'User tidak ditemukan.' });
  res.json(data);
}));

app.put('/api/users/:userId/profile', asyncHandler(async (req, res) => {
  const { name, email, currency, language, phone, avatar, twoFactorEnabled, notifEmail, notifPush, gemini_api_key } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Nama dan email wajib diisi.' });
  await pool.query(
    'UPDATE users SET name = ?, email = ?, currency = ?, language = ?, phone = ?, avatar = ?, two_factor_enabled = ?, notif_email = ?, notif_push = ?, gemini_api_key = ? WHERE id = ?',
    [name, email, currency || 'IDR', language || 'id', phone || null, avatar || null, twoFactorEnabled ? 1 : 0, notifEmail ?? 1, notifPush ?? 0, gemini_api_key || null, req.params.userId]
  );
  res.json({ ok: true });
}));

app.delete('/api/users/:userId', asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Konfirmasi kata sandi diperlukan untuk menghapus akun.' });

  const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.params.userId]);
  if (!rows[0]) return res.status(404).json({ message: 'User tidak ditemukan.' });

  const valid = await comparePassword(password, rows[0].password);
  if (!valid) return res.status(401).json({ message: 'Sandi salah.' });

  await pool.execute('DELETE FROM users WHERE id = ?', [req.params.userId]);
  res.json({ ok: true });
}));

app.put('/api/users/:userId/password', asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Sandi lama dan baru wajib diisi.' });

  const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.params.userId]);
  if (!rows[0]) return res.status(404).json({ message: 'User tidak ditemukan.' });
  const valid = await comparePassword(oldPassword, rows[0].password);
  if (!valid) {
    return res.status(401).json({ message: 'Sandi lama salah.' });
  }

  const hashed = await hashPassword(newPassword);
  await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.params.userId]);
  res.json({ ok: true });
}));

// --- Transactions ---
app.post('/api/users/:userId/transactions', asyncHandler(async (req, res) => {
  const tx = req.body;
  if (!tx.title || tx.amount === undefined || tx.amount === null || !tx.wallet || !tx.date || !tx.type) {
    return res.status(400).json({ message: 'Data transaksi tidak lengkap.' });
  }
  const [walletRows] = await pool.execute('SELECT id FROM wallets WHERE user_id = ? AND name = ? LIMIT 1', [req.params.userId, tx.wallet]);
  const walletId = walletRows[0]?.id || null;
  const [result] = await pool.execute(
    'INSERT INTO transactions (user_id, wallet_id, title, category, amount, wallet_name, transaction_date, status, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.params.userId, walletId, tx.title, tx.category || 'Other', tx.amount, tx.wallet, tx.date, tx.status || 'Completed', tx.type],
  );
  // Update wallet balance immediately
  const status = tx.status || 'Completed';
  if (walletId && status === 'Completed') {
    const delta = tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount);
    await pool.execute('UPDATE wallets SET balance = balance + ? WHERE id = ? AND user_id = ?', [delta, walletId, req.params.userId]);
  }
  res.status(201).json({ id: String(result.insertId) });
}));

app.put('/api/users/:userId/transactions/:id', asyncHandler(async (req, res) => {
  const tx = req.body;
  // Fetch old transaction to revert its balance effect
  const [oldRows] = await pool.execute('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.params.userId]);
  const oldTx = oldRows[0];
  const [walletRows] = await pool.execute('SELECT id FROM wallets WHERE user_id = ? AND name = ? LIMIT 1', [req.params.userId, tx.wallet]);
  const walletId = walletRows[0]?.id || null;
  await pool.execute(
    'UPDATE transactions SET wallet_id = ?, title = ?, category = ?, amount = ?, wallet_name = ?, transaction_date = ?, status = ?, type = ? WHERE id = ? AND user_id = ?',
    [walletId, tx.title, tx.category || 'Other', tx.amount, tx.wallet, tx.date, tx.status || 'Completed', tx.type, req.params.id, req.params.userId],
  );
  // Revert old balance
  if (oldTx && oldTx.wallet_id && oldTx.status === 'Completed') {
    const oldDelta = oldTx.type === 'income' ? Number(oldTx.amount) : -Number(oldTx.amount);
    await pool.execute('UPDATE wallets SET balance = balance - ? WHERE id = ? AND user_id = ?', [oldDelta, oldTx.wallet_id, req.params.userId]);
  }
  // Apply new balance
  const newStatus = tx.status || 'Completed';
  if (walletId && newStatus === 'Completed') {
    const newDelta = tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount);
    await pool.execute('UPDATE wallets SET balance = balance + ? WHERE id = ? AND user_id = ?', [newDelta, walletId, req.params.userId]);
  }
  res.json({ ok: true });
}));

app.delete('/api/users/:userId/transactions', asyncHandler(async (req, res) => {
  const [txs] = await pool.execute('SELECT * FROM transactions WHERE user_id = ?', [req.params.userId]);
  for (const tx of txs) {
    if (tx.status === 'Completed' && tx.wallet_name) {
      const delta = tx.type === 'income' ? tx.amount : -Number(tx.amount);
      await pool.execute('UPDATE wallets SET balance = balance - ? WHERE user_id = ? AND name = ?', [delta, req.params.userId, tx.wallet_name]);
    }
  }
  await pool.execute('DELETE FROM transactions WHERE user_id = ?', [req.params.userId]);
  res.json({ ok: true, message: 'Semua transaksi berhasil dihapus.' });
}));

app.delete('/api/users/:userId/transactions/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.params.userId]);
  const tx = rows[0];
  if (tx && tx.wallet_id && tx.status === 'Completed') {
    const delta = tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount);
    await pool.execute('UPDATE wallets SET balance = balance - ? WHERE id = ? AND user_id = ?', [delta, tx.wallet_id, req.params.userId]);
  }
  await pool.execute('DELETE FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.params.userId]);
  res.json({ ok: true });
}));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

app.post('/api/users/:userId/scan-receipt', upload.single('receipt'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada file gambar yang diunggah.' });
  }

  try {
    const [userRows] = await pool.execute('SELECT gemini_api_key FROM users WHERE id = ?', [req.params.userId]);
    const userApiKey = userRows[0]?.gemini_api_key;
    const globalApiKey = process.env.GEMINI_API_KEY;

    if (!globalApiKey && !userApiKey) {
      return res.status(500).json({ message: 'API Key Gemini belum dikonfigurasi.' });
    }

    const prompt = `
Anda adalah AI OCR Akuntansi tingkat lanjut. Tugas Anda adalah mengekstrak data dari struk belanja ini ke dalam format JSON yang valid.
Pastikan:
1. "title" merepresentasikan nama toko (jika tidak ada gunakan "Unknown Merchant").
2. "items" berisi daftar barang yang dibeli dengan "title", "quantity" (angka bulat), "amount" (angka bulat harga total barang), dan "category".
3. PENTING: Jika terdapat potongan harga, diskon, atau promo di struk, masukkan sebagai item tersendiri di dalam "items" dengan "title" (misal: "Diskon/Promo"), "quantity" 1, dan "amount" bernilai NEGATIF. JANGAN mengurangi harga asli barang dengan diskon tersebut!
4. JANGAN memasukkan barang yang harganya menjadi 0 (gratis) ke dalam "items". Abaikan saja barang tersebut.
5. Kategori yang didukung HANYA: Food, Shopping, Transport, Education, Health, Utilities, Entertainment, Other. Pilihlah dengan cerdas.
6. Jangan halusinasi. Ekstrak HANYA teks yang relevan.
7. "amount" pada root JSON adalah grand total struk (termasuk semua diskon & pajak).
8. "date" diformat YYYY-MM-DD.

Berikan respons HANYA berupa JSON murni tanpa markdown \`\`\`json.
Schema JSON:
{
  "title": "string",
  "date": "string",
  "amount": number,
  "category": "string",
  "items": [
    {
      "title": "string",
      "quantity": number,
      "amount": number,
      "category": "string"
    }
  ],
  "type": "expense"
}`;

    const runGemini = async (apiKey) => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: req.file.buffer.toString('base64'),
            mimeType: req.file.mimetype
          }
        }
      ]);
      return result.response.text();
    };

    let responseText = '';
    try {
      if (!globalApiKey) throw new Error('Global API Key missing');
      responseText = await runGemini(globalApiKey);
    } catch (globalErr) {
      const msg = globalErr.message || '';
      const isQuotaOrAuthError = msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests') || msg.includes('API_KEY_INVALID') || msg.includes('API key not valid') || msg.includes('Global API Key missing');
      
      if (isQuotaOrAuthError && userApiKey) {
        console.log('[OCR] Global key failed, falling back to User API Key');
        try {
          responseText = await runGemini(userApiKey);
        } catch (userErr) {
          throw userErr; // throw user error to outer catch block
        }
      } else if (isQuotaOrAuthError && !userApiKey) {
         if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
           return res.status(429).json({ message: 'QUOTA_EXCEEDED' });
         } else {
           return res.status(401).json({ message: 'INVALID_API_KEY' });
         }
      } else {
         throw globalErr; // throw non-auth/quota errors
      }
    }

    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('[OCR] Gemini JSON Parse Error. Raw response:', responseText);
      throw new Error('Invalid JSON from Gemini');
    }

    console.log('[OCR] Successfully used Gemini AI');
    return res.json(parsedData);
  } catch (error) {
    console.error('[OCR] Gemini service error:', error.message || error);
    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
      return res.status(429).json({ message: 'QUOTA_EXCEEDED' });
    }
    if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
      return res.status(401).json({ message: 'INVALID_API_KEY' });
    }
    return res.status(500).json({ message: 'SCAN_FAILED' });
  }
}));

function getExt(mime) {
  if (!mime) return '.png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
  if (mime.includes('webp')) return '.webp';
  return '.png';
}


// --- Wallets ---
app.post('/api/users/:userId/wallets', asyncHandler(async (req, res) => {
  const wallet = req.body;
  if (!wallet.name || !wallet.type) return res.status(400).json({ message: 'Nama dan tipe dompet wajib diisi.' });
  const [result] = await pool.execute(
    'INSERT INTO wallets (user_id, name, type, account_number, balance) VALUES (?, ?, ?, ?, ?)',
    [req.params.userId, wallet.name, wallet.type, wallet.accountNumber || null, wallet.initialBalance || 0],
  );
  res.status(201).json({ id: String(result.insertId) });
}));

app.put('/api/users/:userId/wallets/:id', asyncHandler(async (req, res) => {
  const wallet = req.body;
  const [oldRows] = await pool.execute('SELECT name FROM wallets WHERE id = ? AND user_id = ?', [req.params.id, req.params.userId]);
  if (!oldRows[0]) return res.status(404).json({ message: 'Dompet tidak ditemukan.' });
  const oldName = oldRows[0].name;

  await pool.execute(
    'UPDATE wallets SET name = COALESCE(?, name), type = COALESCE(?, type), account_number = ?, balance = COALESCE(?, balance) WHERE id = ? AND user_id = ?',
    [wallet.name ?? null, wallet.type ?? null, wallet.accountNumber ?? null, wallet.balance ?? null, req.params.id, req.params.userId],
  );

  if (wallet.name && wallet.name !== oldName) {
    await pool.execute('UPDATE transactions SET wallet_name = ? WHERE wallet_id = ? AND user_id = ?', [wallet.name, req.params.id, req.params.userId]);
  }

  res.json({ ok: true });
}));

app.delete('/api/users/:userId/wallets/:id', asyncHandler(async (req, res) => {
  await pool.execute('DELETE FROM wallets WHERE id = ? AND user_id = ?', [req.params.id, req.params.userId]);
  res.json({ ok: true });
}));

// --- Budgets ---
app.post('/api/users/:userId/budgets', asyncHandler(async (req, res) => {
  const { category, limit } = req.body;
  if (!category || !limit) return res.status(400).json({ message: 'Kategori dan batas wajib diisi.' });

  const [existing] = await pool.execute('SELECT id FROM budgets WHERE user_id = ? AND category = ? LIMIT 1', [req.params.userId, category]);
  if (existing.length > 0) return res.status(400).json({ message: 'Anggaran untuk kategori ini sudah ada.' });

  const [result] = await pool.execute(
    'INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?)',
    [req.params.userId, category, limit],
  );
  res.status(201).json({ id: String(result.insertId) });
}));

app.put('/api/users/:userId/budgets/:id', asyncHandler(async (req, res) => {
  const { category, limit } = req.body;
  await pool.execute('UPDATE budgets SET category = ?, limit_amount = ? WHERE id = ? AND user_id = ?', [category, limit, req.params.id, req.params.userId]);
  res.json({ ok: true });
}));

app.delete('/api/users/:userId/budgets/:id', asyncHandler(async (req, res) => {
  await pool.execute('DELETE FROM budgets WHERE id = ? AND user_id = ?', [req.params.id, req.params.userId]);
  res.json({ ok: true });
}));

// --- Goals ---
app.post('/api/users/:userId/goals', asyncHandler(async (req, res) => {
  const { name, targetAmount, deadline } = req.body;
  if (!name || !targetAmount || !deadline) return res.status(400).json({ message: 'Nama, target, dan deadline wajib diisi.' });
  const [result] = await pool.execute(
    'INSERT INTO goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)',
    [req.params.userId, name, targetAmount, 0, deadline],
  );
  res.status(201).json({ id: String(result.insertId) });
}));

app.put('/api/users/:userId/goals/:id', asyncHandler(async (req, res) => {
  const { name, targetAmount, currentAmount, deadline } = req.body;
  await pool.execute(
    'UPDATE goals SET name = ?, target_amount = ?, current_amount = ?, deadline = ? WHERE id = ? AND user_id = ?',
    [name, targetAmount, currentAmount, deadline, req.params.id, req.params.userId]
  );
  res.json({ ok: true });
}));

app.delete('/api/users/:userId/goals/:id', asyncHandler(async (req, res) => {
  await pool.execute('DELETE FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.params.userId]);
  res.json({ ok: true });
}));

// --- Notifications ---
app.get('/api/users/:userId/notifications', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [req.params.userId]
  );
  res.json(rows);
}));

app.put('/api/users/:userId/notifications/:id/read', asyncHandler(async (req, res) => {
  await pool.execute(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [req.params.id, req.params.userId]
  );
  res.json({ success: true });
}));

app.post('/api/admin/notifications', asyncHandler(async (req, res) => {
  const { userId, title, message, type } = req.body;
  if (!title || !message) return res.status(400).json({ message: 'Title and message are required.' });

  if (userId === 'all') {
    const [users] = await pool.execute('SELECT id FROM users');
    for (const u of users) {
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [u.id, title, message, type || 'info']
      );
    }
  } else {
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, title, message, type || 'info']
    );
  }
  res.json({ success: true });
}));

// --- Admin ---
app.get('/api/admin/users', asyncHandler(async (_req, res) => {
  const [rows] = await pool.execute(`
    SELECT
      u.*,
      COALESCE(tx.tx_count, 0) AS tx_count,
      COALESCE(w.wallet_count, 0) AS wallet_count,
      COALESCE(w.total_balance, 0) AS total_balance,
      COALESCE(b.budget_count, 0) AS budget_count
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS tx_count
      FROM transactions
      GROUP BY user_id
    ) tx ON tx.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS wallet_count, SUM(balance) AS total_balance
      FROM wallets
      GROUP BY user_id
    ) w ON w.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS budget_count
      FROM budgets
      GROUP BY user_id
    ) b ON b.user_id = u.id
    ORDER BY u.created_at DESC
  `);
  res.json(rows.map(row => ({
    id: String(row.id),
    email: row.email,
    name: row.name,
    role: row.role,
    currency: row.currency || 'IDR',
    createdAt: row.created_at,
    txCount: Number(row.tx_count || 0),
    walletCount: Number(row.wallet_count || 0),
    budgetCount: Number(row.budget_count || 0),
    totalBalance: Number(row.total_balance || 0),
  })));
}));

app.get('/api/admin/users/:userId/detail', asyncHandler(async (req, res) => {
  const data = await getFinance(req.params.userId);
  if (!data) return res.status(404).json({ message: 'User tidak ditemukan.' });
  res.json(data);
}));

app.put('/api/admin/users/:userId', asyncHandler(async (req, res) => {
  const { name, email, role, currency } = req.body;
  if (!name || !email || !role) return res.status(400).json({ message: 'Nama, email, dan role wajib diisi.' });
  await pool.execute('UPDATE users SET name = ?, email = ?, role = ?, currency = ? WHERE id = ?', [name, email, role, currency || 'IDR', req.params.userId]);
  res.json({ ok: true });
}));

app.delete('/api/admin/users/:userId', asyncHandler(async (req, res) => {
  await pool.execute('DELETE FROM users WHERE id = ?', [req.params.userId]);
  res.json({ ok: true });
}));

app.delete('/api/admin/users/:userId/:kind/:itemId', asyncHandler(async (req, res) => {
  const tables = { transactions: 'transactions', wallets: 'wallets', budgets: 'budgets', goals: 'goals' };
  const table = tables[req.params.kind];
  if (!table) return res.status(400).json({ message: 'Jenis data tidak valid.' });
  await pool.execute(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [req.params.itemId, req.params.userId]);
  res.json({ ok: true });
}));

// Admin: Create sub-documents for any user
app.post('/api/admin/users/:userId/transactions', asyncHandler(async (req, res) => {
  const tx = req.body;
  if (!tx.title || tx.amount === undefined || tx.amount === null || !tx.wallet || !tx.date || !tx.type) {
    return res.status(400).json({ message: 'Data transaksi tidak lengkap.' });
  }
  const [walletRows] = await pool.execute('SELECT id FROM wallets WHERE user_id = ? AND name = ? LIMIT 1', [req.params.userId, tx.wallet]);
  const walletId = walletRows[0]?.id || null;
  const [result] = await pool.execute(
    'INSERT INTO transactions (user_id, wallet_id, title, category, amount, wallet_name, transaction_date, status, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.params.userId, walletId, tx.title, tx.category || 'Other', tx.amount, tx.wallet, tx.date, tx.status || 'Completed', tx.type],
  );
  res.status(201).json({ id: String(result.insertId) });
}));

app.put('/api/admin/users/:userId/transactions/:id', asyncHandler(async (req, res) => {
  const tx = req.body;
  const [walletRows] = await pool.execute('SELECT id FROM wallets WHERE user_id = ? AND name = ? LIMIT 1', [req.params.userId, tx.wallet]);
  const walletId = walletRows[0]?.id || null;
  await pool.execute(
    'UPDATE transactions SET wallet_id = ?, title = ?, category = ?, amount = ?, wallet_name = ?, transaction_date = ?, status = ?, type = ? WHERE id = ? AND user_id = ?',
    [walletId, tx.title, tx.category || 'Other', tx.amount, tx.wallet, tx.date, tx.status || 'Completed', tx.type, req.params.id, req.params.userId],
  );
  res.json({ ok: true });
}));

app.post('/api/admin/users/:userId/wallets', asyncHandler(async (req, res) => {
  const wallet = req.body;
  if (!wallet.name || !wallet.type) return res.status(400).json({ message: 'Nama dan tipe dompet wajib diisi.' });
  const [result] = await pool.execute(
    'INSERT INTO wallets (user_id, name, type, account_number, balance) VALUES (?, ?, ?, ?, ?)',
    [req.params.userId, wallet.name, wallet.type, wallet.accountNumber || null, wallet.balance || 0],
  );
  res.status(201).json({ id: String(result.insertId) });
}));

app.put('/api/admin/users/:userId/wallets/:id', asyncHandler(async (req, res) => {
  const wallet = req.body;
  const [oldRows] = await pool.execute('SELECT name FROM wallets WHERE id = ? AND user_id = ?', [req.params.id, req.params.userId]);
  if (!oldRows[0]) return res.status(404).json({ message: 'Dompet tidak ditemukan.' });
  const oldName = oldRows[0].name;

  await pool.execute(
    'UPDATE wallets SET name = COALESCE(?, name), type = COALESCE(?, type), account_number = ?, balance = COALESCE(?, balance) WHERE id = ? AND user_id = ?',
    [wallet.name ?? null, wallet.type ?? null, wallet.accountNumber ?? null, wallet.balance ?? null, req.params.id, req.params.userId],
  );

  if (wallet.name && wallet.name !== oldName) {
    await pool.execute('UPDATE transactions SET wallet_name = ? WHERE wallet_id = ? AND user_id = ?', [wallet.name, req.params.id, req.params.userId]);
  }

  res.json({ ok: true });
}));

app.post('/api/admin/users/:userId/budgets', asyncHandler(async (req, res) => {
  const { category, limit } = req.body;
  if (!category || !limit) return res.status(400).json({ message: 'Kategori dan batas wajib diisi.' });

  const [existing] = await pool.execute('SELECT id FROM budgets WHERE user_id = ? AND category = ? LIMIT 1', [req.params.userId, category]);
  if (existing.length > 0) return res.status(400).json({ message: 'Anggaran untuk kategori ini sudah ada.' });

  const [result] = await pool.execute(
    'INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?)',
    [req.params.userId, category, limit],
  );
  res.status(201).json({ id: String(result.insertId) });
}));

app.put('/api/admin/users/:userId/budgets/:id', asyncHandler(async (req, res) => {
  const { category, limit } = req.body;
  await pool.execute('UPDATE budgets SET category = ?, limit_amount = ? WHERE id = ? AND user_id = ?', [category, limit, req.params.id, req.params.userId]);
  res.json({ ok: true });
}));

// --- System Analytics ---
app.get('/api/admin/analytics', asyncHandler(async (_req, res) => {
  const [[txStats]] = await pool.execute('SELECT COUNT(*) as total_tx, SUM(amount) as volume FROM transactions WHERE type="income"');
  const [[walletStats]] = await pool.execute('SELECT COUNT(*) as total_wallets, SUM(balance) as total_balance FROM wallets');
  const [[userStats]] = await pool.execute('SELECT COUNT(*) as total_users FROM users');

  res.json({
    totalUsers: Number(userStats.total_users || 0),
    totalWallets: Number(walletStats.total_wallets || 0),
    totalTransactions: Number(txStats.total_tx || 0),
    totalVolume: Number(txStats.volume || 0),
    totalBalance: Number(walletStats.total_balance || 0),
  });
}));

// --- Security Logs ---
app.get('/api/admin/logs', asyncHandler(async (_req, res) => {
  const [rows] = await pool.execute('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 50');
  res.json(rows.map(row => ({
    id: String(row.id),
    action: row.action,
    userEmail: row.user_email,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  })));
}));

app.post('/api/admin/logs', asyncHandler(async (req, res) => {
  const { action, userEmail, ipAddress } = req.body;
  await pool.execute('INSERT INTO security_logs (action, user_email, ip_address) VALUES (?, ?, ?)', [action, userEmail || null, ipAddress || null]);
  res.status(201).json({ ok: true });
}));

app.delete('/api/admin/logs', asyncHandler(async (_req, res) => {
  await pool.execute('DELETE FROM security_logs');
  res.json({ ok: true });
}));

// --- System Settings ---
app.get('/api/admin/settings', asyncHandler(async (_req, res) => {
  const [rows] = await pool.execute('SELECT setting_key, setting_value FROM system_settings');
  const settings = {};
  rows.forEach(r => settings[r.setting_key] = r.setting_value);
  res.json(settings);
}));

app.put('/api/admin/settings', asyncHandler(async (req, res) => {
  const settings = req.body;
  for (const [key, value] of Object.entries(settings)) {
    await pool.execute(
      'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [key, String(value), String(value)]
    );
  }
  res.json({ ok: true });
}));

// --- Master Data (Categories) ---
app.get('/api/admin/categories', asyncHandler(async (_req, res) => {
  const [rows] = await pool.execute('SELECT * FROM master_categories');
  res.json(rows.map(r => ({ id: r.id, name: r.name, type: r.type, color: r.color })));
}));

app.post('/api/admin/categories', asyncHandler(async (req, res) => {
  const { id, name, type, color } = req.body;
  await pool.execute('INSERT INTO master_categories (id, name, type, color) VALUES (?, ?, ?, ?)', [id, name, type, color]);
  res.status(201).json({ ok: true });
}));

app.put('/api/admin/categories/:id', asyncHandler(async (req, res) => {
  const { name, type, color } = req.body;
  await pool.execute('UPDATE master_categories SET name = ?, type = ?, color = ? WHERE id = ?', [name, type, color, req.params.id]);
  res.json({ ok: true });
}));

app.delete('/api/admin/categories/:id', asyncHandler(async (req, res) => {
  await pool.execute('DELETE FROM master_categories WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

// --- Master Data (Exchange Rates) ---
app.get('/api/admin/rates', asyncHandler(async (_req, res) => {
  const [rows] = await pool.execute('SELECT * FROM exchange_rates');
  res.json(rows.map(r => ({ code: r.code, rate: Number(r.rate) })));
}));

app.post('/api/admin/rates', asyncHandler(async (req, res) => {
  const { code, rate } = req.body;
  await pool.execute('INSERT INTO exchange_rates (code, rate) VALUES (?, ?)', [code, rate]);
  res.status(201).json({ ok: true });
}));

app.put('/api/admin/rates/:code', asyncHandler(async (req, res) => {
  const { rate } = req.body;
  await pool.execute('UPDATE exchange_rates SET rate = ? WHERE code = ?', [rate, req.params.code]);
  res.json({ ok: true });
}));

app.delete('/api/admin/rates/:code', asyncHandler(async (req, res) => {
  await pool.execute('DELETE FROM exchange_rates WHERE code = ?', [req.params.code]);
  res.json({ ok: true });
}));

app.get('/api/admin/backup', asyncHandler((req, res) => {
  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = process.env.DB_PORT || 3306;
  const dbUser = process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'monevra';

  const args = ['-h', dbHost, '-P', String(dbPort), '-u', dbUser];
  if (dbPass) args.push(`-p${dbPass}`);
  args.push(dbName);

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  res.setHeader('Content-Disposition', `attachment; filename="monevra_backup_${dateStr}.sql"`);
  res.setHeader('Content-Type', 'application/sql');

  const dump = spawn('mysqldump', args);

  dump.stdout.pipe(res);

  dump.stderr.on('data', (data) => {
    console.error(`mysqldump error: ${data}`);
  });

  dump.on('error', (error) => {
    console.error('mysqldump process error', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Proses backup gagal dimulai.' });
    }
  });
}));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Monevra Error]', err.message || err);
  if (res.headersSent) return;
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    message: isProd ? 'Terjadi kesalahan server. Silakan coba lagi.' : (err.message || 'Terjadi kesalahan server.'),
  });
});

// --- Serve React Frontend ---
// This serves the built React app from the frontend/dist folder
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback for React Router (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Monevra API & Frontend running on port ${port}`);
});
