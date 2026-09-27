"use client";

// 作答学生挑选页，负责加载班级课程与题集数据并管理学生筛选分配流程
import { BookOpen, Coins, FileText, RefreshCw, School, Upload, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import StudentFilters from "./components/StudentFilters.js";
import StudentList from "./components/StudentList.js";
import { Badge } from "../../../../../components/ui/badge.js";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../components/ui/card.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../components/ui/dialog.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { getClassRoomInfoAction, getClassStudentsAction, getCourseInfoAction, getQuestionPackInfoAction, getStudentAnswerStatsAction, getStudentAnswersAction, getUnpaidStudentCountAction, giveScoreByCorrectCountAction } from "./actions.js";
import { filterStudents } from "./clientActions.js";
export default function AnswerSubmitPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");
  const courseId = searchParams.get("courseId");
  const packId = searchParams.get("packId");
  const {
    toast
  } = useToast();

  // 数据状态
  const [classRoom, setClassRoom] = useState(null);
  const [course, setCourse] = useState(null);
  const [questionPack, setQuestionPack] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  // 选择状态
  const [selectedStudents, setSelectedStudents] = useState(new Set());

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("在读"); // 默认选中"在读"
  const [selectedSubmitStatus, setSelectedSubmitStatus] = useState("all");
  const [selectedSortBy, setSelectedSortBy] = useState("correctRate"); // 默认使用正确率排序
  const [selectedSortOrder, setSelectedSortOrder] = useState("asc");

  // 积分对话框状态
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [isGivingScore, setIsGivingScore] = useState(false);

  // 加载数据的函数
  const loadData = useCallback(async () => {
    if (!user) return;
    if (!user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
    if (!classId || !courseId || !packId) {
      router.push(`/work/error?message=${encodeURIComponent("缺少必需的参数")}`);
      return;
    }
    setIsLoading(true);
    try {
      // 并行获取所有数据
      const [classRoomResult, courseResult, packResult, studentsData, answersData, statsData] = await Promise.all([getClassRoomInfoAction(classId), getCourseInfoAction(courseId), getQuestionPackInfoAction(packId), getClassStudentsAction(classId), getStudentAnswersAction(classId, courseId, packId), getStudentAnswerStatsAction(classId, courseId, packId)]);

      // 检查班级信息
      if (classRoomResult.error) {
        router.push(`/work/error?message=${encodeURIComponent(classRoomResult.error)}`);
        return;
      }
      setClassRoom(classRoomResult.classRoom);

      // 检查课程信息
      if (courseResult.error) {
        router.push(`/work/error?message=${encodeURIComponent(courseResult.error)}`);
        return;
      }
      setCourse(courseResult.course);

      // 检查题集信息
      if (packResult.error) {
        router.push(`/work/error?message=${encodeURIComponent(packResult.error)}`);
        return;
      }
      setQuestionPack(packResult.questionPack);

      // 处理学生答卷数据
      setStudentAnswers(answersData);

      // 创建学生提交状态映射
      const submissionMap = new Map();
      answersData.forEach(answer => {
        const existing = submissionMap.get(answer.studentId);
        if (!existing || answer.created > (existing.submittedAt || 0)) {
          submissionMap.set(answer.studentId, {
            hasSubmitted: true,
            submittedAt: answer.created,
            answerId: answer._id,
            isAnalysisCompleted: answer.isAnalysisCompleted,
            hasViewedReport: answer.hasViewedReport,
            reportViewedAt: answer.reportViewedAt
          });
        }
      });

      // 扩展学生数据，包含提交状态和统计信息
      const extendedStudents = studentsData.map(student => {
        const submission = submissionMap.get(student._id);
        const stats = statsData[student._id];
        return {
          ...student,
          hasSubmitted: submission?.hasSubmitted ?? false,
          submittedAt: submission?.submittedAt,
          answerId: submission?.answerId,
          isAnalysisCompleted: submission?.isAnalysisCompleted,
          hasViewedReport: submission?.hasViewedReport,
          reportViewedAt: submission?.reportViewedAt,
          wrongCount: stats?.wrongCount,
          correctRate: stats?.correctRate,
          missingImageCount: stats?.missingImageCount
        };
      });

      // 设置学生数据
      setAllStudents(extendedStudents);
      setFilteredStudents(extendedStudents);
    } catch (error) {
      console.error("加载数据失败:", error);
      router.push(`/work/error?message=${encodeURIComponent("加载数据失败")}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, router, packId, classId, courseId]);

  // 检查参数和权限
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 从sessionStorage恢复选中的学生
  useEffect(() => {
    const savedSelectedIds = sessionStorage.getItem("selectedStudentIds");
    if (savedSelectedIds) {
      try {
        const ids = JSON.parse(savedSelectedIds);
        if (Array.isArray(ids)) {
          setSelectedStudents(new Set(ids));
        }
        // 清除已使用的选中状态
        sessionStorage.removeItem("selectedStudentIds");
      } catch (error) {
        console.error("恢复选中状态失败:", error);
      }
    }
  }, [allStudents]); // 当学生数据加载完成后执行

  // 刷新数据
  const handleRefresh = useCallback(() => {
    // 重置选择状态和过滤器
    setSelectedStudents(new Set());
    setSearchTerm("");
    setSelectedGender("all");
    setSelectedStatus("all");
    setSelectedSubmitStatus("all");
    setSelectedSortBy("correctRate"); // 刷新时也使用正确率排序
    setSelectedSortOrder("asc");

    // 重新加载数据
    loadData();
  }, [loadData]);

  // 打开积分对话框
  const handleOpenScoreDialog = useCallback(async () => {
    if (!classId || !courseId || !packId) return;
    try {
      const count = await getUnpaidStudentCountAction(classId, courseId, packId);
      setUnpaidCount(count);
      setShowScoreDialog(true);
    } catch (error) {
      console.error("获取未给积分学生数量失败:", error);
      toast({
        title: "获取失败",
        description: "获取未给积分学生数量时发生错误",
        variant: "destructive"
      });
    }
  }, [classId, courseId, packId, toast]);

  // 确认给积分
  const handleConfirmGiveScore = useCallback(async () => {
    if (!classId || !courseId || !packId) return;
    setIsGivingScore(true);
    try {
      const result = await giveScoreByCorrectCountAction(classId, courseId, packId);
      if (result.success) {
        toast({
          title: "发放成功",
          description: result.message
        });
        setShowScoreDialog(false);
        // 刷新数据
        loadData();
      } else {
        toast({
          title: "发放失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("发放积分失败:", error);
      toast({
        title: "发放失败",
        description: "发放积分时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsGivingScore(false);
    }
  }, [classId, courseId, packId, toast, loadData]);

  // 过滤学生数据
  const filterStudentsData = useCallback(() => {
    if (allStudents.length === 0) return;
    setIsFiltering(true);
    try {
      const filtered = filterStudents(allStudents, searchTerm, selectedGender, selectedStatus, selectedSubmitStatus, selectedSortBy, selectedSortOrder);
      setFilteredStudents(filtered);
    } catch (error) {
      console.error("过滤学生数据失败:", error);
      toast({
        title: "过滤失败",
        description: "过滤学生数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsFiltering(false);
    }
  }, [allStudents, searchTerm, selectedGender, selectedStatus, selectedSubmitStatus, selectedSortBy, selectedSortOrder, toast]);

  // 当过滤条件变化时触发过滤
  useEffect(() => {
    filterStudentsData();
  }, [filterStudentsData]);

  // 处理学生选择
  const handleSelectStudent = useCallback((studentId, checked) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(studentId);
      } else {
        newSet.delete(studentId);
      }
      return newSet;
    });
  }, []);

  // 处理全选
  const handleSelectAll = useCallback(checked => {
    if (checked) {
      setSelectedStudents(new Set(filteredStudents.map(student => student._id)));
    } else {
      setSelectedStudents(new Set());
    }
  }, [filteredStudents]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedGender("all");
    setSelectedStatus("all");
    setSelectedSubmitStatus("all");
    setSelectedSortBy("correctRate"); // 重置时也使用正确率排序
    setSelectedSortOrder("asc");
  }, []);

  // 保存数据到 sessionStorage 并跳转
  const saveDataAndNavigate = useCallback(() => {
    if (!classRoom || !course || !questionPack || selectedStudents.size === 0) {
      return;
    }
    try {
      // 获取所有选中的学生数据，保持当前的排序顺序
      // 首先获取当前可见的选中学生（保持排序）
      const visibleSelectedStudents = filteredStudents.filter(student => selectedStudents.has(student._id));

      // 然后获取不可见但被选中的学生（从allStudents中）
      const hiddenSelectedStudents = allStudents.filter(student => selectedStudents.has(student._id) && !filteredStudents.some(fs => fs._id === student._id));

      // 合并：先显示可见的（保持排序），再显示隐藏的
      const selectedStudentData = [...visibleSelectedStudents, ...hiddenSelectedStudents];

      // 获取选中学生的答卷数据
      const selectedStudentAnswers = studentAnswers.filter(answer => selectedStudents.has(answer.studentId));

      // 准备要保存的数据
      const sessionData = {
        classRoom,
        course,
        questionPack,
        selectedStudents: selectedStudentData.map(student => ({
          _id: student._id,
          studentCode: student.studentCode,
          name: student.name,
          gender: student.gender,
          notes: student.notes,
          hasSubmitted: student.hasSubmitted,
          submittedAt: student.submittedAt,
          studentClass: {
            _id: student.studentClass._id,
            status: student.studentClass.status,
            notes: student.studentClass.notes
          }
        })),
        existingAnswers: selectedStudentAnswers,
        params: {
          classId,
          courseId,
          packId
        },
        timestamp: Date.now()
      };

      // 保存到 sessionStorage
      sessionStorage.setItem("answerSubmitData", JSON.stringify(sessionData));

      // 跳转到提交页面
      router.push("/work/answer/pick-students/submit");
    } catch (error) {
      console.error("保存数据失败:", error);
      toast({
        title: "保存失败",
        description: "保存数据时发生错误",
        variant: "destructive"
      });
    }
  }, [classRoom, course, questionPack, selectedStudents, filteredStudents, allStudents, studentAnswers, classId, courseId, packId, router, toast]);

  // 提交答卷
  const handleSubmitAnswers = useCallback(() => {
    if (selectedStudents.size === 0) {
      toast({
        title: "请选择学生",
        description: "请至少选择一个学生提交答卷",
        variant: "destructive"
      });
      return;
    }
    saveDataAndNavigate();
  }, [selectedStudents, saveDataAndNavigate, toast]);

  // 处理学生删除后的状态更新
  const handleStudentDeleted = useCallback(studentId => {
    // 更新学生列表中的提交状态
    setAllStudents(prevStudents => prevStudents.map(student => student._id === studentId ? {
      ...student,
      hasSubmitted: false,
      submittedAt: undefined
    } : student));
  }, []);
  if (isLoading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="提交答卷" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">加载数据中...</p>
          </div>
        </main>
      </div>;
  }
  if (!classRoom || !course || !questionPack) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="提交答卷" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">数据不存在</p>
          </div>
        </main>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title="提交答卷" rightContent={<div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" className="px-3">
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
            <Button onClick={handleOpenScoreDialog} variant="outline" size="sm" className="px-3">
              <Coins className="w-4 h-4 mr-2" />
              根据正确数给积分
            </Button>
            <Button onClick={handleSubmitAnswers} disabled={selectedStudents.size === 0} size="sm" className="px-4">
              <Upload className="w-4 h-4 mr-2" />
              提交答卷 ({selectedStudents.size})
            </Button>
          </div>} />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-7xl space-y-6">
          {/* 信息展示区域 */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {/* 班级信息 */}
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <School className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    班级信息
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="text-xl font-bold text-gray-900">
                    {classRoom.name}
                  </div>
                  {classRoom.headTeacher && <div className="text-sm text-gray-600">
                      班主任：{classRoom.headTeacher}
                    </div>}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{classRoom.status}</Badge>
                    <Badge variant="secondary">
                      {allStudents.length} 个学生
                    </Badge>
                  </div>
                  {classRoom.description && <div className="text-sm text-gray-600 mt-2">
                      {classRoom.description}
                    </div>}
                </div>
              </CardContent>
            </Card>

            {/* 课程信息 */}
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    课程信息
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="text-xl font-bold text-gray-900">
                    {course.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{course.subject}</Badge>
                    <Badge variant="outline">{course.status}</Badge>
                  </div>
                  {course.description && <div className="text-sm text-gray-600 mt-2">
                      {course.description}
                    </div>}
                </div>
              </CardContent>
            </Card>

            {/* 题集信息 */}
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    题集信息
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="text-xl font-bold text-gray-900">
                    {questionPack.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{questionPack.subject}</Badge>
                    <Badge variant="outline">{questionPack.type}</Badge>
                    <Badge variant="secondary">
                      {questionPack.questionIds.length}题
                    </Badge>
                  </div>
                  {questionPack.description && <div className="text-sm text-gray-600 mt-2">
                      {questionPack.description}
                    </div>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 选择状态展示 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>共 {allStudents.length} 个学生</span>
                  </div>
                  <div className="text-sm text-primary font-medium">
                    已选择 {selectedStudents.size} 个学生
                  </div>
                  <div className="text-sm text-green-600">
                    已提交：{allStudents.filter(s => s.hasSubmitted).length}{" "}
                    个
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredStudents.length !== allStudents.length && <span>（已过滤显示 {filteredStudents.length} 个）</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 过滤器 */}
          <StudentFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedGender={selectedGender} setSelectedGender={setSelectedGender} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} selectedSubmitStatus={selectedSubmitStatus} setSelectedSubmitStatus={setSelectedSubmitStatus} selectedSortBy={selectedSortBy} setSelectedSortBy={setSelectedSortBy} selectedSortOrder={selectedSortOrder} setSelectedSortOrder={setSelectedSortOrder} onReset={handleResetFilters} />

          {/* 学生列表 */}
          <div>
            {isFiltering && <div className="text-center py-2 text-sm text-gray-500 mb-4">
                过滤中...
              </div>}
            <StudentList students={filteredStudents.map(student => ({
            ...student,
            submittedAt: student.submittedAt ? new Date(student.submittedAt) : undefined
          }))} selectedStudents={selectedStudents} onStudentSelect={handleSelectStudent} onSelectAll={handleSelectAll} classId={classId || ""} courseId={courseId || ""} questionPackId={packId || ""} onStudentDeleted={handleStudentDeleted} questionPackName={questionPack?.name} />
          </div>
        </div>
      </main>

      {/* 积分确认对话框 */}
      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>根据正确数给积分</DialogTitle>
            <DialogDescription>
              <span className="block mt-2">
                积分计算规则：做对一题 +1 分，做错一题 -1 分
              </span>
              <span className="block mt-2 font-medium text-gray-900">
                本次将为 {unpaidCount} 个学生发放积分
              </span>
              {unpaidCount === 0 && <span className="block mt-2 text-orange-600">
                  所有学生都已经给过积分了
                </span>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScoreDialog(false)} disabled={isGivingScore}>
              取消
            </Button>
            <Button onClick={handleConfirmGiveScore} disabled={isGivingScore || unpaidCount === 0}>
              {isGivingScore ? "发放中..." : "确认发放"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}
