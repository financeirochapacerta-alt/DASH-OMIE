import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { parsePublicEnv, parseServerEnv } from "@/lib/env/schema";

const publicValues = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-placeholder",
};

describe("environment validation", () => {
  it("accepts a valid public Supabase configuration", () => {
    expect(parsePublicEnv(publicValues)).toEqual(publicValues);
  });

  it("rejects malformed public URLs", () => {
    expect(() =>
      parsePublicEnv({ ...publicValues, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }),
    ).toThrow(ZodError);
  });

  it("keeps private values in the server schema only", () => {
    const privateValues = {
      ...publicValues,
      OMIE_APP_KEY: "server-key-placeholder",
      OMIE_APP_SECRET: "server-secret-placeholder",
    };

    expect(parsePublicEnv(privateValues)).not.toHaveProperty("OMIE_APP_SECRET");
    expect(parseServerEnv(privateValues).OMIE_APP_SECRET).toBe(
      "server-secret-placeholder",
    );
  });
});
