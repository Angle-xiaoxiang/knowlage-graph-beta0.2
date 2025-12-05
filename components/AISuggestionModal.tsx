import React from 'react';
import { Entry, Relationship, RelationType, RELATION_LABELS, CATEGORY_STYLES } from '../types';
import { Check, X, Wand2 } from 'lucide-react';

interface AISuggestionModalProps {
  isOpen: boolean;
  suggestions: Array<{
    targetId: string;
    type: RelationType;
    weight?: number;
  }>;
  allNodes: Entry[];
  onConfirm: () => void;
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

  // 按关系类型分组建议
  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    const relationLabel = RELATION_LABELS[suggestion.type] || '关联';
    if (!groups[relationLabel]) {
      groups[relationLabel] = [];
    }
    groups[relationLabel].push(suggestion);
    return groups;
  }, {} as Record<string, typeof suggestions>);

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
            {Object.entries(groupedSuggestions).map(([relationType, groupSuggestions]) => (
              <div key={relationType} className="animate-in fade-in duration-300">
                <h4 className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2 flex items-center gap-2 pl-1">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                  {relationType} ({groupSuggestions.length})
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                </h4>

                <div className="space-y-2">
                  {groupSuggestions.map((suggestion, index) => {
                    const targetNode = allNodes.find(n => n.id === suggestion.targetId);
                    const categoryStyle = CATEGORY_STYLES[targetNode?.category || '其他'] || CATEGORY_STYLES['其他'];
                    return (
                      <div
                        key={`${suggestion.targetId}-${suggestion.type}-${index}`}
                        className="flex items-center justify-between text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-md shadow-sm hover:border-blue-300 dark:hover:border-blue-500 transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <div 
                            className="w-1 h-8 rounded-full shrink-0 transition-colors"
                            style={{ backgroundColor: categoryStyle.stroke, opacity: 0.7 }}
                          ></div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                                {targetNode?.title || '未知'}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 rounded-full whitespace-nowrap">
                                权重: {suggestion.weight || 3}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Check className="w-4 h-4" />
            确认添加
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISuggestionModal;