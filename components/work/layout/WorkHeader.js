"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import BaseImage from "../../common/BaseImage.js";
import { useAuth } from "../../../hooks/useAuth.js";
export default function WorkHeader({
  title,
  showBackButton = false,
  backHref = "/work",
  backText = "返回工作台",
  rightContent
}) {
  const {
    user
  } = useAuth();
  return <header className="bg-white p-4 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {showBackButton && <>
              <Link href={backHref} className="flex items-center text-gray-600 hover:text-primary transition-colors">
                <ArrowLeft className="h-5 w-5 mr-1" />
                {backText}
              </Link>
              <div className="text-gray-300">|</div>
            </>}
          <div>
            <h1 className="text-xl font-bold text-primary">{title}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {rightContent}
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-primary overflow-hidden mr-2 flex items-center justify-center">
              {user?.userWxInfo.headimgurl ? <BaseImage src={user.userWxInfo.headimgurl} alt={user.userWxInfo.nickname || "用户"} width={36} height={36} className="w-full h-full object-cover" /> : <span className="text-white text-xs font-medium">
                  {user?.userWxInfo.nickname?.charAt(0) || "用户"}
                </span>}
            </div>
            <span className="font-medium">
              {user?.userWxInfo.nickname || "用户"}
            </span>
          </div>
        </div>
      </div>
    </header>;
}
