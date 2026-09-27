"use client";

import { Camera, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import BaseImage from "../../common/BaseImage.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useSystemSettings } from "../../../hooks/useSystemSettings.js";
import { workMenuItems } from "../../../lib/config/workRoutes.js";
export default function SideNavigation() {
  // 控制导航栏是否展开
  const [expanded, setExpanded] = useState(true);
  // 获取用户认证信息
  const {
    isAdmin,
    isWorkAssistant
  } = useAuth();
  // 获取系统设置
  const {
    settings
  } = useSystemSettings();
  // 获取当前路径
  const pathname = usePathname();

  // 判断当前路径是否匹配菜单项
  const isActiveRoute = href => {
    if (href === "/work") {
      // 对于工作台首页，完全匹配 /work 或访问 /work/dashboard/* 时选中
      return pathname === "/work" || pathname.startsWith("/work/dashboard");
    }
    // 对于其他路径，使用前缀匹配
    return pathname.startsWith(href);
  };

  // 当expanded状态变化时，更新文档类以便主内容区域适应
  useEffect(() => {
    if (expanded) {
      document.documentElement.classList.add("sidebar-expanded");
    } else {
      document.documentElement.classList.remove("sidebar-expanded");
    }
  }, [expanded]);

  // 过滤菜单项，根据用户类型显示不同的菜单
  const getFilteredMenuItems = () => {
    // 如果是工作台助教，只显示允许访问的菜单
    if (isWorkAssistant()) {
      return workMenuItems.filter(item => item.allowWorkAssistant === true);
    }
    // 其他用户显示所有菜单
    return workMenuItems;
  };
  return <aside className={`fixed left-0 top-0 h-full bg-white shadow-md z-30 transition-all duration-300 ${expanded ? "w-64" : "w-20"}`}>
      {/* 顶部Logo */}
      <div className="flex items-center p-4 border-b border-gray-100 overflow-hidden">
        <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
          {settings.logoUrl ? <BaseImage src={settings.logoUrl} alt="系统Logo" width={48} height={48} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-2xl">
              题
            </div>}
        </div>
        <div className={`ml-3 transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
          <span className="text-xl font-bold whitespace-nowrap">错题管家</span>
        </div>
      </div>

      {/* 展开/收起按钮 */}
      <button className="absolute -right-3 top-12 bg-white rounded-full p-1.5 border border-gray-200 shadow-sm" onClick={() => setExpanded(!expanded)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`w-4 h-4 ${expanded ? "rotate-180" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 导航菜单 */}
      <nav className="mt-6 px-3 pb-24">
        <ul className="space-y-2">
          {getFilteredMenuItems().map((item, index) => <li key={index}>
              <Link href={item.href} className={`flex items-center p-3 rounded-lg hover:bg-gray-100 ${isActiveRoute(item.href) ? "bg-blue-50 text-primary" : "text-gray-700"}`}>
                <span className="flex-shrink-0">{item.icon}</span>
                <div className={`transition-all duration-200 overflow-hidden ${expanded ? "ml-3 opacity-100 max-w-[150px]" : "w-0 opacity-0 max-w-0"}`}>
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
              </Link>
            </li>)}
        </ul>
      </nav>

      {/* 底部操作按钮 */}
      <div className={`absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 space-y-2`}>
        {/* 跳转到后台按钮 - 只对管理员显示 */}
        {isAdmin() && <Link href="/admin" className={`flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors ${expanded ? "" : "justify-center"}`}>
            <span className="flex-shrink-0">
              <Camera className="w-5 h-5" />
            </span>
            <div className={`transition-all duration-200 overflow-hidden ${expanded ? "ml-3 opacity-100 max-w-[150px]" : "w-0 opacity-0 max-w-0"}`}>
              <span className="whitespace-nowrap text-sm">管理后台</span>
            </div>
          </Link>}

        {/* 登出按钮 */}
        <Link href="/logout" className={`flex items-center p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors ${expanded ? "" : "justify-center"}`}>
          <span className="flex-shrink-0">
            <LogOut className="w-5 h-5" />
          </span>
          <div className={`transition-all duration-200 overflow-hidden ${expanded ? "ml-3 opacity-100 max-w-[150px]" : "w-0 opacity-0 max-w-0"}`}>
            <span className="whitespace-nowrap text-sm">登出</span>
          </div>
        </Link>
      </div>
    </aside>;
}
