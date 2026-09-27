"use client";

// 题目图片编辑页面，用于调整题目在试卷图片中的坐标位置
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { useToast } from "../../../../../../../../../hooks/use-toast.js";
import { getExamPaperById } from "../../../../../../../../../lib/collection/examPaper.js";
import { generatePageImage, saveCroppedImage } from "./actions.js";
import { CoordinatesDisplay } from "./components/CoordinatesDisplay.js";
import { ImageCropArea } from "./components/ImageCropArea.js";
export default function EditQuestionImagePage() {
  const params = useParams();
  const examId = params.id;
  const questionNumber = parseInt(params.questionNumber, 10);
  const pageNumber = parseInt(params.pageNumber, 10);
  const {
    toast
  } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfDimensions, setPdfDimensions] = useState({
    width: 0,
    height: 0
  });
  const [originalCoordinates, setOriginalCoordinates] = useState(null);
  const [cropArea, setCropArea] = useState({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
    isDragging: false,
    startX: 0,
    startY: 0,
    resizeMode: null
  });

  // 计算后的实际坐标（根据PDF尺寸）
  const [newCoordinates, setNewCoordinates] = useState(null);

  // 鼠标悬停状态
  const [hoverMode, setHoverMode] = useState(null);
  const imageContainerRef = useRef(null);

  // 获取题目所在页码和图片URL
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 从数据库获取试卷信息
        const examDocResult = await getExamPaperById(examId);
        if (!examDocResult) {
          throw new Error(`未找到试卷：${examId}`);
        }
        const examData = examDocResult;

        // 查找问题所在的页面和问题对象
        const foundPage = examData.pages.find(p => p.pageNumber === pageNumber);
        if (!foundPage) {
          throw new Error(`未找到页面：${pageNumber}`);
        }
        const foundQuestion = foundPage.questions.find(q => q.questionNumber === questionNumber);
        if (!foundQuestion) {
          throw new Error(`未找到题目：${questionNumber}`);
        }

        // 设置PDF尺寸
        setPdfDimensions({
          width: foundPage.pdfWidth,
          height: foundPage.pdfHeight
        });

        // 设置原始坐标
        setOriginalCoordinates({
          leftTop: foundQuestion.leftTop,
          rightBottom: foundQuestion.rightBottom
        });

        // 检查是否有图片URL
        if (foundPage.imageUrl) {
          setImageUrl(foundPage.imageUrl);
        } else {
          // 没有图片URL，生成图片
          setGenerating(true);
          const generatedImageUrl = await generatePageImage(examId, pageNumber);
          setGenerating(false);
          if (!generatedImageUrl) {
            throw new Error("生成图片失败");
          }
          setImageUrl(generatedImageUrl);
        }

        // 设置初始裁剪区域（根据原始坐标）
        // 需要将数据库中的坐标转换为页面上的像素坐标
        const containerWidth = 800; // 容器的宽度，应该与UI设置保持一致

        // 计算缩放比例
        const scaleRatio = containerWidth / foundPage.pdfWidth;
        setCropArea({
          x: foundQuestion.leftTop.x * scaleRatio,
          y: foundQuestion.leftTop.y * scaleRatio,
          width: (foundQuestion.rightBottom.x - foundQuestion.leftTop.x) * scaleRatio,
          height: (foundQuestion.rightBottom.y - foundQuestion.leftTop.y) * scaleRatio,
          isDragging: false,
          startX: 0,
          startY: 0,
          resizeMode: null
        });
      } catch (error) {
        console.error("获取试卷数据失败:", error);
        toast({
          title: "错误",
          description: `获取数据失败: ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [examId, questionNumber, pageNumber, toast]);

  // 计算实际坐标（基于PDF尺寸）
  useEffect(() => {
    if (!imageContainerRef.current || pdfDimensions.width === 0 || pdfDimensions.height === 0) return;
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;

    // 计算缩放比例
    const scaleRatio = pdfDimensions.width / containerWidth;

    // 计算新坐标
    const newLeftTop = {
      x: Math.round(cropArea.x * scaleRatio),
      y: Math.round(cropArea.y * scaleRatio)
    };
    const newRightBottom = {
      x: Math.round((cropArea.x + cropArea.width) * scaleRatio),
      y: Math.round((cropArea.y + cropArea.height) * scaleRatio)
    };
    setNewCoordinates({
      leftTop: newLeftTop,
      rightBottom: newRightBottom
    });
  }, [cropArea, pdfDimensions]);

  // 检测鼠标位置是否在调整区域的边缘
  const detectResizeEdge = (x, y) => {
    const edgeThreshold = 8; // 边缘检测阈值（像素）

    // 计算鼠标与裁剪区域各边缘的距离
    const distTop = Math.abs(y - cropArea.y);
    const distRight = Math.abs(x - (cropArea.x + cropArea.width));
    const distBottom = Math.abs(y - (cropArea.y + cropArea.height));
    const distLeft = Math.abs(x - cropArea.x);

    // 检查是否在任何角落
    if (distTop <= edgeThreshold && distLeft <= edgeThreshold) return "nw"; // 西北角
    if (distTop <= edgeThreshold && distRight <= edgeThreshold) return "ne"; // 东北角
    if (distBottom <= edgeThreshold && distRight <= edgeThreshold) return "se"; // 东南角
    if (distBottom <= edgeThreshold && distLeft <= edgeThreshold) return "sw"; // 西南角

    // 检查是否在任何边缘
    if (distTop <= edgeThreshold) return "n"; // 北边缘
    if (distRight <= edgeThreshold) return "e"; // 东边缘
    if (distBottom <= edgeThreshold) return "s"; // 南边缘
    if (distLeft <= edgeThreshold) return "w"; // 西边缘

    // 检查是否在区域内部
    if (x >= cropArea.x && x <= cropArea.x + cropArea.width && y >= cropArea.y && y <= cropArea.y + cropArea.height) {
      return "move"; // 在区域内部，可以移动
    }
    return null; // 不在任何可交互区域
  };

  // 鼠标移动时更新光标样式
  const handleMouseHover = e => {
    if (cropArea.isDragging) return; // 如果正在拖动，不改变光标样式

    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const mode = detectResizeEdge(x, y);
    setHoverMode(mode);
  };

  // 获取基于调整模式的光标样式
  const getCursorStyle = mode => {
    switch (mode) {
      case "n":
        return "ns-resize";
      case "e":
        return "ew-resize";
      case "s":
        return "ns-resize";
      case "w":
        return "ew-resize";
      case "ne":
        return "nesw-resize";
      case "se":
        return "nwse-resize";
      case "sw":
        return "nesw-resize";
      case "nw":
        return "nwse-resize";
      case "move":
        return "move";
      default:
        return "default";
    }
  };

  // 处理鼠标按下事件，开始拖动或调整大小
  const handleMouseDown = e => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const mode = detectResizeEdge(x, y);
    if (mode === "move") {
      // 整体移动模式
      setCropArea({
        ...cropArea,
        isDragging: true,
        startX: x - cropArea.x,
        startY: y - cropArea.y,
        resizeMode: "move"
      });
    } else if (mode) {
      // 调整大小模式
      setCropArea({
        ...cropArea,
        isDragging: true,
        startX: x,
        startY: y,
        resizeMode: mode
      });
    } else {
      // 如果点击位置不在现有裁剪区域，创建新的裁剪区域
      setCropArea({
        x,
        y,
        width: 0,
        height: 0,
        isDragging: true,
        startX: 0,
        startY: 0,
        resizeMode: "se" // 默认从左上角向右下角调整
      });
    }
  };

  // 处理鼠标移动事件，更新裁剪区域
  const handleMouseMove = e => {
    if (!cropArea.isDragging || !imageContainerRef.current) {
      // 如果没有拖动，更新鼠标样式
      handleMouseHover(e);
      return;
    }
    const rect = imageContainerRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    const x = Math.max(0, Math.min(e.clientX - rect.left, containerWidth));
    const y = Math.max(0, Math.min(e.clientY - rect.top, containerHeight));
    let newArea = {
      ...cropArea
    };
    if (cropArea.width === 0 && cropArea.height === 0) {
      // 创建新的裁剪区域
      newArea = {
        ...cropArea,
        width: x - cropArea.x,
        height: y - cropArea.y
      };
    } else if (cropArea.resizeMode === "move") {
      // 移动整个区域
      let newX = x - cropArea.startX;
      let newY = y - cropArea.startY;

      // 边界检查
      if (newX < 0) newX = 0;
      if (newY < 0) newY = 0;
      if (newX + cropArea.width > containerWidth) newX = containerWidth - cropArea.width;
      if (newY + cropArea.height > containerHeight) newY = containerHeight - cropArea.height;
      newArea = {
        ...cropArea,
        x: newX,
        y: newY
      };
    } else {
      // 调整区域大小
      const deltaX = x - cropArea.startX;
      const deltaY = y - cropArea.startY;
      let newX = cropArea.x;
      let newY = cropArea.y;
      let newWidth = cropArea.width;
      let newHeight = cropArea.height;

      // 根据不同的调整模式来更新裁剪区域
      if (cropArea.resizeMode?.includes("n")) {
        newY = Math.min(cropArea.y + cropArea.height, cropArea.y + deltaY);
        newHeight = cropArea.y + cropArea.height - newY;
      }
      if (cropArea.resizeMode?.includes("s")) {
        newHeight = Math.min(containerHeight - cropArea.y, cropArea.height + deltaY);
      }
      if (cropArea.resizeMode?.includes("w")) {
        newX = Math.min(cropArea.x + cropArea.width, cropArea.x + deltaX);
        newWidth = cropArea.x + cropArea.width - newX;
      }
      if (cropArea.resizeMode?.includes("e")) {
        newWidth = Math.min(containerWidth - cropArea.x, cropArea.width + deltaX);
      }

      // 边界检查
      if (newX < 0) {
        newWidth += newX;
        newX = 0;
      }
      if (newY < 0) {
        newHeight += newY;
        newY = 0;
      }

      // 保证宽高至少为1px
      newWidth = Math.max(1, newWidth);
      newHeight = Math.max(1, newHeight);
      newArea = {
        ...cropArea,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        startX: x,
        startY: y
      };
    }
    setCropArea(newArea);
  };

  // 处理鼠标松开事件，结束拖动
  const handleMouseUp = () => {
    setCropArea({
      ...cropArea,
      isDragging: false,
      resizeMode: null
    });
  };

  // 处理保存按钮点击事件
  const handleSave = async () => {
    if (!newCoordinates) return;
    try {
      setSaving(true);
      const result = await saveCroppedImage(examId, questionNumber, pageNumber, newCoordinates);
      if (result.success) {
        toast({
          title: "成功",
          description: result.message
        });
      } else {
        toast({
          title: "失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "错误",
        description: `保存失败: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  return <div className="container mx-auto">
      {loading ? <div className="flex justify-center items-center h-64">
          <p>加载中...</p>
        </div> : generating ? <div className="flex justify-center items-center h-64">
          <p>正在生成图片，请稍候...</p>
        </div> : <div className="flex flex-col items-center gap-4">
          {/* 坐标信息显示区域 */}
          <CoordinatesDisplay originalCoordinates={originalCoordinates} newCoordinates={newCoordinates} />

          <ImageCropArea imageUrl={imageUrl} pdfWidth={pdfDimensions.width} pdfHeight={pdfDimensions.height} cropArea={cropArea} hoverMode={hoverMode} imageContainerRef={imageContainerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} getCursorStyle={getCursorStyle} />

          <div className="flex justify-center mt-4">
            <Button onClick={handleSave} className="bg-primary text-white" disabled={saving}>
              {saving ? "保存中..." : "保存区域坐标"}
            </Button>
          </div>
        </div>}
    </div>;
}
