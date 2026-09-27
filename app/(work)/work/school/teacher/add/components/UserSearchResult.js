"use client";

import { UserPlus } from "lucide-react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../components/ui/button.js";
// 用户搜索结果组件，展示搜索到的用户信息并提供添加到教师队伍的功能
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
export default function UserSearchResult({
  user,
  isAdding,
  onAddTeacher
}) {
  // 获取用户显示名称
  const getUserDisplayName = () => {
    return user.userInfo?.name || user.userWxInfo?.nickname || "未设置姓名";
  };

  // 获取用户头像
  const getUserAvatar = () => {
    if (user.userWxInfo?.headimgurl) {
      return <BaseImage src={user.userWxInfo.headimgurl} alt={getUserDisplayName()} width={64} height={64} className="w-16 h-16 rounded-full object-cover" />;
    }
    return <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-medium">
        {getUserDisplayName().charAt(0)}
      </div>;
  };

  // 获取性别显示文本
  const getGenderText = () => {
    if (user.userInfo?.gender) {
      return user.userInfo.gender;
    }
    if (user.userWxInfo?.sex === 1) return "男";
    if (user.userWxInfo?.sex === 2) return "女";
    return "未知";
  };
  return <Card className="bg-white">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* 用户头像 */}
          <div className="flex-shrink-0">{getUserAvatar()}</div>

          {/* 用户信息 */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {getUserDisplayName()}
                </h3>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">OpenID:</span>
                    <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {user.openid}
                    </span>
                  </div>

                  {user.userWxInfo?.nickname && <div>
                      <span className="text-gray-600">微信昵称:</span>
                      <span className="ml-2">{user.userWxInfo.nickname}</span>
                    </div>}

                  <div>
                    <span className="text-gray-600">性别:</span>
                    <span className="ml-2">{getGenderText()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {user.userInfo?.phone && <div>
                    <span className="text-gray-600">手机号:</span>
                    <span className="ml-2">{user.userInfo.phone}</span>
                  </div>}

                {user.userInfo?.email && <div>
                    <span className="text-gray-600">邮箱:</span>
                    <span className="ml-2">{user.userInfo.email}</span>
                  </div>}

                {user.userInfo?.address && <div>
                    <span className="text-gray-600">地址:</span>
                    <span className="ml-2">{user.userInfo.address}</span>
                  </div>}

                <div>
                  <span className="text-gray-600">角色:</span>
                  <span className="ml-2">
                    {user.roles.map(role => {
                    const roleMap = {
                      super_admin: "超级管理员",
                      admin: "管理员",
                      teacher: "教师",
                      student: "学生",
                      assistant: "助教",
                      principal: "校长"
                    };
                    return roleMap[role] || role;
                  }).join(", ")}
                  </span>
                </div>

                <div>
                  <span className="text-gray-600">状态:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {user.status === "active" ? "正常" : "禁用"}
                  </span>
                </div>
              </div>
            </div>

            {/* 添加教师按钮 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button onClick={onAddTeacher} disabled={isAdding || user.status !== "active"} className="flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                {isAdding ? "添加中..." : "添加到教师队伍"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
}
