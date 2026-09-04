'use client';
import React, { useMemo, useState, useCallback } from 'react';
import { Search, ArrowUp, ArrowDown, ArrowUpDown, Download, Layers, Scissors, Table2, X, Filter, ChevronLeft, ChevronRight, Grid3X3, BarChart3 } from 'lucide-react';
import { GlassCard, Pill } from './GlassCard';

// Column definition — generic, works for any data shape
export type DataGridColumn<T = any> = {
  key: string;
  label: string;
  sortable?: boolean;
  filterType?: 'text' | 'select' | 'date';
  options?: string[];
  render?: (value: any, row: T, idx: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  aggregate?: 'count' | 'sum' | 'avg';
};

export type DataGridPagination = {
  page: number; // 1-indexed
  pageSize: number;
  total: number;
};

export type DataGridProps<T = any> = {
  columns: DataGridColumn<T>[];
  data: T[];
  pagination: DataGridPagination;
  onPageChange?: (page: number, pageSize: number) => void;
  onSort?: (sort: { key: string; direction: 'asc' | 'desc' } | null) => void;
  onFilter?: (filters: Record<string, string>) => void;
  onExport?: () => void; // if not provided, default CSV export of filtered data
  loading?: boolean;
  emptyText?: string;
  title?: string;
  searchable?: boolean;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
};

function getNested(row: any, key: string): any {
  if (!row || !key) return undefined;
  if (row[key] !== undefined) return row[key];
  // dot-path support: e.g. "employee.name"
  const parts = key.split('.');
  let cur = row;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function formatCell(v: any): string {
  if (v == null) return '—';
  if (v instanceof Date) return v.toLocaleDateString();
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 60);
  return String(v);
}

function toCsv(columns: DataGridColumn[], rows: any[]): string {
  const header = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const lines = rows.map(r =>
    columns.map(c => {
      const v = getNested(r, c.key);
      const s = v == null ? '' : String(v).replace(/"/g, '""');
      return `"${s}"`;
    }).join(',')
  );
  return [header, ...lines].join('\n');
}

export default function DataGrid<T = any>({
  columns,
  data,
  pagination,
  onPageChange,
  onSort,
  onFilter,
  onExport,
  loading = false,
  emptyText = 'No records found',
  title = 'Data Grid',
  searchable = true,
}: DataGridProps<T>) {
  const [globalSearch, setGlobalSearch] = useState('');
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [groupBy, setGroupBy] = useState<string>('');
  const [sliceColumn, setSliceColumn] = useState<string>('');
  const [sliceValue, setSliceValue] = useState<string>('');
  const [pivotColumn, setPivotColumn] = useState<string>('');
  const [showPivot, setShowPivot] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // unique values for slice/pivot options
  const uniqueValues = useCallback((colKey: string): string[] => {
    const set = new Set<string>();
    for (const r of data) {
      const v = getNested(r, colKey);
      if (v != null && String(v).trim() !== '') set.add(String(v));
    }
    return Array.from(set).sort();
  }, [data]);

  const handleSort = (colKey: string) => {
    const col = columns.find(c => c.key === colKey);
    if (col?.sortable === false) return;
    let next: { key: string; direction: 'asc' | 'desc' } | null = null;
    if (!sort || sort.key !== colKey) next = { key: colKey, direction: 'asc' };
    else if (sort.direction === 'asc') next = { key: colKey, direction: 'desc' };
    else next = null;
    setSort(next);
    onSort?.(next);
  };

  const setFilter = (key: string, value: string) => {
    const next = { ...columnFilters, [key]: value };
    if (!value) delete (next as any)[key];
    // clean empty
    const cleaned: Record<string,string> = {};
    Object.entries(next).forEach(([k,v]) => { if (v) cleaned[k]=v; });
    setColumnFilters(cleaned);
    onFilter?.(cleaned);
  };

  // filtered + sorted + sliced data
  const processed = useMemo(() => {
    let rows = [...data];

    // global search
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      rows = rows.filter(r =>
        columns.some(c => {
          const v = getNested(r, c.key);
          return String(v ?? '').toLowerCase().includes(q);
        })
      );
    }

    // column filters
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (!val) return;
      const col = columns.find(c => c.key === key);
      if (!col) return;
      if (col.filterType === 'select') {
        rows = rows.filter(r => String(getNested(r, key) ?? '') === val);
      } else if (col.filterType === 'date') {
        // date string contains filter
        rows = rows.filter(r => String(getNested(r, key) ?? '').includes(val));
      } else {
        const q = val.toLowerCase();
        rows = rows.filter(r => String(getNested(r, key) ?? '').toLowerCase().includes(q));
      }
    });

    // slice by arbitrary column value (extra slicing beyond column filters)
    if (sliceColumn && sliceValue) {
      rows = rows.filter(r => String(getNested(r, sliceColumn) ?? '') === sliceValue);
    }

    // sort
    if (sort?.key) {
      const { key, direction } = sort;
      rows.sort((a: any, b: any) => {
        const av = getNested(a, key);
        const bv = getNested(b, key);
        // handle nulls
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        // numeric sort if both numbers
        const an = Number(av);
        const bn = Number(bv);
        if (!isNaN(an) && !isNaN(bn) && String(av).trim() !== '' && String(bv).trim() !== '') {
          return direction === 'asc' ? an - bn : bn - an;
        }
        // fallback string compare
        const aStr = String(av).toLowerCase();
        const bStr = String(bv).toLowerCase();
        // try date
        const aDate = Date.parse(String(av));
        const bDate = Date.parse(String(bv));
        if (!isNaN(aDate) && !isNaN(bDate) && aDate > 1000000000) {
          return direction === 'asc' ? aDate - bDate : bDate - aDate;
        }
        if (aStr < bStr) return direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [data, globalSearch, columnFilters, sliceColumn, sliceValue, sort, columns]);

  // grouped view
  const grouped = useMemo(() => {
    if (!groupBy) return null;
    const map = new Map<string, any[]>();
    for (const r of processed) {
      const k = String(getNested(r, groupBy) ?? '—');
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    // compute aggregates per group
    const entries = Array.from(map.entries()).map(([key, rows]) => {
      // sum for numeric columns
      const sums: Record<string, number> = {};
      columns.forEach(c => {
        const vals = rows.map(r => Number(getNested(r, c.key))).filter(n => !isNaN(n));
        if (vals.length) sums[c.key] = vals.reduce((a,b)=>a+b,0);
      });
      return { key, rows, count: rows.length, sums };
    });
    // sort groups by count desc
    entries.sort((a,b)=> b.count - a.count);
    return entries;
  }, [processed, groupBy, columns]);

  // pivot matrix
  const pivot = useMemo(() => {
    if (!pivotColumn || !showPivot) return null;
    // choose a row key: groupBy if selected else first column
    const rowKey = groupBy || columns[0]?.key;
    if (!rowKey) return null;
    const rowVals = Array.from(new Set(processed.map(r => String(getNested(r, rowKey) ?? '—')))).sort();
    const colVals = Array.from(new Set(processed.map(r => String(getNested(r, pivotColumn) ?? '—')))).sort();
    const matrix: Record<string, Record<string, number>> = {};
    rowVals.forEach(rv => { matrix[rv] = {}; colVals.forEach(cv => matrix[rv][cv]=0); });
    processed.forEach(r => {
      const rv = String(getNested(r, rowKey) ?? '—');
      const cv = String(getNested(r, pivotColumn) ?? '—');
      if (matrix[rv] && matrix[rv][cv] != null) matrix[rv][cv] += 1;
    });
    return { rowKey, colVals, rowVals, matrix };
  }, [processed, pivotColumn, groupBy, columns, showPivot]);

  // pagination slicing (client-side). If pagination.total differs, we honor client filtered length for display but still slice.
  const totalFiltered = processed.length;
  const totalForDisplay = data.length;
  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 10;
  const totalPages = Math.max(1, Math.ceil((grouped ? grouped.length : totalFiltered) / pageSize));
  // When grouped, paginate groups, otherwise paginate rows
  const paginatedRows = useMemo(() => {
    if (grouped) {
      const start = (page - 1) * pageSize;
      return grouped.slice(start, start + pageSize);
    }
    const start = (page - 1) * pageSize;
    return processed.slice(start, start + pageSize) as any;
  }, [processed, grouped, page, pageSize]);

  const handleExport = () => {
    if (onExport) { onExport(); return; }
    const csv = toCsv(columns, processed);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setGlobalSearch('');
    setSliceColumn('');
    setSliceValue('');
    setGroupBy('');
    setPivotColumn('');
    setShowPivot(false);
    setSort(null);
    onFilter?.({});
    onSort?.(null);
  };

  const pageNumbers = useMemo(() => {
    const pages: (number | '…')[] = [];
    const tp = totalPages;
    if (tp <= 7) {
      for (let i=1;i<=tp;i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('…');
      const start = Math.max(2, page -1);
      const end = Math.min(tp-1, page+1);
      for (let i=start;i<=end;i++) pages.push(i);
      if (page < tp-2) pages.push('…');
      pages.push(tp);
    }
    return pages;
  }, [totalPages, page]);

  return (
    <GlassCard className="p-0 overflow-hidden flex flex-col">
      {/* Header toolbar */}
      <div className="p-4 border-b border-white/20 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white">
              <Table2 size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">{title}
                {loading && <span className="text-xs font-normal text-slate-500">Loading…</span>}
              </h3>
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-900">{totalFiltered}</span> filtered
                <span className="mx-1">•</span>
                <span className="font-semibold">{totalForDisplay}</span> total
                {groupBy && grouped && ` • ${grouped.length} groups`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {searchable && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  placeholder="Global search…"
                  className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-[220px]"
                />
                {globalSearch && (
                  <button onClick={() => setGlobalSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
            <button onClick={() => setShowFilters(!showFilters)} className={`glass rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5 ${showFilters ? 'bg-slate-900 text-white' : ''}`}>
              <Filter size={14} /> {showFilters ? 'Hide filters' : 'Filters'}
            </button>
            <button onClick={handleExport} className="bg-slate-900 text-white rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800">
              <Download size={14} /> Export CSV
            </button>
            {(globalSearch || Object.keys(columnFilters).length || groupBy || sliceColumn || sort) && (
              <button onClick={clearAllFilters} className="text-xs text-slate-500 hover:text-slate-700 underline">Clear all</button>
            )}
          </div>
        </div>

        {/* Slicing / Dicing bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 bg-slate-50/70 rounded-xl p-3 border border-slate-100">
          <div className="lg:col-span-3 flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 whitespace-nowrap"><Layers size={12} /> Group by</label>
            <select value={groupBy} onChange={e => { setGroupBy(e.target.value); }} className="flex-1 px-2 py-1.5 rounded-lg border bg-white text-xs">
              <option value="">— None —</option>
              {columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>

          <div className="lg:col-span-4 flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 whitespace-nowrap"><Scissors size={12} /> Slice</label>
            <select value={sliceColumn} onChange={e => { setSliceColumn(e.target.value); setSliceValue(''); }} className="flex-1 px-2 py-1.5 rounded-lg border bg-white text-xs">
              <option value="">— Column —</option>
              {columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <select value={sliceValue} onChange={e => setSliceValue(e.target.value)} disabled={!sliceColumn} className="flex-1 px-2 py-1.5 rounded-lg border bg-white text-xs disabled:opacity-50">
              <option value="">— Value —</option>
              {sliceColumn && uniqueValues(sliceColumn).map(v => <option key={v} value={v}>{v.slice(0,40)}</option>)}
            </select>
          </div>

          <div className="lg:col-span-3 flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 whitespace-nowrap"><Grid3X3 size={12} /> Pivot</label>
            <select value={pivotColumn} onChange={e => setPivotColumn(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border bg-white text-xs">
              <option value="">— None —</option>
              {columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            {pivotColumn && (
              <button onClick={() => setShowPivot(!showPivot)} className={`px-2 py-1.5 rounded-lg text-xs font-semibold ${showPivot ? 'bg-violet-600 text-white' : 'glass'}`}>
                {showPivot ? 'Hide pivot' : 'Show pivot'}
              </button>
            )}
          </div>

          <div className="lg:col-span-2 flex items-center justify-end gap-2 text-xs">
            <span className="text-slate-500">Aggregates:</span>
            <span className="bg-white rounded-full px-2 py-1 border text-slate-700 font-semibold">{totalFiltered} rows</span>
            {groupBy && grouped && <span className="bg-slate-900 text-white rounded-full px-2 py-1">{grouped.length} groups</span>}
          </div>
        </div>

        {grouped && (
          <div className="flex flex-wrap gap-2">
            {grouped.slice(0, 8).map(g => (
              <span key={g.key} className="inline-flex items-center gap-1.5 bg-white border rounded-full px-3 py-1 text-xs">
                <BarChart3 size={12} className="text-slate-400" />
                <span className="font-semibold">{g.key}</span>
                <Pill tone="slate">{g.count}</Pill>
                {Object.keys(g.sums).length > 0 && <span className="text-slate-500">Σ {Object.values(g.sums)[0]?.toLocaleString()}</span>}
              </span>
            ))}
            {grouped.length > 8 && <span className="text-xs text-slate-500">+{grouped.length - 8} more groups</span>}
          </div>
        )}
      </div>

      {/* Pivot matrix */}
      {pivot && (
        <div className="px-4 py-3 bg-violet-50/50 border-b overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold flex items-center gap-1"><Grid3X3 size={12}/> Pivot: {pivot.rowKey} × {pivot.colVals.join(' / ')}</h4>
            <span className="text-xs text-slate-500">{pivot.rowVals.length} × {pivot.colVals.length} matrix • counts</span>
          </div>
          <div className="overflow-auto max-h-[260px] border rounded-xl bg-white">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left p-2 border-r bg-slate-50">{pivot.rowKey}</th>
                  {pivot.colVals.map(cv => <th key={cv} className="p-2 text-center min-w-[90px]">{cv || '—'}</th>)}
                  <th className="p-2 text-center bg-slate-900 text-white">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pivot.rowVals.map(rv => {
                  const rowTotal = Object.values(pivot.matrix[rv]).reduce((a,b)=>a+b,0);
                  return (
                    <tr key={rv} className="hover:bg-slate-50">
                      <td className="p-2 font-medium border-r bg-slate-50/50">{rv}</td>
                      {pivot.colVals.map(cv => <td key={cv} className="p-2 text-center">{pivot.matrix[rv][cv] || 0}</td>)}
                      <td className="p-2 text-center font-bold bg-slate-50">{rowTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs sticky top-0 z-[1]">
            <tr>
              {columns.map(col => {
                const isSorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: (col as any).width }}
                    className={`text-${col.align || 'left'} p-3 font-semibold text-slate-600 whitespace-nowrap select-none ${col.sortable !== false ? 'cursor-pointer hover:text-slate-900' : ''}`}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable !== false && (
                        <span className={`p-0.5 rounded ${isSorted ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
                          {isSorted ? (sort!.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : <ArrowUpDown size={12}/>}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
            {showFilters && (
              <tr className="bg-white border-t">
                {columns.map(col => (
                  <th key={`${col.key}-filter`} className="p-1.5">
                    {col.filterType === 'select' && (col.options?.length || uniqueValues(col.key).length) ? (
                      <select
                        value={columnFilters[col.key] || ''}
                        onChange={e => setFilter(col.key, e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border bg-white text-xs font-normal"
                      >
                        <option value="">All {col.label}</option>
                        {(col.options || uniqueValues(col.key)).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : col.filterType === 'date' ? (
                      <input
                        type="date"
                        value={columnFilters[col.key] || ''}
                        onChange={e => setFilter(col.key, e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border bg-white text-xs font-normal"
                      />
                    ) : (
                      <input
                        value={columnFilters[col.key] || ''}
                        onChange={e => setFilter(col.key, e.target.value)}
                        placeholder={`Filter ${col.label}…`}
                        className="w-full px-2 py-1.5 rounded-lg border bg-white text-xs font-normal placeholder:text-slate-400"
                      />
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>

          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={columns.length} className="p-10 text-center text-slate-500">Loading data…</td></tr>
            ) : grouped ? (
              // grouped paginated view: each group is collapsible card inside table? we render group headers + rows
              (paginatedRows as any[]).length === 0 ? (
                <tr><td colSpan={columns.length} className="p-10 text-center text-slate-500">{emptyText}</td></tr>
              ) : (paginatedRows as any[]).map((g: any) => (
                <React.Fragment key={g.key}>
                  <tr className="bg-slate-900 text-white">
                    <td colSpan={columns.length} className="p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-bold"><Layers size={12}/> {groupBy}: {g.key} <span className="bg-white text-slate-900 rounded-full px-2 py-0.5">{g.count} rows</span></span>
                        <span className="text-xs opacity-80 hidden md:inline">∑ numeric cols: {Object.entries(g.sums).slice(0,2).map(([k,v]) => `${k}=${(v as number).toLocaleString()}`).join(' • ')}</span>
                      </div>
                    </td>
                  </tr>
                  {g.rows.slice(0, 50).map((row: any, idx: number) => (
                    <tr key={row.id || `${g.key}-${idx}`} className="hover:bg-slate-50/60">
                      {columns.map(col => {
                        const raw = getNested(row, col.key);
                        return (
                          <td key={col.key} className={`p-2.5 text-${col.align || 'left'} text-xs ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                            {col.render ? col.render(raw, row, idx) : <span className={col.key === groupBy ? 'font-semibold' : ''}>{formatCell(raw)}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {g.rows.length > 50 && <tr><td colSpan={columns.length} className="p-2 text-center text-xs text-slate-500">…and {g.rows.length - 50} more in this group</td></tr>}
                </React.Fragment>
              ))
            ) : (paginatedRows as any[]).length === 0 ? (
              <tr><td colSpan={columns.length} className="p-10 text-center text-slate-500">{emptyText}</td></tr>
            ) : (
              (paginatedRows as any[]).map((row: any, idx: number) => (
                <tr key={row.id || idx} className="hover:bg-slate-50/50">
                  {columns.map(col => {
                    const raw = getNested(row, col.key);
                    return (
                      <td key={col.key} className={`p-2.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} text-xs`}>
                        {col.render ? col.render(raw, row, idx) : formatCell(raw)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-3 border-t bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => onPageChange?.(page, Number(e.target.value))}
            className="px-2 py-1.5 rounded-lg border bg-white"
          >
            {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="hidden md:inline">
            {totalFiltered === 0 ? '0' : `${(page-1)*pageSize + 1}–${Math.min(page*pageSize, totalFiltered)}`} of {totalFiltered} {totalFiltered !== totalForDisplay && `(total ${totalForDisplay})`}
          </span>
          {sliceColumn && sliceValue && <Pill tone="amber">Sliced: {sliceColumn}={sliceValue}</Pill>}
        </div>

        <div className="flex items-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1, pageSize)}
            className="w-8 h-8 rounded-lg border bg-white flex items-center justify-center disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronLeft size={16} />
          </button>
          {pageNumbers.map((p, i) =>
            p === '…' ? (
              <span key={`e-${i}`} className="px-1 text-slate-400">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange?.(p as number, pageSize)}
                className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold ${page === p ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'}`}
              >
                {p}
              </button>
            )
          )}
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1, pageSize)}
            className="w-8 h-8 rounded-lg border bg-white flex items-center justify-center disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronRight size={16} />
          </button>
          <span className="ml-2 text-xs text-slate-500 hidden md:inline">Page {page} of {totalPages}</span>
        </div>
      </div>

      <div className="px-3 py-2 bg-white border-t text-xs text-slate-500 flex flex-wrap gap-2">
        <span className="flex items-center gap-1"><Filter size={10}/> Per-column filters</span>
        <span>•</span>
        <span className="flex items-center gap-1"><ArrowUpDown size={10}/> Click header to sort</span>
        <span>•</span>
        <span className="flex items-center gap-1"><Layers size={10}/> Group by aggregates counts & sums</span>
        <span>•</span>
        <span className="flex items-center gap-1"><Scissors size={10}/> Slice by any column value</span>
        <span>•</span>
        <span className="flex items-center gap-1"><Grid3X3 size={10}/> Pivot cross-tab</span>
      </div>
    </GlassCard>
  );
}

// also named export for convenience
export { DataGrid };
