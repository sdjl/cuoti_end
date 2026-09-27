// 用户列表组件，用于展示用户信息并提供分页、编辑和状态管理

import { Ban, Edit, Loader2, MoreHorizontal, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CustomPagination } from "../../../../../components/common/Pagination.js";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../../components/ui/avatar.js";
import { Badge } from "../../../../../components/ui/badge.js";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../../../components/ui/dropdown-menu.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table.js";
export default function UserList({
  users,
  isLoading,
  totalCount,
  totalPages,
  currentPage,
  onPageChange,
  onUpdateUserStatus
}) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(null);
  const router = useRouter();

  // 更新用户状态
  const handleUpdateStatus = async (userId, status) => {
    try {
      setIsUpdatingStatus(userId);
      await onUpdateUserStatus(userId, status);
    } catch (error) {
      console.error("更新用户状态失败:", error);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // 跳转到编辑用户页面
  const handleEditUser = userId => {
    router.push(`/admin/user/${userId}/edit`);
  };

  // 格式化时间戳为日期字符串
  const formatTime = timestamp => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  // 获取角色显示文字
  const getRoleText = roles => {
    const roleMap = {
      super_admin: "超级管理员",
      admin: "管理员",
      teacher: "教师",
      principal: "校长",
      student: "学生",
      assistant: "助教"
    };
    return roles.map(role => roleMap[role] || role).join(", ");
  };

  // 获取状态Badge样式
  const getStatusBadge = status => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border-green-200">
            正常
          </Badge>;
      case "banned":
        return <Badge className="bg-red-100 text-red-800 border-red-200">
            已禁用
          </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 获取用户显示名称
  const getUserDisplayName = user => {
    return user.userInfo.name || user.userWxInfo.nickname || "未知用户";
  };

  // 获取最后登录时间显示
  const getLastLoginText = timestamp => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else {
      return "刚刚";
    }
  };

  // 检查用户是否为超级管理员
  const isSuperAdmin = user => {
    return user.roles.includes("super_admin");
  };
  return <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>用户列表</CardTitle>
          <CardDescription>
            <span>当前共有 {totalCount} 个用户</span>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户信息</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead>登录次数</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>加载中...</span>
                    </div>
                  </TableCell>
                </TableRow> : users.length > 0 ? users.map(user => {
              const isUserSuperAdmin = isSuperAdmin(user);
              return <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.userWxInfo.headimgurl} alt={getUserDisplayName(user)} />
                            <AvatarFallback>
                              {getUserDisplayName(user).charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {getUserDisplayName(user)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.userWxInfo.nickname && user.userInfo.name !== user.userWxInfo.nickname ? `昵称: ${user.userWxInfo.nickname}` : ""}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.userInfo.phone && <div className="text-sm">{user.userInfo.phone}</div>}
                          {user.userInfo.email && <div className="text-sm text-muted-foreground">
                              {user.userInfo.email}
                            </div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10">
                          {getRoleText(user.roles)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getLastLoginText(user.lastLoginAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{user.loginCount}</div>
                      </TableCell>
                      <TableCell>{formatTime(user.created)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isUpdatingStatus === user._id}>
                              {isUpdatingStatus === user._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user._id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑用户
                            </DropdownMenuItem>
                            {!isUserSuperAdmin && <>
                                {user.status !== "active" && <DropdownMenuItem onClick={() => handleUpdateStatus(user._id, "active")}>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    设为正常
                                  </DropdownMenuItem>}
                                {user.status !== "banned" && <DropdownMenuItem onClick={() => handleUpdateStatus(user._id, "banned")}>
                                    <Ban className="mr-2 h-4 w-4" />
                                    禁用用户
                                  </DropdownMenuItem>}
                              </>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>;
            }) : <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="text-muted-foreground">暂无用户数据</div>
                  </TableCell>
                </TableRow>}
            </TableBody>
          </Table>
        </div>

        {/* 分页组件 */}
        {totalPages > 1 && <div className="mt-4">
            <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
          </div>}
      </CardContent>
    </Card>;
}
