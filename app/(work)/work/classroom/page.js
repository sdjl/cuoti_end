"use client";

// 班级主页，整合筛选、统计与列表展示教师管理班级
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ClassRoomFilters from "./components/ClassRoomFilters.js";
import ClassRoomList from "./components/ClassRoomList.js";
import { Button } from "../../../../components/ui/button.js";
import WorkHeader from "../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../hooks/use-toast.js";
import { useAuth } from "../../../../hooks/useAuth.js";
import { getClassRoomCourseStatsAction, getClassRoomsAction, getClassRoomsByIdsAction, searchClassIdsByStudentAction } from "./actions.js";
export default function ClassRoomPage() {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const router = useRouter();
  const [classRooms, setClassRooms] = useState([]);
  const [courseStats, setCourseStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 过滤器状态
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取班级数据
  const fetchClassRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = searchTerm.trim();
      const studentKeyword = studentSearchTerm.trim();
      const status = selectedStatus !== "all" ? selectedStatus : "all";
      const grade = selectedGrade !== "all" ? selectedGrade : "all";
      let classRoomsData = [];

      // 如果有学生姓名搜索，先根据学生搜索班级ID
      if (studentKeyword) {
        const classIds = await searchClassIdsByStudentAction(studentKeyword);
        if (classIds.length > 0) {
          // 直接根据班级ID获取这些班级的完整信息（显示学生所在的所有班级）
          classRoomsData = await getClassRoomsByIdsAction(classIds);

          // 如果还有其他搜索条件，再进行过滤
          if (keyword) {
            const searchRegex = new RegExp(keyword, "i");
            classRoomsData = classRoomsData.filter(classroom => searchRegex.test(classroom.name) || searchRegex.test(classroom.headTeacher || "") || searchRegex.test(classroom.headTeacherPhone || "") || searchRegex.test(classroom.description || ""));
          }
          if (status !== "all") {
            classRoomsData = classRoomsData.filter(classroom => classroom.status === status);
          }
          if (grade !== "all") {
            classRoomsData = classRoomsData.filter(classroom => classroom.grade === grade);
          }
        } else {
          // 没有找到匹配的学生，返回空数组
          classRoomsData = [];
        }
      } else {
        // 没有学生姓名搜索，正常获取班级列表
        classRoomsData = await getClassRoomsAction({
          keyword,
          status,
          grade
        });
      }
      setClassRooms(classRoomsData);

      // 获取课程统计数据
      if (classRoomsData.length > 0) {
        const classIds = classRoomsData.map(classroom => classroom._id);
        const stats = await getClassRoomCourseStatsAction(classIds);
        setCourseStats(stats);
      } else {
        setCourseStats({});
      }
    } catch (error) {
      console.error("获取班级数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取班级数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [studentSearchTerm, searchTerm, selectedStatus, selectedGrade, toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchClassRooms();
    } catch (error) {
      console.error("获取班级数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchClassRooms]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setStudentSearchTerm("");
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedGrade("all");
  }, []);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="我的班级" rightContent={<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新数据
          </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <ClassRoomFilters studentSearchTerm={studentSearchTerm} setStudentSearchTerm={setStudentSearchTerm} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} selectedGrade={selectedGrade} setSelectedGrade={setSelectedGrade} onReset={handleResetFilters} />

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共找到{" "}
                <span className="font-medium text-gray-900">
                  {classRooms.length}
                </span>{" "}
                个班级
              </div>
            </div>
          </div>

          {/* 班级列表 */}
          <ClassRoomList classRooms={classRooms} isLoading={isLoading} courseStats={courseStats} />
        </div>
      </main>
    </div>;
}
