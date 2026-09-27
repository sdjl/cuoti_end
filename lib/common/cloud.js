/**
 * 云开发node-sdk
 * 文档：https://docs.cloudbase.net/api-reference/server/node-sdk/introduction
 *
 */
import tcb from "@cloudbase/node-sdk";

// 修改appCache类型为CloudBase
let appCache = null;

/*
  初始化云开发环境
  参考: docs.cloudbase.net/api-reference/server/node-sdk/initialization
*/
export function app() {
  if (!appCache) {
    appCache = tcb.init({
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
      env: process.env.TENCENT_ENV // 使用云开发默认环境, 可能走内网?
    });
  }
  return appCache;
}
