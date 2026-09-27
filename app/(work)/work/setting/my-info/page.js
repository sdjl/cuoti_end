"use client";

import { ArrowLeft, Save, User } from "lucide-react";
import Link from "next/link";
// 个人信息页面，用于查看和编辑用户的个人信息
import { useEffect, useState } from "react";
import BaseImage from "../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Input } from "../../../../../components/ui/input.js";
import { Label } from "../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { getCurrentUserInfo, updateUserInfo } from "./actions.js";
export default function MyInfoPage() {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    remark: ""
  });

  // 加载用户信息
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setLoading(true);
        const result = await getCurrentUserInfo();
        if (result) {
          setUserInfo(result);
          setFormData({
            name: result.userInfo.name || "",
            gender: result.userInfo.gender || "",
            phone: result.userInfo.phone || "",
            email: result.userInfo.email || "",
            address: result.userInfo.address || "",
            remark: result.userInfo.remark || ""
          });
        }
      } catch (error) {
        console.error("加载用户信息失败:", error);
        toast({
          title: "加载失败",
          description: "无法加载用户信息，请刷新页面重试",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    loadUserInfo();
  }, [toast]);

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
          description: "请输入您的姓名",
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
      const result = await updateUserInfo({
        name: formData.name.trim(),
        gender: formData.gender || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        remark: formData.remark.trim() || undefined
      });
      if (result.success) {
        toast({
          title: "保存成功",
          description: result.message
        });
        // 重新加载用户信息
        const updatedInfo = await getCurrentUserInfo();
        if (updatedInfo) {
          setUserInfo(updatedInfo);
        }
      } else {
        toast({
          title: "保存失败",
          description: result.message,
          variant: "destructive"
        });
      }
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
  if (loading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white p-4 shadow-sm">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/work/setting" className="flex items-center text-gray-600 hover:text-primary transition-colors">
                <ArrowLeft className="h-5 w-5 mr-1" />
                返回设置
              </Link>
              <div className="text-gray-300">|</div>
              <h1 className="text-xl font-bold text-primary">个人信息</h1>
            </div>
            <div className="flex items-center">
              <div className="h-9 w-9 rounded-full bg-primary overflow-hidden mr-2 flex items-center justify-center">
                {user?.userWxInfo.headimgurl ? <BaseImage src={user.userWxInfo.headimgurl} alt={user.userWxInfo.nickname || "用户"} width={36} height={36} className="w-full h-full object-cover" /> : <span className="text-white text-xs font-medium">
                    {user?.userWxInfo.nickname?.charAt(0) || "用户"}
                  </span>}
              </div>
              <span className="font-medium">
                {user?.userWxInfo.nickname || "用户"}
              </span>
            </div>
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
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/work/setting" className="flex items-center text-gray-600 hover:text-primary transition-colors">
              <ArrowLeft className="h-5 w-5 mr-1" />
              返回设置
            </Link>
            <div className="text-gray-300">|</div>
            <h1 className="text-xl font-bold text-primary">个人信息</h1>
          </div>
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-primary overflow-hidden mr-2 flex items-center justify-center">
              {userInfo?.userWxInfo.headimgurl ? <BaseImage src={userInfo.userWxInfo.headimgurl} alt={userInfo.userWxInfo.nickname || "用户"} width={36} height={36} className="w-full h-full object-cover" /> : <span className="text-white text-xs font-medium">
                  {userInfo?.userWxInfo.nickname?.charAt(0) || "用户"}
                </span>}
            </div>
            <span className="font-medium">
              {userInfo?.userWxInfo.nickname || "用户"}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>个人信息</span>
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
                    <span className="text-gray-500">昵称：</span>
                    <span className="text-gray-900">
                      {userInfo?.userWxInfo.nickname || "未设置"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">性别：</span>
                    <span className="text-gray-900">
                      {userInfo?.userWxInfo.sex === 1 ? "男" : userInfo?.userWxInfo.sex === 2 ? "女" : "未知"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">省份：</span>
                    <span className="text-gray-900">
                      {userInfo?.userWxInfo.province || "未设置"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">城市：</span>
                    <span className="text-gray-900">
                      {userInfo?.userWxInfo.city || "未设置"}
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
                  <Input id="name" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} placeholder="请输入您的真实姓名" maxLength={20} />
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
