import { ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button.js";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command.js";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink } from "../ui/pagination.js";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover.js";
import { cn } from "../../lib/shadcn/utils.js";

// 警告：请勿使用"page"作为分页参数名称，这会导致多页面之间参数混淆！
// 每个页面应该使用独特的参数名称，如exam_page、question_page等。

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  pageParamName = "page" // 默认值，但应避免使用
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // 检查是否使用了"page"作为参数名
  if (pageParamName === "page") {
    console.warn("警告: 请勿使用'page'作为分页参数名称，这会导致多页面之间参数混淆！应使用独特的参数名称，例如exam_page、question_page等。");
  }

  // 生成要显示的页码数组
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  // 生成快速选择页码的选项
  const getPageOptions = () => {
    const options = [];
    for (let i = 1; i <= totalPages; i++) {
      options.push({
        value: i.toString(),
        label: `第 ${i} 页`
      });
    }
    return options;
  };

  // 处理页码输入并跳转
  const handlePageGoTo = () => {
    const pageNumber = parseInt(inputValue);
    if (!Number.isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
      setOpen(false);
      setInputValue("");
    }
  };
  return <Pagination className={cn(className)}>
      <PaginationContent>
        {/* 首页按钮 */}
        <PaginationItem>
          <Button variant="outline" size="icon" onClick={() => currentPage > 1 && onPageChange(1)} disabled={currentPage <= 1} className={cn("cursor-pointer", currentPage <= 1 && "pointer-events-none opacity-50", "mr-2")} title="首页">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </PaginationItem>

        {/* 页码按钮 */}
        {getPageNumbers().map(pageNumber => <PaginationItem key={pageNumber}>
            <PaginationLink onClick={() => onPageChange(pageNumber)} isActive={currentPage === pageNumber} className="cursor-pointer">
              {pageNumber}
            </PaginationLink>
          </PaginationItem>)}

        {/* 跳转到指定页码 */}
        {totalPages > 5 && <PaginationItem>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <PaginationEllipsis className="cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0">
                <Command>
                  <CommandInput placeholder="输入页码..." value={inputValue} onValueChange={setInputValue} />
                  <CommandList>
                    <CommandEmpty>没有找到页码</CommandEmpty>
                    <CommandGroup heading="选择页码">
                      {getPageOptions().map(option => <CommandItem key={option.value} value={option.value} onSelect={value => {
                    onPageChange(parseInt(value));
                    setOpen(false);
                  }}>
                          {option.label}
                        </CommandItem>)}
                    </CommandGroup>
                  </CommandList>
                  <div className="p-2 border-t">
                    <Button size="sm" className="w-full" onClick={handlePageGoTo}>
                      跳转
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
          </PaginationItem>}

        {/* 末页按钮 */}
        <PaginationItem>
          <Button variant="outline" size="icon" onClick={() => currentPage < totalPages && onPageChange(totalPages)} disabled={currentPage >= totalPages} className={cn("cursor-pointer", currentPage >= totalPages && "pointer-events-none opacity-50")} title="末页">
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </PaginationItem>

        {/* 下一页按钮 */}
        <PaginationItem>
          <Button variant="outline" onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className={cn("cursor-pointer", currentPage >= totalPages && "pointer-events-none opacity-50", "ml-2")}>
            下一页
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>;
}
