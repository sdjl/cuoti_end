"use client";

// 高频错题集列表页，负责筛选查询和生成/删除PDF等操作
import { useCallback, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../../components/common/Pagination.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { deleteAnswersPdfAction, deleteQuestionsPdfAction, generateAnswersPdfAction, generateQuestionsPdfAction, getFrequentMistakeCountAction, getFrequentMistakeListAction } from "./actions.js";
import FrequentMistakeFilters from "./components/FrequentMistakeFilters.js";
import FrequentMistakeList from "./components/FrequentMistakeList.js";

// 每页显示的记录数量
const PAGE_SIZE = 20;
export default function FrequentMistakeListPage() {
  const {
    toast
  } = useToast();
  const [frequentMistakes, setFrequentMistakes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 过滤条件
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedGenerationType, setSelectedGenerationType] = useState("all");

  // PDF生成状态
  const [generatingQuestionsPdfIds, setGeneratingQuestionsPdfIds] = useState(new Set());
  const [generatingAnswersPdfIds, setGeneratingAnswersPdfIds] = useState(new Set());

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 加载数据
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const pageNum = currentPage - 1;
      const [data, count] = await Promise.all([getFrequentMistakeListAction({
        pageNum,
        pageSize: PAGE_SIZE,
        searchTerm: searchTerm.trim(),
        subject: selectedSubject !== "all" ? selectedSubject : undefined,
        generationType: selectedGenerationType !== "all" ? selectedGenerationType : undefined
      }), getFrequentMistakeCountAction({
        searchTerm: searchTerm.trim(),
        subject: selectedSubject !== "all" ? selectedSubject : undefined,
        generationType: selectedGenerationType !== "all" ? selectedGenerationType : undefined
      })]);
      setFrequentMistakes(data);
      setTotalCount(count);
    } catch (error) {
      console.error("加载高频错题集失败:", error);
      toast({
        title: "加载失败",
        description: "加载高频错题集数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, selectedSubject, selectedGenerationType, toast]);

  // 初始加载和条件变化时加载数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 当筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubject, selectedGenerationType]);

  // 重置过滤条件
  const handleReset = useCallback(() => {
    setSearchTerm("");
    setSelectedSubject("all");
    setSelectedGenerationType("all");
    setCurrentPage(1);
  }, []);

  // 处理搜索
  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    fetchData();
  }, [fetchData]);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 处理生成题目PDF
  const handleGenerateQuestionsPdf = useCallback(async item => {
    setGeneratingQuestionsPdfIds(prev => new Set(prev).add(item._id));
    try {
      const result = await generateQuestionsPdfAction(item._id);
      if (result.success) {
        toast({
          title: "生成成功",
          description: "题目PDF已生成"
        });
        // 刷新数据
        await fetchData();
      } else {
        toast({
          title: "生成失败",
          description: result.error || "请稍后再试",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("生成题目PDF失败:", error);
      toast({
        title: "生成失败",
        description: "生成题目PDF时发生错误",
        variant: "destructive"
      });
    } finally {
      setGeneratingQuestionsPdfIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item._id);
        return newSet;
      });
    }
  }, [toast, fetchData]);

  // 处理生成答案PDF
  const handleGenerateAnswersPdf = useCallback(async item => {
    setGeneratingAnswersPdfIds(prev => new Set(prev).add(item._id));
    try {
      const result = await generateAnswersPdfAction(item._id);
      if (result.success) {
        toast({
          title: "生成成功",
          description: "答案PDF已生成"
        });
        // 刷新数据
        await fetchData();
      } else {
        toast({
          title: "生成失败",
          description: result.error || "请稍后再试",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("生成答案PDF失败:", error);
      toast({
        title: "生成失败",
        description: "生成答案PDF时发生错误",
        variant: "destructive"
      });
    } finally {
      setGeneratingAnswersPdfIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item._id);
        return newSet;
      });
    }
  }, [toast, fetchData]);

  // 处理删除题目PDF
  const handleDeleteQuestionsPdf = useCallback(async item => {
    if (!confirm("确定要删除题目PDF吗？")) {
      return;
    }
    try {
      const result = await deleteQuestionsPdfAction(item._id);
      if (result.success) {
        toast({
          title: "删除成功",
          description: "题目PDF已删除"
        });
        // 刷新数据
        await fetchData();
      } else {
        toast({
          title: "删除失败",
          description: result.error || "请稍后再试",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除题目PDF失败:", error);
      toast({
        title: "删除失败",
        description: "删除题目PDF时发生错误",
        variant: "destructive"
      });
    }
  }, [toast, fetchData]);

  // 处理删除答案PDF
  const handleDeleteAnswersPdf = useCallback(async item => {
    if (!confirm("确定要删除答案PDF吗？")) {
      return;
    }
    try {
      const result = await deleteAnswersPdfAction(item._id);
      if (result.success) {
        toast({
          title: "删除成功",
          description: "答案PDF已删除"
        });
        // 刷新数据
        await fetchData();
      } else {
        toast({
          title: "删除失败",
          description: result.error || "请稍后再试",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除答案PDF失败:", error);
      toast({
        title: "删除失败",
        description: "删除答案PDF时发生错误",
        variant: "destructive"
      });
    }
  }, [toast, fetchData]);
  return <>
      <WorkHeader title="高频错题集列表" showBackButton={true} backHref="/work/create-pack" backText="返回上一页" />

      <div className="container mx-auto p-6 space-y-6">
        <FrequentMistakeFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject} selectedGenerationType={selectedGenerationType} setSelectedGenerationType={setSelectedGenerationType} onReset={handleReset} onSearch={handleSearch} />

        {/* 统计信息 */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              共找到{" "}
              <span className="font-medium text-gray-900">{totalCount}</span>{" "}
              个高频错题集
            </div>
            <div className="text-sm text-gray-500">
              第 {currentPage} 页，共 {totalPages} 页
            </div>
          </div>
        </div>

        <FrequentMistakeList frequentMistakes={frequentMistakes} isLoading={isLoading} onGenerateQuestionsPdf={handleGenerateQuestionsPdf} onGenerateAnswersPdf={handleGenerateAnswersPdf} onDeleteQuestionsPdf={handleDeleteQuestionsPdf} onDeleteAnswersPdf={handleDeleteAnswersPdf} generatingQuestionsPdfIds={generatingQuestionsPdfIds} generatingAnswersPdfIds={generatingAnswersPdfIds} />

        {/* 分页 */}
        {totalPages > 1 && <div className="flex justify-center">
            <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="frequent_mistake_page" />
          </div>}
      </div>
    </>;
}
