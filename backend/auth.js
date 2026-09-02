import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET || 'dev_secret_change_in_production';
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
