"use client";

import { useRouter } from "next/navigation";
// 导入学生配置页面，用于配置Excel表格导入学生时的字段映射关系
import { useEffect, useState } from "react";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Input } from "../../../../../components/ui/input.js";
import { Label } from "../../../../../components/ui/label.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { getImportStudentConfig, saveImportStudentConfig } from "./actions.js";
// 字段信息配置
const fieldInfo = {
  studentCode: {
    label: "学生编号",
    description: "学生的唯一编号",
    required: true
  },
  name: {
    label: "姓名",
    description: "学生的真实姓名",
    required: true
  },
  birthDate: {
    label: "出生日期",
    description: "格式：YYYY-MM-DD",
    required: false
  },
  ethnicity: {
    label: "民族",
    description: "学生的民族信息",
    required: false
  },
  homeAddress: {
    label: "家庭地址",
    description: "学生的家庭详细地址",
    required: false
  },
  gender: {
    label: "性别",
    description: "男/女",
    required: false
  },
  publicSchoolName: {
    label: "就读校园",
    description: "学生就读的公立校园名称",
    required: false
  },
  contactPhones: {
    label: "联系电话",
    description: "多个电话可用空格或逗号分隔",
    required: false
  },
  notes: {
    label: "备注",
    description: "其他需要说明的信息",
    required: false
  }
};
export default function ImportStudentConfigPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configData, setConfigData] = useState(null);
  const [tableColumns, setTableColumns] = useState({});

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 加载配置数据
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const result = await getImportStudentConfig();
        if (result.success && result.data) {
          setConfigData(result.data);
          setTableColumns(result.data.tableColumns);
        } else {
          toast({
            title: "加载失败",
            description: result.error || "无法加载配置信息",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("加载配置失败:", error);
        toast({
          title: "加载失败",
          description: "获取配置信息时发生错误",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [toast]);

  // 处理字段名称变更
  const handleColumnChange = (fieldKey, value) => {
    setTableColumns(prev => ({
      ...prev,
      [fieldKey]: value.trim()
    }));
  };

  // 保存配置
  const handleSave = async () => {
    if (!configData) return;

    // 验证必填字段不能为空
    const requiredFields = Object.entries(fieldInfo).filter(([, info]) => info.required).map(([key]) => key);
    const emptyRequiredFields = requiredFields.filter(fieldKey => !tableColumns[fieldKey] || tableColumns[fieldKey].trim() === "");
    if (emptyRequiredFields.length > 0) {
      const fieldLabels = emptyRequiredFields.map(key => fieldInfo[key].label);
      toast({
        title: "保存失败",
        description: `请填写必填字段的列名：${fieldLabels.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    // 检查是否有重复的列名
    const columnValues = Object.values(tableColumns).filter(v => v.trim() !== "");
    const uniqueValues = new Set(columnValues);
    if (columnValues.length !== uniqueValues.size) {
      toast({
        title: "保存失败",
        description: "列名不能重复，请检查配置",
        variant: "destructive"
      });
      return;
    }
    try {
      setSaving(true);
      const result = await saveImportStudentConfig(configData.schoolId, tableColumns);
      if (result.success) {
        toast({
          title: "保存成功",
          description: result.message || "配置已成功保存"
        });
        router.push("/work/setting");
      } else {
        toast({
          title: "保存失败",
          description: result.error || "保存配置时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("保存配置失败:", error);
      toast({
        title: "保存失败",
        description: "保存配置时发生错误",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">加载配置中...</p>
        </div>
      </div>;
  }
  if (!configData) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">无法加载配置信息</p>
          <Button onClick={() => router.push("/work/setting")}>
            返回设置页面
          </Button>
        </div>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <WorkHeader title="导入学生配置" showBackButton backHref="/work/setting" backText="返回设置" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-4xl">
          {/* 说明信息 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                配置说明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-700">
                <p>• 此配置用于设定Excel表格导入学生数据时的字段映射关系</p>
                <p>
                  • 标记为&ldquo;必填&rdquo;的字段必须配置列名，否则无法导入
                </p>
                <p>• 列名不能重复，请确保每个字段对应不同的Excel列</p>
                <p>• 联系电话支持多个号码，在Excel中可用空格或逗号分隔</p>
              </div>
            </CardContent>
          </Card>

          {/* 字段映射配置 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>字段映射配置</CardTitle>
                <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                  {saving ? <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      保存中...
                    </> : "保存配置"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(fieldInfo).map(([fieldKey, info]) => <div key={fieldKey} className="space-y-2">
                    <Label htmlFor={fieldKey} className="flex items-center gap-2">
                      <span className="font-medium">{info.label}</span>
                      {info.required && <span className="text-red-500 text-xs px-2 py-1 bg-red-50 rounded">
                          必填
                        </span>}
                    </Label>
                    <Input id={fieldKey} value={tableColumns[fieldKey] || ""} onChange={e => handleColumnChange(fieldKey, e.target.value)} placeholder={`请输入Excel表格中${info.label}对应的列名`} />
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>;
}
