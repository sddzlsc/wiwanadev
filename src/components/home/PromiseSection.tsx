import React from 'react';
import { Clock, ShieldCheck, CircleDollarSign, type LucideIcon } from 'lucide-react';
import { PROMISE_GUARDS } from '@/lib/site';

const ICONS: Record<string, LucideIcon> = { Clock, ShieldCheck, CircleDollarSign };

/** 零风险承诺区：三个保障点 + 大标语 */
const PromiseSection: React.FC = () => {
  return (
    <section
      id="promise"
      aria-labelledby="promise-title"
      className="border-b border-border bg-muted/50"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <header className="text-left md:text-center">
          <p className="sec-label text-muted-foreground">SEC.02 / PROMISE — 零风险服务承诺</p>
          <h2
            id="promise-title"
            className="mx-auto mt-3 max-w-3xl text-balance text-xl font-bold text-foreground md:text-3xl"
          >
            1天内免费出Demo，满意再付定金，不满意零费用
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground">
            我们把交付风险留给自己，把选择权交给客户。先看到效果，再决定是否合作——这是对北京软件开发服务质量最有力的承诺。
          </p>
        </header>

        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {PROMISE_GUARDS.map((g) => {
            const Icon = ICONS[g.icon];
            return (
              <li
                key={g.title}
                className="flex h-full flex-col border border-border bg-card p-6 shadow-card transition-transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="h-6 w-6 text-accent" aria-hidden="true" />}
                  <h3 className="text-base font-semibold text-foreground">{g.title}</h3>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {g.desc}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default PromiseSection;
