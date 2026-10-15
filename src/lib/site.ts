// 站点公共配置：公司信息、联系方式与五大业务数据
export const SITE = {
  companyName: '北京万维速达科技有限公司',
  contactName: '李守聪',
  contactRole: '项目负责人',
  phone: '18315852058',
  wechat: '18315852058',
  region: '北京 · 全国远程交付',
};

export const NAV_ITEMS = [
  { label: '核心业务', href: '#services' },
  { label: '服务承诺', href: '#promise' },
  { label: '服务流程', href: '#process' },
  { label: '联系我们', href: '#contact' },
];

export interface Service {
  icon: string;
  code: string;
  title: string;
  keywords: string;
  description: string;
  scenarios: string[];
}

export const SERVICES: Service[] = [
  {
    icon: 'Smartphone',
    code: 'SVC.01',
    title: '微信小程序定制',
    keywords: '北京小程序外包',
    description:
      '面向零售、餐饮、教育、服务业的微信小程序定制开发，覆盖电商交易、会员体系、预约下单、营销裂变等核心场景，交付完整源码。',
    scenarios: ['商城/团购小程序', '预约到店服务', '企业内部工具小程序'],
  },
  {
    icon: 'Globe',
    code: 'SVC.02',
    title: '企业官网建设',
    keywords: '北京网站建设',
    description:
      '品牌官网与营销型网站建设，兼顾视觉设计与搜索引擎收录规范，TDK 与语义化结构友好，助力企业获客转化。',
    scenarios: ['品牌展示官网', '营销落地页', '响应式多端适配'],
  },
  {
    icon: 'AppWindow',
    code: 'SVC.03',
    title: '原生/跨平台APP开发',
    keywords: '北京APP开发',
    description:
      'iOS / Android 双端原生开发与 React Native、Flutter 跨平台方案，按业务规模与预算灵活选型，控制成本缩短周期。',
    scenarios: ['电商与本地生活APP', '企业移动办公', 'IoT 配套应用'],
  },
  {
    icon: 'Bot',
    code: 'SVC.04',
    title: 'AI智能体搭建',
    keywords: 'AI智能体定制',
    description:
      '基于大模型能力搭建业务智能体：智能客服、知识库问答、自动化工作流，让 AI 真正接入业务流程产生价值。',
    scenarios: ['智能客服问答', '企业知识库助手', '营销内容自动生成'],
  },
  {
    icon: 'Server',
    code: 'SVC.05',
    title: '大模型本地私有化部署',
    keywords: '北京大模型私有化部署',
    description:
      '主流开源大模型本地算力适配与私有化部署，数据不出内网，为企业构建安全可控的专属 AI 基础设施。',
    scenarios: ['内网知识问答系统', '数据敏感行业私有AI', 'GPU算力选型与调优'],
  },
];

export const HERO_SELLING_POINTS = [
  { icon: 'MapPin', title: '支持全国远程交付', desc: '北京本地 + 全国远程，流程标准化' },
  { icon: 'Zap', title: '最快1小时源码交付', desc: '轻量需求极速响应，即谈即交付' },
  { icon: 'Wallet', title: '高性价比', desc: '报价透明，无隐性费用' },
];

export const PROMISE_GUARDS = [
  { icon: 'Clock', title: '1天内免费出Demo', desc: '需求确认后1个工作日内产出可演示Demo' },
  { icon: 'ShieldCheck', title: '满意再付定金', desc: 'Demo满意才签约付款，主动权在您手中' },
  { icon: 'CircleDollarSign', title: '不满意零费用', desc: '对Demo不满意即终止，不收取任何费用' },
];

export const PROCESS_STEPS = [
  { code: 'STEP.01', title: '需求沟通', desc: '电话/微信沟通业务目标，免费评估报价与周期' },
  { code: 'STEP.02', title: '免费出Demo', desc: '1天内产出可演示Demo，满意再付定金' },
  { code: 'STEP.03', title: '签约开发', desc: '阶段付款透明可控，进度节点实时同步' },
  { code: 'STEP.04', title: '交付验收', desc: '交付完整源码与文档，提供上线部署支持' },
];

export const TRUST_STATS = [
  { value: '1小时', label: '轻量需求最快源码交付' },
  { value: '1天', label: '免费Demo产出周期' },
  { value: '0费用', label: '不满意零风险承诺' },
  { value: '5大', label: '核心业务全链路覆盖' },
];
