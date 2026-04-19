// ProjectPicker — searchable dropdown over the 600+ rated FRQNCY projects.
//
// Keyboard: ArrowUp / ArrowDown to navigate, Enter to select, Escape to close.
// Emits onChange(project | null). When a project is selected, renders as a
// dismissible chip; otherwise renders as a search input.

import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { loadProjects, searchProjects, type Project } from '../lib/projects';
import { TIER_COLORS } from './ProjectBadge';

function getTierColor(tier: string): string {
  return TIER_COLORS[tier?.toUpperCase()] ?? TIER_COLORS.D;
}

interface ProjectPickerProps {
  value: Project | null;
  onChange: (project: Project | null) => void;
  placeholder?: string;
  /** Max results to show in dropdown (default 20) */
  limit?: number;
}

export default function ProjectPicker({
  value,
  onChange,
  placeholder = 'Tag a project (optional)',
  limit = 20,
}: ProjectPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Warm the project cache on mount so the first keystroke is instant.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadProjects()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close dropdown on outside click.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keep active item in view while navigating with arrow keys.
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const runSearch = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setIsOpen(false);
        setActiveIndex(-1);
        return;
      }
      const matches = searchProjects(q, limit);
      setResults(matches);
      setIsOpen(matches.length > 0);
      setActiveIndex(matches.length > 0 ? 0 : -1);
    },
    [limit],
  );

  const handleInput = (e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 120);
  };

  const handleSelect = (project: Project) => {
    onChange(project);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    // Let the input re-render then focus it.
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && query && !isOpen) {
        runSearch(query);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          handleSelect(results[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // ─── Selected state: render as a dismissible chip ────────────────────────
  if (value) {
    const color = getTierColor(value.tier);
    return (
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center gap-1.5 text-xs pl-2.5 pr-1.5 py-1 rounded-full"
          style={{
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`,
            color,
          }}
        >
          <span
            class="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span class="font-medium">{value.name}</span>
          {value.symbol && (
            <span class="text-[10px] opacity-70">{value.symbol}</span>
          )}
          <span class="text-[10px] font-bold opacity-70 ml-0.5">
            {value.tier?.toUpperCase() || 'NR'}
          </span>
          <button
            type="button"
            onClick={handleClear}
            class="ml-0.5 p-0.5 rounded-full hover:bg-white/10 transition-colors"
            title="Remove project tag"
            aria-label="Remove project tag"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </span>
      </div>
    );
  }

  // ─── Unselected state: search input + dropdown ───────────────────────────
  return (
    <div ref={containerRef} class="relative">
      <div class="relative">
        <div class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={ready ? placeholder : 'Loading projects...'}
          disabled={!ready && loading}
          class="w-full bg-navy border border-card-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text placeholder-text-dim/60 focus:outline-none focus:border-gold/30 transition-colors disabled:opacity-60"
          autocomplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
        {loading && !ready && (
          <div class="absolute right-2.5 top-1/2 -translate-y-1/2">
            <div class="w-3 h-3 border border-gold/40 border-t-gold rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={listRef}
          class="absolute z-50 left-0 right-0 mt-1 bg-navy-mid border border-card-border rounded-lg shadow-xl overflow-y-auto"
          style={{ maxHeight: '240px' }}
          role="listbox"
        >
          {results.map((project, idx) => {
            const color = getTierColor(project.tier);
            const isActive = idx === activeIndex;
            return (
              <button
                key={`${project.symbol}-${project.name}-${idx}`}
                type="button"
                onClick={() => handleSelect(project)}
                onMouseEnter={() => setActiveIndex(idx)}
                class={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  isActive ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                }`}
                role="option"
                aria-selected={isActive}
              >
                <span
                  class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {project.tier?.toUpperCase() || '–'}
                </span>
                <span class="flex-1 min-w-0">
                  <span class="text-xs font-medium text-text truncate block">
                    {project.name}
                  </span>
                  <span class="text-[10px] text-text-dim">
                    {project.symbol}
                    {project.category ? ` · ${project.category}` : ''}
                  </span>
                </span>
                {project.chapter && (
                  <span class="text-[10px] text-text-dim/60 shrink-0 truncate max-w-[90px]">
                    {project.chapter}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
