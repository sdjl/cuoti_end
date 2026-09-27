"use client";

// 错题导出页面，用于预览和导出学生选中的错题
import { Download, FileText, ImageIcon, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../../components/ui/card.js";
import WorkHeader from "../../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../../hooks/useAuth.js";
import { getStudentInfoForExportAction, getWrongQuestionsForExportAction } from "./actions.js";
import { downloadAnswersPDFFromClient, downloadQuestionsPDFFromClient, generateFileName } from "./clientActions.js";
import { StudentInfoCard } from "./components/StudentInfoCard.js";
import { WrongQuestionCard } from "./components/WrongQuestionCard.js";
export default function WrongExportPage() {
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
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);

  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 获取错题数据
  const fetchWrongQuestions = useCallback(async () => {
    // 从sessionStorage获取选中的答卷ID
    const selectedAnswerIds = sessionStorage.getItem("selectedAnswerIds");
    if (!selectedAnswerIds) {
      toast({
        title: "参数错误",
        description: "未找到选中的答卷数据",
        variant: "destructive"
      });
      router.back();
      return;
    }
    setIsLoading(true);
    try {
      const answerIds = JSON.parse(selectedAnswerIds);

      // 并行获取学生信息和错题数据
      const [studentInfoData, wrongQuestionsData] = await Promise.all([getStudentInfoForExportAction(classId, studentId), getWrongQuestionsForExportAction(classId, answerIds)]);

      // 更新错题总数
      const updatedStudentInfo = {
        ...studentInfoData,
        questionCount: wrongQuestionsData.length
      };
      setStudentInfo(updatedStudentInfo);
      setWrongQuestions(wrongQuestionsData);
    } catch (error) {
      console.error("获取数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取学生信息和错题数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [classId, studentId, router, toast]);

  // 检查当前校园和权限
  useEffect(() => {
    async function checkPermissions() {
      if (!user) return;
      if (!user.workSetting?.currentSchool) {
        router.push("/work/setting/curr-school");
        return;
      }

      // 直接开始获取错题数据
      fetchWrongQuestions();
    }
    checkPermissions();
  }, [user, router, fetchWrongQuestions]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchWrongQuestions().finally(() => setIsRefreshing(false));
  }, [fetchWrongQuestions]);

  // 下载错题PDF（包含图片）
  const handleDownloadQuestionsPDF = useCallback(async () => {
    // 从sessionStorage获取选中的答卷ID
    const selectedAnswerIds = sessionStorage.getItem("selectedAnswerIds");
    if (!selectedAnswerIds || !studentInfo) {
      toast({
        title: "参数错误",
        description: "未找到选中的答卷数据或学生信息",
        variant: "destructive"
      });
      return;
    }
    try {
      const fileName = generateFileName("questions", studentInfo.studentName);
      const answerIds = JSON.parse(selectedAnswerIds);
      toast({
        title: "开始生成错题PDF",
        description: "正在前端生成错题PDF，请稍候..."
      });
      await downloadQuestionsPDFFromClient(classId, studentId, answerIds, fileName);
      toast({
        title: "错题PDF生成成功",
        description: "错题PDF已开始下载"
      });
    } catch (error) {
      console.error("生成错题PDF失败:", error);
      toast({
        title: "生成错题PDF失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  }, [classId, studentId, studentInfo, toast]);

  // 下载答案PDF（只有答案和解析）
  const handleDownloadAnswersPDF = useCallback(async () => {
    // 从sessionStorage获取选中的答卷ID
    const selectedAnswerIds = sessionStorage.getItem("selectedAnswerIds");
    if (!selectedAnswerIds || !studentInfo) {
      toast({
        title: "参数错误",
        description: "未找到选中的答卷数据或学生信息",
        variant: "destructive"
      });
      return;
    }
    try {
      const fileName = generateFileName("answers", studentInfo.studentName);
      const answerIds = JSON.parse(selectedAnswerIds);
      toast({
        title: "开始生成答案PDF",
        description: "正在前端生成答案PDF，请稍候..."
      });
      await downloadAnswersPDFFromClient(classId, studentId, answerIds, fileName);
      toast({
        title: "答案PDF生成成功",
        description: "错题答案PDF已开始下载"
      });
    } catch (error) {
      console.error("生成答案PDF失败:", error);
      toast({
        title: "生成答案PDF失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  }, [classId, studentId, studentInfo, toast]);
  if (!user) {
    return null;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <WorkHeader title="错题导出" showBackButton={true} backHref={`/work/classroom/${classId}/student/${studentId}/answers`} backText="返回答卷列表" rightContent={<div className="flex items-center space-x-2">
            {wrongQuestions.length > 0 && <>
                <Button onClick={handleDownloadAnswersPDF} size="sm" variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                  <FileText className="h-4 w-4 mr-2" />
                  下载答案PDF
                </Button>
                <Button onClick={handleDownloadQuestionsPDF} size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                  <Download className="h-4 w-4 mr-2" />
                  下载错题PDF
                </Button>
              </>}
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-6">
          {/* 学生信息卡片 */}
          {studentInfo && <StudentInfoCard studentInfo={studentInfo} />}

          {/* 错题列表 */}
          {isLoading ? <Card className="bg-white">
              <CardContent className="text-center py-8">
                <p className="text-gray-500">加载中...</p>
              </CardContent>
            </Card> : wrongQuestions.length === 0 ? <Card className="bg-white">
              <CardContent className="text-center py-8">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">暂无错题数据</p>
              </CardContent>
            </Card> : <div className="space-y-6">
              {wrongQuestions.map((item, index) => <WrongQuestionCard key={`${item.studentAnswerItem._id}-${index}`} item={item} index={index} />)}
            </div>}
        </div>
      </main>
    </div>;
}
