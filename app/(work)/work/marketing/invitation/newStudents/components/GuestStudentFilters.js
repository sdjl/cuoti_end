"use client";

// 新生列表的过滤器组件，用于搜索和筛选新生数据
import { RotateCcw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
export default function GuestStudentFilters({
  searchText,
  setSearchText,
  isContactedByTeacher,
  setIsContactedByTeacher,
  isConvertedToStudent,
  setIsConvertedToStudent,
  onReset
}) {
  const [localSearchText, setLocalSearchText] = useState(searchText);

  // 同步外部的 searchText 变化到本地状态
  useEffect(() => {
    setLocalSearchText(searchText);
  }, [searchText]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    setSearchText(localSearchText);
  }, [localSearchText, setSearchText]);

  // 处理回车搜索
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    setLocalSearchText("");
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="flex gap-2">
            <Input placeholder="搜索新生姓名、电话、邀请码、邀请人姓名..." value={localSearchText} onChange={e => setLocalSearchText(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 联系状态筛选 */}
          <Select value={isContactedByTeacher} onValueChange={setIsContactedByTeacher}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="联系状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="contacted">已联系</SelectItem>
              <SelectItem value="not_contacted">未联系</SelectItem>
            </SelectContent>
          </Select>

          {/* 转为在校生状态筛选 */}
          <Select value={isConvertedToStudent} onValueChange={setIsConvertedToStudent}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="转换状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="converted">已转为在校生</SelectItem>
              <SelectItem value="not_converted">未转为在校生</SelectItem>
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
