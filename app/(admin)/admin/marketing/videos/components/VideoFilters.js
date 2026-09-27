"use client";

import { Loader2, Search } from "lucide-react";
import { Button } from "../../../../../../components/ui/button.js";
// 视频筛选组件，用于根据标题和分类筛选视频列表
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
export default function VideoFilters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  onSearch,
  onReset,
  isSearchPending = false,
  categories
}) {
  return <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-1.5">
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>根据条件筛选视频</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
          <div className="flex-1 relative">
            <Input placeholder="搜索视频..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pr-8 ${isSearchPending ? "opacity-75" : ""}`} />
            {isSearchPending && <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>}
          </div>
          <div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="min-w-[150px]">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map(category => <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="default" onClick={onSearch} disabled={isSearchPending}>
              {isSearchPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
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
