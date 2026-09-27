"use client";

/**
 * 学生答卷查看页面
 *
 * 显示某个学生的完整答卷数据：
 * - 学生基本信息
 * - 题集信息
 * - 错题列表及对应的错误归因
 * - 只读模式，不提供编辑功能
 */
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { getStudentAnswerViewData } from "./actions.js";
import AIDiagnosisCard from "./components/AIDiagnosisCard.js";
import QuestionPackInfoCard from "./components/QuestionPackInfoCard.js";
import StudentInfoCard from "./components/StudentInfoCard.js";
import WrongQuestionItem from "./components/WrongQuestionItem.js";
import { generateStudentAnswerReport } from "./pdfReport.js";
export default function StudentAnswerViewPage() {
  const params = useParams();
  const studentAnswerId = params.id;
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  useEffect(() => {
    const loadData = async () => {
      if (!studentAnswerId) {
        setError("缺少答卷ID参数");
        setIsLoading(false);
        return;
      }
      try {
        const result = await getStudentAnswerViewData(studentAnswerId);
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "加载数据失败");
        }
      } catch (error) {
        console.error("加载答卷数据失败:", error);
        setError("加载数据失败");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [studentAnswerId]);
  const handleBack = () => {
    window.close();
  };
  const handleDownloadReport = async () => {
    if (!data) {
      return;
    }
    setIsGeneratingReport(true);
    try {
      const result = await generateStudentAnswerReport(data);
      if (result.success && result.pdfBase64 && result.filename) {
        // 创建下载链接
        const byteCharacters = atob(result.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "text/html"
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename.replace(".pdf", ".html"); // 暂时下载为HTML
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert(result.error || "生成报告失败");
      }
    } catch (error) {
      console.error("下载报告失败:", error);
      alert("下载报告失败");
    } finally {
      setIsGeneratingReport(false);
    }
  };
  const getQuestionNumber = questionId => {
    if (!data) return 0;
    const index = data.questionPack.questionIds.indexOf(questionId);
    return index >= 0 ? index + 1 : 0;
  };
  if (isLoading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="查看答卷" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">正在加载答卷数据...</div>
        </main>
      </div>;
  }
  if (error || !data) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="查看答卷" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-red-600 text-lg font-medium">加载失败</div>
            <p className="text-gray-600">{error}</p>
            <Button onClick={handleBack} variant="outline">
              关闭窗口
            </Button>
          </div>
        </main>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title="查看答卷" rightContent={<div className="flex items-center gap-2">
            <Button onClick={handleBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              关闭窗口
            </Button>
            <Button onClick={handleDownloadReport} variant="default" size="sm" disabled={isGeneratingReport}>
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingReport ? "生成中..." : "下载报告"}
            </Button>
          </div>} />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-4xl space-y-6">
          {/* 基本信息卡片 */}
          <StudentInfoCard student={data.student} classRoom={data.classRoom} course={data.course} studentAnswer={data.studentAnswer} />

          {/* 题集信息卡片 */}
          <QuestionPackInfoCard questionPack={data.questionPack} errorCount={data.answerItems.length} />

          {/* AI综合诊断 */}
          <AIDiagnosisCard aiDiagnosis={data.studentAnswer.aiDiagnosis} />

          {/* 错题详情 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                错题详情
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.answerItems.length === 0 ? <div className="text-center py-8 text-gray-500">
                  该学生没有错题记录
                </div> : <div className="space-y-4">
                  {data.answerItems.map(item => <WrongQuestionItem key={item._id} item={item} questionNumber={getQuestionNumber(item.questionId)} />)}
                </div>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>;
}
