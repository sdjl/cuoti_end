// 校园校长筛选组件，用于根据区域、状态和校长情况筛选校园

import { Loader2, Search } from "lucide-react";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Input } from "../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select.js";
export default function SchoolAdminFilters({
  searchTerm,
  setSearchTerm,
  selectedRegion,
  setSelectedRegion,
  selectedStatus,
  setSelectedStatus,
  adminFilter,
  setAdminFilter,
  onSearch,
  onReset,
  isSearchPending = false,
  regions
}) {
  return <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-1.5">
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>根据条件筛选校园校长</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
          <div className="flex-1 relative">
            <Input placeholder="搜索校园..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pr-8 ${isSearchPending ? "opacity-75" : ""}`} />
            {isSearchPending && <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>}
          </div>
          <div>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="min-w-[150px]">
                <SelectValue placeholder="选择区域" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部区域</SelectItem>
                {regions.map(region => <SelectItem key={region.name} value={region.name}>
                    {region.name}
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
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="正常">正常</SelectItem>
                <SelectItem value="停用">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={adminFilter} onValueChange={setAdminFilter}>
              <SelectTrigger className="min-w-[150px]">
                <SelectValue placeholder="校长状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="hasAdmin">有校长</SelectItem>
                <SelectItem value="noAdmin">缺校长</SelectItem>
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
