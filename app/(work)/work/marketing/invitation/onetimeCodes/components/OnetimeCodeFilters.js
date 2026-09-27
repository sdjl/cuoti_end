"use client";

// 一次性邀请码的过滤器组件，用于搜索和筛选邀请码
import { Download, RotateCcw, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
export default function OnetimeCodeFilters({
  searchCode,
  setSearchCode,
  selectedStatus,
  setSelectedStatus,
  selectedIsUsed,
  setSelectedIsUsed,
  onReset,
  onDeleteUnused,
  onExportUnused,
  isDeleting = false,
  isExporting = false
}) {
  const [localSearchCode, setLocalSearchCode] = useState(searchCode);

  // 检查是否有过滤条件
  const hasFilters = searchCode || selectedStatus !== "all" || selectedIsUsed !== "all";

  // 同步外部的 searchCode 变化到本地状态
  useEffect(() => {
    setLocalSearchCode(searchCode);
  }, [searchCode]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    setSearchCode(localSearchCode);
  }, [localSearchCode, setSearchCode]);

  // 处理回车搜索
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    setLocalSearchCode("");
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="flex gap-2">
            <Input placeholder="搜索邀请码..." value={localSearchCode} onChange={e => setLocalSearchCode(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 状态筛选 */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="disabled">禁用</SelectItem>
            </SelectContent>
          </Select>

          {/* 使用状态筛选 */}
          <Select value={selectedIsUsed} onValueChange={setSelectedIsUsed}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="使用状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="used">已使用</SelectItem>
              <SelectItem value="unused">未使用</SelectItem>
            </SelectContent>
          </Select>

          {/* 重置按钮 */}
          <Button variant="outline" onClick={handleReset} className="px-3">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 批量操作按钮 */}
      {hasFilters && <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
          <div className="text-sm text-gray-600 flex-1 flex items-center">
            根据当前过滤条件的批量操作：
          </div>
          <div className="flex gap-2">
            {/* 删除未使用按钮 */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDeleting || isExporting} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "删除中..." : "根据过滤条件批量删除未使用"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认批量删除</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将根据当前过滤条件，删除所有未使用的邀请码。
                    此操作无法撤销，请确认是否继续？
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteUnused} className="bg-red-600 hover:bg-red-700 text-white">
                    确认删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* 导出未使用按钮 */}
            <Button variant="outline" size="sm" onClick={onExportUnused} disabled={isDeleting || isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "导出中..." : "导出未使用"}
            </Button>
          </div>
        </div>}
    </div>;
}
