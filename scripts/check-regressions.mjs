import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const server = read('backend/server.js');
const backendEnv = read('backend/.env');
const backendEnvExample = read('backend/.env.example');
const sql = read('backend/database/monevra.sql');
const readme = read('README.md');
const migrate = read('scripts/migrate_passwords.js');
const eslintConfig = read('frontend/eslint.config.mjs');
const frontendPackage = JSON.parse(read('frontend/package.json'));

assert(!server.includes('override: true'), 'dotenv must not override shell PORT/DB env');
assert.match(backendEnv, /^PORT=3001$/m, 'backend .env must use API port 3001');
assert.match(backendEnv, /^DB_NAME="?monevra"?$/m, 'backend .env DB_NAME must be monevra');
assert.match(backendEnvExample, /^DB_NAME="?monevra"?$/m, 'backend .env.example DB_NAME must be monevra');
assert.match(sql, /CREATE DATABASE IF NOT EXISTS `monevra`/, 'SQL must create monevra database');
assert.match(sql, /USE `monevra`;/, 'SQL must use monevra database');
assert(!sql.includes('flowfinance'), 'seed data must not reference old FlowFinance brand');
assert(matchLine(readme, 'mysql -u root < backend/database/monevra.sql'), 'README import path must include backend/');
assert.match(migrate, /DB_NAME \|\| 'monevra'/, 'password migration default DB must be monevra');
assert.match(server, /randomInt\(100000, 1000000\)/, 'OTP must use crypto.randomInt');
assert.match(server, /randomBytes\(/, 'OAuth random password must use crypto.randomBytes');
assert.match(server, /escapeHtml/, 'contact email HTML must escape user input');
assert.match(eslintConfig, /typescript-eslint/, 'ESLint must use TypeScript parser/config');
assert.match(frontendPackage.dependencies['react-router-dom'], /^\^?7\.18\.[1-9]/, 'react-router-dom must use audited patched version');

function matchLine(text, line) {
  return text.split(/\r?\n/).some((x) => x.trim() === line);
}

console.log('regression checks passed');
