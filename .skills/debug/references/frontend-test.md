# Vitest 测试写法与环境指南

本文件规定前端测试的**写法、API 与运行环境**。本测试方法仅基于 vitest 框架，不能使用 playwright 进行端到端测试。

## 运行环境

依赖已随平台预制：vitest / jsdom / RTL / @vitest/browser\* / vitest-browser-react / playwright。它们装在预热层、不在项目 `node_modules` 里，所以 `ls node_modules` 看不到但可正常解析——不要据此判断依赖缺失。不要 `npm install` / `pnpm add`；browser mode 用系统 `/usr/bin/chromium`，绝不 `playwright install`。

**禁止编写游离的 playwright/puppeteer 脚本**（如 `/tmp/*.mjs`、`/tmp/*.cjs`、项目根目录下的临时 `.mjs`/`.cjs`）去 `import`/`require` playwright、puppeteer 或直接 launch chromium 做验证。浏览器相关的验证只能走 `src/__tests__/repro-<slug>.browser.test.tsx` + `npx vitest run --config vitest.browser.config.ts` 这一条路径；不要为了"确认 playwright 装在哪/能不能跑"而 `find /` 搜索依赖路径或 `require.resolve` 探测。

三份配置（`vitest.config.ts`、`vitest.browser.config.ts`、`src/__tests__/setup.ts`）部分应用自带、部分可能缺失。

- `cd /workspace/<app_id> && python3 .skills/debug/scripts/setup_vitest.py --check` 确认依赖无缺失。
- `cd /workspace/<app_id> && python3 .skills/debug/scripts/setup_vitest.py` 补齐缺失的配置文件；已存在的配置不会被覆盖，可放心执行。
- 测试写在 `src/__tests__/` 下，用 `npx vitest run`（browser mode 加 `--config vitest.browser.config.ts`）执行，不要依赖 `npm test`。


## 选择测试层

按逻辑所在的边界选 runner，不按偏好。

1. **node** — 纯函数、计算、查询转换、数据格式。速度最快。
2. **jsdom + RTL** — DOM、条件渲染、回调、状态更新、表单交互。不支持真实 CSS、布局、Canvas 和 `getBoundingClientRect`。
3. **browser mode** — 布局、样式、拖拽、Canvas、真实事件冒泡和尺寸。真实 Chromium，布局引擎完整执行，尺寸、位置、层叠、遮挡、溢出都能直接读数值断言。冷启动 ~4s，不启动 dev server，组件在 Vitest 控制的页面内渲染。

## 校准运行时数据

```bash
cd /workspace/<app_id> && python3 .skills/debug/scripts/fetch_sample.py --table majors \
  --select "id,name,major_categories(name,disciplines(name))" --limit 1
```

- 优先用真实样本构造 mock。脚本会分析嵌套字段是对象还是数组，并生成可粘贴的 mock 字面量。PostgREST 通常将多对一返回为对象、一对多返回为数组，具体形状由外键方向决定。
- mock 形状与 `types.ts` 冲突时，以真实样本为准，并将类型声明列为根因候选。
- 无法取样时，先阅读 migrations 和查询定义，并标记结论为推断；形状仍不确定时，用 `describe.each` 覆盖对象和数组两种输入，不要只假设一种。

## 通用约定

1. 测试文件放在 `src/__tests__/`，用 `repro-` 前缀标识：node → `repro-<slug>.node.test.ts`，jsdom → `repro-<slug>.test.tsx`，browser mode → `repro-<slug>.browser.test.tsx`。
2. 一个文件可以覆盖多个症状，但每个委派问题必须有一条决定性断言。
3. 测试必须 import 真实被修对象。在测试里重写或复制被疑逻辑，证明不了业务代码。
4. 断言用户可观测的结果，不断言实现细节或内部 state 结构。
5. 验收条件必须等于用户描述的现象本身，不要用近似替身。
6. 测试要稳定：mock 网络、用 fake timers 控制时间、不依赖随机数据。

## 三层测试模板

### node

```typescript
import { describe, it, expect } from 'vitest'
import { targetFunction } from '../path/to/module'

describe('Bug复现: <一句话症状>', () => {
  it('应该: <验收条件>', () => {
    const result = targetFunction({ id: 1 })
    expect(result.major_categories).toBeDefined()
  })
})
```

```bash
npx vitest run src/__tests__/repro-<slug>.node.test.ts
```

