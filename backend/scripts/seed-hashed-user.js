/**
 * Tạo thêm 1 user có mật khẩu lưu dạng bcrypt (cùng thuật toán với server).
 * Chạy: cd backend && npm run seed:user
 * Mật khẩu mặc định: Seta@2026 (đổi bằng biến SEED_USER_PASSWORD)
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true })
const db = require('../db')
const { hashPassword } = require('../password')

const SEED = {
  name: 'Nguoi dung demo (hash)',
  username: 'hashed_user',
  email: 'hashed@seta.local',
  get password() {
    return process.env.SEED_USER_PASSWORD || 'Seta@2026'
  }
}

async function main() {
  const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [SEED.username])
  if (existing.length > 0) {
    console.log(`Da ton tai user "${SEED.username}" (id=${existing[0].id}). Bo qua seed.`)
    process.exit(0)
  }
  const passwordHash = await hashPassword(SEED.password)
  const [ins] = await db.query(
    'INSERT INTO users (name, username, password, email, status) VALUES (?, ?, ?, ?, 1)',
    [SEED.name, SEED.username, passwordHash, SEED.email]
  )
  console.log(`Da tao user id=${ins.insertId} username=${SEED.username}`)
  console.log('Mat khau dang nhap (plain, khong phai gia tri hash trong DB):', SEED.password)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
