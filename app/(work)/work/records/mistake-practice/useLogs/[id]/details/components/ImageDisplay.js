"use client";

// 作答图片展示组件，展示学生的首次做题图片和重做图片
import BaseImage from "../../../../../../../../../components/common/BaseImage.js";
export default function ImageDisplay({
  details
}) {
  const {
    studentAnswerItem,
    aiChatSessions
  } = details;

  // 获取首次做题图片
  const firstImageUrl = studentAnswerItem.imageUrl;

  // 获取重做图片（从最新的会话中获取）
  const latestSession = aiChatSessions.length > 0 ? aiChatSessions[0] : null;
  const redoImageUrl = latestSession?.redoImageUrl;

  // 处理图片点击，在新窗口中打开
  const handleImageClick = imageUrl => {
    window.open(imageUrl, "_blank");
  };
  return <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">作答图片</h2>

      <div className="space-y-6">
        {/* 首次做题图片 */}
        <div>
          <h3 className="font-medium text-gray-700 mb-3">首次做题</h3>
          {firstImageUrl ? <div className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-gray-50" onClick={() => handleImageClick(firstImageUrl)} title="点击在新窗口中打开">
              <BaseImage src={firstImageUrl} alt="首次做题图片" width={800} height={600} className="w-full h-auto object-contain" />
            </div> : <div className="border rounded-lg p-8 bg-gray-50 text-center">
              <p className="text-gray-500 text-sm">暂无首次做题图片</p>
            </div>}
        </div>

        {/* 重做图片 */}
        <div>
          <h3 className="font-medium text-gray-700 mb-3">重做图片</h3>
          {redoImageUrl ? <div className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-gray-50" onClick={() => handleImageClick(redoImageUrl)} title="点击在新窗口中打开">
              <BaseImage src={redoImageUrl} alt="重做图片" width={800} height={600} className="w-full h-auto object-contain" />
            </div> : <div className="border rounded-lg p-8 bg-gray-50 text-center">
              <p className="text-gray-500 text-sm">暂无重做图片</p>
            </div>}
        </div>
      </div>
    </div>;
}
