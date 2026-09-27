// 校园校长列表组件，用于显示校园列表及其对应的校长信息

import { Edit, Loader2, Mail, Phone, RefreshCw, Users, UserX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CustomPagination } from "../../../../../components/common/Pagination.js";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table.js";
export default function SchoolAdminList({
  schools,
  isLoading,
  totalCount,
  totalPages,
  currentPage,
  onPageChange,
  onRefresh
}) {
  // 渲染管理员信息
  const renderAdmins = admins => {
    if (admins.length === 0) {
      return <div className="flex items-center gap-2 text-red-600">
          <UserX className="h-4 w-4" />
          <span className="text-sm font-medium">暂无校长</span>
        </div>;
    }
    return <div className="space-y-2">
        {admins.map(admin => <div key={admin._id} className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex-shrink-0">
              {admin.userWxInfo?.headimgurl ? <Image src={admin.userWxInfo.headimgurl} alt={admin.userInfo?.name || admin.userWxInfo?.nickname || "头像"} width={40} height={40} className="rounded-full object-cover" /> : <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-500" />
                </div>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {admin.userInfo?.name || admin.userWxInfo?.nickname || "未知"}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground space-y-1">
                {admin.userInfo?.phone && <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{admin.userInfo.phone}</span>
                  </div>}
                {admin.userInfo?.email && <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>{admin.userInfo.email}</span>
                  </div>}
              </div>
            </div>
          </div>)}
      </div>;
  };
  return <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>校园校长列表</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2">
              <span>当前共有 {totalCount} 个校园</span>
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新
              </Button>
            </div>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>校园名称</TableHead>
                <TableHead className="w-[400px]">校长信息</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>加载中...</span>
                    </div>
                  </TableCell>
                </TableRow> : schools.length > 0 ? schools.map(school => <TableRow key={school._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{school.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[380px]">
                        {renderAdmins(school.admins)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/school-admins/${school._id}/edit?admin_page=${currentPage}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" />
                          编辑校长
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>) : <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    <div className="text-muted-foreground">暂无校园数据</div>
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
