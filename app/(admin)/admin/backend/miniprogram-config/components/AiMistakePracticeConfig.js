"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, Save, X } from "lucide-react";
// AI错题练习配置组件，用于配置小程序中AI错题练习功能的Bot ID、内容发送、学习控制和对话配置等设置
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Switch } from "../../../../../../components/ui/switch.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { updateAiMistakePracticeConfig } from "../actions.js";

// 快捷回复项数据结构

// 可拖拽的快捷回复项组件
function SortableQuickReplyItem({
  item,
  index,
  onUpdate,
  onRemove,
  disabled
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: item.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
      <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Input value={item.content} onChange={e => onUpdate(item.id, e.target.value)} placeholder={`快捷回复 ${index + 1}`} disabled={disabled} className="flex-1" />
      <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(item.id)} disabled={disabled} className="text-destructive hover:text-destructive">
        <X className="h-4 w-4" />
      </Button>
    </div>;
}
export default function AiMistakePracticeConfig({
  config,
  onConfigChange
}) {
  const [formData, setFormData] = useState({
    botId: "",
    masteryJudgmentBotId: "",
    sendQuestionImage: true,
    allowStudentUploadImage: true,
    sendQuestionText: true,
    sendQuestionAnswer: true,
    sendQuestionExplanation: true,
    sendRelatedKnowledge: true,
    sendCommonMistakes: true,
    sendReferenceQuestions: true,
    showThinkingChain: false,
    additionalPrompt: "",
    allowStudentMarkMastered: true,
    minimumMessageCount: 0,
    minimumWaitTime: 0,
    rewardPoints: 0,
    quickReplies: []
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const {
    toast
  } = useToast();

  // 生成随机ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // 初始化表单数据
  useEffect(() => {
    const aiConfig = config.aiMistakePractice || {};
    const quickRepliesData = (aiConfig.quickReplies || []).map((content, index) => ({
      id: `reply-${index}-${Date.now()}`,
      content
    }));
    setFormData({
      botId: aiConfig.botId || "",
      masteryJudgmentBotId: aiConfig.masteryJudgmentBotId || "",
      sendQuestionImage: aiConfig.sendQuestionImage ?? true,
      allowStudentUploadImage: aiConfig.allowStudentUploadImage ?? true,
      sendQuestionText: aiConfig.sendQuestionText ?? true,
      sendQuestionAnswer: aiConfig.sendQuestionAnswer ?? true,
      sendQuestionExplanation: aiConfig.sendQuestionExplanation ?? true,
      sendRelatedKnowledge: aiConfig.sendRelatedKnowledge ?? true,
      sendCommonMistakes: aiConfig.sendCommonMistakes ?? true,
      sendReferenceQuestions: aiConfig.sendReferenceQuestions ?? true,
      showThinkingChain: aiConfig.showThinkingChain ?? false,
      additionalPrompt: aiConfig.additionalPrompt || "",
      allowStudentMarkMastered: aiConfig.allowStudentMarkMastered ?? true,
      minimumMessageCount: aiConfig.minimumMessageCount ?? 0,
      minimumWaitTime: aiConfig.minimumWaitTime ?? 0,
      rewardPoints: aiConfig.rewardPoints ?? 0,
      quickReplies: quickRepliesData
    });
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalConfig = config.aiMistakePractice || {};
    const currentQuickReplies = formData.quickReplies.map(item => item.content);
    const hasChanged = formData.botId !== (originalConfig.botId || "") || formData.masteryJudgmentBotId !== (originalConfig.masteryJudgmentBotId || "") || formData.sendQuestionImage !== (originalConfig.sendQuestionImage ?? true) || formData.allowStudentUploadImage !== (originalConfig.allowStudentUploadImage ?? true) || formData.sendQuestionText !== (originalConfig.sendQuestionText ?? true) || formData.sendQuestionAnswer !== (originalConfig.sendQuestionAnswer ?? true) || formData.sendQuestionExplanation !== (originalConfig.sendQuestionExplanation ?? true) || formData.sendRelatedKnowledge !== (originalConfig.sendRelatedKnowledge ?? true) || formData.sendCommonMistakes !== (originalConfig.sendCommonMistakes ?? true) || formData.sendReferenceQuestions !== (originalConfig.sendReferenceQuestions ?? true) || formData.showThinkingChain !== (originalConfig.showThinkingChain ?? false) || formData.additionalPrompt !== (originalConfig.additionalPrompt || "") || formData.allowStudentMarkMastered !== (originalConfig.allowStudentMarkMastered ?? true) || formData.minimumMessageCount !== (originalConfig.minimumMessageCount ?? 0) || formData.minimumWaitTime !== (originalConfig.minimumWaitTime ?? 0) || formData.rewardPoints !== (originalConfig.rewardPoints ?? 0) || JSON.stringify(currentQuickReplies) !== JSON.stringify(originalConfig.quickReplies || []);
    setHasChanges(hasChanged);
  }, [formData, config]);

  // 拖拽传感器配置
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));

  // 更新表单字段
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 添加快捷回复
  const addQuickReply = () => {
    const newItem = {
      id: generateId(),
      content: ""
    };
    setFormData(prev => ({
      ...prev,
      quickReplies: [...prev.quickReplies, newItem]
    }));
  };

  // 删除快捷回复
  const removeQuickReply = id => {
    setFormData(prev => ({
      ...prev,
      quickReplies: prev.quickReplies.filter(item => item.id !== id)
    }));
  };

  // 更新快捷回复内容
  const updateQuickReply = (id, content) => {
    setFormData(prev => ({
      ...prev,
      quickReplies: prev.quickReplies.map(item => item.id === id ? {
        ...item,
        content
      } : item)
    }));
  };

  // 处理拖拽结束
  const handleDragEnd = event => {
    const {
      active,
      over
    } = event;
    if (active.id !== over?.id) {
      setFormData(prev => {
        const oldIndex = prev.quickReplies.findIndex(item => item.id === active.id);
        const newIndex = prev.quickReplies.findIndex(item => item.id === over?.id);
        return {
          ...prev,
          quickReplies: arrayMove(prev.quickReplies, oldIndex, newIndex)
        };
      });
    }
  };

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
      // 转换为保存格式（只保存content数组）
      const saveData = {
        ...formData,
        quickReplies: formData.quickReplies.map(item => item.content)
      };
      const result = await updateAiMistakePracticeConfig(saveData);
      if (result.success) {
        // 更新本地配置
        const updatedConfig = {
          ...config,
          aiMistakePractice: saveData
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
      console.error(`保存AI${DISPLAY_TEXT.COURSE_MISTAKE}配置失败:`, error);
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
    const aiConfig = config.aiMistakePractice || {};
    const quickRepliesData = (aiConfig.quickReplies || []).map((content, index) => ({
      id: `reply-${index}-${Date.now()}`,
      content
    }));
    setFormData({
      botId: aiConfig.botId || "",
      masteryJudgmentBotId: aiConfig.masteryJudgmentBotId || "",
      sendQuestionImage: aiConfig.sendQuestionImage ?? true,
      allowStudentUploadImage: aiConfig.allowStudentUploadImage ?? true,
      sendQuestionText: aiConfig.sendQuestionText ?? true,
      sendQuestionAnswer: aiConfig.sendQuestionAnswer ?? true,
      sendQuestionExplanation: aiConfig.sendQuestionExplanation ?? true,
      sendRelatedKnowledge: aiConfig.sendRelatedKnowledge ?? true,
      sendCommonMistakes: aiConfig.sendCommonMistakes ?? true,
      sendReferenceQuestions: aiConfig.sendReferenceQuestions ?? true,
      showThinkingChain: aiConfig.showThinkingChain ?? false,
      additionalPrompt: aiConfig.additionalPrompt || "",
      allowStudentMarkMastered: aiConfig.allowStudentMarkMastered ?? true,
      minimumMessageCount: aiConfig.minimumMessageCount ?? 0,
      minimumWaitTime: aiConfig.minimumWaitTime ?? 0,
      rewardPoints: aiConfig.rewardPoints ?? 0,
      quickReplies: quickRepliesData
    });
    setHasChanges(false);
  };
  return <div className="space-y-6">
      <Alert>
        <AlertDescription>
          <div className="mb-2">
            配置小程序中AI{DISPLAY_TEXT.COURSE_MISTAKE}
            功能的相关设置。包括AI机器人ID、对话内容配置等。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
          </div>
          <div className="text-red-500">
            请注意，修改配置后，学生需要一个小时不使用小程序，冷启动后才会生效。如果是老师，希望立即测试新配置的效果，请拖动删除小程序，重新冷启动才生效。
          </div>
        </AlertDescription>
      </Alert>

      {/* Bot ID配置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>Bot ID 配置</CardTitle>
          <CardDescription>
            设置AI{DISPLAY_TEXT.COURSE_MISTAKE}功能使用的机器人ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="botId">
                {DISPLAY_TEXT.COURSE_MISTAKE} Bot ID
              </Label>
              <Input id="botId" type="text" placeholder={`请输入${DISPLAY_TEXT.COURSE_MISTAKE}Bot ID`} value={formData.botId} onChange={e => updateField("botId", e.target.value)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                学生在小程序中{DISPLAY_TEXT.COURSE_MISTAKE}
                时，使用此AI与学生对话，判断学生的掌握情况。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="masteryJudgmentBotId">判定已掌握 Bot ID</Label>
              <Input id="masteryJudgmentBotId" type="text" placeholder="请输入判定已掌握Bot ID（可选）" value={formData.masteryJudgmentBotId} onChange={e => updateField("masteryJudgmentBotId", e.target.value)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                学生点击&ldquo;我已掌握&rdquo;按钮时，使用此AI判断是否已掌握。如果不填写则不使用AI判定，直接视为已掌握。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 内容发送配置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>内容发送配置</CardTitle>
          <CardDescription>配置向AI发送哪些题目相关信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="sendQuestionImage" className="text-sm">
                发送题目图片
              </Label>
              <Switch id="sendQuestionImage" checked={formData.sendQuestionImage} onCheckedChange={checked => updateField("sendQuestionImage", checked)} disabled={saving} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="allowStudentUploadImage" className="text-sm">
                允许学生上传图片
              </Label>
              <Switch id="allowStudentUploadImage" checked={formData.allowStudentUploadImage} onCheckedChange={checked => updateField("allowStudentUploadImage", checked)} disabled={saving} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="sendQuestionText" className="text-sm">
                发送题目文本
              </Label>
              <Switch id="sendQuestionText" checked={formData.sendQuestionText} onCheckedChange={checked => updateField("sendQuestionText", checked)} disabled={saving} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="sendQuestionAnswer" className="text-sm">
                发送题目答案
              </Label>
              <Switch id="sendQuestionAnswer" checked={formData.sendQuestionAnswer} onCheckedChange={checked => updateField("sendQuestionAnswer", checked)} disabled={saving} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="sendQuestionExplanation" className="text-sm">
                发送题目解析
              </Label>
              <Switch id="sendQuestionExplanation" checked={formData.sendQuestionExplanation} onCheckedChange={checked => updateField("sendQuestionExplanation", checked)} disabled={saving} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="sendRelatedKnowledge" className="text-sm">
                发送相关知识点
              </Label>
              <Switch id="sendRelatedKnowledge" checked={formData.sendRelatedKnowledge} onCheckedChange={checked => updateField("sendRelatedKnowledge", checked)} disabled={saving} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="sendCommonMistakes" className="text-sm">
                发送容易犯错的细节
              </Label>
              <Switch id="sendCommonMistakes" checked={formData.sendCommonMistakes} onCheckedChange={checked => updateField("sendCommonMistakes", checked)} disabled={saving} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="sendReferenceQuestions" className="text-sm">
                发送参考提问列表
              </Label>
              <Switch id="sendReferenceQuestions" checked={formData.sendReferenceQuestions} onCheckedChange={checked => updateField("sendReferenceQuestions", checked)} disabled={saving} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学习控制配置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>学习控制配置</CardTitle>
          <CardDescription>配置学习过程的控制选项和要求</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label htmlFor="showThinkingChain" className="text-sm">
                  显示思维链
                </Label>
                <p className="text-xs text-muted-foreground">
                  即使开启，也需要大模型支持才会显示思维链
                </p>
              </div>
              <Switch id="showThinkingChain" checked={formData.showThinkingChain} onCheckedChange={checked => updateField("showThinkingChain", checked)} disabled={saving} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label htmlFor="allowStudentMarkMastered" className="text-sm">
                  允许学生点击&ldquo;我已掌握&rdquo;
                </Label>
                <p className="text-xs text-muted-foreground">
                  关闭后，只有老师可以点击&ldquo;我已掌握&rdquo;按钮，学生无法点击。
                </p>
              </div>
              <Switch id="allowStudentMarkMastered" checked={formData.allowStudentMarkMastered} onCheckedChange={checked => updateField("allowStudentMarkMastered", checked)} disabled={saving} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumMessageCount" className="text-sm">
                  最低消息数量要求
                </Label>
                <Input id="minimumMessageCount" type="number" min="0" placeholder="0" value={formData.minimumMessageCount} onChange={e => updateField("minimumMessageCount", parseInt(e.target.value) || 0)} disabled={saving} />
                <p className="text-xs text-muted-foreground">
                  学生至少要发送多少条消息才能点击&ldquo;我已掌握&rdquo;按钮。设置为0表示无限制。
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumWaitTime" className="text-sm">
                  最低等待时间（秒）
                </Label>
                <Input id="minimumWaitTime" type="number" min="0" placeholder="0" value={formData.minimumWaitTime} onChange={e => updateField("minimumWaitTime", parseInt(e.target.value) || 0)} disabled={saving} />
                <p className="text-xs text-muted-foreground">
                  学生进入页面后至少要等待多少秒才能点击&ldquo;我已掌握&rdquo;按钮。设置为0表示无限制。
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rewardPoints" className="text-sm">
                  奖励积分
                </Label>
                <Input id="rewardPoints" type="number" min="0" placeholder="0" value={formData.rewardPoints} onChange={e => updateField("rewardPoints", parseInt(e.target.value) || 0)} disabled={saving} />
                <p className="text-xs text-muted-foreground">
                  学生通过一个{DISPLAY_TEXT.COURSE_MISTAKE}
                  时可以获得的积分奖励。设置为0表示无奖励。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 对话配置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>对话配置</CardTitle>
          <CardDescription>配置对话过程的提示词和快捷回复</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 提示词配置 */}
          <div className="space-y-2">
            <Label htmlFor="additionalPrompt">首次对话额外提示词</Label>
            <Textarea id="additionalPrompt" placeholder="请输入首次对话时添加到题目信息末尾的提示词" value={formData.additionalPrompt} onChange={e => updateField("additionalPrompt", e.target.value)} disabled={saving} rows={3} />
            <p className="text-sm text-muted-foreground">
              此提示词将在首次对话时添加到题目信息末尾，用于指导AI的回复风格和内容。
            </p>
          </div>

          {/* 快捷回复配置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">快捷回复列表</Label>
                <p className="text-sm text-muted-foreground">
                  设置用户可以快速选择的回复内容，支持拖拽排序
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addQuickReply} disabled={saving} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                添加
              </Button>
            </div>

            {formData.quickReplies.length > 0 ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={formData.quickReplies.map(item => item.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {formData.quickReplies.map((item, index) => <SortableQuickReplyItem key={item.id} item={item} index={index} onUpdate={updateQuickReply} onRemove={removeQuickReply} disabled={saving} />)}
                  </div>
                </SortableContext>
              </DndContext> : <div className="text-center py-8 text-muted-foreground">
                暂无快捷回复，点击&ldquo;添加&rdquo;按钮创建
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮区域 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
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
