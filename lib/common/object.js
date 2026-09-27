import { extractFields } from "./array.js";

// 定义一个通用类型，用于替代most any类型


export function isNone(i) {
  return i === undefined || i === null;
}


export function isEmpty(i) {
  return isNone(i) || isArray(i) && i.length === 0 || isString(i) && i.trim().length === 0 || isObject(i) && Object.keys(i).length === 0;
}


export function isAnyEmpty(...args) {
  return args.some(arg => isEmpty(arg));
}


export function isEqual(a, b) {
  if (a === b) return true;
  if (isNone(a) || isNone(b)) return false;
  if (isArray(a) && isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (isObject(a) && isObject(b)) {
    if (Object.keys(a).length !== Object.keys(b).length) return false;
    for (const k in a) {
      if (!isEqual(a[k], b[k])) return false;
    }
    return true;
  }
  if (isSet(a) && isSet(b)) {
    if (a.size !== b.size) {
      return false;
    }
    return Array.from(a).every(item => b.has(item));
  }
  return false;
}


export function isArray(i) {
  return Array.isArray(i);
}


export function isObject(i) {
  return typeof i === "object" && !isArray(i) && !isNone(i) && !isDate(i);
}


export function isSet(i) {
  return i instanceof Set;
}


export function isObjectOrArray(i) {
  return isObject(i) || isArray(i);
}


export function isFunction(i) {
  return typeof i === "function";
}


export function isString(i) {
  return typeof i === "string" || i instanceof String;
}


export function isBoolean(i) {
  return typeof i === "boolean";
}


export function isDate(i) {
  return i instanceof Date;
}


export function hasAnyKey(obj, ...keys) {
  return keys.some(key => Object.hasOwn(obj, key));
}


export function jsonDeepCopy(i) {
  return JSON.parse(JSON.stringify(i));
}


export function toJsonString(i) {
  return JSON.stringify(i);
}


export function fromJsonString(i) {
  return JSON.parse(i);
}


export function deepCopy(obj) {
  if (typeof obj !== "object" || obj === null || obj === undefined) {
    return obj;
  } else if (isArray(obj)) {
    return obj.map(deepCopy);
  } else if (isDate(obj)) {
    return new Date(obj);
  } else {
    const ret = {};
    for (const key in obj) {
      ret[key] = deepCopy(obj[key]);
    }
    return ret;
  }
}

/**
 * 深拷贝，会保留undefined、null
 */
export function clone(obj) {
  return deepCopy(obj);
}


export function getByteLen(obj, addKeyBytes = false) {
  let strValue;
  if (typeof obj !== "string") {
    strValue = JSON.stringify(obj);
  } else {
    strValue = obj;
  }
  let len = 0;
  for (let i = 0; i < strValue.length; i++) {
    len += strValue.charAt(i).match(/[^\x00-\xff]/gi) !== null ? 2 : 1;
  }
  return addKeyBytes ? len + 20 : len;
}


export function getKLen(obj, addKeyBytes = true) {
  return (getByteLen(obj, addKeyBytes) / 1024).toFixed(1);
}


export function deleteAllKey(obj, delKey) {
  if (isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      deleteAllKey(obj[i], delKey);
    }
  } else if (isObject(obj)) {
    for (const key in obj) {
      if (key === delKey) {
        delete obj[key];
      } else if (typeof obj[key] === "object") {
        deleteAllKey(obj[key], delKey);
      }
    }
  }
}


export function allKeyMap(obj, key, fn, options = {
  overWrite: true
}) {
  const {
    overWrite = true
  } = options;
  if (isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      allKeyMap(obj[i], key, fn, {
        overWrite
      });
    }
  } else if (isObject(obj)) {
    for (const k in obj) {
      if (k === key) {
        const result = fn(obj[k], obj);
        if (overWrite) {
          obj[k] = result === undefined ? null : result;
        }
      } else if (typeof obj[k] === "object") {
        allKeyMap(obj[k], key, fn, {
          overWrite
        });
      }
    }
  }
}


export function setDefault(arr, obj) {
  if (!isArray(arr)) {
    throw new Error("传给sh.setDefault的arr必须是数组");
  }
  const keys = Object.keys(obj);
  for (let i = 0; i < arr.length; i++) {
    if (isNone(arr[i])) {
      continue;
    }
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j];
      const value = obj[key];
      if (key.includes(".")) {
        const ks = key.split(".");
        let current, pre, ki;
        for (ki = 0; ki < ks.length; ki++) {
          if (ki === 0) {
            pre = null;
            current = arr[i];
          } else {
            pre = current;
            current = current && ks[ki - 1] in current ? current[ks[ki - 1]] : undefined;
          }
          if (isNone(current)) {
            if (ki === 0) {
              current = arr[i] = {};
            } else if (pre) {
              current = pre[ks[ki - 1]] = {};
            }
          } else if (!isObject(current)) {
            break;
          }
        }
        if (ki === ks.length && current && isNone(current[ks[ki - 1]])) {
          current[ks[ki - 1]] = value;
        }
      } else if (isNone(arr[i][key])) {
        arr[i][key] = value;
      }
    }
  }
}


