# 支付宝 App 支付 — 数据库 Schema

> 本册属于 `alipay-integration` skill 的 App 平台分支。**先读 [`app.md`](app.md)**。
> 本册覆盖：Required item 1 —— `orders` / `refunds` 表结构、状态枚举。
> item 编号全局连续、故意不重排。

<DB_SCHEMA>

## 一、`orders` 表（必建）

字段名与列名**必须与服务端 `create` 落库、`notify`/`query` 更新的字段逐字对应**（见 [`app-server-order.md`](app-server-order.md)）。下面这组列名就是服务端代码在用的，改名就报"列不存在"。

```sql
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  out_trade_no  text not null unique,              -- 商户订单号，客户端生成、全局唯一
  product_id    text,                              -- 商品 id
  product_name  text,                              -- 商品名（也用作支付宝 subject）
  product_image text default '',                   -- 商品图
  amount        numeric(10,2) not null check (amount > 0),  -- 金额
  status        text not null default 'pending'
                check (status in ('pending','paid','closed','refunded')),
  device_id     text default '',                   -- 下单设备标识
  created_at    timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders(status);
```

- `out_trade_no` 加 **unique**：这是幂等的锚点，通知/查单都靠它定位订单（设计原则 5）。
- `status` 只有四个合法值：`pending`（已下单未支付）/ `paid`（已支付）/ `closed`（已关闭）/ `refunded`（已退款）。**不要**把支付宝返回的大写 `TRADE_SUCCESS` 直接塞进来——那是支付宝的 `trade_status`，要映射成这里的小写枚举。
- 服务端 `create` 的 insert 用的就是 `out_trade_no / product_id / product_name / product_image / amount / status / device_id` 这几列。

## 二、`refunds` 表（CONDITIONAL —— 仅用户要退款时建）

```sql
create table if not exists public.refunds (
  id              uuid primary key default gen_random_uuid(),
  out_trade_no    text not null references public.orders(out_trade_no),
  out_request_no  text not null unique,             -- 退款请求号，必须持久化：refund_query 要用它
  refund_amount   numeric(10,2) not null check (refund_amount > 0),
  status          text not null default 'processing'
                  check (status in ('processing','success','failed')),
  created_at      timestamptz not null default now()
);
```

- `out_request_no` **必须持久化且 unique**：这是退款单的唯一标识，`alipay.trade.fastpay.refund.query` 靠它查询，丢了就查不了退款结果（详见 [`app-refund.md`](app-refund.md)）。常见坑：用 `outTradeNo + 时间戳` 生成 `out_request_no` 后**不落库**，事后无法查询那笔退款——建这张表就是为了避免它。

## 三、写库权限

服务端 Edge Function 写 `orders` / `refunds`。写库必须绕过 RLS——用 service_role key 建的 Supabase 客户端（见 app.md item 8），**不要**把调用方 JWT 注进 `global.headers.Authorization`，否则 service_role 被静默降级成 authenticated，写库被 RLS 挡住。基线实现不给 `orders` 建 `user_id` 列、不开 RLS，客户端下单靠 `out_trade_no` + `query` action 回查订单状态。

</DB_SCHEMA>
