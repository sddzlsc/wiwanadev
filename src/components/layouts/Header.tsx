import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Phone } from 'lucide-react';
import { NAV_ITEMS, SITE } from '@/lib/site';

/** 顶部导航：桌面横排锚点，移动端抽屉菜单 */
const Header: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 md:px-8">
        {/* 品牌 */}
        <a href="#top" className="flex min-w-0 items-center gap-3" aria-label={SITE.companyName}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary font-mono text-sm font-bold text-primary-foreground" aria-hidden="true">
            WW
          </span>
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-base font-bold text-foreground">万维速达</span>
            <span className="sec-label truncate text-[10px] text-muted-foreground">
              WANWEI SUDA · BEIJING
            </span>
          </span>
        </a>

        {/* 桌面导航 */}
        <nav aria-label="主导航" className="ml-auto hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* 桌面联系按钮 */}
        <div className="hidden shrink-0 md:block">
          <Button asChild>
            <a href={`tel:${SITE.phone}`}>
              <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
              {SITE.phone}
            </a>
          </Button>
        </div>

        {/* 移动端菜单 */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto md:hidden"
              aria-label="打开导航菜单"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>{SITE.companyName}</SheetTitle>
            </SheetHeader>
            <nav aria-label="移动端导航" className="flex flex-col gap-1 px-4">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="min-h-12 rounded px-3 py-3 text-base font-medium text-foreground/80 hover:bg-muted hover:text-primary"
                >
                  {item.label}
                </a>
              ))}
              <Button asChild className="mt-4" size="lg">
                <a href={`tel:${SITE.phone}`}>
                  <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                  一键拨打 {SITE.phone}
                </a>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
