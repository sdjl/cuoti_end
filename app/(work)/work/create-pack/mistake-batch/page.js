"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
// 错题批量任务创建页，串联班级/题集/学生选择与任务提交
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../../../../components/ui/button.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { createMistakeBatchTaskAction, getClassRoomsAction, getQuestionPacksAction, getStudentMistakesPreviewAction } from "./actions.js";
import ClassRoomSelector from "./components/ClassRoomSelector.js";
import QuestionPackSelector from "./components/QuestionPackSelector.js";
import StudentSelector from "./components/StudentSelector.js";
import TimeRangeSelector from "./components/TimeRangeSelector.js";
export default function MistakeBatchPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const studentSelectorRef = useRef(null);

  // 班级数据
  const [classRooms, setClassRooms] = useState([]);
  const [isLoadingClassRooms, setIsLoadingClassRooms] = useState(true);

  // 选择的班级
  const [selectedClassIds, setSelectedClassIds] = useState([]);

  // 选择的科目
  const [selectedSubject, setSelectedSubject] = useState("物理");

  // 时间区间
  const [startDate, setStartDate] = useState(undefined);
  const [endDate, setEndDate] = useState(undefined);

  // 题集数据
  const [questionPacks, setQuestionPacks] = useState([]);
  const [isLoadingQuestionPacks, setIsLoadingQuestionPacks] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  // 选择的题集
  const [selectedPackIds, setSelectedPackIds] = useState([]);

  // 预览数据
  const [previewData, setPreviewData] = useState([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // 保存创建预览时的班级和题集ID（用于最终创建任务）
  const [previewClassIds, setPreviewClassIds] = useState([]);
  const [previewQuestionPackIds, setPreviewQuestionPackIds] = useState([]);

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 加载班级数据
  const fetchClassRooms = useCallback(async () => {
    setIsLoadingClassRooms(true);
    try {
      const classRoomsData = await getClassRoomsAction({
        status: "正常"
      });
      setClassRooms(classRoomsData);
    } catch (error) {
      console.error("获取班级数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取班级数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoadingClassRooms(false);
    }
  }, [toast]);

  // 初始加载班级数据
  useEffect(() => {
    fetchClassRooms();
  }, [fetchClassRooms]);

  // 查询题集
  const handleQuery = useCallback(async () => {
    if (selectedClassIds.length === 0) {
      toast({
        title: "请选择班级",
        description: "至少需要选择一个班级",
        variant: "destructive"
      });
      return;
    }
    if (!selectedSubject) {
      toast({
        title: "请选择科目",
        description: "需要选择一个科目",
        variant: "destructive"
      });
      return;
    }
    if (!startDate || !endDate) {
      toast({
        title: "请选择时间区间",
        description: "需要选择开始日期和结束日期",
        variant: "destructive"
      });
      return;
    }
    setIsLoadingQuestionPacks(true);
    try {
      // 将结束日期调整为当天的 23:59:59
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      const packs = await getQuestionPacksAction({
        classIds: selectedClassIds,
        subject: selectedSubject,
        startDate: startDate.getTime(),
        endDate: endDateTime.getTime()
      });
      setQuestionPacks(packs);
      setHasQueried(true);
      setSelectedPackIds([]);
      if (packs.length === 0) {
        toast({
          title: "未找到题集",
          description: "在选定的班级和时间区间内没有找到符合条件的试卷题集"
        });
      }
    } catch (error) {
      console.error("查询题集失败:", error);
      toast({
        title: "查询失败",
        description: "查询题集时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoadingQuestionPacks(false);
    }
  }, [selectedClassIds, selectedSubject, startDate, endDate, toast]);

  // 处理创建预览
  const handleCreatePreview = useCallback(async () => {
    if (selectedPackIds.length === 0) {
      toast({
        title: "请选择题集",
        description: "至少需要选择一个题集",
        variant: "destructive"
      });
      return;
    }
    setIsLoadingPreview(true);
    try {
      const data = await getStudentMistakesPreviewAction({
        classIds: selectedClassIds,
        questionPackIds: selectedPackIds
      });
      setPreviewData(data);
      setShowPreview(true);

      // 保存创建预览时的班级和题集ID
      setPreviewClassIds([...selectedClassIds]);
      setPreviewQuestionPackIds([...selectedPackIds]);

      // 滚动到学生选择组件
      setTimeout(() => {
        studentSelectorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 100);
      if (data.length === 0) {
        toast({
          title: "未找到错题数据",
          description: "在选定的班级和题集中没有找到学生错题记录"
        });
      }
    } catch (error) {
      console.error("获取预览数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取预览数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPreview(false);
    }
  }, [selectedPackIds, selectedClassIds, toast]);

  // 处理创建任务
  const handleCreateTask = useCallback(async params => {
    if (!user) {
      toast({
        title: "请先登录",
        variant: "destructive"
      });
      return;
    }
    const schoolId = user.workSetting?.currentSchool?._id;
    if (!schoolId) {
      toast({
        title: "无法创建任务",
        description: "当前用户未关联学校",
        variant: "destructive"
      });
      return;
    }
    try {
      const result = await createMistakeBatchTaskAction({
        taskName: params.taskName,
        taskDescription: params.taskDescription,
        schoolId,
        subject: selectedSubject,
        classIds: params.classIds,
        questionPackIds: params.questionPackIds,
        sortedQuestionPacks: questionPacks,
        allowStudentsDownloadAnswers: params.allowStudentsDownloadAnswers,
        studentList: params.selectedStudents
      });
      if (result.success) {
        toast({
          title: "任务创建成功",
          description: `任务ID: ${result.taskId}`
        });

        // 可以跳转到任务详情页面
        router.push(`/work/create-pack/mistake-batch/list/${result.taskId}`);
      } else {
        toast({
          title: "创建任务失败",
          description: result.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("创建任务失败:", error);
      toast({
        title: "创建任务失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    }
  }, [user, selectedSubject, questionPacks, toast, router]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="批量生成错题集" showBackButton backHref="/work/create-pack" backText="返回" rightContent={<Button variant="outline" size="sm" onClick={fetchClassRooms} disabled={isLoadingClassRooms} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingClassRooms ? "animate-spin" : ""}`} />
            刷新数据
          </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 班级选择 */}
          <ClassRoomSelector classRooms={classRooms} isLoading={isLoadingClassRooms} selectedClassIds={selectedClassIds} onSelectionChange={setSelectedClassIds} selectedSubject={selectedSubject} onSubjectChange={setSelectedSubject} />

          {/* 时间区间选择 */}
          <TimeRangeSelector startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onQuery={handleQuery} isQuerying={isLoadingQuestionPacks} disabled={selectedClassIds.length === 0} />

          {/* 题集选择 */}
          {hasQueried && <QuestionPackSelector questionPacks={questionPacks} isLoading={isLoadingQuestionPacks || isLoadingPreview} selectedPackIds={selectedPackIds} onSelectionChange={setSelectedPackIds} onCreatePreview={handleCreatePreview} />}

          {/* 学生选择 */}
          {showPreview && <div ref={studentSelectorRef}>
              <StudentSelector data={previewData} classIds={previewClassIds} questionPackIds={previewQuestionPackIds} onCreateTask={handleCreateTask} />
            </div>}
        </div>
      </main>
    </div>;
}
