import React, { useState, useMemo } from 'react';
import { Entry, Relationship, RelationType, RELATION_LABELS, CATEGORY_STYLES } from '../types';
import { Check, X, Wand2 } from 'lucide-react';

// 辅助函数：生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

interface Suggestion {
  id: string;
  targetId: string;
  type: RelationType;
  weight?: number;
  reason?: string;
}

interface AISuggestionModalProps {
  isOpen: boolean;
  suggestions: Array<{ targetId: string; type: RelationType; weight?: number; reason?: string }>;
  allNodes: Entry[];
  onConfirm: (selectedSuggestions: Suggestion[]) => void;
  onCancel: () => void;
}

const AISuggestionModal: React.FC<AISuggestionModalProps> = ({
  isOpen,
  suggestions,
  allNodes,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  // 为每个建议添加唯一ID，确保每个建议都有唯一标识
  const suggestionsWithIds = useMemo(() => {
    return suggestions.map(suggestion => ({
      ...suggestion,
      id: generateId()
    }));
  }, [suggestions]);

  // 管理选中的建议，初始时所有建议都是选中状态
  const [selectedSuggestions, setSelectedSuggestions] = useState<Suggestion[]>(suggestionsWithIds);

  // 删除单条建议
  const handleRemoveSuggestion = (id: string) => {
    setSelectedSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));
  };

  // 处理确认，将选中的建议传递给父组件
  const handleConfirm = () => {
    onConfirm(selectedSuggestions);
  };

  // 按关系类型分组建议
  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, Suggestion[]> = {};
    
    selectedSuggestions.forEach(suggestion => {
      const relationLabel = RELATION_LABELS[suggestion.type] || '关联';
      if (!groups[relationLabel]) {
        groups[relationLabel] = [];
      }
      groups[relationLabel].push(suggestion);
    });
    
    return groups;
  }, [selectedSuggestions]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* 弹窗标题 */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            AI 关联关系建议
          </h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="关闭弹窗"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 弹窗内容 */}
        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            找到 {suggestions.length} 个新的关联建议：
          </p>

          {/* 按关系类型分组显示 */}
          <div className="space-y-4">
            {/* 如果没有选中的建议，显示提示信息 */}
            {selectedSuggestions.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-4">
                暂无保留的关联建议
              </div>
            ) : (
              /* 遍历分组建议 */
              Object.entries(groupedSuggestions).map(([relationType, groupSuggestions]) => (
                <div key={relationType} className="animate-in fade-in duration-300">
                  <h4 className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2 flex items-center gap-2 pl-1">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                    {relationType} ({groupSuggestions.length})
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                  </h4>

                  <div className="space-y-2">
                    {/* 遍历每个分组内的建议 */}
                    {groupSuggestions.map((suggestion) => {
                      const targetNode = allNodes.find(n => n.id === suggestion.targetId);
                      const categoryStyle = CATEGORY_STYLES[targetNode?.category || '其他'] || CATEGORY_STYLES['其他'];
                      
                      return (
                        <div
                          key={suggestion.id}
                          className="flex flex-col text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-md shadow-sm hover:border-blue-300 dark:hover:border-blue-500 transition-all"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                              <div 
                                className="w-1 h-6 rounded-full shrink-0 transition-colors"
                                style={{ backgroundColor: categoryStyle.stroke, opacity: 0.7 }}
                              ></div>
                              <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                                {targetNode?.title || '未知'} - {suggestion.type}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveSuggestion(suggestion.id)}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="删除此建议"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {suggestion.reason && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 pl-4 pr-2">
                              {suggestion.reason}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 弹窗底部按钮 */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedSuggestions.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            确认添加 ({selectedSuggestions.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISuggestionModal;