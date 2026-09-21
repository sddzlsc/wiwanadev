# 支付宝 App 支付 — 客户端（@jayming/expo-alipay）

> 本册属于 `alipay-integration` skill 的 App 平台分支。**先读 [`app.md`](app.md)**。
> 本册覆盖：Required item 6 —— 依赖 / `app.json` scheme 三处一致 / `setAppId` / 支付流程 / web + 未安装拦截 / 结果码兜底。
> item 编号全局连续、故意不重排。

<CLIENT>

**6. 客户端集成（Expo / React Native）**

## 依赖与导入

| 层级 | 依赖 | 版本 |
| --- | --- | --- |
| Expo | `expo` | 55.0.6 |
| 桥接层 | `@jayming/expo-alipay` | `^1.3.0` |

用到的 API：`setAlipayScheme`、`setSandboxEnabled`、`isAlipayInstalled`、`pay`、`setAppId`。

**默认导入，不是命名空间导入**（`import ExpoAlipay from "..."`，不是 `import * as ExpoAlipay`）。但**业务代码不要直接 import 包名**——`@jayming/expo-alipay` 是原生模块，顶层 import 在 web 预览会加载即崩、`handlePay` 里的运行时 web 拦截来不及生效。改从下面「web 预览兼容」里的平台分文件别名导入。

## web 预览兼容（必做）

用 Expo 的**平台分文件**机制隔离原生模块：原生端加载真实模块、web 端加载 no-op stub。Metro 打包时自动按平台选文件，**不用改 metro.config**。

`src/lib/alipay.native.ts`（原生端，真实实现）：

```typescript
import ExpoAlipay from "@jayming/expo-alipay";
export default ExpoAlipay;
```

`src/lib/alipay.web.ts`（web 端 stub，方法空实现 / 安全返回）：

```typescript
export default {
  setAlipayScheme() {},
  setAppId() {},
  setSandboxEnabled() {},
  async isAlipayInstalled() { return false; },       // web 恒 false，配合 handlePay 的 web 拦截
  async pay() { return { resultStatus: "" }; },
};
```

业务代码（含下面的 `checkout.tsx`）统一 `import ExpoAlipay from "@/lib/alipay"`（**不带扩展名**）——web 打包选 `.web.ts`、原生打包选 `.native.ts`，顶层不再直接触碰原生模块。

## app.json —— scheme 三处必须完全一致（设计原则 12）

```json
{
  "expo": {
    "scheme": "<APP_SCHEME>",
    "plugins": [
      ["@jayming/expo-alipay", { "scheme": "<APP_SCHEME>" }]
    ]
  }
}
```

`<APP_SCHEME>` 是每个 App 自有的唯一 URL Scheme，由 Agent 按应用生成。**顶层 `expo.scheme` = 插件参数 `scheme` = 客户端 `setAlipayScheme(...)` 入参**，三处任一不一致，iOS 支付完回跳无法命中本 App。

## APPID 注入

项目根目录 `.env`：

```
EXPO_PUBLIC_ALIPAY_APP_ID=<支付宝_APP_ID>
```

- 客户端只读**公开 APPID** `EXPO_PUBLIC_ALIPAY_APP_ID`，其值与服务端 `ALIPAY_MOBILE_APP_APP_ID` 属于同一支付宝应用。私钥/支付宝公钥**永不下发客户端**。
- Expo 打包时把 `EXPO_PUBLIC_` 变量**静态内联**进客户端代码；已安装的 App 不在运行时重读 `.env`。因此每次改这个变量都**必须重新构建并安装 App**。

## 收银台调用 src/app/(app)/checkout.tsx

