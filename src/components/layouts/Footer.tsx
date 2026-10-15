import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SITE } from '@/lib/site';

/** 页尾：公司信息、业务导航、联系方式与版权 */
const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-muted/60">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
        {/* 公司信息 */}
        <section>
          <h2 className="text-base font-bold text-foreground">{SITE.companyName}</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            专注北京软件开发、北京小程序外包与企业官网建设，提供原生/跨平台APP开发、AI智能体搭建与北京大模型私有化部署服务，支持全国远程交付，最快1小时源码交付。
          </p>
        </section>

        {/* 核心业务导航 */}
        <nav aria-label="页尾业务导航">
          <h2 className="text-base font-bold text-foreground">核心业务</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>微信小程序定制开发</li>
            <li>企业官网 / 营销型网站建设</li>
            <li>原生 / 跨平台APP开发</li>
            <li>AI智能体搭建</li>
            <li>大模型本地私有化部署</li>
          </ul>
        </nav>

        {/* 联系方式 */}
        <address className="not-italic">
          <h2 className="text-base font-bold text-foreground">联系我们</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {SITE.contactRole}：{SITE.contactName}
          </p>
          <p className="mt-1 text-sm">
            <a
              href={`tel:${SITE.phone}`}
              className="flex items-center font-medium text-primary hover:text-accent"
            >
              <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
              {SITE.phone}（电话 / 微信同号）
            </a>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">服务区域：{SITE.region}</p>
        </address>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} {SITE.companyName} 版权所有</p>
          <p>北京软件开发 · 北京小程序外包 · 北京大模型私有化部署</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
