"use client";

// 顽固错题页面，用于查看和管理学生的顽固错题记录
import { RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../../hooks/useAuth.js";
import { getCourseSubjectAction, getMistakeRecordsAction, getStudentClassRoomsAction, getStudentInfoAction } from "./actions.js";
import StubbornMistakeFilters from "./components/StubbornMistakeFilters.js";
import StubbornMistakeRecordList from "./components/StubbornMistakeRecordList.js";
export default function StudentStubbornMistakePage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const {
    toast
  } = useToast();
  const classRoomId = params.id;
  const studentId = params.studentId;
  const [records, setRecords] = useState([]);
  const [student, setStudent] = useState(null);
  const [classRooms, setClassRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subject, setSubject] = useState("");

  // 过滤器状态
  const [searchText, setSearchText] = useState("");
  const [selectedCorrectionStatus, setSelectedCorrectionStatus] = useState("stubborn"); // 默认选中顽固错题
  const [selectedQuestionType, setSelectedQuestionType] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedClassId, setSelectedClassId] = useState(classRoomId); // 默认选中URL中的班级

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取学生信息和班级列表
  useEffect(() => {
    const fetchStudentAndClasses = async () => {
      try {
        const [studentData, classRoomsData] = await Promise.all([getStudentInfoAction(studentId), getStudentClassRoomsAction(studentId)]);
        setStudent(studentData);
        setClassRooms(classRoomsData);
      } catch (error) {
        console.error("获取学生信息失败:", error);
        toast({
          title: "获取学生信息失败",
          description: "无法加载学生数据",
          variant: "destructive"
        });
      }
    };
    if (studentId) {
      fetchStudentAndClasses();
    }
  }, [studentId, toast]);

  // 获取错题记录数据
  const fetchMistakeRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const correctionStatus = selectedCorrectionStatus !== "all" ? selectedCorrectionStatus : undefined;
      const questionType = selectedQuestionType !== "all" ? selectedQuestionType : undefined;
      const difficulty = selectedDifficulty !== "all" ? selectedDifficulty : undefined;
      const recordsData = await getMistakeRecordsAction({
        studentId,
        classId: selectedClassId,
        correctionStatus,
        searchText: searchText.trim() || undefined,
        questionType,
        difficulty
      });
      setRecords(recordsData);

      // 从第一条记录的 courseId 获取科目信息
      if (recordsData.length > 0 && recordsData[0].courseId && !subject) {
        // 调用 Server Action 获取科目信息
        const courseSubject = await getCourseSubjectAction(recordsData[0].courseId);
        if (courseSubject) {
          setSubject(courseSubject);
        }
      }
    } catch (error) {
      console.error("获取错题记录失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取错题记录时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [studentId, selectedClassId, selectedCorrectionStatus, selectedQuestionType, selectedDifficulty, searchText, subject, toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchMistakeRecords();
    } catch (error) {
      console.error("获取错题记录失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchMistakeRecords]);

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
    setSearchText("");
    setSelectedCorrectionStatus("stubborn"); // 重置为默认的顽固错题
    setSelectedQuestionType("all");
    setSelectedDifficulty("all");
    setSelectedClassId(classRoomId); // 重置为URL中的班级
  }, [classRoomId]);

  // 构建页面标题
  const pageTitle = student ? `顽固错题：${student.name}` : "顽固错题";
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={pageTitle} rightContent={<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新数据
          </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <StubbornMistakeFilters searchText={searchText} setSearchText={setSearchText} selectedCorrectionStatus={selectedCorrectionStatus} setSelectedCorrectionStatus={setSelectedCorrectionStatus} selectedQuestionType={selectedQuestionType} setSelectedQuestionType={setSelectedQuestionType} selectedDifficulty={selectedDifficulty} setSelectedDifficulty={setSelectedDifficulty} selectedClassId={selectedClassId} setSelectedClassId={setSelectedClassId} classRooms={classRooms} onReset={handleResetFilters} />

          {/* 错题记录列表 */}
          <StubbornMistakeRecordList records={records} isLoading={isLoading} subject={subject} />

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共找到{" "}
                <span className="font-medium text-gray-900">
                  {records.length}
                </span>{" "}
                条错题记录
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>;
}
