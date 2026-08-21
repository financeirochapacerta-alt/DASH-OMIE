"use client";

import { useMemo, useState } from "react";
import { formatBRL } from "@/features/management/format";

type Row = { tipo: string; grupo: string; conta: string; categoria: string; origem: "Manual" | "Omie" | "Unmapped"; amount: number };

function groupBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

export function DreHierarchy({ rows }: { rows: Row[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const tree = useMemo(() => {
    const byType = groupBy(rows, (r) => r.tipo);
    return [...byType.entries()]
      .map(([tipo, typeRows]) => {
        const byGroup = groupBy(typeRows, (r) => r.grupo);
        const groups = [...byGroup.entries()]
          .map(([grupo, groupRows]) => {
            const byAccount = groupBy(groupRows, (r) => r.conta);
            const accounts = [...byAccount.entries()]
              .map(([conta, accountRows]) => ({
                conta,
                amount: accountRows.reduce((sum, r) => sum + r.amount, 0),
                categorias: accountRows.slice().sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)),
              }))
              .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
            return { grupo, amount: groupRows.reduce((sum, r) => sum + r.amount, 0), accounts };
          })
          .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
        return { tipo, amount: typeRows.reduce((sum, r) => sum + r.amount, 0), groups };
      })
      .sort((a, b) => a.tipo.localeCompare(b.tipo));
  }, [rows]);

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!tree.length) return <p className="drawer-loading">Nenhum lançamento classificado no período.</p>;

  return (
    <div className="dre-hierarchy">
      {tree.map((type) => {
        const typeKey = `t:${type.tipo}`;
        const typeOpen = !collapsed.has(typeKey);
        return (
          <div key={typeKey}>
            <div className={`dre-row level-type ${type.amount < 0 ? "negative" : ""}`} onClick={() => toggle(typeKey)} style={{ cursor: "pointer" }}>
              <span><span className="dre-toggle">{typeOpen ? "▾" : "▸"}</span>Tipo {type.tipo}</span>
              <span className="dre-value">{formatBRL(type.amount)}</span>
            </div>
            {typeOpen &&
              type.groups.map((group) => {
                const groupKey = `${typeKey}:g:${group.grupo}`;
                const groupOpen = !collapsed.has(groupKey);
                return (
                  <div key={groupKey}>
                    <div className={`dre-row level-group ${group.amount < 0 ? "negative" : ""}`} onClick={() => toggle(groupKey)} style={{ cursor: "pointer" }}>
                      <span><span className="dre-toggle">{groupOpen ? "▾" : "▸"}</span>Grupo {group.grupo}</span>
                      <span className="dre-value">{formatBRL(group.amount)}</span>
                    </div>
                    {groupOpen &&
                      group.accounts.map((account) => {
                        const accountKey = `${groupKey}:a:${account.conta}`;
                        const accountOpen = !collapsed.has(accountKey);
                        return (
                          <div key={accountKey}>
                            <div className={`dre-row level-account ${account.amount < 0 ? "negative" : ""}`} onClick={() => toggle(accountKey)}>
                              <span><span className="dre-toggle">{accountOpen ? "▾" : "▸"}</span>{account.conta}</span>
                              <span className="dre-value">{formatBRL(account.amount)}</span>
                            </div>
                            {accountOpen &&
                              account.categorias.map((categoria, index) => (
                                <div className={`dre-row ${categoria.amount < 0 ? "negative" : ""}`} key={`${accountKey}:c:${index}`} style={{ paddingLeft: 56 }}>
                                  <span>{categoria.categoria} <span className="status-badge">{categoria.origem}</span></span>
                                  <span className="dre-value">{formatBRL(categoria.amount)}</span>
                                </div>
                              ))}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
