"use client";

// 高频错题典型错题列表，支持拖拽排序与单项删除
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../../../../components/common/BaseImage.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../../../../../components/ui/button.js";
import { useToast } from "../../../../../../../../../../hooks/use-toast.js";
import { deleteTypicalErrorAction, updateTypicalErrorsSortAction } from "../actions.js";
// 可排序的典型错题项组件
function SortableTypicalErrorItem({
  item,
  onDelete
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: item.typicalError._id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return <div ref={setNodeRef} style={style} className="border rounded-lg p-4 bg-white">
      {/* 图片区域 - 整行 */}
      {item.item.studentAnswerItem.imageUrl && <div className="mb-3">
          <a href={item.item.studentAnswerItem.imageUrl} target="_blank" rel="noopener noreferrer" className="block">
            <BaseImage src={item.item.studentAnswerItem.imageUrl} alt="错题图片" width={800} height={600} className="w-full h-auto rounded border hover:opacity-90 transition-opacity" />
          </a>
        </div>}

      {/* 内容区域 */}
      <div className="space-y-2">
        {/* 学生信息和操作按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              <span className="font-medium">学生：</span>
              {item.item.student.name}
            </span>
            <span>
              <span className="font-medium">班级：</span>
              {item.item.classroom.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* 拖动手柄 */}
            <Button variant="ghost" size="sm" className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
              <GripVertical className="w-4 h-4 text-gray-400" />
            </Button>
            {/* 删除按钮 */}
            <Button variant="destructive" size="sm" onClick={() => onDelete(item.typicalError._id)}>
              <Trash2 className="w-4 h-4 mr-1 text-white" />
              <span className="text-white">删除</span>
            </Button>
          </div>
        </div>

        {/* 答案 */}
        {item.item.studentAnswerItem.answerValue && item.item.studentAnswerItem.answerValue.length > 0 && <div className="text-sm">
              <span className="font-medium text-gray-700">学生答案：</span>
              <span className="text-gray-600">
                {item.item.studentAnswerItem.answerValue.join("；")}
              </span>
            </div>}

        {/* 解析 */}
        {item.item.studentAnswerItem.parse && item.item.studentAnswerItem.parse.length > 0 && <div className="text-sm">
              <span className="font-medium text-gray-700">错误解析：</span>
              <span className="text-gray-600">
                {item.item.studentAnswerItem.parse.join("；")}
              </span>
            </div>}
      </div>
    </div>;
}
export default function TypicalErrorList({
  items,
  onRefresh
}) {
  const [localItems, setLocalItems] = useState(items);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const {
    toast
  } = useToast();

  // 更新本地items当props改变时
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // 配置拖动传感器
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));

  // 处理拖动结束
  const handleDragEnd = async event => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex(item => item.typicalError._id === active.id);
      const newIndex = localItems.findIndex(item => item.typicalError._id === over.id);
      const newItems = arrayMove(localItems, oldIndex, newIndex);
      setLocalItems(newItems);

      // 静默更新排序到服务器
      const sortData = newItems.map((item, index) => ({
        id: item.typicalError._id,
        sortOrder: index + 1
      }));
      try {
        const result = await updateTypicalErrorsSortAction(sortData);
        if (!result.success) {
          // 只在失败时提示并恢复原顺序
          toast({
            variant: "destructive",
            title: "排序更新失败",
            description: result.message || "请稍后再试"
          });
          setLocalItems(items);
        }
        // 成功时不提示，不刷新页面
      } catch (error) {
        toast({
          variant: "destructive",
          title: "排序更新失败",
          description: error instanceof Error ? error.message : "请稍后再试"
        });
        // 恢复原顺序
        setLocalItems(items);
      }
    }
  };

  // 处理删除
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const result = await deleteTypicalErrorAction(deleteId);
      if (result.success) {
        toast({
          title: "删除成功",
          description: "已删除该典型错题"
        });
        setDeleteId(null);
        onRefresh();
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: result.message || "删除典型错题失败"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除典型错题失败"
      });
    } finally {
      setDeleting(false);
    }
  };
  if (localItems.length === 0) {
    return <div className="text-center py-12 text-gray-500">
        暂无典型错题，请点击&ldquo;添加典型错题&rdquo;按钮添加
      </div>;
  }
  return <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localItems.map(item => item.typicalError._id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {localItems.map(item => <SortableTypicalErrorItem key={item.typicalError._id} item={item} onDelete={setDeleteId} />)}
          </div>
        </SortableContext>
      </DndContext>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个典型错题吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white">
              {deleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
}
