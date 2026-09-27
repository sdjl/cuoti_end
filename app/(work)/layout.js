import "../../styles/work/globals.css";
import { StrictMode, Suspense } from "react";
import { Toaster } from "../../components/ui/toaster.js";
import SideNavigation from "../../components/work/layout/SideNavigation.js";
import { appName } from "../../lib/common/env.js";
export const metadata = {
  title: `${appName()} - 用户操作台`,
  description: `${appName()} 用户操作台`
};
export default function WorkLayout({
  children
}) {
  return <html lang="zh-CN">
      <StrictMode>
        <body className={`antialiased`}>
          <div className="flex min-h-screen bg-gray-50">
            {/* 侧边导航 */}
            <SideNavigation />

            {/* 主内容区域 - 使用相对定位和左边距，适应侧边栏状态 */}
            <div id="main-content" className="flex-1 transition-all duration-300 relative ml-20 sidebar-expanded:ml-64">
              <Suspense fallback={<div>加载中...</div>}>{children}</Suspense>
            </div>
          </div>
          <Toaster />
        </body>
      </StrictMode>
    </html>;
}
