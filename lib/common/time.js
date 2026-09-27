import { isString } from "./object.js";


export function now() {
  return new Date();
}


export function getTimeFromId(id) {
  const t = parseInt(id.substring(8, 16), 16) * 1000;
  return new Date(t);
}


export function yymmdd(t) {
  const y = t.getFullYear();
  const m = (t.getMonth() + 1).toString().padStart(2, "0");
  const d = t.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}


export function hhmmss(t) {
  const h = t.getHours().toString().padStart(2, "0");
  const m = t.getMinutes().toString().padStart(2, "0");
  const s = t.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}


export function padDateZero(n) {
  return n.toString().padStart(2, "0");
}


export function dateToString(t) {
  if (t === undefined) {
    t = new Date();
  }
  if (!t) {
    return "";
  }
  return `${yymmdd(t)} ${hhmmss(t)}`;
}


export function dateFromString(s) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s} 00:00:00`);
  } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    return new Date(s);
  } else {
    throw new Error(`不支持的日期格式：${s}`);
  }
}


export function timestamp(t) {
  return t ? t.getTime() : Date.now();
}


export function timestampSeconds(t) {
  return Math.floor(timestamp(t) / 1000);
}


export function timestampString(t = null) {
  t = t || new Date();
  const y = t.getFullYear();
  const m = (t.getMonth() + 1).toString().padStart(2, "0");
  const d = t.getDate().toString().padStart(2, "0");
  const h = t.getHours().toString().padStart(2, "0");
  const M = t.getMinutes().toString().padStart(2, "0");
  const s = t.getSeconds().toString().padStart(2, "0");
  return `${y}${m}${d}${h}${M}${s}`;
}


export function yesterday() {
  return daysAgo(1);
}


export function today() {
  const date = new Date();
  return yymmdd(date);
}


export function tomorrow() {
  return daysAgo(-1);
}


export function afterTomorrow() {
  return daysAgo(-2);
}


export function firstDayOfWeek(n = 0) {
  const date = new Date();
  const day = date.getDay();
  if (day === 0) {
    // 周日的情况
    date.setDate(date.getDate() - 7 + 1 + n * 7);
  } else {
    date.setDate(date.getDate() - day + 1 + n * 7);
  }
  return yymmdd(date);
}


export function lastDayOfWeek(n = 0) {
  const date = new Date();
  const day = date.getDay();
  if (day === 0) {
    // 周日的情况
    date.setDate(date.getDate() + n * 7);
  } else {
    date.setDate(date.getDate() - day + 7 + n * 7);
  }
  return yymmdd(date);
}


export function firstDayOfMonth(n = 0) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + n);
  return yymmdd(date);
}


export function lastDayOfMonth(n = 0) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + 1 + n);
  date.setDate(0);
  return yymmdd(date);
}


export function daysAgoDate(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date;
}


export function daysLaterDate(n) {
  return daysAgoDate(-n);
}


export function daysAgo(n) {
  return yymmdd(daysAgoDate(n));
}


export function daysLater(n) {
  return daysAgo(-n);
}


export function monthsAgoDate(n) {
  const date = new Date();
  date.setMonth(date.getMonth() - n);
  return date;
}


export function monthsLaterDate(n) {
  return monthsAgoDate(-n);
}


export function monthsAgo(n) {
  return yymmdd(monthsAgoDate(n));
}


export function monthsLater(n) {
  return monthsAgo(-n);
}


export function minutesAgo(n) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - n);
  return date;
}


export function minutesLater(n) {
  return minutesAgo(-n);
}


export function secondsAgo(n) {
  const date = new Date();
  date.setSeconds(date.getSeconds() - n);
  return date;
}


export function secondsLater(n) {
  return secondsAgo(-n);
}


export function withinSeconds(t, n) {
  if (typeof t !== "number") {
    t = timestamp(t);
  }
  return timestamp(secondsAgo(n)) < t;
}


export function isToday(t) {
  if (!t) return false;
  if (isString(t)) t = dateFromString(t);
  return yymmdd(t) === today();
}


export function isDateString(s) {
  if (!isString(s)) return false;
  const reg = /^\d{4}-\d{2}-\d{2}$/;
  if (!reg.test(s)) return false;
  const date = dateFromString(s);
  return yymmdd(date) === s;
}


export function compareDateString(s1, s2) {
  if (!isDateString(s1) || !isDateString(s2)) return null;
  const d1 = dateFromString(s1);
  const d2 = dateFromString(s2);
  return d1 > d2 ? 1 : d1 < d2 ? -1 : 0;
}


export function dayCN(t) {
  if (isString(t)) t = dateFromString(t);
  const y = t.getFullYear();
  const m = t.getMonth() + 1;
  const d = t.getDate();
  return `${y}年${m}月${d}日`;
}


export function weekdayCN(t) {
  if (!t) return "";
  if (isString(t)) t = dateFromString(t);
  const w = t.getDay();
  return `周${"日一二三四五六".charAt(w)}`;
}


export function getDaysInMonth(t) {
  if (isString(t)) {
    t = new Date(t);
  }
  const year = t.getFullYear();
  const month = t.getMonth() + 1;
  return new Date(year, month, 0).getDate();
}


export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export function relativeTimeString(date) {
  const nowDate = new Date();
  const diff = nowDate.getTime() - date.getTime();
  if (diff < 0) {
    return "未来";
  }
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;
  if (diff < minute) {
    return "刚刚";
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}分钟前`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}小时前`;
  } else if (diff < month) {
    const days = Math.floor(diff / day);
    return `${days}天前`;
  } else if (diff < year) {
    const months = Math.floor(diff / month);
    return `${months}月前`;
  } else {
    const years = (diff / year).toFixed(1);
    return `${years}年前`;
  }
}
