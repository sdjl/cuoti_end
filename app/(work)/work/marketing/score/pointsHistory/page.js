/**
 * 积分变化页面
 *
 * 支持通过 URL 参数 studentId 查询指定学生的数据
 * 例如: /work/marketing/score/pointsHistory?studentId=xxx
 */
"use client";

import { RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../../components/common/Pagination.js";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { getAvailableClassroomsAction, getPointsHistoryRecordsAction } from "./actions.js";
import PointsHistoryFilters from "./components/PointsHistoryFilters.js";
import PointsHistoryList from "./components/PointsHistoryList.js";

// 每页显示的记录数量
const PAGE_SIZE = 20;
export default function PointsHistoryPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const searchParams = useSearchParams();
  const studentIdFromUrl = searchParams.get("studentId");
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 班级数据
  const [classrooms, setClassrooms] = useState([]);

  // 过滤器状态
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedGrowthType, setSelectedGrowthType] = useState("all");
  const [selectedIsShowInGrowthPath, setSelectedIsShowInGrowthPath] = useState("all");
  const [targetStudentId, setTargetStudentId] = useState(null);

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取可查看的班级列表
  const fetchClassrooms = useCallback(async () => {
    try {
      const result = await getAvailableClassroomsAction();
      if (result.success) {
        setClassrooms(result.data);
      } else {
        console.error("获取班级列表失败:", result.error);
      }
    } catch (error) {
      console.error("获取班级列表失败:", error);
    }
  }, []);

  // 获取积分变动记录数据
  const fetchRecords = useCallback(async () => {
    if (!user?.workSetting?.currentSchool || classrooms.length === 0) return;
    setIsLoading(true);
    try {
      // 获取班级ID数组
      const classIds = classrooms.map(classroom => classroom._id);
      const result = await getPointsHistoryRecordsAction({
        classIds,
        pageNum: currentPage - 1,
        pageSize: PAGE_SIZE,
        selectedClassId,
        studentSearch,
        growthType: selectedGrowthType,
        isShowInGrowthPath: selectedIsShowInGrowthPath,
        targetStudentId
      });
      if (result.success) {
        setRecords(result.data);
        setTotalCount(result.totalCount);
      } else {
        toast({
          title: "获取数据失败",
          description: result.error || "获取积分变动记录数据时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("获取积分变动记录数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取积分变动记录数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.workSetting?.currentSchool, classrooms, currentPage, selectedClassId, studentSearch, selectedGrowthType, selectedIsShowInGrowthPath, targetStudentId, toast]);

  // 手动刷新数据
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchRecords();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchRecords]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setStudentSearch("");
    setSelectedClassId("all");
    setSelectedGrowthType("all");
    setSelectedIsShowInGrowthPath("all");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 初始化URL参数中的学生ID
  useEffect(() => {
    if (studentIdFromUrl) {
      setTargetStudentId(studentIdFromUrl);
    }
  }, [studentIdFromUrl]);

  // 初始化加载班级数据
  useEffect(() => {
    if (user?.workSetting?.currentSchool) {
      fetchClassrooms();
    }
  }, [user?.workSetting?.currentSchool, fetchClassrooms]);

  // 当过滤条件或页码变化时，重新获取数据
  useEffect(() => {
    if (user?.workSetting?.currentSchool && classrooms.length > 0) {
      fetchRecords();
    }
  }, [fetchRecords, user?.workSetting?.currentSchool, classrooms]);

  // 当过滤条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [studentSearch, selectedClassId, selectedGrowthType, selectedIsShowInGrowthPath]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="积分变动记录" showBackButton={true} backHref="/work/marketing" backText="返回营销管理" rightContent={<div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <PointsHistoryFilters studentSearch={studentSearch} setStudentSearch={setStudentSearch} selectedClassId={selectedClassId} setSelectedClassId={setSelectedClassId} selectedGrowthType={selectedGrowthType} setSelectedGrowthType={setSelectedGrowthType} selectedIsShowInGrowthPath={selectedIsShowInGrowthPath} setSelectedIsShowInGrowthPath={setSelectedIsShowInGrowthPath} classrooms={classrooms} onReset={handleResetFilters} />

          {/* 积分变动记录列表 */}
          <PointsHistoryList records={records} isLoading={isLoading} />

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="points_page" />
            </div>}

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">
              {studentSearch || selectedClassId !== "all" || selectedGrowthType !== "all" || selectedIsShowInGrowthPath !== "all" ? <>
                  共找到 {totalCount} 条积分变动记录， 当前显示第 {currentPage}{" "}
                  页，共 {totalPages} 页
                </> : <>
                  共有 {totalCount} 条积分变动记录，当前显示第 {currentPage}{" "}
                  页，共 {totalPages} 页
                </>}
            </div>
          </div>
        </div>
      </main>
    </div>;
}
