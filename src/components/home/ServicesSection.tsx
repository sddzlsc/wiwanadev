import React from 'react';
import { Smartphone, Globe, AppWindow, Bot, Server, type LucideIcon } from 'lucide-react';
import { SERVICES } from '@/lib/site';

const ICONS: Record<string, LucideIcon> = { Smartphone, Globe, AppWindow, Bot, Server };

/** 核心业务矩阵：五大业务模块（前2个占宽，后3个三等分） */
const ServicesSection: React.FC = () => {
  return (
    <section
      id="services"
      aria-labelledby="services-title"
      className="blueprint-grid border-b border-border"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <header className="text-left md:text-center">
          <p className="sec-label text-muted-foreground">SEC.03 / SERVICES — 核心业务矩阵</p>
          <h2
            id="services-title"
            className="mt-3 text-balance text-xl font-bold text-foreground md:text-3xl"
          >
            五大核心业务，覆盖企业数字化全链路
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground">
            从微信小程序定制到北京大模型私有化部署，每个业务模块均以源码交付为标准，兼顾北京本地与全国远程交付需求。
          </p>
        </header>

        <div className="mt-12 grid gap-4 md:grid-cols-6">
          {/* 前两大业务：各占3列 */}
          {SERVICES.slice(0, 2).map((svc) => {
            const Icon = ICONS[svc.icon];
            return (
              <article
                key={svc.code}
                className="flex h-full flex-col border border-border bg-card p-6 shadow-card transition-colors hover:border-accent md:col-span-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-6 w-6 text-accent" aria-hidden="true" />}
                    <h3 className="text-lg font-semibold text-foreground">{svc.title}</h3>
                  </div>
                  <span className="sec-label text-muted-foreground">{svc.code}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-accent">{svc.keywords}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {svc.description}
                </p>
                <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${svc.title}落地场景`}>
                  {svc.scenarios.map((sc) => (
                    <li
                      key={sc}
                      className="border border-border bg-muted px-3 py-1 text-xs text-foreground/80"
                    >
                      {sc}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}

          {/* 后三大业务：各2列 */}
          {SERVICES.slice(2).map((svc) => {
            const Icon = ICONS[svc.icon];
            return (
              <article
                key={svc.code}
                className="flex h-full flex-col border border-border bg-card p-6 shadow-card transition-colors hover:border-accent md:col-span-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-6 w-6 text-accent" aria-hidden="true" />}
                    <h3 className="text-base font-semibold text-foreground">{svc.title}</h3>
                  </div>
                  <span className="sec-label text-muted-foreground">{svc.code}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-accent">{svc.keywords}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {svc.description}
                </p>
                <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${svc.title}落地场景`}>
                  {svc.scenarios.map((sc) => (
                    <li
                      key={sc}
                      className="border border-border bg-muted px-3 py-1 text-xs text-foreground/80"
                    >
                      {sc}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
