"use client";

import { Badge } from "../../../../../../../components/ui/badge.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../../components/ui/checkbox.js";
import { Label } from "../../../../../../../components/ui/label.js";

/**
 * 其他角色管理卡片
 * 用于管理用户的教师、学生、校长等角色，这些角色可以同时拥有
 */

export function OtherRolesCard({
  roles,
  otherRoles,
  onRoleChange
}) {
  return <Card>
      <CardHeader>
        <CardTitle>其他角色</CardTitle>
        <p className="text-sm text-muted-foreground">
          教师、学生、校长角色可以同时拥有
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {otherRoles.map(role => {
        const hasRole = roles.includes(role.key);
        return <div key={role.key} className="flex items-center space-x-3">
              <Checkbox id={role.key} checked={hasRole} onCheckedChange={checked => onRoleChange(role.key, checked)} />
              <Label htmlFor={role.key} className="flex-1">
                {role.label}
              </Label>
              {hasRole && <Badge variant="secondary">已设置</Badge>}
            </div>;
      })}
      </CardContent>
    </Card>;
}
