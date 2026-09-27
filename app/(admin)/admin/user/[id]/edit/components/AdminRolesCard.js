"use client";

import { Shield } from "lucide-react";
import { Badge } from "../../../../../../../components/ui/badge.js";
// 管理员角色卡片组件，用于管理用户的管理员角色权限（超级管理员和普通管理员）
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../../components/ui/checkbox.js";
import { Label } from "../../../../../../../components/ui/label.js";

/**
 * 管理员角色管理卡片
 * 用于管理用户的管理员角色权限，包括超级管理员和普通管理员
 */

export function AdminRolesCard({
  roles,
  adminRoles,
  isCurrentUserSuperAdmin,
  isTargetUserSuperAdmin,
  onRoleChange
}) {
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          管理员角色
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          超级管理员和管理员角色互斥，超级管理员不可编辑
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isCurrentUserSuperAdmin ?
      // 非超级管理员显示权限提示
      <>
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">权限限制</p>
                  <p>仅超级管理员可以编辑管理员角色权限。</p>
                </div>
              </div>
            </div>

            {/* 显示当前管理员角色状态（只读） */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">当前管理员角色</Label>
              {adminRoles.map(role => {
            const hasRole = roles.includes(role.key);
            return <div key={role.key} className="flex items-center space-x-3">
                    <Checkbox checked={hasRole} disabled={true} />
                    <Label className="flex-1 text-muted-foreground">
                      {role.label}
                    </Label>
                    {hasRole && <Badge variant={role.key === "super_admin" ? "destructive" : "default"}>
                        已设置
                      </Badge>}
                  </div>;
          })}
            </div>
          </> :
      // 超级管理员显示角色编辑
      adminRoles.map(role => {
        const hasRole = roles.includes(role.key);
        const isDisabled = role.key === "super_admin" || role.key === "admin" && isTargetUserSuperAdmin;
        return <div key={role.key} className="flex items-center space-x-3">
                <Checkbox id={role.key} checked={hasRole} disabled={isDisabled} onCheckedChange={checked => onRoleChange(role.key, checked)} />
                <Label htmlFor={role.key} className={`flex-1 ${isDisabled ? "text-muted-foreground" : ""}`}>
                  {role.label}
                </Label>
                {hasRole && <Badge variant={role.key === "super_admin" ? "destructive" : "default"}>
                    已设置
                  </Badge>}
              </div>;
      })}
      </CardContent>
    </Card>;
}
