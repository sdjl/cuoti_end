"use client";

/**
 * 微信小程序 JSSDK 工具函数库
 *
 * 用于在网页中加载和使用微信小程序 JSSDK，实现网页与小程序之间的交互。
 *
 * 使用文档请阅读：docs/常用代码样例/小程序JSSDK使用说明.md
 * 官方文档：https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html
 */

/**
 * 微信小程序相关的 Window 类型扩展
 */

export async function loadWeixinJSSDK() {
  return new Promise((resolve, reject) => {
    // 检查是否在浏览器环境
    if (typeof window === "undefined") {
      reject(new Error("不在浏览器环境中"));
      return;
    }

    // 检查是否已经加载过
    const win = window;
    if (win.wx) {
      resolve();
      return;
    }

    // 创建 script 标签加载 JSSDK
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://res.wx.qq.com/open/js/jweixin-1.3.2.js";
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      console.error("微信 JSSDK 加载失败");
      reject(new Error("微信 JSSDK 加载失败"));
    };
    document.head.appendChild(script);
  });
}


export async function isMiniProgramEnvironment() {
  // 检查是否在浏览器环境
  if (typeof window === "undefined") {
    return false;
  }
  const win = window;

  // 方法1: 检查 userAgent 中是否包含 'miniProgram'
  const userAgent = window.navigator.userAgent;
  const isMiniProgramUA = userAgent.includes("miniProgram");

  // 方法2: 检查 window.__wxjs_environment 变量
  const isMiniProgramEnv = win.__wxjs_environment === "miniprogram";

  // 如果检测到是小程序环境，尝试加载 JSSDK
  if (isMiniProgramUA || isMiniProgramEnv) {
    try {
      await loadWeixinJSSDK();
    } catch (error) {
      console.error("加载微信 JSSDK 失败:", error);
    }
    return true;
  }

  // 方法3: 检查是否存在 wx.miniProgram（作为后备检查）
  if (win.wx?.miniProgram) {
    return true;
  }
  return false;
}


export async function waitForWeixinJSBridge() {
  return new Promise(resolve => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    const win = window;
    if (win.WeixinJSBridge?.invoke) {
      resolve();
    } else {
      const handler = () => {
        resolve();
      };
      document.addEventListener("WeixinJSBridgeReady", handler, false);
    }
  });
}

/**
 * 小程序页面跳转选项
 */

/**
 * 小程序返回选项
 */

/**
 * 小程序发送消息选项
 */


export function navigateToMiniProgramPage(options) {
  if (typeof window === "undefined") {
    console.error("不在浏览器环境中");
    return;
  }
  const win = window;
  try {
    if (win.wx?.miniProgram?.navigateTo) {
      win.wx.miniProgram.navigateTo(options);
    } else {
      console.error("wx.miniProgram.navigateTo 不可用");
    }
  } catch (error) {
    console.error("跳转小程序页面失败:", error);
  }
}


export function redirectToMiniProgramPage(options) {
  if (typeof window === "undefined") {
    console.error("不在浏览器环境中");
    return;
  }
  const win = window;
  try {
    if (win.wx?.miniProgram?.redirectTo) {
      win.wx.miniProgram.redirectTo(options);
    } else {
      console.error("wx.miniProgram.redirectTo 不可用");
    }
  } catch (error) {
    console.error("跳转小程序页面失败:", error);
  }
}


export function navigateBackMiniProgram(options = {}) {
  if (typeof window === "undefined") {
    console.error("不在浏览器环境中");
    return;
  }
  const win = window;
  try {
    if (win.wx?.miniProgram?.navigateBack) {
      // 如果没有指定 delta，使用默认值 1
      const delta = options.delta ?? 1;
      win.wx.miniProgram.navigateBack({
        delta
      });
    } else {
      console.error("wx.miniProgram.navigateBack 不可用");
    }
  } catch (error) {
    console.error("返回小程序页面失败:", error);
  }
}


export function switchTabMiniProgram(options) {
  if (typeof window === "undefined") {
    console.error("不在浏览器环境中");
    return;
  }
  const win = window;
  try {
    if (win.wx?.miniProgram?.switchTab) {
      win.wx.miniProgram.switchTab(options);
    } else {
      console.error("wx.miniProgram.switchTab 不可用");
    }
  } catch (error) {
    console.error("跳转小程序 tabBar 页面失败:", error);
  }
}


export function reLaunchMiniProgram(options) {
  if (typeof window === "undefined") {
    console.error("不在浏览器环境中");
    return;
  }
  const win = window;
  try {
    if (win.wx?.miniProgram?.reLaunch) {
      win.wx.miniProgram.reLaunch(options);
    } else {
      console.error("wx.miniProgram.reLaunch 不可用");
    }
  } catch (error) {
    console.error("重启小程序失败:", error);
  }
}


export function postMessageToMiniProgram(options) {
  if (typeof window === "undefined") {
    console.error("不在浏览器环境中");
    return;
  }
  const win = window;
  try {
    if (win.wx?.miniProgram?.postMessage) {
      win.wx.miniProgram.postMessage(options);
    } else {
      console.error("wx.miniProgram.postMessage 不可用");
    }
  } catch (error) {
    console.error("向小程序发送消息失败:", error);
  }
}


export async function isMiniProgramEnvironmentByGetEnv() {
  if (typeof window === "undefined") {
    return false;
  }
  const win = window;

  // 如果 wx.miniProgram.getEnv 不存在，先尝试加载 JSSDK
  if (!win.wx?.miniProgram?.getEnv) {
    try {
      await loadWeixinJSSDK();
    } catch (error) {
      console.error("加载微信 JSSDK 失败:", error);
      return false;
    }
  }
  return new Promise(resolve => {
    if (win.wx?.miniProgram?.getEnv) {
      win.wx.miniProgram.getEnv(res => {
        resolve(res.miniprogram);
      });
    } else {
      resolve(false);
    }
  });
}


export function onMiniProgramPageStateChange(callback) {
  if (typeof window === "undefined") {
    console.error("不在浏览器环境中");
    return () => {};
  }
  const win = window;
  if (!win.WeixinJSBridge?.on) {
    console.error("WeixinJSBridge.on 不可用");
    return () => {};
  }
  const handler = res => {
    callback(res.active);
  };
  try {
    win.WeixinJSBridge.on("onPageStateChange", handler);
  } catch (error) {
    console.error("监听页面状态变化失败:", error);
  }

  // 返回取消监听的函数
  return () => {
    // 注意：WeixinJSBridge 没有提供 off 方法，所以无法真正取消监听
    // 这里返回一个空函数以保持 API 一致性
  };
}
