"use client";

import { Plus, RefreshCw } from "lucide-react";
// 学习资料管理页面，用于管理学习资料的上传、编辑和删除
import { useCallback, useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { createLearningMaterialAction, deleteLearningMaterialAction, getAvailableClassroomsAction, getLearningMaterialsAction, updateLearningMaterialAction } from "./actions.js";
import CreateMaterialDialog from "./components/CreateMaterialDialog.js";
import CustomPagination from "./components/CustomPagination.js";
import EditMaterialDialog from "./components/EditMaterialDialog.js";
import MaterialFilters from "./components/MaterialFilters.js";
import MaterialList from "./components/MaterialList.js";
import ViewMaterialDialog from "./components/ViewMaterialDialog.js";
const PAGE_SIZE = 20;
export default function StudyMaterialsPage() {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();

  // 数据状态
  const [materials, setMaterials] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);

  // 班级数据
  const [classrooms, setClassrooms] = useState([]);

  // 过滤器状态
  const [searchText, setSearchText] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // 模态框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 计算总页数
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // 获取班级数据
  const fetchClassrooms = useCallback(async () => {
    try {
      const result = await getAvailableClassroomsAction();
      if (result.success) {
        setClassrooms(result.data);
      } else {
        toast({
          title: "获取班级列表失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("获取班级列表失败:", error);
      toast({
        title: "获取班级列表失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  }, [toast]);

  // 获取学习资料数据
  const fetchMaterials = useCallback(async () => {
    if (!user?.workSetting?.currentSchool?._id) {
      return;
    }
    try {
      const result = await getLearningMaterialsAction({
        schoolId: user.workSetting.currentSchool._id,
        page: currentPage,
        pageSize: PAGE_SIZE,
        selectedClassId,
        searchText,
        selectedType,
        selectedStatus
      });
      if (result.success) {
        setMaterials(result.data);
        setTotalCount(result.totalCount);
      } else {
        toast({
          title: "获取学习资料失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("获取学习资料失败:", error);
      toast({
        title: "获取学习资料失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  }, [user?.workSetting?.currentSchool?._id, currentPage, selectedClassId, searchText, selectedType, selectedStatus, toast]);

  // 创建学习资料
  const handleCreateMaterial = useCallback(async data => {
    if (!user?.workSetting?.currentSchool?._id) {
      toast({
        title: "创建失败",
        description: "无法获取当前校园信息",
        variant: "destructive"
      });
      return;
    }
    setIsCreating(true);
    try {
      const result = await createLearningMaterialAction({
        schoolId: user.workSetting.currentSchool._id,
        ...data
      });
      if (result.success) {
        toast({
          title: "创建成功",
          description: "学习资料已创建"
        });
        setIsCreateDialogOpen(false);
        await fetchMaterials();
      } else {
        toast({
          title: "创建失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("创建学习资料失败:", error);
      toast({
        title: "创建失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  }, [user?.workSetting?.currentSchool?._id, toast, fetchMaterials]);

  // 更新学习资料
  const handleUpdateMaterial = useCallback(async data => {
    if (!editingMaterial) return;
    setIsSaving(true);
    try {
      const result = await updateLearningMaterialAction({
        materialId: editingMaterial._id,
        ...data
      });
      if (result.success) {
        toast({
          title: "更新成功",
          description: "学习资料已更新"
        });
        setIsEditDialogOpen(false);
        await fetchMaterials();
      } else {
        toast({
          title: "更新失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("更新学习资料失败:", error);
      toast({
        title: "更新失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [editingMaterial, toast, fetchMaterials]);

  // 删除学习资料
  const handleDeleteMaterial = useCallback(async () => {
    if (!deletingMaterial) return;
    setIsDeleting(true);
    try {
      const result = await deleteLearningMaterialAction({
        materialId: deletingMaterial._id
      });
      if (result.success) {
        toast({
          title: "删除成功",
          description: "学习资料已删除"
        });
        setIsDeleteDialogOpen(false);
        await fetchMaterials();
      } else {
        toast({
          title: "删除失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除学习资料失败:", error);
      toast({
        title: "删除失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deletingMaterial, toast, fetchMaterials]);

  // 其他处理函数
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchMaterials();
    setIsRefreshing(false);
  }, [fetchMaterials]);
  const handleResetFilters = useCallback(() => {
    setSearchText("");
    setSelectedClassId("all");
    setSelectedType("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  }, []);
  const handleSearch = useCallback(filters => {
    setSearchText(filters.searchText);
    setSelectedClassId(filters.selectedClassId);
    setSelectedType(filters.selectedType);
    setSelectedStatus(filters.selectedStatus);
    setCurrentPage(1);
  }, []);
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 初始化数据
  useEffect(() => {
    if (user?.workSetting?.currentSchool) {
      fetchClassrooms();
    }
  }, [user?.workSetting?.currentSchool, fetchClassrooms]);
  useEffect(() => {
    if (user?.workSetting?.currentSchool) {
      setIsLoading(true);
      fetchMaterials().finally(() => {
        setIsLoading(false);
      });
    }
  }, [user?.workSetting?.currentSchool, fetchMaterials]);
  if (!user?.workSetting?.currentSchool) {
    return <div className="p-6 text-center">
        <div className="text-gray-500">请先选择当前校园</div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 flex flex-col">
      <WorkHeader title="学习资料管理" showBackButton={true} backHref="/work/marketing" backText="返回营销管理" rightContent={<div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="bg-primary  text-white">
              <Plus className="h-4 w-4 mr-2" />
              新建资料
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <MaterialFilters classrooms={classrooms} searchText={searchText} selectedClassId={selectedClassId} selectedType={selectedType} selectedStatus={selectedStatus} onSearch={handleSearch} onReset={handleResetFilters} />

          {/* 数据列表 */}
          {isLoading ? <div className="text-center py-8">
              <div className="text-gray-500">加载中...</div>
            </div> : <MaterialList materials={materials} onView={material => {
          setViewingMaterial(material);
          setIsViewDialogOpen(true);
        }} onEdit={material => {
          setEditingMaterial(material);
          setIsEditDialogOpen(true);
        }} onDelete={material => {
          setDeletingMaterial(material);
          setIsDeleteDialogOpen(true);
        }} />}

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>}

          {/* 统计信息 */}
          <div className="text-center text-sm text-gray-500">
            {isLoading ? "" : <>
                共有 {totalCount} 个学习资料，当前显示第 {currentPage} 页，共{" "}
                {totalPages} 页
              </>}
          </div>
        </div>
      </main>

      {/* 模态框 */}
      <CreateMaterialDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} classrooms={classrooms} onSave={handleCreateMaterial} isSaving={isCreating} />

      <ViewMaterialDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} material={viewingMaterial} />

      <EditMaterialDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} material={editingMaterial} onSave={handleUpdateMaterial} isSaving={isSaving} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除学习资料 &ldquo;{deletingMaterial?.title}&rdquo; 吗？
              删除后将无法恢复，相关的文件也会被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMaterial} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}
