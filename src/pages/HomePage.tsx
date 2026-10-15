import React, { useState } from 'react';
import HeroSection from '@/components/home/HeroSection';
import PromiseSection from '@/components/home/PromiseSection';
import ServicesSection from '@/components/home/ServicesSection';
import ProcessSection from '@/components/home/ProcessSection';
import ContactCtaSection from '@/components/home/ContactCtaSection';
import WeChatDialog from '@/components/contact/WeChatDialog';

/** 首页：首屏卖点 → 零风险承诺 → 业务矩阵 → 流程 → 联系转化 */
const HomePage: React.FC = () => {
  const [wxOpen, setWxOpen] = useState(false);

  return (
    <main>
      <HeroSection />
      <PromiseSection />
      <ServicesSection />
      <ProcessSection />
      <ContactCtaSection onOpenWechat={() => setWxOpen(true)} />
      <WeChatDialog open={wxOpen} onOpenChange={setWxOpen} />
    </main>
  );
};

export default HomePage;
