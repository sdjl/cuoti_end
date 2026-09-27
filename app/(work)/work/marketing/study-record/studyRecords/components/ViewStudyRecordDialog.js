"use client";

import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../components/ui/badge.js";
// 查看学情记录详情对话框组件
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { dateToString } from "../../../../../../../lib/common/time.js";
const getPointsBadge = points => {
  if (points > 0) {
    return <Badge className="bg-green-100 text-green-800">+{points}</Badge>;
  } else if (points < 0) {
    return <Badge variant="destructive">{points}</Badge>;
  } else {
    return <Badge variant="outline">0</Badge>;
  }
};
const openImageInNewTab = imageUrl => {
  window.open(imageUrl, "_blank");
};
export default function ViewStudyRecordDialog({
  open,
  onOpenChange,
  record
}) {
  if (!record) {
    return null;
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>学情记录详情</DialogTitle>
          <DialogDescription>查看学生的学情记录详细信息</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">班级</label>
              <div className="mt-1">{record.classroom?.name || "未知班级"}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                学生姓名
              </label>
              <div className="mt-1">{record.student?.name || "未知学生"}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                学生编号
              </label>
              <div className="mt-1">
                {record.student?.studentCode || "未知编号"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                积分变动
              </label>
              <div className="mt-1">{getPointsBadge(record.points)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                操作老师
              </label>
              <div className="mt-1">
                {record.operatorUser?.userInfo?.name || "未知老师"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                创建时间
              </label>
              <div className="mt-1">
                {dateToString(new Date(record.created))}
              </div>
            </div>
          </div>

          {/* 记录内容 */}
          <div>
            <label className="text-sm font-medium text-gray-500">
              记录内容
            </label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
              {record.content || "无内容"}
            </div>
          </div>

          {/* 上传的图片 */}
          {record.images && record.images.length > 0 && <div>
              <label className="text-sm font-medium text-gray-500 mb-3 block">
                上传的图片（点击可在新窗口打开）
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {record.images.map((image, index) => <div key={image.imageFileID || index} className="relative group cursor-pointer" onClick={() => openImageInNewTab(image.imageUrl)}>
                    <BaseImage src={image.imageUrl} alt={`学情记录图片 ${index + 1}`} width={100} height={100} className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:shadow-md transition-shadow" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                        点击查看大图
                      </span>
                    </div>
                  </div>)}
              </div>
            </div>}

          {/* 如果没有图片 */}
          {(!record.images || record.images.length === 0) && <div>
              <label className="text-sm font-medium text-gray-500">
                上传的图片
              </label>
              <div className="mt-1 p-8 bg-gray-50 rounded-lg text-center text-gray-500">
                暂无图片
              </div>
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
}
