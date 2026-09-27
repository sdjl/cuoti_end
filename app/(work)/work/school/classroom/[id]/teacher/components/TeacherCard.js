"use client";

import { ChevronLeft, ChevronRight, UserCheck, Users } from "lucide-react";
import BaseImage from "../../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../../components/ui/badge.js";

/**
 * 教师卡片组件
 * 显示教师信息，支持点击选择/取消选择
 */

export function TeacherCard({
  teacher,
  isSelected,
  onToggle
}) {
  const getUserDisplayName = () => {
    return teacher.userInfo?.name || teacher.userWxInfo?.nickname || "未知";
  };
  const getUserAvatar = () => {
    if (teacher.userWxInfo?.headimgurl) {
      return <BaseImage src={teacher.userWxInfo.headimgurl} alt={getUserDisplayName()} width={48} height={48} className="rounded-full object-cover" />;
    }
    return <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
        <Users className="h-6 w-6 text-gray-500" />
      </div>;
  };
  return <div className={`p-3 border rounded-lg cursor-pointer transition-all ${isSelected ? "bg-green-50 border-green-200 hover:bg-green-100" : "bg-white border-gray-200 hover:bg-gray-50"}`} onClick={() => onToggle(teacher.openid)}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{getUserAvatar()}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{getUserDisplayName()}</span>
            {isSelected && <UserCheck className="h-4 w-4 text-green-600" />}
          </div>
          <div className="text-sm text-muted-foreground space-y-1 mt-1">
            {teacher.userInfo?.phone && <div>电话: {teacher.userInfo.phone}</div>}
            {teacher.userInfo?.email && <div>邮箱: {teacher.userInfo.email}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            教师
          </Badge>
          {isSelected ? <ChevronLeft className="h-4 w-4 text-green-600" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </div>
      </div>
    </div>;
}
