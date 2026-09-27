"use client";

// 编辑学生页面，用于修改学生基本信息和班级关系信息
import { Save } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../hooks/useAuth.js";
import { getClassRoomInfoAction, getStudentWithClassInfoAction, updateStudentAndClassInfoAction } from "./actions.js";
import { ClassRelationForm } from "./components/ClassRelationForm.js";
import { StudentBasicInfoForm } from "./components/StudentBasicInfoForm.js";
export default function EditStudentPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const classRoomId = params.id;
  const studentId = searchParams.get("studentId");
  const {
    toast
  } = useToast();

  // 班级信息
  const [classRoom, setClassRoom] = useState(null);

  // 学生信息
  const [studentData, setStudentData] = useState({
    studentCode: "",
    name: "",
    birthDate: "",
    ethnicity: "汉",
    homeAddress: "",
    gender: "未知",
    publicSchoolName: "",
    contactPhones: "",
    notes: ""
  });

  // 班级关系信息
  const [classRelationData, setClassRelationData] = useState({
    notes: "",
    status: "在读"
  });

  // 加载和保存状态
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 检查参数和权限
  useEffect(() => {
    async function checkPermissions() {
      if (!user) return;
      if (!user.workSetting?.currentSchool) {
        router.push("/work/setting/curr-school");
        return;
      }
      if (!studentId) {
        router.push(`/work/classroom/${classRoomId}/student`);
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

        // 获取学生和班级关系信息
        const {
          student,
          studentClass,
          error: studentError
        } = await getStudentWithClassInfoAction(classRoomId, studentId);
        if (studentError) {
          router.push(`/work/error?message=${encodeURIComponent(studentError)}`);
          return;
        }
        if (!student || !studentClass) {
          router.push(`/work/classroom/${classRoomId}/student`);
          return;
        }

        // 设置学生数据
        setStudentData({
          studentCode: student.studentCode,
          name: student.name,
          birthDate: student.birthDate,
          ethnicity: student.ethnicity,
          homeAddress: student.homeAddress,
          gender: student.gender,
          publicSchoolName: student.publicSchoolName || "",
          contactPhones: student.contactPhones?.join(" ") || "",
          // 将数组转换为空格分隔的字符串
          notes: student.notes || ""
        });

        // 设置班级关系数据
        setClassRelationData({
          notes: studentClass.notes || "",
          status: studentClass.status
        });
      } catch (error) {
        console.error("检查权限失败:", error);
        router.push(`/work/error?message=${encodeURIComponent("检查权限失败")}`);
      } finally {
        setIsLoading(false);
      }
    }
    checkPermissions();
  }, [user, router, classRoomId, studentId]);

  // 处理学生数据变化
  const handleStudentDataChange = useCallback((field, value) => {
    setStudentData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // 处理班级关系数据变化
  const handleClassRelationDataChange = useCallback((field, value) => {
    setClassRelationData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // 保存修改
  const handleSave = useCallback(async () => {
    if (!studentId) return;

    // 验证必填字段
    if (!studentData.studentCode.trim()) {
      toast({
        title: "请输入学生编号",
        variant: "destructive"
      });
      return;
    }
    if (!studentData.name.trim()) {
      toast({
        title: "请输入学生姓名",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      // 处理联系电话：将空格分隔的字符串转换为数组
      const contactPhonesArray = studentData.contactPhones.trim().split(/\s+/).filter(phone => phone.length > 0);
      const {
        success,
        error
      } = await updateStudentAndClassInfoAction(classRoomId, studentId, {
        ...studentData,
        studentCode: studentData.studentCode.trim(),
        name: studentData.name.trim(),
        homeAddress: studentData.homeAddress.trim(),
        ethnicity: studentData.ethnicity.trim(),
        publicSchoolName: studentData.publicSchoolName.trim() || undefined,
        contactPhones: contactPhonesArray.length > 0 ? contactPhonesArray : undefined,
        notes: studentData.notes.trim() || undefined
      }, {
        notes: classRelationData.notes.trim() || undefined,
        status: classRelationData.status
      });
      if (!success) {
        toast({
          title: "保存失败",
          description: error || "保存学生信息失败",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "保存成功",
        description: "学生信息已成功更新"
      });

      // 跳转回学生列表页面
      router.push(`/work/classroom/${classRoomId}/student`);
    } catch (error) {
      console.error("保存学生信息失败:", error);
      toast({
        title: "保存失败",
        description: "保存学生信息时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [studentId, classRoomId, studentData, classRelationData, toast, router]);
  if (!user || isLoading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="编辑学生" showBackButton={true} backHref={`/work/classroom/${classRoomId}/student`} backText="返回学生列表" />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="text-center py-8">加载中...</div>
          </div>
        </main>
      </div>;
  }
  if (!classRoom) {
    return null;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <WorkHeader title={`编辑学生 - ${classRoom.name}`} showBackButton={true} backHref={`/work/classroom/${classRoomId}/student`} backText="返回学生列表" rightContent={null} />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-4xl space-y-6">
          {/* 学生基本信息 */}
          <StudentBasicInfoForm studentData={studentData} onStudentDataChange={handleStudentDataChange} />

          {/* 班级关系信息 */}
          <ClassRelationForm classRelationData={classRelationData} onClassRelationDataChange={handleClassRelationDataChange} />

          {/* 保存按钮 */}
          <div className="flex justify-center pt-6">
            <Button onClick={handleSave} disabled={isSaving} size="lg" className="px-8">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "保存中..." : "保存修改"}
            </Button>
          </div>
        </div>
      </main>
    </div>;
}
