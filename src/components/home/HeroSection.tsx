import React from 'react';
import { ArrowDown, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HERO_SELLING_POINTS, SITE, TRUST_STATS } from '@/lib/site';
import {
  MapPin,
  Zap,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = { MapPin, Zap, Wallet };

/** 首页首屏：品牌定位、核心卖点、信任数据 */
const HeroSection: React.FC = () => {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="blueprint-grid border-b border-border"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-4 py-16 md:grid-cols-[3fr_2fr] md:px-8 md:py-24">
        {/* 左侧：主文案 */}
        <div>
          <p className="sec-label text-muted-foreground">SEC.01 / HERO — 北京软件开发公司</p>
          <h1
            id="hero-title"
            className="mt-4 text-balance text-2xl font-bold leading-tight text-foreground md:text-4xl"
          >
            {SITE.companyName}
            <span className="mt-2 block text-accent">一站式软件开发 · 源码极速交付</span>
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            我们提供北京软件开发、北京小程序外包、企业官网建设、APP开发、AI智能体搭建与北京大模型私有化部署服务，支持全国远程交付，以工程化标准保障每一次交付。
          </p>

          {/* 三大卖点 */}
          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {HERO_SELLING_POINTS.map((p) => {
              const Icon = ICONS[p.icon];
              return (
                <li
                  key={p.title}
                  className="border border-border bg-card p-4 shadow-card transition-colors hover:border-accent"
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-5 w-5 text-accent" aria-hidden="true" />}
                    <h2 className="text-sm font-semibold text-foreground">{p.title}</h2>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
                </li>
              );
            })}
          </ul>

          {/* 行动按钮 */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-8">
              <a href={`tel:${SITE.phone}`}>
                <Phone className="mr-2 h-5 w-5" aria-hidden="true" />
                一键拨打 {SITE.phone}
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg" className="h-12 px-8">
              <a href="#services">
                查看核心业务
                <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>

        {/* 右侧：信任数据卡（图纸标注风） */}
        <div className="flex items-center">
          <div className="annotation-box w-full p-6 md:p-8">
            <p className="sec-label text-muted-foreground">DELIVERY.INDEX</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6">
              {TRUST_STATS.map((s) => (
                <div key={s.label}>
                  <dt className="order-2 mt-1 text-xs text-muted-foreground">{s.label}</dt>
                  <dd className="text-2xl font-bold text-primary md:text-3xl">{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 border-t border-dashed border-primary/40 pt-4 text-xs leading-relaxed text-muted-foreground">
              承诺：1天内免费出Demo，满意再付定金，不满意零费用。源码全部交付，自主可控。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
