import { createTransport, type Transporter } from "nodemailer";
import { escapeHtml } from "@/lib/html";

let cached: Transporter | null = null;

function transporter(): Transporter {
  if (cached) return cached;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  cached = createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
  });
  return cached;
}

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendMail(msg: MailMessage): Promise<void> {
  const from = process.env.SMTP_FROM ?? "Comunidad FASTA <noreply@localhost>";
  if (!process.env.SMTP_HOST) {
    console.log("[mail:dev] to=%s subject=%s\n%s", msg.to, msg.subject, msg.text);
    return;
  }
  try {
    await transporter().sendMail({
      from,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
  } catch (err) {
    console.error("[mail] failed:", err);
    console.log("[mail:fallback] to=%s subject=%s\n%s", msg.to, msg.subject, msg.text);
  }
}

// Paleta consistente con el sitio. Hex literal (sin var) porque los
// mail clients no resuelven custom properties CSS.
const C = {
  bg: "#f7f2ea",
  surface: "#ffffff",
  ink: "#11100d",
  inkSoft: "#25221d",
  muted: "#625a50",
  subtle: "#8c8579",
  border: "#ded6c8",
  accent: "#c84d2f",
} as const;

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

function eyebrow(text: string): string {
  return `<p style="font-family:${FONT_STACK}; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:${C.muted}; font-weight:500; margin:0 0 28px;">${escapeHtml(text)}</p>`;
}

function h1(text: string): string {
  return `<h1 style="font-family:${FONT_STACK}; font-size:30px; line-height:1.05; letter-spacing:-0.025em; font-weight:700; color:${C.ink}; margin:0 0 20px;">${text}</h1>`;
}

function p(html: string, opts?: { muted?: boolean; small?: boolean }): string {
  const size = opts?.small ? "13px" : "16px";
  const color = opts?.muted ? C.muted : C.inkSoft;
  return `<p style="font-family:${FONT_STACK}; font-size:${size}; line-height:1.55; color:${color}; margin:0 0 16px;">${html}</p>`;
}

function button(href: string, label: string, variant: "primary" | "accent" = "primary"): string {
  const bg = variant === "accent" ? C.accent : C.ink;
  const fg = variant === "accent" ? "#ffffff" : C.bg;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 8px;"><tr><td style="background:${bg};"><a href="${escapeHtml(href)}" style="display:inline-block; padding:14px 28px; font-family:${FONT_STACK}; font-size:15px; font-weight:500; color:${fg}; text-decoration:none; letter-spacing:0; line-height:1;">${escapeHtml(label)}</a></td></tr></table>`;
}

function linkInline(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="color:${C.ink}; font-weight:500; text-decoration:underline; text-decoration-color:${C.border}; text-underline-offset:3px;">${escapeHtml(label)}</a>`;
}

function shell(eyebrowText: string, title: string, bodyHtml: string): string {
  const wordmark = `Comunidad <span style="color:${C.accent};">FASTA</span>`;
  const disclaimer =
    "Comunidad FASTA es una iniciativa de familias. No es un sitio oficial de FASTA ni del Colegio Boisdron.";
  return `<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="background:${C.bg}; color:${C.ink}; margin:0; padding:32px 16px; font-family:${FONT_STACK};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width:580px; margin:0 auto;">
<tr>
<td style="background:${C.surface}; border:1px solid ${C.border}; padding:40px 36px;">
${eyebrow(eyebrowText)}
${h1(title)}
${bodyHtml}
</td>
</tr>
<tr>
<td style="padding:24px 36px 0;">
<p style="font-family:${FONT_STACK}; font-size:14px; font-weight:700; color:${C.ink}; margin:0 0 8px; letter-spacing:-0.01em;">${wordmark}</p>
<p style="font-family:${FONT_STACK}; font-size:11px; line-height:1.5; color:${C.subtle}; margin:0;">${escapeHtml(disclaimer)}</p>
</td>
</tr>
</table>
</body>
</html>`;
}

export const templates = {
  validationRequest(args: {
    validatorName: string;
    applicantName: string;
    businessName: string;
    link: string;
  }): MailMessage {
    const text = `Hola ${args.validatorName},

${args.applicantName} está sumando "${args.businessName}" a Comunidad FASTA.
¿Lo/la conocés de la comunidad?

Respondé desde acá: ${args.link}

Un solo click, no responde nada más.

— Comunidad FASTA`;
    const html = shell(
      "Pedido de validación",
      "¿Conocés a esta familia?",
      `${p(`Hola ${escapeHtml(args.validatorName)},`)}
       ${p(`<strong style="color:${C.ink}; font-weight:600;">${escapeHtml(args.applicantName)}</strong> está sumando <strong style="color:${C.ink}; font-weight:600;">${escapeHtml(args.businessName)}</strong> a Comunidad FASTA. ¿Lo/la conocés de la comunidad?`)}
       ${button(args.link, "Responder con un click")}
       ${p("Un solo click. No tenés que escribir nada.", { muted: true, small: true })}`,
    );
    return {
      to: "",
      subject: `¿Conocés a ${args.applicantName} de la comunidad?`,
      text,
      html,
    };
  },

  applicantAck(args: { applicantName: string; businessName: string }): MailMessage {
    const text = `Hola ${args.applicantName},

Recibimos tu pedido para sumar "${args.businessName}" a Comunidad FASTA.
Avisamos a tres miembros de la comunidad. Cuando dos confirmen, sale al aire y te avisamos.

— Comunidad FASTA`;
    const html = shell(
      "Recibimos tu pedido",
      "Tu emprendimiento está en camino.",
      `${p(`Hola ${escapeHtml(args.applicantName)},`)}
       ${p(`Recibimos tu pedido para sumar <strong style="color:${C.ink}; font-weight:600;">${escapeHtml(args.businessName)}</strong>.`)}
       ${p("Avisamos a las tres familias que elegiste como validadoras. Cuando dos confirmen, tu emprendimiento sale al aire y te avisamos por mail.")}`,
    );
    return {
      to: "",
      subject: "Recibimos tu pedido",
      text,
      html,
    };
  },

  applicantApproved(args: {
    applicantName: string;
    businessName: string;
    publicUrl: string;
    editUrl: string;
  }): MailMessage {
    const text = `Hola ${args.applicantName},

"${args.businessName}" ya está publicado en Comunidad FASTA.

Verlo: ${args.publicUrl}
Editarlo: ${args.editUrl}

— Comunidad FASTA`;
    const html = shell(
      "Ya está al aire",
      "Tu emprendimiento ya está publicado.",
      `${p(`Hola ${escapeHtml(args.applicantName)},`)}
       ${p(`Las confirmaciones llegaron. <strong style="color:${C.ink}; font-weight:600;">${escapeHtml(args.businessName)}</strong> ya aparece en Comunidad FASTA.`)}
       ${button(args.publicUrl, "Ver mi emprendimiento", "accent")}
       ${p(`También podés ${linkInline(args.editUrl, "editar tus datos")} cuando quieras. Ese link queda válido durante 30 días.`, { muted: true, small: true })}`,
    );
    return {
      to: "",
      subject: "Tu emprendimiento ya está en Comunidad FASTA",
      text,
      html,
    };
  },

  editMagicLink(args: { link: string }): MailMessage {
    const text = `Hola,

Pediste editar tu emprendimiento en Comunidad FASTA.
Hacé click acá para entrar (el link es válido por 24 horas y de un solo uso):
${args.link}

Si no pediste esto, ignorá este mail.

— Comunidad FASTA`;
    const html = shell(
      "Editar mi emprendimiento",
      "Listo para entrar.",
      `${p("Pediste editar tu emprendimiento. Hacé click abajo para abrir el panel.")}
       ${button(args.link, "Entrar a editar")}
       ${p("El link es válido por 24 horas y de un solo uso. Si no fuiste vos, simplemente ignorá este mail y nadie va a acceder.", { muted: true, small: true })}`,
    );
    return {
      to: "",
      subject: "Link para editar tu emprendimiento",
      text,
      html,
    };
  },
};
