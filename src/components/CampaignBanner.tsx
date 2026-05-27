import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getActiveCampaign } from "@/actions/campaigns";
import { Countdown } from "./Countdown";

export async function CampaignBanner() {
  const c = await getActiveCampaign();
  if (!c) return null;

  const href = c.ctaHref || `/explorar?campana=${c.slug}`;
  const cta = c.ctaText || "Ver participantes";

  return (
    <section
      className="border-b"
      style={{
        backgroundColor: `${c.colorHex}10`,
        borderColor: `${c.colorHex}30`,
      }}
    >
      <div className="max-w-6xl mx-auto px-5 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <div
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase self-start"
          style={{ backgroundColor: c.colorHex, color: "#fff" }}
        >
          Campaña activa
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-base md:text-lg font-semibold leading-tight">
            {c.title}
          </p>
          {c.description ? (
            <p className="text-sm text-[var(--color-ink-soft)] line-clamp-1">
              {c.description}
            </p>
          ) : null}
        </div>
        {c.endsAt ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--color-muted)]">Termina en</span>
            <Countdown to={c.endsAt.toISOString()} accent={c.colorHex} />
          </div>
        ) : null}
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium text-white whitespace-nowrap transition-opacity hover:opacity-90"
          style={{ backgroundColor: c.colorHex }}
        >
          {cta} <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
