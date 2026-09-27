"use client";

import { FileText } from "lucide-react";
// PDF文本显示组件，用于显示从PDF文件中提取的文本内容
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { ScrollArea } from "../../../../../../../components/ui/scroll-area.js";
export function PdfTextDisplay({
  extractingText,
  pdfText,
  cardHeight
}) {
  return <Card className="col-span-1 flex flex-col" style={{
    height: `${cardHeight}px`
  }}>
      <CardHeader className="flex-shrink-0">
        <CardTitle>PDF文本内容</CardTitle>
        <CardDescription>
          {extractingText ? "正在提取PDF文本内容..." : pdfText ? "PDF文件的文本内容如下" : "上传PDF文件后将显示文本内容"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {extractingText ? <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">正在提取PDF文本内容...</div>
          </div> : pdfText ? <ScrollArea className="w-full h-full rounded-md border p-4">
            <pre className="text-sm whitespace-pre-wrap break-words">
              {pdfText}
            </pre>
          </ScrollArea> : <div className="flex items-center justify-center h-full border rounded-md">
            <div className="text-center text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p>上传PDF文件后将在此显示文本内容</p>
            </div>
          </div>}
      </CardContent>
    </Card>;
}
