"use client";

import { ChevronDown, ChevronUp, QrCode } from "lucide-react";
// 联系老师卡片组件，用于展示老师微信二维码，方便学生联系老师
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../../components/common/BaseImage.js";
import { Card } from "../../../../../../../../components/ui/card.js";
import { getContactsQrcodeUrl } from "../actions.js";
function isValidQrcodeUrl(value) {
  if (typeof value !== "string") return false;
  const url = value.trim();
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:");
}
export default function ContactTeacherCard() {
  const [qrcodeUrl, setQrcodeUrl] = useState(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const url = await getContactsQrcodeUrl();
        setQrcodeUrl(isValidQrcodeUrl(url) ? url : "");
      } catch (error) {
        console.error("加载联系老师二维码失败:", error);
        setQrcodeUrl("");
      }
    })();
  }, []);
  if (qrcodeUrl === null || qrcodeUrl === "") return null;
  return <Card className="glass-card">
      <button type="button" className="w-full flex items-center justify-between gap-2" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-gray-800">联系老师</span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>

      {expanded && <div className="mt-4 space-y-3">
          <div className="text-sm text-gray-600">
            扫码添加老师微信后进行沟通。
          </div>
          <div className="flex justify-center">
            <BaseImage src={qrcodeUrl} alt="老师微信二维码" width={320} height={320} className="w-full max-w-xs h-auto rounded-lg border" priority={false} />
          </div>
          <p className="text-xs text-gray-500 text-center">
            可截图保存后，在微信中选择“扫一扫”→“相册”进行扫码识别。
          </p>
        </div>}
    </Card>;
}
