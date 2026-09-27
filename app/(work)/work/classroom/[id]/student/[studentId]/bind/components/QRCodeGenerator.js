"use client";

// 二维码生成器组件，用于生成和显示二维码图片
import { QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";
export default function QRCodeGenerator({
  value,
  size = 200,
  className = ""
}) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      }, error => {
        if (error) {
          console.error("生成二维码失败:", error);
        }
      });
    }
  }, [value, size]);
  if (!value) {
    return <div className={`flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-100 ${className}`} style={{
      width: size,
      height: size
    }}>
        <div className="text-center text-gray-500">
          <QrCode className="w-8 h-8 mx-auto mb-1" />
          <div className="text-xs">暂无数据</div>
        </div>
      </div>;
  }
  return <canvas ref={canvasRef} className={className} />;
}
