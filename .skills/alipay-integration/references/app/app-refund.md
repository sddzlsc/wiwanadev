# 支付宝 App 支付 — 退款 / 退款查询 / 关单（CONDITIONAL）

> 本册属于 `alipay-integration` skill 的 App 平台分支。**先读 [`app.md`](app.md)** 与 [`app-server-order.md`](app-server-order.md)。
> 本册覆盖：Required item 9 —— `action:refund` / `refund_query` / `close`。**仅当用户明确要求退款时才读**（设计原则 10），否则跳过。
> ⚠️ 成熟度标注：参考实现里 `refund`（§3.4）只给到**步骤说明、非完整代码**，`close`（§3.6）只给了 `exec` 调用 + 关单说明；下面 `refund` / `close` 的函数体是**按步骤补全**的，`refund_query` 是完整参考实现。补全部分**未实测**，落地时按项目的 orders/refunds 表字段核对。
> item 编号全局连续、故意不重排。

<REFUND>

**9. 退款三件套**

## refund —— 申请退款（按步骤补全，未实测）

```typescript
if (action === "refund") {
  const { outTradeNo, refundAmount, reason, orderId } = body;

  // 1) 校验订单存在且为 paid、退款金额不超实付
  const { data: order } = await supabase.from("orders")
    .select("*").eq("out_trade_no", outTradeNo).maybeSingle();
  if (!order) return fail("订单不存在", "ORDER_NOT_FOUND");
  if (order.status !== "paid") return fail("订单非已支付状态，不可退款", "ORDER_NOT_REFUNDABLE");
  if (Number(refundAmount) > Number(order.amount))
    return fail("退款金额超过实付金额", "REFUND_AMOUNT_EXCEED");

  // 2) 生成并持久化 out_request_no（退款唯一标识，refund_query 要用），先写 processing
  const outRequestNo = `${outTradeNo}_${Date.now()}`;
  await supabase.from("refunds").insert({
    out_trade_no: outTradeNo, out_request_no: outRequestNo,
    refund_amount: Number(refundAmount), status: "processing",
  });

  // 3) 发网络退款
  const result = await sdk.exec("alipay.trade.refund", {
    bizContent: {
      out_trade_no: outTradeNo,
      refund_amount: Number(refundAmount).toFixed(2),
      out_request_no: outRequestNo,
      refund_reason: reason ?? "",
    },
  });

  // 4) 成功：orders→refunded、refunds→success；失败：refunds→failed 并抛错
  if (result.code === "10000") {
    await supabase.from("orders").update({ status: "refunded" }).eq("out_trade_no", outTradeNo);
    await supabase.from("refunds").update({ status: "success" }).eq("out_request_no", outRequestNo);
    return ok(result);
  } else {
    await supabase.from("refunds").update({ status: "failed" }).eq("out_request_no", outRequestNo);
    return fail(result.subMsg ?? result.msg ?? "退款失败", "REFUND_FAILED");
  }
}
```

## refund_query —— 查某笔退款最终状态（完整参考实现）

```typescript
if (action === "refund_query") {
  const { outTradeNo, outRequestNo } = body;
  const result = await sdk.exec("alipay.trade.fastpay.refund.query", {
    bizContent: { out_trade_no: outTradeNo, out_request_no: outRequestNo },
  });
  return ok(result);
}
```

## close —— 主动关闭未支付订单（exec 为参考实现，关单为补全）

```typescript
if (action === "close") {
  const { outTradeNo } = body;
  const result = await sdk.exec("alipay.trade.close", {
    bizContent: { out_trade_no: outTradeNo },
  });
  // 幂等：只把还 pending 的订单置 closed
  await supabase.from("orders").update({ status: "closed" })
    .eq("out_trade_no", outTradeNo).eq("status", "pending");
  return ok(result);
}
```

## 关键约定

- **`out_request_no` 必须持久化且 unique**：常见坑——用 `outTradeNo + 时间戳` 生成后**不存库**，事后无法查那笔退款。必须写进 `refunds` 表（见 [`app-db-schema.md`](app-db-schema.md)）。
- **退款用 `exec`（发网络），不是 `sdkExec`**。
- 幂等同 create/notify：状态翻转用条件 UPDATE 的影响行数判断（设计原则 5）。
- 仅支持整单退款。

</REFUND>
