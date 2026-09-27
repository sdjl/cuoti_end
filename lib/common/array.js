import { isArray, isNone, isObject, isString, pickValue } from "./object.js";


export function extractNestedArrays(arr, key) {
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    if (isArray(arr[i][key])) {
      result = result.concat(arr[i][key]);
    }
  }
  return result;
}


export function splitArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}


export function extractFields(arr, ...fields) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const obj = {};
    for (let j = 0; j < fields.length; j++) {
      obj[fields[j]] = arr[i][fields[j]];
    }
    result.push(obj);
  }
  return result;
}


export function isIn(item, arr) {
  if (isArray(arr)) {
    return arr.indexOf(item) !== -1;
  } else if (isObject(arr)) {
    return isIn(item, Object.keys(arr));
  } else if (isString(arr)) {
    return arr.indexOf(String(item)) !== -1;
  } else {
    return false;
  }
}


export function includesDoc(arr, doc) {
  return arr.some(item => item._id === doc._id);
}


export function docIndexOf(arr, doc) {
  return arr.findIndex(item => item._id === doc._id);
}


export function replaceAll(array, target, replacement) {
  return array.map(element => {
    return element === target ? replacement : element;
  });
}


export function sortByKeys(arr, keys) {
  function compare(a, b) {
    for (const key in keys) {
      const valueA = pickValue(a, key);
      const valueB = pickValue(b, key);
      let c = 0;
      if (valueA !== null && valueB !== null && valueA !== undefined && valueB !== undefined) {
        c = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        throw new Error(`valueA: ${valueA}, valueB: ${valueB}`);
      }
      if (keys[key] === "desc") {
        c *= -1;
      } else if (keys[key] !== "asc") {
        throw new Error(`排序参数错误，必须是asc或desc，不能是${keys[key]}`);
      }
      if (c !== 0) return c;
    }
    return 0;
  }

  // 过滤掉任何属性取值为 null 或 undefined 的元素
  arr = arr.filter(item => Object.keys(keys).every(key => !isNone(pickValue(item, key))));
  return arr.sort(compare);
}


export function filterNone(arr) {
  return arr.filter(item => !isNone(item));
}


export function uniqueArray(arr) {
  const uniqueArr = [];
  const existingSet = new Set();
  for (const item of arr) {
    if (!existingSet.has(item)) {
      uniqueArr.push(item);
      existingSet.add(item);
    }
  }
  return uniqueArr;
}


export function removeById(arr, id) {
  return arr.filter(item => item._id !== id);
}


export function hasDuplicate(arr) {
  return new Set(arr).size !== arr.length;
}