### jsdom + RTL

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TargetComponent } from '../components/TargetComponent'
describe('Bug复现: <症状>', () => {
  it('应该: <验收条件>', async () => {
    const user = userEvent.setup()
    render(<TargetComponent />)
    await user.click(screen.getByRole('button', { name: '提交' }))
    expect(screen.getByText('成功')).toBeInTheDocument()
  })
})
```

元素定位优先使用 `getByRole`、`getByLabelText`、`getByPlaceholder`、`getByText`，最后才用 `getByTestId`。

### browser mode

```typescript
import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { TargetComponent } from '@/components/TargetComponent'
describe('Bug复现: <症状>', () => {
  it('应该: <验收条件>', async () => {
    render(<TargetComponent />)
    // ⚠️ browser mode 下 render() 不返回 { container }/getByText——用 page locator 定位，
    // 用 expect.element(...) 做带自动重试的断言（比手动 setTimeout 稳）。
    const el = page.getByRole('button', { name: '连接' })
    await expect.element(el).toBeVisible()
    expect(el.element().getBoundingClientRect().width).toBeGreaterThan(0)
    await el.click()
  })
})
```

```bash
npx vitest run --config vitest.browser.config.ts \
  src/__tests__/repro-<slug>.browser.test.tsx
```

- browser 配置使用独立文件和 `--config`。
- `render` 不返回 jsdom 的 container，其返回值也不含查询方法；一律用 `page.*`（`page.getByRole`/`getByTestId` 等）定位 + `expect.element` 断言。
- 每个测试后 vitest-browser-react 自动 cleanup，多个用例各自 `render` 即可；**不要手动 `document.body.innerHTML = ""`**——会破坏框架内部挂载状态，报 `Cannot read properties of undefined`。
- vitest 4：`page`、`userEvent` 从 `vitest/browser` 引入；`@vitest/browser/context` 已废弃。
- 390px 等响应式问题要在配置中固定 viewport，并断言元素矩形不重叠。
- 视觉、布局、层叠问题的具体断言写法见下面「视觉与布局 bug」。

## 方法速查：按 bug 类型选写法

### 时间相关 bug

debounce、节流、setTimeout、轮询、倒计时和日期计算使用假定时器确定性快进。

```typescript
vi.useFakeTimers()
render(<Search />)                              // 内部 300ms debounce
fireEvent.change(input, { target: { value: 'ab' } })
vi.advanceTimersByTime(300)                     // 快进到 debounce 触发（同步定时器）
vi.advanceTimersByTimeAsync(300)                // 定时器里还发了 fetch/await 时，用 async 版排空异步链
expect(mockSearch).toHaveBeenCalledWith('ab')
vi.useRealTimers()                              // 用完复原

vi.setSystemTime(new Date('2026-01-01'))        // 复现"依赖当前时间"的 bug（到期/跨天/时区）
vi.runOnlyPendingTimers()                        // 只跑当前挂起的，避免递归定时器无限触发
expect(vi.getTimerCount()).toBe(0)               // 断言定时器没泄漏（该清的清了）
```

注意：`userEvent.setup()` 使用真实 microtask，和 fake timers 组合可能让 `user.type` 卡死。有 debounce 的组件优先使用真实定时器和 `waitFor({ timeout })`。

### 数据源 bug

接口、DB 或 SDK 问题使用真实形状 mock，并断言调用参数。

```typescript
vi.mock('@/lib/queries', () => ({ searchMajors: vi.fn() }))
import { searchMajors } from '@/lib/queries'

vi.mocked(searchMajors).mockResolvedValue([/* 真实形状样本，先 fetch_sample 校准 */])
vi.mocked(searchMajors).mockRejectedValue(new Error('boom'))   // 复现错误分支
// 断言"用错参数调了接口"——直击很多假验收根因：
expect(searchMajors).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 38 }))

// 部分 mock：保留真实实现只换一个（importActual）
vi.mock('@/lib/utils', async (orig) => ({ ...(await orig()), formatDate: vi.fn() }))

