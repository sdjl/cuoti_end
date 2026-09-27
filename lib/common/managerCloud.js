/**
 * 云开发 管理端 node-sdk
 * 文档：https://docs.cloudbase.net/api-reference/manager/node/introduction
 * 注意，此文档与 cloud.ts 不同，此文件仅用于 tool 开发环境中管理数据库，不要用于生产环境
 */
import CloudBase from "@cloudbase/manager-node";

// 修改appCache类型为CloudBase
let appCache = null;

/*
  初始化云开发环境
*/
export function app() {
  if (!appCache) {
    appCache = CloudBase.init({
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
      envId: process.env.TENCENT_ENV // 云环境 ID，可在腾讯云-云开发控制台获取
    });
  }
  return appCache;
}
