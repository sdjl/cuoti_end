"use client";

import { AlertTriangle, BookOpen, Bot, CheckCircle, Edit, FileText, ImageIcon, MessageSquare, RotateCcw, TrendingUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
// 错题详情卡片组件，显示题目的完整信息、学生答案、解析和错误归因等
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { getBatchQuestionMistakePoints, getMistakePointsForSubject, updateQuestionMistakePoints } from "../actions.js";
import MistakePointEditModal from "./MistakePointEditModal.js";
export default function QuestionDetailCard({
  question,
  classCorrectRate,
  questionIndex,
  studentAnswerImage,
  isCorrectedByMistakeAgain,
  redoImage,
  showRedoButton = false,
  answerItemId,
  onRedoClick,
  canEditMistakePoints = false,
  studentId,
  classId,
  courseId,
  questionPackId,
  type,
  subject,
  maxMistakePoints = 3
}) {
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [isRedoImageFullscreen, setIsRedoImageFullscreen] = useState(false);
  const [isParseExpanded, setIsParseExpanded] = useState(false);
  const [showMistakePointModal, setShowMistakePointModal] = useState(false);
  const [allMistakePoints, setAllMistakePoints] = useState([]);
  const [selectedMistakePointIds, setSelectedMistakePointIds] = useState([]);
  const [mistakePointsMap, setMistakePointsMap] = useState(new Map());
  const {
    toast
  } = useToast();

  // 加载错误归因数据
  useEffect(() => {
    const loadMistakePoints = async () => {
      if (!subject) return;
      try {
        // 获取所有错误归因（用于编辑时的选项列表）
        if (canEditMistakePoints) {
          const points = await getMistakePointsForSubject(subject);
          setAllMistakePoints(points);

          // 创建错误归因映射
          const map = new Map();
          points.forEach(point => {
            map.set(point._id, point);
          });
          setMistakePointsMap(map);
        }

        // 批量获取当前题目的错误归因（总是获取，用于显示）
        if (studentId && classId && courseId !== undefined) {
          const mistakePointsMap = await getBatchQuestionMistakePoints([question._id], studentId, classId, courseId);
          const currentIds = mistakePointsMap.get(question._id) || [];
          setSelectedMistakePointIds(currentIds);

          // 如果有选中的错误归因，但还没有加载映射，则加载
          if (currentIds.length > 0 && !canEditMistakePoints) {
            const points = await getMistakePointsForSubject(subject);
            const map = new Map();
            points.forEach(point => {
              map.set(point._id, point);
            });
            setMistakePointsMap(map);
          }
        }
      } catch (error) {
        console.error("加载错误归因失败:", error);
      }
    };
    loadMistakePoints();
  }, [canEditMistakePoints, subject, question._id, studentId, classId, courseId]);

  // 打开编辑模态框
  const handleOpenEditModal = () => {
    setShowMistakePointModal(true);
  };

  // 保存错误归因
  const handleSaveMistakePoints = async newSelectedIds => {
    console.log("保存错误归因 - 参数:", {
      studentId,
      classId,
      courseId,
      questionPackId,
      type,
      subject
    });

    // 注意：courseId 可以为 null，但不能为 undefined
    if (!studentId || !classId || courseId === undefined || !questionPackId || !type) {
      console.error("保存错误归因参数检查失败:", {
        studentId,
        classId,
        courseId,
        questionPackId,
        type
      });
      toast({
        title: "保存失败",
        description: "缺少必要的参数",
        variant: "destructive"
      });
      return {
        success: false,
        message: "缺少必要的参数"
      };
    }
    const result = await updateQuestionMistakePoints(question._id, studentId, classId, courseId, questionPackId, type, newSelectedIds);
    if (result.success) {
      setSelectedMistakePointIds(newSelectedIds);
    }
    return result;
  };

  // 格式化答案显示
  const formatAnswer = answer => {
    if (!answer || answer.length === 0) return "";

    // 判断是否为选择题：如果答案只包含单个字母（A、B、C、D等），则认为是选择题
    const isMultipleChoice = answer.every(ans => /^[A-Z]$/.test(ans.trim()) || /^[ABCDEFGH]$/.test(ans.trim()));
    if (isMultipleChoice) {
      // 选择题使用中文顿号分隔
      return answer.join("、");
    } else {
      // 非选择题使用中文分号分隔
      return answer.join("；");
    }
  };

  // 格式化解析显示
  const formatParse = parse => {
    if (!parse || parse.length === 0) return "";
    return parse.join("；");
  };

  // 检查解析内容是否过长（超过200个字符）
  const isParseContentLong = parse => {
    if (!parse || parse.length === 0) return false;
    const fullText = formatParse(parse);
    return fullText.length > 200;
  };

  // 获取截断的解析内容
  const getTruncatedParse = parse => {
    if (!parse || parse.length === 0) return "";
    const fullText = formatParse(parse);
    if (fullText.length <= 200) return fullText;
    return `${fullText.substring(0, 200)}...`;
  };

  // 处理图片点击
  const handleImageClick = () => {
    setIsImageFullscreen(true);
  };

  // 处理重做图片点击
  const handleRedoImageClick = () => {
    setIsRedoImageFullscreen(true);
  };

  // 关闭全屏图片
  const closeFullscreen = () => {
    setIsImageFullscreen(false);
  };

  // 关闭重做图片全屏
  const closeRedoImageFullscreen = () => {
    setIsRedoImageFullscreen(false);
  };

  // 获取要显示的图片信息
  const getDisplayImage = () => {
    // 优先显示学生答卷图片
    if (studentAnswerImage?.imageUrl) {
      return {
        url: studentAnswerImage.imageUrl,
        alt: "学生答卷图片",
        title: "学生答卷",
        isStudentAnswer: true
      };
    }

    // 如果没有学生答卷图片，显示题目原图
    if (question.imageUrl) {
      return {
        url: question.imageUrl,
        alt: "题目图片",
        title: "题目原图",
        isStudentAnswer: false
      };
    }
    return null;
  };
  const displayImage = getDisplayImage();
  return <>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              错题详情-{questionIndex}
            </div>
            {isCorrectedByMistakeAgain && <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                <CheckCircle className="w-3 h-3" />
                已再练通过
              </div>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 题目原图 */}
          {displayImage && <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-800">题目原图</h3>
                <div className="flex-1 h-px bg-gray-200"></div>
                {displayImage.isStudentAnswer && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    学生作答
                  </span>}
              </div>
              <div className="bg-gray-100 rounded-lg border border-gray-300 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={handleImageClick}>
                <BaseImage src={displayImage.url} alt={displayImage.alt} title={displayImage.title} width={question.imageWidth || 400} height={question.imageHeight || 300} className="w-full h-auto" />
              </div>
            </div>}

          {/* 学生重做图片 */}
          {redoImage?.redoImageUrl && <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <RotateCcw className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-800">学生重做图片</h3>
                <div className="flex-1 h-px bg-green-200"></div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  重新解答
                </span>
              </div>
              <div className="bg-green-50 rounded-lg border border-green-300 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={handleRedoImageClick}>
                <BaseImage src={redoImage.redoImageUrl} alt="学生重做图片" title="学生重做图片" width={400} height={300} className="w-full h-auto" />
              </div>
            </div>}

          {/* 知识点 */}
          {question.knowledgePoints && question.knowledgePoints.length > 0 && <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-gray-800">涉及知识点</h3>
                <div className="flex-1 h-px bg-blue-200"></div>
                <span className="text-sm text-blue-600 font-medium">
                  {question.knowledgePoints.length}个
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {question.knowledgePoints.map((point, index) => <div key={index} className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium text-center shadow-lg flex-shrink-0">
                    {point}
                  </div>)}
              </div>
            </div>}

          {/* 正确答案 */}
          {(question.answerImage?.imageUrl || question.answer && question.answer.length > 0) && <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-gray-800">正确答案</h3>
                <div className="flex-1 h-px bg-emerald-200"></div>
              </div>
              {question.answerImage?.imageUrl ? <div className="bg-emerald-50 border border-emerald-200 rounded-lg overflow-hidden">
                  <BaseImage src={question.answerImage.imageUrl} alt="答案图片" title="答案图片" width={400} height={300} className="w-full h-auto" />
                </div> : <div className="bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg">
                  <p className="text-sm text-emerald-700 leading-relaxed">
                    {formatAnswer(question.answer)}
                  </p>
                </div>}
            </div>}

          {/* 作答解析 */}
          {(question.parseImage?.imageUrl || question.parse && question.parse.length > 0) && <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-gray-800">作答解析</h3>
                <div className="flex-1 h-px bg-purple-200"></div>
              </div>
              {question.parseImage?.imageUrl ? <div className="bg-purple-50 border border-purple-200 rounded-lg overflow-hidden">
                  <BaseImage src={question.parseImage.imageUrl} alt="解析图片" title="解析图片" width={400} height={300} className="w-full h-auto" />
                </div> : <div className="bg-purple-50 border border-purple-200 px-4 py-3 rounded-lg">
                  <p className="text-sm text-purple-700 leading-relaxed break-words whitespace-pre-wrap">
                    {isParseExpanded ? formatParse(question.parse) : getTruncatedParse(question.parse)}
                  </p>
                  {isParseContentLong(question.parse) && <button onClick={() => setIsParseExpanded(!isParseExpanded)} className="mt-2 text-xs text-purple-600 hover:text-purple-800 underline font-medium">
                      {isParseExpanded ? "收起内容" : "显示更多内容"}
                    </button>}
                </div>}
            </div>}

          {/* 班级表现 */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="font-bold text-gray-800">班级表现</h3>
              <div className="flex-1 h-px bg-green-200"></div>
              <span className="text-sm text-green-600 font-medium">
                {classCorrectRate}%
              </span>
            </div>
            <div className="bg-green-100 border border-green-300 px-4 py-3 rounded-lg flex items-center justify-between">
              <span className="text-green-800 font-medium text-sm">
                班级正确率
              </span>
              <div className="text-right">
                <div className="text-lg font-bold text-green-700">
                  {classCorrectRate}%
                </div>
                <div className="text-xs text-green-600">班级统计结果</div>
              </div>
            </div>
          </div>

          {/* 本题容易犯错细节 */}
          {question.easyToMistakeDetail && question.easyToMistakeDetail.length > 0 && <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-gray-800">本题容易犯错细节</h3>
                  <div className="flex-1 h-px bg-red-200"></div>
                  <span className="text-sm text-red-600 font-medium">
                    {question.easyToMistakeDetail.length}个
                  </span>
                </div>
                <div className="space-y-2">
                  {question.easyToMistakeDetail.map((mistake, index) => <div key={index} className="bg-red-100 border border-red-300 px-4 py-3 rounded-lg">
                      <p className="text-sm text-red-700">{mistake}</p>
                    </div>)}
                </div>
              </div>}

          {/* 错误归因区域 - 总是显示 */}
          {subject && <div className="relative mt-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-gray-800">错误归因</h3>
                <div className="flex-1 h-px bg-purple-200"></div>
                {selectedMistakePointIds.length > 0 && <span className="text-sm text-purple-600 font-medium">
                    {selectedMistakePointIds.length}个
                  </span>}
              </div>

              {/* 显示已选择的错误归因 */}
              {selectedMistakePointIds.length > 0 ? <div className="space-y-2 mb-3">
                  {selectedMistakePointIds.map(id => {
              const point = mistakePointsMap.get(id);
              if (!point) return null;
              return <div key={id} className="bg-purple-50 border border-purple-200 px-4 py-3 rounded-lg">
                        <div className="font-medium text-purple-900">
                          {point.name}
                        </div>
                        {point.description && <div className="text-sm text-purple-700 mt-1">
                            {point.description}
                          </div>}
                      </div>;
            })}
                </div> : <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg mb-3 text-center text-gray-500 text-sm">
                  暂无错误归因
                </div>}

              {/* 编辑按钮 - 只在有编辑权限时显示 */}
              {canEditMistakePoints && <button onClick={handleOpenEditModal} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2" type="button">
                  <Edit className="w-5 h-5" />
                  编辑错误归因
                </button>}
            </div>}

          {/* AI及时答疑按钮 */}
          {showRedoButton && <div className="relative mt-5">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-gray-800">AI及时答疑</h3>
                <div className="flex-1 h-px bg-orange-200"></div>
              </div>
              <button onClick={() => onRedoClick?.(answerItemId)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-lg" type="button">
                <Bot className="w-5 h-5" />
                AI及时答疑
              </button>
            </div>}
        </CardContent>
      </Card>

      {/* 全屏图片预览 */}
      {isImageFullscreen && displayImage?.url && <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90">
          {/* 关闭按钮 */}
          <button onClick={closeFullscreen} className="absolute top-4 right-4 z-[10000] bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors cursor-pointer" type="button">
            <X className="w-6 h-6 text-white" />
          </button>

          {/* 全屏图片容器 */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <BaseImage src={displayImage.url} alt={displayImage.alt} title={displayImage.title} width={question.imageWidth || 400} height={question.imageHeight || 300} className="max-w-[90vh] max-h-[90vw] w-auto h-auto object-contain transform rotate-90" />
          </div>
        </div>}

      {/* 重做图片全屏预览 */}
      {isRedoImageFullscreen && redoImage?.redoImageUrl && <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90">
          {/* 关闭按钮 */}
          <button onClick={closeRedoImageFullscreen} className="absolute top-4 right-4 z-[10000] bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors cursor-pointer" type="button">
            <X className="w-6 h-6 text-white" />
          </button>

          {/* 全屏图片容器 */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <BaseImage src={redoImage.redoImageUrl} alt="学生重做图片" title="学生重做图片" width={400} height={300} className="max-w-[90vh] max-h-[90vw] w-auto h-auto object-contain transform rotate-90" />
          </div>
        </div>}

      {/* 错误归因编辑模态框 */}
      <MistakePointEditModal open={showMistakePointModal} onClose={() => setShowMistakePointModal(false)} mistakePoints={allMistakePoints} selectedIds={selectedMistakePointIds} onSave={handleSaveMistakePoints} maxSelection={maxMistakePoints} />
    </>;
}
