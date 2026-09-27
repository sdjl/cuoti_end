"use client";

/**
 * 时间Badge组件
 * 用于快速区分数据是今天、昨天、前天还是最近一周的
 */
export default function TimeBadge({
  timestamp,
  size = "sm"
}) {
  const now = Date.now();
  const diff = now - timestamp;
  const dayMs = 24 * 60 * 60 * 1000;
  let label = "";
  let colorClass = "";
  if (diff < dayMs) {
    // 今天
    label = "今天";
    colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (diff < 2 * dayMs) {
    // 昨天
    label = "昨天";
    colorClass = "bg-blue-100 text-blue-700 border-blue-200";
  } else if (diff < 3 * dayMs) {
    // 前天
    label = "前天";
    colorClass = "bg-amber-100 text-amber-700 border-amber-200";
  } else if (diff < 7 * dayMs) {
    // 3-6天前
    const daysAgo = Math.floor(diff / dayMs);
    label = `${daysAgo}天前`;
    colorClass = "bg-orange-100 text-orange-700 border-orange-200";
  } else {
    // 一周以上
    const weeksAgo = Math.floor(diff / (7 * dayMs));
    label = `${weeksAgo}周前`;
    colorClass = "bg-gray-100 text-gray-600 border-gray-200";
  }
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return <span className={`inline-flex items-center font-medium rounded border ${colorClass} ${sizeClass}`}>
      {label}
    </span>;
}
