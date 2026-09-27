"use client";

import { Info, Loader2, Settings } from "lucide-react";
// 运行配置页面，用于配置系统运行时的功能设置，如切题服务提供商的选择
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Label } from "../../../../../components/ui/label.js";
import { RadioGroup, RadioGroupItem } from "../../../../../components/ui/radio-group.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { getRunConfig, updateRunConfig } from "./actions.js";
export default function RunConfigPage() {
  const [config, setConfig] = useState({
    cuttingServiceProvider: "tencent"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const {
    toast
  } = useToast();
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getRunConfig();
      if (result.success && result.data) {
        setConfig(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "加载失败",
          description: result.message || "无法加载功能配置"
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "加载失败",
        description: "发生未知错误"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 页面加载时获取配置
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const result = await updateRunConfig(config);
      if (result.success) {
        toast({
          title: "保存成功",
          description: "功能配置已更新"
        });
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: result.message
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "发生未知错误"
      });
    } finally {
      setSaving(false);
    }
  }, [config, toast]);
  const updateConfigField = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载配置中...</span>
      </div>;
  }
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            切题服务配置
          </CardTitle>
          <CardDescription>
            选择系统使用的切题服务提供商。修改此配置将影响所有新的试卷切题操作。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">切题服务提供商</Label>

            <RadioGroup value={config.cuttingServiceProvider} onValueChange={value => updateConfigField("cuttingServiceProvider", value)} className="space-y-4">
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="tencent" id="tencent" className="mt-1" />
                <div className="space-y-2 flex-1">
                  <Label htmlFor="tencent" className="text-base font-medium cursor-pointer">
                    腾讯云切题服务
                  </Label>
                  <p className="text-sm text-gray-600">
                    使用腾讯云的OCR切题服务，使用PDF文件进行切题，然后根据腾讯云返回的宽度转换图片。
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="alibaba" id="alibaba" className="mt-1" />
                <div className="space-y-2 flex-1">
                  <Label htmlFor="alibaba" className="text-base font-medium cursor-pointer">
                    阿里云切题服务
                  </Label>
                  <p className="text-sm text-gray-600">
                    使用阿里云的OCR切题服务，本地把PDF转换成图片，然后使用图片进行切题。
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="pt-4 border-t">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900">配置说明</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 修改配置后，新的试卷切题将使用选择的服务</li>
                    <li>• 已完成的切题结果不受影响</li>
                    <li>
                      • 由于切题逻辑不同，腾讯和阿里最终得到的页面宽度、高度不同
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={loadConfig} disabled={loading || saving}>
          重置
        </Button>
        <Button onClick={handleSave} disabled={loading || saving}>
          {saving ? <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </> : "保存配置"}
        </Button>
      </div>
    </div>;
}
