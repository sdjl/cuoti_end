"use client";

import { Save, Shield, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
// 编辑教师页面，用于修改教师的基本信息和特殊权限设置
import { useEffect, useState } from "react";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../../components/ui/checkbox.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../hooks/useAuth.js";
import { getTeacherInfo, updateTeacherInfo, updateTeacherSpecialFlags } from "./actions.js";
export default function EditTeacherPage() {
  const {
    user,
    loading,
    error,
    isPrincipal
  } = useAuth();
  const {
    toast
  } = useToast();
  const router = useRouter();
  const params = useParams();
  const teacherId = params.id;
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    remark: ""
  });

  // 特殊身份标识状态
  const [isWorkAssistant, setIsWorkAssistant] = useState(false);

  // 检查权限
  useEffect(() => {
    if (loading) return;
    if (error || !user) {
      router.push("/work/setting/curr-school");
      return;
    }
    if (!user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
    if (!isPrincipal()) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [loading, error, user, isPrincipal]);

  // 加载教师信息
  useEffect(() => {
    const loadTeacherInfo = async () => {
      if (!teacherId) {
        toast({
          title: "参数错误",
          description: "缺少教师ID参数",
          variant: "destructive"
        });
        router.push("/work/school/teacher");
        return;
      }
      try {
        setPageLoading(true);
        const result = await getTeacherInfo(teacherId);
        if (result.error) {
          toast({
            title: "加载失败",
            description: result.error,
            variant: "destructive"
          });
          router.push("/work/school/teacher");
          return;
        }
        if (result.teacher) {
          setTeacherInfo(result.teacher);
          setFormData({
            name: result.teacher.userInfo?.name || "",
            gender: result.teacher.userInfo?.gender || "",
            phone: result.teacher.userInfo?.phone || "",
            email: result.teacher.userInfo?.email || "",
            address: result.teacher.userInfo?.address || "",
            remark: result.teacher.userInfo?.remark || ""
          });
          setIsWorkAssistant(result.teacher.isWorkAssistant || false);
        }
      } catch (error) {
        console.error("加载教师信息失败:", error);
        toast({
          title: "加载失败",
          description: "无法加载教师信息，请刷新页面重试",
          variant: "destructive"
        });
        router.push("/work/school/teacher");
      } finally {
        setPageLoading(false);
      }
    };
    if (!loading && user && user.workSetting?.currentSchool && isPrincipal() && teacherId) {
      loadTeacherInfo();
    }
  }, [teacherId, loading, user?.workSetting?.currentSchool]);

  // 处理表单输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      setSaving(true);

      // 验证必填字段
      if (!formData.name.trim()) {
        toast({
          title: "验证失败",
          description: "请输入教师姓名",
          variant: "destructive"
        });
        return;
      }

      // 验证邮箱格式
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast({
          title: "验证失败",
          description: "请输入正确的邮箱格式",
          variant: "destructive"
        });
        return;
      }

      // 验证手机号格式
      if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
        toast({
          title: "验证失败",
          description: "请输入正确的手机号格式",
          variant: "destructive"
        });
        return;
      }

      // 提交数据
      const result = await updateTeacherInfo(teacherId, {
        name: formData.name.trim(),
        gender: formData.gender || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined
      }, formData.remark.trim() || undefined);
      if (!result.success) {
        toast({
          title: "保存失败",
          description: result.message,
          variant: "destructive"
        });
        return;
      }

      // 更新特殊身份标识
      const specialFlagsResult = await updateTeacherSpecialFlags(teacherId, {
        isWorkAssistant
      });
      if (!specialFlagsResult.success) {
        toast({
          title: "保存失败",
          description: specialFlagsResult.message,
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "保存成功",
        description: "教师信息更新成功"
      });
      // 跳转回教师列表
      router.push("/work/school/teacher");
    } catch (error) {
      console.error("保存失败:", error);
      toast({
        title: "保存失败",
        description: "网络错误，请稍后重试",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // 获取用户显示名称
  const getUserDisplayName = () => {
    return teacherInfo?.userInfo?.name || teacherInfo?.userWxInfo?.nickname || "未设置姓名";
  };
  if (loading || pageLoading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-white p-4 shadow-sm">
          <div className="container mx-auto">
            <h1 className="text-xl font-bold text-primary">编辑教师</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </main>
      </div>;
  }
  if (error || !user || !teacherInfo) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-white p-4 shadow-sm">
          <div className="container mx-auto">
            <h1 className="text-xl font-bold text-primary">编辑教师</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">{error || "加载失败，正在跳转..."}</p>
          </div>
        </main>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="编辑教师" showBackButton={true} backHref="/work/school/teacher" backText="返回教师管理" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>编辑教师信息 - {getUserDisplayName()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 微信信息展示 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  微信信息（不可编辑）
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">OpenID：</span>
                    <span className="text-gray-900 font-mono text-xs">
                      {teacherInfo.openid}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">昵称：</span>
                    <span className="text-gray-900">
                      {teacherInfo.userWxInfo?.nickname || "未设置"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">性别：</span>
                    <span className="text-gray-900">
                      {teacherInfo.userWxInfo?.sex === 1 ? "男" : teacherInfo.userWxInfo?.sex === 2 ? "女" : "未知"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">省份：</span>
                    <span className="text-gray-900">
                      {teacherInfo.userWxInfo?.province || "未设置"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">城市：</span>
                    <span className="text-gray-900">
                      {teacherInfo.userWxInfo?.city || "未设置"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">角色：</span>
                    <span className="text-gray-900">
                      {teacherInfo.roles.map(role => {
                      const roleMap = {
                        super_admin: "超级管理员",
                        admin: "管理员",
                        teacher: "教师",
                        student: "学生",
                        assistant: "助教",
                        principal: "校长"
                      };
                      return roleMap[role] || role;
                    }).join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* 可编辑的个人信息 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  可编辑信息
                </h3>

                {/* 姓名 */}
                <div className="space-y-2">
                  <Label htmlFor="name">姓名 *</Label>
                  <Input id="name" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} placeholder="请输入教师姓名" maxLength={20} />
                </div>

                {/* 性别 */}
                <div className="space-y-2">
                  <Label htmlFor="gender">性别</Label>
                  <Select value={formData.gender} onValueChange={value => handleInputChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男">男</SelectItem>
                      <SelectItem value="女">女</SelectItem>
                      <SelectItem value="未知">未知</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 手机号 */}
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号</Label>
                  <Input id="phone" value={formData.phone} onChange={e => handleInputChange("phone", e.target.value)} placeholder="请输入手机号" maxLength={11} />
                </div>

                {/* 邮箱 */}
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} placeholder="请输入邮箱地址" maxLength={100} />
                </div>

                {/* 地址 */}
                <div className="space-y-2">
                  <Label htmlFor="address">地址</Label>
                  <Input id="address" value={formData.address} onChange={e => handleInputChange("address", e.target.value)} placeholder="请输入联系地址" maxLength={200} />
                </div>

                {/* 备注 */}
                <div className="space-y-2">
                  <Label htmlFor="remark">备注</Label>
                  <Textarea id="remark" value={formData.remark} onChange={e => handleInputChange("remark", e.target.value)} placeholder="请输入备注信息" maxLength={500} rows={3} />
                </div>
              </div>

              {/* 特殊身份标识 */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  特殊权限设置
                </h3>
                <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
                  <Checkbox id="isWorkAssistant" checked={isWorkAssistant} onCheckedChange={checked => setIsWorkAssistant(checked)} />
                  <div className="flex-1">
                    <Label htmlFor="isWorkAssistant" className="cursor-pointer">
                      工作台助教
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      勾选后，该用户仅具有上传答卷的权限，无法访问其他工作台功能
                    </p>
                  </div>
                  {isWorkAssistant && <Badge variant="secondary">已设置</Badge>}
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} disabled={saving} className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{saving ? "保存中..." : "保存信息"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>;
}
