import "server-only";

// Evidence (Onda 2 real sync, 2026-08-21): every categoria.dadosDRE observed so far has the
// shape { codigoDRE, descricaoDRE, sinalDRE, nivelDRE: "3", totalizaDRE: "N", naoExibirDRE: "N" }
// and codigoDRE is always a 3-segment dotted numeric code (e.g. "2.11.01"). Omie provides no
// label for the level-1/level-2 groupers, only for the full leaf code (descricaoDRE), so
// dre_type/dre_group are derived as the raw code segments (auditable, never invented) and
// dre_account uses Omie's own descricaoDRE. Anything that doesn't match this confirmed shape
// stays unmapped rather than being guessed.
export type DreMappingDerivation = {
  dreType: string;
  dreGroup: string;
  dreAccount: string;
  signBehavior: string | null;
  typeOrder: number;
  groupOrder: number;
  accountOrder: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function deriveDreMappingFromOmie(
  codigoDre: string | null | undefined,
  dreMetadata: unknown,
): DreMappingDerivation | null {
  const code = text(codigoDre);
  if (!code) return null;

  const segments = code.split(".");
  if (segments.length !== 3 || segments.some((segment) => !/^\d+$/.test(segment))) return null;

  const metadata = isRecord(dreMetadata) ? dreMetadata : {};
  const description = text(metadata.descricaoDRE);
  if (!description) return null;

  const [type, group, account] = segments;
  return {
    dreType: type,
    dreGroup: `${type}.${group}`,
    dreAccount: description,
    signBehavior: text(metadata.sinalDRE),
    typeOrder: Number(type),
    groupOrder: Number(group),
    accountOrder: Number(account),
  };
}
