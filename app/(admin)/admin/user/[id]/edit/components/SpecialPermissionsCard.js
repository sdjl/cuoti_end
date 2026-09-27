"use client";

import { Shield } from "lucide-react";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../../components/ui/checkbox.js";
import { Label } from "../../../../../../../components/ui/label.js";

/**
 * 特殊权限设置卡片
 * 用于设置用户的特殊权限标识，如后台编辑权限等
 */

export function SpecialPermissionsCard({
  isAdminEditor,
  roles,
  onIsAdminEditorChange
}) {
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          特殊权限设置
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          设置用户的特殊权限，这些权限会限制用户只能访问特定功能
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <Checkbox id="isAdminEditor" checked={isAdminEditor} disabled={!roles.includes("admin")} onCheckedChange={checked => onIsAdminEditorChange(checked)} />
          <div className="flex-1">
            <Label htmlFor="isAdminEditor" className={`cursor-pointer ${!roles.includes("admin") ? "text-muted-foreground" : ""}`}>
              后台编辑
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              勾选后，该用户仅具有编辑试卷的权限，无法访问其他后台功能。只有管理员才能设置此权限。
            </p>
          </div>
          {isAdminEditor && <Badge variant="secondary">已设置</Badge>}
        </div>
      </CardContent>
    </Card>;
}
