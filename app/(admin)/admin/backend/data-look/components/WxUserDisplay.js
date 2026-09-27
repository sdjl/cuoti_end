"use client";

import BaseImage from "../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../components/ui/badge.js";
// 微信用户信息展示组件，用于显示微信用户的基本信息、角色权限、用户信息、微信信息、当前学校设置、Token信息和统计信息等
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Separator } from "../../../../../../components/ui/separator.js";
export default function WxUserDisplay({
  data
}) {
  const formatDate = timestamp => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };
  const getGenderText = sex => {
    switch (sex) {
      case 1:
        return "男";
      case 2:
        return "女";
      default:
        return "未知";
    }
  };
  const getGenderColor = sex => {
    switch (sex) {
      case 1:
        return "bg-blue-100 text-blue-800";
      case 2:
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusColor = status => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "banned":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getRoleText = role => {
    const roleMap = {
      super_admin: "超级管理员",
      admin: "管理员",
      teacher: "教师",
      student: "学生",
      assistant: "助教",
      principal: "校长"
    };
    return roleMap[role] || role;
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          微信用户信息
          <Badge variant="secondary">wx_user</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">用户ID:</span>
              <p className="font-mono text-sm">{data._id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">OpenID:</span>
              <p className="font-mono text-sm">{data.openid}</p>
            </div>
            <div>
              <span className="text-muted-foreground">UnionID:</span>
              <p className="font-mono text-sm">{data.unionid}</p>
            </div>
            <div>
              <span className="text-muted-foreground">状态:</span>
              <Badge className={getStatusColor(data.status)}>
                {data.status === "active" ? "正常" : "禁用"}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* 角色信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">角色权限</h3>
          <div className="flex gap-2 flex-wrap">
            {data.roles.map((role, index) => <Badge key={index} variant="outline" className="text-sm">
                {getRoleText(role)}
              </Badge>)}
          </div>
        </div>

        <Separator />

        {/* 用户信息（后台填写） */}
        <div>
          <h3 className="font-semibold text-lg mb-2">用户信息</h3>
          <div className="grid grid-cols-2 gap-4">
            {data.userInfo.name && <div>
                <span className="text-muted-foreground">姓名:</span>
                <p className="font-semibold">{data.userInfo.name}</p>
              </div>}
            {data.userInfo.gender && <div>
                <span className="text-muted-foreground">性别:</span>
                <p>{data.userInfo.gender}</p>
              </div>}
            {data.userInfo.phone && <div>
                <span className="text-muted-foreground">手机号:</span>
                <p>{data.userInfo.phone}</p>
              </div>}
            {data.userInfo.email && <div>
                <span className="text-muted-foreground">邮箱:</span>
                <p className="text-sm">{data.userInfo.email}</p>
              </div>}
          </div>
          {data.userInfo.address && <div className="mt-3">
              <span className="text-muted-foreground">地址:</span>
              <p className="text-sm mt-1">{data.userInfo.address}</p>
            </div>}
          {data.userInfo.remark && <div className="mt-3">
              <span className="text-muted-foreground">备注:</span>
              <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">
                {data.userInfo.remark}
              </p>
            </div>}
        </div>

        <Separator />

        {/* 微信信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">微信信息</h3>
          <div className="grid grid-cols-2 gap-4">
            {data.userWxInfo.nickname && <div>
                <span className="text-muted-foreground">微信昵称:</span>
                <p className="font-semibold">{data.userWxInfo.nickname}</p>
              </div>}
            {data.userWxInfo.sex !== undefined && <div>
                <span className="text-muted-foreground">性别:</span>
                <Badge className={getGenderColor(data.userWxInfo.sex)}>
                  {getGenderText(data.userWxInfo.sex)}
                </Badge>
              </div>}
            {data.userWxInfo.country && <div>
                <span className="text-muted-foreground">国家:</span>
                <p>{data.userWxInfo.country}</p>
              </div>}
            {data.userWxInfo.province && <div>
                <span className="text-muted-foreground">省份:</span>
                <p>{data.userWxInfo.province}</p>
              </div>}
            {data.userWxInfo.city && <div>
                <span className="text-muted-foreground">城市:</span>
                <p>{data.userWxInfo.city}</p>
              </div>}
          </div>
          {data.userWxInfo.headimgurl && <div className="mt-3">
              <span className="text-muted-foreground">头像:</span>
              <div className="mt-2">
                <BaseImage src={data.userWxInfo.headimgurl} alt="用户头像" width={64} height={64} className="w-16 h-16 rounded-full border shadow-sm" />
              </div>
            </div>}
        </div>

        {/* 当前学校设置 */}
        {data.workSetting?.currentSchool && <>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg mb-2">当前操作学校</h3>
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">学校名称:</span>
                    <p className="font-semibold">
                      {data.workSetting.currentSchool.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">区域:</span>
                    <p>{data.workSetting.currentSchool.region}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">学校状态:</span>
                    <Badge variant="secondary">
                      {data.workSetting.currentSchool.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">学校ID:</span>
                    <p className="font-mono text-sm">
                      {data.workSetting.currentSchool._id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>}

        <Separator />

        {/* Token信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Token信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">
                AccessToken过期时间:
              </span>
              <p>{formatDate(data.accessTokenExpiresAt * 1000)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">
                RefreshToken过期时间:
              </span>
              <p>{formatDate(data.refreshTokenExpiresAt * 1000)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">授权范围:</span>
              <p>{data.scope}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* 统计信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">统计信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">登录次数:</span>
              <p className="text-lg font-semibold text-blue-600">
                {data.loginCount}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">最后登录时间:</span>
              <p className="text-sm">{formatDate(data.lastLoginAt)}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* 时间信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">时间信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">创建时间:</span>
              <p>{formatDate(data.created)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">更新时间:</span>
              <p>{formatDate(data.updated)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
}
