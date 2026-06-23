"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const triggerClass =
  "w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 flex items-center justify-between gap-2 min-h-[38px] cursor-pointer";

interface MultiSelectProps {
  id: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  max?: number;
  className?: string;
  allowOther?: boolean;
  otherPrompt?: string;
  otherPlaceholder?: string;
}

export function MultiSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "Select options",
  max,
  className,
  allowOther = false,
  otherPrompt = "Enter custom option",
  otherPlaceholder = "Type here…",
}: MultiSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [otherInputOpen, setOtherInputOpen] = useState(false);
  const [otherInput, setOtherInput] = useState("");

  const presetOptions = useMemo(
    () => options.filter((option) => option.toLowerCase() !== "other"),
    [options],
  );

  const available = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return presetOptions.filter((option) => {
      if (value.some((item) => item.toLowerCase() === option.toLowerCase())) {
        return false;
      }
      if (!normalized) return true;
      return option.toLowerCase().includes(normalized);
    });
  }, [presetOptions, query, value]);

  useEffect(() => {
    if (!open && !otherInputOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
        setOtherInputOpen(false);
        setOtherInput("");
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open, otherInputOpen]);

  const atMax = max !== undefined && value.length >= max;

  const addOption = (option: string) => {
    if (
      atMax ||
      value.some((item) => item.toLowerCase() === option.toLowerCase())
    ) {
      return;
    }
    onChange([...value, option]);
    setQuery("");
  };

  const removeOption = (option: string) => {
    onChange(value.filter((item) => item !== option));
  };

  const addCustomOption = () => {
    const trimmed = otherInput.trim();
    if (!trimmed || atMax) return;
    if (value.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setOtherInput("");
      return;
    }
    onChange([...value, trimmed]);
    setOtherInput("");
    setOtherInputOpen(false);
  };

  const openOtherInput = () => {
    setOpen(false);
    setQuery("");
    setOtherInputOpen(true);
    requestAnimationFrame(() => otherInputRef.current?.focus());
  };

  const preventFormSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={triggerClass}
        onClick={(e) => {
          e.stopPropagation();
          if (open) {
            setOtherInputOpen(false);
            setOtherInput("");
          }
          setOpen((prev) => !prev);
        }}
      >
        <span className="flex flex-wrap gap-1.5 min-w-0 flex-1 text-left">
          {value.length === 0 ? (
            <span className="text-text-secondary/60">{placeholder}</span>
          ) : (
            value.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-md bg-accent/10 border border-accent/20 px-2 py-0.5 text-xs text-text-primary"
              >
                {item}
                <span
                  role="button"
                  tabIndex={0}
                  className="rounded hover:bg-accent/20 p-0.5 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(item);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      removeOption(item);
                    }
                  }}
                  aria-label={`Remove ${item}`}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-text-secondary" />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg border border-border/60 bg-bg-secondary shadow-[var(--shadow-card)] overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 border-b border-border/60">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-md border border-border bg-bg-primary px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30"
              onKeyDown={(e) => {
                preventFormSubmit(e);
                if (e.key === "Escape") {
                  setOpen(false);
                  setQuery("");
                }
              }}
            />
          </div>
          <ul role="listbox" className="max-h-48 overflow-y-auto py-1">
            {available.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-secondary">
                {atMax ? `Maximum ${max} selected` : "No matching options"}
              </li>
            ) : (
              available.map((option) => (
                <li key={option} role="option" aria-selected={false}>
                  <button
                    type="button"
                    disabled={atMax}
                    className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-sidebar/70 transition-colors disabled:opacity-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      addOption(option);
                    }}
                  >
                    {option}
                  </button>
                </li>
              ))
            )}
            {allowOther && (
              <li role="option" aria-selected={false}>
                <button
                  type="button"
                  disabled={atMax}
                  className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-sidebar/70 transition-colors disabled:opacity-50 border-t border-border/60"
                  onClick={(e) => {
                    e.stopPropagation();
                    openOtherInput();
                  }}
                >
                  Other…
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {allowOther && otherInputOpen && (
        <div className="mt-2 rounded-lg border border-border/60 bg-bg-sidebar/30 p-3 space-y-2 animate-fade-in">
          <label
            className="text-xs font-medium text-text-primary"
            htmlFor={`${id}-other`}
          >
            {otherPrompt}
          </label>
          <div className="flex gap-2">
            <input
              ref={otherInputRef}
              id={`${id}-other`}
              type="text"
              value={otherInput}
              onChange={(e) => setOtherInput(e.target.value)}
              placeholder={otherPlaceholder}
              className="flex-1 rounded-md border border-border bg-bg-primary px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomOption();
                } else if (e.key === "Escape") {
                  setOtherInputOpen(false);
                  setOtherInput("");
                }
              }}
            />
            <button
              type="button"
              className="rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-accent/20 transition-colors disabled:opacity-50 shrink-0"
              disabled={!otherInput.trim() || atMax}
              onClick={(e) => {
                e.stopPropagation();
                addCustomOption();
              }}
            >
              Add
            </button>
          </div>
          <button
            type="button"
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setOtherInputOpen(false);
              setOtherInput("");
            }}
          >
            Back to list
          </button>
        </div>
      )}
    </div>
  );
}
