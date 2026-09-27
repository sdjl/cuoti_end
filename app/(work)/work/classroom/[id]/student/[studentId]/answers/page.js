"use client";

// 学生答卷记录页面，用于查看和管理某个学生的所有答卷记录
import { Download, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import StudentAnswerFilters from "./components/StudentAnswerFilters.js";
import StudentAnswerList from "./components/StudentAnswerList.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../../hooks/useAuth.js";
import { deleteStudentAnswerAction, getClassCoursesAction, getStudentAnswersAction, getStudentClassesAction, getStudentInfoAction } from "./actions.js";
export default function StudentAnswersPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classId = params.id;
  const studentId = params.studentId;
  const {
    toast
  } = useToast();

  // 数据状态
  const [answers, setAnswers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [student, setStudent] = useState(null);

  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 过滤器状态
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [nameFilter, setNameFilter] = useState("");

  // 新增：勾选状态
  const [selectedAnswers, setSelectedAnswers] = useState([]);

  // 前端过滤后的答卷数据
  const filteredAnswers = answers.filter(answer => {
    // 题集类型过滤
    if (selectedType !== "all") {
      const questionPackType = answer.questionPackName?.includes("试卷") ? "试卷" : answer.questionPackName?.includes("错题集") ? "错题集" : answer.questionPackName?.includes("知识点") ? "知识点" : "自建";
      if (questionPackType !== selectedType) {
        return false;
      }
    }

    // 题集名称过滤
    if (nameFilter.trim()) {
      const packName = answer.questionPackName || "";
      if (!packName.toLowerCase().includes(nameFilter.trim().toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  // 检查当前校园和权限
  useEffect(() => {
    async function checkPermissions() {
      if (!user) return;
      if (!user.workSetting?.currentSchool) {
        router.push("/work/setting/curr-school");
        return;
      }
      try {
        // 获取学生信息
        const {
          student: studentData,
          error
        } = await getStudentInfoAction(classId, studentId);
        if (error) {
          router.push(`/work/error?message=${encodeURIComponent(error)}`);
          return;
        }
        if (!studentData) {
          router.push(`/work/error?message=${encodeURIComponent("学生不存在")}`);
          return;
        }
        setStudent(studentData);
      } catch (error) {
        console.error("检查权限失败:", error);
        router.push(`/work/error?message=${encodeURIComponent("检查权限失败")}`);
      }
    }
    checkPermissions();
  }, [user, router, classId, studentId]);

  // 获取课程列表
  const fetchCourses = useCallback(async () => {
    try {
      const coursesData = await getClassCoursesAction(classId);
      setCourses(coursesData);
    } catch (error) {
      console.error("获取课程列表失败:", error);
    }
  }, [classId]);

  // 获取学生班级列表
  const fetchStudentClasses = useCallback(async () => {
    try {
      const {
        classes: classesData,
        error
      } = await getStudentClassesAction(classId, studentId);
      if (error) {
        console.error("获取学生班级列表失败:", error);
      } else {
        setClasses(classesData);
      }
    } catch (error) {
      console.error("获取学生班级列表失败:", error);
    }
  }, [classId, studentId]);

  // 获取答卷数据
  const fetchAnswers = useCallback(async (showRefreshLoading = false) => {
    if (!student) return;
    if (showRefreshLoading) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const courseIdParam = selectedCourse === "all" ? undefined : selectedCourse === "null" ? null : selectedCourse;
      const filterClassIdParam = selectedClass === "all" ? undefined : selectedClass;

      // 获取所有答卷数据
      const answers = await getStudentAnswersAction(classId, studentId, {
        filterClassId: filterClassIdParam,
        courseId: courseIdParam
      });
      setAnswers(answers);
    } catch (error) {
      console.error("获取答卷数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取答卷数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [classId, studentId, student, selectedClass, selectedCourse, toast]);

  // 当学生信息加载完成后，获取数据
  useEffect(() => {
    if (student) {
      Promise.all([fetchCourses(), fetchStudentClasses(), fetchAnswers()]);
    }
  }, [student]); // 只在 student 变化时执行，避免过滤条件变化时的重复渲染

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    Promise.all([fetchCourses(), fetchStudentClasses(), fetchAnswers(true)]);
  }, [fetchCourses, fetchStudentClasses, fetchAnswers]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSelectedClass("all");
    setSelectedCourse("all");
    setSelectedType("all");
    setNameFilter("");
  }, []);

  // 处理查看答卷
  const handleViewAnswer = useCallback(answer => {
    // 使用新窗口打开
    window.open(`/work/answer/view/${answer._id}`, "_blank");
  }, []);

  // 处理删除答卷
  const handleDeleteAnswer = useCallback(async answerId => {
    try {
      const result = await deleteStudentAnswerAction(classId, answerId);
      if (result.success) {
        toast({
          title: "删除成功",
          description: `已删除答卷及 ${result.deletedItemCount} 条错题记录`
        });

        // 刷新数据
        await fetchAnswers();
      } else {
        toast({
          title: "删除失败",
          description: result.error || "删除答卷时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除答卷失败:", error);
      toast({
        title: "删除失败",
        description: "删除答卷时发生错误",
        variant: "destructive"
      });
    }
  }, [classId, toast, fetchAnswers]);

  // 新增：处理答卷选择
  const handleSelectAnswer = useCallback((answerId, checked) => {
    setSelectedAnswers(prev => {
      if (checked) {
        return [...prev, answerId];
      } else {
        return prev.filter(id => id !== answerId);
      }
    });
  }, []);

  // 新增：处理全选
  const handleSelectAll = useCallback(checked => {
    if (checked) {
      setSelectedAnswers(filteredAnswers.map(answer => answer._id));
    } else {
      setSelectedAnswers([]);
    }
  }, [filteredAnswers]);

  // 新增：处理导出勾选错题
  const handleExportWrongQuestions = useCallback(() => {
    if (selectedAnswers.length === 0) {
      toast({
        title: "请选择答卷",
        description: "请至少勾选一个答卷进行错题导出",
        variant: "destructive"
      });
      return;
    }

    // 获取选中答卷的题集ID
    const selectedAnswerData = answers.filter(answer => selectedAnswers.includes(answer._id));
    const questionPackIds = selectedAnswerData.map(answer => answer.questionPackId);

    // 使用sessionStorage临时存储题集ID
    sessionStorage.setItem("selectedQuestionPackIds", JSON.stringify(questionPackIds));
    sessionStorage.setItem("selectedAnswerIds", JSON.stringify(selectedAnswers));

    // 跳转到错题导出页面
    router.push(`/work/classroom/${classId}/student/${studentId}/wrong-export`);
  }, [selectedAnswers, answers, classId, studentId, router, toast]);

  // 当过滤条件变化时，重新获取数据并清空选择（仅班级和课程变化时重新查询）
  useEffect(() => {
    setSelectedAnswers([]); // 清空选择状态
    if (student) {
      fetchAnswers();
    }
  }, [selectedClass, selectedCourse, student, fetchAnswers]);

  // 当答卷数据变化时，清理不存在的选择
  useEffect(() => {
    const currentAnswerIds = answers.map(answer => answer._id);
    setSelectedAnswers(prev => prev.filter(id => currentAnswerIds.includes(id)));
  }, [answers]);
  if (!user || !student) {
    return null;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <WorkHeader title={`${student.name} - 答卷记录`} showBackButton={true} backHref={`/work/classroom/${classId}/student`} backText="返回学生列表" rightContent={<div className="flex items-center space-x-2">
            {selectedAnswers.length > 0 && <Button onClick={handleExportWrongQuestions} size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                <Download className="h-4 w-4 mr-2" />
                导出勾选错题 ({selectedAnswers.length})
              </Button>}
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-6">
          {/* 学生信息概览 */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {student.name}
                </h2>
                <p className="text-gray-600">
                  学号：{student.studentCode} | 性别：{student.gender}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">
                  {filteredAnswers.length}
                </div>
                <div className="text-sm text-gray-500">
                  {nameFilter || selectedType !== "all" ? "筛选结果" : "答卷总数"}
                </div>
              </div>
            </div>
          </div>

          {/* 筛选器 */}
          <StudentAnswerFilters selectedClass={selectedClass} setSelectedClass={setSelectedClass} selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse} selectedType={selectedType} setSelectedType={setSelectedType} nameFilter={nameFilter} setNameFilter={setNameFilter} classes={classes} courses={courses} onReset={handleResetFilters} />

          {/* 答卷列表 */}
          <StudentAnswerList answers={filteredAnswers} isLoading={isLoading || isRefreshing} onViewAnswer={handleViewAnswer} onDeleteAnswer={handleDeleteAnswer} selectedAnswers={selectedAnswers} onSelectAnswer={handleSelectAnswer} onSelectAll={handleSelectAll} student={student} />
        </div>
      </main>
    </div>;
}
