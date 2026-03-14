import { z } from "zod";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

// Valeur par défaut factice pour le build Docker (sera remplacée au runtime)
// Prisma utilisera directement process.env.DATABASE_URL au runtime, donc cette valeur
// n'est utilisée que pour satisfaire la validation Zod pendant le build
const DEFAULT_DATABASE_URL = "postgresql://build:build@localhost:5432/build";

const envSchema = z.object({
  DATABASE_URL: z.string().url().default(DEFAULT_DATABASE_URL),
  AUTH_DEMO_USER_ID: z
    .string()
    .uuid()
    .default(DEMO_USER_ID),
  AUTH_SECRET: z.string().min(1).default("change-me-in-production"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Jobtrack"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default((process.env.NODE_ENV as "development" | "test" | "production") ?? "development"),
  // Email (SMTP) — optionnel, emails désactivés si absent
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_DEMO_USER_ID: process.env.AUTH_DEMO_USER_ID,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NODE_ENV: process.env.NODE_ENV,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
});

