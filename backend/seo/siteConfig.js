const path = require('path')

const SITE_URL = String(process.env.SITE_URL || 'https://www.seta-eng.co.jp').replace(/\/$/, '')
const SITE_NAME = 'SETA株式会社'
const DEFAULT_DESCRIPTION = '株式会社Seta Engineering 公式サイト'
const DEFAULT_OG_IMAGE = '/assets/pre_logo.jpg'

const FRONTEND_DIST = path.resolve(__dirname, '../../app/dist')
const FRONTEND_PUBLIC = path.resolve(__dirname, '../../app/public')

module.exports = {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  FRONTEND_DIST,
  FRONTEND_PUBLIC
}
