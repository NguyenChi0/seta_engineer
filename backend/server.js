const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true })
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const multer = require('multer')
const jwt = require('jsonwebtoken')
const db = require('./db')
const { hashPassword, verifyPassword } = require('./password')
const { syncPostImagesFromHtml } = require('./postImagesSync')

const app = express()
const port = Number(process.env.PORT) || 4001

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

const postImagesDir = path.join(__dirname, 'postImages')
const postTitleImagesDir = path.join(__dirname, 'postTitleImages')
for (const d of [postImagesDir, postTitleImagesDir]) {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true })
  }
}
app.use('/api/uploads/post-images', express.static(postImagesDir))
app.use('/api/uploads/post-title-images', express.static(postTitleImagesDir))

const UPLOAD_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const UPLOAD_MAX = 5 * 1024 * 1024

function uploadExtFromMime(mime) {
  if (mime === 'image/jpeg') {
    return '.jpg'
  }
  if (mime === 'image/png') {
    return '.png'
  }
  if (mime === 'image/webp') {
    return '.webp'
  }
  if (mime === 'image/gif') {
    return '.gif'
  }
  return ''
}

function makeUploadStorage(destDir) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destDir),
    filename: (_req, file, cb) => {
      const ext =
        path.extname(file.originalname || '').toLowerCase() || uploadExtFromMime(file.mimetype) || '.bin'
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`)
    }
  })
}

const uploadPostImageMw = multer({
  storage: makeUploadStorage(postImagesDir),
  limits: { fileSize: UPLOAD_MAX },
  fileFilter: (_req, file, cb) => {
    if (UPLOAD_MIMES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Chi chap nhan anh JPEG, PNG, WebP, GIF'))
    }
  }
}).single('file')

const uploadTitleImageMw = multer({
  storage: makeUploadStorage(postTitleImagesDir),
  limits: { fileSize: UPLOAD_MAX },
  fileFilter: (_req, file, cb) => {
    if (UPLOAD_MIMES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Chi chap nhan anh JPEG, PNG, WebP, GIF'))
    }
  }
}).single('file')

function sendDatabaseErrorResponse(res, e) {
  console.error('[db]', e.code || e.message, e)
  if (e.code === 'ECONNREFUSED') {
    return res.status(503).json({ message: 'Khong ket noi duoc MySQL. Hay khoi dong MySQL.' })
  }
  if (e.code === 'ER_ACCESS_DENIED_ERROR') {
    return res
      .status(503)
      .json({ message: 'Sai dang nhap MySQL. Kiem tra user, password trong db.js' })
  }
  if (e.code === 'ER_BAD_DB_ERROR') {
    return res.status(503).json({ message: 'Database khong ton tai. Kiem tra database trong db.js' })
  }
  if (e.code === 'PROTOCOL_CONNECTION_LOST' || e.code === 'ETIMEDOUT' || e.code === 'ENOTFOUND') {
    return res.status(503).json({ message: 'MySQL khong phan hoi. Kiem tra host, port.' })
  }
  const isDev = process.env.NODE_ENV !== 'production'
  return res.status(500).json({
    message: isDev && e.message ? e.message : 'Loi server',
    code: e.code || 'UNKNOWN'
  })
}

function getBearerToken(req) {
  const h = req.headers.authorization
  if (!h || !h.startsWith('Bearer ')) {
    return null
  }
  return h.slice(7).trim()
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req)
  if (!token) {
    return res.status(401).json({ message: 'Thieu token' })
  }
  const secret = process.env.JWT_SECRET
  if (!secret) {
    return res.status(500).json({ message: 'Cau hinh server thieu JWT_SECRET' })
  }
  let payload
  try {
    payload = jwt.verify(token, secret)
  } catch {
    return res.status(401).json({ message: 'Token khong hop le' })
  }
  if (payload.sub == null) {
    return res.status(401).json({ message: 'Token khong hop le' })
  }
  try {
    const [rows] = await db.query('SELECT id, name, username, status FROM users WHERE id = ?', [payload.sub])
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Nguoi dung khong ton tai' })
    }
    const user = rows[0]
    if (Number(user.status) !== 1) {
      return res.status(401).json({ message: 'Tai khoan da bi khoa' })
    }
    req.user = { id: user.id, name: user.name, username: user.username }
    next()
  } catch (e) {
    return sendDatabaseErrorResponse(res, e)
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend' })
})

app.get('/api/health/db', async (_req, res) => {
  try {
    await db.query('SELECT 1 AS ok')
    res.json({ ok: true, database: 'seta_engineer' })
  } catch (e) {
    return sendDatabaseErrorResponse(res, e)
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ message: 'Nhap username va password' })
  }
  const secret = process.env.JWT_SECRET
  if (!secret) {
    return res.status(500).json({ message: 'Cau hinh server thieu JWT_SECRET' })
  }
  try {
    const [rows] = await db.query(
      'SELECT id, name, username, password, status FROM users WHERE username = ?',
      [String(username).trim()]
    )
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Sai thong tin dang nhap' })
    }
    const user = rows[0]
    if (Number(user.status) !== 1) {
      return res.status(403).json({ message: 'Tai khoan da bi khoa' })
    }
    const passOk = await verifyPassword(password, user.password)
    if (!passOk) {
      return res.status(401).json({ message: 'Sai thong tin dang nhap' })
    }
    const token = jwt.sign(
      { sub: Number(user.id), username: String(user.username) },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
    res.json({
      token,
      user: { id: user.id, name: user.name, username: user.username }
    })
  } catch (e) {
    return sendDatabaseErrorResponse(res, e)
  }
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

app.get('/api/posts', async (req, res) => {
  const q = String(req.query.q || '').trim()
  const limitRaw = Number.parseInt(String(req.query.limit || ''), 10)
  const offsetRaw = Number.parseInt(String(req.query.offset || ''), 10)
  const limit = Number.isInteger(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : null
  const offset = Number.isInteger(offsetRaw) ? Math.max(offsetRaw, 0) : 0
  try {
    if (q) {
      const like = `%${q}%`
      const [countRows] = await db.query('SELECT COUNT(*) AS total FROM posts WHERE status = 1 AND title LIKE ?', [like])
      const total = countRows[0].total
      const sql =
        'SELECT id, title, tags, excerpt, title_image, created_at FROM posts WHERE status = 1 AND title LIKE ? ORDER BY id DESC' +
        (limit != null ? ' LIMIT ? OFFSET ?' : '')
      const params = limit != null ? [like, limit, offset] : [like]
      const [rows] = await db.query(sql, params)
      return res.json({ total, posts: rows.map(toPostListDto) })
    }
    const [countRows] = await db.query('SELECT COUNT(*) AS total FROM posts WHERE status = 1')
    const total = countRows[0].total
    const sql =
      'SELECT id, title, tags, excerpt, title_image, created_at FROM posts WHERE status = 1 ORDER BY id DESC' +
      (limit != null ? ' LIMIT ? OFFSET ?' : '')
    const params = limit != null ? [limit, offset] : []
    const [rows] = await db.query(sql, params)
    return res.json({ total, posts: rows.map(toPostListDto) })
  } catch (e) {
    return sendDatabaseErrorResponse(res, e)
  }
})

app.get('/api/posts/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'ID khong hop le' })
  }
  try {
    const [rows] = await db.query(
      'SELECT id, title, content, tags, excerpt, title_image, created_at FROM posts WHERE id = ? AND status = 1',
      [id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Bai viet khong ton tai' })
    }
    const row = rows[0]
    return res.json({
      post: {
        id: row.id,
        title: row.title,
        content: row.content || '',
        tags: row.tags || '',
        excerpt: row.excerpt || '',
        titleImage: row.title_image || null,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null
      }
    })
  } catch (e) {
    return sendDatabaseErrorResponse(res, e)
  }
})

function toUserDto(row) {
  const created = row.created_at
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    status: Number(row.status),
    createdAt: created ? new Date(created).toISOString() : null
  }
}

app.get('/api/admin/users', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim()
  // Mac dinh: chi tai khoan dang hoat dong (1). status=0: da khoa
  const statusFilter = String(req.query.status) === '0' ? 0 : 1
  try {
    if (q) {
      const like = `%${q}%`
      const [countRows] = await db.query(
        'SELECT COUNT(*) AS total FROM users WHERE status = ? AND (username LIKE ? OR name LIKE ? OR email LIKE ?)',
        [statusFilter, like, like, like]
      )
      const total = countRows[0].total
      const [rows] = await db.query(
        'SELECT id, name, username, email, status, created_at FROM users WHERE status = ? AND (username LIKE ? OR name LIKE ? OR email LIKE ?) ORDER BY id DESC',
        [statusFilter, like, like, like]
      )
      return res.json({ total, users: rows.map(toUserDto) })
    }
    const [countRows] = await db.query('SELECT COUNT(*) AS total FROM users WHERE status = ?', [statusFilter])
    const total = countRows[0].total
    const [rows] = await db.query(
      'SELECT id, name, username, email, status, created_at FROM users WHERE status = ? ORDER BY id DESC',
      [statusFilter]
    )
    res.json({ total, users: rows.map(toUserDto) })
  } catch (e) {
    return sendDatabaseErrorResponse(res, e)
  }
})

app.post('/api/admin/users', requireAuth, async (req, res) => {
  const { name, username, password, email, status } = req.body || {}
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Nhap ho ten' })
  }
  if (!username || !String(username).trim()) {
    return res.status(400).json({ message: 'Nhap username' })
  }
  if (password == null || String(password) === '') {
    return res.status(400).json({ message: 'Nhap mat khau' })
  }
  const st = Number(status) === 0 ? 0 : 1
  const em = email != null && String(email).trim() ? String(email).trim() : null
  const passwordHash = await hashPassword(password)
  try {
    const [ins] = await db.query(
      'INSERT INTO users (name, username, password, email, status) VALUES (?, ?, ?, ?, ?)',
      [String(name).trim(), String(username).trim(), passwordHash, em, st]
    )
    const [rows] = await db.query(
      'SELECT id, name, username, email, status, created_at FROM users WHERE id = ?',
      [ins.insertId]
    )
    return res.status(201).json({ user: toUserDto(rows[0]) })
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username da ton tai' })
    }
    return sendDatabaseErrorResponse(res, e)
  }
})

app.patch('/api/admin/users/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'ID khong hop le' })
  }
  const { name, username, email, status, password } = req.body || {}
  const fields = []
  const vals = []
  if (name !== undefined) {
    if (!String(name).trim()) {
      return res.status(400).json({ message: 'Name khong duoc de trong' })
    }
    fields.push('name = ?')
    vals.push(String(name).trim())
  }
  if (username !== undefined) {
    if (!String(username).trim()) {
      return res.status(400).json({ message: 'Username khong duoc de trong' })
    }
    fields.push('username = ?')
    vals.push(String(username).trim())
  }
  if (email !== undefined) {
    const em = String(email).trim() === '' ? null : String(email).trim()
    fields.push('email = ?')
    vals.push(em)
  }
  if (status !== undefined) {
    fields.push('status = ?')
    vals.push(Number(status) === 0 ? 0 : 1)
  }
  if (password !== undefined && String(password) !== '') {
    fields.push('password = ?')
    vals.push(await hashPassword(String(password)))
  }
  if (fields.length === 0) {
    return res.status(400).json({ message: 'Khong co du lieu cap nhat' })
  }
  vals.push(id)
  try {
    const [r] = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      vals
    )
    if (r.affectedRows === 0) {
      return res.status(404).json({ message: 'User khong ton tai' })
    }
    const [rows] = await db.query(
      'SELECT id, name, username, email, status, created_at FROM users WHERE id = ?',
      [id]
    )
    return res.json({ user: toUserDto(rows[0]) })
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username da ton tai' })
    }
    return sendDatabaseErrorResponse(res, e)
  }
})

app.delete('/api/admin/users/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'ID khong hop le' })
  }
  try {
    const [r] = await db.query('UPDATE users SET status = 0 WHERE id = ?', [id])
    if (r.affectedRows === 0) {
      return res.status(404).json({ message: 'User khong ton tai' })
    }
    return res.json({ ok: true })
  } catch (e) {
    return sendDatabaseErrorResponse(res, e)
  }
})

app.post('/api/admin/uploads/post-image', requireAuth, (req, res) => {
  uploadPostImageMw(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload that bai' })
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Thieu file (field name: file)' })
    }
    return res.json({ url: `/api/uploads/post-images/${req.file.filename}` })
  })
})

app.post('/api/admin/uploads/title-image', requireAuth, (req, res) => {
  uploadTitleImageMw(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload that bai' })
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Thieu file (field name: file)' })
    }
    return res.json({ url: `/api/uploads/post-title-images/${req.file.filename}` })
  })
})

function toPostListDto(row) {
  const created = row.created_at
  return {
    id: row.id,
    title: row.title,
    category: row.tags || '',
    tags: row.tags || '',
    excerpt: row.excerpt || '',
    titleImage: row.title_image || null,
    createdAt: created ? new Date(created).toISOString() : null
  }
}

function toPostDetailDto(row) {
  const created = row.created_at
  return {
    id: row.id,
    title: row.title,
    content: row.content || '',
    tags: row.tags || '',
    excerpt: row.excerpt || '',
    titleImage: row.title_image || null,
    createdAt: created ? new Date(created).toISOString() : null,
    status: row.status != null ? Number(row.status) : 1
  }
}

app.get('/api/admin/posts', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim()
  try {
    if (q) {
      const like = `%${q}%`
      const [countRows] = await db.query('SELECT COUNT(*) AS total FROM posts WHERE title LIKE ?', [like])
      const total = countRows[0].total
      const [rows] = await db.query(
        'SELECT id, title, tags, excerpt, title_image, created_at FROM posts WHERE title LIKE ? ORDER BY id DESC',
        [like]
      )
      return res.json({ total, posts: rows.map(toPostListDto) })
    }
    const [countRows] = await db.query('SELECT COUNT(*) AS total FROM posts')
    const total = countRows[0].total
    const [rows] = await db.query(
      'SELECT id, title, tags, excerpt, title_image, created_at FROM posts ORDER BY id DESC'
    )
    return res.json({ total, posts: rows.map(toPostListDto) })
  } catch (e) {
    return sendDatabaseErrorResponse(res, e)
  }
})

app.get('/api/admin/posts/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'ID khong hop le' })
  }
  try {
    const [rows] = await db.query(
      'SELECT id, title, content, tags, excerpt, title_image, status, created_at FROM posts WHERE id = ?',
      [id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Bai viet khong ton tai' })
    }
    return res.json({ post: toPostDetailDto(rows[0]) })
  } catch (e) {
    return sendDatabaseErrorResponse(res, e)
  }
})

app.post('/api/admin/posts', requireAuth, async (req, res) => {
  const { title, content, tags, excerpt, titleImage } = req.body || {}
  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'Nhap tieu de' })
  }
  if (content == null || !String(content).trim()) {
    return res.status(400).json({ message: 'Nhap noi dung' })
  }
  if (!tags || !String(tags).trim()) {
    return res.status(400).json({ message: 'Nhap danh muc (tags)' })
  }
  if (excerpt == null || !String(excerpt).trim()) {
    return res.status(400).json({ message: 'Nhap mo ta ngan' })
  }
  if (!titleImage || !String(titleImage).trim()) {
    return res.status(400).json({ message: 'Thieu anh tieu de (titleImage)' })
  }
  const ti = String(titleImage).trim()
  if (ti.length > 255) {
    return res.status(400).json({ message: 'Duong dan anh tieu de qua dai' })
  }
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const [ins] = await conn.query(
      'INSERT INTO posts (title, content, status, title_image, tags, excerpt) VALUES (?, ?, 1, ?, ?, ?)',
      [String(title).trim(), String(content), ti, String(tags).trim().slice(0, 100), String(excerpt).trim().slice(0, 500)]
    )
    const postId = ins.insertId
    await syncPostImagesFromHtml(conn, postId, String(content))
    await conn.commit()
    const [rows] = await db.query(
      'SELECT id, title, content, tags, excerpt, title_image, status, created_at FROM posts WHERE id = ?',
      [postId]
    )
    return res.status(201).json({ post: toPostDetailDto(rows[0]) })
  } catch (e) {
    await conn.rollback()
    return sendDatabaseErrorResponse(res, e)
  } finally {
    conn.release()
  }
})

app.patch('/api/admin/posts/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'ID khong hop le' })
  }
  const { title, content, tags, excerpt, titleImage } = req.body || {}
  const fields = []
  const vals = []
  if (title !== undefined) {
    if (!String(title).trim()) {
      return res.status(400).json({ message: 'Tieu de khong duoc de trong' })
    }
    fields.push('title = ?')
    vals.push(String(title).trim())
  }
  if (content !== undefined) {
    fields.push('content = ?')
    vals.push(String(content))
  }
  if (tags !== undefined) {
    fields.push('tags = ?')
    vals.push(String(tags).trim().slice(0, 100))
  }
  if (excerpt !== undefined) {
    fields.push('excerpt = ?')
    vals.push(String(excerpt).trim().slice(0, 500))
  }
  if (titleImage !== undefined) {
    const ti = String(titleImage).trim()
    if (ti.length > 255) {
      return res.status(400).json({ message: 'Duong dan anh tieu de qua dai' })
    }
    fields.push('title_image = ?')
    vals.push(ti || null)
  }
  if (fields.length === 0) {
    return res.status(400).json({ message: 'Khong co du lieu cap nhat' })
  }
  vals.push(id)
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const [r] = await conn.query(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`, vals)
    if (r.affectedRows === 0) {
      await conn.rollback()
      return res.status(404).json({ message: 'Bai viet khong ton tai' })
    }
    if (content !== undefined) {
      await syncPostImagesFromHtml(conn, id, String(content))
    }
    await conn.commit()
    const [rows] = await db.query(
      'SELECT id, title, content, tags, excerpt, title_image, status, created_at FROM posts WHERE id = ?',
      [id]
    )
    return res.json({ post: toPostDetailDto(rows[0]) })
  } catch (e) {
    await conn.rollback()
    return sendDatabaseErrorResponse(res, e)
  } finally {
    conn.release()
  }
})

app.delete('/api/admin/posts/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'ID khong hop le' })
  }
  try {
    const [r] = await db.query('DELETE FROM posts WHERE id = ?', [id])
    if (r.affectedRows === 0) {
      return res.status(404).json({ message: 'Bai viet khong ton tai' })
    }
    return res.json({ ok: true })
  } catch (e) {
    return sendDatabaseErrorResponse(res, e)
  }
})

const httpServer = app.listen(port)

httpServer.on('listening', () => {
  console.log(`Backend server is running on port ${port}`)
  console.log('(Giu cua so terminal nay mo; nhan Ctrl+C de tat server.)')
})

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} da bi chiem (EADDRINUSE).`)
    console.error('Cach 1: Tat process dang dung port (PowerShell, chay o may ban):')
    console.error('  Get-NetTCPConnection -LocalPort ' + port + " | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }")
    console.error('Cach 2: Trong .env dat PORT=4001 (hoac port trong) va chay lai.')
  } else {
    console.error('Loi khi listen:', err.message)
  }
  process.exit(1)
})
