/**
 * Node.js中操作腾讯云数据库文档：https://docs.cloudbase.net/api-reference/server/node-sdk/database/fetch
 */

import { isIn } from "./array.js";
import { app } from "./cloud.js";
import { appName } from "./env.js";
import { isEmpty, isNone, isString } from "./object.js";
import { assert } from "./others.js";
import { split } from "./string.js";
import { dateToString, getTimeFromId, hhmmss, yymmdd } from "./time.js";

/** 全局数据库实例 */
let DB_CACHE = null;

/**
 * 返回数据库实例
 */
export function database() {
  if (!DB_CACHE) {
    DB_CACHE = app().database();
  }
  return DB_CACHE;
}

/**
 * 数据库查询指令command
 */
export function command() {
  return database().command;
}

/** 返回数据库的RegExp */
export function regExp() {
  return database().RegExp;
}

/**
 * 聚合查询指令aggregate
 */
export function aggregate() {
  return database().command.aggregate;
}

/**
 * 生产环境下添加p_前缀
 */
export function collName(c) {
  assert(!c.startsWith(appName()) && !c.startsWith("p_"), "集合名称不能以appName或p_开头");
  c = `${appName()}_${c}`;
  // 生产环境添加p_前缀
  if (process.env.NODE_ENV === "production") {
    c = `p_${c}`;
  }
  return c;
}

/**
 * 返回集合
 * 不可以在其他地方使用db().collection()
 * 若代码不小心没有调用coll,则一定会操作测试环境
 */
export function coll(c) {
  return database().collection(collName(c)); // 此文件中只有这里可以写collection
}

/**
 * 返回聚合
 */
export function agg(c) {
  return coll(c).aggregate();
}

/**
 * 返回doc
 */
export function doc(c, id) {
  return coll(c).doc(id);
}

/**
 * 获得1000条数据； .then(docs)
 * orderBy: 排序字段，可用有序字典排序，如：{a: 'asc', b: 'desc', 'c.d.e': 'asc'}
 * orderBy为字符串时，表示按该字段升序排列
 * 升序可以写：'asc', 1, true
 * 降序可以写：'desc', 0, false
 */
export function docs({
  c,
  w = {},
  pageNum = 0,
  pageSize = 1000,
  only = "",
  except = "",
  created = false,
  orderBy = {}
}) {
  return new Promise((resolve, reject) => {
    let query = coll(c).where(w).skip(pageNum * pageSize).limit(pageSize).field(makeField(only, except));
    if (!isEmpty(orderBy)) {
      const finalOrderBy = prepareOrderBy(orderBy);
      for (const k in finalOrderBy) {
        query = query.orderBy(k, finalOrderBy[k]);
      }
    }
    query.get().then(res => {
      if (res.data.length > 0) {
        if (created) {
          for (const d of res.data) {
            d.created = getTimeFromId(d._id);
            d.createdStr = dateToString(d.created);
            d.yymmdd = yymmdd(d.created);
            d.hhmmss = hhmmss(d.created);
          }
        }
        resolve(res.data);
      } else {
        resolve([]);
      }
    }).catch(reject);
  });
}

/**
 * 获得所有数据（用aggregate读数据库，每次读取10000条，多次读取合并返回）
 * 此函数一般用于数据量不大且不想实现分页的情况
 * 若每个文档的平均大小较大，可缩小pageSize的值（云端单次读取超过50M会报错）
 * 尽量使用only、except缩小单次读取的数据量（以免超过50M，英文逗号分割字段名）
 * 先执行project，再执行only/except，最后执行sort
 * 如果使用了project，通常并不需要only/except，因为project已经实现了only/except的功能
 */
export async function allDocs({
  c,
  match = {},
  project = {},
  sort = {
    _id: 1
  },
  pageSize = 1000000,
  only = "",
  except = "",
  limit = null
}) {
  let total = 0;
  const finalSort = {};
  if (!isEmpty(sort)) {
    Object.assign(finalSort, prepareSort(sort));
  }
  const result = [];
  let hasMore = true;
  let pageNum = 0;
  while (hasMore) {
    let query = agg(c).match(match);
    if (!isEmpty(project)) {
      query = query.project(project);
    }
    if (only || except) {
      query = query.project(makeField(only, except));
    }
    let currentPageSize;
    if (limit) {
      currentPageSize = Math.min(pageSize, limit - total);
    } else {
      currentPageSize = pageSize;
    }
    query = query.sort(finalSort).skip(pageNum * pageSize).limit(currentPageSize);
    const res = await query.end();
    result.push(...res.data);
    total += res.data.length;
    hasMore = res.data.length === pageSize && (!limit || total < limit);
    pageNum++;
  }
  if (limit && total > limit) {
    return result.slice(0, limit);
  } else {
    return result;
  }
}

/**
 * 更新文档,若文档存在且更新了则触发then(true). 文档不存在或内容不变时触发then(false)
 */
