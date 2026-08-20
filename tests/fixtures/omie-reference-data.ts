import type {
  BankAccountDto,
  CategoryDto,
  CustomerDto,
  SellerDto,
} from "@/services/omie/reference-data/types";

export const customers: readonly CustomerDto[] = [
  {
    codigo_cliente_omie: 1001,
    razao_social: "Cliente Exemplo Ltda",
    nome_fantasia: "Cliente Exemplo",
    cnpj_cpf: "00.000.000/0001-00",
    inativo: "N",
  },
  {
    codigo_cliente_omie: 1002,
    razao_social: "Cliente sem opcionais",
    nome_fantasia: "",
    cnpj_cpf: "",
  },
];

export const sellers: readonly SellerDto[] = [
  { codigo: 2001, nome: "Vendedora Exemplo", email: "vendedora@example.invalid", inativo: "N" },
  { codigo: 2002, nome: "Vendedor Inativo", email: "", inativo: "S" },
];

export const categories: readonly CategoryDto[] = [
  {
    codigo: "1.01.01",
    descricao: "Receita de exemplo",
    codigo_dre: "01.01",
    dadosDRE: { grupo: "receita", nivel: 2 },
    inativo: "N",
  },
  { codigo: "2.01.01", descricao: "Despesa sem DRE", codigo_dre: "" },
];

export const bankAccounts: readonly BankAccountDto[] = [
  {
    nCodCC: 3001,
    descricao: "Conta Corrente Exemplo",
    saldo_inicial: "1234.56",
    saldo_data: "31/12/2026",
    bloqueado: "N",
    inativo: "N",
    tipo_conta_corrente: "CC",
  },
  {
    nCodCC: 3002,
    descricao: "Conta Inativa",
    saldo_inicial: 0,
    saldo_data: "",
    bloqueado: "S",
    inativo: "S",
    tipo_conta_corrente: "CX",
  },
];
