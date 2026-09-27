"use client";

import { UserCheck } from "lucide-react";
import Link from "next/link";
// 错题练习会话列表项卡片组件，用于展示单个错题练习会话的基本信息
import { useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card } from "../../../../../../../components/ui/card.js";
import ImageModal from "./ImageModal.js";
export default function SessionListItemCard({
  session,
  answerItem,
  question,
  password
}) {
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState("");
  const imageUrl = answerItem?.imageUrl || question?.imageUrl || "";
  const studentAnswerItemId = answerItem?._id || session.studentAnswerItemId;
  const dateStr = new Date(session.created).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).replace(/\//g, "-").replace(/\./g, "-");
  return <Card className="p-4 bg-white border border-gray-200 shadow-none">
      <div className="space-y-3">
        <div className="w-full overflow-hidden rounded border border-gray-200 bg-white flex items-center justify-center cursor-pointer" onClick={() => {
        if (imageUrl) {
          setModalImage(imageUrl);
          setShowModal(true);
        }
      }}>
          {imageUrl ? <BaseImage src={imageUrl} alt="题目图片" width={600} height={400} className="w-full h-auto object-contain" /> : <div className="text-gray-400 text-xs py-10">无图片</div>}
        </div>

        <div className="flex items-center gap-2 text-xs pt-1">
          <span className={`px-2 py-0.5 rounded-full ${session.isStudentMaster ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
            {session.isStudentMaster ? "已掌握" : "未掌握"}
          </span>
          {session.isNeedTeacherReply && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
              等待老师回复
            </span>}
          <span className="ml-auto text-gray-500">{dateStr}</span>
        </div>

        <div className="border-t border-gray-100 mt-2" />
        <div className="flex justify-center pt-2">
          <Button asChild variant="outline" className="rounded-lg border border-green-300 text-green-600 hover:text-green-600 bg-green-50 hover:bg-green-100 px-4 py-1.5">
            <Link href={`/mobile/records/mistake-practice/${studentAnswerItemId}/useLogs?password=${encodeURIComponent(password)}`} className="text-green-600 hover:text-green-600">
              <span className="inline-flex items-center gap-1">
                <UserCheck className="w-4 h-4" />
                老师帮忙
              </span>
            </Link>
          </Button>
        </div>
      </div>

      {showModal && <ImageModal imageUrl={modalImage} onClose={() => setShowModal(false)} />}
    </Card>;
}
