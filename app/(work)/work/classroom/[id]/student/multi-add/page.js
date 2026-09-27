"use client";

// 批量添加学生页面，用于从校园中选择多个学生并批量添加到指定班级
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../hooks/useAuth.js";
import { getClassRoomInfoAction } from "../actions.js";
import { batchAddStudentsToClassAction, getClassRoomStudentsAction, getSchoolClassRoomsAction, searchStudentsAction } from "./actions.js";
import FilterPanel from "./components/FilterPanel.js";
import SelectedStudents from "./components/SelectedStudents.js";
import StudentList from "./components/StudentList.js";
export default function MultiAddStudentPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classRoomId = params.id;
  const {
    toast
  } = useToast();
  const [classRoom, setClassRoom] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedStudentsMap, setSelectedStudentsMap] = useState(new Map());
  const [inClassStudentIds, setInClassStudentIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // 检查权限并加载数据
  useEffect(() => {
    async function init() {
      if (!user) return;
      if (!user.workSetting?.currentSchool) {
        router.push("/work/setting/curr-school");
        return;
      }
      try {
        setIsLoading(true);

        // 获取班级信息
        const {
          classRoom: classRoomData,
          error: classRoomError
        } = await getClassRoomInfoAction(classRoomId);
        if (classRoomError) {
          router.push(`/work/error?message=${encodeURIComponent(classRoomError)}`);
          return;
        }
        setClassRoom(classRoomData);

        // 获取所有班级列表
        const {
          classrooms: classroomList,
          error: classroomError
        } = await getSchoolClassRoomsAction(classRoomId);
        if (classroomError) {
          toast({
            title: "获取班级列表失败",
            description: classroomError,
            variant: "destructive"
          });
        } else {
          setClassrooms(classroomList);
        }

        // 获取当前班级已有的学生
        const {
          students: classStudents,
          error: classStudentsError
        } = await getClassRoomStudentsAction(classRoomId);
        if (classStudentsError) {
          toast({
            title: "获取班级学生失败",
            description: classStudentsError,
            variant: "destructive"
          });
        } else {
          // 保存已在班级中的学生ID（仅用于显示和禁用，不添加到已选列表）
          const classStudentIds = classStudents.map(s => s._id);
          setInClassStudentIds(classStudentIds);
        }

        // 默认加载学生（无条件，200条）
        await handleSearch({
          keyword: "",
          classRoomId: "",
          grade: ""
        });
      } catch (error) {
        console.error("初始化失败:", error);
        toast({
          title: "初始化失败",
          description: "加载页面数据时发生错误",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [user, router, classRoomId]);

  // 搜索学生
  const handleSearch = useCallback(async filters => {
    setIsSearching(true);
    try {
      const {
        students: studentList,
        error
      } = await searchStudentsAction(classRoomId, filters);
      if (error) {
        toast({
          title: "搜索失败",
          description: error,
          variant: "destructive"
        });
        return;
      }
      setStudents(studentList);
    } catch (error) {
      console.error("搜索学生失败:", error);
      toast({
        title: "搜索失败",
        description: "搜索学生时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  }, [classRoomId, toast]);

  // 批量添加学生
  const handleBatchAdd = useCallback(async () => {
    if (selectedStudentIds.length === 0) {
      toast({
        title: "请选择学生",
        description: "请至少选择一位学生",
        variant: "destructive"
      });
      return;
    }
    setIsAdding(true);
    try {
      const {
        success,
        addedCount,
        skippedCount,
        error
      } = await batchAddStudentsToClassAction(classRoomId, selectedStudentIds);
      if (!success) {
        toast({
          title: "添加失败",
          description: error || "批量添加学生失败",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "添加成功",
        description: `成功添加 ${addedCount} 位学生${skippedCount > 0 ? `，跳过 ${skippedCount} 位已在班级中的学生` : ""}`
      });

      // 清空选择
      setSelectedStudentIds([]);
      setSelectedStudentsMap(new Map());

      // 如果全部成功，返回学生列表页面
      if (addedCount > 0) {
        setTimeout(() => {
          router.push(`/work/classroom/${classRoomId}/student`);
        }, 1000);
      }
    } catch (error) {
      console.error("批量添加学生失败:", error);
      toast({
        title: "添加失败",
        description: "批量添加学生时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  }, [classRoomId, selectedStudentIds, toast, router]);

  // 处理选择变化
  const handleSelectionChange = useCallback(newSelectedIds => {
    setSelectedStudentIds(newSelectedIds);

    // 更新 selectedStudentsMap
    setSelectedStudentsMap(prevMap => {
      const newMap = new Map(prevMap);

      // 添加新选中的学生
      const addedIds = newSelectedIds.filter(id => !prevMap.has(id));
      addedIds.forEach(id => {
        const student = students.find(s => s._id === id);
        if (student) {
          newMap.set(id, student);
        }
      });

      // 移除取消选中的学生
      const removedIds = Array.from(prevMap.keys()).filter(id => !newSelectedIds.includes(id));
      removedIds.forEach(id => {
        newMap.delete(id);
      });
      return newMap;
    });
  }, [students]);

  // 移除单个已选择的学生
  const handleRemoveSelected = useCallback(studentId => {
    setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
    setSelectedStudentsMap(prevMap => {
      const newMap = new Map(prevMap);
      newMap.delete(studentId);
      return newMap;
    });
  }, []);

  // 清空所有选择
  const handleClearAll = useCallback(() => {
    setSelectedStudentIds([]);
    setSelectedStudentsMap(new Map());
  }, []);
  if (!user || !classRoom) {
    return null;
  }
  if (isLoading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="批量添加学生" showBackButton={true} backHref={`/work/classroom/${classRoomId}/student`} backText="返回学生列表" />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="text-center py-12">加载中...</div>
          </div>
        </main>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title={`${classRoom.name} - 批量添加学生`} showBackButton={true} backHref={`/work/classroom/${classRoomId}/student`} backText="返回学生列表" />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-6">
          {/* 过滤面板 */}
          <FilterPanel classrooms={classrooms} onSearch={handleSearch} isSearching={isSearching} />

          {/* 已选择的学生 */}
          <SelectedStudents students={Array.from(selectedStudentsMap.values())} onRemove={handleRemoveSelected} onClearAll={handleClearAll} onBatchAdd={handleBatchAdd} isAdding={isAdding} />

          {/* 学生列表 */}
          <StudentList students={students} selectedStudentIds={selectedStudentIds} inClassStudentIds={inClassStudentIds} onSelectionChange={handleSelectionChange} />
        </div>
      </main>
    </div>;
}
