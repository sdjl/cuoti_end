"use client";

// 切题失败显示组件，当切题失败时显示第三方API返回的数据用于调试
import JsonDisplay from "./JsonDisplay.js";
export default function CuttingFailureDisplay({
  examPaper,
  cuttingServiceInfo
}) {
  // 只在切题失败且有API返回数据时显示
  if (examPaper.cuttingStatus !== "failed" || !examPaper.cuttingError || !examPaper.cuttingError.includes("OCR结果验证失败。API返回数据:")) {
    return null;
  }
  const match = examPaper.cuttingError?.match(/API返回数据: (.+)$/);
  const apiData = match ? match[1] : "";
  if (!apiData) {
    return null;
  }
  return <JsonDisplay title="第三方API返回数据" data={apiData} error="OCR结果验证失败，请查看API返回数据进行调试" provider={cuttingServiceInfo?.provider} />;
}
