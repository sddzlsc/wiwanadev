# 支付宝 App 支付（alipay.trade.app.pay）— 入口索引册

> 本册属于 `alipay-integration` skill 的 **App 平台**分支。**先完整读本册**，再按下方阅读契约读其余分册后写代码。
> 本册覆盖：设计原则（全局宪法）、Edge Function 清单、分册阅读契约、跨文件通用必做项。
> 各分册的 Required item 编号是**全局连续、故意不重排**的：任何分册里写「Required item 8」都指本册这里的 item 8。

<APP_ALIPAY_REQUIREMENTS>

## 一、设计原则（Design Principles，全局红线）

1. **IMPORTANT**：所有支付代码必须是**生产级完整闭环**，不允许 TODO / 占位页 / 假流程。
2. **优先级**：Required items（本册强制项）> 用户需求 > Recommended items（建议项）。
3. **订单表只能由 Edge Function 用 TRUE service_role 客户端写**。"true" 是关键词：把调用方 JWT 塞进 `global.headers.Authorization` 会把 service_role 客户端**静默降级为 authenticated**，RLS 随即生效、写订单失败。构造方式见 item 8。
4. **NO PLACEHOLDER PAGES**：不许 TODO、不许"待补充"，支付代码一次写全。
5. **状态翻转 + 业务效果 = 一个原子操作，且必须幂等**。订单从 `pending` 变 `paid`、以及随之而来的业务效果（发货 / 记账 / 解锁），要么在同一个事务/RPC 内完成，要么保证重复投递不重复触发。幂等一律用**条件 UPDATE 的影响行数**判断（`update ... where out_trade_no=X and status='pending'`），**绝不**用"先 SELECT 再判断再 UPDATE"——并发/重投下前置 SELECT 会漏判，导致重复发货或"付了钱没到账"。
6. **密钥永不入客户端**：应用私钥、支付宝公钥只存在 Edge Function 环境变量；签名（`sdkExec`）、验签（`checkNotifySignV2`）、查单全部在服务端。客户端拿到的只有 `orderStr`。
7. **金额必须服务端定价，不信客户端**：客户端传的 `amount` 能被抓包改小、低价下单，损失落在商家（用本代码开店的人）头上，不是买家的事。**默认要求**：只要应用有商品价格表，`create` 就按 `productId` 从服务端业务表查真实价、用查到的价落库并签 `total_amount`，**忽略客户端传的 `amount`**。**唯一例外**是金额本就由用户自定义（打赏、任意额充值），没有"真价"可查，才用客户端传值。下方 `app-server-order.md` 里 `handleCreate` 的示例为求最简直接用了客户端 `amount`，那是最小可跑版；**有固定商品价的场景必须按本条改成服务端查价**，不要照抄最小版直接上生产。
8. **同步 `resultStatus` 不可信**：客户端 `pay()` 的同步返回只用于 UI 提示，**到账判定只认**异步通知（`checkNotifySignV2` 验签通过）或主动查询接口（`alipay.trade.query`）。
9. **NO SIMULATED PAYMENT**：订单变 `paid` 只有两条路——通知验签通过、或查单返回 `TRADE_SUCCESS/TRADE_FINISHED`。**禁止**任何 `simulate_pay` / `mock_pay` / `dev_mode` 请求标志，**禁止**任何"模拟支付 / 测试支付"按钮，**禁止** SDK 失败时本地"标记已支付"兜底。
10. **退款是条件项**：未经用户明确要求，**不做**退款（见阅读契约 CONDITIONAL）。
11. **两套 SDK 不得混用**：App 支付服务端**只用**官方 `npm:alipay-sdk@3.6.2`；**禁止**引用本 skill 网站支付的自研 `_shared/alipay-sdk-deno.ts`。客户端只用 `@jayming/expo-alipay ^1.3.0`。
12. **scheme 三处必须完全一致**：`app.json` 顶层 `expo.scheme` = `@jayming/expo-alipay` 插件参数 scheme = 客户端 `setAlipayScheme(...)` 入参。三处任一不一致，iOS 支付完回跳无法命中本 App。
13. **`product_code` 固定 `QUICK_MSECURITY_PAY`**：这是 App 支付唯一取值，**不是** `FAST_INSTANT_TRADE_PAY`（那是网站支付）。

## 二、要创建并部署的 Edge Function

