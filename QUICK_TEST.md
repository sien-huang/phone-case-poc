# 🧪 Quick Test Checklist - CloudWing POC

**测试时间**: 晚上任意时间  
**服务器**: http://localhost:3000 (已启动 ✅)

---

## 🎯 前台功能测试 (5分钟)

### 1. 首页展示
- [ ] 访问 http://localhost:3000/
- [ ] 看到 Apple 风格极简设计
- [ ] "Latest Products" 横向滚动显示产品
- [ ] "Hot Picks" 显示 4 个大卡片
- [ ] 分类网格显示 20 个分类
- [ ] 所有图片显示为占位图（picsum.photos）

### 2. 产品列表页
- [ ] 访问 http://localhost:3000/products
- [ ] 显示所有产品（128 个）
- [ ] 搜索框输入 "iPhone" → 只显示匹配产品
- [ ] 点击分类筛选 → 正确过滤
- [ ] 切换 Grid/List 视图（图标按钮）
- [ ] 分页工作正常（每页 12 个）

### 3. 产品详情页
- [ ] 点击任意产品进入详情页
- [ ] URL 格式: `/product/{slug}`
- [ ] 图片轮播可用（左右箭头点击）
- [ ] 点击缩略图切换主图
- [ ] 显示完整描述、规格、兼容型号
- [ ] 刷新页面 → 浏览量 +1

### 4. 询盘表单
- [ ] 访问 http://localhost:3000/quote
- [ ] 表单字段完整（公司、类型、市场、数量、产品选择）
- [ ] 提交表单后显示成功消息
- [ ] 检查 `data/inquiries.json` 有新记录
- [ ] （已配置 SMTP）检查收到邮件通知

### 5. 移动端响应式
- [ ] 打开 Chrome DevTools (F12)
- [ ] 切换到手机视图（iPhone 尺寸）
- [ ] 汉堡菜单正常工作
- [ ] 图片轮播支持触摸滑动（如果有真实设备）
- [ ] 表单字段易于点击

---

## 🔐 后台管理测试 (10分钟)

### 1. 登录
- [ ] 访问 http://localhost:3000/admin
- [ ] 自动重定向到 `/admin/login`
- [ ] 输入密码: `CloudWing2025!`
- [ ] 成功登录，显示仪表盘

### 2. 仪表盘 (/admin/dashboard)
- [ ] 关键指标卡片显示正确：
  - 产品总数: 128
  - 活跃产品数: 128
  - 总浏览量: 非零值
  - 总销量: 非零值
- [ ] Hot Products Top 10 列表正常
- [ ] 分类统计显示 20 个分类
- [ ] 最近更新显示 5 个产品

### 3. 产品管理 (/admin/products)
- [ ] 表格显示所有 128 个产品
- [ ] 搜索功能正常（输入产品名/分类）
- [ ] 筛选下拉（分类 + 状态）工作
- [ ] 勾选产品 → 批量操作按钮可用
- [ ] 点击 "Add Product" → 打开编辑器
- [ ] 编辑器所有字段可编辑
- [ ] 保存后产品列表立即刷新
- [ ] 状态切换（Active/Draft/Archived）即时生效

### 4. 批量操作
- [ ] 勾选 2-3 个产品
- [ ] 点击 "Activate" → 状态变为 Active
- [ ] 点击 "Archive" → 状态变为 Archived
- [ ] 点击 "Delete" → 产品标记为不活跃

### 5. 数据导入/导出
- [ ] 点击 "Export" → 下载 JSON 文件
- [ ] 打开下载的 JSON，验证格式正确
- [ ] 点击 "Import" → 选择文件上传
- [ ] 导入后新增产品出现在列表

### 6. 分类管理 (/admin/categories)
- [ ] 访问 `/admin/categories`（如果菜单存在）
- [ ] 显示 20 个分类及其产品数
- [ ] 尝试创建新分类（可选）

### 7. 分析报表 (/admin/analytics) - 如果存在
- [ ] 6 个图表正常渲染
- [ ] 切换时间范围（7d/30d/90d）图表更新
- [ ] Top Sellers 和 Most Viewed 列表显示

### 8. 管理员登出
- [ ] 点击登出按钮
- [ ] 重定向到登录页
- [ ] 尝试访问 `/admin` → 再次重定向到登录

---

## 🔌 API 端点测试 (使用 curl 或 Postman)

