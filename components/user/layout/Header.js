"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BaseImage from "../../common/BaseImage.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useSystemSettings } from "../../../hooks/useSystemSettings.js";
const Header = () => {
  const pathname = usePathname();
  const {
    user,
    loading
  } = useAuth();
  const {
    settings
  } = useSystemSettings();
  const isActive = path => {
    return pathname === path;
  };

  // 使用数组组织导航链接
  const navLinks = [{
    name: "首页",
    path: "/"
  }];
  return <>
      {/* 导航栏 - 固定在顶部 */}
      <header className="py-4 px-6 md:px-12 lg:px-20 flex items-center justify-between bg-background shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-md overflow-hidden">
              {settings.logoUrl ? <BaseImage src={settings.logoUrl} alt="系统Logo" width={48} height={48} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-xl">
                  题
                </div>}
            </div>
            <span className="text-xl font-bold">错题管家</span>
          </div>
          <nav className="flex items-center gap-8">
            {navLinks.map((link, index) => <Link key={index} href={link.path} className={`font-medium ${isActive(link.path) ? "text-primary" : "hover:text-primary"}`}>
                {link.name}
              </Link>)}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {loading ? <div className="hidden md:block">
              <div className="animate-pulse bg-gray-200 h-9 w-24 rounded"></div>
            </div> : user ?
        // 用户已登录，显示用户信息和登出按钮
        <div className="flex items-center gap-3">
              <Link href="/work">
                <button className="hidden md:block text-sm px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors">
                  工作台
                </button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center">
                  {user.userWxInfo.headimgurl ? <Image src={user.userWxInfo.headimgurl} alt={user.userWxInfo.nickname || "用户"} width={36} height={36} className="w-full h-full object-cover" /> : <span className="text-primary-foreground text-sm font-medium">
                      {user.userWxInfo.nickname?.charAt(0) || "用户"}
                    </span>}
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user.userWxInfo.nickname || "用户"}
                </span>
              </div>
              <Link href="/logout">
                <button className="hidden md:block text-sm px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                  登出
                </button>
              </Link>
            </div> :
        // 用户未登录，显示登录按钮
        <Link href="/login">
              <button className="hidden md:block secondary-button">
                微信扫码登录
              </button>
            </Link>}
        </div>
      </header>

      {/* 添加顶部填充，防止内容被固定导航栏覆盖 */}
      <div className="pt-20"></div>
    </>;
};
export default Header;
