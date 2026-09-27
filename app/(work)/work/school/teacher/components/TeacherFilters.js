"use client";

import { RotateCcw, Search } from "lucide-react";
// 教师列表的筛选器组件，支持按姓名、性别、角色、状态等条件筛选
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
export default function TeacherFilters({
  searchTerm,
  setSearchTerm,
  selectedGender,
  setSelectedGender,
  selectedStatus,
  setSelectedStatus,
  selectedRole,
  setSelectedRole,
  onReset
}) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // 同步外部的 searchTerm 变化到本地状态
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    setSearchTerm(localSearchTerm);
  }, [localSearchTerm, setSearchTerm]);

  // 处理回车搜索
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    setLocalSearchTerm("");
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="flex gap-2">
            <Input placeholder="搜索教师姓名、昵称、openid、手机、邮箱、地址..." value={localSearchTerm} onChange={e => setLocalSearchTerm(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 性别筛选 */}
          <Select value={selectedGender} onValueChange={setSelectedGender}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="性别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部性别</SelectItem>
              <SelectItem value="男">男</SelectItem>
              <SelectItem value="女">女</SelectItem>
              <SelectItem value="未知">未知</SelectItem>
              <SelectItem value="empty">未设置</SelectItem>
            </SelectContent>
          </Select>

          {/* 角色筛选 */}
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部角色</SelectItem>
              <SelectItem value="teacher">教师</SelectItem>
              <SelectItem value="principal">校长</SelectItem>
              <SelectItem value="assistant">助教</SelectItem>
            </SelectContent>
          </Select>

          {/* 状态筛选 */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">正常</SelectItem>
              <SelectItem value="banned">禁用</SelectItem>
            </SelectContent>
          </Select>

          {/* 重置按钮 */}
          <Button variant="outline" onClick={handleReset} className="px-3">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>;
}
