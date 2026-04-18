import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { searchProjects, type CryptoProject } from '../lib/api';
import { TIER_COLORS } from './ProjectBadge';

function getTierColor(tier: string): string {
  return TIER_COLORS[tier?.toUpperCase()] ?? TIER_COLORS.D;
}

interface ProjectTagInputProps {
  /** Currently selected project (null = none) */
  selected: { name: string; tier: string } | null;
  /** Called when a project is selected or cleared */
  onSelect: (project: { name: string; tier: string } | null) => void;
}

export default function ProjectTagInput({ selected, onSelect }: ProjectTagInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CryptoProject[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const matches = await searchProjects(q);
      setResults(matches);
      setIsOpen(matches.length > 0);
      setActiveIndex(-1);
    } catch {
      setResults([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    setQuery(val);

    // Debounce search by 200ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 200);
  };

  const handleSelect = (project: CryptoProject) => {
    onSelect({ name: project.name, tier: project.tier });
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

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

  // If a project is already selected, show it as a chip
  if (selected) {
    const color = getTierColor(selected.tier);
    return (
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center gap-1.5 text-xs pl-2.5 pr-1.5 py-1 rounded-full"
          style={{
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`,
            color: color,
          }}
        >
          <span
            class="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span class="font-medium">{selected.name}</span>
          <span class="text-[10px] font-bold opacity-70 ml-0.5">
            {selected.tier?.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={handleClear}
            class="ml-0.5 p-0.5 rounded-full hover:bg-white/10 transition-colors"
            title="Remove project tag"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} class="relative">
      {/* Input */}
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <div class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            placeholder="Tag a crypto project..."
            class="w-full bg-navy border border-card-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text placeholder-text-dim/50 focus:outline-none focus:border-gold/30 transition-colors"
            autocomplete="off"
          />
          {loading && (
            <div class="absolute right-2.5 top-1/2 -translate-y-1/2">
              <div class="w-3 h-3 border border-gold/40 border-t-gold rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={listRef}
          class="absolute z-50 left-0 right-0 mt-1 bg-[#0D2451] border border-card-border rounded-lg shadow-xl overflow-y-auto"
          style={{ maxHeight: '220px' }}
        >
          {results.map((project, idx) => {
            const color = getTierColor(project.tier);
            const isActive = idx === activeIndex;
            return (
              <button
                key={`${project.symbol}-${project.name}`}
                type="button"
                onClick={() => handleSelect(project)}
                onMouseEnter={() => setActiveIndex(idx)}
                class={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  isActive ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                }`}
              >
                {/* Tier badge */}
                <span
                  class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                  }}
                >
                  {project.tier?.toUpperCase()}
                </span>

                {/* Name and symbol */}
                <span class="flex-1 min-w-0">
                  <span class="text-xs font-medium text-text truncate block">
                    {project.name}
                  </span>
                  <span class="text-[10px] text-text-dim">
                    {project.symbol} / {project.category}
                  </span>
                </span>

                {/* Chapter tag */}
                {project.chapter && (
                  <span class="text-[10px] text-text-dim/60 shrink-0">
                    Ch. {project.chapter}
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
