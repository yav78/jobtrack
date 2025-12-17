import { z } from "zod";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_DEMO_USER_ID: z
    .string()
    .uuid()
    .default(DEMO_USER_ID),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Jobtrack"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default((process.env.NODE_ENV as "development" | "test" | "production") ?? "development"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_DEMO_USER_ID: process.env.AUTH_DEMO_USER_ID,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NODE_ENV: process.env.NODE_ENV,
});

