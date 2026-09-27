"use client";

import { useRouter, useSearchParams } from "next/navigation";
// 试卷列表页面，用于查看、筛选和管理所有试卷
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import ExamFilters from "./components/ExamFilters.js";
import ExamList from "./components/ExamList.js";
import { useSubjects } from "../../../../hooks/useAdminConfig.js";
import { deleteExamPaper, getExamPapers, getExamPapersCount } from "../../../../lib/collection/examPaper.js";

// 每页显示的试卷数量
const PAGE_SIZE = 20;
export default function ExamPapersPage() {
  const {
    subjects
  } = useSubjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedIsLocked, setSelectedIsLocked] = useState("all");
  const [examPapers, setExamPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterChanged, setIsFilterChanged] = useState(false);

  // 使用 useDeferredValue 延迟搜索关键词，减少频繁的API调用
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // 判断搜索是否还在延迟中
  const isSearchPending = searchTerm !== deferredSearchTerm;
  const searchParams = useSearchParams();
  const router = useRouter();

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 从URL参数初始化页码
  useEffect(() => {
    const pageParam = searchParams.get("exam_page");
    const pageFromUrl = pageParam ? parseInt(pageParam) : 1;
    setCurrentPage(pageFromUrl);
  }, [searchParams]);

  // 更新URL参数
  const updateUrlParams = useCallback(page => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("exam_page", page.toString());
    router.push(`/admin/exam-papers?${params.toString()}`);
  }, [searchParams, router]);

  // 获取试卷数据
  const fetchExamPapers = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = deferredSearchTerm.trim();
      const subject = selectedSubject !== "all" ? selectedSubject : "";

      // 处理锁定状态筛选条件
      let isLocked = null;
      if (selectedIsLocked === "yes") {
        isLocked = true;
      } else if (selectedIsLocked === "no") {
        isLocked = false;
      }

      // 注意：API调用中pageNum应从0开始，而展示给用户的页码从1开始
      const pageNum = currentPage - 1;
      const [papers, count] = await Promise.all([getExamPapers({
        pageNum,
        pageSize: PAGE_SIZE,
        subject,
        keyword,
        isLocked
      }), getExamPapersCount({
        subject,
        keyword,
        isLocked
      })]);
      setExamPapers(papers);
      setTotalCount(count);
    } catch (error) {
      console.error("获取试卷数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, [deferredSearchTerm, selectedSubject, selectedIsLocked, currentPage]);

  // 当页码或筛选条件变更时获取数据
  useEffect(() => {
    fetchExamPapers();
  }, [fetchExamPapers]);

  // 当筛选条件发生变化时，标记需要重置页码
  useEffect(() => {
    setIsFilterChanged(true);
  }, [deferredSearchTerm, selectedSubject, selectedIsLocked]);

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
    setSelectedSubject("all");
    setSelectedIsLocked("all");
    setCurrentPage(1);
    updateUrlParams(1);
  }, [updateUrlParams]);

  // 获取科目名称
  const getSubjectName = useCallback(name => {
    return subjects.find(subject => subject.name === name)?.name || name;
  }, [subjects]);

  // 处理删除试卷
  const handleDeletePaper = useCallback(async paperId => {
    try {
      const success = await deleteExamPaper(paperId);
      if (success) {
        // 删除成功后重新获取数据
        await fetchExamPapers();
      }
    } catch (error) {
      console.error("删除试卷失败:", error);
      throw error;
    }
  }, [fetchExamPapers]);
  return <div className="space-y-6">
      <ExamFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject} selectedIsLocked={selectedIsLocked} setSelectedIsLocked={setSelectedIsLocked} onSearch={handleSearch} onReset={resetFilters} isSearchPending={isSearchPending} />

      <ExamList examPapers={examPapers} isLoading={isLoading || isSearchPending} totalCount={totalCount} totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} onDeletePaper={handleDeletePaper} getSubjectName={getSubjectName} />
    </div>;
}
