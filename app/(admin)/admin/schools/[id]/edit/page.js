"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// 校园编辑页面，用于修改校园的基本信息、详细信息和状态
import { useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useRegions } from "../../../../../../hooks/useAdminConfig.js";
import { getSchoolByIdAction, updateSchoolAction } from "./actions.js";
export default function EditSchoolPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const schoolId = params.id;
  const fromPage = searchParams.get("school_page") || "1";
  const {
    toast
  } = useToast();
  const {
    regions
  } = useRegions();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    address: "",
    phone: "",
    description: "",
    status: "正常"
  });

  // 获取学校数据
  useEffect(() => {
    const fetchSchool = async () => {
      setIsLoading(true);
      try {
        const result = await getSchoolByIdAction(schoolId);
        if (result.success && result.data) {
          const school = result.data;
          setFormData({
            name: school.name,
            region: school.region,
            address: school.address || "",
            phone: school.phone || "",
            description: school.description || "",
            status: school.status
          });
        } else {
          toast({
            title: "获取学校失败",
            description: result.error || "找不到学校数据",
            variant: "destructive"
          });
          router.push("/admin/schools");
        }
      } catch (error) {
        console.error("获取学校数据失败:", error);
        toast({
          title: "获取学校失败",
          description: "加载学校数据时出错",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchool();
  }, [schoolId, router, toast]);

  // 表单变更处理
  const handleChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 选择变更处理
  const handleSelectChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 表单提交处理
  const handleSubmit = async e => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.name || !formData.region) {
      toast({
        title: "表单不完整",
        description: "请填写学校名称和选择区域",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      const result = await updateSchoolAction(schoolId, {
        name: formData.name,
        region: formData.region,
        address: formData.address,
        phone: formData.phone,
        description: formData.description,
        status: formData.status
      });
      if (result.success) {
        toast({
          title: "更新成功",
          description: "学校信息已成功更新"
        });

        // 更新成功后返回列表页
        setTimeout(() => {
          router.push(`/admin/schools?school_page=${fromPage}`);
        }, 1000);
      } else {
        toast({
          title: "更新失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("更新学校错误:", error);
      toast({
        title: "更新错误",
        description: "更新过程中发生错误，请重试",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>加载学校数据中...</span>
      </div>;
  }
  return <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>
                请修改学校信息，学校名称、区域为必填项
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">学校名称 *</Label>
                <Input id="name" name="name" placeholder="请输入学校名称" value={formData.name} onChange={handleChange} required disabled={isSaving} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">区域 *</Label>
                <Select value={formData.region} onValueChange={value => handleSelectChange("region", value)} disabled={isSaving}>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="选择区域" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(region => <SelectItem key={region.name} value={region.name}>
                        {region.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">学校地址</Label>
                <Input id="address" name="address" placeholder="请输入学校地址（选填）" value={formData.address} onChange={handleChange} disabled={isSaving} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">联系电话</Label>
                <Input id="phone" name="phone" placeholder="请输入联系电话（选填）" value={formData.phone} onChange={handleChange} disabled={isSaving} />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>详细信息</CardTitle>
              <CardDescription>请填写学校的详细信息和状态</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">学校状态</Label>
                <Select value={formData.status} onValueChange={value => handleSelectChange("status", value)} disabled={isSaving}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="选择学校状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="正常">正常</SelectItem>
                    <SelectItem value="停用">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">学校描述</Label>
                <Textarea id="description" name="description" placeholder="请输入学校描述（选填）" value={formData.description} onChange={handleChange} rows={8} disabled={isSaving} />
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="outline" onClick={() => router.push(`/admin/schools?school_page=${fromPage}`)} disabled={isSaving}>
                取消
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </> : "保存修改"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>;
}