```bash
# 1. 获取所有产品
curl http://localhost:3000/api/products | jq '.products | length'

# 2. 获取热门产品
curl http://localhost:3000/api/products/hot | jq 'length'

# 3. 跟踪浏览量
curl -X POST http://localhost:3000/api/track/view \
  -H "Content-Type: application/json" \
  -d '{"productId": "iphone15-classic"}'

# 4. 跟踪销量
curl -X POST http://localhost:3000/api/track/sale \
  -H "Content-Type: application/json" \
  -d '{"productId": "iphone15-classic", "quantity": 1}'

# 5. 提交询盘
curl -X POST http://localhost:3000/api/quote \
  -F "companyName=Test Corp" \
  -F "businessType=distributor" \
  -F "targetMarket=china" \
  -F "quantity=1000-5000" \
  -F "products=[\"iphone15-classic\", \"samsung-s24-ultra\"]"

# 6. 管理员登录
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password": "CloudWing2025!"}'
# 响应应包含 Set-Cookie 头

# 7. 获取统计数据（需先登录，携带 Cookie）
curl -b "admin-auth=true" http://localhost:3000/api/admin/stats | jq '.overview'
```

---

## 🐛 已知问题 & 修复建议

### 问题 1: 端口冲突
如果看到 "Port 3000 already in use"：
```bash
# 清理进程
pkill -f "next dev"
# 或使用其他端口
PORT=3001 npm run dev
```

### 问题 2: Prisma 连接错误
如果看到数据库错误，这是正常的（未配置 DATABASE_URL）。应用会自动回退到文件存储。忽略即可。

### 问题 3: 图片不显示
当前使用占位图服务。如需真实图片：
1. 参考 `IMAGES_PREP.md`
2. 将图片放入 `public/products/`
3. 更新 `products.json` 或数据库中的 `images` 数组

---

## ✨ 新增强功能测试 (2026-03-28)

### A. UI 增强
- [ ] **滚动进度条** - 页面滚动时顶部出现蓝色进度条
- [ ] **Back to Top 按钮** - 滚动到底部后右下角出现圆形按钮，悬停显示滚动百分比
- [ ] **404 页面** - 访问不存在的 URL（如 /not-exist）显示美观的 404 页面，有 "Return Home" 按钮
- [ ] **相关产品推荐** - 在产品详情页底部显示相同分类的其他产品（4个卡片）

### B. SEO 增强
- [ ] **Sitemap** - 访问 http://localhost:3000/sitemap.xml 返回 XML 格式的站点地图
- [ ] **Robots.txt** - 访问 http://localhost:3000/robots.txt 返回配置正确
- [ ] **Meta 标签** - 查看首页源码，确认有 `<title>` 和 `<meta name="description">`

### C. 性能优化
- [ ] **Next.js Image 组件** - 产品卡片图片使用 `<Image>`（查看元素，src 应为自动优化）
- [ ] **图片懒加载** - 滚动列表时，图片是否延迟加载
- [ ] **字体预加载** - 检查 `<head>` 是否有 `preconnect` 字体链接

---

## ✅ 全部通过标准

- [ ] 首页加载无错误（检查浏览器 Console）
- [ ] 所有页面路由正常（404 为 0）
- [ ] 产品 CRUD 操作成功（创建/编辑/删除）
- [ ] 数据持久化（刷新后数据不变）
- [ ] 询盘表单提交成功 + 邮件送达（如配置 SMTP）
- [ ] 统计数字准确（产品数 128，分类数 20）
- [ ] 热门算法正确排序（按销量60%+浏览40%）
- [ ] 新增功能无报错（控制台无红色错误）

---

## 📊 性能基准（期望值）

| 操作 | 目标时间 | 检查方法 |
|------|----------|----------|
| 首页加载 | < 2s | Chrome DevTools Network |
| 产品列表渲染 | < 200ms | 查看页面响应速度 |
| 搜索响应 | 即时 | 输入后立即可见 |
| 详情页切换 | < 500ms | 轮播图片加载时间 |
| API 响应 | < 100ms | curl 时间测量 |

---

## 📞 需要我做什么？

如果你测试中遇到任何问题：
1. 截图或复制错误信息
2. 记录复现步骤
3. 在群聊中告诉我，我会立即修复

---

**祝测试顺利！** 🚀

当前状态：✅ 服务器运行中 (http://localhost:3000)  
配置：文件存储模式（无需数据库）  
数据：128 个产品 + 20 个分类  
端口：3000  
密码：CloudWing2025!
