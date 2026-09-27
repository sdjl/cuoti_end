"use client";

import { RotateCcw, Search } from "lucide-react";
// 学习资料过滤器组件，提供搜索和筛选功能
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
const MATERIAL_TYPES = [{
  value: "all",
  label: "全部类型"
}, {
  value: "pdf",
  label: "PDF文档"
}, {
  value: "word",
  label: "Word文档"
}, {
  value: "excel",
  label: "Excel表格"
}, {
  value: "ppt",
  label: "PPT演示"
}, {
  value: "zip",
  label: "压缩文件"
}, {
  value: "image",
  label: "图片文件"
}, {
  value: "other",
  label: "其他类型"
}];
const MATERIAL_STATUSES = [{
  value: "all",
  label: "全部状态"
}, {
  value: "active",
  label: "可下载"
}, {
  value: "disabled",
  label: "已禁用"
}];
export default function MaterialFilters({
  classrooms,
  searchText,
  selectedClassId,
  selectedType,
  selectedStatus,
  onSearch,
  onReset
}) {
  const [localSearchText, setLocalSearchText] = useState(searchText);
  const [localSelectedClassId, setLocalSelectedClassId] = useState(selectedClassId);
  const [localSelectedType, setLocalSelectedType] = useState(selectedType);
  const [localSelectedStatus, setLocalSelectedStatus] = useState(selectedStatus);

  // 同步父组件的状态变化
  useEffect(() => {
    setLocalSearchText(searchText);
  }, [searchText]);
  useEffect(() => {
    setLocalSelectedClassId(selectedClassId);
  }, [selectedClassId]);
  useEffect(() => {
    setLocalSelectedType(selectedType);
  }, [selectedType]);
  useEffect(() => {
    setLocalSelectedStatus(selectedStatus);
  }, [selectedStatus]);
  const handleSearch = useCallback(() => {
    onSearch({
      searchText: localSearchText,
      selectedClassId: localSelectedClassId,
      selectedType: localSelectedType,
      selectedStatus: localSelectedStatus
    });
  }, [localSearchText, localSelectedClassId, localSelectedType, localSelectedStatus, onSearch]);
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);
  const handleReset = useCallback(() => {
    setLocalSearchText("");
    setLocalSelectedClassId("all");
    setLocalSelectedType("all");
    setLocalSelectedStatus("all");
    onReset();
  }, [onReset]);

  // 班级改变时自动搜索
  const handleClassChange = useCallback(value => {
    setLocalSelectedClassId(value);
    // 立即触发搜索
    onSearch({
      searchText: localSearchText,
      selectedClassId: value,
      selectedType: localSelectedType,
      selectedStatus: localSelectedStatus
    });
  }, [localSearchText, localSelectedType, localSelectedStatus, onSearch]);

  // 文件类型改变时自动搜索
  const handleTypeChange = useCallback(value => {
    setLocalSelectedType(value);
    // 立即触发搜索
    onSearch({
      searchText: localSearchText,
      selectedClassId: localSelectedClassId,
      selectedType: value,
      selectedStatus: localSelectedStatus
    });
  }, [localSearchText, localSelectedClassId, localSelectedStatus, onSearch]);

  // 状态改变时自动搜索
  const handleStatusChange = useCallback(value => {
    setLocalSelectedStatus(value);
    // 立即触发搜索
    onSearch({
      searchText: localSearchText,
      selectedClassId: localSelectedClassId,
      selectedType: localSelectedType,
      selectedStatus: value
    });
  }, [localSearchText, localSelectedClassId, localSelectedType, onSearch]);
  return <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-col xl:flex-row gap-4 xl:items-end">
        {/* 搜索框 */}
        <div className="flex-1 min-w-0">
          <Input placeholder="搜索标题、描述、备注..." value={localSearchText} onChange={e => setLocalSearchText(e.target.value)} onKeyPress={handleKeyPress} />
        </div>

        {/* 班级筛选 */}
        <div className="w-full xl:w-[140px]">
          <Select value={localSelectedClassId} onValueChange={handleClassChange}>
            <SelectTrigger>
              <SelectValue placeholder="选择班级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部班级</SelectItem>
              {classrooms.map(classroom => <SelectItem key={classroom._id} value={classroom._id}>
                  {classroom.name}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 文件类型筛选 */}
        <div className="w-full xl:w-[140px]">
          <Select value={localSelectedType} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="文件类型" />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_TYPES.map(type => <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 状态筛选 */}
        <div className="w-full xl:w-[120px]">
          <Select value={localSelectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_STATUSES.map(status => <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button onClick={handleSearch} size="default" className="px-6">
            <Search className="h-4 w-4 mr-2" />
            搜索
          </Button>
          <Button variant="outline" onClick={handleReset} className="px-3">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>;
}
