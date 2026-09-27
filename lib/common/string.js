
export function split(s, char = " ") {
  return s.split(char).map(i => i.trim()).filter(i => i.length > 0);
}


export function partition(s, char = " ") {
  if (s.includes(char)) {
    const i = s.indexOf(char);
    return [s.substring(0, i), char, s.substring(i + char.length, s.length)];
  } else {
    return [s, "", ""];
  }
}


export function rpartition(s, char = " ") {
  if (s.includes(char)) {
    const i = s.lastIndexOf(char);
    return [s.substring(0, i), char, s.substring(i + char.length, s.length)];
  } else {
    return ["", "", s];
  }
}


export function isAlpha(s) {
  return /^([a-zA-Z])+$/.test(s);
}


export function isAlnum(s) {
  return /^([\da-zA-Z])+$/.test(s);
}


export function isContainChinese(str) {
  // \u9fff 比 \u9fa5 更合适
  return /[\u4e00-\u9fff]/.test(str);
}


export function lastStr(s, n) {
  return s.substr(s.length - n);
}


export function removeAllSpace(s) {
  return s.replace(/\s/g, "");
}


export function toPascalCase(str) {
  return str.split("_").map(i => {
    return i === "" ? "" : i.charAt(0).toUpperCase() + i.slice(1);
  }).join("");
}
