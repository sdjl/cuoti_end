"use client";

import { Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
// 用户编辑页面，用于查看并修改用户的基本信息、角色和特殊权限
import { useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { getUserInfo, updateUserInfo, updateUserRoles, updateUserSpecialFlags } from "./actions.js";
import { AdminRolesCard } from "./components/AdminRolesCard.js";
import { BasicInfoForm } from "./components/BasicInfoForm.js";
import { ImportantTips } from "./components/ImportantTips.js";
import { OtherRolesCard } from "./components/OtherRolesCard.js";
import { SpecialPermissionsCard } from "./components/SpecialPermissionsCard.js";
import { UserInfoCard } from "./components/UserInfoCard.js";
export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const {
    isSuperAdmin
  } = useAuth();
  const userId = params.id;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 用户基本信息表单状态
  const [userInfo, setUserInfo] = useState({
    name: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    remark: ""
  });

  // 用户角色状态
  const [roles, setRoles] = useState([]);

  // 特殊身份标识状态
  const [isAdminEditor, setIsAdminEditor] = useState(false);

  // 角色选项定义
  const adminRoles = [{
    key: "super_admin",
    label: "超级管理员"
  }, {
    key: "admin",
    label: "管理员"
  }];
  const otherRoles = [{
    key: "teacher",
    label: "教师"
  }, {
    key: "principal",
    label: "校长"
  }, {
    key: "student",
    label: "学生"
  }];

  // 检查当前用户是否为超级管理员
  const isCurrentUserSuperAdmin = isSuperAdmin();
  // 检查被编辑用户是否为超级管理员
  const isTargetUserSuperAdmin = user?.roles.includes("super_admin") || false;

  // 页面加载时获取用户信息
  useEffect(() => {
    async function loadUser() {
      try {
        const result = await getUserInfo(userId);
        if (result.success && result.data) {
          setUser(result.data);
          setUserInfo(result.data.userInfo || {});
          setRoles(result.data.roles || []);
          setIsAdminEditor(result.data.isAdminEditor || false);
        } else {
          toast({
            title: "错误",
            description: result.error || "用户不存在",
            variant: "destructive"
          });
          router.push("/admin/user");
        }
      } catch (error) {
        console.error("加载用户信息失败:", error);
        toast({
          title: "错误",
          description: "加载用户信息失败",
          variant: "destructive"
        });
        router.push("/admin/user");
      } finally {
        setLoading(false);
      }
    }
    if (userId) {
      loadUser();
    }
  }, [userId, router, toast]);

  // 统一保存所有信息
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // 先更新用户基本信息
      const userInfoResult = await updateUserInfo(userId, userInfo);
      if (!userInfoResult.success) {
        throw new Error(userInfoResult.error || "更新用户信息失败");
      }

      // 再更新用户角色
      const rolesResult = await updateUserRoles(userId, roles);
      if (!rolesResult.success) {
        throw new Error(rolesResult.error || "更新用户角色失败");
      }

      // 更新特殊身份标识
      const specialFlagsResult = await updateUserSpecialFlags(userId, {
        isAdminEditor
      });
      if (!specialFlagsResult.success) {
        throw new Error(specialFlagsResult.error || "更新用户特殊标识失败");
      }
      toast({
        title: "成功",
        description: "用户信息更新成功"
      });

      // 重新加载用户信息以获取最新数据
      const userResult = await getUserInfo(userId);
      if (userResult.success && userResult.data) {
        setUser(userResult.data);
        setRoles(userResult.data.roles || []);
        setIsAdminEditor(userResult.data.isAdminEditor || false);
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "保存失败",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // 处理管理员角色变更
  const handleAdminRoleChange = (roleKey, checked) => {
    if (roleKey === "super_admin") {
      // 不允许设置或取消超级管理员角色
      return;
    }
    if (roleKey === "admin") {
      if (checked) {
        // 添加管理员角色，移除超级管理员角色
        setRoles(prev => prev.filter(r => r !== "super_admin").concat("admin"));
      } else {
        // 移除管理员角色
        setRoles(prev => prev.filter(r => r !== "admin"));
        // 同时取消后台编辑权限
        setIsAdminEditor(false);
      }
    }
  };

  // 处理其他角色变更
  const handleOtherRoleChange = (roleKey, checked) => {
    if (checked) {
      setRoles(prev => [...prev, roleKey]);
    } else {
      setRoles(prev => prev.filter(r => r !== roleKey));
    }
  };

  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (!user) return "";
    return user.userInfo.name || user.userWxInfo.nickname || "未知用户";
  };
  if (loading) {
    return <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>;
  }
  if (!user) {
    return <div className="text-center text-muted-foreground">用户不存在</div>;
  }
  return <div className="space-y-6">
      {/* 微信信息展示区域（移到顶部） */}
      <UserInfoCard user={user} displayName={getUserDisplayName()} />

      {/* 用户基本信息编辑 */}
      <BasicInfoForm userInfo={userInfo} onUserInfoChange={setUserInfo} />

      {/* 用户角色管理 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 管理员角色区域 */}
        <AdminRolesCard roles={roles} adminRoles={adminRoles} isCurrentUserSuperAdmin={isCurrentUserSuperAdmin} isTargetUserSuperAdmin={isTargetUserSuperAdmin} onRoleChange={handleAdminRoleChange} />

        {/* 其他角色区域 */}
        <OtherRolesCard roles={roles} otherRoles={otherRoles} onRoleChange={handleOtherRoleChange} />
      </div>

      {/* 特殊身份标识 */}
      <SpecialPermissionsCard isAdminEditor={isAdminEditor} roles={roles} onIsAdminEditorChange={setIsAdminEditor} />

      {/* 统一保存按钮 */}
      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={saving} className="min-w-32" size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          保存所有更改
        </Button>
      </div>

      {/* 重新登录提示 */}
      <ImportantTips />
    </div>;
}
