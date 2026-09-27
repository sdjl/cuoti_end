"use client";

import { Image as ImageIcon, RefreshCcw } from "lucide-react";
import BaseImage from "../../../../../../../../components/common/BaseImage.js";
import { Card } from "../../../../../../../../components/ui/card.js";
export default function RedoImageCard({
  aiChatSession,
  onImageClick
}) {
  const {
    redoImageUrl
  } = aiChatSession;

  // 如果没有重做图片，不显示组件
  if (!redoImageUrl) {
    return null;
  }
  return <Card className="glass-card mb-4">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCcw className="w-5 h-5 text-green-500" />
        <span className="font-medium text-gray-800">学生重做图片</span>
      </div>

      <div className="space-y-3">
        {/* 图片区域 */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="relative w-full cursor-pointer hover:opacity-90 transition-opacity" onClick={onImageClick}>
            <BaseImage src={redoImageUrl} alt="学生重做图片" width={500} height={300} className="w-full h-auto object-contain bg-gray-50" />
            {/* 点击提示覆盖层 */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                <ImageIcon className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 说明文字 */}
        <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-700">学生已重新解答</span>
          </div>
          <div className="mt-1 text-green-600">
            这是学生重新做题后上传的解答图片，点击可放大查看。
          </div>
        </div>
      </div>
    </Card>;
}
