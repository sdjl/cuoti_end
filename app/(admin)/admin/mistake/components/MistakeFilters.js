// 错误归因筛选组件，用于搜索错误归因和创建新的错误归因

import { Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../../components/ui/button.js";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../../../components/ui/dialog.js";
import { Input } from "../../../../../components/ui/input.js";
import { Label } from "../../../../../components/ui/label.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
export default function MistakeFilters({
  searchTerm,
  setSearchTerm,
  onSearch,
  onReset,
  onCreateMistakePoint,
  subjectColor
}) {
  const {
    toast
  } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const handleCreateSubmit = async () => {
    if (!createName.trim()) {
      toast({
        title: "错误",
        description: `${DISPLAY_TEXT.ERROR_ATTRIBUTION}名称不能为空`,
        variant: "destructive"
      });
      return;
    }
    setIsCreating(true);
    try {
      const success = await onCreateMistakePoint(createName.trim(), createDescription.trim());
      if (success) {
        toast({
          title: "成功",
          description: `${DISPLAY_TEXT.ERROR_ATTRIBUTION}创建成功`
        });
        setCreateName("");
        setCreateDescription("");
        setCreateDialogOpen(false);
      } else {
        toast({
          title: "失败",
          description: `${DISPLAY_TEXT.ERROR_ATTRIBUTION}创建失败`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`创建${DISPLAY_TEXT.ERROR_ATTRIBUTION}时发生错误:`, error);
      toast({
        title: "错误",
        description: `创建${DISPLAY_TEXT.ERROR_ATTRIBUTION}时发生错误`,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  return <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
      {/* 左侧搜索区域 */}
      <div className="flex items-center gap-2 flex-1 mr-4">
        <div className="flex-1 relative">
          <Input placeholder={`搜索${DISPLAY_TEXT.ERROR_ATTRIBUTION}名称或描述...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Button variant="default" onClick={onSearch} style={{
        backgroundColor: subjectColor,
        borderColor: subjectColor
      }} className="hover:opacity-90">
          <Search className="mr-2 h-4 w-4" />
          搜索
        </Button>
        <Button variant="outline" onClick={onReset}>
          重置
        </Button>
      </div>

      {/* 分隔线 */}
      <div className="h-6 w-px" style={{
      backgroundColor: subjectColor
    }} />

      {/* 右侧新建区域 */}
      <div className="ml-4">
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" style={{
            backgroundColor: subjectColor,
            borderColor: subjectColor
          }} className="hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              新建{DISPLAY_TEXT.ERROR_ATTRIBUTION}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建{DISPLAY_TEXT.ERROR_ATTRIBUTION}</DialogTitle>
              <DialogDescription>
                创建一个新的{DISPLAY_TEXT.ERROR_ATTRIBUTION}
                ，填写名称和描述信息。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">
                  {DISPLAY_TEXT.ERROR_ATTRIBUTION}名称
                </Label>
                <Input id="name" value={createName} onChange={e => setCreateName(e.target.value)} placeholder={`请输入${DISPLAY_TEXT.ERROR_ATTRIBUTION}名称`} onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateSubmit();
                }
              }} />
              </div>
              <div>
                <Label htmlFor="description">
                  {DISPLAY_TEXT.ERROR_ATTRIBUTION}描述（可选）
                </Label>
                <Input id="description" value={createDescription} onChange={e => setCreateDescription(e.target.value)} placeholder={`请输入${DISPLAY_TEXT.ERROR_ATTRIBUTION}描述（可选）`} onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateSubmit();
                }
              }} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isCreating}>
                  取消
                </Button>
              </DialogClose>
              <Button onClick={handleCreateSubmit} disabled={isCreating}>
                {isCreating ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </> : "创建"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
}
