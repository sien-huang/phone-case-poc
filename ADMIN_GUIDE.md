# CloudWing Admin - 管理后台完整功能指南

## 📱 访问地址

- **前台首页**: http://localhost:3000
- **产品列表**: http://localhost:3000/products
- **后台管理**: http://localhost:3000/admin
- **分类页**: http://localhost:3000/categories

---

## 🔧 后台管理功能

### 1. 产品列表

**入口**: `/admin`

**功能**:
- ✅ 查看所有产品（128个）
- ✅ 搜索（名称/SKU/分类）
- ✅ 筛选（分类/状态）
- ✅ 列选择（单选/全选）
- ✅ 批量操作（激活/归档/删除）
- ✅ 单个产品编辑
- ✅ 查看统计数据（浏览量/销量）
- ✅ 缩略图预览

**字段说明**:
| 字段 | 说明 |
|------|------|
| ID | 产品唯一标识 |
| Name | 产品名称（点击查看详情） |
| Category | 分类标签 |
| Price Range | 价格区间 |
| Status | 状态：Active/Draft/Archived |
| Stats | 浏览量👁️ + 销量🛒 |
| Updated | 最后更新时间 |

---

### 2. 产品编辑器

**打开方式**: 点击 "+ Add Product" 或表格中的 "Edit"

**字段列表**:

**基本信息**
- Name *（必填）
- Slug *（URL 友好，自动生成）
- Category *（从现有分类选择）
- MOQ *（最小起订量）
- Price Range *（价格区间）
- Lead Time（生产周期）
- Material（材质）
- Finish（表面处理）
- Thickness（厚度）
- Patent（专利信息）

**描述信息**
- Short Description *（简短描述）
- Full Description（详细介绍）
- Compatible Models（兼容型号，每行一个）
- Key Features（关键特性，每行一个）
- Image URLs（图片链接，每行一个）

**状态**
- Status（Active/Draft/Archived）

---

### 3. 批量操作

**步骤**:
1. 勾选需要操作的产品（支持全选）
2. 选择操作类型：
   - **Activate** → 上架产品
   - **Archive** → 归档产品
   - **Delete** → 软删除（标记为不活跃）
3. 确认执行

**注意**：批量操作是实时生效的，不可撤销。

---

### 4. 数据导入/导出

#### 导出数据
1. 点击 "📥 Export" 按钮
2. 自动下载 JSON 文件
3. 文件名格式: `products-export-YYYY-MM-DD.json`

#### 导入数据
1. 点击 "📤 Import" 按钮
2. 选择 JSON 文件（格式见下方）
3. 确认合并（不会删除现有数据）
4. 自动去重（基于 id 或 slug）

**JSON 格式示例**:
```json
{
  "products": [
    {
      "id": "iphone15-classic",
      "name": "iPhone 15 Classic",
      "slug": "iphone15-classic",
      "category": "iPhone 15 Series",
      "description": "Clean, minimalist protection...",
      "moq": 500,
      "priceRange": "$1.80 - $2.50 per piece",
      "leadTime": "7-10 business days",
      "material": "TPU",
      "compatibility": ["iPhone 15", "iPhone 15 Plus"],
      "features": ["Slim profile", "Wireless charging"],
      "images": [],
      "status": "active",
      "viewCount": 123,
      "salesCount": 456
    }
  ]
}
```

---

## 📊 API 接口文档

### 产品管理

#### 获取所有产品
```
GET /api/admin/products
Response: Product[]
```

#### 创建产品
```
POST /api/admin/products
Body: Product (without id, created_at, updated_at)
Response: { success: true, product: Product }
```

#### 更新产品
```
PUT /api/admin/products
Body: { id: string, ...updates }
Response: { success: true, product: Product }
```

#### 批量操作
```
POST /api/admin/products/batch
Body: {
  action: 'activate' | 'archive' | 'delete',
  productIds: string[]
}
Response: { success: true, updated: number }
```

#### 导入/导出
```
GET  /api/admin/products/import   // 导出全部
POST /api/admin/products/import   // 导入合并
Body: { products: Product[], replace?: boolean }
```

---

### 分类管理

