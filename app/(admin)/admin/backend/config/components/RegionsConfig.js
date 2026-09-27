"use client";

import { Lock, Plus, Save, Trash2, Unlock, X } from "lucide-react";
// 区域配置组件，用于管理系统中的区域列表，支持添加、编辑、删除和锁定区域
import { useEffect, useState } from "react";
import { updateRegions } from "../actions.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Switch } from "../../../../../../components/ui/switch.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
export default function RegionsConfig({
  regions: initialRegions,
  docId
}) {
  const [regions, setRegions] = useState(
  // 兼容旧数据，如果是字符串数组则转换为对象数组
  Array.isArray(initialRegions) && typeof initialRegions[0] === "string" ? initialRegions.map(name => ({
    name,
    locked: false
  })) : initialRegions);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();

  // 同步初始数据变化
  useEffect(() => {
    setRegions(Array.isArray(initialRegions) && typeof initialRegions[0] === "string" ? initialRegions.map(name => ({
      name,
      locked: false
    })) : initialRegions);
  }, [initialRegions]);

  // 添加新区域
  const addRegion = () => {
    setRegions([...regions, {
      name: "",
      locked: false
    }]);
    setIsEditing(true);
  };

  // 删除区域
  const removeRegion = index => {
    // 检查是否锁定，只有已保存的数据才会检查锁定状态
    if (!isEditing && regions[index].locked) {
      toast({
        title: "无法删除",
        description: "锁定的区域不能被删除",
        variant: "destructive"
      });
      return;
    }
    const newRegions = [...regions];
    newRegions.splice(index, 1);
    setRegions(newRegions);
    setIsEditing(true);
  };

  // 更新区域名称
  const updateRegionName = (index, name) => {
    // 检查是否锁定，只有已保存的数据才会检查锁定状态
    if (!isEditing && regions[index].locked) {
      toast({
        title: "无法修改",
        description: "锁定的区域不能被修改",
        variant: "destructive"
      });
      return;
    }
    const newRegions = [...regions];
    newRegions[index] = {
      ...newRegions[index],
      name
    };
    setRegions(newRegions);
    setIsEditing(true);
  };

  // 更新区域锁定状态
  const updateRegionLocked = (index, locked) => {
    // 如果是已保存的数据，且已锁定，则不允许解锁
    if (!isEditing && regions[index].locked && !locked) {
      toast({
        title: "无法解锁",
        description: "已保存的锁定区域不能被解锁",
        variant: "destructive"
      });
      return;
    }
    const newRegions = [...regions];
    newRegions[index] = {
      ...newRegions[index],
      locked
    };
    setRegions(newRegions);
    setIsEditing(true);
  };

  // 保存区域配置
  const saveRegions = async () => {
    // 验证数据
    const hasEmptyRegions = regions.some(region => !region.name.trim());
    if (hasEmptyRegions) {
      toast({
        title: "验证失败",
        description: "区域名称不能为空",
        variant: "destructive"
      });
      return;
    }

    // 检查唯一性
    const names = regions.map(region => region.name);
    if (new Set(names).size !== names.length) {
      toast({
        title: "验证失败",
        description: "区域名称必须唯一",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateRegions(regions, docId);
      if (result.success) {
        toast({
          title: "保存成功",
          description: "区域配置已更新"
        });
        setIsEditing(false);
      } else {
        toast({
          title: "保存失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "保存失败",
        description: `发生错误: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setRegions(initialRegions);
    setIsEditing(false);
  };
  return <Card>
      <CardHeader>
        <CardTitle>区域列表</CardTitle>
        <CardDescription>系统中的所有区域配置</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={addRegion}>
            <Plus className="mr-1 h-4 w-4" /> 添加区域
          </Button>
          {isEditing && <>
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                <X className="mr-1 h-4 w-4" /> 取消
              </Button>
              <Button size="sm" onClick={saveRegions} disabled={isSubmitting}>
                <Save className="mr-1 h-4 w-4" /> 保存
              </Button>
            </>}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>区域名称</TableHead>
              <TableHead>锁定状态</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions.map((region, index) => <TableRow key={index}>
                <TableCell>
                  <Input value={region.name} onChange={e => updateRegionName(index, e.target.value)} disabled={!isEditing && region.locked} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch checked={region.locked} onCheckedChange={checked => updateRegionLocked(index, checked)} />
                    <span className="ml-2">
                      {region.locked ? <Lock className="h-4 w-4 text-orange-500" /> : <Unlock className="h-4 w-4 text-green-500" />}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeRegion(index)} disabled={!isEditing && region.locked}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>;
}
