"use client";

import { AlertCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
// 添加教师页面，通过OpenID搜索用户并添加到教师队伍
import { useCallback, useEffect, useState } from "react";
import AddedTeachersList from "./components/AddedTeachersList.js";
import UserSearchResult from "./components/UserSearchResult.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { getCurrentSchoolStaff } from "../../../../../../lib/work/principal/mySchool.js";
import { addTeacherAction, searchUserByOpenidAction } from "./actions.js";
export default function AddTeacherPage() {
  const {
    user,
    loading,
    error,
    isPrincipal
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();

  // 状态管理
  const [openid, setOpenid] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addedTeachers, setAddedTeachers] = useState([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);

  // 检查当前校园和权限
  useEffect(() => {
    // 等待加载完成
    if (loading) return;

    // 如果有错误或未登录，跳转到设置页面
    if (error || !user) {
      router.push("/work/setting/curr-school");
      return;
    }

    // 检查是否有当前校园设置
    if (!user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }

    // 检查是否是校长
    if (!isPrincipal()) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [loading, error, user, isPrincipal, router]);

  // 加载已有教师列表
  const loadExistingTeachers = useCallback(async () => {
    setIsLoadingTeachers(true);
    try {
      const {
        teachers
      } = await getCurrentSchoolStaff();

      // 将 SchoolStaffMember 转换为 WxUserDoc 格式
      const teacherDocs = teachers.map(teacher => ({
        _id: teacher._id,
        openid: teacher.openid,
        unionid: "",
        // SchoolStaffMember 中没有这个字段，留空
        accessToken: "",
        expiresIn: 0,
        accessTokenExpiresAt: 0,
        refreshToken: "",
        refreshTokenExpiresAt: 0,
        scope: "",
        userWxInfo: {
          nickname: teacher.nickname,
          headimgurl: teacher.headimgurl
        },
        userInfo: {
          name: teacher.name,
          gender: teacher.gender,
          phone: teacher.phone,
          email: teacher.email,
          address: teacher.address
        },
        workSetting: undefined,
        roles: teacher.roles,
        status: teacher.status,
        lastLoginAt: 0,
        loginCount: 0,
        created: teacher.created,
        updated: teacher.created
      }));
      setAddedTeachers(teacherDocs);
    } catch (error) {
      console.error("加载教师列表失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载现有教师列表",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTeachers(false);
    }
  }, [toast]);

  // 初始加载
  useEffect(() => {
    loadExistingTeachers();
  }, [loadExistingTeachers]);

  // 搜索用户
  const handleSearch = useCallback(async () => {
    if (!openid.trim()) {
      toast({
        title: "提示",
        description: "请输入用户的OpenID",
        variant: "destructive"
      });
      return;
    }
    setIsSearching(true);
    setSearchedUser(null);
    try {
      const {
        user,
        error
      } = await searchUserByOpenidAction(openid.trim());
      if (error) {
        toast({
          title: "查询失败",
          description: error,
          variant: "destructive"
        });
        return;
      }
      if (!user) {
        toast({
          title: "未找到用户",
          description: "该OpenID对应的用户不存在",
          variant: "destructive"
        });
        return;
      }
      setSearchedUser(user);
    } catch (error) {
      console.error("搜索用户失败:", error);
      toast({
        title: "查询失败",
        description: "搜索用户时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  }, [openid, toast]);

  // 添加教师
  const handleAddTeacher = useCallback(async () => {
    if (!searchedUser) return;
    setIsAdding(true);
    try {
      const {
        success,
        error
      } = await addTeacherAction(searchedUser.openid);
      if (error) {
        toast({
          title: "添加失败",
          description: error,
          variant: "destructive"
        });
        return;
      }
      if (success) {
        toast({
          title: "添加成功",
          description: `已将 ${searchedUser.userInfo?.name || searchedUser.userWxInfo?.nickname || "该用户"} 添加到教师队伍`
        });

        // 清空搜索结果和输入框
        setSearchedUser(null);
        setOpenid("");

        // 重新加载教师列表
        await loadExistingTeachers();
      }
    } catch (error) {
      console.error("添加教师失败:", error);
      toast({
        title: "添加失败",
        description: "添加教师时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  }, [searchedUser, toast, loadExistingTeachers]);

  // 处理回车键搜索
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // 如果正在加载，显示加载状态
  if (loading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-white p-4 shadow-sm">
          <div className="container mx-auto">
            <h1 className="text-xl font-bold text-primary">添加教师</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">加载中...</p>
          </div>
        </main>
      </div>;
  }

  // 如果有错误或未登录，显示错误状态
  if (error || !user) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-white p-4 shadow-sm">
          <div className="container mx-auto">
            <h1 className="text-xl font-bold text-primary">添加教师</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">{error || "未登录，正在跳转..."}</p>
          </div>
        </main>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="添加教师" showBackButton={true} backHref="/work/school/teacher" backText="返回教师管理" />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-6">
          {/* 搜索用户 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                搜索用户
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input type="text" placeholder="请输入用户的OpenID" value={openid} onChange={e => setOpenid(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
                <Button onClick={handleSearch} disabled={isSearching || !openid.trim()} className="flex items-center">
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? "搜索中..." : "查询"}
                </Button>
              </div>

              <div className="flex items-start space-x-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">使用说明：</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>请输入用户的微信OpenID进行搜索</li>
                    <li>
                      确认用户信息无误后，点击&ldquo;添加到教师队伍&rdquo;按钮
                    </li>
                    <li>如果用户没有教师角色，系统会自动为其添加教师权限</li>
                    <li>已经是校长的用户不能添加为教师</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 搜索结果 */}
          {searchedUser && <UserSearchResult user={searchedUser} isAdding={isAdding} onAddTeacher={handleAddTeacher} />}

          {/* 已添加的教师列表 */}
          {isLoadingTeachers ? <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">加载中...</p>
              </CardContent>
            </Card> : <AddedTeachersList teachers={addedTeachers} />}
        </div>
      </main>
    </div>;
}
