"use client";

// 班级多荣誉配置页面，批量编辑学生荣誉并批量生成记录
import { Award } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useSubjects } from "../../../../../../hooks/useAdminConfig.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { batchCreateHonorsAction, getClassStudentsAction, getHonorConfigsAction } from "./actions.js";
import BatchFillSection from "./components/BatchFillSection.js";
import MultiHonorTable from "./components/MultiHonorTable.js";
export default function MultiHonorPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classRoomId = params.id;
  const {
    toast
  } = useToast();
  const {
    subjects,
    loading: subjectsLoading
  } = useSubjects();
  const [classRoom, setClassRoom] = useState(null);
  const [students, setStudents] = useState([]);
  const [honors, setHonors] = useState([]);
  const [studentHonorData, setStudentHonorData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取数据
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 获取学生列表
      const studentsResult = await getClassStudentsAction(classRoomId);
      if (!studentsResult.success) {
        toast({
          title: "获取数据失败",
          description: studentsResult.error,
          variant: "destructive"
        });
        return;
      }
      setStudents(studentsResult.students);
      setClassRoom(studentsResult.classRoom);

      // 初始化学生荣誉数据
      const initialData = studentsResult.students.map(student => ({
        studentId: student._id,
        studentName: student.name,
        studentCode: student.studentCode || "",
        honorName: "",
        showInSchoolHonorBoard: "false",
        subject: "",
        score: "",
        examName: "",
        teacherRemark: ""
      }));
      setStudentHonorData(initialData);

      // 获取荣誉配置
      const honorsResult = await getHonorConfigsAction();
      if (honorsResult.success) {
        setHonors(honorsResult.honors);
      }
    } catch (error) {
      console.error("获取数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [classRoomId, toast]);
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // 更新学生荣誉数据
  const handleUpdateStudentHonor = useCallback((studentId, field, value) => {
    setStudentHonorData(prev => prev.map(data => data.studentId === studentId ? {
      ...data,
      [field]: value
    } : data));
  }, []);

  // 批量填写
  const handleBatchFill = useCallback((field, value) => {
    setStudentHonorData(prev => prev.map(data => ({
      ...data,
      [field]: value
    })));
  }, []);

  // 打开确认对话框
  const handleBatchCreate = useCallback(() => {
    // 检查是否有选择荣誉的学生
    const selectedCount = studentHonorData.filter(data => data.honorName).length;
    if (selectedCount === 0) {
      toast({
        title: "提示",
        description: "请至少为一个学生选择荣誉",
        variant: "destructive"
      });
      return;
    }
    setConfirmDialogOpen(true);
  }, [studentHonorData, toast]);

  // 确认批量创建荣誉
  const confirmBatchCreate = useCallback(async () => {
    setIsCreating(true);
    try {
      const result = await batchCreateHonorsAction(classRoomId, studentHonorData);
      if (result.success) {
        toast({
          title: "创建成功",
          description: `已成功为 ${result.count} 名学生创建荣誉`
        });
        // 跳转到荣誉申请列表页面
        router.push("/work/marketing/study-record/honorApplications");
      } else {
        toast({
          title: "创建失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("批量创建荣誉失败:", error);
      toast({
        title: "创建失败",
        description: "批量创建荣誉时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
      setConfirmDialogOpen(false);
    }
  }, [classRoomId, studentHonorData, toast, router]);
  if (!user || !classRoom) {
    return null;
  }

  // 计算已选择荣誉的学生数量
  const selectedCount = studentHonorData.filter(data => data.honorName).length;
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title={`${classRoom.name} - 批量添加荣誉`} showBackButton={true} backHref="/work/classroom" backText="返回班级" rightContent={<Button onClick={handleBatchCreate} size="sm" disabled={isCreating}>
            <Award className="h-4 w-4 mr-2" />
            批量创建荣誉
            {selectedCount > 0 && ` (${selectedCount})`}
          </Button>} />

      <main className="flex-1 p-6">
        <div className="container mx-auto space-y-4">
          <BatchFillSection subjects={subjects} onBatchFill={handleBatchFill} />

          <MultiHonorTable students={students} studentHonorData={studentHonorData} honors={honors} subjects={subjects} isLoading={isLoading || subjectsLoading} onUpdateStudentHonor={handleUpdateStudentHonor} />
        </div>
      </main>

      {/* 确认对话框 */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认批量创建荣誉</DialogTitle>
            <DialogDescription>
              即将为 {selectedCount} 名学生创建荣誉记录，确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={isCreating}>
              取消
            </Button>
            <Button onClick={confirmBatchCreate} disabled={isCreating}>
              {isCreating ? "创建中..." : "确认创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}