export function obj2str(obj, indent = 0) {
  let str = "";
  const indent_str = "  ".repeat(indent);
  if (isNone(obj)) {
    return "null";
  }
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];
    if (isObject(value)) {
      str += `${indent_str}${key}: \n${obj2str(value, indent + 1)}\n`;
    } else if (isArray(value)) {
      str += `${indent_str}${key}:\n`;
      const arr_str = [];
      for (let j = 0; j < value.length; j++) {
        arr_str.push(`${indent_str}  [${j}]`);
        arr_str.push(obj2str(value[j], indent + 2));
      }
      str += arr_str.join("\n");
    } else {
      str += `${indent_str}${key}: ${value}\n`;
    }
  }
  return str.trimEnd();
}


export function pickValue(obj, key) {
  if (key.includes(".")) {
    const ks = key.split(".");
    for (let i = 0; i < ks.length; i++) {
      obj = obj[ks[i]];
      if (isNone(obj)) {
        return obj;
      }
    }
    return obj;
  } else {
    return obj[key];
  }
}


export function putValue(obj, key, value, options = {
  removeUndefined: true
}) {
  const {
    removeUndefined = true
  } = options;
  if (key.includes(".")) {
    const ks = key.split(".");
    let current, pre, i;
    for (i = 0; i < ks.length; i++) {
      if (i === 0) {
        pre = null;
        current = obj;
      } else {
        pre = current;
        current = current && ks[i - 1] in current ? current[ks[i - 1]] : undefined;
      }
      if (isNone(current)) {
        if (i === 0) {
          throw new Error("传给sh.putValue的obj不能为null或undefined");
        } else if (pre) {
          current = pre[ks[i - 1]] = {};
        }
      } else if (!isObject(current)) {
        break;
      }
    }
    if (i === ks.length && current) {
      if (value === undefined && removeUndefined) {
        delete current[ks[i - 1]];
      } else {
        current[ks[i - 1]] = value;
      }
    } else {
      throw new Error(`传给sh.putValue的key ${key} 不合法，因为${ks[i - 1]}不是对象`);
    }
  } else {
    if (isNone(obj)) {
      throw new Error("传给sh.putValue的obj不能为null或undefined");
    } else {
      if (value === undefined && removeUndefined) {
        delete obj[key];
      } else {
        obj[key] = value;
      }
    }
  }
}


export function putObj(obj, objValue, options = {
  removeUndefined: true
}) {
  const {
    removeUndefined = true
  } = options;
  function _put(prePath, oValue) {
    for (const key in oValue) {
      const value = oValue[key];
      if (isObject(value)) {
        _put(`${prePath}${key}.`, value);
      } else {
        putValue(obj, `${prePath}${key}`, value, {
          removeUndefined
        });
      }
    }
  }
  _put("", objValue);
}


export function pushValue(obj, key, value) {
  const exists = pickValue(obj, key);
  if (isNone(exists)) {
    putValue(obj, key, [value]);
  } else if (isArray(exists)) {
    exists.push(value);
  } else {
    throw new Error(`传给sh.pushValue的key ${key} 不合法，因为${key}不是数组`);
  }
}


export function pickObj(obj, keys) {
  if (isArray(obj)) {
    return obj.map(o => pickObj(o, keys));
  } else {
    const newObj = {};
    keys.forEach(key => {
      if (Object.hasOwn(obj, key)) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  }
}


export function trimAllKey(obj) {
  if (isObject(obj)) {
    for (const key in obj) {
      if (isString(obj[key])) {
        obj[key] = obj[key].trim();
      } else if (isObjectOrArray(obj[key])) {
        trimAllKey(obj[key]);
      }
    }
  } else if (isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (isString(obj[i])) {
        obj[i] = obj[i].trim();
      } else if (isObjectOrArray(obj[i])) {
        trimAllKey(obj[i]);
      }
    }
  }
}


export function objLength(obj) {
  return Object.keys(obj).length;
}


export function serializeObj(obj) {
  function sort(item) {
    if (isArray(item)) {
      return item.map(sort);
    }
    if (!isObject(item)) {
      return item;
    }
    const sorted_keys = Object.keys(item).sort();
    return sorted_keys.reduce((result, key) => {
      result[key] = sort(item[key]);
      return result;
    }, {});
  }
  return JSON.stringify(sort(obj));
}


export function extractSubObj(obj, ...fields) {
  const arr = [obj];
  const result = extractFields(arr, ...fields);
  return result[0];
}
