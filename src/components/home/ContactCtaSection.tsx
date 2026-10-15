import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SITE } from '@/lib/site';

interface ContactCtaSectionProps {
  onOpenWechat: () => void;
}

/** 联系转化区：电话 + 微信 双通道 */
const ContactCtaSection: React.FC<ContactCtaSectionProps> = ({ onOpenWechat }) => {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="blueprint-grid"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <div className="annotation-box mx-auto max-w-3xl p-8 text-center md:p-12">
          <p className="sec-label text-muted-foreground">SEC.05 / CONTACT — 立即咨询</p>
          <h2
            id="contact-title"
            className="mt-3 text-balance text-xl font-bold text-foreground md:text-3xl"
          >
            免费评估您的项目需求
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground">
            负责人{SITE.contactName}直接对接，电话/微信同号{SITE.phone}。
            北京本地可当面沟通，全国支持远程交付。
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-8">
              <a href={`tel:${SITE.phone}`}>
                <Phone className="mr-2 h-5 w-5" aria-hidden="true" />
                一键拨打 {SITE.phone}
              </a>
            </Button>
            <Button variant="secondary" size="lg" className="h-12 px-8" onClick={onOpenWechat}>
              <MessageCircle className="mr-2 h-5 w-5" aria-hidden="true" />
              微信扫码咨询
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            服务承诺：1天内免费出Demo，满意再付定金，不满意零费用
          </p>
        </div>
      </div>
    </section>
  );
};

export default ContactCtaSection;
