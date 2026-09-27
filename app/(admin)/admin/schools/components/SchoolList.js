// 校园列表组件，用于显示校园数据并提供编辑和删除操作

import { Loader2, MapPin, Pencil, Phone, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CustomPagination } from "../../../../../components/common/Pagination.js";
import { Badge } from "../../../../../components/ui/badge.js";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../components/ui/dialog.js";
import { Input } from "../../../../../components/ui/input.js";
import { Label } from "../../../../../components/ui/label.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
export default function SchoolList({
  schools,
  isLoading,
  totalCount,
  totalPages,
  currentPage,
  onPageChange,
  onDeleteSchool
}) {
  const {
    isSuperAdmin
  } = useAuth();
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmSchoolName, setConfirmSchoolName] = useState("");

  // 打开删除对话框
  const openDeleteDialog = schoolId => {
    setSchoolToDelete(schoolId);
    setConfirmSchoolName("");
    setIsDeleteDialogOpen(true);
  };

  // 关闭删除对话框
  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSchoolToDelete(null);
    setConfirmSchoolName("");
  };

  // 确认删除
  const confirmDelete = async () => {
    if (schoolToDelete) {
      try {
        setIsDeleting(true);
        await onDeleteSchool(schoolToDelete, confirmSchoolName);
      } catch (error) {
        console.error("删除校园失败:", error);
      } finally {
        setIsDeleting(false);
        closeDeleteDialog();
      }
    }
  };

  // 格式化时间戳为日期字符串
  const formatTime = timestamp => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  // 获取要删除的校园名称
  const getSchoolName = schoolId => {
    const school = schools.find(s => s._id === schoolId);
    return school?.name || "";
  };

  // 检查是否可以确认删除
  const canConfirmDelete = () => {
    if (!isSuperAdmin()) return false;
    const schoolName = getSchoolName(schoolToDelete || "");
    return confirmSchoolName.trim() === schoolName;
  };
  return <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>校园列表</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <span>当前共有 {totalCount} 个校园</span>
                <Link href="/admin/schools/create">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    新增校园
                  </Button>
                </Link>
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
                  <TableHead>区域</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>联系电话</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
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
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          {school.region}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground max-w-[200px]">
                          {school.address ? <>
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate" title={school.address}>
                                {school.address}
                              </span>
                            </> : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {school.phone ? <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{school.phone}</span>
                          </div> : "-"}
                      </TableCell>
                      <TableCell>
                        {school.status === "正常" ? <Badge className="bg-green-100 text-green-800 border-green-200">
                            正常
                          </Badge> : <Badge variant="outline" className="bg-gray-100">
                            停用
                          </Badge>}
                      </TableCell>
                      <TableCell>{formatTime(school.created)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/schools/${school._id}/edit?school_page=${currentPage}`}>
                            <Button variant="outline" size="icon" title="编辑">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="icon" onClick={() => openDeleteDialog(school._id)} title="删除" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>) : <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
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
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ 危险操作</DialogTitle>
            <DialogDescription asChild>
              {!isSuperAdmin() ? <div className="text-center py-4">
                  <span className="text-red-600 font-medium text-lg block">
                    只有超级管理员可以删除校园
                  </span>
                  <span className="text-muted-foreground mt-2 block">
                    当前用户没有删除校园的权限
                  </span>
                </div> : <div className="space-y-4">
                  <span className="block">
                    您即将删除校园{" "}
                    <span className="font-bold text-red-600">
                      &quot;{getSchoolName(schoolToDelete || "")}&quot;
                    </span>
                  </span>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <span className="text-red-800 font-medium text-sm block">
                      ⚠️
                      警告：此操作将永久删除该校园及其关联的所有数据（包括班级、学生等），且不可撤销！
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmName" className="text-sm font-medium">
                      请输入校园名称以确认删除：
                    </Label>
                    <Input id="confirmName" value={confirmSchoolName} onChange={e => setConfirmSchoolName(e.target.value)} placeholder={getSchoolName(schoolToDelete || "")} className="border-red-200 focus:border-red-400" />
                    <span className="text-xs text-muted-foreground block">
                      请输入完整的校园名称：
                      {getSchoolName(schoolToDelete || "")}
                    </span>
                  </div>
                </div>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog}>
              取消
            </Button>
            {isSuperAdmin() && <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete} disabled={isDeleting || !canConfirmDelete()}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                确认删除
              </Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}
