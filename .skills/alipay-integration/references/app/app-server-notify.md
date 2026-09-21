# 支付宝 App 支付 — 异步通知（alipay-notify）

> 本册属于 `alipay-integration` skill 的 App 平台分支。**先读 [`app.md`](app.md)** 与 [`app-server-init.md`](app-server-init.md)。
> 本册覆盖：Required item 5 —— `alipay-notify`：`checkNotifySignV2` 验签 + 幂等 `pending→paid` + 返回纯文本 `success`。
> item 编号全局连续、故意不重排。

<SERVER_NOTIFY>

**5. `alipay-notify` —— 自写的 webhook 接收端点（非支付宝官方接口）**

到账判定的权威路径之一。验签**用官方 SDK 的 `checkNotifySignV2`**，不要自己拼签名串加 WebCrypto——验签与 `create` 的签名同出一处，避免参数排序、空值、编码差异导致的验签失败（这类问题排查成本高、难复现）。

```typescript
import AlipaySdk from "npm:alipay-sdk@3.6.2";
import { createClient } from "npm:@supabase/supabase-js@2";
// sdk 复用 alipay-pay 相同的初始化配置（见 app-server-init.md），
// 密钥处理走 detectKeyType + 按格式补 PEM，尤其 alipayPublicKey，两处口径必须一致

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  // 支付宝异步通知是 application/x-www-form-urlencoded，用 form 解析
  const params: Record<string, string> = {};
  new URLSearchParams(await req.text()).forEach((v, k) => { params[k] = v; });

  // 整个通知对象直接传入，SDK 内部排除 sign / sign_type、按 key 排序、验签
  const valid = sdk.checkNotifySignV2(params);
  if (!valid) return new Response("fail", { status: 400 });

  // trade_status 为 TRADE_SUCCESS 或 TRADE_FINISHED 时，幂等更新 pending→paid
  const { trade_status, out_trade_no } = params;   // 注意：form 字段是 snake_case
  if (trade_status === "TRADE_SUCCESS" || trade_status === "TRADE_FINISHED") {
    await supabase.from("orders").update({ status: "paid" })
      .eq("out_trade_no", out_trade_no).eq("status", "pending");
  }

  // 必须返回纯文本 success，否则支付宝持续重投
  return new Response("success", { status: 200 });
});
```

## 要点

- **`checkNotifySignV2` 同步调用**（无 `await`）。验签不通过返回 `fail`（400），支付宝会按策略重投。
- **通知字段是 snake_case**：从 form 里取 `trade_status` / `out_trade_no`，**不是**驼峰——这跟 `sdk.exec`（`camelcase:true` 返回驼峰）不是一回事，通知是支付宝直接 POST 的原始表单。
- **幂等**：`status = pending` 条件更新保证重复通知不重复处理副作用（设计原则 5）。
- **必须返回纯文本 `success`**：返回别的（JSON、大写、带空格）支付宝都判失败并持续重投。
- `alipay-notify` 与 `alipay-pay` 用**同一套初始化**，尤其 `alipayPublicKey` 的 PEM 格式化方式两处必须完全一致，否则验签失败。

## 部署要求（必需）

支付宝回调不带 Supabase JWT，`alipay-notify` **必须关闭该函数的 JWT 校验**，否则请求会被网关以 401 拦在函数之外、根本进不到验签。

**首选：项目里放 `supabase/config.toml` 声明式关闭**（跟着项目走、不依赖部署时记得敲参数）：

```toml
[functions.alipay-notify]
verify_jwt = false

# alipay-pay 保持默认鉴权（verify_jwt = true），它由客户端经 supabase.functions.invoke 调用、带用户 JWT，不要一起关
```

等效的命令行方式是部署时加 `--no-verify-jwt`（`supabase functions deploy alipay-notify --no-verify-jwt`）；但 CLI 参数容易漏，声明式 `config.toml` 更稳。若平台对 webhook 函数有自己的鉴权放开机制，以平台机制为准。

- **只关 `alipay-notify` 一个**：`alipay-pay` 必须保留鉴权（默认 `verify_jwt = true`），它是客户端带 JWT 调的；把它一起关会让下单/查单/退款接口对外裸奔。

</SERVER_NOTIFY>
