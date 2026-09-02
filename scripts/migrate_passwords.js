import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'monevra',
  waitForConnections: true,
  connectionLimit: 10,
});

async function migratePasswords() {
  console.log('Memulai migrasi password...');
  try {
    const [users] = await pool.execute('SELECT id, password FROM users');
    
    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2b$, $2a$, or $2y$ and are 60 chars long)
      if (user.password.startsWith('$2') && user.password.length === 60) {
        skippedCount++;
        continue;
      }

      console.log(`Hashing password untuk user ID: ${user.id}...`);
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
      migratedCount++;
    }

    console.log('\nMigrasi Selesai!');
    console.log(`- Berhasil dimigrasi: ${migratedCount}`);
    console.log(`- Dilewati (sudah di-hash): ${skippedCount}`);
    
  } catch (error) {
    console.error('Error saat migrasi:', error);
  } finally {
    await pool.end();
  }
}

migratePasswords();
