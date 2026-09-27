"use client";

import { ChevronLeft, ChevronRight, Info, Loader2, Save, Search, UserCheck, Users } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// 校园校长编辑页面，用于为指定校园设置和管理校长
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { getPrincipalsAction, getSchoolDetailAction, updateSchoolAdminsAction } from "./actions.js";
export default function EditSchoolAdminsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    toast
  } = useToast();
  const schoolId = params.id;
  const returnPage = searchParams.get("admin_page") || "1";
  const [school, setSchool] = useState(null);
  const [principals, setPrincipals] = useState([]);
  const [selectedAdmins, setSelectedAdmins] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 过滤后的校长列表
  const filteredPrincipals = principals.filter(principal => {
    const keyword = searchTerm.toLowerCase();
    const name = principal.userInfo?.name || principal.userWxInfo?.nickname || "";
    const phone = principal.userInfo?.phone || "";
    const email = principal.userInfo?.email || "";
    return name.toLowerCase().includes(keyword) || phone.includes(keyword) || email.toLowerCase().includes(keyword);
  });

  // 可选的校长（未被选为校长的）
  const availablePrincipals = filteredPrincipals.filter(principal => !selectedAdmins.has(principal.openid));

  // 已选的校长
  const selectedPrincipals = filteredPrincipals.filter(principal => selectedAdmins.has(principal.openid));

  // 加载数据
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [schoolResult, principalsResult] = await Promise.all([getSchoolDetailAction(schoolId), getPrincipalsAction()]);
      if (schoolResult.success && schoolResult.data) {
        setSchool(schoolResult.data);
        // 设置已选中的校长
        setSelectedAdmins(new Set(schoolResult.data.adminOpenids));
      } else {
        toast({
          title: "获取学校信息失败",
          description: schoolResult.error,
          variant: "destructive"
        });
      }
      if (principalsResult.success && principalsResult.data) {
        setPrincipals(principalsResult.data);
      } else {
        toast({
          title: "获取校长列表失败",
          description: principalsResult.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("加载数据失败:", error);
      toast({
        title: "加载数据失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, toast]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 添加校长
  const addAdmin = principalOpenid => {
    setSelectedAdmins(prev => new Set([...prev, principalOpenid]));
  };

  // 移除校长
  const removeAdmin = principalOpenid => {
    setSelectedAdmins(prev => {
      const newSet = new Set(prev);
      newSet.delete(principalOpenid);
      return newSet;
    });
  };

  // 保存更改
  const handleSave = async () => {
    if (!school) return;
    setIsSaving(true);
    try {
      const result = await updateSchoolAdminsAction(schoolId, Array.from(selectedAdmins));
      if (result.success) {
        toast({
          title: "保存成功",
          description: "校长设置已更新"
        });
        // 返回列表页面
        router.push(`/admin/school-admins?admin_page=${returnPage}`);
      } else {
        toast({
          title: "保存失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 渲染校长卡片
  const renderPrincipalCard = (principal, isSelected) => <div key={principal._id} className={`p-3 border rounded-lg cursor-pointer transition-all ${isSelected ? "bg-green-50 border-green-200 hover:bg-green-100" : "bg-white border-gray-200 hover:bg-gray-50"}`} onClick={() => {
    if (isSelected) {
      removeAdmin(principal.openid);
    } else {
      addAdmin(principal.openid);
    }
  }}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {principal.userWxInfo?.headimgurl ? <Image src={principal.userWxInfo.headimgurl} alt={principal.userInfo?.name || principal.userWxInfo?.nickname || "头像"} width={48} height={48} className="rounded-full object-cover" /> : <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-gray-500" />
            </div>}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {principal.userInfo?.name || principal.userWxInfo?.nickname || "未知"}
            </span>
            {isSelected && <UserCheck className="h-4 w-4 text-green-600" />}
          </div>
          <div className="text-sm text-muted-foreground space-y-1 mt-1">
            {principal.userInfo?.phone && <div>电话: {principal.userInfo.phone}</div>}
            {principal.userInfo?.email && <div>邮箱: {principal.userInfo.email}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            校长
          </Badge>
          {isSelected ? <ChevronLeft className="h-4 w-4 text-green-600" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </div>
      </div>
    </div>;
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-96">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>;
  }
  if (!school) {
    return <div className="text-center py-10">
        <div className="text-muted-foreground">学校信息不存在</div>
      </div>;
  }
  return <div className="space-y-6 pb-20">
      {/* 提示信息 */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 text-blue-700">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm space-y-2">
              <div>
                • 只有拥有&quot;校长&quot;角色的用户才能被设置为校园校长
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 搜索框 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            搜索校长
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="搜索姓名、电话或邮箱..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-md" />
        </CardContent>
      </Card>

      {/* 双栏布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧：可选校长 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              可选校长 ({availablePrincipals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availablePrincipals.length > 0 ? availablePrincipals.map(principal => renderPrincipalCard(principal, false)) : <div className="text-center text-muted-foreground py-8">
                  {searchTerm ? "没有找到匹配的校长" : "没有可选的校长"}
                </div>}
            </div>
          </CardContent>
        </Card>

        {/* 右侧：已选校长 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              当前校长 ({selectedPrincipals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedPrincipals.length > 0 ? selectedPrincipals.map(principal => renderPrincipalCard(principal, true)) : <div className="text-center text-muted-foreground py-8">
                  还未选择任何校长
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 固定在右下角的保存按钮 */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="shadow-lg">
          {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          保存设置
        </Button>
      </div>
    </div>;
}
