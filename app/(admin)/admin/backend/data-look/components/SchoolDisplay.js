"use client";

import BaseImage from "../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../components/ui/badge.js";
// 校园信息展示组件，用于显示校园的基本信息、联系信息、校长管理员、校园班级和时间信息等
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Separator } from "../../../../../../components/ui/separator.js";
export default function SchoolDisplay({
  data
}) {
  const {
    school,
    classrooms,
    adminUsers
  } = data;
  const formatDate = timestamp => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };
  const getStatusColor = status => {
    switch (status) {
      case "正常":
        return "bg-green-100 text-green-800";
      case "停用":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          校园信息
          <Badge variant="secondary">school</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">ID:</span>
              <p className="font-mono text-sm">{school._id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">校园名称:</span>
              <p className="font-semibold text-lg">{school.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">区域:</span>
              <p>{school.region}</p>
            </div>
            <div>
              <span className="text-muted-foreground">状态:</span>
              <Badge className={getStatusColor(school.status)}>
                {school.status}
              </Badge>
            </div>
          </div>
        </div>

        {(school.address || school.phone) && <>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg mb-2">联系信息</h3>
              <div className="grid grid-cols-2 gap-4">
                {school.address && <div>
                    <span className="text-muted-foreground">地址:</span>
                    <p className="text-sm">{school.address}</p>
                  </div>}
                {school.phone && <div>
                    <span className="text-muted-foreground">电话:</span>
                    <p>{school.phone}</p>
                  </div>}
              </div>
            </div>
          </>}

        <Separator />

        <div>
          <h3 className="font-semibold text-lg mb-2">
            校长管理员 ({school.adminOpenids.length}人)
          </h3>
          {adminUsers.length > 0 ? <div className="space-y-2">
              {adminUsers.map((wxUser, index) => <div key={index} className="bg-blue-50 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">姓名:</span>
                      <p className="font-semibold">
                        {wxUser.userInfo.name || wxUser.userWxInfo.nickname || "未设置"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">角色:</span>
                      <div className="flex gap-1 flex-wrap">
                        {wxUser.roles.map((role, roleIndex) => <Badge key={roleIndex} variant="outline" className="text-xs">
                            {role}
                          </Badge>)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">OpenID:</span>
                      <p className="font-mono text-sm">{wxUser.openid}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">状态:</span>
                      <Badge variant={wxUser.status === "active" ? "default" : "destructive"}>
                        {wxUser.status === "active" ? "正常" : "禁用"}
                      </Badge>
                    </div>
                  </div>
                  {wxUser.userInfo.phone && <div className="mt-2">
                      <span className="text-muted-foreground">电话:</span>
                      <p>{wxUser.userInfo.phone}</p>
                    </div>}
                  {wxUser.userInfo.email && <div className="mt-2">
                      <span className="text-muted-foreground">邮箱:</span>
                      <p className="text-sm">{wxUser.userInfo.email}</p>
                    </div>}
                  {wxUser.userWxInfo.headimgurl && <div className="mt-2">
                      <span className="text-muted-foreground">头像:</span>
                      <div className="mt-1">
                        <BaseImage src={wxUser.userWxInfo.headimgurl} alt="用户头像" width={40} height={40} className="w-10 h-10 rounded-full border" />
                      </div>
                    </div>}
                </div>)}
            </div> : school.adminOpenids.length > 0 ? <div className="space-y-2">
              <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
                <p className="text-orange-800 text-sm mb-2">
                  <span className="font-semibold">注意：</span>有
                  {school.adminOpenids.length}
                  个管理员OpenID，但在wx_user集合中未找到对应的用户记录
                </p>
                <p className="text-orange-700 text-xs">
                  这可能是因为：1) 用户尚未登录过系统；2) OpenID已过期；3)
                  数据同步问题
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">
                  管理员OpenID列表：
                </h4>
                {school.adminOpenids.map((openid, index) => <div key={index} className="bg-gray-50 p-3 rounded-md border">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground text-sm">
                          序号:
                        </span>
                        <p className="font-semibold text-blue-600">
                          #{index + 1}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">
                          状态:
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          待激活
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-muted-foreground text-sm">
                        OpenID:
                      </span>
                      <p className="font-mono text-xs mt-1 bg-white p-2 rounded border break-all">
                        {openid}
                      </p>
                    </div>
                    <div className="mt-2">
                      <span className="text-muted-foreground text-sm">
                        说明:
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        此用户需要先登录系统，系统才能获取详细的微信用户信息
                      </p>
                    </div>
                  </div>)}
              </div>
            </div> : <p className="text-muted-foreground">暂无管理员</p>}
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-lg mb-2">
            校园班级 ({classrooms.length}个)
          </h3>
          {classrooms.length > 0 ? <div className="space-y-2 max-h-64 overflow-y-auto">
              {classrooms.map(classroom => <div key={classroom._id} className="bg-green-50 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">班级名称:</span>
                      <p className="font-semibold">{classroom.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">班级状态:</span>
                      <Badge variant="secondary">{classroom.status}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">学生数量:</span>
                      <p className="text-blue-600 font-semibold">
                        {classroom.studentCount}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">任课老师:</span>
                      <p className="text-purple-600 font-semibold">
                        {classroom.teacherOpenids.length}人
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-muted-foreground">班级ID:</span>
                    <p className="font-mono text-sm">{classroom._id}</p>
                  </div>
                  {classroom.headTeacher && <div className="mt-2">
                      <span className="text-muted-foreground">班主任:</span>
                      <p>{classroom.headTeacher}</p>
                    </div>}
                </div>)}
            </div> : <p className="text-muted-foreground">暂无班级</p>}
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-lg mb-2">时间信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">创建时间:</span>
              <p>{formatDate(school.created)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">更新时间:</span>
              <p>{formatDate(school.updated)}</p>
            </div>
          </div>
        </div>

        {school.description && <>
            <Separator />
            <div>
              <span className="text-muted-foreground">校园描述:</span>
              <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">
                {school.description}
              </p>
            </div>
          </>}
      </CardContent>
    </Card>;
}
