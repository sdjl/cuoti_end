"use client";

import { CheckCircle, MonitorSpeaker, Wifi } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge.js";
import { Button } from "../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card.js";
import { DOMAIN } from "../../../../lib/config/constants.js";
const AVAILABLE_PORTS = [3000, 27081, 27082];

// 提取使用 useSearchParams 的组件
function RedirectLocalContent() {
  const searchParams = useSearchParams();
  const [params, setParams] = useState({});
  const [isRedirecting, setIsRedirecting] = useState(false);
  useEffect(() => {
    // 获取所有URL参数
    const allParams = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });
    setParams(allParams);

    // 检查是否在iframe中
    if (window.top !== window.self) {
      // 在iframe中，需要控制父页面跳转到当前完整URL
      setIsRedirecting(true);

      // 获取网站的原始域名
      let webSiteOrigin = process.env.NEXT_PUBLIC_WEB_SITE_ORIGIN;
      if (!webSiteOrigin) {
        alert("线上环境未配置NEXT_PUBLIC_WEB_SITE_ORIGIN");
        webSiteOrigin = `http://${DOMAIN.BASE}`;
      }

      // 构建当前页面的完整URL（包含所有参数）
      const currentUrl = `${webSiteOrigin}/login/redirect-local${window.location.search}`;
      try {
        // 控制父页面跳转
        window.top.location.href = currentUrl;
      } catch (error) {
        console.error("无法控制父页面跳转:", error);
        // 如果直接控制失败，尝试使用postMessage
        window.top.postMessage({
          type: "iframe_redirect",
          url: currentUrl
        }, "*");
        setIsRedirecting(false);
      }
    }
  }, [searchParams]);
  const handlePortSelect = port => {
    // 构建跳转URL，将所有参数携带过去
    const queryString = new URLSearchParams(params).toString();
    const targetUrl = `http://${DOMAIN.LOCALHOST}:${port}/logged${queryString ? `?${queryString}` : ""}`;

    // 跳转到本地
    window.location.href = targetUrl;
  };

  // 如果正在重定向（从iframe跳转到父页面），显示重定向提示
  if (isRedirecting) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                正在跳转...
              </p>
              <p className="text-sm text-gray-600">
                检测到页面在iframe中，正在跳转到完整页面
              </p>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            微信登录成功
          </CardTitle>
          <CardDescription className="text-lg">
            请选择本地开发端口进行跳转
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 显示接收到的参数 */}
          {Object.keys(params).length > 0 && <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                <Wifi className="w-4 h-4 mr-2" />
                接收到的参数
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(params).map(([key, value]) => <div key={key} className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {key}
                    </Badge>
                    <span className="text-sm text-gray-600 font-mono bg-white px-2 py-1 rounded border max-w-xs overflow-hidden text-ellipsis">
                      {value}
                    </span>
                  </div>)}
              </div>
            </div>}

          {/* 端口选择 */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
              <MonitorSpeaker className="w-4 h-4 mr-2" />
              选择本地开发端口
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AVAILABLE_PORTS.map(port => <Button key={port} onClick={() => handlePortSelect(port)} variant="outline" className="h-16 text-lg font-semibold hover:bg-blue-50 hover:border-blue-300 transition-all duration-200">
                  <div className="text-center">
                    <div className="text-xl">:{port}</div>
                    <div className="text-xs text-gray-500">
                      {DOMAIN.LOCALHOST}:{port}
                    </div>
                  </div>
                </Button>)}
            </div>
          </div>

          {/* 说明文字 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>说明：</strong>
              选择您本地开发服务器运行的端口。点击后将自动跳转到本地环境完成登录流程。
            </p>
          </div>

          {/* 如果没有参数，显示错误信息 */}
          {Object.keys(params).length === 0 && <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>错误：</strong>未检测到微信回调参数，请重新尝试登录。
              </p>
            </div>}
        </CardContent>
      </Card>
    </div>;
}
export default function RedirectLocalPage() {
  return <Suspense fallback={<div>加载中...</div>}>
      <RedirectLocalContent />
    </Suspense>;
}
