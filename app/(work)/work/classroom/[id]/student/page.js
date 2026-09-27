"use client";

// 班级学生管理页面，展示班级学生列表并提供筛选、编辑、删除、批量导入等功能
import { RefreshCw, Settings, Trash2, Upload, UserPlus, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ClassroomStudentFilters from "./components/ClassroomStudentFilters.js";
import ClassroomStudentList from "./components/ClassroomStudentList.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { getClassRoomInfoAction, getClassStudentsAction, getClassSubjectsAction, getStudentsBindCountsAction, getStudentsBindingsInfoAction, removeStudentFromClassAction, removeStudentsFromClassAction, updateClassNotesAction, updateStudentNotesAction } from "./actions.js";
import { filterStudents } from "./clientActions.js";
export default function ClassroomStudentPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classRoomId = params.id;
  const {
    toast
  } = useToast();
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [classRoom, setClassRoom] = useState(null);
  const [bindCounts, setBindCounts] = useState({});
  const [bindingsInfo, setBindingsInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  // 新增：编辑按钮显示控制状态
  const [showEditButtons, setShowEditButtons] = useState(false);

  // 新增：班级科目状态
  const [subjects, setSubjects] = useState([]);

  // 选择状态
  const [selectedStudents, setSelectedStudents] = useState([]);

  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedNotesFilter, setSelectedNotesFilter] = useState("all");
  const [selectedSortBy, setSelectedSortBy] = useState("studentCode");
  const [selectedSortOrder, setSelectedSortOrder] = useState("asc");

  // 当前用户是否是校长（预留给后续使用）
  // const userIsPrincipal = isPrincipal();

  // 检查当前校园和权限
  useEffect(() => {
    async function checkPermissions() {
      if (!user) return;
      if (!user.workSetting?.currentSchool) {
        router.push("/work/setting/curr-school");
        return;
      }
      try {
        // 获取班级信息并验证权限
        const {
          classRoom: classRoomData,
          error
        } = await getClassRoomInfoAction(classRoomId);
        if (error) {
          router.push(`/work/error?message=${encodeURIComponent(error)}`);
          return;
        }
        setClassRoom(classRoomData);
      } catch (error) {
        console.error("检查权限失败:", error);
        router.push(`/work/error?message=${encodeURIComponent("检查权限失败")}`);
      }
    }
    checkPermissions();
  }, [user, router, classRoomId]);

  // 获取所有学生数据（仅在初始加载和刷新时调用）
  const fetchAllStudents = useCallback(async () => {
    if (!classRoom) return;
    setIsLoading(true);
    try {
      const studentsData = await getClassStudentsAction(classRoomId);
      setAllStudents(studentsData);
      // 初始加载时先显示所有数据，后续会通过 useEffect 触发过滤
      setFilteredStudents(studentsData);

      // 获取所有学生的绑定人数和绑定人信息
      if (studentsData.length > 0) {
        const studentIds = studentsData.map(s => s._id);
        const [counts, bindingsInfoData] = await Promise.all([getStudentsBindCountsAction(classRoomId, studentIds), getStudentsBindingsInfoAction(classRoomId, studentIds)]);
        setBindCounts(counts);
        setBindingsInfo(bindingsInfoData);
      }
    } catch (error) {
      console.error("获取学生数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取学生数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [classRoomId, classRoom, toast]);

  // 新增：获取班级科目信息
  const fetchClassSubjects = useCallback(async () => {
    try {
      const {
        subjects: subjectsData,
        error
      } = await getClassSubjectsAction(classRoomId);
      if (error) {
        console.error("获取班级科目失败:", error);
      } else {
        setSubjects(subjectsData);
      }
    } catch (error) {
      console.error("获取班级科目失败:", error);
    }
  }, [classRoomId]);

  // 过滤学生数据（使用缓存的数据）
  const filterStudentsData = useCallback(() => {
    if (allStudents.length === 0) return;
    console.log("开始过滤学生数据:", {
      allStudentsCount: allStudents.length,
      selectedGender,
      selectedStatus,
      selectedNotesFilter,
      selectedSortBy,
      selectedSortOrder,
      searchTerm
    });
    setIsFiltering(true);
    try {
      const filteredStudents = filterStudents(allStudents, searchTerm, selectedGender, selectedStatus, selectedNotesFilter, selectedSortBy, selectedSortOrder);
      console.log("过滤完成:", {
        originalCount: allStudents.length,
        filteredCount: filteredStudents.length
      });
      setFilteredStudents(filteredStudents);
    } catch (error) {
      console.error("过滤学生数据失败:", error);
      toast({
        title: "过滤失败",
        description: "过滤学生数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsFiltering(false);
    }
  }, [allStudents, searchTerm, selectedGender, selectedStatus, selectedNotesFilter, selectedSortBy, selectedSortOrder, toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await Promise.all([fetchAllStudents(), fetchClassSubjects()]);
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAllStudents, fetchClassSubjects]);

  // 当班级信息加载完成后，获取学生数据
  useEffect(() => {
    if (classRoom) {
      fetchAllData(false);
    }
  }, [classRoom, fetchAllData]);

  // 当筛选条件变化时，过滤数据
  useEffect(() => {
    if (allStudents.length > 0) {
      filterStudentsData();
    }
  }, [searchTerm, selectedGender, selectedStatus, selectedNotesFilter, selectedSortBy, selectedSortOrder, filterStudentsData, allStudents]);

  // 当过滤结果变化时，清理不存在的选择
  useEffect(() => {
    const currentStudentIds = filteredStudents.map(student => student._id);
    setSelectedStudents(prev => prev.filter(id => currentStudentIds.includes(id)));
  }, [filteredStudents]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedGender("all");
    setSelectedStatus("all");
    setSelectedNotesFilter("all");
    setSelectedSortBy("studentCode");
    setSelectedSortOrder("asc");
  }, []);

  // 处理编辑学生
  const handleEditStudent = useCallback(studentId => {
    router.push(`/work/classroom/${classRoomId}/student/edit?studentId=${studentId}`);
  }, [router, classRoomId]);

  // 处理查看答卷
  const handleViewAnswers = useCallback(studentId => {
    router.push(`/work/classroom/${classRoomId}/student/${studentId}/answers`);
  }, [router, classRoomId]);

  // 处理添加学生
  const handleAddStudent = useCallback(() => {
    router.push(`/work/classroom/${classRoomId}/student/add`);
  }, [classRoomId, router]);

  // 处理批量添加学生
  const handleMultiAdd = useCallback(() => {
    router.push(`/work/classroom/${classRoomId}/student/multi-add`);
  }, [classRoomId, router]);

  // 处理批量导入学生
  const handleBatchImport = useCallback(() => {
    router.push(`/work/classroom/${classRoomId}/student/import`);
  }, [classRoomId, router]);

  // 新增：切换编辑按钮显示状态
  const handleToggleEditButtons = useCallback(() => {
    setShowEditButtons(prev => !prev);
  }, []);

  // 处理学生选择
  const handleSelectStudent = useCallback((studentId, checked) => {
    setSelectedStudents(prev => {
      if (checked) {
        return [...prev, studentId];
      } else {
        return prev.filter(id => id !== studentId);
      }
    });
  }, []);

  // 处理全选
  const handleSelectAll = useCallback(checked => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(student => student._id));
    } else {
      setSelectedStudents([]);
    }
  }, [filteredStudents]);

  // 处理删除单个学生
  const handleDeleteStudent = useCallback(studentId => {
    setStudentToDelete(studentId);
    setDeleteDialogOpen(true);
  }, []);

  // 确认删除单个学生
  const confirmDeleteStudent = useCallback(async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      const result = await removeStudentFromClassAction(studentToDelete, classRoomId);
      if (result.success) {
        toast({
          title: "删除成功",
          description: "学生已从班级中移除"
        });
        // 刷新数据
        await fetchAllData(false);
        // 清空选择
        setSelectedStudents([]);
      } else {
        toast({
          title: "删除失败",
          description: result.error || "删除学生时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除学生失败:", error);
      toast({
        title: "删除失败",
        description: "删除学生时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  }, [studentToDelete, classRoomId, toast, fetchAllData]);

  // 处理批量删除
  const handleBatchDelete = useCallback(() => {
    if (selectedStudents.length === 0) return;
    setBatchDeleteDialogOpen(true);
  }, [selectedStudents]);

  // 确认批量删除
  const confirmBatchDelete = useCallback(async () => {
    if (selectedStudents.length === 0) return;
    setIsDeleting(true);
    try {
      const result = await removeStudentsFromClassAction(selectedStudents, classRoomId);
      if (result.success) {
        toast({
          title: "批量删除成功",
          description: `已成功移除 ${result.removedCount} 名学生`
        });
        // 刷新数据
        await fetchAllData(false);
        // 清空选择
        setSelectedStudents([]);
      } else {
        toast({
          title: "批量删除失败",
          description: result.error || "批量删除学生时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("批量删除学生失败:", error);
      toast({
        title: "批量删除失败",
        description: "批量删除学生时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setBatchDeleteDialogOpen(false);
    }
  }, [selectedStudents, classRoomId, toast, fetchAllData]);

  // 处理更新学生备注
  const handleUpdateStudentNotes = useCallback(async (studentId, notes) => {
    const {
      success,
      error
    } = await updateStudentNotesAction(classRoomId, studentId, notes);
    if (!success) {
      throw new Error(error || "更新学生备注失败");
    }

    // 刷新数据
    await fetchAllData(false);
  }, [classRoomId, fetchAllData]);

  // 处理更新班级备注
  const handleUpdateClassNotes = useCallback(async (studentId, notes) => {
    const {
      success,
      error
    } = await updateClassNotesAction(classRoomId, studentId, notes);
    if (!success) {
      throw new Error(error || "更新班级备注失败");
    }

    // 刷新数据
    await fetchAllData(false);
  }, [classRoomId, fetchAllData]);
  if (!user || !classRoom) {
    return null;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <WorkHeader title={`${classRoom.name} - 学生管理`} showBackButton={true} backHref="/work/classroom" backText="返回班级" rightContent={<div className="flex items-center space-x-2">
            {selectedStudents.length > 0 && <Button onClick={handleBatchDelete} disabled={isDeleting} size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                <Trash2 className="h-4 w-4 mr-2" />
                全部删除 ({selectedStudents.length})
              </Button>}
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新
            </Button>
            <Button onClick={handleToggleEditButtons} variant={showEditButtons ? "default" : "outline"} size="sm">
              <Settings className="h-4 w-4 mr-2" />
              {showEditButtons ? "隐藏编辑" : "显示编辑"}
            </Button>
            <Button onClick={handleAddStudent} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              添加学生
            </Button>
            <Button onClick={handleMultiAdd} size="sm" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              批量添加学生
            </Button>
            <Button onClick={handleBatchImport} size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              批量导入学生
            </Button>
          </div>} />
      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 筛选器 */}
          <ClassroomStudentFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedGender={selectedGender} setSelectedGender={setSelectedGender} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} selectedNotesFilter={selectedNotesFilter} setSelectedNotesFilter={setSelectedNotesFilter} selectedSortBy={selectedSortBy} setSelectedSortBy={setSelectedSortBy} selectedSortOrder={selectedSortOrder} setSelectedSortOrder={setSelectedSortOrder} onReset={handleResetFilters} />

          {/* 学生列表 */}
          <ClassroomStudentList students={filteredStudents} isLoading={isLoading || isFiltering} classRoomId={classRoomId} onEditStudent={handleEditStudent} onDeleteStudent={handleDeleteStudent} onViewAnswers={handleViewAnswers} selectedStudents={selectedStudents} onSelectStudent={handleSelectStudent} onSelectAll={handleSelectAll} showEditButtons={showEditButtons} subjects={subjects} bindCounts={bindCounts} bindingsInfo={bindingsInfo} onUpdateStudentNotes={handleUpdateStudentNotes} onUpdateClassNotes={handleUpdateClassNotes} />
        </div>
      </main>

      {/* 删除单个学生确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除学生</DialogTitle>
            <DialogDescription>
              确定要将该学生从班级中移除吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              取消
            </Button>
            <Button onClick={confirmDeleteStudent} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 text-white">
              {isDeleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量删除确认对话框 */}
      <Dialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认批量删除学生</DialogTitle>
            <DialogDescription>
              确定要将选中的 {selectedStudents.length}{" "}
              名学生从班级中移除吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDeleteDialogOpen(false)} disabled={isDeleting}>
              取消
            </Button>
            <Button onClick={confirmBatchDelete} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 text-white">
              {isDeleting ? "删除中..." : `确认删除 ${selectedStudents.length} 名学生`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}