export function updateDoc(c, id, d) {
  return new Promise((resolve, reject) => {
    doc(c, id).update(excludeId(d)).then(res => {
      if (res.updated && res.updated > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    }).catch(reject);
  });
}

/**
 * 批量更新文档，可以超过20条（上限未知），w不能为空{}。
 * .then(updated) updated为更新的文档数量
 * value为undefined时，删除字段
 * 注意：
 * 1、此函数不支持$.set()替换对象功能，需使用.doc(id)的形式
 */
export function updateMatch(c, w, d) {
  return new Promise((resolve, reject) => {
    if (isEmpty(w)) {
      reject({
        errno: "updateMatch Failed",
        errMsg: `w不能为空`
      });
    } else {
      coll(c).where(w).update(excludeId(d)).then(res => {
        resolve(res.updated || 0);
      }).catch(reject);
    }
  });
}

/**
 * 把某个文档替换为新的文档; 返回.then(({created, updated}))
 * created为true表示新建，updated为true表示更新
 * 与update不同的是，update是使用doc中的字段去更新，doc没有的字段不会删除
 * 但是setDoc会删除doc中没有的字段
 * 注意：
 * 1、当指定的id不存在时，会创建一个新的文档
 * 2、当文档不能被删除，只能被更新时，需要此函数，如setting
 */
export function setDoc(c, id, d) {
  return new Promise((resolve, reject) => {
    doc(c, id).set(excludeId(d)).then(res => {
      resolve({
        created: !isNone(res.upsertedId),
        updated: isNone(res.upsertedId) && res.updated === 1
      });
    }).catch(reject);
  });
}

/**
 * 删除文档,返回是否删除成功.then(success); 当文档不存在时返回false
 * 注意：
 * 1、默认不触发todo DeleteDocFiles事件
 */
export function removeDoc(c, id, {
  deleteDocFiles = false
} = {}) {
  return new Promise(resolve => {
    doc(c, id).remove().then(async res => {
      if (res.deleted && res.deleted > 0) {
        if (deleteDocFiles && c !== "todo" && c !== "file") {
          await addTodo({
            action: "DeleteDocFiles",
            value: {
              c,
              id
            }
          });
        }
        resolve(true);
      } else {
        resolve(false);
      }
    }).catch(() => {
      resolve(false);
    });
  });
}

/**
 * 批量删除文档，可以超过20条（上限未知），w不能为空{}。
 * .then(removed) removed为删除的文档数量
 * 注意：
 * 1、removeMatch不会触发todo事件，若有级联删除请使用removeDoc
 */
export function removeMatch(c, w) {
  return new Promise((resolve, reject) => {
    if (isEmpty(w)) {
      reject({
        errno: "removeMatch Failed",
        errMsg: `w不能为空`
      });
    } else {
      coll(c).where(w).remove().then(res => {
        resolve(res.deleted || 0);
      }).catch(reject);
    }
  });
}

/**
 * 根据id获取数据; await getDoc(c, id); .then(doc); 文档不存在时返回null
 * only和except是用逗号分隔的字符串
 */
export function getDoc(c, id, {
  only = "",
  except = ""
} = {}) {
  return new Promise(resolve => {
    coll(c).doc(id).field(makeField(only, except)).get().then(res => {
      resolve(res.data[0]);
    }).catch(() => {
      resolve(null);
    });
  });
}

/**
 * 通过where,获得第一个文档; 文档不存在时返回null
 */
export function getOne(c, w) {
  return new Promise((resolve, reject) => {
    coll(c).where(w).limit(1).get().then(res => {
      if (res.data.length > 0) {
        resolve(res.data[0]);
      } else {
        resolve(null);
      }
    }).catch(e => {
      reject({
        errno: "getOne Failed",
        errMsg: `coll:${c}, where:${JSON.stringify(w)}`,
        e
      });
    });
  });
}

/**
 * 插入数据d. then(id) catch(e)
 */
export function addDoc(c, d) {
  return new Promise((resolve, reject) => {
    coll(c).add(d).then(res => {
      resolve(res.id);
    }).catch(e => {
      reject(e);
    });
  });
}

/**
 * 批量插入数据（仅云端可以批量插入，算一次调用）
 * .then(({ids, length}) => {})
 */
export function addDocList(c, docList) {
  return new Promise((resolve, reject) => {
    coll(c).add(docList).then(res => {
      resolve({
        ids: res.ids || [],
        len: (res.ids || []).length
      });
    }).catch(e => {
      reject(e);
    });
  });
}

/**
 * 所有的todo都必须通过此函数添加,此函数会写入isLocal
 * 云端这里需要主动传入app名称
 */
export function addTodo({
  action,
  value
}) {
  const todoData = {
    action,
    value,
    status: "wait"
  };
  return addDoc("todo", todoData);
}

/**
 * 写入file文件,每一张云存储图片都需要写入file; .then(file_id)
 */
export function addFile({
  c,
  docId,
  fileId,
  filePath,
  sizeM,
  _openid = ""
}) {
  const created = serverDate();
  const fileData = {
    c,
    docId,
    fileId,
    filePath,
    sizeM,
    _openid,
    created
  };
  return addDoc("file", fileData);
}

/**
 * 根据coll和where,判断数据是否存在 .then(exists)
 */
export function exists(c, wOrId) {
  return new Promise(resolve => {
    if (isString(wOrId)) {
      coll(c).doc(wOrId).get().then(() => {
        resolve(true);
      }).catch(() => {
        resolve(false);
      });
    } else {
      coll(c).where(wOrId).limit(1).get().then(res => {
        if (res.data.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    }
  });
}

/**
 * 获得集合的文档数量 .then(count)
 */
export function count(c, w = {}) {
  return new Promise((resolve, reject) => {
    coll(c).where(w).count().then(res => {
      resolve(res.total);
    }).catch(e => {
      reject(e);
    });
  });
}

/**
 * 把orderBy参数转换为数据库的orderBy参数类型
 * 若orderBy是字符串，则视为按此字段升序排序，返回{orderBy: 'asc'}
 * 若orderBy是obj，则值可以是asc, desc, 1, -1, true, false，并把值转换为数据库的asc, desc
 */
export function prepareOrderBy(orderBy) {
  if (isString(orderBy)) {
    return {
      [orderBy]: "asc"
    };
  } else if (orderBy && typeof orderBy === "object") {
    const ret = {};
    for (const k in orderBy) {
      ret[k] = isIn(orderBy[k], ["asc", 1, true]) ? "asc" : "desc";
    }
    return ret;
  } else {
    throw new Error(`orderBy must be string or object, but got ${orderBy}`);
  }
}

/**
 * 把sort参数转换成数据库可识别的排序参数
 */
export function prepareSort(sortArg) {
  if (isString(sortArg)) {
    return {
      [sortArg]: 1
    };
  } else if (sortArg && typeof sortArg === "object") {
    const ret = {};
    for (const k in sortArg) {
      ret[k] = isIn(sortArg[k], ["asc", 1, true]) ? 1 : -1;
    }
    return ret;
  } else {
    throw new Error(`sort must be string or object, but got ${sortArg}`);
  }
}

/**
 * 获得集合中最大的index值（云端）
 * 此函数一般用于递增生成订单号
 * 前端一般不使用此类函数
 * 注意：此函数无法解决并发冲突问题，微信api无法在原子操作中实现max_index+1
 * 总是返回整数，若没有数据则返回0，因此此函数不叫做max，而是叫做next
 */
export function getNextIndex(c) {
  return new Promise((resolve, reject) => {
    coll(c).orderBy("index", "desc").limit(1).get().then(res => {
      if (res.data.length > 0) {
        resolve(res.data[0].index + 1);
      } else {
        resolve(0);
      }
    }).catch(e => {
      reject(e);
    });
  });
}

/**
 * 返回field字段的最大值
 * field支持点表示法
 * 没有满足条件的文档时，返回null或defaultValue
 * let maxValue = await getMaxField(c, field, {defaultValue : 0})
 */
export function getMaxField(c, field, {
  w = {},
  defaultValue = null,
  orderBy = "desc"
} = {}) {
  return new Promise((resolve, reject) => {
    coll(c).where(w).orderBy(field, orderBy).limit(1).get().then(res => {
      if (res.data.length > 0) {
        resolve(res.data[0][field]);
      } else {
        resolve(defaultValue);
      }
    }).catch(reject);
  });
}

/**
 * 返回field字段的最小值
 * 仅简单调用getMaxField实现
 */
export function getMinField(c, field, {
  w = {},
  defaultValue = null
} = {}) {
  return getMaxField(c, field, {
    w,
    defaultValue,
    orderBy: "asc"
  });
}

/**
 * only和except是用逗号分隔的字符串
 */
export function makeField(only = "", except = "") {
  const field = {};
  if (only) {
    split(only, ",").forEach(f => {
      field[f] = true;
    });
  }
  if (except) {
    split(except, ",").forEach(f => {
      field[f] = false;
    });
  }
  return field;
}

/**
 * 排除属性_id，返回其他数据
 */
export function excludeId(doc) {
  const {
    _id: _,
    ...rest
  } = doc;
  return rest;
}


export function serverDate(offsetObject = {}) {
  const {
    seconds = 0,
    minutes = 0,
    days = 0
  } = offsetObject;
  const offset = (seconds + minutes * 60 + days * 24 * 60 * 60) * 1000;
  return database().serverDate({
    offset
  });
}


export async function getDistinctValues({
  c,
  field,
  w = {}
}) {
  const res = await agg(c).match(w).project({
    [field]: 1
  }).group({
    _id: `$${field}`
  }).limit(100000).end();
  return res.data.map(item => item._id);
}


export async function getFieldCounts({
  c,
  field,
  w = {}
}) {
  const $ = aggregate();
  const res = await agg(c).match(w).group({
    _id: `$${field}`,
    count: $.sum(1)
  }).limit(100000).end();
  const result = {};
  res.data.forEach(item => {
    result[item._id] = item.count;
  });
  return result;
}
