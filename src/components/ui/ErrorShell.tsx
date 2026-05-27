import type { ReactNode } from "react";

export function ErrorShell({
  eyebrow,
  title,
  body,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  body: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="max-w-2xl mx-auto px-5 md:px-8 pt-20 md:pt-32 pb-20 text-center">
      <p className="editorial-rule inline-flex mb-6">{eyebrow}</p>
      <h1 className="display-xl text-5xl sm:text-6xl md:text-7xl mb-6">{title}</h1>
      <div className="text-[var(--color-muted)] text-lg md:text-xl leading-relaxed max-w-lg mx-auto">
        {body}
      </div>
      {actions ? (
        <div className="flex flex-wrap justify-center items-center gap-5 mt-12">
          {actions}
        </div>
      ) : null}
    </section>
  );
}
