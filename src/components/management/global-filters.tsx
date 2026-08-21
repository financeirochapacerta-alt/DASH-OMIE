"use client";

import { useState } from "react";
import type { Period, PeriodPreset } from "@/features/management/period";

export function GlobalFilters({ period, commercial = false }: { period: Period; commercial?: boolean }) {
  const [preset, setPreset] = useState<PeriodPreset>(period.preset);
  return (
    <form className="filter-bar" aria-label="Filtros do relatório" method="GET">
      <label>
        <span>Período</span>
        <select name="period" defaultValue={period.preset} onChange={(event) => setPreset(event.target.value as PeriodPreset)}>
          <option value="today">Hoje</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mês</option>
          <option value="previous">Mês anterior</option>
          <option value="3m">Últimos 3 meses</option>
          <option value="6m">Últimos 6 meses</option>
          <option value="year">Este ano</option>
          <option value="custom">Personalizado</option>
        </select>
      </label>
      {preset === "custom" && (
        <>
          <label>
            <span>De</span>
            <input type="date" name="from" defaultValue={period.preset === "custom" ? period.from : undefined} />
          </label>
          <label>
            <span>Até</span>
            <input type="date" name="to" defaultValue={period.preset === "custom" ? period.to : undefined} />
          </label>
        </>
      )}
      {commercial && (
        <>
          <label>
            <span>Vendedor</span>
            <select name="seller" defaultValue="">
              <option value="">Todos</option>
            </select>
          </label>
          <label>
            <span>Cliente</span>
            <select name="customer" defaultValue="">
              <option value="">Todos</option>
            </select>
          </label>
        </>
      )}
      <button className="filter-button">Aplicar filtros</button>
    </form>
  );
}
