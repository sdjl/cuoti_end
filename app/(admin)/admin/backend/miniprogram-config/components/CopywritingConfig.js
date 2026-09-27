"use client";

import { Loader2, Save } from "lucide-react";
// 文案配置组件，用于配置小程序中显示的名称和宣传语
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { updateCopywritingConfig } from "../actions.js";
export default function CopywritingConfig({
  config,
  onConfigChange
}) {
  const [appName, setAppName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const {
    toast
  } = useToast();

  // 初始化表单数据
  useEffect(() => {
    setAppName(config.copywriting?.appName || "");
    setSlogan(config.copywriting?.slogan || "");
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalAppName = config.copywriting?.appName || "";
    const originalSlogan = config.copywriting?.slogan || "";
    setHasChanges(appName !== originalAppName || slogan !== originalSlogan);
  }, [appName, slogan, config]);

  // 处理保存
  const handleSave = async () => {
    if (!hasChanges) {
      toast({
        title: "提示",
        description: "没有需要保存的更改"
      });
      return;
    }
    setSaving(true);
    try {
      const result = await updateCopywritingConfig({
        appName,
        slogan
      });
      if (result.success) {
        // 更新本地配置
        const updatedConfig = {
          ...config,
          copywriting: {
            appName,
            slogan
          }
        };
        onConfigChange(updatedConfig);
        toast({
          title: "保存成功",
          description: result.message
        });
        setHasChanges(false);
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: result.message
        });
      }
    } catch (error) {
      console.error("保存文案配置失败:", error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: `客户端错误: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setSaving(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    setAppName(config.copywriting?.appName || "");
    setSlogan(config.copywriting?.slogan || "");
    setHasChanges(false);
  };
  return <div className="space-y-6">
      <Alert>
        <AlertDescription>
          配置小程序中显示的名称和宣传语。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>文案配置</CardTitle>
          <CardDescription>
            设置小程序的名称和宣传语，这些信息将在小程序的各个页面中显示。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="appName">小程序名称</Label>
            <Input id="appName" type="text" placeholder="请输入小程序名称" value={appName} onChange={e => setAppName(e.target.value)} disabled={saving} maxLength={20} />
            <p className="text-sm text-muted-foreground">
              小程序的官方名称，建议不超过6个汉字。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slogan">宣传语 (Slogan)</Label>
            <Input id="slogan" type="text" placeholder="请输入宣传语" value={slogan} onChange={e => setSlogan(e.target.value)} disabled={saving} maxLength={50} />
            <p className="text-sm text-muted-foreground">
              简洁有力的宣传语，用于介绍小程序的核心价值，建议不超过15个汉字。
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleSave} disabled={!hasChanges || saving} className="flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "保存中..." : "保存配置"}
            </Button>

            {hasChanges && <Button variant="outline" onClick={handleReset} disabled={saving}>
                重置
              </Button>}

            {!hasChanges && <span className="text-sm text-muted-foreground">
                已保存最新配置
              </span>}
          </div>
        </CardContent>
      </Card>
    </div>;
}
