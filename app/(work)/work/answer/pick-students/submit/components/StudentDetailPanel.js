"use client";

/**
 * 学生详情面板组件（模态框）
 *
 * 为单个学生录入错题和错误归因的主要界面：
 * - 显示学生基本信息（姓名、学号）
 * - 集成题目选择器，让老师勾选错题
 * - 集成错误归因选择器，为错题选择错误归因
 * - 提供保存和取消操作
 * - 支持数据变更检测和确认放弃修改
 */
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
import { convertQuestionIdsToNumbers, convertQuestionNumbersToIds, getQuestionNumberById } from "../clientActions.js";
import { deleteWrongQuestionImage, uploadWrongQuestionImage } from "../imageActions.js";
import ImageUploader from "./ImageUploader.js";
import MistakePointSelector from "./MistakePointSelector.js";
import QuestionSelector from "./QuestionSelector.js";
export default function StudentDetailPanel({
  student,
  questionIds,
  mistakePoints,
  initialWrongQuestions,
  questionData = [],
  sessionParams,
  isSubmitting = false,
  onClose,
  onSave
}) {
  const {
    toast
  } = useToast();
  const [wrongQuestions, setWrongQuestions] = useState(initialWrongQuestions);
  const [selectedQuestionNumbers, setSelectedQuestionNumbers] = useState(convertQuestionIdsToNumbers(initialWrongQuestions, questionIds));
  const [activeQuestionNumber, setActiveQuestionNumber] = useState(null);
  const mistakePointsTitleRef = useRef(null);
  useEffect(() => {
    setWrongQuestions(initialWrongQuestions);
    setSelectedQuestionNumbers(convertQuestionIdsToNumbers(initialWrongQuestions, questionIds));
  }, [initialWrongQuestions, questionIds]);

  // 检测数据是否有变更
  const hasChanges = useMemo(() => {
    // 比较当前数据和初始数据
    if (wrongQuestions.length !== initialWrongQuestions.length) {
      return true;
    }

    // 排序后比较
    const currentSorted = [...wrongQuestions].sort((a, b) => a.questionId.localeCompare(b.questionId));
    const initialSorted = [...initialWrongQuestions].sort((a, b) => a.questionId.localeCompare(b.questionId));
    for (let i = 0; i < currentSorted.length; i++) {
      const current = currentSorted[i];
      const initial = initialSorted[i];
      if (current.questionId !== initial.questionId) {
        return true;
      }

      // 比较错误归因
      const currentMistakeIds = [...current.mistakePointIds].sort();
      const initialMistakeIds = [...initial.mistakePointIds].sort();
      if (currentMistakeIds.length !== initialMistakeIds.length) {
        return true;
      }
      for (let j = 0; j < currentMistakeIds.length; j++) {
        if (currentMistakeIds[j] !== initialMistakeIds[j]) {
          return true;
        }
      }

      // 比较图片信息
      if (current.imageUrl !== initial.imageUrl || current.imageFileID !== initial.imageFileID || current.imagePath !== initial.imagePath) {
        return true;
      }
    }
    return false;
  }, [wrongQuestions, initialWrongQuestions]);
  const handleQuestionsChange = questionNumbers => {
    setSelectedQuestionNumbers(questionNumbers);

    // 将题目序号转换为题目ID，并更新错题数据
    const newWrongQuestions = convertQuestionNumbersToIds(questionNumbers, questionIds, wrongQuestions);
    setWrongQuestions(newWrongQuestions);

    // 如果当前活跃的题目不在选择的题目中，清除活跃状态
    if (activeQuestionNumber && !questionNumbers.includes(activeQuestionNumber)) {
      setActiveQuestionNumber(null);
    }
  };
  const handleMistakePointsChange = (questionNumber, mistakePointIds) => {
    const questionId = questionIds[questionNumber - 1];
    setWrongQuestions(prev => prev.map(q => q.questionId === questionId ? {
      ...q,
      mistakePointIds
    } : q));
  };

  // 处理图片上传
  const handleImageUpload = async (questionId, imageData) => {
    try {
      const result = await uploadWrongQuestionImage(student._id, sessionParams.classId, sessionParams.courseId, sessionParams.questionPackId, questionId, imageData.base64, imageData.mimeType);
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
  const handleSave = () => {
    onSave(wrongQuestions);
  };
  const handleClose = () => {
    if (hasChanges) {
      // 有变更时确认是否放弃
      if (window.confirm("您有未保存的修改，确定要放弃这些修改吗？")) {
        onClose();
      }
    } else {
      // 无变更直接关闭
      onClose();
    }
  };
  const activeQuestion = wrongQuestions.find(q => {
    if (!activeQuestionNumber) return false;
    const questionId = questionIds[activeQuestionNumber - 1];
    return q.questionId === questionId;
  });
  const getMistakePointsTitlePosition = () => {
    if (mistakePointsTitleRef.current) {
      const rect = mistakePointsTitleRef.current.getBoundingClientRect();
      return rect.top + window.scrollY;
    }
    return 200; // 默认值
  };
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* 头部 - 固定高度 */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {student.name} ({student.studentCode})
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 内容区域 - 可滚动，固定高度 */}
        <div className="flex-1 overflow-y-auto p-4" style={{
        minHeight: "500px",
        maxHeight: "calc(90vh - 140px)"
      }}>
          <div className="space-y-6">
            {/* 题目选择 */}
            <div>
              <QuestionSelector questionCount={questionIds.length} selectedQuestions={selectedQuestionNumbers} onQuestionsChange={handleQuestionsChange} questionData={questionData} getMistakePointsTitlePosition={getMistakePointsTitlePosition} />
            </div>

            {/* 错题列表和图片上传/错误归因选择 - 始终显示，避免跳动 */}
            <div className="space-y-4 min-h-[300px]">
              <h4 ref={mistakePointsTitleRef} className="font-medium text-gray-900">
                为错题上传图片与设置{DISPLAY_TEXT.ERROR_ATTRIBUTION}
              </h4>

              {wrongQuestions.length === 0 ? <div className="text-center text-gray-500 py-8">
                  请先选择错题
                </div> : <>
                  <div className="flex flex-wrap gap-2">
                    {wrongQuestions.slice() // 创建副本避免修改原数组
                .sort((a, b) => {
                  // 按照题目序号排序
                  const numberA = getQuestionNumberById(questionIds, a.questionId);
                  const numberB = getQuestionNumberById(questionIds, b.questionId);
                  return numberA - numberB;
                }).map(question => {
                  const questionNumber = getQuestionNumberById(questionIds, question.questionId);
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

                  {/* 图片上传和错误归因选择区域 - 固定高度，避免跳动 */}
                  <div className="border rounded-lg p-4 bg-gray-50 min-h-[500px]">
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
                        请点击上方的错题序号来上传图片和选择
                        {DISPLAY_TEXT.ERROR_ATTRIBUTION}
                      </div>}
                  </div>
                </>}
            </div>
          </div>
        </div>

        {/* 底部操作按钮 - 固定高度 */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-gray-600">
            已选择 {wrongQuestions.length} 道错题，其中{" "}
            {wrongQuestions.filter(q => !!q.imageUrl).length} 道已上传图片，{" "}
            {wrongQuestions.filter(q => q.mistakePointIds.length > 0).length}{" "}
            道已设置{DISPLAY_TEXT.ERROR_ATTRIBUTION}
            {hasChanges && <span className="text-orange-600 ml-2">• 有未保存的修改</span>}
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "提交中..." : "提交答卷"}
            </Button>
          </div>
        </div>
      </div>
    </div>;
}
