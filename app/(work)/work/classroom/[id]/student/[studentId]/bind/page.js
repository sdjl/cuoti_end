"use client";

// 学生绑定页面，用于生成和管理学生的绑定二维码
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../../components/ui/dialog.js";
import WorkHeader from "../../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../../hooks/useAuth.js";
import { generateNormalURL } from "../../../../../../../../lib/common/qrcode.js";
import { DOMAIN } from "../../../../../../../../lib/config/constants.js";
import { deleteStudentBindPasswordAction, generateStudentBindPasswordAction, getStudentBindCountAction, getStudentBindInfoAction, getStudentBindingsInfoAction } from "./actions.js";
import BindingStatus from "./components/BindingStatus.js";
import DeleteAllBindings from "./components/DeleteAllBindings.js";
import QRCodeDisplay from "./components/QRCodeDisplay.js";
import StudentBasicInfo from "./components/StudentBasicInfo.js";
import UsageInstructions from "./components/UsageInstructions.js";

// 绑定密码有效期（天数）
export const BIND_PASSWORD_VALIDITY_DAYS = 90;
export default function BindPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classRoomId = params.id;
  const studentId = params.studentId;
  const {
    toast
  } = useToast();

  // 学生信息状态
  const [student, setStudent] = useState(null);
  const [classRoom, setClassRoom] = useState(null);
  const [bindCount, setBindCount] = useState(0);
  const [bindings, setBindings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 对话框状态
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 环境判断
  const isDevelopment = process.env.NODE_ENV === "development";

  // 检查权限并获取学生信息
  useEffect(() => {
    async function fetchStudentInfo() {
      if (!user) return;
      if (!user.workSetting?.currentSchool) {
        router.push("/work/setting/curr-school");
        return;
      }
      try {
        const {
          student: studentData,
          classRoom: classRoomData,
          error
        } = await getStudentBindInfoAction(classRoomId, studentId);
        if (error) {
          router.push(`/work/error?message=${encodeURIComponent(error)}`);
          return;
        }
        if (!studentData || !classRoomData) {
          router.push(`/work/classroom/${classRoomId}/student`);
          return;
        }
        setStudent(studentData);
        setClassRoom(classRoomData);

        // 获取绑定人数和绑定人信息
        const [bindCountResult, bindingsResult] = await Promise.all([getStudentBindCountAction(studentId), getStudentBindingsInfoAction(studentId)]);
        if (bindCountResult.success && bindCountResult.bindCount !== undefined) {
          setBindCount(bindCountResult.bindCount);
        } else {
          console.error("获取绑定人数失败:", bindCountResult.error);
          // 绑定人数获取失败不影响页面正常显示，只是不显示人数
        }
        if (bindingsResult.success && bindingsResult.bindings) {
          setBindings(bindingsResult.bindings);
        } else {
          console.error("获取绑定人信息失败:", bindingsResult.error);
          // 绑定人信息获取失败不影响页面正常显示
        }
      } catch (error) {
        console.error("获取学生信息失败:", error);
        router.push(`/work/error?message=${encodeURIComponent("获取学生信息失败")}`);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudentInfo();
  }, [user, router, classRoomId, studentId]);

  // 生成二维码URL
  const generateQRCodeURL = useCallback((studentId, bindPassword, classRoomId) => {
    const path = isDevelopment ? "/bind-dev" : "/bind";
    const baseUrl = isDevelopment ? `http://${DOMAIN.BASE}` : `https://${DOMAIN.BASE}`;
    return generateNormalURL(path, [studentId, bindPassword, classRoomId], baseUrl);
  }, [isDevelopment]);

  // 计算有效期
  const getExpiryDate = useCallback(generatedAt => {
    const expiryTime = generatedAt + BIND_PASSWORD_VALIDITY_DAYS * 24 * 60 * 60 * 1000;
    return new Date(expiryTime);
  }, []);

  // 检查是否过期
  const isExpired = useCallback(generatedAt => {
    const now = Date.now();
    const expiryTime = generatedAt + BIND_PASSWORD_VALIDITY_DAYS * 24 * 60 * 60 * 1000;
    return now > expiryTime;
  }, []);

  // 格式化日期时间
  const formatDateTime = useCallback(date => {
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }, []);

  // 生成绑定密码
  const handleGeneratePassword = useCallback(async () => {
    if (!student) return;

    // 如果已有密码，显示确认对话框
    if (student.bindPassword) {
      setRegenerateDialogOpen(true);
      return;
    }
    setIsGenerating(true);
    try {
      const {
        success,
        bindPassword,
        bindPasswordGeneratedAt,
        error
      } = await generateStudentBindPasswordAction(classRoomId, studentId);
      if (!success) {
        toast({
          title: "生成失败",
          description: error || "生成绑定密码失败",
          variant: "destructive"
        });
        return;
      }

      // 更新学生信息
      setStudent(prev => prev ? {
        ...prev,
        bindPassword,
        bindPasswordGeneratedAt
      } : null);
      toast({
        title: "生成成功",
        description: `绑定二维码已生成，有效期${BIND_PASSWORD_VALIDITY_DAYS}天`
      });
    } catch (error) {
      console.error("生成绑定密码失败:", error);
      toast({
        title: "生成失败",
        description: "生成绑定密码时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [student, classRoomId, studentId, toast]);

  // 确认重新生成
  const handleConfirmRegenerate = useCallback(async () => {
    setRegenerateDialogOpen(false);
    setIsGenerating(true);
    try {
      const {
        success,
        bindPassword,
        bindPasswordGeneratedAt,
        error
      } = await generateStudentBindPasswordAction(classRoomId, studentId);
      if (!success) {
        toast({
          title: "重新生成失败",
          description: error || "重新生成绑定密码失败",
          variant: "destructive"
        });
        return;
      }

      // 更新学生信息
      setStudent(prev => prev ? {
        ...prev,
        bindPassword,
        bindPasswordGeneratedAt
      } : null);
      toast({
        title: "重新生成成功",
        description: "旧的二维码已失效，新的绑定二维码已生成"
      });
    } catch (error) {
      console.error("重新生成绑定密码失败:", error);
      toast({
        title: "重新生成失败",
        description: "重新生成绑定密码时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [classRoomId, studentId, toast]);

  // 删除绑定密码
  const handleDeletePassword = useCallback(async () => {
    setDeleteDialogOpen(false);
    setIsDeleting(true);
    try {
      const {
        success,
        error
      } = await deleteStudentBindPasswordAction(classRoomId, studentId);
      if (!success) {
        toast({
          title: "删除失败",
          description: error || "删除绑定密码失败",
          variant: "destructive"
        });
        return;
      }

      // 更新学生信息
      setStudent(prev => prev ? {
        ...prev,
        bindPassword: undefined,
        bindPasswordGeneratedAt: undefined
      } : null);
      toast({
        title: "删除成功",
        description: "绑定二维码已删除"
      });
    } catch (error) {
      console.error("删除绑定密码失败:", error);
      toast({
        title: "删除失败",
        description: "删除绑定密码时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  }, [classRoomId, studentId, toast]);
  if (!user || isLoading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="学生绑定" showBackButton={true} backHref={`/work/classroom/${classRoomId}/student`} backText="返回学生列表" />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="text-center py-8">加载中...</div>
          </div>
        </main>
      </div>;
  }
  if (!student || !classRoom) {
    return null;
  }
  const isPasswordExpired = student.bindPasswordGeneratedAt ? isExpired(student.bindPasswordGeneratedAt) : false;
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <WorkHeader title={`学生绑定 - ${student.name} (${classRoom.name})`} showBackButton={true} backHref={`/work/classroom/${classRoomId}/student`} backText="返回学生列表" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* 左侧：信息和操作区，占60%宽度 */}
            <div className="col-span-3 space-y-6">
              {/* 学生基本信息 */}
              <StudentBasicInfo student={student} classRoom={classRoom} bindCount={bindCount} bindings={bindings} />

              {/* 绑定状态和使用说明 - 同一行显示 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BindingStatus student={student} isGenerating={isGenerating} isDeleting={isDeleting} isExpired={isPasswordExpired} formatDateTime={formatDateTime} getExpiryDate={getExpiryDate} onGeneratePassword={handleGeneratePassword} onDeletePassword={() => setDeleteDialogOpen(true)} />
                <UsageInstructions />
              </div>
            </div>

            {/* 右侧：二维码显示区和危险操作区，占40%宽度 */}
            <div className="col-span-2 space-y-6">
              <QRCodeDisplay student={student} classRoom={classRoom} generateQRCodeURL={generateQRCodeURL} formatDateTime={formatDateTime} getExpiryDate={getExpiryDate} isExpired={isPasswordExpired} />
              <DeleteAllBindings student={student} classRoomId={classRoomId} />
            </div>
          </div>
        </div>
      </main>

      {/* 重新生成确认对话框 */}
      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重新生成绑定二维码</DialogTitle>
            <DialogDescription>
              重新生成二维码后，旧的二维码将立即失效。是否确认重新生成？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmRegenerate} disabled={isGenerating}>
              {isGenerating ? "生成中..." : "确认重新生成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除绑定二维码</DialogTitle>
            <DialogDescription>
              删除后，学生将无法使用当前二维码进行绑定。是否确认删除？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeletePassword} disabled={isDeleting} className="text-white">
              {isDeleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}
