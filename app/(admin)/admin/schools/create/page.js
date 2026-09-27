"use client";

import { useRouter } from "next/navigation";
// 创建校园页面，用于创建新的校园记录
import { useRef, useState } from "react";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Input } from "../../../../../components/ui/input.js";
import { Label } from "../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select.js";
import { Textarea } from "../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useRegions } from "../../../../../hooks/useAdminConfig.js";
import { createSchoolAction } from "./actions.js";
export default function CreateSchoolPage() {
  const router = useRouter();
  const {
    toast
  } = useToast();
  const {
    regions
  } = useRegions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    address: "",
    phone: "",
    description: "",
    status: "正常"
  });

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
    setIsSubmitting(true);
    try {
      const result = await createSchoolAction({
        name: formData.name,
        region: formData.region,
        address: formData.address,
        phone: formData.phone,
        description: formData.description,
        status: formData.status
      });
      if (result.success) {
        toast({
          title: "创建成功",
          description: "学校已成功创建"
        });

        // 提交成功后返回列表页
        setTimeout(() => {
          router.push("/admin/schools");
        }, 1000);
      } else {
        toast({
          title: "创建失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("提交错误:", error);
      toast({
        title: "提交错误",
        description: "创建过程中发生错误，请重试",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="space-y-6">
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>
                请填写学校的基本信息，学校名称、区域为必填项
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">学校名称 *</Label>
                <Input id="name" name="name" placeholder="请输入学校名称" value={formData.name} onChange={handleChange} required disabled={isSubmitting} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">区域 *</Label>
                <Select value={formData.region} onValueChange={value => handleSelectChange("region", value)} disabled={isSubmitting}>
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
                <Input id="address" name="address" placeholder="请输入学校地址（选填）" value={formData.address} onChange={handleChange} disabled={isSubmitting} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">联系电话</Label>
                <Input id="phone" name="phone" placeholder="请输入联系电话（选填）" value={formData.phone} onChange={handleChange} disabled={isSubmitting} />
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
                <Select value={formData.status} onValueChange={value => handleSelectChange("status", value)} disabled={isSubmitting}>
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
                <Textarea id="description" name="description" placeholder="请输入学校描述（选填）" value={formData.description} onChange={handleChange} rows={8} disabled={isSubmitting} />
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" type="button" onClick={() => router.push("/admin/schools")} disabled={isSubmitting}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name || !formData.region}>
                {isSubmitting ? "创建中..." : "创建学校"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>;
}
