"use client";

import BaseImage from "../../../../../../../components/common/BaseImage.js";
// 已添加教师列表组件，展示当前校园的所有教师信息
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
export default function AddedTeachersList({
  teachers
}) {
  // 获取用户显示名称
  const getUserDisplayName = user => {
    return user.userInfo?.name || user.userWxInfo?.nickname || "未设置姓名";
  };

  // 获取用户头像
  const getUserAvatar = user => {
    if (user.userWxInfo?.headimgurl) {
      return <BaseImage src={user.userWxInfo.headimgurl} alt={getUserDisplayName(user)} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />;
    }
    return <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
        {getUserDisplayName(user).charAt(0)}
      </div>;
  };
  if (teachers.length === 0) {
    return <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">还未添加任何教师</p>
      </div>;
  }
  return <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        已添加的教师 ({teachers.length}人)
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teachers.map(teacher => <Card key={teacher._id} className="bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                {/* 教师头像 */}
                <div className="flex-shrink-0">{getUserAvatar(teacher)}</div>

                {/* 教师信息 */}
                <div className="min-w-0 w-full">
                  <h4 className="font-medium text-gray-900 truncate">
                    {getUserDisplayName(teacher)}
                  </h4>

                  <p className="text-xs text-gray-500 mt-1 font-mono break-all">
                    {teacher.openid}
                  </p>

                  {teacher.userInfo?.phone && <p className="text-xs text-gray-600 mt-1">
                      {teacher.userInfo.phone}
                    </p>}

                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${teacher.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {teacher.status === "active" ? "正常" : "禁用"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>
    </div>;
}
