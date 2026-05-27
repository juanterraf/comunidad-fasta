import "./_env";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "./index";
import {
  adminUsers,
  businesses,
  campaigns,
  categories,
  events,
  families,
  reactions,
  validationRequests,
} from "./schema";
import { slugify } from "@/lib/slugify";
import bcrypt from "bcrypt";
import { processAndStore, writePlaceholder } from "@/lib/images";
import { sql } from "drizzle-orm";

async function storeBusinessPhoto(
  id: string,
  slug: string,
  fallbackColor: string,
): Promise<void> {
  const photoPath = path.join(process.cwd(), "seed", "businesses-photos", `${slug}.jpg`);
  try {
    const buf = await readFile(photoPath);
    await processAndStore(id, buf);
  } catch {
    await writePlaceholder(id, fallbackColor);
  }
}

const CATEGORIES: Array<{ name: string; icon: string }> = [
  { name: "Alimentos y bebidas", icon: "meat" },
  { name: "Indumentaria y accesorios", icon: "shirt" },
  { name: "Servicios del hogar", icon: "home" },
  { name: "Salud y bienestar", icon: "heart" },
  { name: "Educación y clases", icon: "book" },
  { name: "Diseño y oficios", icon: "tools" },
  { name: "Servicios profesionales", icon: "briefcase" },
  { name: "Tecnología", icon: "device-laptop" },
  { name: "Eventos y catering", icon: "calendar" },
  { name: "Belleza y cuidado personal", icon: "scissors" },
  { name: "Niños y juegos", icon: "puzzle" },
  { name: "Otros", icon: "dots" },
];

const FAMILIES: Array<{ email: string; name: string; role: string; phone?: string }> = [
  { email: "perez@familias.local", name: "Pérez Romero", role: "familia" },
  { email: "garcia@familias.local", name: "García Iturre", role: "familia" },
  { email: "lopez@familias.local", name: "López Mansilla", role: "familia" },
  { email: "ruiz@familias.local", name: "Ruiz Albornoz", role: "familia" },
  { email: "soria@familias.local", name: "Soria Paz", role: "familia" },
  { email: "molina@familias.local", name: "Molina Cabrera", role: "familia" },
  { email: "diaz@familias.local", name: "Díaz Núñez", role: "familia" },
  { email: "agüero@familias.local", name: "Agüero Castro", role: "familia" },
  { email: "torres@familias.local", name: "Torres Vega", role: "familia" },
  { email: "moyano@familias.local", name: "Moyano Sosa", role: "familia" },
  { email: "isasmendi@familias.local", name: "Isasmendi Toledo", role: "familia" },
  { email: "salazar@familias.local", name: "Salazar Coronel", role: "docente" },
  { email: "rivas@familias.local", name: "Rivas Mendoza", role: "docente" },
  { email: "ponce@familias.local", name: "Ponce Estrada", role: "egresado" },
];

