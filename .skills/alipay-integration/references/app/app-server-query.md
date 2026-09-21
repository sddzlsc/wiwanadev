# 支付宝 App 支付 — 服务端查单兜底（action:query）

> 本册属于 `alipay-integration` skill 的 App 平台分支。**先读 [`app.md`](app.md)** 与 [`app-server-order.md`](app-server-order.md)（主函数骨架、`ok`/`fail`、`supabase` 在那里）。
> 本册覆盖：Required item 4 —— `action:query` 主动查询兜底 + 幂等。
> item 编号全局连续、故意不重排。

<SERVER_QUERY>

**4. `handleQuery` —— 主动查单，是到账判定的权威路径之一**

同步 `resultStatus` 不可信（设计原则 8）。客户端 `pay()` 拿到结果码后调 `query` 向支付宝确认真实状态，并在这里做幂等落库。

```typescript
if (action === "query") {
  const { outTradeNo } = body;
  // exec 发网络查单（不是 sdkExec）
  const result = await sdk.exec("alipay.trade.query", {
    bizContent: { out_trade_no: outTradeNo },
  });
  if (result.code === "10000") {
    const ts = result.tradeStatus || result.trade_status;  // camelcase 兜底
    if (ts === "TRADE_SUCCESS" || ts === "TRADE_FINISHED") {
      // 幂等：只更新还处于 pending 的那一行；影响行数为 0 表示已被通知处理过，不重复触发副作用
      await supabase.from("orders").update({ status: "paid" })
        .eq("out_trade_no", outTradeNo).eq("status", "pending");
    }
  }
  return ok(result);   // 原样回传支付宝结果，客户端读 data.data.tradeStatus
}
```

## 说明

- **返回的是支付宝原始结果**（`ok(result)`）：`result.code === "10000"` 表示查询接口调用成功，`result.tradeStatus` 才是订单真实状态。`code !== "10000"`（如 `ACQ.TRADE_NOT_EXIST`，订单还没被支付宝受理）时不改库、原样透传，客户端保持 pending 稍后重试。
- **幂等靠条件 UPDATE 的影响行数，不靠前置 SELECT**（设计原则 5）：通知和查单可能同时把订单从 pending 翻成 paid，`where status='pending'` 保证只有一次真正生效，业务副作用（发货/记账）只触发一次。
- 只有 `TRADE_SUCCESS` / `TRADE_FINISHED` 才翻 `paid`；`WAIT_BUYER_PAY` 保持 pending，什么都不改。

## WIRE CONTRACT —— `query`

```typescript
interface QueryRequest { action: "query"; outTradeNo: string; }
// 响应 { success:true, data: <支付宝 alipay.trade.query 原始返回> }
// 客户端读 data.data.tradeStatus 判断：TRADE_SUCCESS / TRADE_FINISHED 为成功
```

- 客户端据 `tradeStatus` 判成功（`TRADE_SUCCESS` / `TRADE_FINISHED`），其余状态一律视为"结果确认中"，提示稍后在订单页查询，**不要**直接判失败或成功。

</SERVER_QUERY>
