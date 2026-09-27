"use client";

import { Edit, QrCode, Ticket } from "lucide-react";
// 合作伙伴邀请码列表组件，展示邀请码列表并提供编辑和二维码分享功能
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../components/ui/popover.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../components/ui/tooltip.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { generateNormalURL, generateQRCodeDataURL } from "../../../../../../../lib/common/qrcode.js";
import { DOMAIN } from "../../../../../../../lib/config/constants.js";
export default function PartnerCodeList({
  invitationCodes,
  isLoading,
  onEditInvitationCode
}) {
  const {
    toast
  } = useToast();
  const [qrCodeData, setQrCodeData] = useState(new Map());

  // 生成邀请码二维码URL
  const generateInvitationCodeURL = code => {
    const isDevelopment = process.env.NODE_ENV === "development";
    const path = isDevelopment ? "/invitation-dev" : "/invitation";
    const baseUrl = isDevelopment ? `http://${DOMAIN.BASE}` : `https://${DOMAIN.BASE}`;
    return generateNormalURL(path, [code], baseUrl);
  };

  // 当邀请码数据变化时，预生成所有二维码
  useEffect(() => {
    const generateAllQRCodes = async () => {
      const newQrCodeData = new Map();
      for (const invitationCode of invitationCodes) {
        const url = generateInvitationCodeURL(invitationCode.code);
        const qrCode = await generateQRCodeDataURL(url);
        if (qrCode) {
          newQrCodeData.set(invitationCode._id, qrCode);
        }
      }
      setQrCodeData(newQrCodeData);
    };
    if (invitationCodes.length > 0) {
      generateAllQRCodes();
    }
  }, [invitationCodes]);

  // 复制文本到剪贴板
  const copyToClipboard = async text => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "复制成功",
        description: "内容已复制到剪贴板"
      });
    } catch (err) {
      console.error("复制失败:", err);
      toast({
        title: "复制失败",
        description: "复制到剪贴板时发生错误",
        variant: "destructive"
      });
    }
  };

  // 获取状态标记
  const getStatusBadge = status => {
    const statusConfig = {
      active: {
        color: "bg-green-100 text-green-800",
        text: "启用"
      },
      disabled: {
        color: "bg-red-100 text-red-800",
        text: "禁用"
      }
    };
    const config = statusConfig[status] || statusConfig.disabled;
    return <div className={`text-xs px-2 py-1 rounded-full inline-block hover:opacity-80 ${config.color}`}>
        {config.text}
      </div>;
  };

  // 获取使用状态标记
  const getUsedStatusBadge = usedCount => {
    const isUsed = usedCount > 0;
    const config = isUsed ? {
      color: "bg-blue-100 text-blue-800",
      text: `${usedCount} 次`
    } : {
      color: "bg-gray-100 text-gray-800",
      text: "未使用"
    };
    return <div className={`text-xs px-2 py-1 rounded-full inline-block hover:opacity-80 ${config.color}`}>
        {config.text}
      </div>;
  };

  // 计算有效期
  const getValidityPeriod = (created, validDays) => {
    try {
      const createdDate = new Date(created);
      const expiryDate = new Date(created + validDays * 24 * 60 * 60 * 1000);
      const now = new Date();
      const isExpired = now > expiryDate;
      const text = `${createdDate.toLocaleDateString("zh-CN")} 至 ${expiryDate.toLocaleDateString("zh-CN")}`;
      return {
        text,
        isExpired
      };
    } catch {
      return {
        text: "无效时间",
        isExpired: false
      };
    }
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (invitationCodes.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <Ticket className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无合作伙伴邀请码数据</p>
        </CardContent>
      </Card>;
  }
  return <TooltipProvider>
      <Card className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>备注</TableHead>
              <TableHead>邀请码</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>体验天数</TableHead>
              <TableHead>使用次数</TableHead>
              <TableHead>有效期</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitationCodes.map(item => {
            const validity = getValidityPeriod(item.created, item.validDays);
            return <TableRow key={item._id}>
                  <TableCell>
                    <div className="font-medium cursor-pointer hover:text-blue-600 max-w-32 truncate" onClick={() => copyToClipboard(item.remark || "无备注")} title={item.remark || "无备注"}>
                      {item.remark || "无备注"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono font-bold text-lg cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(item.code)}>
                      {item.code}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {item.experienceDays} 天
                    </div>
                  </TableCell>
                  <TableCell>{getUsedStatusBadge(item.usedCount)}</TableCell>
                  <TableCell>
                    <div className={`text-sm ${validity.isExpired ? "text-red-600" : "text-gray-600"}`} title={validity.isExpired ? "已过期" : "有效"}>
                      {validity.text}
                      {validity.isExpired && <span className="ml-1 text-xs">(已过期)</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {/* 二维码按钮 */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" title="二维码分享" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                            <QrCode className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="left" className="w-auto p-4">
                          <div className="text-center space-y-2">
                            <div className="text-sm font-medium text-gray-900">
                              邀请码二维码
                            </div>
                            <div className="text-xs text-gray-500">
                              扫码访问邀请页面
                            </div>
                            <div className="text-xs text-gray-600">
                              邀请码：{item.code}
                            </div>
                            {qrCodeData.get(item._id) ? <BaseImage src={qrCodeData.get(item._id) || ""} alt="邀请码二维码" width={192} height={192} className="w-48 h-48 mx-auto" /> : <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded">
                                <span className="text-sm text-gray-500">
                                  生成中...
                                </span>
                              </div>}
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>
                                URL: {generateInvitationCodeURL(item.code)}
                              </div>
                              <div>体验天数：{item.experienceDays} 天</div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* 编辑按钮 */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => onEditInvitationCode(item._id)} title="编辑邀请码">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>编辑邀请码</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>;
          })}
          </TableBody>
        </Table>
      </Card>
    </TooltipProvider>;
}
