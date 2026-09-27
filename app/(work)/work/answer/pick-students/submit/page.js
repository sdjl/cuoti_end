"use client";

// 错题录入提交页，统筹学生选择、错题录入与批量保存提交流程
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getExistingStudentAnswersAction, getMistakePoints, getQuestionData, saveStudentAnswer } from "./actions.js";
import { calculateStatistics, initializeStudentAnswers, loadSessionData, saveSelectedStudentIds, updateStudentAnswer } from "./clientActions.js";
import QuestionPackInfo from "./components/QuestionPackInfo.js";
import StudentDetailPanel from "./components/StudentDetailPanel.js";
import StudentList from "./components/StudentList.js";
export default function SubmitPage() {
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState("");
  const [mistakePoints, setMistakePoints] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [questionData, setQuestionData] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const {
      data,
      error: loadError
    } = loadSessionData();
    if (loadError) {
      setError(loadError);
      return;
    }
    if (data) {
      setSessionData(data);
      loadMistakePoints(data.course.subject);
      loadExistingAnswers(data);
      loadQuestionData(data.questionPack.questionIds);
    }
  }, []);
  const loadMistakePoints = useCallback(async subject => {
    try {
      const result = await getMistakePoints(subject);
      if (result.success) {
        setMistakePoints(result.data);
      } else {
        toast({
          variant: "destructive",
          title: `加载${DISPLAY_TEXT.ERROR_ATTRIBUTION}失败`,
          description: result.error || "请稍后重试"
        });
      }
    } catch (error) {
      console.error(`加载${DISPLAY_TEXT.ERROR_ATTRIBUTION}失败:`, error);
      toast({
        variant: "destructive",
        title: `加载${DISPLAY_TEXT.ERROR_ATTRIBUTION}失败`,
        description: "请稍后重试"
      });
    }
  }, [toast]);
  const loadExistingAnswers = useCallback(async data => {
    try {
      // 获取所有选中学生的ID
      const studentIds = data.selectedStudents.map(s => s._id);

      // 从数据库加载已有的答卷数据
      const result = await getExistingStudentAnswersAction({
        classId: data.params.classId,
        courseId: data.params.courseId,
        questionPackId: data.params.packId,
        studentIds
      });
      if (result.success) {
        // 将数据库中的答卷数据合并到初始化的学生答案数据中
        const initialAnswers = initializeStudentAnswers(data.selectedStudents);
        const mergedAnswers = initialAnswers.map(answer => {
          const existingData = result.data.find(existing => existing.studentId === answer.studentId);
          if (existingData?.hasExistingData) {
            return {
              ...answer,
              wrongQuestions: existingData.wrongQuestions,
              isSaved: true,
              savedAt: Date.now()
            };
          }
          return answer;
        });
        setStudentAnswers(mergedAnswers);
      } else {
        // 如果加载失败，使用初始化的空数据
        setStudentAnswers(initializeStudentAnswers(data.selectedStudents));
        toast({
          variant: "destructive",
          title: "加载已有答卷数据失败",
          description: result.error || "将使用空白答卷"
        });
      }
    } catch (error) {
      console.error("加载已有答卷数据失败:", error);
      // 如果出错，使用初始化的空数据
      setStudentAnswers(initializeStudentAnswers(data.selectedStudents));
      toast({
        variant: "destructive",
        title: "加载已有答卷数据失败",
        description: "将使用空白答卷"
      });
    }
  }, [toast]);
  const loadQuestionData = useCallback(async questionIds => {
    try {
      const result = await getQuestionData(questionIds);
      if (result.success) {
        setQuestionData(result.data);
      } else {
        console.error("加载题目数据失败:", result.error);
      }
    } catch (error) {
      console.error("加载题目数据失败:", error);
    }
  }, []);
  const handleBack = () => {
    if (sessionData) {
      saveSelectedStudentIds(sessionData.selectedStudents);
    }
    router.back();
  };
  const handleStudentClick = studentId => {
    setSelectedStudentId(studentId);
  };

  // 保存单个学生的数据
  const handleStudentDetailSave = async (studentId, wrongQuestions) => {
    if (!sessionData || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // 保存到数据库
      const result = await saveStudentAnswer({
        classId: sessionData.params.classId,
        courseId: sessionData.params.courseId,
        questionPackId: sessionData.params.packId,
        studentId,
        wrongQuestions
      }, sessionData.questionPack.type);
      if (result.success) {
        // 更新本地状态
        setStudentAnswers(prev => updateStudentAnswer(prev, studentId, wrongQuestions));
        setSelectedStudentId(null);
        const studentName = sessionData.selectedStudents.find(s => s._id === studentId)?.name || "学生";
        toast({
          title: "提交成功",
          description: `${studentName}的答卷数据已保存到数据库`
        });
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: result.error || "请稍后重试"
        });
      }
    } catch (error) {
      console.error("保存学生数据失败:", error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "请稍后重试"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 返回完成页面
  const handleFinish = () => {
    if (sessionData) {
      // 返回到选择学生页面，并传递参数
      const {
        classId,
        courseId,
        packId
      } = sessionData.params;
      router.push(`/work/answer/pick-students?classId=${classId}&courseId=${courseId}&packId=${packId}`);
    } else {
      router.push("/work/answer");
    }
  };
  if (error) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="提交答卷" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-red-600 text-lg font-medium">数据错误</div>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => router.push("/work/answer")} variant="outline">
              返回重新选择
            </Button>
          </div>
        </main>
      </div>;
  }
  if (!sessionData) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="提交答卷" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">正在加载数据...</div>
        </main>
      </div>;
  }
  const {
    savedStudentsCount,
    unsavedStudentsCount
  } = calculateStatistics(studentAnswers, sessionData.selectedStudents.length);
  const selectedStudent = sessionData.selectedStudents.find(s => s._id === selectedStudentId);
  const selectedStudentAnswer = studentAnswers.find(answer => answer.studentId === selectedStudentId);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title="提交答卷" rightContent={<div className="flex items-center space-x-3">
            <Button onClick={handleBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回重新选择
            </Button>
            <Button onClick={handleFinish} size="sm" className="px-4">
              完成录入，返回
            </Button>
          </div>} />

      <main className="flex-1 p-6">
        <div className="container mx-auto space-y-6">
          {/* 题集信息和提交统计 */}
          <QuestionPackInfo questionPack={sessionData.questionPack} classRoom={sessionData.classRoom} course={sessionData.course} totalStudents={sessionData.selectedStudents.length} savedStudentsCount={savedStudentsCount} unsavedStudentsCount={unsavedStudentsCount} />

          {/* 学生列表 */}
          <StudentList selectedStudents={sessionData.selectedStudents} studentAnswers={studentAnswers} selectedStudentId={selectedStudentId} onStudentClick={handleStudentClick} />
        </div>
      </main>

      {/* 学生详情面板 */}
      {selectedStudent && selectedStudentAnswer && <StudentDetailPanel student={selectedStudent} questionIds={sessionData.questionPack.questionIds} mistakePoints={mistakePoints} initialWrongQuestions={selectedStudentAnswer.wrongQuestions} questionData={questionData} sessionParams={{
      classId: sessionData.params.classId,
      courseId: sessionData.params.courseId,
      questionPackId: sessionData.params.packId
    }} isSubmitting={isSubmitting} onClose={() => setSelectedStudentId(null)} onSave={wrongQuestions => handleStudentDetailSave(selectedStudentId, wrongQuestions)} />}
    </div>;
}
