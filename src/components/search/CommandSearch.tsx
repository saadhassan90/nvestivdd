import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, AlertTriangle, Users, HelpCircle, BookOpen, Sparkles, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  type: string;
  id: string;
  projectId?: string;
  title: string;
  subtitle: string;
  score?: number;
  severity?: string;
  highlight: string;
  url: string;
  matched_term?: string;
}

interface SearchResults {
  projects: SearchResult[];
  flags: SearchResult[];
  team: SearchResult[];
  questions: SearchResult[];
  sections: SearchResult[];
  semantic: SearchResult[];
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  projects: { label: "Deals", icon: FileText, color: "text-primary" },
  flags: { label: "Red Flags", icon: AlertTriangle, color: "text-destructive" },
  team: { label: "Team Members", icon: Users, color: "text-blue-500" },
  questions: { label: "Due Diligence Questions", icon: HelpCircle, color: "text-amber-500" },
  sections: { label: "Report Sections", icon: BookOpen, color: "text-emerald-500" },
  semantic: { label: "Related Concepts", icon: Sparkles, color: "text-violet-500" },
};

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!text || !query) return <span>{text}</span>;
  const parts: { text: string; match: boolean }[] = [];
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  let lastIndex = 0;

  let idx = lower.indexOf(qLower);
  while (idx !== -1) {
    if (idx > lastIndex) parts.push({ text: text.slice(lastIndex, idx), match: false });
    parts.push({ text: text.slice(idx, idx + query.length), match: true });
    lastIndex = idx + query.length;
    idx = lower.indexOf(qLower, lastIndex);
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), match: false });

  return (
    <span>
      {parts.map((p, i) =>
        p.match ? (
          <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </span>
  );
}

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
    }
  }, [open]);

  // Flatten results for keyboard nav
  const flatResults = results
    ? [
        ...results.projects,
        ...results.flags,
        ...results.team,
        ...results.questions,
        ...results.sections,
        ...results.semantic,
      ]
    : [];

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("semantic-search", {
        body: { query: q.trim(), limit: 15 },
      });
      if (error) throw error;
      setResults(data as SearchResults);
      setSelectedIndex(0);
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(flatResults[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const totalCount = flatResults.length;
  const isMac = navigator.platform?.toUpperCase().includes("MAC");

  return (
    <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative">
      {/* Trigger / active search bar */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center"
        >
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="w-full rounded-lg border-0 bg-muted py-2 pl-10 pr-16 text-sm text-muted-foreground text-left cursor-pointer group-hover:bg-muted/80 transition-colors">
              Search deals...
            </div>
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-card px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              {isMac ? "⌘" : "Ctrl+"}K
            </kbd>
          </div>
        </button>
      ) : (
        <div className="w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search deals, team members, red flags, reports..."
              className="w-full rounded-lg border-0 bg-muted py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {query && !loading && (
                <button onClick={() => { setQuery(""); setResults(null); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Dropdown results panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border bg-card shadow-xl animate-in fade-in-0 slide-in-from-top-1 duration-150">
          <div className="max-h-[60vh] overflow-y-auto">
            {query.length < 2 && !results && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Type to search across all deals, team members, red flags, and reports
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {["fund name", "team member", "red flag", "strategy"].map((hint) => (
                    <button
                      key={hint}
                      onClick={() => handleInputChange(hint)}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.length >= 2 && !loading && totalCount === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
                <p className="text-xs text-muted-foreground mt-1">Try different keywords or a broader search</p>
              </div>
            )}

            {results && (
              <div className="py-1">
                {(Object.keys(CATEGORY_CONFIG) as (keyof SearchResults)[]).map((category) => {
                  const items = results[category];
                  if (!items || items.length === 0) return null;
                  const config = CATEGORY_CONFIG[category];
                  const Icon = config.icon;

                  return (
                    <div key={category}>
                      <div className="px-4 py-2 flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {config.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">({items.length})</span>
                      </div>
                      {items.map((result) => {
                        const globalIdx = flatResults.indexOf(result);
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <button
                            key={`${result.type}-${result.id}`}
                            className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${
                              isSelected ? "bg-muted" : "hover:bg-muted/50"
                            }`}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground truncate">
                                  <HighlightedText text={result.title} query={query} />
                                </p>
                                {result.score != null && (
                                  <span className="shrink-0 text-[10px] font-bold text-muted-foreground border border-border rounded px-1.5 py-0.5">
                                    {result.score}
                                  </span>
                                )}
                                {result.severity && (
                                  <span className={`shrink-0 text-[10px] font-bold rounded px-1.5 py-0.5 ${
                                    result.severity === "critical"
                                      ? "bg-destructive/10 text-destructive"
                                      : "bg-amber-500/10 text-amber-600"
                                  }`}>
                                    {result.severity}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {result.subtitle}
                              </p>
                              {result.highlight && (
                                <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                                  <HighlightedText text={result.highlight} query={query} />
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {totalCount > 0 && (
            <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{totalCount} results</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-card px-1 font-mono text-[10px]">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-card px-1 font-mono text-[10px]">↵</kbd>
                  open
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-card px-1 font-mono text-[10px]">esc</kbd>
                  close
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
