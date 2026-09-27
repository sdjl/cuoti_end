"use client";

// JWT调试页面，用于查看和调试JWT令牌的详细信息
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../../../components/ui/alert.js";
import { Badge } from "../../../../../components/ui/badge.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { getFormattedJWTData, getJWTDebugInfo } from "./actions.js";
import { BasicInfoCard } from "./components/BasicInfoCard.js";
import { CurrentSchoolCard } from "./components/CurrentSchoolCard.js";
import { JWTHeader } from "./components/JWTHeader.js";
import { PayloadJsonCard } from "./components/PayloadJsonCard.js";
export default function ShowJWTPage() {
  const [jwtData, setJwtData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    toast
  } = useToast();

  // 加载JWT数据
  const loadJWTData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getJWTDebugInfo();
      if (!result.success) {
        setError(result.error || "获取JWT数据失败");
        setJwtData(null);
        return;
      }
      setJwtData(result.data || null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "未知错误";
      setError(errorMsg);
      setJwtData(null);
    } finally {
      setLoading(false);
    }
  };

  // 复制格式化的JWT数据
  const copyFormattedData = async () => {
    try {
      const result = await getFormattedJWTData();
      if (!result.success) {
        toast({
          title: "复制失败",
          description: result.error || "无法获取格式化数据",
          variant: "destructive"
        });
        return;
      }
      await navigator.clipboard.writeText(result.data || "");
      toast({
        title: "复制成功",
        description: "格式化的JWT调试数据已复制到剪贴板"
      });
    } catch (err) {
      toast({
        title: "复制失败",
        description: err instanceof Error ? err.message : "复制失败",
        variant: "destructive"
      });
    }
  };

  // 格式化时间显示
  const formatTime = timestamp => {
    return new Date(timestamp * 1000).toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai"
    });
  };

  // 格式化剩余时间
  const formatRemainingTime = seconds => {
    if (seconds <= 0) return "已过期";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}分钟${remainingSeconds}秒`;
    } else {
      return `${remainingSeconds}秒`;
    }
  };

  useEffect(() => {
    loadJWTData();
  }, []);
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* 顶部导航栏 */}
      <JWTHeader onRefresh={loadJWTData} onCopyData={copyFormattedData} />

      <main className="p-6 overflow-x-hidden">
        <div className="container mx-auto max-w-6xl space-y-6">
          {error && <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>}

          {jwtData && <div className="grid gap-6">
              {/* 基本信息 */}
              <BasicInfoCard jwtData={jwtData} formatRemainingTime={formatRemainingTime} />

              {/* 当前校园 */}
              {jwtData.decoded?.workSetting?.currentSchool && <CurrentSchoolCard school={jwtData.decoded.workSetting.currentSchool} isPrincipal={jwtData.decoded.workSetting.isPrincipal} formatTime={formatTime} />}

              {/* JWT标准字段 */}
              {jwtData.decoded && <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>JWT标准字段</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="overflow-hidden">
                        <span className="font-medium">签发时间：</span>
                        <span className="break-all">
                          {jwtData.decoded.iat ? formatTime(jwtData.decoded.iat) : "未知"}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-medium">过期时间：</span>
                        <span className="break-all">
                          {jwtData.decoded.exp ? formatTime(jwtData.decoded.exp) : "未知"}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-medium">JWT ID：</span>
                        <span className="font-mono text-xs break-all">
                          {jwtData.decoded.jti}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-medium">签发者：</span>
                        <span className="font-mono text-xs break-all">
                          {jwtData.decoded.iss}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-medium">受众：</span>
                        <span className="font-mono text-xs break-all">
                          {jwtData.decoded.aud}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-medium">主题：</span>
                        <span className="font-mono text-xs break-all">
                          {jwtData.decoded.sub}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>}

              {/* 基本用户信息 */}
              {jwtData.decoded && <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>基本用户信息</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="overflow-hidden">
                        <span className="font-medium">用户ID：</span>
                        <span className="font-mono text-xs break-all">
                          {jwtData.decoded.wxUserId}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-medium">OpenID：</span>
                        <span className="font-mono text-xs break-all">
                          {jwtData.decoded.openid}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-medium">UnionID：</span>
                        <span className="font-mono text-xs break-all">
                          {jwtData.decoded.unionid}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">状态：</span>
                        <Badge variant={jwtData.decoded.status === "active" ? "default" : "destructive"}>
                          {jwtData.decoded.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>}

              {/* 微信用户信息 */}
              {jwtData.decoded?.userWxInfo && <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>微信用户信息</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {jwtData.decoded.userWxInfo.nickname && <div className="overflow-hidden">
                          <span className="font-medium">昵称：</span>
                          <span className="break-all">
                            {jwtData.decoded.userWxInfo.nickname}
                          </span>
                        </div>}
                      {jwtData.decoded.userWxInfo.headimgurl && <div className="overflow-hidden">
                          <span className="font-medium">头像URL：</span>
                          <span className="font-mono text-xs break-all">
                            {jwtData.decoded.userWxInfo.headimgurl}
                          </span>
                        </div>}
                      {jwtData.decoded.userWxInfo.sex !== undefined && <div>
                          <span className="font-medium">性别：</span>
                          <span>
                            {jwtData.decoded.userWxInfo.sex === 1 ? "男" : jwtData.decoded.userWxInfo.sex === 2 ? "女" : "未知"}
                          </span>
                        </div>}
                      {jwtData.decoded.userWxInfo.province && <div className="overflow-hidden">
                          <span className="font-medium">省份：</span>
                          <span className="break-all">
                            {jwtData.decoded.userWxInfo.province}
                          </span>
                        </div>}
                      {jwtData.decoded.userWxInfo.city && <div className="overflow-hidden">
                          <span className="font-medium">城市：</span>
                          <span className="break-all">
                            {jwtData.decoded.userWxInfo.city}
                          </span>
                        </div>}
                      {jwtData.decoded.userWxInfo.country && <div className="overflow-hidden">
                          <span className="font-medium">国家：</span>
                          <span className="break-all">
                            {jwtData.decoded.userWxInfo.country}
                          </span>
                        </div>}
                    </div>
                  </CardContent>
                </Card>}

              {/* 备注用户信息 */}
              {jwtData.decoded?.userInfo && <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>备注用户信息</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {jwtData.decoded.userInfo.name && <div className="overflow-hidden">
                          <span className="font-medium">姓名：</span>
                          <span className="break-all">
                            {jwtData.decoded.userInfo.name}
                          </span>
                        </div>}
                      {jwtData.decoded.userInfo.gender && <div className="overflow-hidden">
                          <span className="font-medium">性别：</span>
                          <span className="break-all">
                            {jwtData.decoded.userInfo.gender}
                          </span>
                        </div>}
                      {jwtData.decoded.userInfo.phone && <div className="overflow-hidden">
                          <span className="font-medium">手机号：</span>
                          <span className="break-all">
                            {jwtData.decoded.userInfo.phone}
                          </span>
                        </div>}
                      {jwtData.decoded.userInfo.email && <div className="overflow-hidden">
                          <span className="font-medium">邮箱：</span>
                          <span className="break-all">
                            {jwtData.decoded.userInfo.email}
                          </span>
                        </div>}
                      {jwtData.decoded.userInfo.address && <div className="md:col-span-2 overflow-hidden">
                          <span className="font-medium">地址：</span>
                          <span className="break-all">
                            {jwtData.decoded.userInfo.address}
                          </span>
                        </div>}
                      {jwtData.decoded.userInfo.remark && <div className="md:col-span-2 overflow-hidden">
                          <span className="font-medium">备注：</span>
                          <span className="break-all">
                            {jwtData.decoded.userInfo.remark}
                          </span>
                        </div>}
                    </div>
                  </CardContent>
                </Card>}

              {/* 角色权限 */}
              {jwtData.decoded && <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>角色权限</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {jwtData.decoded.roles?.map((role, index) => <Badge key={index} variant="secondary">
                            {role}
                          </Badge>)}
                    </div>
                  </CardContent>
                </Card>}

              {/* 完整载荷JSON */}
              {jwtData.decoded && <PayloadJsonCard payload={jwtData.decoded} />}
            </div>}
        </div>
      </main>
    </div>;
}
