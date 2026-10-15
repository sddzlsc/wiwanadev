import React from 'react';
import { PROCESS_STEPS } from '@/lib/site';

/** 服务流程：四步交付流程时间线 */
const ProcessSection: React.FC = () => {
  return (
    <section
      id="process"
      aria-labelledby="process-title"
      className="border-b border-border bg-muted/50"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <header className="text-left md:text-center">
          <p className="sec-label text-muted-foreground">SEC.04 / PROCESS — 服务流程</p>
          <h2
            id="process-title"
            className="mt-3 text-balance text-xl font-bold text-foreground md:text-3xl"
          >
            四步标准交付流程，进度透明可控
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground">
            从需求沟通到交付验收，每个环节都有明确节点与负责人，北京本地可上门沟通，全国客户远程同步进度。
          </p>
        </header>

        <ol className="mt-12 grid gap-4 md:grid-cols-4">
          {PROCESS_STEPS.map((step, i) => (
            <li
              key={step.code}
              className="relative flex h-full flex-col border border-border bg-card p-6 shadow-card"
            >
              {/* 连接线（桌面） */}
              {i < PROCESS_STEPS.length - 1 && (
                <span
                  className="absolute right-0 top-1/2 hidden h-px w-4 translate-x-full bg-primary/30 md:block"
                  aria-hidden="true"
                />
              )}
              <span className="sec-label text-accent">{step.code}</span>
              <h3 className="mt-3 text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default ProcessSection;
