import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'dev_secret_change_in_production' || secret.length < 32) {
    // Production WAJIB punya JWT_SECRET kuat — fallback hanya untuk dev lokal.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET wajib di-set (min 32 karakter) di lingkungan production.');
    }
    console.warn('[WARN] JWT_SECRET tidak di-set — pakai secret dev. JANGAN untuk production!');
    return 'dev_secret_change_in_production';
  }
  return secret;
};
const SALT_ROUNDS = 12;

export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);
export const comparePassword = (plain, hashed) => bcrypt.compare(plain, hashed);
export const signToken = (userId, role) => jwt.sign({ userId: String(userId), role }, getJwtSecret(), { expiresIn: '7d' });

export function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token autentikasi diperlukan.' });
  try {
    req.user = jwt.verify(token, getJwtSecret());
    next();
  } catch {
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Akses khusus administrator.' });
  next();
}
