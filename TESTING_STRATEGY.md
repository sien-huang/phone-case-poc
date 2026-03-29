# 完整测试策略文档

_版本: 1.0 | 日期: 2025-03-29 | 状态: Production Ready_

---

## 📋 目录

1. [测试策略概述](#测试策略概述)
2. [测试金字塔](#测试金字塔)
3. [测试框架配置](#测试框架配置)
4. [质量门禁](#质量门禁)
5. [CI/CD 集成](#cicd-集成)
6. [测试数据管理](#测试数据管理)
7. [覆盖率要求](#覆盖率要求)
8. [运行测试](#运行测试)
9. [故障排除](#故障排除)

---

## 测试策略概述

本项目的测试策略基于 **AI-Native 质量保障体系**，采用多层防御机制确保代码质量和交付可靠性。

### 核心原则

- ✅ **自动化优先**: 所有质量检查必须自动化
- ✅ **快速反馈**: 提交前进行检查，CI/CD 流水线快速失败
- ✅ **分层测试**: 单元 → 集成 → E2E，按比例分配
- ✅ **覆盖率阈值**: 核心模块 ≥ 80%，工具函数 ≥ 90%
- ✅ **AI 预审查**: 代码提交前必须通过静态分析

### 测试分布 (测试金字塔)

```
       E2E Tests (10%)
          ▲
          │
  Integration Tests (20%)
          │
          ▼
    Unit Tests (70%) ←─ 最大比例
```

**理由**:
- **70% 单元测试**: 快速、隔离、覆盖业务逻辑
- **20% 集成测试**: API 路由、数据库交互、服务通信
- **10% E2E 测试**: 关键用户路径（注册 → 搜索 → 购买）

---

## 测试框架配置

### 1. 单元测试 (Jest + React Testing Library)

**框架**:
- Jest 29.x (测试运行器)
- @testing-library/react (React 组件测试)
- @testing-library/jest-dom (自定义匹配器)
- jest-environment-jsdom (浏览器环境模拟)

**配置文件**: `jest.config.js`
```javascript
module.exports = {
  testDir: './__tests__',
  testMatch: ['**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 }
  }
}
```

**测试文件位置**:
```
__tests__/
├── unit/
│   ├── components/          # React 组件测试
│   │   ├── LanguageSwitcher.test.tsx
│   │   └── BackToTop.test.tsx
│   ├── contexts/            # Context 测试
│   │   ├── LocaleContext.test.tsx
│   │   └── CurrencyContext.test.tsx
│   ├── lib/                 # 工具库测试
│   │   ├── api.test.ts
│   │   └── email.test.ts
│   └── utils/               # 工具函数测试
│       └── format.test.ts
└── integration/             # 集成测试 (待创建)
```

### 2. E2E 测试 (Playwright)

**框架**:
- @playwright/test 1.58.x
- Chromium (Desktop), 可扩展 Mobile

**配置文件**: `playwright.config.ts`
```typescript
export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
})
```

**测试文件位置**:
```
tests/
├── homepage.spec.ts          # 主页布局测试
├── language-switch.spec.ts   # 语言切换
├── admin.spec.ts             # 管理员功能
├── quick-check.spec.ts       # 快速检查
├── hydration.spec.ts         # 水合问题检测
└── e2e-flow.spec.ts          # 关键用户旅程
```

### 3. 静态分析

**工具栈**:
- **ESLint**: Next.js 默认配置 + 自定义规则
- **TypeScript**: `tsc --noEmit` (类型检查)
- **Prettier** (可选): 代码格式化

---

## 质量门禁

### 提交前检查 (Pre-commit Hook)

使用 **Husky** + **lint-staged** (配置见 `.husky/pre-commit`):

```bash
# 自动运行:
1. TypeScript 类型检查 → tsc --noEmit
2. ESLint → next lint
3. 单元测试快速检查 → jest --watchAll=false
4. Prettier (如启用) → prettier --check .
```

**任何一项失败 → 阻止提交**

### PR 检查 (GitHub Actions)

CI 流水线包含以下作业:

```yaml
jobs:
  code-quality:       # ESLint + TypeScript
  unit-tests:         # Jest (覆盖率 ≥ 80%)
  e2e-tests:          # Playwright (多浏览器)
  build-check:        # 构建验证
  security:           # npm audit (moderate+)
  performance:        # Lighthouse CI (性能基线)
  status:             # 最终状态汇总
```

**质量门禁阈值**:

| 指标 | 阈值 | 阻断级别 |
|------|------|----------|
| TypeScript 错误 | 0 | 阻断 |
| ESLint 错误 | 0 | 阻断 |
| 单元测试覆盖率 | ≥ 80% | 阻断 < 80% |
| E2E 测试通过率 | 100% | 阻断 |
| 构建成功 | 必须 | 阻断 |
| 已知安全漏洞 | 0 (moderate+) | 警告 (建议修复) |
| Lighthouse 性能 | ≥ 80 | 建议 (不阻断) |

### 质量分数计算

```javascript
质量分数 =
  (类型安全 × 0.20) +
  (代码规范 × 0.20) +
  (单元测试覆盖 × 0.25) +
  (E2E 通过率 × 0.20) +
  (性能评分 × 0.15)

达标要求: ≥ 85 分
```

---

## CI/CD 集成

### GitHub Actions 工作流

1. **Pull Request 触发**:
   - 任何 PR 到 `main` 或 `develop` 自动运行 CI
   - 所有检查通过 → 允许合并
   - 任何失败 → 要求修复

2. **Push 触发** (自动部署模式):
   - 推送到 `main` → 完整 CI + 部署
   - 推送到 `develop` → 完整 CI + 预览部署

3. **Scheduled** (可选):
   - 每晚运行完整测试套件 (检测回归)
   - 性能基准对比

### 快速失败策略

```
PR 检查顺序:
  code-quality → unit-tests → e2e-tests → build-check → security
       ↓              ↓             ↓            ↓           ↓
    阻断           阻断          阻断         阻断        建议
```

任何一个"阻断"检查失败，后续检查仍会运行但整体状态标记为失败。

---

## 测试数据管理

### 单元测试

- **Mock 所有外部依赖**: API 调用、数据库、文件系统
- **Factory Pattern**: 使用 `test-data-factory` 生成测试数据
- **Fixture 隔离**: 每个 `describe` 块独立数据源

示例:
```typescript
const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com'
};

jest.mock('@/lib/api', () => ({
  getUser: jest.fn().mockResolvedValue(mockUser)
}));
```

### E2E 测试

- **Test Database**: 使用独立的 PostgreSQL 实例
- **Seeding**: `prisma db seed` 运行前每个测试套件
- **Transaction Isolation**: 每个测试使用独立事务，测试后回滚
- **Environment Variables**: `.env.test` 覆盖生产配置

示例 `.env.test`:
```bash
DATABASE_URL=postgresql://test:test@localhost:5432/phone-case-test
NEXTAUTH_SECRET=test-secret-for-e2e-only
NEXTAUTH_URL=http://localhost:3000
```

---

## 覆盖率要求

### 全局最低标准

- **Lines**: ≥ 80%
- **Branches**: ≥ 80%
- **Functions**: ≥ 80%
- **Statements**: ≥ 80%

### 模块优先级

| 模块类型 | 覆盖率目标 | 说明 |
|---------|-----------|------|
| 业务逻辑 (Utils) | ≥ 90% | 工具函数必须全面覆盖 |
| 组件 (Components) | ≥ 80% | 渲染逻辑、事件处理 |
| Hooks | ≥ 85% | 状态管理、副作用 |
| Pages (路由) | ≥ 70% | 页面组合组件 |
| API 路由 | ≥ 85% | 请求处理、错误处理 |
| 第三方集成 | ≥ 70% | 外部调用 Mock 覆盖 |

### 忽略清单 (无需 100% 覆盖)

- 自动生成的文件 (`.next/*`, `node_modules/*`)
- 类型定义 (`*.d.ts`)
- 配置文件和构建脚本
- 纯 CSS/样式文件

---

## 运行测试

### 开发阶段

```bash
# 单元测试 (带监听)
npm run test:watch

# E2E 测试 (UI 模式)
npm run test:e2e:ui

# 所有测试
npm run test:all

# 快速质量检查 (预提交)
npm run quality
```

### CI/CD 阶段

```bash
# 完整 CI 流水线 (本地模拟)
npm run test:ci

# 仅覆盖率报告
npm run test:coverage

# 仅 E2E
npm run quality:e2e
```

### 查看测试报告

- **Jest 覆盖率**: `coverage/lcov-report/index.html`
- **Playwright HTML Report**: `playwright-report/index.html`
- **Lighthouse**: `.lighthouseci/`

---

## 故障排除

### 1. Jest 测试超时

**症状**: `Timeout - Async callback was not invoked within the 5000 ms timeout`

**原因**: 异步操作未正确 `await`，或 `useEffect` 未清理

**解决**:
```typescript
// Bad ❌
useEffect(() => {
  fetchData();
}, []);

// Good ✅
useEffect(() => {
  let mounted = true;
  fetchData().then(data => {
    if (mounted) setData(data);
  });
  return () => { mounted = false; };
}, []);
```

### 2. Playwright 测试偶发失败

**症状**: 测试有时通过有时失败

**原因**: 网络延迟或动画未完成

**解决**:
```typescript
// 使用等待条件
await expect(page.locator('.loaded')).toBeVisible({ timeout: 10000 });

// 禁用动画
await page.addStyleTag({ content: '* { transition: none !important; }' });
```

### 3. 覆盖率不达标

**症状**: ` Coverage threshold for global (X%) not met`

**解决**:
1. 运行 `npm run test:coverage` 查看详细报告
2. 识别未覆盖的分支
3. 补充边缘情况测试

### 4. 预提交钩子跳过

**原因**: `.husky/pre-commit` 未执行

**修复**:
```bash
# 确保 husky 已安装
npm install
npx husky install

# 手动测试钩子
npx husky run pre-commit
```

---

## 持续改进

### 每月测试复盘

1. **分析失败测试模式**: 哪些测试最脆弱？
2. **优化运行时间**: 并行、缓存、分片
3. **更新测试数据**: 保持与生产数据同步
4. **扩展 E2E 覆盖**: 识别关键路径缺口

### 技术债务管理

- **Mock 泛滥**: 每季度审查，减少不必要的 Mock
- **过时测试**: 删除不再相关的测试 (可追溯至旧需求)
- **性能优化**: 并行化、增量测试、缓存

---

_📚 参考文档_:
- [Jest 官方文档](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright 测试最佳实践](https://playwright.dev/docs/best-practices)

---

**最后更新**: 2026-03-29  
**维护者**: 全栈专家 AI
