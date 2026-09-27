/**
 * 知识点学情看板公共工具函数
 */

/**
 * 格式化时间戳为月日格式
 */
export function formatMonthDay(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric"
  });
}

/**
 * 格式化时间戳为完整日期格式
 */
export function formatFullDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

/**
 * 根据掌握率获取对应的颜色类
 */
export function getMasteryColor(rate) {
  if (rate >= 80) return "text-green-600";
  if (rate >= 60) return "text-blue-600";
  if (rate >= 40) return "text-yellow-600";
  return "text-red-600";
}

/**
 * 根据掌握率获取背景颜色类
 */
export function getMasteryBgColor(rate) {
  if (rate >= 80) return "bg-green-500";
  if (rate >= 60) return "bg-blue-500";
  if (rate >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

/**
 * 根据难度获取颜色类
 */
export function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case "简单":
      return "text-green-600 bg-green-100";
    case "中等":
      return "text-yellow-600 bg-yellow-100";
    case "困难":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

/**
 * 滚动偏移量常量
 */
export const SCROLL_CONSTANTS = {
  /** 知识点名称浮动栏显示的滚动阈值 */
  KNOWLEDGE_NAME_THRESHOLD: 300,
  /** 浮动导航激活区域的顶部偏移 */
  NAV_ACTIVE_OFFSET: 150,
  /** 平滑滚动时的顶部留白 */
  SCROLL_TOP_OFFSET: 80
};


export function debounce(func, wait) {
  let timeout = null;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
