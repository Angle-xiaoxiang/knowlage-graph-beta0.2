import React, { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Entry, CATEGORIES, CATEGORY_STYLES } from '../types';
import { MoreHorizontal } from 'lucide-react';

interface KanbanViewProps {
  nodes: Entry[];
  onNodeSelect: (node: Entry) => void;
  onNodeUpdate: (node: Entry) => void;
  selectedNodeId?: string;
}

export interface KanbanViewHandle {
  scrollToNode: (nodeId: string) => void;
}

interface KanbanViewProps {
  nodes: Entry[];
  categories: Category[];
  onNodeSelect: (node: Entry) => void;
  onNodeUpdate: (node: Entry) => void;
  selectedNodeId?: string;
}

const KanbanView = forwardRef<KanbanViewHandle, KanbanViewProps>(({ nodes, categories, onNodeSelect, onNodeUpdate, selectedNodeId }, ref) => {
  
  // 存储卡片元素的引用，用于滚动定位
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // 存储拖拽状态
  const [draggingCategoryId, setDraggingCategoryId] = React.useState<number | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = React.useState<number | null>(null);
  // 本地排序的分类列表
  const [localCategories, setLocalCategories] = React.useState<Category[]>(categories);

  // 当外部categories变化时，更新本地分类列表
  React.useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    scrollToNode: (nodeId: string) => {
      const element = cardRefs.current[nodeId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }
  }));

  // 按分类分组节点
  const groupedNodes = useMemo(() => {
    const groups: Record<string, Entry[]> = {};
    
    // 使用本地排序的分类数组
    localCategories.forEach(cat => groups[cat.name] = []);
    
    // 确保'其他'分类存在
    if (!groups['其他']) {
      groups['其他'] = [];
    }
    
    nodes.forEach(node => {
      const categoryObj = localCategories.find(cat => cat.id === node.category) || { name: '其他', id: 0 };
      const cat = categoryObj.name;
      if (!groups[cat]) groups[cat] = []; // 处理未定义分类
      groups[cat].push(node);
    });
    
    return groups;
  }, [nodes, localCategories]);

  // 分类拖拽处理
  const handleCategoryDragStart = (e: React.DragEvent, categoryId: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('categoryId', categoryId.toString());
    setDraggingCategoryId(categoryId);
  };

  const handleCategoryDragOver = (e: React.DragEvent, categoryId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (categoryId !== draggingCategoryId) {
      setDragOverCategoryId(categoryId);
    }
  };

  const handleCategoryDragEnd = () => {
    setDraggingCategoryId(null);
    setDragOverCategoryId(null);
  };

  const handleCategoryDrop = (e: React.DragEvent, targetCategoryId: number) => {
    e.preventDefault();
    const sourceCategoryId = parseInt(e.dataTransfer.getData('categoryId'));
    
    if (sourceCategoryId !== targetCategoryId) {
      // 更新本地分类顺序
      const newCategories = [...localCategories];
      const sourceIndex = newCategories.findIndex(cat => cat.id === sourceCategoryId);
      const targetIndex = newCategories.findIndex(cat => cat.id === targetCategoryId);
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const [removed] = newCategories.splice(sourceIndex, 1);
        newCategories.splice(targetIndex, 0, removed);
        setLocalCategories(newCategories);
      }
    }
    
    setDraggingCategoryId(null);
    setDragOverCategoryId(null);
  };

  // 拖拽处理
  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.setData('nodeId', nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // 允许放置
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    const nodeId = e.dataTransfer.getData('nodeId');
    const node = nodes.find(n => n.id === nodeId);
    
    if (node) {
      const categoryObj = categories.find(cat => cat.name === targetCategory) || { name: '其他', id: 0 };
      const targetCategoryId = categoryObj.id;
      if (node.category !== targetCategoryId) {
        onNodeUpdate({ ...node, category: targetCategoryId });
      }
    }
  };

  return (
    <div className="h-full w-full overflow-x-auto bg-slate-100 dark:bg-slate-900 p-6 flex gap-6 items-start scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
      {localCategories.map(category => {
        const style = CATEGORY_STYLES[category.name] || CATEGORY_STYLES['其他'];
        const items = groupedNodes[category.name] || [];
        const isDragging = draggingCategoryId === category.id;
        const isDragOver = dragOverCategoryId === category.id;
        
        return (
          <div 
            key={category.id}
            className={`w-72 shrink-0 flex flex-col max-h-full bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transition-all duration-300 ease-in-out
              ${isDragging ? 'opacity-50 scale-95' : ''}
              ${isDragOver ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
            `}
            onDragOver={(e) => {
              handleDragOver(e);
              handleCategoryDragOver(e, category.id);
            }}
            onDrop={(e) => {
              // 先尝试处理分类拖拽
              const categoryId = e.dataTransfer.getData('categoryId');
              if (categoryId) {
                handleCategoryDrop(e, category.id);
              } else {
                // 否则处理卡片拖拽
                handleDrop(e, category.name);
              }
            }}
          >
            {/* 列头 */}
            <div 
              className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur sticky top-0 z-10 cursor-move hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors"
              draggable
              onDragStart={(e) => handleCategoryDragStart(e, category.id)}
              onDragEnd={handleCategoryDragEnd}
            >
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: style.stroke }}></div>
                 <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{category.name}</h3>
              </div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>

            {/* 卡片列表 */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              {items.map(node => {
                const isSelected = node.id === selectedNodeId;
                return (
                  <div
                    key={node.id}
                    ref={(el) => { cardRefs.current[node.id] = el; }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, node.id)}
                    onClick={() => onNodeSelect(node)}
                    className={`group bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-300
                      ${isSelected 
                        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900 z-10 scale-[1.02]' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'
                      }
                    `}
                    style={{ 
                      borderLeftWidth: '4px', 
                      borderLeftColor: isSelected ? '#3b82f6' : style.stroke 
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-semibold text-sm ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'}`}>
                        {node.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {node.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {node.description || '暂无描述'}
                    </p>
                    <div className="mt-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-slate-400">拖拽移动</span>
                      <MoreHorizontal className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-xs text-slate-400 italic">
                  拖拽词条至此
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

KanbanView.displayName = 'KanbanView';

export default KanbanView;