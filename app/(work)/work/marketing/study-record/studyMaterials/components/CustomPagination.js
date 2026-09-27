"use client";

// 自定义分页组件，提供分页导航功能
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../../../../../../components/ui/pagination.js";
export default function CustomPagination({
  currentPage,
  totalPages,
  onPageChange
}) {
  if (totalPages <= 1) {
    return null;
  }
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }
    rangeWithDots.push(...range);
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }
    return rangeWithDots;
  };
  const visiblePages = getVisiblePages();
  return <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => onPageChange(Math.max(1, currentPage - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
        </PaginationItem>

        {visiblePages.map((page, index) => <PaginationItem key={index}>
            {page === "..." ? <PaginationEllipsis /> : <PaginationLink onClick={() => onPageChange(page)} isActive={currentPage === page} className="cursor-pointer">
                {page}
              </PaginationLink>}
          </PaginationItem>)}

        <PaginationItem>
          <PaginationNext onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>;
}
