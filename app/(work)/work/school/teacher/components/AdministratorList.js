"use client";

import { Crown, Mail, MapPin, Phone } from "lucide-react";
import BaseImage from "../../../../../../components/common/BaseImage.js";
// 显示校园管理员（校长）列表的组件
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
export default function AdministratorList({
  administrators,
  isLoading
}) {
  // 获取用户显示名称
  const getUserDisplayName = staff => {
    return staff.name || staff.nickname || "未设置姓名";
  };

  // 获取用户头像
  const getUserAvatar = staff => {
    if (staff.headimgurl) {
      return <BaseImage src={staff.headimgurl} alt={getUserDisplayName(staff)} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />;
    }
    return <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
        {getUserDisplayName(staff).charAt(0)}
      </div>;
  };
  if (isLoading) {
    return <div>
        <div className="flex items-center mb-4">
          <Crown className="h-5 w-5 text-amber-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">校长</h2>
        </div>
        <Card className="bg-white">
          <CardContent className="text-center py-8">
            <p className="text-gray-500">加载中...</p>
          </CardContent>
        </Card>
      </div>;
  }
  return <div>
      <div className="flex items-center mb-4">
        <Crown className="h-5 w-5 text-amber-500 mr-2" />
        <h2 className="text-lg font-semibold text-gray-800">
          校长
          <span className="text-sm text-gray-500 ml-2">
            ({administrators.length}人)
          </span>
        </h2>
      </div>

      {administrators.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {administrators.map(admin => <Card key={admin._id} className="bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-3">
                  {getUserAvatar(admin)}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {getUserDisplayName(admin)}
                    </CardTitle>
                    <p className="text-xs text-gray-500 truncate">
                      {admin.nickname && admin.name !== admin.nickname ? admin.nickname : "管理员"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 text-xs text-gray-600">
                  {admin.phone && <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      <span className="truncate">{admin.phone}</span>
                    </div>}
                  {admin.email && <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      <span className="truncate">{admin.email}</span>
                    </div>}
                  {admin.address && <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{admin.address}</span>
                    </div>}
                </div>
              </CardContent>
            </Card>)}
        </div> : <Card className="bg-white">
          <CardContent className="text-center py-8">
            <p className="text-gray-500">暂无校园管理员</p>
          </CardContent>
        </Card>}
    </div>;
}
