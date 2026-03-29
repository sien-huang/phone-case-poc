/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://yourphonecase.com',
  generateRobotsTxt: true,
  // 排除管理后台等不需要收录的页面
  exclude: ['/admin/*', '/api/*'],
  // 优先级配置
  priority: {
    '/': 1.0,
    '/products': 0.9,
    '/product/[slug]': 0.8,
    '/about': 0.5,
    '/privacy-policy': 0.3,
    '/terms-of-service': 0.3,
  },
  // 变更频率
  changefreq: {
    '/': 'daily',
    '/products': 'daily',
    '/product/[slug]': 'weekly',
    '/about': 'monthly',
    '/privacy-policy': 'monthly',
    '/terms-of-service': 'monthly',
  },
}
