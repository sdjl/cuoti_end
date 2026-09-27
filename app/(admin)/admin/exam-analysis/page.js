"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
// 试卷解析页面，提供试卷解析列表的筛选、搜索、分页和锁定功能
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { ExamAnalysisFilter } from "./components/ExamAnalysisFilter.js";
import { ExamAnalysisList } from "./components/ExamAnalysisList.js";
import { Button } from "../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../components/ui/dialog.js";
import { useToast } from "../../../../hooks/use-toast.js";
import { getExamPapersAnalysis, getExamPapersAnalysisCount, lockExamPaperAction } from "./actions.js";

// 每页显示的试卷数量
const PAGE_SIZE = 20;
export default function ExamAnalysisPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHasUploaded, setSelectedHasUploaded] = useState("all");
  const [selectedIsDone, setSelectedIsDone] = useState("all");
  const [selectedIsLocked, setSelectedIsLocked] = useState("all");
  const [examPapers, setExamPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterChanged, setIsFilterChanged] = useState(false);
  const {
    toast
  } = useToast();

  // 使用 useDeferredValue 延迟搜索关键词，减少频繁的API调用
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // 判断搜索是否还在延迟中
  const isSearchPending = searchTerm !== deferredSearchTerm;

  // 锁定相关状态
  const [paperToLock, setPaperToLock] = useState(null);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 从URL参数初始化页码
  useEffect(() => {
    const pageParam = searchParams.get("analysis_page");
    const pageFromUrl = pageParam ? parseInt(pageParam) : 1;
    setCurrentPage(pageFromUrl);
  }, [searchParams]);

  // 更新URL参数
  const updateUrlParams = useCallback(page => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("analysis_page", page.toString());
    router.push(`/admin/exam-analysis?${params.toString()}`);
  }, [searchParams, router]);

  // 获取试卷数据
  const fetchExamPapers = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = deferredSearchTerm.trim();

      // 处理上传状态筛选条件
      let hasUploadedPdfWithParse = null;
      if (selectedHasUploaded === "yes") {
        hasUploadedPdfWithParse = true;
      } else if (selectedHasUploaded === "no") {
        hasUploadedPdfWithParse = false;
      }

      // 处理完成状态筛选条件
      let isDone = null;
      if (selectedIsDone === "yes") {
        isDone = true;
      } else if (selectedIsDone === "no") {
        isDone = false;
      }

      // 处理锁定状态筛选条件
      let isLocked = null;
      if (selectedIsLocked === "yes") {
        isLocked = true;
      } else if (selectedIsLocked === "no") {
        isLocked = false;
      }

      // 注意：API调用中pageNum应从0开始，而展示给用户的页码从1开始
      const pageNum = currentPage - 1;
      const [papers, count] = await Promise.all([getExamPapersAnalysis({
        pageNum,
        pageSize: PAGE_SIZE,
        keyword,
        hasUploadedPdfWithParse,
        isDone,
        isLocked
      }), getExamPapersAnalysisCount({
        keyword,
        hasUploadedPdfWithParse,
        isDone,
        isLocked
      })]);
      setExamPapers(papers);
      setTotalCount(count);
    } catch (error) {
      console.error("获取试卷数据失败:", error);
      toast({
        variant: "destructive",
        title: "获取试卷失败",
        description: "请稍后再试"
      });
    } finally {
      setIsLoading(false);
    }
  }, [deferredSearchTerm, selectedHasUploaded, selectedIsDone, selectedIsLocked, currentPage, toast]);

  // 当页码或筛选条件变更时获取数据
  useEffect(() => {
    fetchExamPapers();
  }, [fetchExamPapers]);

  // 当筛选条件发生变化时，标记需要重置页码
  useEffect(() => {
    setIsFilterChanged(true);
  }, [deferredSearchTerm, selectedHasUploaded, selectedIsDone, selectedIsLocked]);

  // 处理筛选条件变化后的页码重置
  useEffect(() => {
    if (isFilterChanged && currentPage !== 1) {
      setCurrentPage(1);
      updateUrlParams(1);
    }
    setIsFilterChanged(false);
  }, [isFilterChanged, currentPage, updateUrlParams]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    // 搜索时不需要额外操作，筛选条件变化会自动触发重置
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
    updateUrlParams(page);
  }, [updateUrlParams]);

  // 重置筛选
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedHasUploaded("all");
    setSelectedIsDone("all");
    setSelectedIsLocked("all");
    setCurrentPage(1);
    updateUrlParams(1);
  }, [updateUrlParams]);

  // 打开锁定对话框
  const openLockDialog = useCallback(paperId => {
    setPaperToLock(paperId);
    setIsLockDialogOpen(true);
  }, []);

  // 关闭锁定对话框
  const closeLockDialog = useCallback(() => {
    setIsLockDialogOpen(false);
    setPaperToLock(null);
  }, []);

  // 确认锁定
  const confirmLock = useCallback(async () => {
    if (paperToLock) {
      try {
        setIsLocking(true);
        const result = await lockExamPaperAction(paperToLock);
        if (result.success) {
          toast({
            title: "锁定成功",
            description: result.message
          });
          // 锁定成功后重新获取数据
          await fetchExamPapers();
        } else {
          toast({
            title: "锁定失败",
            description: result.message,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("锁定试卷失败:", error);
        toast({
          title: "锁定失败",
          description: "操作过程中发生错误",
          variant: "destructive"
        });
      } finally {
        setIsLocking(false);
        closeLockDialog();
      }
    }
  }, [paperToLock, fetchExamPapers, closeLockDialog, toast]);
  return <div className="space-y-6">
      <ExamAnalysisFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedHasUploaded={selectedHasUploaded} setSelectedHasUploaded={setSelectedHasUploaded} selectedIsDone={selectedIsDone} setSelectedIsDone={setSelectedIsDone} selectedIsLocked={selectedIsLocked} setSelectedIsLocked={setSelectedIsLocked} handleSearch={handleSearch} resetFilters={resetFilters} isSearchPending={isSearchPending} />

      <ExamAnalysisList examPapers={examPapers} isLoading={isLoading || isSearchPending} totalCount={totalCount} analysisPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} onLockPaper={openLockDialog} />

      {/* 锁定确认对话框 */}
      <Dialog open={isLockDialogOpen} onOpenChange={open => {
      if (!isLocking) {
        setIsLockDialogOpen(open);
        if (!open) {
          setPaperToLock(null);
        }
      }
    }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认锁定试卷</DialogTitle>
            <DialogDescription>
              您确定要锁定这份试卷吗？锁定后将不能增加或删除题目，不可以重新上传PDF，不可以使用AI分析，只能手动编辑题目内容。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeLockDialog} disabled={isLocking}>
              取消
            </Button>
            <Button variant="default" onClick={confirmLock} disabled={isLocking} className="bg-orange-500 hover:bg-orange-600 text-white">
              {isLocking ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  锁定中...
                </> : "确认锁定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}
