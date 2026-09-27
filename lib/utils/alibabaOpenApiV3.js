import crypto from "node:crypto";

/**
 * 阿里openapi v3 签名文档：https://help.aliyun.com/zh/sdk/product-overview/v3-request-structure-and-signature?spm=a2c4g.11186623.help-menu-262060.d_0_4_2.25ce56122BRttr
 */

/**
 * 阿里云OpenAPI请求参数类型定义
 * 用于描述调用阿里云API时需要的所有参数信息
 */

/**
 * 阿里云OpenAPI响应类型定义
 * 包含响应数据、头部信息和状态码
 */

/**
 * 内部使用的访问密钥配置接口
 */


function getAccessKeyConfig() {
  const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  if (!accessKeyId || !accessKeySecret) {
    throw new Error("缺少必要的环境变量：ALIBABA_CLOUD_ACCESS_KEY_ID 或 ALIBABA_CLOUD_ACCESS_KEY_SECRET");
  }
  return {
    accessKeyId,
    accessKeySecret
  };
}


function generateNonce() {
  return crypto.randomUUID();
}


function hashPayload(payload) {
  // 创建SHA256哈希对象
  return crypto.createHash("sha256").update(payload, "utf8") // 使用UTF-8编码更新哈希内容
  .digest("hex"); // 输出十六进制格式的哈希值
}


function percentEncode(str) {
  return encodeURIComponent(str).replace(/!/g, "%21") // 感叹号编码
  .replace(/'/g, "%27") // 单引号编码
  .replace(/\(/g, "%28") // 左括号编码
  .replace(/\)/g, "%29") // 右括号编码
  .replace(/\*/g, "%2A") // 星号编码
  .replace(/\+/g, "%20") // 加号替换为空格编码
  .replace(/%7E/g, "~"); // 波浪号不编码
}


function flattenParams(params, prefix = "") {
  const result = {};

  // 遍历参数对象的每个键值对
  Object.keys(params).forEach(key => {
    const value = params[key];
    // 构建新的键名：如果有前缀则用点号连接，否则直接使用键名
    const newKey = prefix ? `${prefix}.${key}` : key;

    // 处理null或undefined值
    if (value === null || value === undefined) {
      result[newKey] = "";
    }
    // 处理数组类型
    else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          // 递归处理数组中的对象元素，索引从1开始（符合阿里云规范）
          Object.assign(result, flattenParams(item, `${newKey}.${index + 1}`));
        } else {
          // 直接处理基本类型数组元素
          result[`${newKey}.${index + 1}`] = String(item);
        }
      });
    }
    // 处理对象类型
    else if (typeof value === "object" && value !== null) {
      // 递归处理嵌套对象
      Object.assign(result, flattenParams(value, newKey));
    }
    // 处理基本类型
    else {
      result[newKey] = String(value);
    }
  });
  return result;
}


function buildCanonicalQueryString(params) {
  // 如果没有参数，直接返回空字符串
  if (Object.keys(params).length === 0) {
    return "";
  }

  // 将复杂类型参数平铺为扁平结构
  const flattenedParams = flattenParams(params);

  // 按键名进行字典序排序
  const sortedKeys = Object.keys(flattenedParams).sort();

  // 对每个键值对进行URL编码并构建查询字符串
  const encodedPairs = sortedKeys.map(key => {
    const encodedKey = percentEncode(key);
    const encodedValue = percentEncode(String(flattenedParams[key]));
    return `${encodedKey}=${encodedValue}`;
  });

  // 用&符号连接所有键值对
  return encodedPairs.join("&");
}


function buildFormDataString(params) {
  // 平铺复杂参数结构
  const flattenedParams = flattenParams(params);
  // 按键名排序
  const sortedKeys = Object.keys(flattenedParams).sort();

  // 构建表单数据字符串，注意这里也需要进行URL编码
  return sortedKeys.map(key => {
    const encodedKey = percentEncode(key);
    const encodedValue = percentEncode(String(flattenedParams[key]));
    return `${encodedKey}=${encodedValue}`;
  }).join("&");
}


function buildCanonicalHeaders(headers) {
  // 过滤需要签名的头部：以x-acs-开头的、host、content-type
  const relevantHeaders = {};
  Object.keys(headers).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.startsWith("x-acs-") || lowerKey === "host" || lowerKey === "content-type") {
      // 去除头部值的前后空格
      relevantHeaders[lowerKey] = headers[key].trim();
    }
  });

  // 按头部名称排序并格式化
  const sortedKeys = Object.keys(relevantHeaders).sort();
  return sortedKeys.map(key => `${key}:${relevantHeaders[key]}\n`).join("");
}


function getSignedHeaders(headers) {
  const relevantKeys = [];

  // 过滤需要签名的头部名称
  Object.keys(headers).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.startsWith("x-acs-") || lowerKey === "host" || lowerKey === "content-type") {
      relevantKeys.push(lowerKey);
    }
  });

  // 按字典序排序并用分号连接
  return relevantKeys.sort().join(";");
}


function buildCanonicalRequest(method, path, queryString, headers, hashedPayload) {
  // 构建规范化头部字符串
  const canonicalHeaders = buildCanonicalHeaders(headers);

  // 获取已签名头部列表
  const signedHeaders = getSignedHeaders(headers);

  // 按照阿里云V3规范组装规范化请求
  return [method.toUpperCase(),
  // HTTP方法（大写）
  path,
  // 请求路径
  queryString,
  // 查询字符串
  canonicalHeaders,
  // 规范化头部
  signedHeaders,
  // 已签名头部列表
  hashedPayload // 请求体哈希值
  ].join("\n");
}


