"use client";

// 班级管理页面，用于查看、添加、编辑和删除班级，以及管理班级教师队伍
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ClassRoomDialog from "./components/ClassRoomDialog.js";
import ClassRoomFilters from "./components/ClassRoomFilters.js";
import ClassRoomList from "./components/ClassRoomList.js";
import { CustomPagination } from "../../../../../components/common/Pagination.js";
import { Button } from "../../../../../components/ui/button.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { createClassRoomAction, deleteClassRoomAction, getClassRoomByIdAction, getClassRoomsAction, getClassRoomsCountAction, updateClassRoomAction } from "./actions.js";

// 每页显示的班级数量
const PAGE_SIZE = 20;
export default function ClassRoomPage() {
  const {
    user,
    isPrincipal
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [classRooms, setClassRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClassRoom, setEditingClassRoom] = useState(null);

  // 当前用户是否是校长
  const userIsPrincipal = isPrincipal();

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取班级数据
  const fetchClassRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = searchTerm.trim();
      const status = selectedStatus !== "all" ? selectedStatus : "all";
      const grade = selectedGrade !== "all" ? selectedGrade : "all";

      // 注意：API调用中pageNum应从0开始，而展示给用户的页码从1开始
      const pageNum = currentPage - 1;
      const [classRoomsData, count] = await Promise.all([getClassRoomsAction({
        pageNum,
        pageSize: PAGE_SIZE,
        keyword,
        status,
        grade
      }), getClassRoomsCountAction({
        keyword,
        status,
        grade
      })]);
      setClassRooms(classRoomsData);
      setTotalCount(count);
    } catch (error) {
      console.error("获取班级数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取班级数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedStatus, selectedGrade, currentPage, toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchClassRooms();
    } catch (error) {
      console.error("获取班级数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchClassRooms]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 当筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedGrade]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedGrade("all");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 处理添加班级
  const handleAddClassRoom = useCallback(() => {
    if (!userIsPrincipal) {
      return;
    }
    setEditingClassRoom(null);
    setDialogOpen(true);
  }, [userIsPrincipal]);

  // 处理编辑班级
  const handleEditClassRoom = useCallback(async classRoomId => {
    if (!userIsPrincipal) {
      return;
    }
    try {
      const {
        classRoom,
        error
      } = await getClassRoomByIdAction(classRoomId);
      if (error) {
        toast({
          title: "获取班级信息失败",
          description: error,
          variant: "destructive"
        });
        return;
      }
      setEditingClassRoom(classRoom);
      setDialogOpen(true);
    } catch (error) {
      console.error("获取班级信息失败:", error);
      toast({
        title: "获取班级信息失败",
        description: "获取班级信息时发生错误",
        variant: "destructive"
      });
    }
  }, [userIsPrincipal, toast]);

  // 处理编辑教师队伍
  const handleEditTeachers = useCallback(classRoomId => {
    if (!userIsPrincipal) {
      return;
    }
    // 在新窗口打开教师队伍编辑页面
    window.open(`/work/school/classroom/${classRoomId}/teacher`, "_blank");
  }, [userIsPrincipal]);

  // 处理删除班级
  const handleDeleteClassRoom = useCallback(async classRoomId => {
    if (!userIsPrincipal) {
      console.log("非校长用户，无法删除班级");
      return;
    }

    // 找到要删除的班级
    const classRoom = classRooms.find(c => c._id === classRoomId);
    if (!classRoom) {
      toast({
        title: "删除失败",
        description: "找不到要删除的班级",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        success,
        error
      } = await deleteClassRoomAction(classRoomId);
      if (error) {
        toast({
          title: "删除失败",
          description: error,
          variant: "destructive"
        });
        return;
      }
      if (success) {
        toast({
          title: "删除成功",
          description: `已成功删除班级 "${classRoom.name}"`
        });

        // 重新加载数据
        await fetchAllData(false);
      }
    } catch (error) {
      console.error("删除班级失败:", error);
      toast({
        title: "删除失败",
        description: "删除班级时发生错误",
        variant: "destructive"
      });
    }
  }, [userIsPrincipal, classRooms, toast, fetchAllData]);

  // 处理保存班级
  const handleSaveClassRoom = useCallback(async classRoomData => {
    try {
      if (editingClassRoom) {
        // 编辑班级
        const {
          success,
          error
        } = await updateClassRoomAction(editingClassRoom._id, classRoomData);
        if (error) {
          toast({
            title: "更新班级失败",
            description: error,
            variant: "destructive"
          });
          return;
        }
        if (success) {
          toast({
            title: "更新成功",
            description: `班级 "${classRoomData.name}" 已成功更新`
          });
        }
      } else {
        // 添加班级
        const {
          success,
          error
        } = await createClassRoomAction({
          ...classRoomData,
          teacherOpenids: [] // 新建班级时初始化为空数组
        });
        if (error) {
          toast({
            title: "创建班级失败",
            description: error,
            variant: "destructive"
          });
          return;
        }
        if (success) {
          toast({
            title: "创建成功",
            description: `班级 "${classRoomData.name}" 已成功创建`
          });
        }
      }

      // 重新加载数据
      await fetchAllData(false);
    } catch (error) {
      console.error("保存班级失败:", error);
      toast({
        title: "保存失败",
        description: "保存班级时发生错误",
        variant: "destructive"
      });
    }
  }, [editingClassRoom, toast, fetchAllData]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="班级管理" showBackButton={true} backHref="/work/school" backText="返回校园" rightContent={<>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
            {userIsPrincipal && <Button size="sm" onClick={handleAddClassRoom} className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                添加班级
              </Button>}
          </>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <ClassRoomFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} selectedGrade={selectedGrade} setSelectedGrade={setSelectedGrade} onReset={handleResetFilters} />

          {/* 班级列表 */}
          <ClassRoomList classRooms={classRooms} isLoading={isLoading} isPrincipal={userIsPrincipal} onEditClassRoom={handleEditClassRoom} onDeleteClassRoom={handleDeleteClassRoom} onEditTeachers={handleEditTeachers} />

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="classroom_page" />
            </div>}

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共找到{" "}
                <span className="font-medium text-gray-900">{totalCount}</span>{" "}
                个班级
              </div>
              <div className="text-sm text-gray-500">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 班级对话框 */}
      <ClassRoomDialog open={dialogOpen} onOpenChange={setDialogOpen} classRoom={editingClassRoom} onSave={handleSaveClassRoom} />
    </div>;
}
