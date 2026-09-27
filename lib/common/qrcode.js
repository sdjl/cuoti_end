import QRCode from "qrcode.js";
import { DOMAIN } from "../config/constants.js";

/**
 * 二维码生成器的默认配置选项
 */
export const DEFAULT_QRCODE_OPTIONS = {
  width: 200,
  margin: 1,
  color: {
    dark: "#000000",
    light: "#FFFFFF"
  }
};


export async function generateQRCodeDataURL(url, options) {
  try {
    const mergedOptions = {
      ...DEFAULT_QRCODE_OPTIONS,
      ...options
    };
    const qrCodeDataURL = await QRCode.toDataURL(url, mergedOptions);
    return qrCodeDataURL;
  } catch (error) {
    console.error("生成二维码失败:", error);
    return "";
  }
}


export async function generateQRCodeDataURLBatch(urls, options) {
  const qrCodeMap = new Map();
  for (const {
    key,
    url
  } of urls) {
    const qrCode = await generateQRCodeDataURL(url, options);
    if (qrCode) {
      qrCodeMap.set(key, qrCode);
    }
  }
  return qrCodeMap;
}


export function generateWebViewURL(originalUrl, webViewTitle, baseUrl = `${DOMAIN.PROD}/webview`) {
  // 对URL中的特殊字符进行编码
  const encodedUrl = encodeURIComponent(originalUrl);
  // 移除标题中的斜杠并编码
  const encodedTitle = encodeURIComponent(webViewTitle.replace(/\//g, ""));

  // 生成最终的webview URL
  return `${baseUrl}/${encodedUrl}/${encodedTitle}`;
}


export function generateNormalURL(path, params = [], baseUrl = DOMAIN.PROD) {
  const paramsStr = params.length > 0 ? `/${params.join("/")}` : "";
  return `${baseUrl}${path}${paramsStr}`;
}


export async function generateQRCodeBuffer(url, size = 200, errorCorrectionLevel = "L") {
  try {
    // 使用低容错率(L)和小边距，减少格子数量，提高扫码成功率
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel,
      // 容错率
      margin: 1,
      // 最小边距
      width: size,
      // 设置尺寸
      type: "image/png"
    });

    // DataURL 转 Buffer
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
    return Buffer.from(base64Data, "base64");
  } catch (error) {
    console.error("生成二维码 Buffer 失败:", error);
    return Buffer.from([]);
  }
}