// mock 工厂里要用外部变量 → vi.hoisted（mock 被提到文件顶部，普通变量还没定义）
const { fakeData } = vi.hoisted(() => ({ fakeData: [{ id: 1 }] }))
vi.mock('@/lib/queries', () => ({ searchMajors: vi.fn(async () => fakeData) }))
```

### 网络请求 bug

单个请求使用 fetch stub；多端点、GraphQL 或需要断言请求内容时使用 MSW（非预制，`import` 失败就退回 fetch stub）。

轻量：

```typescript
vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })))
// 复现错误处理分支；用完 vi.unstubAllGlobals()
```

复杂场景：

```typescript
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
const server = setupServer(
  http.get('/api/majors', () => HttpResponse.json([{ id: 1, name: '计算机' }])),
  http.post('/api/order', () => new HttpResponse(null, { status: 403 })),  // 复现 403 分支
)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))  // 漏网请求直接报错
afterEach(() => server.resetHandlers()); afterAll(() => server.close())
```

### 环境变量分支 bug

用环境变量固定 prod/dev 或 feature flag 分支，测试后恢复环境。

```typescript
vi.stubEnv('NODE_ENV', 'production')       // 强制某环境，复现"只在 prod 出现"的分支
vi.stubEnv('VITE_FEATURE_X', 'off')
// 用完 vi.unstubAllEnvs()
```

### 异步与竞态 bug

等待 fetch settle、最终一致状态或异步条件，不使用固定 sleep。

```typescript
await waitFor(() => expect(screen.getByText('计算机类')).toBeInTheDocument(), { timeout: 3000 })
expect(await screen.findByText('计算机类')).toBeInTheDocument()   // findBy 自带等待
await expect.poll(() => store.status, { timeout: 5000 }).toBe('ready')  // 对"最终一致"值反复求值
await vi.waitUntil(() => window.__ready === true, { timeout: 5000 })    // 等条件真，遇错立即中断
```

注意：`expect.poll` 不支持 snapshot、resolves 或 toThrow。

### 类型与数据形状 bug

类型声明与运行时真相不符时，用 schema 校验和编译期类型断言分别检查两层契约。

```typescript
// 运行时校验：数据是否真符合 schema（比纯 type 更贴"真相"，zod 非预制，import 失败就手动逐字段断言）
import { z } from 'zod'
const Major = z.object({ id: z.number(), major_categories: z.object({ name: z.string() }) })
expect(realSample).toEqual(expect.schemaMatching(Major))   // 真实样本不符 schema → type 声明就是根因

// 编译期类型断言（项目已装 tsc 时可用，跑 vitest --typecheck）
expectTypeOf(searchMajors).returns.resolves.toEqualTypeOf<Major[]>()
```

### 多组输入的同一 bug

同一验收条件存在多种嵌套形状时，用参数化测试覆盖每种输入。

```typescript
describe.each([
  ['to-one 对象', { name: '计算机类', disciplines: { name: '工学' } }],
  ['to-many 数组', [{ name: '计算机类', disciplines: [{ name: '工学' }] }]],
])('嵌套形状=%s', (_l, shape) => {
  it('结果卡片显示专业类', async () => { /* 用 shape 造 mock + 断言 */ })
})
```

### 偶发与不稳定 bug

用重试和重复运行放大竞态，再清理模块级状态泄漏。

```typescript
it('偶发竞态', { retry: 3 }, async () => { /* ... */ })       // 失败重跑
it('稳定性', { repeats: 20 }, async () => { /* ... */ })      // 通过也跑 20 次，逼出偶发
// 跨用例互相污染（模块级状态泄漏）导致的偶发：
afterEach(() => vi.resetModules())
```

### 视觉与布局 bug

browser mode 是真实 Chromium，布局引擎完整跑过，尺寸、位置、层叠、遮挡、溢出都能直接读数值断言。视觉问题一律用数值和布尔判据来确定。

能力边界：`page.getBy*` 返回 locator 而不是元素；`expect.element` 自带轮询重试。要读几何量时用 `.element()` 取真实 DOM 节点（官方定位为 escape hatch，读几何量是正当用途），此时失去重试，所以先用 `expect.element` 等元素稳定，再取 rect。

```typescript
import { page } from 'vitest/browser'

const card = page.getByRole('article', { name: '专业卡片' })
await expect.element(card).toBeVisible()      // 非空 bounding box + visibility 不为 hidden
await expect.element(card).toBeInViewport()   // 4.0+，在视口内（元素被挤出屏幕时失败）
const el = card.element() as HTMLElement
```

```typescript
// 1) 尺寸塌陷 / 被压扁
const r = el.getBoundingClientRect()
expect(r.width).toBeGreaterThan(0)
expect(r.height).toBeGreaterThan(40)

// 2) 两个元素重叠（矩形相交即重叠）
const a = elA.getBoundingClientRect(), b = elB.getBoundingClientRect()
const overlap = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
expect(overlap).toBe(false)

// 3) 被父容器裁剪（子元素超出父容器可视矩形）
const p = el.parentElement!.getBoundingClientRect()
expect(r.right).toBeLessThanOrEqual(p.right + 0.5)   // 允许亚像素误差
expect(r.bottom).toBeLessThanOrEqual(p.bottom + 0.5)

