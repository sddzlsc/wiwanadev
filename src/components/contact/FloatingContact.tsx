import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Phone, Volume2, VolumeX } from 'lucide-react';
import WeChatDialog from '@/components/contact/WeChatDialog';
import { SITE } from '@/lib/site';

/**
 * 全站悬浮联系挂件 + 背景音乐控制
 * 右下角常驻：负责人信息卡、一键拨号、微信弹窗、音乐开关
 */
const FloatingContact: React.FC = () => {
  const [wxOpen, setWxOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 背景音乐：默认静音自动播放，规避浏览器自动播放限制
  useEffect(() => {
    const audio = new Audio('/audio/bgm.mp3');
    audio.loop = true;
    audio.muted = true;
    audio.volume = 0.35;
    audio.play().catch(() => {
      /* 静音自动播放被拦截时忽略，等待用户手动开启 */
    });
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    setMuted(next);
    audio.muted = next;
    if (!next) {
      audio.play().catch(() => setMuted(true));
    }
  };

  return (
    <>
      <aside
        aria-label="快捷联系"
        className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2 md:bottom-8"
      >
        {/* 负责人信息卡 */}
        <div className="hidden border border-border bg-card px-4 py-3 shadow-card md:block">
          <p className="text-sm font-medium text-foreground">
            {SITE.contactName} · {SITE.contactRole}
          </p>
          <a
            href={`tel:${SITE.phone}`}
            className="mt-1 block text-lg font-bold text-primary hover:text-accent"
          >
            {SITE.phone}
          </a>
          <p className="text-xs text-muted-foreground">电话 / 微信同号 · {SITE.region}</p>
        </div>

        <div className="flex flex-row items-center gap-2 md:flex-col">
          {/* 一键拨号（移动端友好） */}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-card"
                  aria-label={`一键拨号 ${SITE.phone}`}
                >
                  <a href={`tel:${SITE.phone}`}>
                    <Phone className="h-5 w-5" aria-hidden="true" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">一键拨号 {SITE.phone}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 微信二维码弹窗 */}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-12 w-12 rounded-full shadow-card"
                  aria-label="微信扫码咨询"
                  onClick={() => setWxOpen(true)}
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">微信扫码咨询</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 背景音乐开关 */}
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full shadow-card"
            aria-label={muted ? '开启背景音乐' : '关闭背景音乐'}
            onClick={toggleMute}
          >
            {muted ? (
              <VolumeX className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </aside>

      <WeChatDialog open={wxOpen} onOpenChange={setWxOpen} />
    </>
  );
};

export default FloatingContact;
