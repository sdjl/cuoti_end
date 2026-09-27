"use client";

// 题集排序页面，用于通过拖拽调整课程中题集的显示顺序
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, GripVertical, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../hooks/useAuth.js";
import { getCourseAction, getQuestionPacksByIdsAction, updateCourseQuestionPacksAction } from "../question-pack/actions.js";

// 可排序的题集项组件

function SortableQuestionPackItem({
  questionPack,
  index
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: questionPack._id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-move hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <GripVertical className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-blue-600 min-w-[3rem]">
                  #{index + 1}
                </span>
                <h3 className="text-base font-medium">{questionPack.name}</h3>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}
export default function QuestionPackSortPage() {
  const {
    user,
    isPrincipal
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const {
    toast
  } = useToast();
  const courseId = params.id;

  // 数据状态
  const [course, setCourse] = useState(null);
  const [questionPacks, setQuestionPacks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // 当前用户是否是校长
  const userIsPrincipal = isPrincipal();

  // 传感器配置
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取课程信息和题集
  const fetchCourseData = useCallback(async () => {
    try {
      const courseData = await getCourseAction(courseId);
      if (!courseData) {
        toast({
          title: "获取课程信息失败",
          description: "课程不存在或无权访问",
          variant: "destructive"
        });
        router.push("/work/school/course");
        return;
      }
      setCourse(courseData);

      // 获取课程的题集，按照课程中的顺序
      if (courseData.questionPackIds.length > 0) {
        const packs = await getQuestionPacksByIdsAction(courseData.questionPackIds);

        // 按照courseData.questionPackIds的顺序排序题集
        const sortedPacks = courseData.questionPackIds.map(id => packs.find(pack => pack._id === id)).filter(pack => pack !== undefined);
        setQuestionPacks(sortedPacks);
      } else {
        // 如果没有题集，返回题集管理页面
        router.push(`/work/school/course/${courseId}/question-pack`);
      }
    } catch (error) {
      console.error("获取课程数据失败:", error);
      toast({
        title: "获取课程数据失败",
        description: "获取课程信息时发生错误",
        variant: "destructive"
      });
    }
  }, [courseId, toast, router]);

  // 初始加载数据
  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(event => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      setQuestionPacks(items => {
        const oldIndex = items.findIndex(item => item._id === active.id);
        const newIndex = items.findIndex(item => item._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // 处理保存
  const handleSave = useCallback(async () => {
    if (!userIsPrincipal) {
      toast({
        title: "权限不足",
        description: "只有校长可以编辑课程题集",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      // 获取新的排序后的题集ID数组
      const newQuestionPackIds = questionPacks.map(pack => pack._id);
      const {
        success,
        error
      } = await updateCourseQuestionPacksAction(courseId, newQuestionPackIds);
      if (success) {
        toast({
          title: "保存成功",
          description: "题集排序已成功更新"
        });
      } else {
        toast({
          title: "保存失败",
          description: error || "保存时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast({
        title: "保存失败",
        description: "保存时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [userIsPrincipal, questionPacks, courseId, toast]);

  // 返回题集管理页面
  const handleBackToQuestionPacks = useCallback(() => {
    router.push(`/work/school/course/${courseId}/question-pack`);
  }, [router, courseId]);
  if (!course || questionPacks.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={`题集排序 - ${course.name}`} showBackButton={true} backHref="/work/school/course" backText="返回课程列表" rightContent={<div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleBackToQuestionPacks} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回题集管理
            </Button>
            {userIsPrincipal && <Button onClick={handleSave} disabled={isSaving} size="sm" className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "保存中..." : "保存排序"}
              </Button>}
          </div>} />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">拖拽调整题集顺序</h2>
            <p className="text-gray-600">
              拖拽题集卡片来调整它们在课程中的显示顺序
            </p>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questionPacks.map(pack => pack._id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {questionPacks.map((questionPack, index) => <SortableQuestionPackItem key={questionPack._id} questionPack={questionPack} index={index} />)}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </main>
    </div>;
}
