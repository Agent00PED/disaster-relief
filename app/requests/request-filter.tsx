"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface RequestFilterProps {
  centers?: { id: string; name: string; name_en?: string | null }[];
  dict: Dictionary;
  lang?: string;
}

function RequestFilterContent({ centers = [], dict, lang }: RequestFilterProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentSearch = searchParams.get("q") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const currentUrgency = searchParams.get("urgency") ?? "";
  const currentCenter = searchParams.get("center_id") ?? "";
  const currentStatus = searchParams.get("status") ?? "";

  // ตรวจสอบว่ามีการใช้ตัวกรองอยู่หรือไม่
  const isFiltered = Boolean(
    currentSearch || currentCategory || currentUrgency || currentCenter || currentStatus
  );

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    const query = params.toString();
    replace(query ? `${pathname}?${query}` : pathname);
  };

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "") {
      params.delete("status");
    } else {
      params.set("status", value);
    }

    const query = params.toString();
    replace(query ? `${pathname}?${query}` : pathname);
  };

  // ฟังก์ชันล้างตัวกรองทั้งหมด
  const handleReset = () => {
    replace(pathname);
  };

  const categoryFilters = [
    { label: dict.requests.allCategories, value: "" },
    { label: `🍞 ${dict.form.categoryFood}`, value: "food" },
    { label: `💧 ${dict.form.categoryWater}`, value: "water" },
    { label: `💊 ${dict.form.categoryMedicine}`, value: "medicine" },
    { label: `👕 ${dict.form.categoryClothing}`, value: "clothing" },
    { label: `🧴 ${dict.form.categoryHygiene}`, value: "hygiene" },
    { label: `📦 ${dict.form.categoryOther}`, value: "other" },
  ];

  const urgencyFilters = [
    { label: dict.requests.allUrgencies, value: "" },
    { label: `🔴 ${dict.requests.urgencyHigh}`, value: "high" },
    { label: `🟡 ${dict.requests.urgencyMedium}`, value: "medium" },
    { label: `🟢 ${dict.requests.urgencyLow}`, value: "low" },
  ];

  const statusFilters = [
    { label: dict.requests.allStatuses, value: "" },
    { label: dict.requests.statusPending, value: "pending" },
    { label: dict.requests.statusPartial, value: "partial" },
    { label: dict.requests.statusFulfilled, value: "fulfilled" },
    { label: dict.requests.statusCancelled, value: "cancelled" },
  ];

  return (
    <div className="mb-6 space-y-3">
      {/* แถบค้นหา + ตัวกรองศูนย์พักพิง + ตัวกรองความเร่งด่วน + ปุ่มล้างตัวกรอง */}
      <div className="flex flex-wrap items-center gap-2">
        {/* ช่องค้นหา */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={currentSearch}
            onChange={(e) => handleFilter("q", e.target.value)}
            placeholder={dict.requests.searchPlaceholder}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        {/* ตัวกรองศูนย์พักพิง */}
        <select
          value={currentCenter}
          onChange={(e) => handleFilter("center_id", e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">{dict.requests.allCenters}</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>
              {lang === "en" && c.name_en ? c.name_en : c.name}
            </option>
          ))}
        </select>

        {/* ตัวกรองความเร่งด่วน */}
        <select
          value={currentUrgency}
          onChange={(e) => handleFilter("urgency", e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          {urgencyFilters.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>

        {/* ตัวกรองสถานะ */}
        <select
          value={currentStatus}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          {statusFilters.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        {/* ปุ่มล้างตัวกรอง (จะแสดงเฉพาะเมื่อมีการกรองค้างอยู่) */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-white"
          >
            ✕ {dict.common.clearFilters}
          </button>
        )}
      </div>

      {/* ปุ่มเลือกหมวดหมู่ */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {categoryFilters.map((filter) => {
          const isActive = currentCategory === filter.value;

          return (
            <button
              key={filter.value || "all"}
              type="button"
              onClick={() => handleFilter("category", filter.value)}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                isActive
                  ? "border-brand bg-brand text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
              ].join(" ")}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RequestFilter(props: RequestFilterProps) {
  return (
    <Suspense fallback={<div className="mb-6 h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
      <RequestFilterContent {...props} />
    </Suspense>
  );
}