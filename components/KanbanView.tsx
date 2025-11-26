import React, { useMemo, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
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

const KanbanView = forwardRef<KanbanViewHandle, KanbanViewProps>(({ nodes, onNodeSelect, onNodeUpdate, selectedNodeId }, ref) => {
  
  // 存储卡片元素的引用，用于滚动定位
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
    CATEGORIES.forEach(cat => groups[cat] = []);
    
    nodes.forEach(node => {
      const cat = node.category || '其他';
      if (!groups[cat]) groups[cat] = []; // 处理未定义分类
      groups[cat].push(node);
    });
    
    return groups;
  }, [nodes]);

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
    
    if (node && node.category !== targetCategory) {
      onNodeUpdate({ ...node, category: targetCategory });
    }
  };

  return (
    <div className="h-full w-full overflow-x-auto bg-slate-100 dark:bg-slate-900 p-6 flex gap-6 items-start scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
      {CATEGORIES.map(category => {
        const style = CATEGORY_STYLES[category] || CATEGORY_STYLES['其他'];
        const items = groupedNodes[category] || [];
        
        return (
          <div 
            key={category}
            className="w-72 shrink-0 flex flex-col max-h-full bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, category)}
          >
            {/* 列头 */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur sticky top-0 z-10">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: style.stroke }}></div>
                 <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{category}</h3>
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
                    <h4 className={`font-semibold text-sm mb-1 ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'}`}>
                      {node.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
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