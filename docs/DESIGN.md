# DESIGN.md — 北京万维速达科技有限公司企业官网

## Vibe
- Blueprint 工程蓝图 × Swiss 网格排版（软件工程图纸气质：细网格、坐标刻度、标注线、等宽数据感），传递"专业、精确、可交付"的信任感

## Color
- Primary: #203159 (深海军蓝)
- On Primary: #FFFFFF
- Accent: #0369A1 (工程青蓝)
- On Accent: #FFFFFF
- Background: #FAFAF9
- Foreground: #0F172A
- Muted: #F2F0EC
- Border: #E3E2DE
- Secondary: #334155
- 色彩规则：Primary/Accent 仅用于按钮/图标/激活态/标注线等小面积；大面积一律中性 Background/Muted；深蓝承载信任，青蓝承载科技动感，色相差明显；卡面/边框与背景对比 ≥ 3:1

## Typography
- Heading: GlowSansSC-Normal (family: 'GlowSansSC-Normal', weight: 500/700, url: https://resource-static.bj.bcebos.com/fonts-skill/GlowSansSC-Normal-{Medium|Bold}.woff2)
- Body: Noto Sans SC (family: 'Noto Sans SC', weight: 400/500, url: https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap)

## Visual Language
- 核心视觉签名：Blueprint 网格底纹 + 坐标标注线——Hero 区背景为细网格（repeating-linear-gradient 1px 线）叠十字刻度标记，区块标题左侧带"图纸编号"式等宽小标（如 SEC.02 / SERVICES），工程图纸气质独有
- 材质与深度：卡片用极浅 1px 边框 + 微弱投影分层；重要承诺区用 Muted 底 + 虚线标注框（图纸尺寸标注样式）包边，非大色块
- 容器与按钮：卡片直角偏小圆角(4px)；主按钮 Primary 实底白字，次按钮 Muted 底 Foreground 字；激活态用 Accent 左侧短标注线
- 布局节奏：Hero 左对齐非对称（左文右图纸网格视觉），卖点用"刻度条"横排；业务矩阵 2+3 网格避免三等宽；留白与密集交替

## Animation
- 入场：Hero 标题与刻度条自左向右依次淡入上移（80ms 阶梯延迟，共 400ms）
- 交互：卡片 hover 轻微上移 + 边框转 Accent；按钮 hover 亮度微升
- 滚动：区块进入视口时 fade-in 上移（tailwindcss-intersect）

## Forbidden
- 禁大块纯色铺底与渐变背景充当视觉主体（Hero 用网格纹理+浅底）
- 禁圆角大卡片+通用投影+左色条容器套路；禁 Emoji 图标
- 禁循环装饰动效与 hero 装饰噪音（编号 eyebrow/滚动提示/装饰圆点）

## Additional Notes
- 所有文案中文；TDK 融入"北京软件开发/北京小程序外包/北京大模型私有化部署"关键词
- 语义化结构：header/nav/main/section/article/footer + h1-h3 层级
- 留资表单数据存 Supabase；移动端悬浮挂件含一键拨号 tel: 链接
