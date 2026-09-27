"use client";

import { RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
// 班级错题批量生成页面，负责班级任务筛选与学生 PDF 管理
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../hooks/useAuth.js";
import { getClassroomInfoAction, getClassroomStudentPdfsAction, getClassroomTasksAction } from "./actions.js";
import ClassroomTaskFilters from "./components/ClassroomTaskFilters.js";
import StudentPdfList from "./components/StudentPdfList.js";
export default function ClassroomMistakeBatchPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const {
    toast
  } = useToast();
  const classId = params.id;
  const [classroomName, setClassroomName] = useState("");
  const [classroomTasks, setClassroomTasks] = useState([]);
  const [allStudentPdfs, setAllStudentPdfs] = useState([]);
  const [filteredStudentPdfs, setFilteredStudentPdfs] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取班级任务数据
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classroomInfo, tasksData] = await Promise.all([getClassroomInfoAction(classId), getClassroomTasksAction(classId)]);
      setClassroomName(classroomInfo.name);
      setClassroomTasks(tasksData);

      // 自动选择最近的任务
      if (tasksData.length > 0 && !selectedTaskId) {
        setSelectedTaskId(tasksData[0].taskId);
      }
    } catch (error) {
      console.error("获取班级任务数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取班级任务数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [classId, selectedTaskId, toast]);

  // 获取学生PDF数据
  const fetchStudentPdfs = useCallback(async () => {
    if (!selectedTaskId) {
      setAllStudentPdfs([]);
      setFilteredStudentPdfs([]);
      return;
    }
    try {
      const pdfsData = await getClassroomStudentPdfsAction(classId, selectedTaskId);
      setAllStudentPdfs(pdfsData);
      setFilteredStudentPdfs(pdfsData);
    } catch (error) {
      console.error("获取学生PDF数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取学生PDF数据时发生错误",
        variant: "destructive"
      });
    }
  }, [classId, selectedTaskId, toast]);

  // 初始加载数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 当选中任务变化时，加载学生PDF数据
  useEffect(() => {
    fetchStudentPdfs();
  }, [fetchStudentPdfs]);

  // 手动刷新数据
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchData(), fetchStudentPdfs()]);
    } catch (error) {
      console.error("刷新数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData, fetchStudentPdfs]);

  // 处理过滤
  const handleFilter = useCallback(filtered => {
    setFilteredStudentPdfs(filtered);
  }, []);

  // 处理任务选择
  const handleTaskSelect = useCallback(taskId => {
    setSelectedTaskId(taskId);
  }, []);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={classroomName ? `班级错题集 - ${classroomName}` : "班级错题集"} showBackButton backHref="/work/classroom" backText="返回班级列表" rightContent={<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新数据
          </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-6">
          {/* 过滤器 */}
          <ClassroomTaskFilters classroomTasks={classroomTasks} studentPdfs={allStudentPdfs} selectedTaskId={selectedTaskId} onTaskSelect={handleTaskSelect} onFilter={handleFilter} isLoading={isLoading} />

          {/* 学生PDF列表 */}
          <StudentPdfList studentPdfs={filteredStudentPdfs} isLoading={isLoading} onRefresh={handleRefresh} />
        </div>
      </main>
    </div>;
}