const BUSINESSES: Array<{
  name: string;
  description: string;
  categoryName: string;
  neighborhood: string;
  ownerEmail: string;
  whatsapp?: string;
  instagram?: string;
  delivers?: boolean;
  onlineOnly?: boolean;
  byAppointment?: boolean;
  tags?: string[];
  color: string;
  lat?: number;
  lng?: number;
  story?: string;
  isFeaturedStory?: boolean;
}> = [
  {
    name: "Panadería La Cuadra",
    description:
      "Pan casero, focaccias y masas dulces los fines de semana. Hacemos pedidos especiales para cumpleaños y eventos.",
    categoryName: "Alimentos y bebidas",
    neighborhood: "Yerba Buena",
    ownerEmail: "perez@familias.local",
    whatsapp: "5493815550101",
    instagram: "panaderia.lacuadra",
    delivers: true,
    tags: ["pan", "casero", "eventos"],
    color: "#a84f33",
    lat: -26.8175,
    lng: -65.3164,
    story: `Empezamos un sábado a la mañana, con un horno chico prestado y dos kilos de harina.\n\nLas primeras focaccias salieron como salieron — pero la vecina del enfrente vino, las probó y se llevó dos. A la semana siguiente teníamos pedidos para tres familias del cole.\n\nHoy seguimos amasando en casa, los fines de semana. Pan casero, focaccias y masas dulces. Cada bolsa que entregamos lleva un mensaje escrito a mano. Es chico, es lento, y es como queremos que sea.`,
    isFeaturedStory: true,
  },
  {
    name: "Diseño gráfico — Estudio Sur",
    description:
      "Identidad visual, branding y diseño editorial para emprendimientos chicos y medianos.",
    categoryName: "Diseño y oficios",
    neighborhood: "Tucumán capital",
    ownerEmail: "garcia@familias.local",
    whatsapp: "5493815550102",
    instagram: "estudiosur.diseno",
    onlineOnly: true,
    tags: ["branding", "diseño", "logo"],
    color: "#1f3a5f",
  },
  {
    name: "Pilates Yerba Buena",
    description:
      "Clases reducidas de pilates reformer y mat. Turnos personalizados, también para principiantes.",
    categoryName: "Salud y bienestar",
    neighborhood: "Yerba Buena",
    ownerEmail: "lopez@familias.local",
    whatsapp: "5493815550103",
    instagram: "pilates.yb",
    byAppointment: true,
    tags: ["pilates", "salud", "movimiento"],
    color: "#6b6760",
    lat: -26.8210,
    lng: -65.3211,
  },
  {
    name: "Clases de inglés con María",
    description:
      "Clases particulares para chicos de primaria y secundaria. Apoyo escolar y preparación de exámenes.",
    categoryName: "Educación y clases",
    neighborhood: "Tafí Viejo",
    ownerEmail: "ruiz@familias.local",
    whatsapp: "5493815550104",
    byAppointment: true,
    tags: ["inglés", "clases", "apoyo"],
    color: "#1a1814",
  },
  {
    name: "Carpintería Soria",
    description:
      "Muebles a medida, restauración y trabajos en madera maciza. Visitamos a domicilio para presupuestos.",
    categoryName: "Servicios del hogar",
    neighborhood: "Yerba Buena",
    ownerEmail: "soria@familias.local",
    whatsapp: "5493815550105",
    instagram: "soria.carpinteria",
    tags: ["muebles", "madera", "a medida"],
    color: "#a84f33",
    lat: -26.8295,
    lng: -65.3097,
  },
  {
    name: "Catering Mesa Larga",
    description:
      "Catering para eventos chicos, cumpleaños y reuniones familiares. Menúes degustación o cerrados.",
    categoryName: "Eventos y catering",
    neighborhood: "Tucumán capital",
    ownerEmail: "molina@familias.local",
    whatsapp: "5493815550106",
    instagram: "mesalarga.tuc",
    delivers: true,
    tags: ["catering", "eventos", "comida"],
    color: "#1f3a5f",
    lat: -26.8338,
    lng: -65.2169,
  },
  {
    name: "Reparación de PCs y notebooks — Díaz",
    description:
      "Soporte técnico a domicilio, instalación de sistemas, recuperación de archivos y cambio de pantallas.",
    categoryName: "Tecnología",
    neighborhood: "Yerba Buena",
    ownerEmail: "diaz@familias.local",
    whatsapp: "5493815550107",
    tags: ["pc", "notebooks", "soporte"],
    color: "#6b6760",
  },
  {
    name: "Juguetería Madera y Tela",
    description:
      "Juguetes artesanales en madera y tela natural, regalos para baby showers y cumpleaños.",
    categoryName: "Niños y juegos",
    neighborhood: "Tucumán capital",
    ownerEmail: "torres@familias.local",
    instagram: "maderaytela",
    delivers: true,
    onlineOnly: true,
    tags: ["juguetes", "artesanal", "regalo"],
    color: "#a84f33",
  },
];

