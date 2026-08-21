import { z } from "zod";

const optionalNonEmpty = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmpty,
  OMIE_APP_KEY: optionalNonEmpty,
  OMIE_APP_SECRET: optionalNonEmpty,
});

export const omieEnvSchema = z.object({
  OMIE_APP_KEY: z.string().min(1),
  OMIE_APP_SECRET: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type OmieEnv = z.infer<typeof omieEnvSchema>;

export function parsePublicEnv(input: unknown): PublicEnv {
  return publicEnvSchema.parse(input);
}

export function parseServerEnv(input: unknown): ServerEnv {
  return serverEnvSchema.parse(input);
}

export function parseOmieEnv(input: unknown): OmieEnv {
  return omieEnvSchema.parse(input);
}
