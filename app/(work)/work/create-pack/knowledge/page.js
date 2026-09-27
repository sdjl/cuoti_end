"use client";

import { useRouter } from "next/navigation";
// 定制题集主页面，用于选择班级和学生，然后创建或查看定制题集
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { getClassRoomStudentsAction, getClassRoomsAction } from "./actions.js";
import ClassRoomSelector from "./components/ClassRoomSelector.js";
import CreatePackAction from "./components/CreatePackAction.js";
import StudentSelector from "./components/StudentSelector.js";
export default function CreatePackPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [classRooms, setClassRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);

  // 过滤条件
  const [classRoomFilter, setClassRoomFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("");

  // 使用 useDeferredValue 优化过滤性能
  const deferredClassRoomFilter = useDeferredValue(classRoomFilter);
  const deferredStudentFilter = useDeferredValue(studentFilter);

  // 判断过滤是否还在延迟中
  const isClassRoomFilterPending = classRoomFilter !== deferredClassRoomFilter;
  const isStudentFilterPending = studentFilter !== deferredStudentFilter;

  // 加载班级列表
  const loadClassRooms = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getClassRoomsAction();
      if (result.success) {
        setClassRooms(result.data || []);
      } else {
        toast({
          title: "加载失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "加载失败",
        description: "无法加载班级数据",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 加载学生列表
  const loadStudents = useCallback(async classRoomId => {
    setLoadingStudents(true);
    try {
      const result = await getClassRoomStudentsAction(classRoomId);
      if (result.success) {
        setStudents(result.data || []);
      } else {
        toast({
          title: "加载学生失败",
          description: result.error,
          variant: "destructive"
        });
        setStudents([]);
      }
    } catch {
      toast({
        title: "加载学生失败",
        description: "无法加载学生数据",
        variant: "destructive"
      });
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [toast]);

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);
  useEffect(() => {
    // 只有在用户存在且有当前校园时才加载数据
    if (user?.workSetting?.currentSchool) {
      loadClassRooms();
    }
  }, [user, loadClassRooms]);

  // 选择班级
  const handleClassRoomSelect = classRoom => {
    setSelected({
      classRoom
    });
    setStudentFilter("");
    setStudents([]);
    loadStudents(classRoom._id);
  };

  // 选择学生
  const handleStudentSelect = student => {
    setSelected(prev => ({
      ...prev,
      student
    }));
  };

  // 定制题集
  const handleCreatePack = () => {
    if (!selected.classRoom || !selected.student) {
      toast({
        title: "请完整选择",
        description: "请先选择班级和学生",
        variant: "destructive"
      });
      return;
    }

    // 在新窗口中打开定制题集页面
    window.open(`/work/create-pack/knowledge/${selected.classRoom._id}/${selected.student._id}/create`, "_blank");
  };

  // 题集列表
  const handleViewPackList = () => {
    if (!selected.classRoom || !selected.student) {
      toast({
        title: "请完整选择",
        description: "请先选择班级和学生",
        variant: "destructive"
      });
      return;
    }

    // 在新窗口中打开题集列表页面
    window.open(`/work/create-pack/knowledge/${selected.classRoom._id}/${selected.student._id}/list`, "_blank");
  };
  if (loading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="定制题集" showBackButton={true} backHref={"/work/create-pack"} backText="返回" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">加载数据中...</p>
          </div>
        </main>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title="定制题集" showBackButton={true} backHref={"/work/create-pack"} backText="返回" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* 班级选择组件 */}
            <div className="lg:col-span-1">
              <ClassRoomSelector classRooms={classRooms} selectedClassRoom={selected.classRoom} onClassRoomSelect={handleClassRoomSelect} classRoomFilter={deferredClassRoomFilter} classRoomFilterValue={classRoomFilter} onClassRoomFilterChange={setClassRoomFilter} isClassRoomFilterPending={isClassRoomFilterPending} />
            </div>

            {/* 学生选择组件 */}
            <div className="lg:col-span-2">
              <StudentSelector selectedClassRoom={selected.classRoom} students={students} selectedStudent={selected.student} onStudentSelect={handleStudentSelect} studentFilter={deferredStudentFilter} studentFilterValue={studentFilter} onStudentFilterChange={setStudentFilter} isStudentFilterPending={isStudentFilterPending} loadingStudents={loadingStudents} />
            </div>
          </div>

          {/* 定制题集操作组件 */}
          <div className="mt-6">
            <CreatePackAction selectedClassRoom={selected.classRoom} selectedStudent={selected.student} onCreatePack={handleCreatePack} onViewPackList={handleViewPackList} />
          </div>
        </div>
      </main>
    </div>;
}