```typescript
import { Platform } from "react-native";
import ExpoAlipay from "@/lib/alipay";           // 平台分文件别名，不直接 import 包名（见 web 预览兼容）
import { supabase } from "@/client/supabase";

const ALIPAY_APP_ID = process.env.EXPO_PUBLIC_ALIPAY_APP_ID;

// 启动时设 scheme：iOS 生效，Android 空操作但保留调用，无平台分支
useEffect(() => {
  ExpoAlipay.setAlipayScheme("<APP_SCHEME>");   // 与 app.json 的 expo.scheme 一致
  if (ALIPAY_APP_ID) ExpoAlipay.setAppId(ALIPAY_APP_ID);
}, []);

const handlePay = async () => {
  // 1) Web 环境拦截，必须在 isAlipayInstalled 之前（web 端 isAlipayInstalled 恒 false）
  if (Platform.OS === "web") {
    setError("当前环境无法体验支付宝支付，请打包安装后再试");
    return;
  }
  // 2) 未安装支付宝拦截
  const isInstalled = await ExpoAlipay.isAlipayInstalled();
  if (!isInstalled) {
    setError("当前设备未安装支付宝 APP，请安装后再试");
    return;
  }
  // 3) 创建订单拿 orderStr
  const { data, error: fnErr } = await supabase.functions.invoke("alipay-pay", {
    body: {
      action: "create", outTradeNo, subject: productName,
      amount: amount.toFixed(2), productId, productName,
      productImage: productImage ?? "", deviceId: getDeviceId(),
    },
  });
  if (fnErr) throw new Error(await fnErr.context?.text?.() ?? fnErr.message);
  const { orderStr, isSandbox } = data?.data ?? {};
  if (!orderStr) throw new Error("获取支付参数失败");   // assert 不要 test

  // 4) 动态设沙箱开关，Android 生效；每次用响应里最新的 isSandbox
  ExpoAlipay.setSandboxEnabled(isSandbox);

  // 5) 唤起支付宝
  const result = await ExpoAlipay.pay(orderStr);
  const rs = result.resultStatus ?? "";
  if (rs === "9000" || rs === "8000" || rs === "6004") {
    await queryStatus();                 // 结果不确定：主动查询兜底
  } else if (rs === "6001") {
    setResultMsg("已取消支付");          // 用户取消，不算错误
  } else if (rs === "4000") {
    throw new Error("支付失败，请检查支付宝账户余额后重试");
  } else if (rs === "6002") {
    throw new Error("网络连接异常，请检查网络后重试");
  } else {
    await queryStatus();                 // 其余一律查询兜底
  }
};
```

## 查询兜底 queryStatus

```typescript
const queryStatus = async () => {
  const { data } = await supabase.functions.invoke("alipay-pay", {
    body: { action: "query", outTradeNo },
  });
  const ts = data?.data?.tradeStatus ?? "";
  if (ts === "TRADE_SUCCESS" || ts === "TRADE_FINISHED") {
    // 支付成功，跳转订单页
  } else {
    // 结果确认中，提示稍后在订单页查询
  }
};
```

## 关键约定

- **同步 `resultStatus` 不可信**（设计原则 8）：`9000` 也不代表到账，`9000/8000/6004` 及**未知码**一律走 `queryStatus` 兜底；`6001` 视为用户取消（不是错误）；只有 `4000`/`6002` 直接报错。到账判定只认 `query` 或异步通知。
- **`outTradeNo` 客户端生成并保存**：格式 `MD_` + 时间戳 + 随机串，发起支付前存进组件 state。`pay()` 返回值只有 `resultStatus` / `result` / `memo`，**不含订单号**，业务层必须自己保留关联。
- **`amount` 以 `toFixed(2)` 字符串传给服务端**，服务端再 `Number(...).toFixed(2)` 用于 `total_amount`。
- **`setSandboxEnabled` 每次下单都用响应里最新的 `isSandbox`**：后端切了环境，下一笔订单自动纠正客户端开关。
- **不做 H5 兜底**（设计原则）：web 和未安装两种场景都在 `pay` 前直接拦截弹提示，不降级到 H5。web 拦截**必须**在 `isAlipayInstalled` 之前，因为 web 端它恒为 false。

</CLIENT>
