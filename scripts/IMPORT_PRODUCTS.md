# Product Import Guide

## ✅ 准备工作

### 1. 准备数据文件

支持 **JSON** 或 **CSV** 格式。

#### CSV 模板
打开 `data/products-import-template.csv`，按以下字段填写：

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | No (auto-gen) | Unique identifier (lowercase, hyphens) |
| name | string | Yes | Product display name |
| slug | string | No (auto-gen) | URL-friendly name |
| category | string | Yes | Must match existing category name |
| description | string | Yes | Short description |
| fullDescription | string | No | Long description (if empty uses description) |
| compatibility | JSON array | No | Compatible phone models |
| material | string | No | TPU, Leather, PC, etc. |
| finish | string | No | Surface finish |
| thickness | string | No | e.g., "1.2mm" |
| moq | number | No (default 500) | Minimum order quantity |
| leadTime | string | No (default "7-10 business days") | Production time |
| priceRange | string | Yes | Price range per piece |
| patent | string | No | Patent info |
| features | JSON array | No | Key features list |
| is_active | 0/1 | No (default 1) | Product visibility |

#### JSON 格式
```json
[
  {
    "id": "iphone15-classic",
    "name": "iPhone 15 Classic Case",
    "category": "iPhone 15 Series",
    "description": "Clean design...",
    "compatibility": ["iPhone 15", "iPhone 15 Pro"],
    "moq": 500,
    "priceRange": "$1.80 - $2.50",
    "features": ["Slim", "Wireless charging"],
    "is_active": 1
  }
]
```

### 2. 图片准备

将产品图片上传到：
```
public/uploads/products/
```

文件名使用 product ID 或清晰命名：
```
iphone15-classic-1.jpg
iphone15-classic-2.jpg
iphone15-pro-premium-main.png
```

在数据文件中，images 字段填写相对路径数组：
```json
"images": [
  "/uploads/products/iphone15-classic-1.jpg",
  "/uploads/products/iphone15-classic-2.jpg"
]
```

---

## 🚀 导入步骤

### 1. 检查分类存在

先确认 `categories.json` 中有你要用的分类：
```bash
curl http://localhost:3000/api/admin/categories | jq
```

如果没有，先到 `/admin/categories` 创建。

### 2. 运行导入脚本

```bash
# JSON 导入
node scripts/import-products.js data/my-products.json

# CSV 导入
node scripts/import-products.js data/my-products.csv
```

### 3. 验证导入结果

```bash
# 查看数据库中的产品
cat data/products.json | jq length

# 通过 API 查看
curl http://localhost:3000/api/products | jq length
```

### 4. 刷新缓存

Next.js 默认每 60 秒重新验证数据。如需立即看到变化，重启 dev server。

---

## 🔄 更新现有产品

如果导入的数据 `id` 或 `slug` 与现有产品相同，脚本会自动跳过，避免覆盖。

**更新现有产品的正确方式**：
1. 手动在 Admin 后台编辑 (`/admin/products`)
2. 或编写专门的更新脚本

---

## ⚠️ 注意事项

1. **分类名称必须完全匹配**（大小写敏感）
2. **图片路径必须是相对路径**（以 `/` 开头）
3. **ID 必须唯一**，建议使用 kebab-case（如 `iphone15-classic`）
4. **批量导入前先测试**：导入 1-2 个产品确认无误后再批量操作
5. **备份**：导入前建议备份 `data/products.json`

---

## 📊 批量导入示例

```bash
# 1. 准备数据文件: data/new-products.json
# 2. 运行导入
node scripts/import-products.js data/new-products.json

# 3. 查看结果
curl http://localhost:3000/api/products | jq '.[] | {id, name, category}'
```

---

## 🎯 常见问题

**Q: 导入后产品不显示？**
A: 检查 `is_active` 字段是否为 1，分类是否存在。

**Q: 图片无法显示？**
A: 确保图片已上传到 `public/uploads/products/`，路径填写正确。

**Q: 如何批量更新产品价格？**
A: 使用脚本导入时保持相同 `id`，但修改 `priceRange`（需自定义更新逻辑，当前脚本仅支持新增）。

**Q: 如何删除产品？**
A: 在 Admin 后台操作，或修改 `is_active: 0` 后导入。

---

## 💡 提示

- 使用 **Excel/Google Sheets** 编辑 CSV，然后导出
- 用 `jq` 工具检查 JSON 格式：`cat file.json | jq .`
- 复杂批量操作可联系我编写定制脚本

---

**祝导入顺利！** 🚀
