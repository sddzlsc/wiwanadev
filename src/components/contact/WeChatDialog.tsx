import React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy } from 'lucide-react';
import { SITE } from '@/lib/site';

/** 用户提供的真实微信二维码图（直接引用 CDN 地址） */
export const WECHAT_QR_URL =
  'https://miaoda-conversation-file.cdn.bcebos.com/user-b9ldy6gqw5xc/app-f3yq6vk6ps01/20261015/535f775bb93972f961ab9f1338fea176_1792074731760.jpg';

interface WeChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 微信二维码弹窗：扫码或复制微信号 */
const WeChatDialog: React.FC<WeChatDialogProps> = ({ open, onOpenChange }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SITE.wechat);
      toast.success('微信号已复制，请在微信中添加好友');
    } catch {
      toast.error('复制失败，请手动复制微信号');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
        <DialogHeader>
          <DialogTitle>微信咨询</DialogTitle>
          <DialogDescription>
            负责人：{SITE.contactName}（{SITE.contactRole}）
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <figure className="w-full max-w-[260px] border border-border bg-white p-2">
            <img
              src={WECHAT_QR_URL}
              alt="李守聪微信二维码，扫码添加好友咨询软件开发"
              className="w-full object-contain"
              loading="lazy"
            />
            <figcaption className="mt-2 text-center text-xs text-muted-foreground">
              扫码添加微信，备注「软件开发咨询」
            </figcaption>
          </figure>
          <p className="text-sm text-muted-foreground">
            微信号：<span className="font-medium text-foreground">{SITE.wechat}</span>（微信同号）
          </p>
          <Button onClick={handleCopy} className="w-full">
            <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
            复制微信号
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WeChatDialog;
