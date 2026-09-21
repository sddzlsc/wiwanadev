# 支付宝 App 支付 — 服务端下单（action:create）

> 本册属于 `alipay-integration` skill 的 App 平台分支。**先读 [`app.md`](app.md)** 与 [`app-server-init.md`](app-server-init.md)。
> 本册覆盖：Required item 3（`action:create` 落库 + `sdkExec` 本地签名生成 orderStr）与 item 7（统一响应 + `alipay-pay` 主函数骨架）。
> item 编号全局连续、故意不重排。

<SERVER_ORDER>

**7. `alipay-pay` 主函数骨架 + 统一响应**（`create` / `query` / `refund` / `refund_query` / `close` 共用一个函数，按 `action` 分支）

统一响应：以布尔 `success` 作成败主判据，失败补一个稳定机器码 `code`。

```typescript
import { createClient } from "npm:@supabase/supabase-js@2";
// sdk / isSandbox 见 app-server-init.md（同一份初始化，可内联或抽共享模块）

function ok(data: unknown) {
  return Response.json({ success: true, data });
}
function fail(error: string, code = "INTERNAL_ERROR", status = 400) {
  return Response.json({ success: false, code, error }, { status });
}

// service_role 直连，绕过 RLS，用于写订单；禁止注入调用方 Authorization（app.md item 8）
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// 异步通知地址，必须指向已部署的 alipay-notify 函数端点
const NOTIFY_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/alipay-notify`;

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { action } = body;
    if (action === "create") return await handleCreate(body);
    // if (action === "query")  ...        见 app-server-query.md
    // if (action === "refund") ...        见 app-refund.md（CONDITIONAL）
    // if (action === "refund_query") ...
    // if (action === "close") ...
    return fail(`未知 action: ${action}`, "INVALID_ACTION");
  } catch (e) {
    return fail(String((e as Error)?.message ?? e), "INTERNAL_ERROR", 500);
  }
});
```

**3. `handleCreate` —— 落库 + 本地签名生成 orderStr**

先写 `orders` 表 `pending`，再用 `sdkExec` 本地签名产出 `orderStr`。

```typescript
async function handleCreate(body: any) {
  const { outTradeNo, subject, amount, productId, productName, productImage, deviceId } = body;
  if (!outTradeNo || !subject || !amount)
    return fail("缺少必要参数: outTradeNo / subject / amount");

  // 1) 先写本地 orders 表，状态 pending
  // ⚠️ 有商品价格表时：不要信 body.amount，改用 productId 查真实价（设计原则 7）
  const { error: dbError } = await supabase.from("orders").insert({
    out_trade_no: outTradeNo,
    product_id: productId,
    product_name: productName,
    product_image: productImage ?? "",
    amount: Number(amount),
    status: "pending",
    device_id: deviceId ?? "",
  });
  if (dbError) return fail(`创建订单失败: ${dbError.message}`, "DB_INSERT_FAILED", 500);

  // 2) 官方 SDK 本地签名生成 orderStr，不发网络请求
  const orderStr = await sdk.sdkExec("alipay.trade.app.pay", {
    notifyUrl: NOTIFY_URL,
    bizContent: {
      out_trade_no: outTradeNo,
      product_code: "QUICK_MSECURITY_PAY",       // App 支付固定值（设计原则 13）
      total_amount: Number(amount).toFixed(2),   // 字符串、两位小数
      subject,
    },
  });

  return ok({ orderStr, outTradeNo, isSandbox }); // isSandbox 随响应回传给客户端
}
```

- `sdkExec`（不是 `exec`）：`sdkExec` 只在本地用私钥签名、拼出 `orderStr`，**不发网络请求**；`exec` 才发网络（查单/退款用）。App 下单必须用 `sdkExec`。
- `product_code` 必须 `QUICK_MSECURITY_PAY`；误用网站支付的 `FAST_INSTANT_TRADE_PAY` 会被网关拒绝。
- `total_amount` 传**字符串、两位小数**（`Number(amount).toFixed(2)`）；`out_trade_no` 用客户端生成、已落库的那个（见 [`app-client.md`](app-client.md)）。
- `isSandbox` 一定要回给客户端：客户端据此调 `setSandboxEnabled(isSandbox)`（仅安卓生效），否则沙箱订单在真机上拉起的是生产支付宝、报"订单不存在"。
- App 支付没有 `returnUrl`、不涉及浏览器同步跳转，但仍需 `notifyUrl` 接异步通知。

## WIRE CONTRACT —— `create`（字段名两端逐字一致，照抄）

```typescript
interface CreateRequest {
  action: "create";
  outTradeNo: string;          // 客户端生成并保存
  subject: string;             // 商品标题
  amount: string;              // 金额字符串，客户端 toFixed(2)
  productId?: string;
  productName?: string;
  productImage?: string;
  deviceId?: string;
}
interface CreateResponse {      // 包在 { success:true, data:{...} } 里
  orderStr: string;            // 交给原生 pay() 的签名串
  outTradeNo: string;
  isSandbox: boolean;
}
// 失败：{ success:false, code:"INVALID_PARAM"|"DB_INSERT_FAILED"|..., error:string }
```

- `orderStr` 是驼峰。`order_str` / `orderString` / `payStr` / `tradeNo` 都是**错的**，不要改名、缩写或 snake_case。
- 客户端拿到后要 **assert 不要 test**：`if (!data.orderStr) throw new Error("获取支付参数失败")`，**不要**写 `if (data.orderStr) { ... }` 却没有 else —— 那会把坏契约变成一个没反应的死按钮。

> ⚠️ **金额必须服务端定价（默认要求，见设计原则 7）**：上面 `handleCreate` 为求最简直接用了客户端传的 `amount`，这是最小可跑版、**不能直接用于有固定商品价的生产场景**——客户端 `amount` 能被抓包改小、低价下单，损失落在商家。**只要应用有商品价格表，就必须**在 `handleCreate` 里按 `productId` 从业务表查真实价、用查到的价 `insert` 落库并作为 `total_amount` 签名，**忽略客户端传的 `amount`**。**唯一例外**：金额本就用户自定义（打赏、任意额充值），无"真价"可查，才用客户端传值。
> native（Android/iOS）经 `supabase.functions.invoke` 调用不走浏览器预检，`Response.json` 无需 CORS 头；web 端在客户端已于 `pay` 前被拦截、不会调 `create`。确有 web 直连需求再自行加 CORS。

</SERVER_ORDER>
