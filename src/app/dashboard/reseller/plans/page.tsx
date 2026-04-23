"use client"

import React, { useState } from "react"
import { LayoutGrid, Users, Wallet, Crown, Zap, List, Grid, TrendingDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlanCard } from "@/components/plans/PlanCard"
import { PlanTable } from "@/components/plans/PlanTable"
import { usePlans } from "@/hooks/usePlans"

type PlanType = "all" | "reseller" | "user"

const overviewCards = [
    { id: "all", label: "Total Plans", icon: LayoutGrid, bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8", iconBg: "#DBEAFE" },
    { id: "reseller", label: "Reseller Plans", icon: Crown, bg: "#F5F3FF", border: "#DDD6FE", text: "#6D28D9", iconBg: "#EDE9FE" },
    { id: "price", label: "Avg Price", icon: TrendingDown, bg: "#FFFBEB", border: "#FDE68A", text: "#B45309", iconBg: "#FEF3C7", value: "₹0", noFilter: true },
]

export default function PlansPage() {
    const { plans, isLoading, error } = usePlans('ALL');
    const [viewMode, setViewMode] = useState<"card" | "table">("card")
    const [activePlanType, setActivePlanType] = useState<PlanType>("reseller")

    const filtered = plans.filter(p => activePlanType === "all" || p.category === activePlanType)

    // Dynamic counts based on fetched data
    const countMap: Record<string, string> = {
        all: plans.length.toString(),
        reseller: plans.filter(p => p.category === "reseller").length.toString(),
        price: plans.length > 0
            ? `₹${Math.round(plans.reduce((acc, p) => acc + parseFloat(p.price.replace(/,/g, '')), 0) / plans.length).toLocaleString()}`
            : "₹0",
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 p-8 pt-6 page-enter">

            {/* ── Header ── */}
            <div className="page-header">
                <div className="page-header-icon">
                    <Wallet className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Pricing Plans</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Manage and view all subscription tiers available on the platform</p>
                </div>
            </div>

            {/* ── Overview filter cards ── */}
            <div className="space-y-3">
                <p className="label">Plans Overview</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                    {overviewCards.map((c) => {
                        const Icon = c.icon
                        const isActive = activePlanType === c.id
                        return (
                            <div
                                key={c.id}
                                onClick={() => !c.noFilter && setActivePlanType(c.id as PlanType)}
                                className={cn(
                                    "rounded-2xl p-5 border flex items-start justify-between gap-3 transition-all duration-200",
                                    !c.noFilter && "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg",
                                    isActive && !c.noFilter && "ring-2 ring-offset-2"
                                )}
                                style={{
                                    background: c.bg,
                                    borderColor: isActive && !c.noFilter ? c.text : c.border,
                                    boxShadow: isActive && !c.noFilter
                                        ? `0 0 0 2px ${c.text}40, 0 4px 16px rgba(0,0,0,.08)`
                                        : undefined,
                                }}
                            >
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                                        style={{ color: c.text, opacity: .65 }}>{c.label}</p>
                                    <p className="text-2xl font-bold tracking-tight"
                                        style={{ color: c.text }}>{countMap[c.id]}</p>
                                    {isActive && !c.noFilter && (
                                        <p className="text-[10px] mt-1.5 font-semibold uppercase tracking-wider"
                                            style={{ color: c.text, opacity: .55 }}>Filtered ✓</p>
                                    )}
                                </div>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: c.iconBg }}>
                                    <Icon className="h-5 w-5" style={{ color: c.text }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Plans list ── */}
            <div className="space-y-5">
                {/* List header + view toggle */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="page-header-icon w-8 h-8">
                            <LayoutGrid className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 capitalize">
                            {activePlanType === "all" ? "All Plans" : `${activePlanType} Plans`}
                            <span className="ml-2 text-xs text-slate-400 font-normal bg-slate-100 px-2 py-0.5 rounded-full">
                                {isLoading ? "..." : filtered.length} found
                            </span>
                        </h3>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        {(["card", "table"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setViewMode(v)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    viewMode === v
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {v === "card"
                                    ? <><Grid className="h-3.5 w-3.5" />Card View</>
                                    : <><List className="h-3.5 w-3.5" />Table View</>
                                }
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4 bg-white/50 backdrop-blur rounded-3xl border border-slate-100">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching Latest Tiers...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center gap-4">
                        <p className="font-bold">{error}</p>
                    </div>
                ) : (
                    <>
                        {viewMode === "card" ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger">
                                {filtered.map((plan) => (
                                    <PlanCard key={plan.id} plan={plan} />
                                ))}
                            </div>
                        ) : (
                            <PlanTable plans={filtered} />
                        )}

                        {filtered.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-sm text-slate-400 font-medium">No plans found for this category.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
