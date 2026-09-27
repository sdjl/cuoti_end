"use client";

// 图片裁剪区域组件，用于在题目图片上选择和调整裁剪区域
import BaseImage from "../../../../../../../../../../components/common/BaseImage.js";
export function ImageCropArea({
  imageUrl,
  pdfWidth,
  pdfHeight,
  cropArea,
  hoverMode,
  imageContainerRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  getCursorStyle
}) {
  return <div ref={imageContainerRef} className="relative overflow-hidden" style={{
    width: "100%",
    maxWidth: "800px"
  }} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      {imageUrl ? <div className="w-full h-full">
          <BaseImage src={imageUrl} alt="试题图片" width={pdfWidth} height={pdfHeight} style={{
        width: "100%",
        height: "auto",
        display: "block"
      }} />
        </div> : <div className="flex justify-center items-center h-full">
          <p>无法加载图片</p>
        </div>}

      {/* 裁剪区域 */}
      <div className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30" style={{
      left: `${cropArea.x}px`,
      top: `${cropArea.y}px`,
      width: `${Math.abs(cropArea.width)}px`,
      height: `${Math.abs(cropArea.height)}px`,
      cursor: cropArea.isDragging ? getCursorStyle(cropArea.resizeMode) : getCursorStyle(hoverMode)
    }}>
        {/* 边角调整把手 - 提供视觉反馈 */}
        <div className="absolute top-0 left-0 w-2 h-2 bg-blue-600" style={{
        transform: "translate(-50%, -50%)"
      }}></div>
        <div className="absolute top-0 right-0 w-2 h-2 bg-blue-600" style={{
        transform: "translate(50%, -50%)"
      }}></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-blue-600" style={{
        transform: "translate(-50%, 50%)"
      }}></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600" style={{
        transform: "translate(50%, 50%)"
      }}></div>
      </div>
    </div>;
}
