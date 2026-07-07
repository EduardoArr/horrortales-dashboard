export interface OutlierFiltersValue {
  status: string;
  minScore: string;
  sort: string;
}

const STATUS_OPTIONS = [
  { value: "NEW", label: "Nuevos" },
  { value: "SAVED", label: "Guardados" },
  { value: "DISCARDED", label: "Descartados" },
  { value: "USED", label: "Usados" },
  { value: "ALL", label: "Todos" },
];

const SORT_OPTIONS = [
  { value: "score", label: "Score" },
  { value: "views", label: "Vistas" },
  { value: "publishedAt", label: "Fecha de publicación" },
];

export function OutlierFilters({ value }: { value: OutlierFiltersValue }) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-xs text-neutral-500">
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={value.status}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-100"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="minScore" className="text-xs text-neutral-500">
          Score mínimo
        </label>
        <input
          id="minScore"
          name="minScore"
          type="number"
          step="0.5"
          min="0"
          defaultValue={value.minScore}
          className="w-24 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sort" className="text-xs text-neutral-500">
          Ordenar por
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={value.sort}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-100"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded-md bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 hover:bg-neutral-700"
      >
        Filtrar
      </button>
    </form>
  );
}
