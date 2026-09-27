"use client";

import { useParams, useRouter } from "next/navigation";
// 提交答卷页面，用于学生提交定制题集的答卷（选择错题、上传图片、设置错误归因等）
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../../../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../../../../../lib/config/constants.js";
import { getExistingAnswerData, getSubmitData, saveStudentAnswerAction } from "./actions.js";
import { convertQuestionIdsToNumbers, convertQuestionNumbersToIds, getQuestionNumberById } from "./clientUtils.js";
import ImageUploader from "./components/ImageUploader.js";
import MistakePointSelector from "./components/MistakePointSelector.js";
import QuestionSelector from "./components/QuestionSelector.js";
import { deleteWrongQuestionImage, uploadWrongQuestionImage } from "./imageActions.js";
export default function SubmitAnswerPage() {
  const params = useParams();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const classRoomId = params.classRoomId;
  const studentsId = params.studentsId;
  const packId = params.packId;
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [questionPack, setQuestionPack] = useState(null);
  const [mistakePoints, setMistakePoints] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [selectedQuestionNumbers, setSelectedQuestionNumbers] = useState([]);
  const [activeQuestionNumber, setActiveQuestionNumber] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mistakePointsTitleRef = useRef(null);

  // 加载已有答卷数据
  const loadExistingAnswers = useCallback(async (studentId, classRoomId, questionPackId, questionIds) => {
    try {
      const result = await getExistingAnswerData(studentId, classRoomId, questionPackId);
      if (result.success && result.data && result.data.hasExistingData) {
        // 将已有数据设置到状态中
        setWrongQuestions(result.data.wrongQuestions);

        // 转换为题目序号
        const questionNumbers = convertQuestionIdsToNumbers(result.data.wrongQuestions, questionIds);
        setSelectedQuestionNumbers(questionNumbers);

        // 自动设置第一个错题为活跃状态，这样用户可以立即看到错误归因
        if (questionNumbers.length > 0) {
          setActiveQuestionNumber(questionNumbers[0]);
        }
        toast({
          title: "加载成功",
          description: "已加载学生的历史答卷数据"
        });
      }
    } catch (error) {
      console.error("加载已有答卷数据失败:", error);
      toast({
        variant: "destructive",
        title: "加载已有数据失败",
        description: "将使用空白答卷"
      });
    }
  }, [toast]);

  // 加载页面数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getSubmitData(studentsId, classRoomId, packId);
        if (result.success && result.data) {
          setStudent(result.data.student);
          setClassroom(result.data.classroom);
          setQuestionPack(result.data.questionPack);
          setMistakePoints(result.data.mistakePoints);
          setQuestions(result.data.questions);
          setError(null);

          // 加载已有答卷数据
          loadExistingAnswers(studentsId, classRoomId, packId, result.data.questionPack.questionIds);
        } else {
          setError(result.error || "获取页面数据失败");
        }
      } catch (error) {
        console.error("获取页面数据失败:", error);
        setError("获取页面数据失败");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentsId, classRoomId, packId, loadExistingAnswers]);
  const handleBack = () => {
    router.push(`/work/create-pack/knowledge/${classRoomId}/${studentsId}/list`);
  };
  const handleQuestionsChange = questionNumbers => {
    setSelectedQuestionNumbers(questionNumbers);
    if (!questionPack) return;

    // 将题目序号转换为题目ID，并更新错题数据
    const newWrongQuestions = convertQuestionNumbersToIds(questionNumbers, questionPack.questionIds, wrongQuestions);
    setWrongQuestions(newWrongQuestions);

    // 如果当前活跃的题目不在选择的题目中，清除活跃状态
    if (activeQuestionNumber && !questionNumbers.includes(activeQuestionNumber)) {
      setActiveQuestionNumber(null);
    }
  };
  const handleMistakePointsChange = (questionNumber, mistakePointIds) => {
    if (!questionPack) return;
    const questionId = questionPack.questionIds[questionNumber - 1];
    setWrongQuestions(prev => prev.map(q => q.questionId === questionId ? {
      ...q,
      mistakePointIds
    } : q));
  };

  // 处理图片上传
  const handleImageUpload = async (questionId, imageData) => {
    try {
      const result = await uploadWrongQuestionImage(studentsId, classRoomId, "",
      // 定制题集courseId为空
      packId, questionId, imageData.base64, imageData.mimeType);
      if (result.success && result.data) {
        // 更新本地状态
        setWrongQuestions(prev => prev.map(q => q.questionId === questionId ? {
          ...q,
          imagePath: result.data.imagePath,
          imageUrl: result.data.imageUrl,
          imageFileID: result.data.imageFileID
        } : q));
        return {
          success: true,
          imageUrl: result.data.imageUrl,
          imageFileID: result.data.imageFileID
        };
      } else {
        toast({
          variant: "destructive",
          title: "上传失败",
          description: result.error || "请稍后重试"
        });
        return {
          success: false,
          error: result.error || "上传失败"
        };
      }
    } catch (error) {
      console.error("上传图片失败:", error);
      toast({
        variant: "destructive",
        title: "上传失败",
        description: "请稍后重试"
      });
      return {
        success: false,
        error: "上传失败，请稍后重试"
      };
    }
  };

  // 处理图片删除
  const handleImageDelete = async (questionId, imageFileID) => {
    try {
      const result = await deleteWrongQuestionImage(imageFileID);
      if (result.success) {
        // 更新本地状态
        setWrongQuestions(prev => prev.map(q => q.questionId === questionId ? {
          ...q,
          imagePath: undefined,
          imageUrl: undefined,
          imageFileID: undefined
        } : q));
        return {
          success: true
        };
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: result.error || "请稍后重试"
        });
        return {
          success: false,
          error: result.error || "删除失败"
        };
      }
    } catch (error) {
      console.error("删除图片失败:", error);
      toast({
        variant: "destructive",
        title: "删除失败",
        description: "请稍后重试"
      });
      return {
        success: false,
        error: "删除失败，请稍后重试"
      };
    }
  };
  const handleSave = async () => {
    if (!student || !questionPack || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await saveStudentAnswerAction(studentsId, classRoomId, packId, wrongQuestions);
      if (result.success) {
        toast({
          title: "提交成功",
          description: `${student.name}的答卷数据已保存`
        });

        // 返回题集列表页面
        router.push(`/work/create-pack/knowledge/${classRoomId}/${studentsId}/list`);
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: result.error || "请稍后重试"
        });
      }
    } catch (error) {
      console.error("保存答卷失败:", error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "请稍后重试"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (error) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="提交答卷" showBackButton={true} backHref={`/work/create-pack/knowledge/${classRoomId}/${studentsId}/list`} backText="返回题集列表" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-red-600 text-lg font-medium">加载失败</div>
            <p className="text-gray-600">{error}</p>
            <Button onClick={handleBack} variant="outline">
              返回题集列表
            </Button>
          </div>
        </main>
      </div>;
  }
  if (loading || !student || !questionPack) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="提交答卷" showBackButton={true} backHref={`/work/create-pack/knowledge/${classRoomId}/${studentsId}/list`} backText="返回题集列表" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">正在加载数据...</div>
        </main>
      </div>;
  }
  const activeQuestion = wrongQuestions.find(q => {
    if (!activeQuestionNumber) return false;
    const questionId = questionPack.questionIds[activeQuestionNumber - 1];
    return q.questionId === questionId;
  });
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title={`${student.name} - 提交答卷`} showBackButton={true} backHref={`/work/create-pack/${classRoomId}/${studentsId}/list`} backText="返回题集列表" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-5xl">
          {/* 题集信息 */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {questionPack.name}
                </h2>
                <div className="text-sm text-gray-600">
                  学生：{student.name} ({student.studentCode}) | 班级：
                  {classroom?.name} | 科目：{questionPack.subject} | 题目数量：
                  {questionPack.questionIds.length} 道
                </div>
              </div>
            </div>
          </div>

          {/* 题目选择 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <QuestionSelector questionCount={questionPack.questionIds.length} selectedQuestions={selectedQuestionNumbers} onQuestionsChange={handleQuestionsChange} questionData={questions.map(q => ({
            _id: q._id,
            imageUrl: q.imageUrl,
            imageFileID: q.imageFileID,
            imageHeight: q.imageHeight,
            imageWidth: q.imageWidth,
            questionText: q.questionText
          }))} />
          </div>

          {/* 错题列表和错误归因选择 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              <h4 ref={mistakePointsTitleRef} className="font-medium text-gray-900">
                为错题设置{DISPLAY_TEXT.ERROR_ATTRIBUTION}
              </h4>

              {wrongQuestions.length === 0 ? <div className="text-center text-gray-500 py-8">
                  请先选择错题
                </div> : <>
                  <div className="flex flex-wrap gap-2">
                    {wrongQuestions.slice().sort((a, b) => {
                  const numberA = getQuestionNumberById(questionPack.questionIds, a.questionId);
                  const numberB = getQuestionNumberById(questionPack.questionIds, b.questionId);
                  return numberA - numberB;
                }).map(question => {
                  const questionNumber = getQuestionNumberById(questionPack.questionIds, question.questionId);
                  const hasImage = !!question.imageUrl;
                  const hasErrorPoints = question.mistakePointIds.length > 0;
                  return <Button key={question.questionId} variant={activeQuestionNumber === questionNumber ? "default" : "outline"} size="sm" className="relative min-w-[60px]" onClick={() => setActiveQuestionNumber(questionNumber)}>
                            第{questionNumber}题{/* 显示状态指示器 */}
                            <div className="absolute -top-1 -right-1 flex space-x-1">
                              {hasImage && <span className="w-2 h-2 bg-blue-500 rounded-full" title="已上传图片"></span>}
                              {hasErrorPoints && <span className="w-2 h-2 bg-green-500 rounded-full" title={`已设置${DISPLAY_TEXT.ERROR_ATTRIBUTION}`}></span>}
                            </div>
                          </Button>;
                })}
                  </div>

                  {/* 错误归因选择区域 */}
                  <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px]">
                    {activeQuestionNumber && activeQuestion ? <div className="space-y-6">
                        <div className="text-lg font-medium text-gray-800 mb-4">
                          第{activeQuestionNumber}题
                        </div>

                        {/* 图片上传区域 */}
                        <div>
                          <ImageUploader questionId={activeQuestion.questionId} initialImageUrl={activeQuestion.imageUrl} initialImageFileID={activeQuestion.imageFileID} onImageUpload={handleImageUpload} onImageDelete={imageFileID => handleImageDelete(activeQuestion.questionId, imageFileID)} />
                        </div>

                        {/* 错误归因选择区域 */}
                        <div>
                          <MistakePointSelector mistakePoints={mistakePoints} selectedMistakePointIds={activeQuestion.mistakePointIds} onMistakePointsChange={mistakePointIds => handleMistakePointsChange(activeQuestionNumber, mistakePointIds)} />
                        </div>
                      </div> : <div className="text-center text-gray-500 py-8">
                        请点击上方的错题序号来选择
                        {DISPLAY_TEXT.ERROR_ATTRIBUTION}
                      </div>}
                  </div>
                </>}
            </div>
          </div>

          {/* 底部操作按钮 */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              已选择 {wrongQuestions.length} 道错题，其中{" "}
              {wrongQuestions.filter(q => !!q.imageUrl).length} 道已上传图片，{" "}
              {wrongQuestions.filter(q => q.mistakePointIds.length > 0).length}{" "}
              道已设置{DISPLAY_TEXT.ERROR_ATTRIBUTION}
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "提交答卷"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>;
}
