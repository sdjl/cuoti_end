"use client";

// 新生列表页面，用于管理通过邀请码注册的新生信息
import { RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../../components/common/Pagination.js";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { fetchGuestStudents } from "./actions.js";
import ConvertToStudentDialog from "./components/ConvertToStudentDialog.js";
import GuestStudentEditDialog from "./components/GuestStudentEditDialog.js";
import GuestStudentFilters from "./components/GuestStudentFilters.js";
import GuestStudentList from "./components/GuestStudentList.js";
export default function NewStudentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    toast
  } = useToast();

  // 状态
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 过滤器状态
  const [searchText, setSearchText] = useState("");
  const [isContactedByTeacher, setIsContactedByTeacher] = useState("all");
  const [isConvertedToStudent, setIsConvertedToStudent] = useState("all");

  // 对话框状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertingStudent, setConvertingStudent] = useState(null);
  const pageSize = 20;

  // 从URL参数初始化状态
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1");
    const searchTextParam = searchParams.get("searchText") || "";
    const contactedParam = searchParams.get("contacted") || "all";
    const convertedParam = searchParams.get("converted") || "all";
    setCurrentPage(page);
    setSearchText(searchTextParam);
    setIsContactedByTeacher(contactedParam);
    setIsConvertedToStudent(convertedParam);
  }, [searchParams]);

  // 更新URL参数
  const updateURL = useCallback(params => {
    const newSearchParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });
    router.push(`${pathname}?${newSearchParams.toString()}`);
  }, [pathname, router, searchParams]);

  // 获取新生列表
  const loadStudents = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const filters = {
        searchText,
        isContactedByTeacher,
        isConvertedToStudent
      };
      const result = await fetchGuestStudents({
        pageNum: currentPage,
        pageSize,
        filters
      });
      setStudents(result.students);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch {
      toast({
        title: "加载失败",
        description: "获取新生列表失败，请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, searchText, isContactedByTeacher, isConvertedToStudent, toast]);

  // 初始化和筛选条件变化时加载数据
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // 处理页面变化
  const handlePageChange = page => {
    setCurrentPage(page);
    updateURL({
      page: page.toString()
    });
  };

  // 处理筛选器重置
  const handleResetFilters = () => {
    setSearchText("");
    setIsContactedByTeacher("all");
    setIsConvertedToStudent("all");
    setCurrentPage(1);
    updateURL({
      page: "",
      searchText: "",
      contacted: "",
      converted: ""
    });
  };

  // 处理筛选器变化
  const handleSearchTextChange = value => {
    setSearchText(value);
    setCurrentPage(1);
    updateURL({
      page: "",
      searchText: value
    });
  };
  const handleContactedChange = value => {
    setIsContactedByTeacher(value);
    setCurrentPage(1);
    updateURL({
      page: "",
      contacted: value
    });
  };
  const handleConvertedChange = value => {
    setIsConvertedToStudent(value);
    setCurrentPage(1);
    updateURL({
      page: "",
      converted: value
    });
  };

  // 处理刷新
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadStudents(false);
  };

  // 处理编辑学生
  const handleEditStudent = student => {
    setEditingStudent(student);
    setEditDialogOpen(true);
  };

  // 处理转为在校生
  const handleConvertToStudent = student => {
    setConvertingStudent(student);
    setConvertDialogOpen(true);
  };

  // 处理转换成功
  const handleConvertSuccess = () => {
    loadStudents(false);
  };

  // 处理编辑保存
  const handleEditSave = () => {
    loadStudents(false);
  };
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="新生列表" showBackButton={true} backHref="/work/marketing" backText="返回营销管理" rightContent={<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新数据
          </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <GuestStudentFilters searchText={searchText} setSearchText={handleSearchTextChange} isContactedByTeacher={isContactedByTeacher} setIsContactedByTeacher={handleContactedChange} isConvertedToStudent={isConvertedToStudent} setIsConvertedToStudent={handleConvertedChange} onReset={handleResetFilters} />

          {/* 新生列表 */}
          <GuestStudentList students={students} isLoading={isLoading} onEditStudent={handleEditStudent} onConvertToStudent={handleConvertToStudent} />

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="guest_page" />
            </div>}

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">
              {searchText || isContactedByTeacher !== "all" || isConvertedToStudent !== "all" ? <>
                  共找到 {totalCount} 个新生，当前显示第 {currentPage} 页，共{" "}
                  {totalPages} 页
                </> : <>
                  共有 {totalCount} 个新生，当前显示第 {currentPage} 页，共{" "}
                  {totalPages} 页
                </>}
            </div>
          </div>
        </div>
      </main>

      {/* 编辑对话框 */}
      <GuestStudentEditDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} student={editingStudent} onSave={handleEditSave} />

      {/* 转为在校生对话框 */}
      <ConvertToStudentDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen} student={convertingStudent} onSuccess={handleConvertSuccess} />
    </div>;
}
