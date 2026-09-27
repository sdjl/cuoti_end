"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, Save, X } from "lucide-react";
// AI自拍错题配置组件，用于配置小程序中AI自拍错题功能的Bot ID、创建题目配置、内容发送、学习控制和对话配置等设置
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
import { updateAiProblemConfig } from "../actions.js";

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
export default function AiProblemConfig({
  config,
  onConfigChange
}) {
  const [formData, setFormData] = useState({
    botId: "",
    masteryJudgmentBotId: "",
    knowledgeAnalysisBotId: "",
    difficultyAnalysisBotId: "",
    sendQuestionImage: true,
    allowStudentUploadImage: true,
    sendRelatedKnowledge: true,
    showThinkingChain: false,
    showThinkingChainOnCreate: false,
    allowStudentDeleteKnowledge: false,
    allowStudentAddKnowledge: false,
    maxKnowledgePointsPerQuestion: 5,
    defaultMessage: "",
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
    const aiConfig = config.aiProblem || {};
    const quickRepliesData = (aiConfig.quickReplies || []).map((content, index) => ({
      id: `reply-${index}-${Date.now()}`,
      content
    }));
    setFormData({
      botId: aiConfig.botId || "",
      masteryJudgmentBotId: aiConfig.masteryJudgmentBotId || "",
      knowledgeAnalysisBotId: aiConfig.knowledgeAnalysisBotId || "",
      difficultyAnalysisBotId: aiConfig.difficultyAnalysisBotId || "",
      sendQuestionImage: aiConfig.sendQuestionImage ?? true,
      allowStudentUploadImage: aiConfig.allowStudentUploadImage ?? true,
      sendRelatedKnowledge: aiConfig.sendRelatedKnowledge ?? true,
      showThinkingChain: aiConfig.showThinkingChain ?? false,
      showThinkingChainOnCreate: aiConfig.showThinkingChainOnCreate ?? false,
      allowStudentDeleteKnowledge: aiConfig.allowStudentDeleteKnowledge ?? false,
      allowStudentAddKnowledge: aiConfig.allowStudentAddKnowledge ?? false,
      maxKnowledgePointsPerQuestion: aiConfig.maxKnowledgePointsPerQuestion ?? 5,
      defaultMessage: aiConfig.defaultMessage || "",
      minimumMessageCount: aiConfig.minimumMessageCount ?? 0,
      minimumWaitTime: aiConfig.minimumWaitTime ?? 0,
      rewardPoints: aiConfig.rewardPoints ?? 0,
      quickReplies: quickRepliesData
    });
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalConfig = config.aiProblem || {};
    const currentQuickReplies = formData.quickReplies.map(item => item.content);
    const hasChanged = formData.botId !== (originalConfig.botId || "") || formData.masteryJudgmentBotId !== (originalConfig.masteryJudgmentBotId || "") || formData.knowledgeAnalysisBotId !== (originalConfig.knowledgeAnalysisBotId || "") || formData.difficultyAnalysisBotId !== (originalConfig.difficultyAnalysisBotId || "") || formData.sendQuestionImage !== (originalConfig.sendQuestionImage ?? true) || formData.allowStudentUploadImage !== (originalConfig.allowStudentUploadImage ?? true) || formData.sendRelatedKnowledge !== (originalConfig.sendRelatedKnowledge ?? true) || formData.showThinkingChain !== (originalConfig.showThinkingChain ?? false) || formData.showThinkingChainOnCreate !== (originalConfig.showThinkingChainOnCreate ?? false) || formData.allowStudentDeleteKnowledge !== (originalConfig.allowStudentDeleteKnowledge ?? false) || formData.allowStudentAddKnowledge !== (originalConfig.allowStudentAddKnowledge ?? false) || formData.maxKnowledgePointsPerQuestion !== (originalConfig.maxKnowledgePointsPerQuestion ?? 5) || formData.defaultMessage !== (originalConfig.defaultMessage || "") || formData.minimumMessageCount !== (originalConfig.minimumMessageCount ?? 0) || formData.minimumWaitTime !== (originalConfig.minimumWaitTime ?? 0) || formData.rewardPoints !== (originalConfig.rewardPoints ?? 0) || JSON.stringify(currentQuickReplies) !== JSON.stringify(originalConfig.quickReplies || []);
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
      const result = await updateAiProblemConfig(saveData);
      if (result.success) {
        // 更新本地配置
        const updatedConfig = {
          ...config,
          aiProblem: saveData
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
      console.error(`保存${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}配置失败:`, error);
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
    const aiConfig = config.aiProblem || {};
    const quickRepliesData = (aiConfig.quickReplies || []).map((content, index) => ({
      id: `reply-${index}-${Date.now()}`,
      content
    }));
    setFormData({
      botId: aiConfig.botId || "",
      masteryJudgmentBotId: aiConfig.masteryJudgmentBotId || "",
      knowledgeAnalysisBotId: aiConfig.knowledgeAnalysisBotId || "",
      difficultyAnalysisBotId: aiConfig.difficultyAnalysisBotId || "",
      sendQuestionImage: aiConfig.sendQuestionImage ?? true,
      allowStudentUploadImage: aiConfig.allowStudentUploadImage ?? true,
      sendRelatedKnowledge: aiConfig.sendRelatedKnowledge ?? true,
      showThinkingChain: aiConfig.showThinkingChain ?? false,
      showThinkingChainOnCreate: aiConfig.showThinkingChainOnCreate ?? false,
      allowStudentDeleteKnowledge: aiConfig.allowStudentDeleteKnowledge ?? false,
      allowStudentAddKnowledge: aiConfig.allowStudentAddKnowledge ?? false,
      maxKnowledgePointsPerQuestion: aiConfig.maxKnowledgePointsPerQuestion ?? 5,
      defaultMessage: aiConfig.defaultMessage || "",
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
            配置小程序中{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}
            功能的相关设置。包括AI机器人ID、内容发送配置等。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
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
            设置{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}功能使用的机器人ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="aiproblem-botId">
                {DISPLAY_TEXT.SELF_UPLOAD_MISTAKE} Bot ID
              </Label>
              <Input id="aiproblem-botId" type="text" placeholder={`请输入${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}Bot ID`} value={formData.botId} onChange={e => updateField("botId", e.target.value)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                学生在小程序中使用{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}
                时，使用此AI与学生对话。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiproblem-masteryJudgmentBotId">
                判定已掌握 Bot ID
              </Label>
              <Input id="aiproblem-masteryJudgmentBotId" type="text" placeholder="请输入判定已掌握Bot ID（可选）" value={formData.masteryJudgmentBotId} onChange={e => updateField("masteryJudgmentBotId", e.target.value)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                学生点击&ldquo;我已掌握&rdquo;按钮时，使用此AI判断是否已掌握。如果不填写则不使用AI判定，直接视为已掌握。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiproblem-knowledgeAnalysisBotId">
                分析知识点 Bot ID
              </Label>
              <Input id="aiproblem-knowledgeAnalysisBotId" type="text" placeholder="请输入分析知识点Bot ID（可选）" value={formData.knowledgeAnalysisBotId} onChange={e => updateField("knowledgeAnalysisBotId", e.target.value)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                用于分析题目涉及的知识点，分析结果只能是知识树中的知识点，不填写则不分析。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiproblem-difficultyAnalysisBotId">
                分析题目难度 Bot ID
              </Label>
              <Input id="aiproblem-difficultyAnalysisBotId" type="text" placeholder="请输入分析题目难度Bot ID" value={formData.difficultyAnalysisBotId} onChange={e => updateField("difficultyAnalysisBotId", e.target.value)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                用于分析题目的难度等级，帮助系统了解题目复杂程度。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 创建题目配置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>创建题目配置</CardTitle>
          <CardDescription>配置题目创建过程中的相关选项</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label htmlFor="aiproblem-showThinkingChainOnCreate" className="text-sm">
                  创建时显示思维链
                </Label>
                <p className="text-xs text-muted-foreground">
                  在创建题目时是否显示思维链过程
                </p>
              </div>
              <Switch id="aiproblem-showThinkingChainOnCreate" checked={formData.showThinkingChainOnCreate} onCheckedChange={checked => updateField("showThinkingChainOnCreate", checked)} disabled={saving} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="aiproblem-allowStudentDeleteKnowledge" className="text-sm">
                允许学生删除知识点
              </Label>
              <Switch id="aiproblem-allowStudentDeleteKnowledge" checked={formData.allowStudentDeleteKnowledge} onCheckedChange={checked => updateField("allowStudentDeleteKnowledge", checked)} disabled={saving} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="aiproblem-allowStudentAddKnowledge" className="text-sm">
                允许学生添加知识点
              </Label>
              <Switch id="aiproblem-allowStudentAddKnowledge" checked={formData.allowStudentAddKnowledge} onCheckedChange={checked => updateField("allowStudentAddKnowledge", checked)} disabled={saving} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiproblem-maxKnowledgePointsPerQuestion" className="text-sm">
                每题最多知识点数量
              </Label>
              <Input id="aiproblem-maxKnowledgePointsPerQuestion" type="number" min="1" max="20" placeholder="5" value={formData.maxKnowledgePointsPerQuestion} onChange={e => updateField("maxKnowledgePointsPerQuestion", parseInt(e.target.value) || 5)} disabled={saving} />
              <p className="text-xs text-muted-foreground">
                限制每个题目最多可以标记的知识点数量，建议设置为1-5之间。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 内容发送配置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>内容发送配置</CardTitle>
          <CardDescription>配置向AI发送哪些内容信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label htmlFor="aiproblem-sendQuestionImage" className="text-sm">
                  发送题目图片（必选）
                </Label>
                <p className="text-xs text-muted-foreground">
                  发送学生上传的图片，此选项必选，不能取消
                </p>
              </div>
              <Switch id="aiproblem-sendQuestionImage" checked={true} disabled={true} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="aiproblem-allowStudentUploadImage" className="text-sm">
                允许学生上传图片
              </Label>
              <Switch id="aiproblem-allowStudentUploadImage" checked={formData.allowStudentUploadImage} onCheckedChange={checked => updateField("allowStudentUploadImage", checked)} disabled={saving} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="aiproblem-sendRelatedKnowledge" className="text-sm">
                发送相关知识点
              </Label>
              <Switch id="aiproblem-sendRelatedKnowledge" checked={formData.sendRelatedKnowledge} onCheckedChange={checked => updateField("sendRelatedKnowledge", checked)} disabled={saving} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label htmlFor="aiproblem-showThinkingChain" className="text-sm">
                  聊天时显示思维链
                </Label>
                <p className="text-xs text-muted-foreground">
                  在与AI聊天时显示思维链，即使开启也需要大模型支持
                </p>
              </div>
              <Switch id="aiproblem-showThinkingChain" checked={formData.showThinkingChain} onCheckedChange={checked => updateField("showThinkingChain", checked)} disabled={saving} />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aiproblem-minimumMessageCount" className="text-sm">
                最低消息数量要求
              </Label>
              <Input id="aiproblem-minimumMessageCount" type="number" min="0" placeholder="0" value={formData.minimumMessageCount} onChange={e => updateField("minimumMessageCount", parseInt(e.target.value) || 0)} disabled={saving} />
              <p className="text-xs text-muted-foreground">
                学生至少要发送多少条消息才能结束答疑。设置为0表示无限制。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiproblem-minimumWaitTime" className="text-sm">
                最低等待时间（秒）
              </Label>
              <Input id="aiproblem-minimumWaitTime" type="number" min="0" placeholder="0" value={formData.minimumWaitTime} onChange={e => updateField("minimumWaitTime", parseInt(e.target.value) || 0)} disabled={saving} />
              <p className="text-xs text-muted-foreground">
                学生进入页面后至少要等待多少秒才能结束答疑。设置为0表示无限制。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiproblem-rewardPoints" className="text-sm">
                奖励积分
              </Label>
              <Input id="aiproblem-rewardPoints" type="number" min="0" placeholder="0" value={formData.rewardPoints} onChange={e => updateField("rewardPoints", parseInt(e.target.value) || 0)} disabled={saving} />
              <p className="text-xs text-muted-foreground">
                学生完成一次答疑时可以获得的积分奖励。设置为0表示无奖励。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 对话配置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>对话配置</CardTitle>
          <CardDescription>配置AI默认消息和快捷回复</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI默认消息配置 */}
          <div className="space-y-2">
            <Label htmlFor="aiproblem-defaultMessage">进入页面AI默认消息</Label>
            <Textarea id="aiproblem-defaultMessage" placeholder="请输入学生进入页面时AI发送的第一条消息内容" value={formData.defaultMessage} onChange={e => updateField("defaultMessage", e.target.value)} disabled={saving} rows={3} />
            <p className="text-sm text-muted-foreground">
              学生进入{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}
              页面时，AI会主动发送此消息给学生，引导开始对话。
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
