const bcrypt = require('bcrypt')

const DEFAULT_ROUNDS = 10
const rounds = Number(process.env.BCRYPT_SALT_ROUNDS) || DEFAULT_ROUNDS

/**
 * Lưu chuỗi bcrypt. Chuỗi cũ trong DB thường là plain: không bắt đầu bằng $2.
 */
function looksBcrypt(hashed) {
  const s = String(hashed)
  return s.startsWith('$2a$') || s.startsWith('$2b$') || s.startsWith('$2y$')
}

async function hashPassword(plain) {
  return bcrypt.hash(String(plain), rounds)
}

/**
 * Hỗ trợ: bcrypt; legacy plain (cùng chuỗi) cho bản cũ trước khi bật hash.
 */
async function verifyPassword(plain, stored) {
  const s = String(stored)
  if (looksBcrypt(s)) {
    return bcrypt.compare(String(plain), s)
  }
  return String(plain) === s
}

module.exports = { hashPassword, verifyPassword, looksBcrypt, rounds }
