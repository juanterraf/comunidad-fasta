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

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="font-family: -apple-system, Segoe UI, sans-serif; background:#f8f4ed; color:#1a1814; margin:0; padding:24px;">
    <div style="max-width:560px; margin:0 auto; background:#fff; border:1px solid #e5dfd3; border-radius:8px; padding:24px;">
      <p style="font-size:12px; letter-spacing:2px; color:#6b6760; margin:0 0 16px; text-transform:uppercase;">Comunidad FASTA</p>
      <h1 style="font-size:22px; line-height:1.2; margin:0 0 16px; font-family:Georgia, serif;">${title}</h1>
      ${body}
      <hr style="border:none; border-top:1px solid #e5dfd3; margin:24px 0 12px;">
      <p style="font-size:11px; color:#6b6760; margin:0;">Comunidad FASTA es una iniciativa de familias. No es un sitio oficial de FASTA ni del Colegio Boisdron.</p>
    </div>
  </body></html>`;
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

Sí: ${args.link}?r=yes
No: ${args.link}?r=no

Un solo click, no responde nada más.

— Comunidad FASTA`;
    const html = shell(
      "¿Conocés a esta familia?",
      `<p>Hola ${escapeHtml(args.validatorName)},</p>
       <p>${escapeHtml(args.applicantName)} está sumando <strong>${escapeHtml(args.businessName)}</strong> a Comunidad FASTA. ¿Lo/la conocés de la comunidad?</p>
       <p style="margin:24px 0;">
         <a href="${escapeHtml(args.link)}" style="display:inline-block; background:#1a1814; color:#f8f4ed; padding:12px 20px; border-radius:8px; text-decoration:none;">Responder</a>
       </p>
       <p style="font-size:13px; color:#6b6760;">Un solo click, no responde nada más.</p>`,
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
    return {
      to: "",
      subject: "Recibimos tu pedido",
      text,
      html: shell(
        "Recibimos tu pedido",
        `<p>Hola ${escapeHtml(args.applicantName)},</p>
         <p>Avisamos a tres miembros de la comunidad. Cuando dos confirmen, tu emprendimiento sale al aire y te lo avisamos.</p>`,
      ),
    };
  },
  applicantApproved(args: {
    applicantName: string;
    businessName: string;
    publicUrl: string;
    editUrl: string;
  }): MailMessage {
    const text = `Hola ${args.applicantName},

"${args.businessName}" ya está publicado.
Verlo: ${args.publicUrl}
Editarlo: ${args.editUrl}

— Comunidad FASTA`;
    return {
      to: "",
      subject: "Tu emprendimiento ya está en Comunidad FASTA",
      text,
      html: shell(
        "Tu emprendimiento ya está publicado",
        `<p>Hola ${escapeHtml(args.applicantName)},</p>
         <p>Las confirmaciones llegaron y <strong>${escapeHtml(args.businessName)}</strong> ya está en Comunidad FASTA.</p>
         <p style="margin:16px 0;">
           <a href="${escapeHtml(args.publicUrl)}">Ver mi emprendimiento</a><br>
           <a href="${escapeHtml(args.editUrl)}">Editar mis datos</a>
         </p>`,
      ),
    };
  },
  editMagicLink(args: { link: string }): MailMessage {
    const text = `Hola,

Hacé click acá para editar tu emprendimiento (link válido por 24 horas):
${args.link}

Si no pediste esto, ignorá este mail.

— Comunidad FASTA`;
    return {
      to: "",
      subject: "Link para editar tu emprendimiento",
      text,
      html: shell(
        "Link para editar",
        `<p>Hacé click acá para editar tu emprendimiento. El link es válido por 24 horas y de un solo uso.</p>
         <p style="margin:24px 0;">
           <a href="${escapeHtml(args.link)}" style="display:inline-block; background:#1a1814; color:#f8f4ed; padding:12px 20px; border-radius:8px; text-decoration:none;">Editar mi emprendimiento</a>
         </p>
         <p style="font-size:13px; color:#6b6760;">Si no pediste esto, ignorá este mail.</p>`,
      ),
    };
  },
};
