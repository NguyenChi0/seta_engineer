const mysql = require('mysql2/promise')

// Cau hinh MySQL – xem / sua truc tiep o day
const config = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'Chi23324',
  database: 'seta_engineer',
  waitForConnections: true,
  connectionLimit: 10
}

const pool = mysql.createPool(config)

module.exports = pool
