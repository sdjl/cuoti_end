/**
 * 学生看板组件公共工具函数
 */


export function formatMonthDay(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric"
  });
}


export function formatFullDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

/**
 * 滚动偏移量常量
 */
export const SCROLL_CONSTANTS = {
  /** 学生姓名浮动栏显示的滚动阈值 */
  STUDENT_NAME_THRESHOLD: 300,
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
