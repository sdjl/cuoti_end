"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";

/**
 * 基本信息编辑表单
 * 用于编辑用户的姓名、性别、联系方式等基本信息
 */

export function BasicInfoForm({
  userInfo,
  onUserInfoChange
}) {
  return <Card>
      <CardHeader>
        <CardTitle>基本信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input id="name" value={userInfo.name || ""} onChange={e => onUserInfoChange({
            ...userInfo,
            name: e.target.value
          })} placeholder="请输入姓名" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">性别</Label>
            <Select value={userInfo.gender || ""} onValueChange={value => onUserInfoChange({
            ...userInfo,
            gender: value
          })}>
              <SelectTrigger>
                <SelectValue placeholder="请选择性别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="男">男</SelectItem>
                <SelectItem value="女">女</SelectItem>
                <SelectItem value="未知">未知</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <Input id="phone" value={userInfo.phone || ""} onChange={e => onUserInfoChange({
            ...userInfo,
            phone: e.target.value
          })} placeholder="请输入手机号" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" type="email" value={userInfo.email || ""} onChange={e => onUserInfoChange({
            ...userInfo,
            email: e.target.value
          })} placeholder="请输入邮箱" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">地址</Label>
          <Input id="address" value={userInfo.address || ""} onChange={e => onUserInfoChange({
          ...userInfo,
          address: e.target.value
        })} placeholder="请输入地址" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="remark">备注</Label>
          <Textarea id="remark" value={userInfo.remark || ""} onChange={e => onUserInfoChange({
          ...userInfo,
          remark: e.target.value
        })} placeholder="请输入备注信息" rows={3} />
        </div>
      </CardContent>
    </Card>;
}
