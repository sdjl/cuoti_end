"use client";

/**
 * 如果服务器挂了怎么登录？
 * 1. 在本地扫码登录，查看浏览器跳转到 pengpaiup.cn/login/redirect-local?xxxx 这个连接
 * 2. 把上面链接中 ? 后面的xxxx复制到本地3000端口上，访问 localhost:3000/logged?xxxx 这个连接
 */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_TITLE } from "../../../lib/config/constants.js";
import { getWxLoginConfig } from "./actions.js";

// 需要加载的js文件
const WX_LOGIN_JS_URL = "https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js";

// 微信登录SDK类型

// 声明微信登录的全局类型

export default function LoginPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCodeReady, setQrCodeReady] = useState(false);
  const router = useRouter();

  // 添加postMessage事件监听器
  useEffect(() => {
    const handleMessage = event => {
      // 验证消息来源（可以根据需要添加更严格的验证）
      if (event.data && typeof event.data === "object") {
        if (event.data.type === "wx_login_success") {
          // 登录成功，跳转到工作台
          router.push("/work");
        } else if (event.data.type === "wx_login_error") {
          // 登录失败，显示错误信息
          setError(event.data.error || "登录失败");
          setLoading(false);
        } else if (event.data.type === "iframe_redirect") {
          // iframe请求父页面跳转
          if (event.data.url) {
            window.location.href = event.data.url;
          }
        }
      }
    };

    // 添加事件监听器
    window.addEventListener("message", handleMessage);

    // 清理事件监听器
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [router]);
  useEffect(() => {
    // 加载微信登录JS SDK
    const loadWxLoginSDK = () => {
      return new Promise((resolve, reject) => {
        if (window.WxLogin) {
          resolve(window.WxLogin);
          return;
        }
        const script = document.createElement("script");
        script.src = WX_LOGIN_JS_URL;
        script.onload = () => resolve(window.WxLogin);
        script.onerror = () => reject(new Error("微信登录SDK加载失败"));
        document.head.appendChild(script);
      });
    };

    // 初始化微信登录
    const initWxLogin = async () => {
      try {
        setLoading(true);
        setError(null);
        setQrCodeReady(false);

        // 获取登录配置
        const config = await getWxLoginConfig();

        // 加载微信SDK
        await loadWxLoginSDK();

        // 创建微信登录二维码
        if (window.WxLogin) {
          new window.WxLogin({
            self_redirect: true,
            id: "wx_login_container",
            appid: config.appId,
            scope: config.scope,
            redirect_uri: config.redirectUri,
            state: config.state,
            style: "black",
            // 黑色样式，适合浅色背景
            href: "data:text/css,body{display:flex;align-items:center;justify-content:center;margin:0;padding:16px;min-height:calc(100vh-32px);background:white;}.impowerBox{width:auto!important;height:auto!important;padding:16px!important;background:white!important;display:flex!important;align-items:center!important;justify-content:center!important;}.qrcode{margin:0!important;}.status_icon{display:none!important;}.status_txt{display:none!important;}",
            // 自定义CSS样式来居中二维码并添加间距
            stylelite: 1,
            // 使用新版UI
            fast_login: 1,
            // 启用快速登录，设为0禁用
            onReady: isReady => {
              if (isReady) {
                setLoading(false);

                // 删除微信生成的iframe的height属性，并调整样式
                setTimeout(() => {
                  const container = document.getElementById("wx_login_container");
                  if (container) {
                    const iframe = container.querySelector("iframe");
                    if (iframe) {
                      // 删除height属性
                      if (iframe.hasAttribute("height")) {
                        iframe.removeAttribute("height");
                      }
                      // 设置iframe样式以确保完全填充容器
                      iframe.style.width = "100%";
                      iframe.style.height = "100%";
                      iframe.style.border = "none";
                      iframe.style.margin = "0";
                      iframe.style.padding = "0";
                      iframe.style.background = "white";
                    }
                  }
                  // 删除height属性后，显示二维码容器
                  setQrCodeReady(true);
                }, 100); // 给一点延迟确保iframe完全加载
              }
            }
          });
        }
      } catch (err) {
        console.error("初始化微信登录失败:", err);
        setError(err instanceof Error ? err.message : "初始化失败");
        setLoading(false);
      }
    };
    initWxLogin();
  }, []);
  return <div className="min-h-screen bg-background">
      {/* 登录主体区域 */}
      <section className="py-8 px-6 md:px-12 lg:px-20">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            {/* 页面标题 */}
            <div className="text-center mb-12">
              <h1 className="mt-6 mb-4 text-4xl md:text-5xl font-bold">
                欢迎使用 <span className="gradient-text">{APP_TITLE}</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                使用微信扫码即可快速登录，开始您的错题管理之旅
              </p>
            </div>

            {/* 登录卡片 */}
            <div className="bg-card rounded-2xl shadow-lg border border-muted/20 overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                {/* 左侧 - 二维码区域 */}
                <div className="p-8 md:p-12 pt-12 md:pt-16 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-3">微信扫码登录</h2>
                    <p className="text-muted-foreground">
                      使用微信扫描下方二维码即可登录
                    </p>
                  </div>

                  {/* 二维码容器 */}
                  <div className="w-64 h-64 bg-background border-2 border-dashed border-muted rounded-lg flex items-center justify-center mb-6 relative">
                    {loading && <div className="text-center">
                        <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-3 flex items-center justify-center">
                          <svg className="w-8 h-8 text-muted-foreground animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          二维码加载中...
                        </p>
                      </div>}

                    {error && <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm text-red-500 mb-2">
                          二维码加载失败
                        </p>
                        <p className="text-xs text-muted-foreground">{error}</p>
                        <button onClick={() => window.location.reload()} className="mt-2 text-xs text-primary hover:underline">
                          点击重试
                        </button>
                      </div>}

                    {/* 微信登录二维码容器 */}
                    <div id="wx_login_container" className={`absolute inset-4 flex items-center justify-center overflow-hidden ${!qrCodeReady ? "hidden" : ""}`}></div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      打开微信扫一扫
                    </p>
                    <p className="text-xs text-muted-foreground">
                      扫码后在手机上确认登录
                    </p>
                  </div>
                </div>

                {/* 右侧 - 产品介绍 */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">
                      为什么选择{APP_TITLE}？
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">智能错题管理</h4>
                          <p className="text-sm text-muted-foreground">
                            上传错题图片，自动识别和归类
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">个性化复习</h4>
                          <p className="text-sm text-muted-foreground">
                            根据掌握情况智能推荐复习内容
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">学习数据分析</h4>
                          <p className="text-sm text-muted-foreground">
                            详细的学习报告和进度跟踪
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">云端同步</h4>
                          <p className="text-sm text-muted-foreground">
                            多设备数据同步，随时随地学习
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-sm">
                        题
                      </div>
                      <div>
                        <p className="font-medium text-sm">安全保障</p>
                        <p className="text-xs text-muted-foreground">
                          您的学习数据将受到严格保护
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部说明 */}
            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground">
                登录即表示您同意我们的
                <a href="/user-agreement" target="_blank" className="text-primary hover:underline mx-1">
                  用户协议
                </a>
                和
                <a href="/privacy-policy" target="_blank" className="text-primary hover:underline mx-1">
                  隐私政策
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>;
}
