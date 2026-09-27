"use client";

// 课程题集管理页面，用于为课程添加或移除题集，支持从公共题集中选择
import { ArrowUpDown, RefreshCw, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CustomPagination } from "../../../../../../../components/common/Pagination.js";
import { Button } from "../../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { useSubjects } from "../../../../../../../hooks/useAdminConfig.js";
import { useAuth } from "../../../../../../../hooks/useAuth.js";
import { getCourseAction, getPublicQuestionPacksAction, getPublicQuestionPacksCountAction, getQuestionPacksByIdsAction, updateCourseQuestionPacksAction } from "./actions.js";
import QuestionPackFilters from "./components/QuestionPackFilters.js";
import QuestionPackList from "./components/QuestionPackList.js";
import SelectedQuestionPacks from "./components/SelectedQuestionPacks.js";

// 每页显示的题集数量
const PAGE_SIZE = 10;

// 题集列表区域高度
const LIST_HEIGHT = 600;
export default function QuestionPackPage() {
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
  const [publicQuestionPacks, setPublicQuestionPacks] = useState([]);
  const [originalQuestionPacks, setOriginalQuestionPacks] = useState([]);
  // 存储初始的原有题集ID，用于比较是否有变更
  const [initialQuestionPackIds, setInitialQuestionPackIds] = useState([]);
  const [selectedQuestionPackIds, setSelectedQuestionPackIds] = useState([]);
  const [selectedQuestionPacks, setSelectedQuestionPacks] = useState([]);

  // 使用useSubjects hook获取科目配置
  const {
    subjects: subjectConfigs
  } = useSubjects();

  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 分页状态
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  // 当前用户是否是校长
  const userIsPrincipal = isPrincipal();

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查是否有变更（新增或移除题集）
  const hasChanges = useMemo(() => {
    const currentOriginalIds = originalQuestionPacks.map(pack => pack._id);
    const allCurrentIds = [...currentOriginalIds, ...selectedQuestionPackIds];

    // 比较当前的题集ID和初始的题集ID
    if (allCurrentIds.length !== initialQuestionPackIds.length) {
      return true;
    }

    // 检查ID是否完全一致
    const sortedCurrent = [...allCurrentIds].sort();
    const sortedInitial = [...initialQuestionPackIds].sort();
    return !sortedCurrent.every((id, index) => id === sortedInitial[index]);
  }, [originalQuestionPacks, selectedQuestionPackIds, initialQuestionPackIds]);

  // 合并所有已选择的题集ID（原有的 + 新添加的）
  const allSelectedIds = useMemo(() => {
    const originalIds = originalQuestionPacks.map(pack => pack._id);
    return [...originalIds, ...selectedQuestionPackIds];
  }, [originalQuestionPacks, selectedQuestionPackIds]);

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取课程信息和原有题集
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

      // 如果课程有科目，自动设置科目筛选器
      if (courseData.subject) {
        setSelectedSubject(courseData.subject);
      }

      // 获取课程原有的题集
      if (courseData.questionPackIds.length > 0) {
        const originalPacks = await getQuestionPacksByIdsAction(courseData.questionPackIds);

        // 按照courseData.questionPackIds的顺序排序题集
        const sortedOriginalPacks = courseData.questionPackIds.map(id => originalPacks.find(pack => pack._id === id)).filter(pack => pack !== undefined);
        setOriginalQuestionPacks(sortedOriginalPacks);
        setInitialQuestionPackIds(courseData.questionPackIds);
      } else {
        setOriginalQuestionPacks([]);
        setInitialQuestionPackIds([]);
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

  // 获取公共题集数据
  const fetchPublicQuestionPacks = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = searchTerm.trim();
      const subject = selectedSubject === "all" ? "" : selectedSubject;
      const pageNum = currentPage - 1;
      const [packsData, count] = await Promise.all([getPublicQuestionPacksAction({
        pageNum,
        pageSize: PAGE_SIZE,
        keyword,
        subject
      }), getPublicQuestionPacksCountAction({
        keyword,
        subject
      })]);
      setPublicQuestionPacks(packsData);
      setTotalCount(count);
    } catch (error) {
      console.error("获取公共题集数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取题集数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedSubject, currentPage, toast]);

  // 将科目配置转换为字符串数组
  const subjects = useMemo(() => {
    return subjectConfigs.map(config => config.name);
  }, [subjectConfigs]);

  // 获取选中题集的详细信息
  const fetchSelectedQuestionPacks = useCallback(async () => {
    if (selectedQuestionPackIds.length === 0) {
      setSelectedQuestionPacks([]);
      return;
    }
    try {
      const selectedPacks = await getQuestionPacksByIdsAction(selectedQuestionPackIds);
      setSelectedQuestionPacks(selectedPacks);
    } catch (error) {
      console.error("获取选中题集详情失败:", error);
    }
  }, [selectedQuestionPackIds]);

  // 初始加载数据
  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  // 获取公共题集数据 - 只在课程信息加载完成且有科目筛选时才开始获取
  useEffect(() => {
    if (course && selectedSubject) {
      fetchPublicQuestionPacks();
    }
  }, [course, selectedSubject, fetchPublicQuestionPacks]);

  // 当选中的题集ID变化时，获取详细信息
  useEffect(() => {
    fetchSelectedQuestionPacks();
  }, [fetchSelectedQuestionPacks]);

  // 当筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubject]);

  // 手动刷新数据
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchCourseData(), fetchPublicQuestionPacks()]);
    } catch (error) {
      console.error("刷新数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchCourseData, fetchPublicQuestionPacks]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedSubject("all");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 处理从左侧添加题集到右侧
  const handleAddQuestionPack = useCallback(questionPackId => {
    // 检查是否已经在原有题集中
    const isInOriginal = originalQuestionPacks.some(pack => pack._id === questionPackId);
    if (isInOriginal) {
      return; // 如果已经在原有题集中，不做任何操作
    }
    setSelectedQuestionPackIds(prev => {
      if (!prev.includes(questionPackId)) {
        return [...prev, questionPackId];
      }
      return prev;
    });
  }, [originalQuestionPacks]);

  // 处理从右侧移除题集到左侧
  const handleRemoveQuestionPack = useCallback(questionPackId => {
    // 如果是新选择的题集，从选择列表中移除
    setSelectedQuestionPackIds(prev => prev.filter(id => id !== questionPackId));

    // 如果是原有题集，从原有列表中移除
    setOriginalQuestionPacks(prev => prev.filter(pack => pack._id !== questionPackId));
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
      // 合并原有题集和新选择的题集ID
      const originalIds = originalQuestionPacks.map(pack => pack._id);
      const allQuestionPackIds = [...originalIds, ...selectedQuestionPackIds];
      const {
        success,
        error
      } = await updateCourseQuestionPacksAction(courseId, allQuestionPackIds);
      if (success) {
        toast({
          title: "保存成功",
          description: "课程题集已成功更新"
        });

        // 刷新课程数据
        await fetchCourseData();
        // 清空新选择的题集
        setSelectedQuestionPackIds([]);
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
  }, [userIsPrincipal, originalQuestionPacks, selectedQuestionPackIds, courseId, toast, fetchCourseData]);

  // 处理排序
  const handleSort = useCallback(() => {
    router.push(`/work/school/course/${courseId}/question-pack-sort`);
  }, [router, courseId]);
  if (!course) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={`课程题集管理 - ${course.name}`} showBackButton={true} backHref="/work/school/course" backText="返回课程列表" rightContent={<div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
            {userIsPrincipal && <>
                <Button variant="outline" size="sm" onClick={handleSort} disabled={hasChanges || allSelectedIds.length === 0} className="flex items-center">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  排序题集
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !hasChanges} size="sm" className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "保存中..." : "保存"}
                </Button>
              </>}
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <QuestionPackFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} selectedSubject={selectedSubject} onSubjectChange={setSelectedSubject} subjects={subjects} onReset={handleResetFilters} disabled={course?.subject !== undefined} />

          {/* 题集管理区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：可选择的题集 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">可选择的题集</h3>
              </div>
              <div className="overflow-y-auto p-4" style={{
              height: `${LIST_HEIGHT}px`
            }}>
                <QuestionPackList questionPacks={publicQuestionPacks} selectedIds={allSelectedIds} onToggleSelect={handleAddQuestionPack} isLoading={isLoading} />

                {/* 分页 */}
                {totalPages > 1 && <div className="flex justify-center pt-4">
                    <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                  </div>}
              </div>
            </div>

            {/* 右侧：已选择的题集 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">已选择的题集</h3>
              </div>
              <div className="overflow-y-auto p-4" style={{
              height: `${LIST_HEIGHT}px`
            }}>
                <SelectedQuestionPacks originalQuestionPacks={originalQuestionPacks} selectedQuestionPacks={selectedQuestionPacks} onRemoveSelected={handleRemoveQuestionPack} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>;
}