function calculateSignature(accessKeySecret, method, path, queryString, headers, hashedPayload) {
  // 步骤1：构建规范化请求字符串
  const canonicalRequest = buildCanonicalRequest(method, path, queryString, headers, hashedPayload);

  // 步骤2：构建待签名字符串
  const hashedCanonicalRequest = hashPayload(canonicalRequest);
  const stringToSign = `ACS3-HMAC-SHA256\n${hashedCanonicalRequest}`;

  // 步骤3：计算签名
  const signature = crypto.createHmac("sha256", accessKeySecret) // 创建HMAC-SHA256签名器
  .update(stringToSign, "utf8") // 更新待签名字符串
  .digest("hex"); // 生成十六进制签名

  return signature;
}


export async function request(params) {
  // 获取访问密钥配置
  const {
    accessKeyId,
    accessKeySecret
  } = getAccessKeyConfig();

  // 解构请求参数，设置默认值
  const {
    action,
    version,
    endpoint,
    method = "POST",
    // 默认使用POST方法
    path = "/",
    // 默认路径为根路径
    query = {},
    // 默认无查询参数
    body = {},
    // 默认无请求体
    formData = {},
    // 默认无表单数据
    headers = {},
    // 默认无额外头部
    protocol = "https",
    // 默认使用HTTPS协议
    securityToken // STS安全令牌（可选）
  } = params;

  // 生成请求必需的时间戳和随机数
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z"); // ISO 8601格式时间戳
  const nonce = generateNonce(); // 生成防重放攻击的随机数

  // 构建规范化的查询字符串
  const canonicalQueryString = buildCanonicalQueryString(query);

  // 处理请求体内容和Content-Type
  let requestBody = "";
  let contentType = "";
  let hashedPayload = "";
  if (Object.keys(formData).length > 0) {
    // 处理表单数据类型请求
    contentType = "application/x-www-form-urlencoded";
    requestBody = buildFormDataString(formData);
    hashedPayload = hashPayload(requestBody);
  } else if (Object.keys(body).length > 0) {
    // 处理JSON类型请求体
    contentType = "application/json";
    requestBody = JSON.stringify(body);
    hashedPayload = hashPayload(requestBody);
  } else {
    // 无请求体的情况
    hashedPayload = hashPayload("");
  }

  // 构建完整的请求头集合
  const requestHeaders = {
    host: endpoint,
    // 主机名
    "x-acs-action": action,
    // API操作名称
    "x-acs-version": version,
    // API版本
    "x-acs-date": timestamp,
    // 请求时间戳
    "x-acs-signature-nonce": nonce,
    // 防重放随机数
    "x-acs-content-sha256": hashedPayload,
    // 请求体SHA256哈希
    ...headers // 合并用户自定义头部
  };

  // 设置Content-Type头部（如果有请求体）
  if (contentType) {
    requestHeaders["content-type"] = contentType;
  }

  // 设置STS安全令牌（如果提供）
  if (securityToken) {
    requestHeaders["x-acs-security-token"] = securityToken;
  }

  // 计算请求签名
  const signature = calculateSignature(accessKeySecret, method, path, canonicalQueryString, requestHeaders, hashedPayload);

  // 构建Authorization头部
  const signedHeaders = getSignedHeaders(requestHeaders);
  requestHeaders.Authorization = `ACS3-HMAC-SHA256 Credential=${accessKeyId},SignedHeaders=${signedHeaders},Signature=${signature}`;

  // 构建完整的请求URL
  const url = `${protocol}://${endpoint}${path}${canonicalQueryString ? `?${canonicalQueryString}` : ""}`;
  try {
    // 发送HTTP请求
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody || undefined // 如果没有请求体则传undefined
    });

    // 解析响应JSON数据
    const responseData = await response.json();

    // 检查HTTP状态码，如果不是成功状态则抛出错误
    if (!response.ok) {
      throw new Error(`阿里云API请求失败: ${response.status} - ${JSON.stringify(responseData)}`);
    }

    // 返回格式化的响应对象
    return {
      data: responseData,
      headers: Object.fromEntries(response.headers.entries()),
      // 转换Headers对象为普通对象
      status: response.status
    };
  } catch (error) {
    // 重新抛出错误，添加更多上下文信息
    if (error instanceof Error) {
      throw new Error(`阿里云API请求异常: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 便捷的导出函数，与request函数相同
 * 提供与原来class实例方法相似的使用体验
 */
export const alibabaCloudRequest = request;

// 使用示例（注释形式保留）：
/*
// ECS RunInstances示例
const response = await request({
  action: 'RunInstances',
  version: '2014-05-26',
  endpoint: 'ecs.cn-shanghai.aliyuncs.com',
  query: {
    ImageId: 'win2019_1809_x64_dtc_zh-cn_40G_alibase_20230811.vhd',
    RegionId: 'cn-shanghai'
  }
});

// 带有复杂参数的示例
const response2 = await request({
  action: 'DescribeInstanceStatus',
  version: '2014-05-26', 
  endpoint: 'ecs.cn-shanghai.aliyuncs.com',
  query: {
    RegionId: 'cn-shanghai',
    InstanceId: ['i-bp1xxx', 'i-bp2xxx', 'i-bp3xxx']
  }
});

// ROA风格API示例
const response3 = await request({
  action: 'DescribeClusters',
  version: '2015-12-15',
  endpoint: 'cs.cn-shanghai.aliyuncs.com',
  method: 'GET',
  path: '/api/v1/clusters'
});

// 表单数据提交示例
const response4 = await request({
  action: 'TranslateGeneral',
  version: '2018-10-12',
  endpoint: 'mt.aliyuncs.com',
  formData: {
    FormatType: 'text',
    SourceLanguage: 'zh',
    TargetLanguage: 'en',
    SourceText: 'Hello World',
    Scene: 'general'
  }
});
*/
