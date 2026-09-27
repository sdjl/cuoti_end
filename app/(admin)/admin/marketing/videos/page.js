"use client";

import { useRouter, useSearchParams } from "next/navigation";
// 视频管理页面，用于查看、筛选、创建和编辑视频记录
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { useToast } from "../../../../../hooks/use-toast.js";
import { getVideoCategories, getVideos } from "./actions.js";
import VideoDialog from "./components/VideoDialog.js";
import VideoFilters from "./components/VideoFilters.js";
import VideoList from "./components/VideoList.js";
// 每页显示的视频数量
const PAGE_SIZE = 20;
export default function VideosPage() {
  const {
    toast
  } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

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
    const pageParam = searchParams.get("video_page");
    const pageFromUrl = pageParam ? parseInt(pageParam) : 1;
    setCurrentPage(pageFromUrl);
  }, [searchParams]);

  // 更新URL参数
  const updateUrlParams = useCallback(page => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("video_page", page.toString());
    router.push(`/admin/marketing/videos?${params.toString()}`);
  }, [searchParams, router]);

  // 获取视频分类
  const fetchCategories = useCallback(async () => {
    try {
      const result = await getVideoCategories();
      if (result.success) {
        setCategories(result.data || []);
      } else {
        console.error("获取分类失败:", result.message);
      }
    } catch (error) {
      console.error("获取分类失败:", error);
    }
  }, []);

  // 获取视频数据
  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const title = deferredSearchTerm.trim();
      const category = selectedCategory !== "all" ? selectedCategory : undefined;
      const result = await getVideos({
        title,
        category,
        page: currentPage,
        pageSize: PAGE_SIZE
      });
      if (result.success) {
        setVideos(result.data || []);
        setTotalCount(result.total || 0);
      } else {
        toast({
          title: "获取数据失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("获取视频数据失败:", error);
      toast({
        title: "获取数据失败",
        description: `客户端错误: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [deferredSearchTerm, selectedCategory, currentPage, toast]);

  // 初始化时获取分类
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 筛选条件或页码变化时重新获取数据
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    // 搜索时不需要额外操作，筛选条件变化会自动触发重置
  }, []);

  // 重置筛选
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("all");
    setCurrentPage(1);
    updateUrlParams(1);
  }, [updateUrlParams]);

  // 处理分页
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
    updateUrlParams(page);
  }, [updateUrlParams]);

  // 处理新建视频
  const handleCreateVideo = () => {
    setEditingVideo(null);
    setDialogOpen(true);
  };

  // 处理编辑视频
  const handleEditVideo = video => {
    setEditingVideo(video);
    setDialogOpen(true);
  };

  // 处理删除视频
  const handleDeleteVideo = videoId => {
    setVideos(prev => prev.filter(video => video._id !== videoId));
    setTotalCount(prev => prev - 1);
  };

  // 处理对话框成功
  const handleDialogSuccess = () => {
    fetchVideos();
    fetchCategories(); // 重新获取分类，以防新增了分类
  };
  return <div className="space-y-6">
      <VideoFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} onSearch={handleSearch} onReset={resetFilters} isSearchPending={isSearchPending} categories={categories} />

      <VideoList videos={videos} isLoading={isLoading || isSearchPending} totalCount={totalCount} totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} onEdit={handleEditVideo} onDelete={handleDeleteVideo} onCreateVideo={handleCreateVideo} />

      {/* 新建/编辑对话框 */}
      <VideoDialog open={dialogOpen} onOpenChange={setDialogOpen} video={editingVideo} categories={categories} onSuccess={handleDialogSuccess} />
    </div>;
}
