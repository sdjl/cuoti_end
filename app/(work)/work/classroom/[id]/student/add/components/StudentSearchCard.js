"use client";

import { Search, UserPlus } from "lucide-react";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../../components/ui/label.js";

/**
 * 学生搜索卡片
 * 提供学生搜索和新建学生按钮功能
 */

export function StudentSearchCard({
  searchKeyword,
  isSearching,
  showCreateForm,
  onSearchKeywordChange,
  onSearch,
  onShowCreateForm
}) {
  return <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-500" />
              <Label htmlFor="searchKeyword" className="text-nowrap">
                搜索学生：
              </Label>
            </div>
            <div className="flex-1">
              <Input id="searchKeyword" placeholder="请输入学生编号或姓名" value={searchKeyword} onChange={e => onSearchKeywordChange(e.target.value)} onKeyPress={e => {
              if (e.key === "Enter") {
                onSearch();
              }
            }} />
            </div>
            <Button onClick={onSearch} disabled={isSearching || !searchKeyword.trim()}>
              {isSearching ? "搜索中..." : "搜索"}
            </Button>
            <Button onClick={onShowCreateForm} variant="outline" disabled={showCreateForm}>
              <UserPlus className="h-4 w-4 mr-2" />
              新建学生
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
}