// 4) 内容溢出（横向滚动条、文字被切）
expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth)
expect(document.documentElement.scrollWidth)
  .toBeLessThanOrEqual(document.documentElement.clientWidth)   // 390px 下不应横向滚动

// 5) 层叠 / 被遮挡：中心点命中的是不是它自己
const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
expect(el.contains(hit) || el === hit).toBe(true)

// 6) 计算样式（opacity:0、颜色、z-index、overflow 这些 toBeVisible 查不出的）
expect(getComputedStyle(el).opacity).not.toBe('0')
await expect.element(card).toHaveStyle({ position: 'fixed' })

// 7) 元素数量 / canvas 是否真画了东西
expect(page.getByRole('listitem').elements().length).toBe(3)
const cvs = page.getByRole('img', { name: '地形' }).element() as HTMLCanvasElement
const px = cvs.getContext('2d')!.getImageData(0, 0, cvs.width, cvs.height).data
expect(px.some(v => v !== 0)).toBe(true)      // 全 0 = 黑屏/空画布
```

注意：

- `toBeVisible` 基于几何与计算样式：零尺寸和 `display:none` 判不可见，但 **`opacity: 0` 仍算 visible**，透明度类问题必须查 `getComputedStyle`。
- 响应式问题在 browser 配置里固定 viewport（如 390×844），不要靠改窗口大小。
- 断言字体或图片加载后的布局前先 `await document.fonts.ready`。
- WebGL/three.js 的 canvas 上 `getContext('2d')` 返回 null；改断言场景对象（mesh 数量、相机位置）或用 `readPixels`，不要按 2d 上下文取像素。
- 不使用 `toMatchScreenshot` 与基线截图：它依赖字体渲染、GPU、浏览器版本和平台一致，跨环境不稳定，且需要提交并维护基线图片。所有视觉验收改用上面的数值判据。

### 结构回归

快照用于稳定结构，不替代视觉尺寸、位置和层叠断言。

```typescript
expect(container).toMatchSnapshot()                 // 大结构，独立 .snap
expect(parsed).toMatchInlineSnapshot()              // 小对象，快照写进源码
expect(el.innerHTML).toMatchFileSnapshot('./__snap__/x.html')  // 渲染产物
expect(() => parse(bad)).toThrowErrorMatchingInlineSnapshot()  // 错误信息回归
```

### 防止假绿

用断言数量、异步断言和不可达分支确认测试确实执行了目标代码。

```typescript
// 1) 断言数量守卫——异步回调没触发时，用例会假绿；这行强制它必须跑够 N 个断言
expect.hasAssertions()                    // 至少跑了 1 个断言
expect.assertions(2)                      // 精确跑了 2 个断言

// 2) resolves/rejects 必须 await，否则 promise 没 settle 就通过 = 永远假绿
await expect(searchMajors('x')).resolves.toHaveLength(2)   // ← 漏了 await 就是假绿
await expect(fn()).rejects.toThrow('权限')

// 3) 一次收集多个失败点（多分支断言，别一个失败就掩盖后面的）
expect.soft(a).toBe(1); expect.soft(b).toBe(2)

// 4) 不该走到的分支，走到即失败
if (unexpected) expect.unreachable('不该进这个分支')
```

### 调试期缩小范围与失败现场

只在调查阶段缩小范围或输出 DOM/store，提交前移除临时标记。

```typescript
it.only('只跑这条', () => {})               // 只跑目标（注意 CI allowOnly 关时会报错）
it.fails('已知未修的 bug', () => {})        // 记录已知 bug（断言它当前失败）
it.skipIf(process.env.CI)('本地才跑', () => {})
onTestFailed(() => console.log(document.body.innerHTML))  // 失败时打印 DOM/store 现场，加速定位
```

### 常用断言

优先断言用户可观察结果；异步 resolves/rejects 必须等待。

```typescript
expect(el).toBeInTheDocument()
expect(screen.getAllByText('工学').length).toBeGreaterThan(0)
expect(fn).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
expect(obj).toStrictEqual({ a: 1 })            // 比 toEqual 严：查 undefined 键/稀疏数组/类型
expect(obj).toMatchObject({ a: 1 })            // 只比子集
await expect(searchMajors('x')).resolves.toHaveLength(2)   // 必须 await
await expect(fn()).rejects.toThrow('权限')
```

### 清理

优先用配置清理 mock；没有配置时在每个测试后恢复所有可变状态。

`vitest.config.ts → test: { clearMocks: true, restoreMocks: true }`，否则 `afterEach(() => { vi.clearAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })`。
