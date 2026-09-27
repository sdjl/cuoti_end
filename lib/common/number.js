import { isEmpty, isString } from "./object.js";
import { assert } from "./others.js";
import { partition } from "./string.js";


export function isNumber(i, {
  isPositive = false,
  isInteger = false,
  allowString = true
} = {}) {
  if (i === "") return false;
  if (allowString && typeof i === "string") {
    i = Number(i);
  }
  if (typeof i !== "number" || Number.isNaN(i)) return false;
  if (isPositive && i < 0) return false;
  if (isInteger && !Number.isInteger(i)) return false;
  return true;
}


export function isPositiveInt(i) {
  return isNumber(i, {
    isPositive: true,
    isInteger: true,
    allowString: false
  }) && i > 0;
}


export function isRank(i) {
  return isNumber(i, {
    isPositive: false,
    isInteger: false,
    allowString: true
  });
}


export function isDigit(s) {
  return /^\d+$/.test(s);
}


export function isPrice(s) {
  return /^(0|[1-9][0-9]*)(\.[0-9]{1,2})?$/.test(String(s));
}


export function isIntPrice(s) {
  return /^(0|[1-9][0-9]*)$/.test(String(s));
}


export function isPhoneNumber(s) {
  return /^1[3-9]\d{9}$/.test(s);
}


export function isMaskedPhoneNumber(s) {
  return /^1[3-9]\d\*{4}\d{4}$/.test(s);
}


export function isName(s) {
  return /^[a-z][a-z0-9_]*$/.test(s);
}


export function isID(...s) {
  return s.every(i => /^[0-9a-z]{32}$/.test(i));
}


export function centsToPrice(p) {
  if (isString(p) && isEmpty(p)) {
    return "";
  } else if (isIntPrice(p)) {
    return Number(p) / 100;
  } else {
    return NaN;
  }
}


export function priceToCents(p) {
  if (isString(p) && isEmpty(p)) {
    return "";
  } else if (isPrice(p)) {
    return Math.round(Number(p) * 100);
  } else {
    return NaN;
  }
}


export function priceFormat(...price) {
  function format(p) {
    if (isIntPrice(p)) {
      const num = typeof p === "number" ? p : Number(p);
      return (Math.round(num * 100) / 100).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    } else {
      return String(p);
    }
  }
  const formatted = price.map(format);
  return formatted.length === 1 ? formatted[0] : formatted;
}


export function centsToPriceString(...numbers) {
  if (numbers.length === 1) {
    return priceFormat(centsToPrice(numbers[0]));
  } else {
    return priceFormat(...numbers.map(n => centsToPrice(n)));
  }
}


export function formatCurrency(price) {
  return parseFloat(String(price)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


export function roundPrice(price) {
  const converted = centsToPrice(price);
  if (typeof converted !== "number") return "";
  return (converted < 0 ? "-" : "") + Math.abs(Math.trunc(converted)).toString();
}


export function fractionPrice(price) {
  const converted = centsToPrice(price);
  if (typeof converted !== "number") return "";
  if (converted === Math.trunc(converted)) {
    return "";
  } else {
    const fixedStr = parseFloat(String(converted)).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    const parts = partition(fixedStr, ".");
    return parts.length >= 3 ? `.${parts[2]}` : "";
  }
}


export function round2(n) {
  return Math.round(n * 100) / 100;
}


export function clamp(i, min, max) {
  return Math.min(Math.max(i, min), max);
}


export function numberToChinese(n) {
  const units = "个十百千万";
  const chars = "零一二三四五六七八九";
  const str = n.toString();
  const s = [];
  assert(str.length <= 5, "数字太大，不能解析");
  assert(str.length > 0, "数字不能是空字符串");
  assert(str[0] !== "0", "数字不能以0开头");
  for (let i = 0; i < str.length; i++) {
    const num = str[i];
    const unit = units[str.length - i - 1];
    const char = chars[parseInt(num)];
    if (num === "0") {
      if (i === str.length - 1 || str[i + 1] !== "0") {
        s.push("零");
      }
    } else {
      s.push(char);
      s.push(unit);
    }
  }
  const delChars = ["零", "个"];
  while (delChars.includes(s[s.length - 1])) {
    s.pop();
  }
  let ret = s.join("");
  if (ret.startsWith("一十")) {
    ret = ret.substring(1);
  }
  return ret;
}


export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
