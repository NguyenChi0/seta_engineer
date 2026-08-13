const fs = require('fs')
const path = require('path')
const { FRONTEND_DIST, FRONTEND_PUBLIC } = require('./siteConfig')

const SUBSERVICE_IDS = ['1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3']

const STATIC_PAGES = [
  {
    path: '/',
    contentFile: null,
    title: '株式会社Seta Engineering',
    description: '株式会社Seta Engineering 公式サイト。グローバル採用・人材戦略支援、技術業務アウトソーシング（BIM/CAD/IT）を提供します。',
    bodyHtml:
      '<main><h1>株式会社Seta Engineering</h1><p>人材 × 技術 × 現場力で、日本のものづくり・技術現場を支えるパートナーです。グローバル採用・人材戦略支援と、BIM/CAD/ITアウトソーシングサービスを提供しています。</p></main>'
  },
  {
    path: '/mission',
    contentFile: null,
    title: 'Our Mission',
    description: 'Seta Engineeringのミッション。人と企業の想いを繋ぎ、時代の先端の、その先へ。',
    bodyHtml:
      '<main><h1>Our Mission / 私たちの使命</h1><p>人と企業の想いを繋ぎ、時代のEDGE（先端）の、その先へ。</p></main>'
  },
  {
    path: '/recruitment',
    contentFile: 'service.html',
    title: 'グローバル採用・人材戦略支援事業',
    description: 'グローバル人材の採用支援、採用代行、人材紹介、AIマッチングなど、採用戦略をトータルで支援します。'
  },
  {
    path: '/recruitment/outsourcing',
    contentFile: 'service-outsourcing.html',
    title: '技術業務アウトソーシング',
    description: '建築BIM、機械CAD、IT/Web開発など、技術業務のアウトソーシングサービスを提供します。'
  },
  {
    path: '/recruitment/1-1',
    contentFile: 'service-1-1.html',
    title: 'グローバル採用コンサルティング・採用代行',
    description: '海外人材の採用戦略立案から採用代行まで、グローバル採用を一貫支援します。'
  },
  {
    path: '/recruitment/1-2',
    contentFile: 'service-1-2.html',
    title: 'グローバル人材紹介サービス',
    description: '国内外の優秀な人材をご紹介。企業のニーズに合わせたマッチングを行います。'
  },
  {
    path: '/recruitment/1-3',
    contentFile: 'service-1-3.html',
    title: 'JobShare（ジョブシェア）',
    description: '複数企業で人材を共有活用するJobShareサービス。柔軟な人材活用を実現します。'
  },
  {
    path: '/recruitment/1-4',
    contentFile: 'service-1-4.html',
    title: '採用管理・AIマッチングツール',
    description: '採用プロセスを効率化する管理ツールとAIマッチングで、最適な人材採用を支援します。'
  },
  {
    path: '/recruitment/1-5',
    contentFile: 'service-1-5.html',
    title: '日本語教育・研修サービス',
    description: '外国人材向けの日本語教育・ビジネス研修で、即戦力化をサポートします。'
  },
  {
    path: '/recruitment/outsourcing/2-1',
    contentFile: 'service-2-1.html',
    title: '建築BIM設計アウトソーシング',
    description: '建築・構造・設備BIMのモデリング、干渉チェック、施工図作成を支援します。'
  },
  {
    path: '/recruitment/outsourcing/2-2',
    contentFile: 'service-2-2.html',
    title: '機械設計・CADアウトソーシング',
    description: '製造業向けの機械設計・CAD業務をアウトソーシング。3Dモデリングから図面作成まで対応します。'
  },
  {
    path: '/recruitment/outsourcing/2-3',
    contentFile: 'service-2-3.html',
    title: 'IT・Web開発／保守アウトソーシング',
    description: 'Webシステムの開発・保守・運用を中心としたITアウトソーシングサービスを提供します。'
  },
  {
    path: '/achievements',
    contentFile: 'achievements.html',
    title: '導入事例・実績紹介',
    description: 'Seta Engineeringの導入事例・実績をご紹介します。'
  },
  {
    path: '/company',
    contentFile: 'company.html',
    title: '会社概要',
    description: '株式会社Seta Engineeringの会社概要、所在地、事業内容をご案内します。'
  },
  {
    path: '/setax-ws',
    contentFile: 'setax-ws.html',
    title: '日越連携による新たなビジネスモデル',
    description: 'Seta Engineering × ワークシェアリングによる日越連携の新ビジネスモデルをご紹介します。'
  },
  {
    path: '/contact',
    contentFile: 'contact.html',
    title: 'お問合せ',
    description: 'Seta Engineeringへのお問合せはこちらから。採用支援・技術アウトソーシングのご相談を承ります。'
  },
  {
    path: '/news',
    contentFile: null,
    title: '新着情報',
    description: '株式会社Seta Engineering の新着情報・お知らせ一覧です。',
    bodyHtml: '<main><h1>新着情報</h1><p>株式会社Seta Engineering の最新ニュース・お知らせ一覧です。</p></main>'
  },
  {
    path: '/privacy-policy',
    contentFile: 'privacy-policy.html',
    title: '個人情報保護方針',
    description: '株式会社Seta Engineering の個人情報保護方針です。'
  }
]

function contentFilePath(name) {
  const inDist = path.join(FRONTEND_DIST, 'content', name)
  if (fs.existsSync(inDist)) {
    return inDist
  }
  return path.join(FRONTEND_PUBLIC, 'content', name)
}

function readContentFile(name) {
  try {
    return fs.readFileSync(contentFilePath(name), 'utf8')
  } catch {
    return ''
  }
}

function getStaticPageByPath(urlPath) {
  return STATIC_PAGES.find((p) => p.path === urlPath) || null
}

function getAllStaticSitemapPaths() {
  return STATIC_PAGES.map((p) => p.path)
}

function isValidSubserviceId(id) {
  return SUBSERVICE_IDS.includes(id)
}

module.exports = {
  STATIC_PAGES,
  SUBSERVICE_IDS,
  contentFilePath,
  readContentFile,
  getStaticPageByPath,
  getAllStaticSitemapPaths,
  isValidSubserviceId
}
