// 试卷解析筛选组件，提供搜索、上传状态、解析状态和锁定状态的筛选功能

import { Loader2, Search } from "lucide-react";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Input } from "../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select.js";
export function ExamAnalysisFilter({
  searchTerm,
  setSearchTerm,
  selectedHasUploaded,
  setSelectedHasUploaded,
  selectedIsDone,
  setSelectedIsDone,
  selectedIsLocked,
  setSelectedIsLocked,
  handleSearch,
  resetFilters,
  isSearchPending = false
}) {
  return <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-1.5">
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>根据条件筛选试卷解析</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
          <div className="flex-1 relative">
            <Input placeholder="搜索试卷标题..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pr-8 ${isSearchPending ? "opacity-75" : ""}`} />
            {isSearchPending && <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>}
          </div>
          <div>
            <Select value={selectedHasUploaded} onValueChange={setSelectedHasUploaded}>
              <SelectTrigger className="min-w-[150px]">
                <SelectValue placeholder="是否已上传" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="yes">已上传</SelectItem>
                <SelectItem value="no">未上传</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={selectedIsDone} onValueChange={setSelectedIsDone}>
              <SelectTrigger className="min-w-[150px]">
                <SelectValue placeholder="是否已解析" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="yes">已解析</SelectItem>
                <SelectItem value="no">未解析</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={selectedIsLocked} onValueChange={setSelectedIsLocked}>
              <SelectTrigger className="min-w-[150px]">
                <SelectValue placeholder="是否锁定" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="yes">已锁定</SelectItem>
                <SelectItem value="no">未锁定</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="default" onClick={handleSearch} disabled={isSearchPending}>
              {isSearchPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              搜索
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              重置
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
}
