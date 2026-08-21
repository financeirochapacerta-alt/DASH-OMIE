import { describe, expect, it } from "vitest";

import { deriveDreMappingFromOmie } from "@/services/omie/reference-data";

const realMetadata = {
  codigoDRE: "2.11.01",
  descricaoDRE: "Despesas com Pessoal",
  naoExibirDRE: "N",
  nivelDRE: 3,
  sinalDRE: "-",
  totalizaDRE: "N",
};

describe("deriveDreMappingFromOmie", () => {
  it("derives type/group/account from a real confirmed codigoDRE shape", () => {
    expect(deriveDreMappingFromOmie("2.11.01", realMetadata)).toEqual({
      dreType: "2",
      dreGroup: "2.11",
      dreAccount: "Despesas com Pessoal",
      signBehavior: "-",
      typeOrder: 2,
      groupOrder: 11,
      accountOrder: 1,
    });
  });

  it("stays unmapped when codigoDRE is absent", () => {
    expect(deriveDreMappingFromOmie(null, realMetadata)).toBeNull();
    expect(deriveDreMappingFromOmie("", realMetadata)).toBeNull();
  });

  it("stays unmapped when descricaoDRE is missing, rather than inventing a label", () => {
    expect(deriveDreMappingFromOmie("2.11.01", { ...realMetadata, descricaoDRE: undefined })).toBeNull();
    expect(deriveDreMappingFromOmie("2.11.01", {})).toBeNull();
    expect(deriveDreMappingFromOmie("2.11.01", null)).toBeNull();
  });

  it("stays unmapped for a codigoDRE shape that doesn't match the confirmed 3-segment numeric pattern", () => {
    expect(deriveDreMappingFromOmie("2.11", realMetadata)).toBeNull();
    expect(deriveDreMappingFromOmie("2.11.01.99", realMetadata)).toBeNull();
    expect(deriveDreMappingFromOmie("2.A.01", realMetadata)).toBeNull();
  });

  it("preserves sinalDRE as descriptive metadata without affecting the derived hierarchy", () => {
    const positive = deriveDreMappingFromOmie("1.01.01", { ...realMetadata, sinalDRE: "+" });
    expect(positive?.signBehavior).toBe("+");
    expect(positive?.dreType).toBe("1");
  });

  it("returns null sign behavior when sinalDRE is absent", () => {
    const { sinalDRE: _sinalDRE, ...withoutSign } = realMetadata;
    expect(deriveDreMappingFromOmie("2.11.01", withoutSign)?.signBehavior).toBeNull();
  });
});