#### 获取分类统计
```
GET /api/admin/categories
Response: {
  id: string,
  name: string,
  product_count: number,
  is_active?: number,
  order?: number
}[]
```

---

### 数据统计

#### 获取统计信息
```
GET /api/admin/stats
Response: {
  overview: {
    totalProducts: number,
    activeProducts: number,
    totalViews: number,
    totalSales: number,
    avgViewsPerProduct: number,
    avgSalesPerProduct: number
  },
  categories: Array<{
    name: string,
    count: number,
    views: number,
    sales: number
  }>,
  hotProducts: Array<{
    id, name, category, score, viewCount, salesCount
  }>,
  recentUpdates: Array<{
    id, name, updated_at
  }>
}
```

---

### 产品浏览

#### 热门产品
```
GET /api/products/hot
Response: Product[] (Top 10, 按 score 排序)
算法: score = salesCount * 0.6 + viewCount * 0.4
```

#### 所有产品（前台）
```
GET /api/products
Response: Product[]
```

---

### 点击跟踪

#### 记录浏览量
```
POST /api/track/view
Body: { productId: string }
Response: { success: true, viewCount: number }
```

**自动调用**：产品详情页会自动触发，无需手动调用。

---

### 文件上传

#### 上传图片
```
POST /api/admin/upload
FormData:
  file: File
  type: 'product' | 'general' | 'attachment'

Response: {
  success: true,
  url: string,      // 可访问的 URL
  filename: string,
  size: number,
  type: string
}
```

**限制**:
- 最大 10MB
- 支持格式: JPG, PNG, WebP, PDF
- 自动返回可访问的 URL

---

## 🎯 热门算法说明

### 评分公式
```
score = salesCount * 0.6 + viewCount * 0.4
```

**权重说明**:
- 销量占 60% → 更看重转化
- 浏览量占 40% → 考虑曝光度

### 数据更新
- 每次访问详情页自动 +1 浏览量
- 销量需要业务系统调用 `/api/track/sale`（待实现）
- 数据实时持久化到 `products.json`

---

## 📱 移动端体验

### 响应式导航
- **桌面端**: 顶部水平菜单
- **移动端**: 汉堡菜单 + 抽屉导航

### 触摸优化
- 按钮尺寸 ≥ 44×44px
- 卡片间距 16px
- 横向滚动隐藏滚动条（保持可用性）

---

## 🗄️ 数据存储

### 当前方案
- **文件**: `data/products.json`
- **格式**: JSON 数组
- **更新**: 直接写入文件（适用于 < 1000 条记录）

### 生产环境建议
1. **数据库**: PostgreSQL + Prisma
2. **缓存**: Redis（热门数据）
3. **搜索**: Meilisearch / Elasticsearch
4. **文件存储**: AWS S3 / 阿里云 OSS
5. **CDN**: Cloudflare / 腾讯云 CDN

---

## 🚀 快速开始

### 1. 启动开发服务器
```bash
cd phone-case-poc
npm run dev
```

### 2. 初始化数据
```bash
# 数据已包含在 data/products.json（128 产品）
# 自动添加了 viewCount, salesCount, status 字段
```

### 3. 访问后台
```
http://localhost:3000/admin
```

### 4. 测试功能
- 搜索 "iPhone" → 查看筛选效果
- 勾选产品 → 测试批量操作
- 点击 "Edit" → 打开编辑器
- 修改字段 → 保存并查看更新
- 点击 "Export" → 下载数据备份

---

## ⚠️ 注意事项

### 文件写入权限
- 确保 `data/` 目录可写
- 批量操作、导入、保存都会写文件

### 数据备份
- 定期执行 Export 备份
- 生产环境务必使用数据库

### 性能提示
- 当前数据量（128）无压力
- 超过 1000 条建议分页 + 虚拟滚动
- 图片使用 CDN 加速

---

## 📞 联系支持

- **问题反馈**: GitHub Issues
- **文档**: `/COMPLETION_REPORT.md`
- **API 测试**: Postman 集合（待整理）

---

*最后更新: 2026-03-26 09:20 GMT+8*
*版本: v2.1 - 功能完整版*