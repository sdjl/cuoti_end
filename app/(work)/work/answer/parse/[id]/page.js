"use client";

/**
 * AI分析学生答卷页面
 *
 * 显示某个学生的完整答卷数据，专注于AI分析功能：
 * - 学生基本信息
 * - 题目导航
 * - 单个错题的详细编辑界面
 */

// ==================== AI分析配置 ====================
import { ArrowLeft } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AIDiagnosisCard from "./components/AIDiagnosisCard.js";
import QuestionNavigation from "./components/QuestionNavigation.js";
import QuestionParseItem from "./components/QuestionParseItem.js";
import StudentInfoCard from "./components/StudentInfoCard.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { createMistakePoint, getMistakePointsBySubject } from "../../../../../../lib/collection/mistake.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { analyzeMistakeWithAI, deleteAIDiagnosis, generateAIDiagnosis, getStudentAnswerParseData, saveAllAnswerItems, saveAnswerItem, updateAIDiagnosis, updateAnalysisStatus } from "./actions.js";
export default function StudentAnswerParsePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const answerId = params.id;
  const studentAnswerItemId = searchParams.get("studentAnswerItemId");
  const {
    toast
  } = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [analyzingQuestions, setAnalyzingQuestions] = useState(new Set());
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(new Set());
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [allMistakePoints, setAllMistakePoints] = useState([]);
  const [aiRecommendedMistakePoints, setAiRecommendedMistakePoints] = useState({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  useEffect(() => {
    const loadData = async () => {
      if (!answerId) {
        setError("缺少答卷ID参数");
        setIsLoading(false);
        return;
      }
      try {
        const dataResult = await getStudentAnswerParseData(answerId);
        if (!dataResult.success || !dataResult.data) {
          setError(dataResult.error || "获取数据失败");
          return;
        }

        // 获取科目相关的错误归因
        const mistakePoints = await getMistakePointsBySubject(dataResult.data.course.subject);
        setData(dataResult.data);
        setAllMistakePoints(mistakePoints);

        // 如果URL中有studentAnswerItemId参数，则定位到该题目
        if (studentAnswerItemId && dataResult.data.answerItems.length > 0) {
          const itemIndex = dataResult.data.answerItems.findIndex(item => item._id === studentAnswerItemId);
          if (itemIndex >= 0) {
            setCurrentQuestionIndex(itemIndex);
          }
        }
      } catch (error) {
        console.error("加载答卷数据失败:", error);
        setError("加载数据失败");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [answerId, studentAnswerItemId]);

  // 键盘事件监听
  useEffect(() => {
    const handleKeyDown = event => {
      if (!data) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (currentQuestionIndex < data.answerItems.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentQuestionIndex, data]);
  const handleBack = () => {
    window.close();
  };
  const getQuestionNumber = questionId => {
    if (!data) return 0;
    const index = data.questionPack.questionIds.indexOf(questionId);
    return index >= 0 ? index + 1 : 0;
  };

  // 处理答案更新
  const handleAnswerUpdate = (itemId, newAnswer) => {
    // 预处理答案数组，确保数据一致性
    const processedAnswer = newAnswer.map(line => line.replace(/\\n/g, "\n").replace(/[；;]/g, "\n")).flatMap(line => line.split("\n"));
    setData(prev => {
      if (!prev) return null;
      const updatedItems = prev.answerItems.map(answerItem => answerItem._id === itemId ? {
        ...answerItem,
        answerValue: processedAnswer
      } : answerItem);
      return {
        ...prev,
        answerItems: updatedItems
      };
    });
  };

  // 处理解析更新
  const handleParseUpdate = (itemId, newParse) => {
    // 预处理解析数组，确保数据一致性
    const processedParse = newParse.map(line => line.replace(/\\n/g, "\n").replace(/[；;]/g, "\n")).flatMap(line => line.split("\n"));
    setData(prev => {
      if (!prev) return null;
      const updatedItems = prev.answerItems.map(answerItem => answerItem._id === itemId ? {
        ...answerItem,
        parse: processedParse
      } : answerItem);
      return {
        ...prev,
        answerItems: updatedItems
      };
    });
  };

  // 处理错误归因更新
  const handleMistakePointsUpdate = (itemId, mistakePointIds) => {
    setData(prev => {
      if (!prev) return null;
      const updatedItems = prev.answerItems.map(answerItem => answerItem._id === itemId ? {
        ...answerItem,
        mistakePointIds: mistakePointIds
      } : answerItem);
      return {
        ...prev,
        answerItems: updatedItems
      };
    });
  };

  // 处理新错误归因添加到列表
  const handleMistakePointAdded = newMistakePoint => {
    setAllMistakePoints(prev => [newMistakePoint, ...prev]);
  };

  // 处理创建新错误归因
  const handleCreateMistakePoint = async data => {
    try {
      const result = await createMistakePoint(data);
      return result;
    } catch (error) {
      console.error(`创建${DISPLAY_TEXT.ERROR_ATTRIBUTION}失败:`, error);
      return {
        success: false,
        error: `创建${DISPLAY_TEXT.ERROR_ATTRIBUTION}失败`
      };
    }
  };

  // 处理AI分析
  const handleAIAnalyze = async itemId => {
    if (!data) return;
    const currentItem = data.answerItems.find(item => item._id === itemId);
    if (!currentItem) {
      toast({
        variant: "destructive",
        title: "分析失败",
        description: "未找到题目数据"
      });
      return;
    }

    // 检查是否有学生答题图片
    if (!currentItem.imageUrl) {
      toast({
        variant: "destructive",
        title: "无法分析",
        description: "该题目没有学生答题图片，无法进行AI分析"
      });
      return;
    }

    // 检查是否正在分析
    if (analyzingQuestions.has(itemId)) {
      return;
    }
    try {
      setAnalyzingQuestions(prev => new Set(prev).add(itemId));
      toast({
        title: "开始分析",
        description: "AI正在分析学生的错题..."
      });
      const result = await analyzeMistakeWithAI(currentItem.imageUrl, data.questionPack.subject);
      if (result.success && result.answer && result.parse) {
        // 更新答案和解析
        handleAnswerUpdate(itemId, result.answer);
        handleParseUpdate(itemId, result.parse);

        // 如果AI推荐了错误归因，自动添加到界面中
        if (result.aiRecommendedMistakePointIds && result.aiRecommendedMistakePointIds.length > 0) {
          // 保存AI推荐的错误归因信息
          setAiRecommendedMistakePoints(prev => ({
            ...prev,
            [itemId]: result.aiRecommendedMistakePointIds
          }));

          // 获取当前已选择的错误归因
          const currentMistakePointIds = currentItem.mistakePointIds || [];

          // 合并AI推荐的错误归因（去重）
          const newMistakePointIds = [...new Set([...currentMistakePointIds, ...result.aiRecommendedMistakePointIds])];

          // 更新错误归因
          handleMistakePointsUpdate(itemId, newMistakePointIds);
          toast({
            title: "分析完成",
            description: `AI已完成错题分析并推荐了 ${result.aiRecommendedMistakePointIds.length} 个${DISPLAY_TEXT.ERROR_ATTRIBUTION}，请检查后保存`
          });
        } else {
          toast({
            title: "分析完成",
            description: "AI已完成错题分析，结果已更新到输入框中"
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "分析失败",
          description: result.error || "AI分析失败，请重试"
        });
      }
    } catch (error) {
      console.error("AI分析失败:", error);
      toast({
        variant: "destructive",
        title: "分析失败",
        description: "发生未知错误，请重试"
      });
    } finally {
      setAnalyzingQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // 处理单题保存
  const handleSave = async itemId => {
    if (!data) return;
    const currentItem = data.answerItems.find(item => item._id === itemId);
    if (!currentItem) {
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "未找到题目数据"
      });
      return;
    }

    // 检查是否正在保存
    if (savingQuestions.has(itemId)) {
      return;
    }
    try {
      setSavingQuestions(prev => new Set(prev).add(itemId));
      const result = await saveAnswerItem(itemId, currentItem.answerValue, currentItem.parse || [], currentItem.mistakePointIds, {
        questionId: currentItem.questionId,
        studentId: data.studentAnswer.studentId,
        classId: data.studentAnswer.classId,
        courseId: data.studentAnswer.courseId,
        questionPackId: data.studentAnswer.questionPackId,
        type: data.questionPack.type
      });
      if (result.success) {
        toast({
          title: "保存成功",
          description: "题目已保存"
        });
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: result.error || "保存失败，请重试"
        });
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "发生未知错误，请重试"
      });
    } finally {
      setSavingQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // 处理分析所有错题
  const handleAnalyzeAll = async () => {
    if (!data) return;

    // 找出需要分析的题目（答案或解析为空的题目）
    const needAnalysisItems = data.answerItems.filter(item => {
      const hasEmptyAnswer = item.answerValue.length === 0 || item.answerValue.every(answer => answer.trim() === "");
      const hasEmptyParse = !item.parse || item.parse.length === 0 || item.parse.every(line => line.trim() === "");
      return (hasEmptyAnswer || hasEmptyParse) && item.imageUrl; // 必须有图片才能分析
    });
    if (needAnalysisItems.length === 0) {
      toast({
        title: "无需分析",
        description: "所有题目的答案和解析都已完整，或缺少答题图片"
      });
      return;
    }
    if (isAnalyzingAll) {
      return;
    }
    try {
      setIsAnalyzingAll(true);
      toast({
        title: "开始批量分析",
        description: `准备分析 ${needAnalysisItems.length} 个题目`
      });
      let successCount = 0;
      let failCount = 0;
      for (let i = 0; i < needAnalysisItems.length; i++) {
        const item = needAnalysisItems[i];

        // 切换到当前题目
        const itemIndex = data.answerItems.findIndex(answerItem => answerItem._id === item._id);
        if (itemIndex >= 0) {
          setCurrentQuestionIndex(itemIndex);
        }
        try {
          // 分析当前题目
          await handleAIAnalyze(item._id);
          successCount++;

          // 添加延迟避免请求过快
          if (i < needAnalysisItems.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`分析题目 ${item._id} 失败:`, error);
          failCount++;
        }
      }

      // 显示完成结果
      if (successCount === needAnalysisItems.length) {
        toast({
          title: "批量分析完成",
          description: `成功分析了 ${successCount} 个题目`
        });
      } else {
        toast({
          variant: failCount > successCount ? "destructive" : "default",
          title: "批量分析完成",
          description: `成功 ${successCount} 个，失败 ${failCount} 个`
        });
      }
    } catch (error) {
      console.error("批量分析失败:", error);
      toast({
        variant: "destructive",
        title: "批量分析失败",
        description: "发生未知错误"
      });
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  // 处理保存所有错题
  const handleSaveAll = async () => {
    if (!data) return;
    if (isSavingAll) {
      return;
    }
    try {
      setIsSavingAll(true);
      toast({
        title: "开始保存",
        description: `准备保存 ${data.answerItems.length} 个题目`
      });
      const result = await saveAllAnswerItems(data.answerItems.map(item => ({
        _id: item._id,
        questionId: item.questionId,
        answerValue: item.answerValue,
        parse: item.parse || [],
        mistakePointIds: item.mistakePointIds
      })), {
        studentId: data.studentAnswer.studentId,
        classId: data.studentAnswer.classId,
        courseId: data.studentAnswer.courseId,
        questionPackId: data.studentAnswer.questionPackId,
        type: data.questionPack.type
      });
      if (result.success) {
        toast({
          title: "保存完成",
          description: `成功保存了 ${result.successCount} 个题目`
        });
      } else {
        const errorMsg = result.errors.length > 0 ? result.errors.slice(0, 3).join("; ") + (result.errors.length > 3 ? "..." : "") : "保存失败";
        toast({
          variant: "destructive",
          title: "保存失败",
          description: `成功 ${result.successCount} 个，失败 ${result.totalCount - result.successCount} 个。${errorMsg}`
        });
      }
    } catch (error) {
      console.error("保存所有错题失败:", error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "发生未知错误"
      });
    } finally {
      setIsSavingAll(false);
    }
  };

  // 处理分析完成状态切换
  const handleToggleAnalysisStatus = async () => {
    if (!data || isUpdatingStatus) return;
    try {
      setIsUpdatingStatus(true);
      const newStatus = !data.studentAnswer.isAnalysisCompleted;
      const result = await updateAnalysisStatus(data.studentAnswer._id, newStatus);
      if (result.success) {
        // 更新本地数据
        setData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            studentAnswer: {
              ...prev.studentAnswer,
              isAnalysisCompleted: newStatus
            }
          };
        });
        toast({
          title: "状态更新成功",
          description: newStatus ? "已标记为分析完成" : "已标记为未完成分析"
        });
      } else {
        toast({
          variant: "destructive",
          title: "状态更新失败",
          description: result.error || "更新失败，请重试"
        });
      }
    } catch (error) {
      console.error("更新分析状态失败:", error);
      toast({
        variant: "destructive",
        title: "状态更新失败",
        description: "发生未知错误"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 处理AI综合诊断
  const handleAIDiagnosis = async () => {
    if (!data) {
      return {
        success: false,
        error: "数据未加载"
      };
    }
    try {
      const result = await generateAIDiagnosis(data.studentAnswer._id);
      if (result.success && result.data) {
        // 更新本地数据
        setData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            studentAnswer: {
              ...prev.studentAnswer,
              aiDiagnosis: result.data
            }
          };
        });
      }
      return result;
    } catch (error) {
      console.error("AI诊断失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "AI诊断失败"
      };
    }
  };

  // 处理删除AI诊断
  const handleDeleteAIDiagnosis = async () => {
    if (!data) {
      return {
        success: false,
        error: "数据未加载"
      };
    }
    try {
      const result = await deleteAIDiagnosis(data.studentAnswer._id);
      if (result.success) {
        // 更新本地数据，清除AI诊断结果
        setData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            studentAnswer: {
              ...prev.studentAnswer,
              aiDiagnosis: undefined
            }
          };
        });
      }
      return result;
    } catch (error) {
      console.error("删除AI诊断失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "删除失败"
      };
    }
  };

  // 处理更新AI诊断
  const handleUpdateAIDiagnosis = async diagnosis => {
    if (!data) {
      return {
        success: false,
        error: "数据未加载"
      };
    }
    try {
      const result = await updateAIDiagnosis(data.studentAnswer._id, diagnosis);
      if (result.success) {
        // 更新本地数据
        setData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            studentAnswer: {
              ...prev.studentAnswer,
              aiDiagnosis: diagnosis
            }
          };
        });
      }
      return result;
    } catch (error) {
      console.error("更新AI诊断失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "更新失败"
      };
    }
  };
  if (isLoading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="AI分析答卷" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">正在加载答卷数据...</div>
        </main>
      </div>;
  }
  if (error || !data) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="AI分析答卷" />
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
  const currentItem = data.answerItems[currentQuestionIndex];
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title="AI分析答卷" rightContent={<div className="flex items-center gap-2">
            <Button onClick={handleBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              关闭窗口
            </Button>
          </div>} />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-6xl space-y-6">
          {/* 基本信息卡片 */}
          <StudentInfoCard student={data.student} classRoom={data.classRoom} course={data.course} questionPack={data.questionPack} studentAnswer={data.studentAnswer} />

          {/* AI诊断和操作面板 */}
          <AIDiagnosisCard studentAnswer={data.studentAnswer} isAnalyzingAll={isAnalyzingAll} isSavingAll={isSavingAll} isUpdatingStatus={isUpdatingStatus} onAnalyzeAll={handleAnalyzeAll} onSaveAll={handleSaveAll} onToggleAnalysisStatus={handleToggleAnalysisStatus} onAIDiagnosis={handleAIDiagnosis} onDeleteAIDiagnosis={handleDeleteAIDiagnosis} onUpdateAIDiagnosis={handleUpdateAIDiagnosis} />

          {/* 题目导航 */}
          <QuestionNavigation answerItems={data.answerItems} questionPack={data.questionPack} currentIndex={currentQuestionIndex} onQuestionSelect={setCurrentQuestionIndex} />

          {/* 当前题目详情 */}
          {currentItem ? <QuestionParseItem answerItem={currentItem} questionNumber={getQuestionNumber(currentItem.questionId)} isAnalyzing={analyzingQuestions.has(currentItem._id)} isSaving={savingQuestions.has(currentItem._id)} allMistakePoints={allMistakePoints} subject={data.course.subject} aiRecommendedMistakePointIds={aiRecommendedMistakePoints[currentItem._id] || []} onAnswerUpdate={newAnswer => handleAnswerUpdate(currentItem._id, newAnswer)} onParseUpdate={newParse => handleParseUpdate(currentItem._id, newParse)} onMistakePointsUpdate={mistakePointIds => handleMistakePointsUpdate(currentItem._id, mistakePointIds)} onMistakePointAdded={handleMistakePointAdded} onCreateMistakePoint={handleCreateMistakePoint} onAIAnalyze={() => handleAIAnalyze(currentItem._id)} onSave={() => handleSave(currentItem._id)} /> : <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">该学生没有错题记录</p>
              </CardContent>
            </Card>}
        </div>
      </main>
    </div>;
}
