"use client";

// 典型错题管理页，承载列表展示及添加典型错题弹窗
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../../../../components/work/layout/WorkHeader.js";
import { fetchAddedTypicalErrors } from "./actions.js";
import AddTypicalErrorDialog from "./components/AddTypicalErrorDialog.js";
import TypicalErrorList from "./components/TypicalErrorList.js";
export default function TypicalErrorPage() {
  const params = useParams();
  const frequentMistakeId = params.id;
  const questionId = params.questionId;
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 加载已添加的典型错题
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAddedTypicalErrors(frequentMistakeId, questionId);
      setItems(data);
    } catch (error) {
      console.error("加载典型错题失败:", error);
    } finally {
      setLoading(false);
    }
  }, [frequentMistakeId, questionId]);
  useEffect(() => {
    if (frequentMistakeId && questionId) {
      loadItems();
    }
  }, [frequentMistakeId, questionId, loadItems]);
  return <>
      <WorkHeader title="典型错题管理" showBackButton={true} backHref={`/work/create-pack/frequent-mistake/list/${frequentMistakeId}`} backText="返回详情" rightContent={<Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            添加典型错题
          </Button>} />

      <div className="container mx-auto p-6">
        {/* 已添加的典型错题列表 */}
        {loading ? <div className="text-center py-12 text-gray-500">加载中...</div> : <TypicalErrorList items={items} onRefresh={loadItems} />}

        {/* 添加典型错题对话框 */}
        <AddTypicalErrorDialog open={dialogOpen} onOpenChange={setDialogOpen} frequentMistakeId={frequentMistakeId} questionId={questionId} existingItemIds={items.map(item => item.item.studentAnswerItem._id)} onSuccess={loadItems} />
      </div>
    </>;
}
