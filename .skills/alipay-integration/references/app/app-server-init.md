# 支付宝 App 支付 — 服务端 SDK 初始化

> 本册属于 `alipay-integration` skill 的 App 平台分支。**先读 [`app.md`](app.md)** —— 它带着本册依赖的设计原则和全局 item 编号。
> 本册覆盖：Required item 2 —— 官方 SDK 初始化：读凭证、`normalizeKey`、`detectKeyType`、`ALIPAY_ENV` 选网关、按格式补 PEM。
> item 编号全局连续、故意不重排。

<SERVER_INIT>

**2. SDK 初始化（`alipay-pay` 与 `alipay-notify` 两个函数用同一套配置）**

- 服务端**只用**官方 `npm:alipay-sdk@3.6.2`（设计原则 11）。**锁死 3.6.2**：4.x 在 Deno@2.1.4 运行时加载即报 `SyntaxError: The requested module 'node:buffer' does not provide an export named 'File'`，进不到密钥处理就失败；Deno 升到 2.8.0+ 后 3.6.2 的 API 可无缝切 4.14.0。**不要**升级或改用其他版本。
- 密钥/环境用 app.md item 9 的**固定变量名**读取。
- 下面这段 `normalizeKey` / `detectKeyType` / PEM 重包是**签名与验签的地基，属安全关键代码，原样使用、禁止"优化"或改写**——密钥格式判定、PEM 重包、`signType` 都直接影响签名正确性，改了就验签失败。

```typescript
// alipay-pay 与 alipay-notify 各自内联同一份，或抽到共享模块复用；两处配置必须一致
import AlipaySdk from "npm:alipay-sdk@3.6.2";

// 去掉 PEM 头尾与所有空白，得到裸 base64
function normalizeKey(raw: string): string {
  return raw.replace(/-----BEGIN [A-Z ]+-----/g, "")
            .replace(/-----END [A-Z ]+-----/g, "")
            .replace(/\s+/g, "");
}

// 识别私钥格式，交由 SDK 按对应 keyType 处理，两种格式都支持，不做转换
function detectKeyType(raw: string): "PKCS1" | "PKCS8" {
  if (/BEGIN RSA PRIVATE KEY/.test(raw)) return "PKCS1";   // PEM 头优先
  if (/BEGIN PRIVATE KEY/.test(raw)) return "PKCS8";
  const clean = normalizeKey(raw);
  if (!clean) return "PKCS8";
  const der = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
  // 裸 base64 无 PEM 头时看 der[7]，0x30 为 PKCS8 内层 AlgorithmIdentifier，否则 PKCS1
  const isPkcs8 = der.length > 8 && der[0] === 0x30 &&
    der[4] === 0x02 && der[5] === 0x01 && der[6] === 0x00 && der[7] === 0x30;
  return isPkcs8 ? "PKCS8" : "PKCS1";
}

// 把裸 base64 按 64 字符换行、补 PEM 头尾，还原成 SDK 能解析的完整 PEM
function toPem(raw: string, label: string): string {
  const body = normalizeKey(raw).match(/.{1,64}/g)?.join("\n") ?? normalizeKey(raw);
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`;
}

const rawAppId = Deno.env.get("ALIPAY_MOBILE_APP_APP_ID") || "";
const rawPrivateKey = Deno.env.get("ALIPAY_MOBILE_APP_PRIVATE_KEY") || "";
const rawAlipayPublicKey = Deno.env.get("ALIPAY_MOBILE_APP_PUBLIC_KEY") || "";

const alipayEnv = (Deno.env.get("ALIPAY_ENV") || "production").toLowerCase();
const isSandbox = alipayEnv === "sandbox";
const gateway = isSandbox
  ? "https://openapi-sandbox.dl.alipaydev.com/gateway.do"
  : "https://openapi.alipay.com/gateway.do";

const privateKeyType = detectKeyType(rawPrivateKey);      // 识别 PKCS1 或 PKCS8
const privateKey = normalizeKey(rawPrivateKey);           // 去 PEM 头尾与空白，保留原格式

const sdk = new AlipaySdk({
  appId: rawAppId,
  privateKey,                                   // 传裸 base64，下面再覆写为完整 PEM
  alipayPublicKey: toPem(rawAlipayPublicKey, "PUBLIC KEY"), // 支付宝公钥补 PEM，验签用
  gateway,
  keyType: privateKeyType,                       // 按识别结果传入，两种格式均可
  signType: "RSA2",
  camelcase: true,
});

// SDK 的 sdk.config.privateKey 需要带 PEM 头尾、每行 64 字符换行的完整私钥文本
const pemLabel = privateKeyType === "PKCS1" ? "RSA PRIVATE KEY" : "PRIVATE KEY";
sdk.config.privateKey = toPem(rawPrivateKey, pemLabel);
```

## 关键约定

- **PEM 还原（最后一行）不能省**：`normalizeKey` 只留裸 base64，而 `sdk.config.privateKey` 需要带头尾、按 64 字符换行的完整 PEM。头标签必须与真实格式匹配——PKCS1 用 `RSA PRIVATE KEY`、PKCS8 用 `PRIVATE KEY`，否则底层 crypto 解析私钥失败。整个过程只还原封装，**不做格式转换**。
- **`alipayPublicKey` 同样要补 PEM**（用 `PUBLIC KEY` 头）：`alipay-notify` 验签口径必须和这里完全一致，两处公钥 PEM 格式化方式不能有差别，否则验签失败。
- **网关由 `ALIPAY_ENV` 显式选择**，不按密钥类型推断：`sandbox` → 沙箱网关，其余（含缺省）→ 生产网关。缺省是 `production`；沙箱联调**必须**显式把 `ALIPAY_ENV` 设为 `sandbox`。
- **`keyType` 用 `detectKeyType` 的结果传给 SDK，不要写死**。应用私钥可能是 PKCS1 或 PKCS8，写死会在其中一种下签名失败。
- `signType` 固定 `RSA2`；`camelcase: true`，因此 SDK 返回字段是驼峰（`tradeNo` / `tradeStatus`），后续各册按驼峰读。
- 遇到 `invalid-signature` / 验签失败，**先查 `ALIPAY_ENV`/网关是否对应、公私钥 PEM 是否两处一致，再怀疑密钥格式**；`toPem` + `detectKeyType` 已处理 PKCS1/PKCS8，不要再手工转换密钥格式。

## 缺配置的处理

三项凭据缺任一项时，`sdk.sdkExec` / `exec` 会在签名阶段抛错。调用方在 `try/catch` 里用 item 7 的 `fail(...)` 兜底即可（返回 `INTERNAL_ERROR`），不要让函数崩成未捕获异常。

</SERVER_INIT>
