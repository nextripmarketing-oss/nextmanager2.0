import React, { useState, useEffect, useRef, useMemo } from "react";
import { Passenger, PassengerStatus } from "../types/passenger";
import { PrintService } from "../services/printService";
import {
  Search,
  Printer,
  FileText,
  Command,
  CornerDownLeft,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getWorkflowStage, getStageStyle, getStageDot } from "./PassengerList";

interface GlobalSearchProps {
  passengers: Passenger[];
  onSelectPassenger: (p: Passenger) => void;
}

export default function GlobalSearch({
  passengers,
  onSelectPassenger,
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Status badge styling Helpers (matching main list styling exactly)
  const getStatusColor = (status: PassengerStatus) => {
    switch (status) {
      case "Visa Online":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "Medical Done":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "Embassy Submit":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "Visa Reject":
        return "bg-red-50 text-red-700 border-red-200/60";
      case "Manpower Done":
        return "bg-purple-50 text-purple-700 border-purple-200/60";
      case "Flight Done":
        return "bg-emerald-600 text-white border-emerald-700";
      case "Passport Return":
        return "bg-rose-50 text-rose-700 border-rose-200/60";
      case "Passport Submit":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "Workpermit Issue":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/60";
      case "Processing Cancelled":
        return "bg-slate-900 text-slate-100 border-slate-900";
      case "Others":
        return "bg-slate-100 text-slate-705 border-slate-200";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  const getDotColor = (status: PassengerStatus) => {
    switch (status) {
      case "Visa Online":
        return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
      case "Medical Done":
        return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
      case "Embassy Submit":
        return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
      case "Visa Reject":
        return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
      case "Manpower Done":
        return "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]";
      case "Flight Done":
        return "bg-white shadow-[0_0_8px_rgba(255,255,255,1)]";
      case "Passport Return":
        return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
      case "Passport Submit":
        return "bg-slate-450";
      case "Workpermit Issue":
        return "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]";
      case "Processing Cancelled":
        return "bg-gray-400";
      case "Others":
        return "bg-slate-500";
      default:
        return "bg-slate-400";
    }
  };

  // Click outside to dismiss search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut listener for focusing search input ('/' or '⌘K')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (
        e.key === "/" &&
        document.activeElement !== inputRef.current &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter passengers based on name, destination, passport, phone or serial
  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) return [];

    return passengers.filter((p) => {
      const nameMatch = p.name ? p.name.toLowerCase().includes(trimmed) : false;
      const passportMatch = p.passportNumber
        ? p.passportNumber.toLowerCase().includes(trimmed)
        : false;
      const phoneMatch = p.phone
        ? p.phone.toLowerCase().includes(trimmed)
        : false;
      const slMatch = p.sl ? String(p.sl).includes(trimmed) : false;
      const countryMatch = p.country
        ? p.country.toLowerCase().includes(trimmed)
        : false;

      return (
        nameMatch || passportMatch || phoneMatch || slMatch || countryMatch
      );
    });
  }, [query, passengers]);

  // Keep search index limited to clean bounds
  const limitedResults = useMemo(() => {
    return filtered.slice(0, 7);
  }, [filtered]);

  // Reset active index when search results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Handle arrow/enter key navigation inside active results
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (limitedResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, limitedResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = limitedResults[activeIndex];
      if (selected) {
        onSelectPassenger(selected);
        setIsOpen(false);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div
      id="global-search-container"
      ref={containerRef}
      className="relative max-w-md w-64 md:w-80 lg:w-[26rem] z-50"
    >
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
        <input
          id="global-search-input"
          ref={inputRef}
          type="text"
          placeholder="Lookup name, destination, passport, serial..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-slate-50/70 hover:bg-slate-100/70 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none font-sans text-xs font-semibold py-2.5 pl-10 pr-12 rounded-xl transition-all"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-mono leading-none tracking-tight font-bold text-slate-400 pointer-events-none bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200">
          <Command className="w-2.5 h-2.5" />
          <span>K</span>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && query.trim().length >= 2 && (
          <motion.div
            id="global-search-dropdown"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2.5 w-full bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-2xl z-[999]"
          >
            {/* Search header status row */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <span>যাত্রী অনুসন্ধান ({filtered.length} matched)</span>
              <span className="flex items-center gap-1">
                <span>Navigate</span>
                <kbd className="p-0.5 bg-white border border-slate-200 rounded text-[9px]">
                  ↓↑
                </kbd>
                <span>Select</span>
                <CornerDownLeft className="w-2.5 h-2.5" />
              </span>
            </div>

            {limitedResults.length === 0 ? (
              <div className="p-8 text-center bg-white space-y-2">
                <p className="text-xs font-semibold text-slate-500 font-sans">
                  কোন যাত্রী খুঁজে পাওয়া যায়নি
                </p>
                <p className="text-[10px] text-slate-400 font-light font-sans">
                  "name", "destination" বা "passport number" পুনরায় মিলিয়ে দেখুন
                </p>
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 p-1.5 bg-white">
                {limitedResults.map((p, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <div
                      key={p.id || index}
                      onClick={() => {
                        onSelectPassenger(p);
                        setIsOpen(false);
                        setQuery("");
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
                        isActive
                          ? "bg-blue-50/80 shadow-inner"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {p.photoUrl ? (
                          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                            <img
                              src={p.photoUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100/50 text-blue-600 flex items-center justify-center shrink-0 font-bold font-sans text-xs">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-display font-bold text-xs text-slate-900 truncate uppercase tracking-tight">
                              {p.name}
                            </span>
                            <span className="text-[9px] font-mono font-medium text-slate-400 bg-slate-50 hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-100 transition-colors">
                              SL {p.sl}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                            {p.passportNumber && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-mono text-[11px] font-semibold text-slate-600 uppercase">
                                  {p.passportNumber}
                                </span>
                              </span>
                            )}
                            {p.phone && p.phone !== "N/A" && (
                              <span className="text-slate-350">
                                | {p.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Visual Workflow Stage Indicator (Tag) */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${getStageStyle(p.status)}`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${getStageDot(p.status)}`}
                          />
                          {getWorkflowStage(p.status)}
                        </span>

                        {/* Specific Process Status Tag */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border text-slate-600 bg-slate-50 border-slate-200`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full animate-pulse shrink-0 ${getDotColor(p.status)}`}
                          />
                          <span className="hidden sm:inline">{p.status}</span>
                        </span>

                        {/* Direct Print Profile Action Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            PrintService.printSingleProfile(p);
                          }}
                          title="Print user profile immediately"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50/80 active:scale-95 border border-transparent hover:border-blue-100 rounded-lg transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filtered.length > 7 && (
                  <div className="p-2 py-1.5 text-center text-[10px] text-slate-400 font-sans font-medium bg-slate-50/50 rounded-lg mt-1 border border-slate-100">
                    Type more specific query to filter remaining{" "}
                    {filtered.length - 7} results.
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
