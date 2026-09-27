"use client";

// 高频错题集详情中的题目列表，支持拖拽排序与管理典型错题
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit, GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
import { updateQuestionOrderAction } from "../actions.js";
// 可排序的题目项组件
function SortableQuestionItem({
  question,
  index,
  frequentMistakeId,
  typicalErrorCounts,
  getDifficultyColor,
  getQuestionTypeColor,
  cn
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: question._id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return <div ref={setNodeRef} style={style} className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex gap-4">
        {/* 左侧：题目图片 */}
        {question.imageUrl && <div className="flex-1 max-w-[50%]">
            <a href={question.imageUrl} target="_blank" rel="noopener noreferrer" className="block">
              <BaseImage src={question.imageUrl} alt={`题目 ${index + 1}`} width={question.imageWidth || 800} height={question.imageHeight || 600} className="w-full h-auto rounded-lg border border-gray-200" style={{
            maxHeight: "500px",
            objectFit: "contain"
          }} />
            </a>
          </div>}

        {/* 右侧：题目信息 */}
        <div className="flex-1 space-y-3">
          {/* 第一行：难度、题目类型、序号 */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs px-2 py-0.5", getDifficultyColor(question.difficulty))}>
                {question.difficulty}
              </Badge>
              {question.questionType && <Badge className={cn("text-xs px-2 py-0.5", getQuestionTypeColor(question.questionType))}>
                  {question.questionType}
                </Badge>}
            </div>
            <Badge variant="outline" className="text-sm">
              #{index + 1}
            </Badge>
          </div>

          {/* 知识点 */}
          {question.knowledgePoints && question.knowledgePoints.length > 0 && <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                知识点:
              </span>
              <div className="flex flex-wrap gap-1">
                {question.knowledgePoints.map((kp, idx) => <Badge key={idx} className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-50">
                    {kp}
                  </Badge>)}
              </div>
            </div>}

          {/* 易错点 */}
          {question.easyToMistakeDetail && question.easyToMistakeDetail.length > 0 && <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                  易错点:
                </span>
                <div className="flex-1 space-y-1">
                  {question.easyToMistakeDetail.map((detail, idx) => <div key={idx} className="text-sm text-gray-700">
                      {detail}
                    </div>)}
                </div>
              </div>}

          {/* 操作按钮 */}
          <div className="flex justify-end pt-2 gap-2">
            {/* 拖动手柄 */}
            <Button variant="ghost" size="sm" className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
              <GripVertical className="w-4 h-4 text-gray-400" />
            </Button>
            {/* 典型错题按钮 */}
            <Button size="sm" variant="outline" onClick={() => window.open(`/work/create-pack/frequent-mistake/list/${frequentMistakeId}/typical/${question._id}`, "_blank")} title="管理典型错题">
              <Edit className="h-3 w-3 mr-1" />
              <span className="text-xs">
                典型错题
                {typicalErrorCounts[question._id] > 0 && ` (${typicalErrorCounts[question._id]})`}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>;
}
export default function QuestionDetailList({
  questions,
  frequentMistakeId,
  typicalErrorCounts
}) {
  const [localQuestions, setLocalQuestions] = useState(questions);
  const {
    toast
  } = useToast();

  // 更新本地questions当props改变时
  useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  // 配置拖动传感器
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));

  // 难度颜色配置
  const getDifficultyColor = difficulty => {
    const difficultyConfig = {
      容易: {
        color: "bg-green-100 text-green-800",
        text: "容易"
      },
      中等: {
        color: "bg-blue-100 text-blue-800",
        text: "中等"
      },
      困难: {
        color: "bg-orange-100 text-orange-800",
        text: "困难"
      },
      超难: {
        color: "bg-red-100 text-red-800",
        text: "超难"
      },
      未知: {
        color: "bg-gray-100 text-gray-800",
        text: "未知"
      }
    };
    const config = difficultyConfig[difficulty] || difficultyConfig.未知;
    return config.color;
  };

  // 题目类型颜色配置
  const getQuestionTypeColor = questionType => {
    if (!questionType) return "bg-gray-100 text-gray-800";
    const typeConfig = {
      选择题: "bg-blue-100 text-blue-800",
      填空题: "bg-green-100 text-green-800",
      解答题: "bg-purple-100 text-purple-800",
      判断题: "bg-yellow-100 text-yellow-800",
      计算题: "bg-orange-100 text-orange-800"
    };
    return typeConfig[questionType] || "bg-gray-100 text-gray-800";
  };
  function cn(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  // 处理拖动结束
  const handleDragEnd = async event => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localQuestions.findIndex(q => q._id === active.id);
      const newIndex = localQuestions.findIndex(q => q._id === over.id);
      const newQuestions = arrayMove(localQuestions, oldIndex, newIndex);
      setLocalQuestions(newQuestions);

      // 静默更新排序到服务器
      const questionIds = newQuestions.map(q => q._id);
      try {
        const result = await updateQuestionOrderAction(frequentMistakeId, questionIds);
        if (!result.success) {
          // 只在失败时提示并恢复原顺序
          toast({
            variant: "destructive",
            title: "排序更新失败",
            description: result.message || "请稍后再试"
          });
          setLocalQuestions(questions);
        }
        // 成功时不提示，不刷新页面
      } catch (error) {
        toast({
          variant: "destructive",
          title: "排序更新失败",
          description: error instanceof Error ? error.message : "请稍后再试"
        });
        // 恢复原顺序
        setLocalQuestions(questions);
      }
    }
  };
  if (localQuestions.length === 0) {
    return <div className="text-center py-12 text-gray-500">
        该错题集暂无题目数据
      </div>;
  }
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={localQuestions.map(q => q._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {localQuestions.map((question, index) => <SortableQuestionItem key={question._id} question={question} index={index} frequentMistakeId={frequentMistakeId} typicalErrorCounts={typicalErrorCounts} getDifficultyColor={getDifficultyColor} getQuestionTypeColor={getQuestionTypeColor} cn={cn} />)}
        </div>
      </SortableContext>
    </DndContext>;
}