async function ensureUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let n = 2;
  while (true) {
    const existing = await db.execute<{ exists: boolean }>(
      sql`select exists(select 1 from businesses where slug = ${candidate}) as exists`,
    );
    if (!existing.rows[0]?.exists) return candidate;
    candidate = `${base}-${n++}`;
  }
}

async function main() {
  console.log("→ wiping public data…");
  await db.delete(reactions);
  await db.delete(validationRequests);
  await db.delete(businesses);
  await db.delete(campaigns);
  await db.delete(families);
  await db.delete(categories);
  await db.delete(events);

  console.log("→ seeding categories…");
  const catRows = await db
    .insert(categories)
    .values(
      CATEGORIES.map((c, i) => ({
        slug: slugify(c.name),
        name: c.name,
        icon: c.icon,
        displayOrder: i,
      })),
    )
    .returning();
  const catBySlug = new Map(catRows.map((c) => [c.name, c]));

  console.log("→ seeding seed families…");
  const famRows = await db
    .insert(families)
    .values(
      FAMILIES.map((f) => ({
        email: f.email,
        displayName: f.name,
        role: f.role,
        phone: f.phone,
        isSeed: true,
        validated: true,
        validatedAt: new Date(),
      })),
    )
    .returning();
  const famByEmail = new Map(famRows.map((f) => [f.email, f]));

  console.log("→ seeding businesses…");
  for (const b of BUSINESSES) {
    const slug = await ensureUniqueSlug(b.name);
    const cat = catBySlug.get(b.categoryName);
    if (!cat) throw new Error(`category not found: ${b.categoryName}`);
    const owner = famByEmail.get(b.ownerEmail);
    const [row] = await db
      .insert(businesses)
      .values({
        slug,
        name: b.name,
        description: b.description,
        neighborhood: b.neighborhood,
        categoryId: cat.id,
        ownerEmail: b.ownerEmail,
        ownerFamilyId: owner?.id,
        whatsapp: b.whatsapp,
        instagram: b.instagram,
        delivers: b.delivers ?? false,
        onlineOnly: b.onlineOnly ?? false,
        byAppointment: b.byAppointment ?? false,
        tags: b.tags ?? [],
        lat: b.lat ?? null,
        lng: b.lng ?? null,
        story: b.story ?? null,
        isFeaturedStory: b.isFeaturedStory ?? false,
        status: "active",
        approvedAt: new Date(),
      })
      .returning();
    await storeBusinessPhoto(row.id, slug, b.color);
    await db
      .update(businesses)
      .set({ photoFilename: `${row.id}.webp` })
      .where(sql`id = ${row.id}`);
  }

  console.log("→ seeding demo campaign…");
  const gastroCat = catBySlug.get("Alimentos y bebidas");
  const eventosCat = catBySlug.get("Eventos y catering");
  const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(campaigns).values({
    slug: "semana-gastronomica",
    title: "Semana gastronómica de la comunidad",
    description:
      "Una semana para probar los emprendimientos de comida, panadería y catering de la comunidad.",
    colorHex: "#c4502c",
    startsAt: new Date(),
    endsAt: inSevenDays,
    ctaText: "Ver participantes",
    categoryIds: [gastroCat?.id, eventosCat?.id].filter(Boolean) as string[],
    isActive: true,
  });

  if (process.env.INITIAL_ADMIN_EMAIL && process.env.INITIAL_ADMIN_PASSWORD) {
    console.log("→ seeding admin user…");
    await db.delete(adminUsers);
    const hash = await bcrypt.hash(process.env.INITIAL_ADMIN_PASSWORD, 10);
    await db.insert(adminUsers).values({
      email: process.env.INITIAL_ADMIN_EMAIL,
      passwordHash: hash,
    });
  }

  console.log("✓ seed done");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
