"use client";

import { Avatar, AvatarFallback, AvatarImage } from "../../../../../../../components/ui/avatar.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";

/**
 * 用户信息展示卡片
 * 显示用户头像、昵称、性别和最后登录时间
 */

export function UserInfoCard({
  user,
  displayName
}) {
  return <Card>
      <CardHeader>
        <CardTitle>用户信息</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.userWxInfo.headimgurl} alt={displayName} />
            <AvatarFallback className="text-lg">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{displayName}</h2>
            <p className="text-muted-foreground">编辑用户信息</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">微信昵称：</span>
            <span className="text-muted-foreground">
              {user.userWxInfo.nickname || "未设置"}
            </span>
          </div>
          <div>
            <span className="font-medium">性别：</span>
            <span className="text-muted-foreground">
              {user.userWxInfo.sex === 1 ? "男" : user.userWxInfo.sex === 2 ? "女" : "未知"}
            </span>
          </div>
          <div className="col-span-2">
            <span className="font-medium">最后登录：</span>
            <span className="text-muted-foreground">
              {new Date(user.lastLoginAt).toLocaleString("zh-CN")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>;
}
