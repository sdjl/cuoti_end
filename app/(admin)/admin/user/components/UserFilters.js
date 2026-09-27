// 用户筛选组件，用于根据关键词、角色和状态筛选用户列表

import { Search } from "lucide-react";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Input } from "../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select.js";
// 角色选项
const roleOptions = [{
  value: "all",
  label: "全部角色"
}, {
  value: "super_admin",
  label: "超级管理员"
}, {
  value: "admin",
  label: "管理员"
}, {
  value: "teacher",
  label: "教师"
}, {
  value: "student",
  label: "学生"
}, {
  value: "assistant",
  label: "助教"
}];

// 状态选项
const statusOptions = [{
  value: "all",
  label: "全部状态"
}, {
  value: "active",
  label: "正常"
}, {
  value: "banned",
  label: "已禁用"
}];
export default function UserFilters({
  searchTerm,
  setSearchTerm,
  selectedRole,
  setSelectedRole,
  selectedStatus,
  setSelectedStatus,
  onSearch,
  onReset
}) {
  return <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-1.5">
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>根据条件筛选用户</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
          <div className="flex-1">
            <Input placeholder="搜索用户姓名、昵称、手机号、邮箱或OpenID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full" />
          </div>
          <div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="min-w-[150px]">
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(option => <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="min-w-[150px]">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="default" onClick={onSearch}>
              <Search className="mr-2 h-4 w-4" />
              搜索
            </Button>
            <Button variant="outline" onClick={onReset}>
              重置
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
}
