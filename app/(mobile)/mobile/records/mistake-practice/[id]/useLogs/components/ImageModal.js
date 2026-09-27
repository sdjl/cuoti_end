"use client";

import { X } from "lucide-react";
import BaseImage from "../../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../../components/ui/button.js";
export default function ImageModal({
  imageUrl,
  onClose
}) {
  return <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <Button variant="ghost" size="sm" onClick={onClose} className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white">
          <X className="w-6 h-6" />
        </Button>

        <div className="transform rotate-90" style={{
        maxWidth: "90vh",
        maxHeight: "90vw"
      }}>
          <BaseImage src={imageUrl} alt="题目图片" width={800} height={600} className="max-w-full max-h-full object-contain" style={{
          objectFit: "contain"
        }} />
        </div>
      </div>
    </div>;
}
