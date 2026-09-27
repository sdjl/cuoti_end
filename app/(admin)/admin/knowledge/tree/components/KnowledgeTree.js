"use client";

import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
// 知识树组件，用于管理和编辑学科的知识点树形结构
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";

// 知识点类型定义

// 定义ref暴露的方法

// 单个知识点节点组件的props

// 收集所有知识点名称的辅助函数
const collectAllNodeNames = nodes => {
  let names = [];
  nodes.forEach(node => {
    names.push(node.name);
    if (node.children && node.children.length > 0) {
      names = [...names, ...collectAllNodeNames(node.children)];
    }
  });
  return names;
};

// 单个知识点节点组件
const KnowledgeNodeComponent = ({
  node,
  color,
  onAddNode,
  onEditNode,
  onDeleteNode,
  isExpanded,
  getAllKnowledgeNames,
  isFirstNode = false,
  parentNodes = []
}) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newNodeName, setNewNodeName] = useState("");
  const [nameError, setNameError] = useState("");

  // 更新展开状态
  React.useEffect(() => {
    setExpanded(isExpanded);
  }, [isExpanded, node.level]);
  const hasChildren = node.children && node.children.length > 0;
  const isLastLevel = node.level >= 4;
  const toggleExpand = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    }
  };
  const validateNodeName = (name, currentNode) => {
    if (!name.trim()) {
      setNameError("知识点名称不能为空");
      return false;
    }
    const allNames = getAllKnowledgeNames();
    // 如果是编辑模式且名称没有变化，则直接返回有效
    if (currentNode && currentNode.name === name) {
      return true;
    }
    if (allNames.includes(name)) {
      setNameError(`知识点名称 "${name}" 已存在`);
      return false;
    }
    return true;
  };
  const handleAddNode = () => {
    if (validateNodeName(newNodeName)) {
      const newNode = {
        name: newNodeName.trim(),
        level: node.level + 1,
        subject: node.subject,
        children: []
      };
      onAddNode(node, newNode);
      setNewNodeName("");
      setNameError("");
      setIsAddDialogOpen(false);
    }
  };
  const handleEditNode = () => {
    if (validateNodeName(newNodeName, node)) {
      onEditNode(node, newNodeName.trim());
      setNewNodeName("");
      setNameError("");
      setIsEditDialogOpen(false);
    }
  };
  const handleDeleteNode = () => {
    onDeleteNode(node);
    setIsDeleteDialogOpen(false);
  };
  const handleAddDialogKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNode();
    }
  };
  const handleEditDialogKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEditNode();
    }
  };

  // 获取节点样式
  const getNodeStyle = () => {
    const styles = {
      paddingLeft: `${(node.level - 1) * 24}px`
    };

    // 第一层级样式
    if (node.level === 1) {
      styles.backgroundColor = `${color}20`; // 20% 透明度
      styles.color = color;
      styles.fontWeight = "bold";

      // 只给非第一个顶级节点添加上边距
      if (!isFirstNode) {
        styles.marginTop = "12px"; // 增加第一层级之间的间距
      }
    }
    // 第二层级字体加粗和左侧边框
    else if (node.level === 2) {
      styles.fontWeight = "bold";
      styles.borderLeft = `2px solid ${color}40`;
    }
    // 第三层级无特殊样式
    else if (node.level === 3) {
      // 普通样式
    }
    // 第四层级白色背景和斜体
    else if (node.level === 4) {
      styles.backgroundColor = "#ffffff";
      styles.fontStyle = "italic";
      styles.marginLeft = "4px";
      styles.borderRadius = "4px";
    }
    return styles;
  };
  return <>
      <div className="select-none">
        <div className="flex items-center py-2 px-2 hover:bg-gray-50 rounded-md group" style={getNodeStyle()}>
          {hasChildren ? <button onClick={toggleExpand} className="mr-1 h-5 w-5 flex items-center justify-center">
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button> : <div className="w-5 mr-1"></div>}

          <div className="flex-1 flex items-center cursor-pointer" onClick={toggleExpand}>
            <span>{node.name}</span>
          </div>

          <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
            <button className="p-1 rounded-md hover:bg-gray-200" title="编辑" onClick={e => {
            e.stopPropagation();
            setNewNodeName(node.name);
            setNameError("");
            setIsEditDialogOpen(true);
          }}>
              <Pencil size={14} />
            </button>
            <button className="p-1 rounded-md hover:bg-gray-200" title="删除" onClick={e => {
            e.stopPropagation();
            setIsDeleteDialogOpen(true);
          }}>
              <Trash2 size={14} />
            </button>
            {!isLastLevel && <button className="p-1 rounded-md hover:bg-gray-200" title="添加子节点" onClick={e => {
            e.stopPropagation();
            setNewNodeName("");
            setNameError("");
            setIsAddDialogOpen(true);
          }}>
                <Plus size={14} />
              </button>}
          </div>
        </div>

        {hasChildren && expanded && <div className="tree-children">
            {node.children?.map((child, index) => <KnowledgeNodeComponent key={`${node.name}-${child.name}-${index}`} node={child} color={color} onAddNode={onAddNode} onEditNode={onEditNode} onDeleteNode={onDeleteNode} isExpanded={isExpanded} getAllKnowledgeNames={getAllKnowledgeNames} parentNodes={[...parentNodes, node]} isFirstNode={index === 0} />)}
          </div>}
      </div>

      {/* 添加子节点对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>添加子节点</DialogTitle>
            <DialogDescription>
              在&ldquo;{node.name}&rdquo;下添加新的知识点
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                知识点名称
              </Label>
              <div className="col-span-3 space-y-1">
                <Input id="name" value={newNodeName} onChange={e => setNewNodeName(e.target.value)} className={nameError ? "border-red-500" : ""} autoComplete="off" onKeyDown={handleAddDialogKeyDown} autoFocus />
                {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddNode}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑节点对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑知识点</DialogTitle>
            <DialogDescription>
              修改知识点&ldquo;{node.name}&rdquo;的名称
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                知识点名称
              </Label>
              <div className="col-span-3 space-y-1">
                <Input id="edit-name" value={newNodeName} onChange={e => setNewNodeName(e.target.value)} className={nameError ? "border-red-500" : ""} autoComplete="off" onKeyDown={handleEditDialogKeyDown} autoFocus />
                {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditNode}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除知识点&ldquo;{node.name}&rdquo;吗？
              {hasChildren && "该操作将删除其所有子节点，且不可恢复。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNode} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
};

// 知识树组件
const KnowledgeTree = forwardRef(({
  color,
  expandAll = false,
  knowledgeData,
  onDataChange
}, ref) => {
  const [isAddRootDialogOpen, setIsAddRootDialogOpen] = useState(false);
  const [rootNodeName, setRootNodeName] = useState("");
  const [rootNameError, setRootNameError] = useState("");
  const [knowledgeTree, setKnowledgeTree] = useState(knowledgeData || []);
  useImperativeHandle(ref, () => ({
    openAddRootDialog: () => {
      setIsAddRootDialogOpen(true);
    }
  }));

  // 当 knowledgeData 变化时，同步更新内部状态
  useEffect(() => {
    setKnowledgeTree(knowledgeData || []);
  }, [knowledgeData]);

  // 获取所有知识点名称
  const getAllKnowledgeNames = useCallback(() => {
    return collectAllNodeNames(knowledgeTree);
  }, [knowledgeTree]);

  // 添加子节点
  const handleAddNode = (parentNode, newNode) => {
    const updateNode = nodes => {
      return nodes.map(node => {
        if (node === parentNode) {
          // 确保children数组存在
          const children = node.children || [];
          return {
            ...node,
            children: [...children, newNode]
          };
        } else if (node.children) {
          return {
            ...node,
            children: updateNode(node.children)
          };
        }
        return node;
      });
    };
    setKnowledgeTree(updateNode(knowledgeTree));
    onDataChange?.(updateNode(knowledgeTree));
  };

  // 编辑节点
  const handleEditNode = (targetNode, newName) => {
    const updateNode = nodes => {
      return nodes.map(node => {
        if (node === targetNode) {
          return {
            ...node,
            name: newName
          };
        } else if (node.children) {
          return {
            ...node,
            children: updateNode(node.children)
          };
        }
        return node;
      });
    };
    setKnowledgeTree(updateNode(knowledgeTree));
    onDataChange?.(updateNode(knowledgeTree));
  };

  // 删除节点
  const handleDeleteNode = targetNode => {
    const removeNode = nodes => {
      return nodes.filter(node => {
        if (node === targetNode) {
          return false;
        }
        if (node.children) {
          node.children = removeNode(node.children);
        }
        return true;
      });
    };
    setKnowledgeTree(removeNode(knowledgeTree));
    onDataChange?.(removeNode(knowledgeTree));
  };

  // 验证顶级节点名称
  const validateRootNodeName = name => {
    if (!name.trim()) {
      setRootNameError("知识点名称不能为空");
      return false;
    }
    const allNames = getAllKnowledgeNames();
    if (allNames.includes(name)) {
      setRootNameError(`知识点名称 "${name}" 已存在`);
      return false;
    }
    return true;
  };

  // 添加顶级节点
  const handleAddRootNode = () => {
    if (validateRootNodeName(rootNodeName.trim())) {
      const newNode = {
        name: rootNodeName.trim(),
        level: 1,
        subject: knowledgeData[0]?.subject || "",
        children: []
      };
      setKnowledgeTree([...knowledgeTree, newNode]);
      setRootNodeName("");
      setRootNameError("");
      setIsAddRootDialogOpen(false);
      onDataChange?.([...knowledgeTree, newNode]);
    }
  };

  // 处理回车键
  const handleRootDialogKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddRootNode();
    }
  };
  return <>
        <div className="knowledge-tree border rounded-md p-3">
          {knowledgeTree.map((node, index) => <KnowledgeNodeComponent key={`${node.name}-${index}`} node={node} color={color} onAddNode={handleAddNode} onEditNode={handleEditNode} onDeleteNode={handleDeleteNode} isExpanded={expandAll} getAllKnowledgeNames={getAllKnowledgeNames} isFirstNode={index === 0} // 第一个节点标记
      />)}
        </div>

        {/* 添加顶级节点对话框 */}
        <Dialog open={isAddRootDialogOpen} onOpenChange={setIsAddRootDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>添加顶级知识点</DialogTitle>
              <DialogDescription>添加新的顶级知识点类别</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="root-name" className="text-right">
                  知识点名称
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input id="root-name" value={rootNodeName} onChange={e => setRootNodeName(e.target.value)} className={rootNameError ? "border-red-500" : ""} autoComplete="off" onKeyDown={handleRootDialogKeyDown} autoFocus />
                  {rootNameError && <p className="text-red-500 text-xs">{rootNameError}</p>}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddRootDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddRootNode}>添加</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>;
});
KnowledgeTree.displayName = "KnowledgeTree";
export default KnowledgeTree;
