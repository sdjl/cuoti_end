"use client";

import { Loader2, Save } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../../../components/ui/button.js";
// 题目内容编辑页面，用于编辑题目的文本、答案、解析、知识点等完整内容
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { Label } from "../../../../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../../../hooks/use-toast.js";
import { useQuestionTypes } from "../../../../../../../../../hooks/useAdminConfig.js";
import { getQuestionData, updateQuestionContent } from "./actions.js";
import { ImageUploadField } from "./components/ImageUploadField.js";
import { KnowledgePointsManager } from "./components/KnowledgePointsManager.js";
import { QuestionBasicInfo } from "./components/QuestionBasicInfo.js";
import { QuestionImagePreview } from "./components/QuestionImagePreview.js";
import { QuestionMetadata } from "./components/QuestionMetadata.js";
import { deleteQuestionImage, uploadAnswerImage, uploadParseImage } from "./imageActions.js";
export default function EditQuestionContentPage() {
  const params = useParams();
  const id = params.id;
  const questionNumber = params.questionNumber;
  const pageNumber = params.pageNumber;
  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 异步获取数据
  useEffect(() => {
    async function fetchQuestionData() {
      try {
        const data = await getQuestionData(id, parseInt(questionNumber), pageNumber ? parseInt(pageNumber) : undefined);
        setQuestionData(data);
        setLoading(false);
      } catch (err) {
        console.error("获取题目数据失败:", err);
        setError(true);
        setLoading(false);
      }
    }
    fetchQuestionData();
  }, [id, questionNumber, pageNumber]);

  // 处理错误
  if (error) {
    notFound();
  }

  // 加载状态
  if (loading) {
    return <div className="container py-6 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>加载题目数据中...</p>
        </div>
      </div>;
  }

  // 确保数据已加载
  if (!questionData) {
    return null;
  }
  return <div className="container">
      <EditQuestionContentForm examId={id} questionNumber={parseInt(questionNumber)} pageNumber={questionData.pageNumber} initialData={questionData.question} subject={questionData.subject} />
    </div>;
}
function EditQuestionContentForm({
  examId,
  questionNumber,
  pageNumber,
  initialData,
  subject
}) {
  const {
    toast
  } = useToast();
  const {
    questionTypes,
    loading: questionTypesLoading
  } = useQuestionTypes();
  const [isSaving, setIsSaving] = useState(false);

  // 表单数据
  const [questionType, setQuestionType] = useState(initialData.questionType || "");
  const [questionText, setQuestionText] = useState(initialData.questionText || "");
  const [answer, setAnswer] = useState((initialData.answer || []).join("\n"));
  const [parse, setParse] = useState((initialData.parse || []).join("\n"));

  // 新增字段状态
  const [difficulty, setDifficulty] = useState(initialData.difficulty || "未知");
  const [easyToMistakeDetail, setEasyToMistakeDetail] = useState((initialData.easyToMistakeDetail || []).join("\n"));
  const [videoId, setVideoId] = useState(initialData.videoId || "");

  // 知识点相关
  const [knowledgePoints, setKnowledgePoints] = useState(initialData.knowledgePoints || []);

  // 图片上传相关
  const [answerImageFile, setAnswerImageFile] = useState(null);
  const [answerImagePreview, setAnswerImagePreview] = useState(initialData.answerImage?.imageUrl || null);
  const [parseImageFile, setParseImageFile] = useState(null);
  const [parseImagePreview, setParseImagePreview] = useState(initialData.parseImage?.imageUrl || null);
  const [oldAnswerImageFileID, setOldAnswerImageFileID] = useState(initialData.answerImage?.imageFileID || null);
  const [oldParseImageFileID, setOldParseImageFileID] = useState(initialData.parseImage?.imageFileID || null);

  // 处理答案图片选择
  const handleAnswerImageSelect = e => {
    const file = e.target.files?.[0];
    if (file) {
      setAnswerImageFile(file);
      // 创建预览URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnswerImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 删除答案图片
  const handleRemoveAnswerImage = () => {
    setAnswerImageFile(null);
    setAnswerImagePreview(null);
  };

  // 处理解析图片选择
  const handleParseImageSelect = e => {
    const file = e.target.files?.[0];
    if (file) {
      setParseImageFile(file);
      // 创建预览URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setParseImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 删除解析图片
  const handleRemoveParseImage = () => {
    setParseImageFile(null);
    setParseImagePreview(null);
  };

  // 将File转换为base64
  const fileToBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 保存表单
  const handleSubmit = async e => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 将多行文本拆分为数组
      const answerArray = answer.split("\n").filter(line => line.trim() !== "");
      const parseArray = parse.split("\n").filter(line => line.trim() !== "");
      const easyToMistakeDetailArray = easyToMistakeDetail.split("\n").filter(line => line.trim() !== "");

      // 处理答案图片上传
      let answerImageData;
      if (answerImageFile) {
        // 如果有旧图片，先删除
        if (oldAnswerImageFileID) {
          await deleteQuestionImage(oldAnswerImageFileID);
        }

        // 上传新图片
        const base64Data = await fileToBase64(answerImageFile);
        const uploadResult = await uploadAnswerImage(examId, pageNumber, questionNumber, base64Data, answerImageFile.type);
        if (uploadResult.success && uploadResult.data) {
          answerImageData = uploadResult.data;
        } else {
          toast({
            title: "警告",
            description: "答案图片上传失败，但其他内容将继续保存",
            variant: "destructive"
          });
        }
      } else if (!answerImagePreview && oldAnswerImageFileID) {
        // 如果用户删除了图片（预览为空但之前有图片）
        await deleteQuestionImage(oldAnswerImageFileID);
        answerImageData = null; // 明确标记为删除
      } else if (answerImagePreview && oldAnswerImageFileID) {
        // 保持原有图片不变（不传递此字段，保持 undefined）
        answerImageData = undefined;
      }

      // 处理解析图片上传
      let parseImageData;
      if (parseImageFile) {
        // 如果有旧图片，先删除
        if (oldParseImageFileID) {
          await deleteQuestionImage(oldParseImageFileID);
        }

        // 上传新图片
        const base64Data = await fileToBase64(parseImageFile);
        const uploadResult = await uploadParseImage(examId, pageNumber, questionNumber, base64Data, parseImageFile.type);
        if (uploadResult.success && uploadResult.data) {
          parseImageData = uploadResult.data;
        } else {
          toast({
            title: "警告",
            description: "解析图片上传失败，但其他内容将继续保存",
            variant: "destructive"
          });
        }
      } else if (!parseImagePreview && oldParseImageFileID) {
        // 如果用户删除了图片（预览为空但之前有图片）
        await deleteQuestionImage(oldParseImageFileID);
        parseImageData = null; // 明确标记为删除
      } else if (parseImagePreview && oldParseImageFileID) {
        // 保持原有图片不变（不传递此字段，保持 undefined）
        parseImageData = undefined;
      }
      const result = await updateQuestionContent(examId, pageNumber, questionNumber, {
        questionType,
        questionText,
        answer: answerArray,
        parse: parseArray,
        knowledgePoints,
        difficulty: difficulty,
        easyToMistakeDetail: easyToMistakeDetailArray,
        videoId: videoId.trim() || undefined,
        answerImage: answerImageData,
        parseImage: parseImageData
      });
      if (result) {
        // 更新旧图片ID
        if (answerImageData) {
          setOldAnswerImageFileID(answerImageData.imageFileID);
        } else if (!answerImagePreview) {
          setOldAnswerImageFileID(null);
        }
        if (parseImageData) {
          setOldParseImageFileID(parseImageData.imageFileID);
        } else if (!parseImagePreview) {
          setOldParseImageFileID(null);
        }

        // 清空文件选择
        setAnswerImageFile(null);
        setParseImageFile(null);
        toast({
          title: "成功",
          description: "题目内容已更新"
        });
      } else {
        toast({
          title: "失败",
          description: "题目内容更新失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "错误",
        description: `更新失败: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  return <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>题目内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <QuestionBasicInfo questionType={questionType} questionText={questionText} questionTypes={questionTypes} questionTypesLoading={questionTypesLoading} onQuestionTypeChange={setQuestionType} onQuestionTextChange={setQuestionText} />

          <div className="space-y-2">
            <Label htmlFor="answer">答案（每行一个）</Label>
            <Textarea id="answer" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="请输入答案，每行一个" className="min-h-32" />
          </div>

          <ImageUploadField label="答案图片（可选）" fieldId="answerImage" imagePreview={answerImagePreview} onImageSelect={handleAnswerImageSelect} onRemoveImage={handleRemoveAnswerImage} />

          <div className="space-y-2">
            <Label htmlFor="parse">解析（每行一个）</Label>
            <Textarea id="parse" value={parse} onChange={e => setParse(e.target.value)} placeholder="请输入解析，每行一个" className="min-h-32" />
          </div>

          <ImageUploadField label="解析图片（可选）" fieldId="parseImage" imagePreview={parseImagePreview} onImageSelect={handleParseImageSelect} onRemoveImage={handleRemoveParseImage} />

          <QuestionMetadata difficulty={difficulty} easyToMistakeDetail={easyToMistakeDetail} videoId={videoId} onDifficultyChange={value => setDifficulty(value)} onEasyToMistakeDetailChange={setEasyToMistakeDetail} onVideoIdChange={setVideoId} />

          <KnowledgePointsManager knowledgePoints={knowledgePoints} subject={subject} onKnowledgePointsChange={setKnowledgePoints} />
        </CardContent>
      </Card>

      {initialData.imageUrl && <QuestionImagePreview imageUrl={initialData.imageUrl} questionNumber={questionNumber} />}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
          {isSaving ? <>
              <Loader2 className="h-4 w-4 animate-spin" />
              保存中...
            </> : <>
              <Save className="h-4 w-4" />
              保存修改
            </>}
        </Button>
      </div>
    </form>;
}