- **`alipay-pay`**：单函数按 `action` 分 5 个分支 —— `create`（下单+本地签名生成 orderStr）/ `query`（主动查单兜底）/ `refund` / `refund_query` / `close`。
- **`alipay-notify`**：**自写的** webhook 接收端点（非支付宝官方接口）—— `checkNotifySignV2` 验签 + 幂等 `pending→paid` + 返回纯文本 `success`。

## 三、分册阅读契约（Reference files）

**本册永远必读、且要读全。其余分册不是"菜单任选"**：只要是 App 支付任务，下面标 REQUIRED 的每一册都必须读。**按此顺序读——DB 优先，因为每个 Edge Function 都要调 DB 里定义的表/RPC**：

1. REQUIRED [`app-db-schema.md`](app-db-schema.md) — `orders` / `refunds` 表、枚举、RLS 契约（SELECT-only）。覆盖 Required item 1。
2. REQUIRED [`app-server-init.md`](app-server-init.md) — SDK 初始化：`normalizeKey` / `detectKeyType` / `ALIPAY_ENV` 选网关 / 按格式补 PEM。覆盖 Required item 2。
3. REQUIRED [`app-server-order.md`](app-server-order.md) — `action:create` 落库 + `sdkExec` 本地签名生成 `orderStr`。覆盖 Required item 3、7。
4. REQUIRED [`app-server-query.md`](app-server-query.md) — `action:query` 主动查询兜底 + 幂等。覆盖 Required item 4。
5. REQUIRED [`app-server-notify.md`](app-server-notify.md) — `alipay-notify`：`checkNotifySignV2` 验签 + 幂等 + 返回纯文本 `success`。覆盖 Required item 5。
6. REQUIRED [`app-client.md`](app-client.md) — `@jayming/expo-alipay` 依赖 / `app.json` scheme 三处一致 / `setAppId` / 支付流程 / web + 未安装拦截 / 结果码兜底。覆盖 Required item 6。
7. CONDITIONAL [`app-refund.md`](app-refund.md) — `action:refund` / `refund_query` / `close`。**仅当用户明确要求退款时才读**（设计原则 10），否则跳过。覆盖 Required item 9。

**关于读法的三条规则**：

- **一条命令最多读其中两个文件**。一条命令把它们全 dump 出来会超输出限制，中间——正好是签名和加解密代码——会被**静默截断**。所以这需要 3–4 条命令；**不要**读了一两个觉得够了就停。
- **每个 REQUIRED 文件读完之前，不许写任何支付代码**。每一册至少带一条无法从别册推断的规则。
- Required item 编号全局连续、故意不重排：引用「Required item 8」永远指本册的 item 8。

## 四、跨文件通用必做项（PAYMENT_REQUIREMENTS）

**8. Supabase 客户端构造（强制）**——所有 Edge Function 写订单表都要这样建：

```typescript
// ✅ 正确：service_role 直连，绕过 RLS，用于写订单
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

```typescript
// ❌ NEVER：这正是本规则要拦的 bug —— 注入 Authorization 会把 service_role 静默降级为 authenticated
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  global: { headers: { Authorization: authHeader } },
});
```

- **部署任何 Edge Function 前自查**：grep 自己的源码找 `global` —— 若 `global.headers.Authorization` 和 `SERVICE_ROLE_KEY` 出现在一起，函数就是坏的，先改掉再部署。

**9. 密钥读取用固定变量名**（沙箱场景由 SKILL.md 功能三步骤 3.1 的环境脚本 `--platform app` 自动创建并注册到 Supabase Secrets——与网站支付共用同一套 anonymous sandbox；已有生产凭证时平台侧直接注入）：

```
ALIPAY_MOBILE_APP_APP_ID       // 支付宝应用 APPID
ALIPAY_MOBILE_APP_PRIVATE_KEY  // 应用私钥
ALIPAY_MOBILE_APP_PUBLIC_KEY   // 支付宝公钥（用于验签）
ALIPAY_ENV                     // sandbox | production，缺省 production
```

- 变量名逐字使用，`ALIPAY_APP_ID` / `ALIPAY_PRIVATE_KEY` / `ALIPAY_WEB_*` 都是**错的**——`ALIPAY_WEB_*` 是网站支付的前缀，不要拿来用。
- 客户端只读 `EXPO_PUBLIC_ALIPAY_APP_ID`（公开 APPID，打包注入），私钥/公钥永不下发客户端。

</APP_ALIPAY_REQUIREMENTS>
