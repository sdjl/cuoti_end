/**
 * 学情记录页面
 *
 * 支持通过 URL 参数 studentId 查询指定学生的数据
 * 例如: /work/marketing/study-record/studyRecords?studentId=xxx
 */
"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { createStudyRecordAction, deleteStudyRecordAction, deleteStudyRecordImageAction, getAvailableClassroomsAction, getStudyRecordByIdAction, getStudyRecordsAction, searchStudentsInClassAction, updateStudyRecordContentAction, uploadStudyRecordImageAction } from "./actions.js";
import CreateStudyRecordDialog from "./components/CreateStudyRecordDialog.js";
import CustomPagination from "./components/CustomPagination.js";
import EditStudyRecordDialog from "./components/EditStudyRecordDialog.js";
import StudyRecordFilters from "./components/StudyRecordFilters.js";
import StudyRecordList from "./components/StudyRecordList.js";
import ViewStudyRecordDialog from "./components/ViewStudyRecordDialog.js";
const PAGE_SIZE = 20;
export default function StudyRecordsPage() {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const searchParams = useSearchParams();
  const studentIdFromUrl = searchParams.get("studentId");

  // 数据状态
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);

  // 班级数据
  const [classrooms, setClassrooms] = useState([]);

  // 过滤器状态
  const [searchContent, setSearchContent] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [targetStudentId, setTargetStudentId] = useState(null);

  // 模态框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);
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

  // 获取学情记录数据
  const fetchRecords = useCallback(async () => {
    if (!user?.workSetting?.currentSchool) {
      return;
    }
    if (classrooms.length === 0) {
      return;
    }
    const classIds = classrooms.map(c => c._id);
    try {
      const result = await getStudyRecordsAction({
        classIds,
        page: currentPage,
        pageSize: PAGE_SIZE,
        selectedClassId,
        searchContent,
        studentSearch,
        targetStudentId
      });
      if (result.success) {
        setRecords(result.data);
        setTotalCount(result.totalCount);
      } else {
        toast({
          title: "获取学情记录失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("获取学情记录失败:", error);
      toast({
        title: "获取学情记录失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  }, [user?.workSetting?.currentSchool, classrooms, currentPage, selectedClassId, searchContent, studentSearch, targetStudentId, toast]);

  // 搜索学生
  const handleSearchStudent = useCallback(async (classId, searchText) => {
    try {
      const result = await searchStudentsInClassAction({
        classId,
        searchText
      });
      return result.success ? result.students : [];
    } catch (error) {
      console.error("搜索学生失败:", error);
      return [];
    }
  }, []);

  // 创建学情记录
  const handleCreateRecord = useCallback(async data => {
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
      const result = await createStudyRecordAction({
        schoolId: user.workSetting.currentSchool._id,
        ...data
      });
      if (result.success) {
        toast({
          title: "创建成功",
          description: "学情记录已创建"
        });
        setIsCreateDialogOpen(false);
        await fetchRecords();
      } else {
        toast({
          title: "创建失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("创建学情记录失败:", error);
      toast({
        title: "创建失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  }, [user?.workSetting?.currentSchool?._id, toast, fetchRecords]);

  // 更新记录内容
  const handleUpdateContent = useCallback(async content => {
    if (!editingRecord) return;
    setIsSaving(true);
    try {
      const result = await updateStudyRecordContentAction({
        recordId: editingRecord._id,
        content
      });
      if (result.success) {
        toast({
          title: "更新成功",
          description: "记录内容已更新"
        });
        setIsEditDialogOpen(false);
        await fetchRecords();
      } else {
        toast({
          title: "更新失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("更新记录内容失败:", error);
      toast({
        title: "更新失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [editingRecord, toast, fetchRecords]);

  // 删除记录
  const handleDeleteRecord = useCallback(async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      const result = await deleteStudyRecordAction({
        recordId: deletingRecord._id
      });
      if (result.success) {
        toast({
          title: "删除成功",
          description: "学情记录已删除"
        });
        setIsDeleteDialogOpen(false);
        await fetchRecords();
      } else {
        toast({
          title: "删除失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除学情记录失败:", error);
      toast({
        title: "删除失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deletingRecord, toast, fetchRecords]);

  // 上传图片
  const handleUploadImage = useCallback(async file => {
    if (!editingRecord) return;
    setIsUploading(true);
    try {
      const result = await uploadStudyRecordImageAction({
        recordId: editingRecord._id,
        file,
        studentId: editingRecord.studentId
      });
      if (result.success) {
        toast({
          title: "图片上传成功",
          description: "图片已保存"
        });
        // 刷新数据以显示新的图片
        await fetchRecords();
        // 重新获取编辑中的记录数据
        const updatedRecord = await getStudyRecordByIdAction({
          recordId: editingRecord._id
        });
        if (updatedRecord.success && updatedRecord.record) {
          setEditingRecord({
            ...editingRecord,
            ...updatedRecord.record
          });
        }
      } else {
        toast({
          title: "图片上传失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("上传图片失败:", error);
      toast({
        title: "图片上传失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [editingRecord, toast, fetchRecords]);

  // 删除图片
  const handleDeleteImage = useCallback(async imageFileID => {
    if (!editingRecord) return;
    try {
      const result = await deleteStudyRecordImageAction({
        recordId: editingRecord._id,
        imageFileID
      });
      if (result.success) {
        toast({
          title: "图片删除成功",
          description: "图片已删除"
        });
        // 刷新数据
        await fetchRecords();
        // 重新获取编辑中的记录数据
        const updatedRecord = await getStudyRecordByIdAction({
          recordId: editingRecord._id
        });
        if (updatedRecord.success && updatedRecord.record) {
          setEditingRecord({
            ...editingRecord,
            ...updatedRecord.record
          });
        }
      } else {
        toast({
          title: "图片删除失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除图片失败:", error);
      toast({
        title: "图片删除失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  }, [editingRecord, toast, fetchRecords]);

  // 其他处理函数
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchRecords();
    setIsRefreshing(false);
  }, [fetchRecords]);
  const handleResetFilters = useCallback(() => {
    setSearchContent("");
    setStudentSearch("");
    setSelectedClassId("all");
    setCurrentPage(1);
  }, []);
  const handleSearch = useCallback(filters => {
    setSearchContent(filters.searchContent);
    setStudentSearch(filters.studentSearch);
    setSelectedClassId(filters.selectedClassId);
    setCurrentPage(1);
  }, []);
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 初始化数据
  // 初始化URL参数中的学生ID
  useEffect(() => {
    if (studentIdFromUrl) {
      setTargetStudentId(studentIdFromUrl);
    }
  }, [studentIdFromUrl]);
  useEffect(() => {
    if (user?.workSetting?.currentSchool) {
      fetchClassrooms();
    }
  }, [user?.workSetting?.currentSchool, fetchClassrooms]);
  useEffect(() => {
    if (classrooms.length > 0) {
      setIsLoading(true);
      fetchRecords().finally(() => {
        setIsLoading(false);
      });
    }
  }, [classrooms, fetchRecords]);
  if (!user?.workSetting?.currentSchool) {
    return <div className="p-6 text-center">
        <div className="text-gray-500">请先选择当前校园</div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 flex flex-col">
      <WorkHeader title="学情记录管理" showBackButton={true} backHref="/work/marketing" backText="返回营销管理" rightContent={<div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              新建记录
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <StudyRecordFilters classrooms={classrooms} searchContent={searchContent} studentSearch={studentSearch} selectedClassId={selectedClassId} onSearch={handleSearch} onReset={handleResetFilters} />

          {/* 数据列表 */}
          {isLoading ? <div className="text-center py-8">
              <div className="text-gray-500">加载中...</div>
            </div> : <StudyRecordList records={records} onView={record => {
          setViewingRecord(record);
          setIsViewDialogOpen(true);
        }} onEdit={record => {
          setEditingRecord(record);
          setIsEditDialogOpen(true);
        }} onDelete={record => {
          setDeletingRecord(record);
          setIsDeleteDialogOpen(true);
        }} />}

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>}

          {/* 统计信息 */}
          <div className="text-center text-sm text-gray-500">
            {isLoading ? "" : <>
                共有 {totalCount} 条学情记录，当前显示第 {currentPage} 页，共{" "}
                {totalPages} 页
              </>}
          </div>
        </div>
      </main>

      {/* 模态框 */}
      <CreateStudyRecordDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} classrooms={classrooms} onSearchStudent={handleSearchStudent} onSave={handleCreateRecord} isSaving={isCreating} />

      <ViewStudyRecordDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} record={viewingRecord} />

      <EditStudyRecordDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} record={editingRecord} onSave={handleUpdateContent} onUploadImage={handleUploadImage} onDeleteImage={handleDeleteImage} isSaving={isSaving} isUploading={isUploading} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除学生 {deletingRecord?.student?.name} 的学情记录吗？
              删除后将无法恢复，相关的图片也会被删除，学生积分会被相应调整。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}
