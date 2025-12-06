
import React, { useMemo } from 'react';
import { Entry, Relationship, RELATION_LABELS, CATEGORY_STYLES, RelationType } from '../types';
import { ArrowLeft, Edit, Share2, Database, ArrowRightLeft, ArrowRight, ArrowLeft as ArrowLeftIcon, Hash, Tag, Box, Info } from 'lucide-react';

interface EntryDetailViewProps {
  node: Entry;
  allNodes: Entry[];
  links: Relationship[];
  categories: Category[];
  onBack: () => void;
  onEdit: (node: Entry) => void;
  onNodeClick: (node: Entry) => void;
}

const EntryDetailView: React.FC<EntryDetailViewProps> = ({ 
  node, 
  allNodes, 
  links, 
  categories,
  onBack, 
  onEdit,
  onNodeClick
}) => {
  // 创建分类映射，将分类ID映射到分类名称
  const categoryMap = useMemo(() => {
    return new Map(categories.map(cat => [cat.id, cat.name]));
  }, [categories]);
  
  const categoryName = categoryMap.get(node.category) || '其他';
  const style = CATEGORY_STYLES[categoryName] || CATEGORY_STYLES['其他'];

  // 获取该词条发出的关系 (Source is current node)
  const outgoingLinks = useMemo(() => {
    return links.filter(l => {
      const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      return sId === node.id;
    });
  }, [links, node.id]);

  // 获取指向该词条的关系 (Target is current node)
  const incomingLinks = useMemo(() => {
    return links.filter(l => {
      const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return tId === node.id;
    });
  }, [links, node.id]);

  // 辅助函数：解析目标节点信息
  const getNodeInfo = (id: string) => {
    return allNodes.find(n => n.id === id);
  };

  const renderLinkList = (linkList: Relationship[], isOutgoing: boolean) => {
    if (linkList.length === 0) {
      return <div className="text-slate-400 italic text-sm py-4">暂无数据</div>;
    }

    return (
      <div className="space-y-3">
        {linkList.map(link => {
          const otherId = isOutgoing 
            ? (typeof link.target === 'object' ? (link.target as any).id : link.target)
            : (typeof link.source === 'object' ? (link.source as any).id : link.source);
          
          const otherNode = getNodeInfo(otherId);
          if (!otherNode) return null;

          const otherCategoryName = categoryMap.get(otherNode.category) || '其他';
          const otherStyle = CATEGORY_STYLES[otherCategoryName] || CATEGORY_STYLES['其他'];

          return (
            <div 
              key={link.id}
              onClick={() => onNodeClick(otherNode)}
              className="group flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500`}>
                   {isOutgoing ? <ArrowRight className="w-4 h-4" /> : <ArrowLeftIcon className="w-4 h-4" />}
                </div>
                <div>
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {RELATION_LABELS[link.type as RelationType]}
                      </span>
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">
                        权重 {link.weight}
                      </span>
                   </div>
                   <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                     {otherNode.title}
                   </div>
                </div>
              </div>
              <div className="w-2 h-8 rounded-full" style={{ backgroundColor: otherStyle.stroke }}></div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto pb-20">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            返回图谱
          </button>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Database className="w-4 h-4" />
            <span>词条数据库详情</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onEdit(node)}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-blue-200 dark:border-blue-800"
          >
            <Edit className="w-4 h-4" /> 编辑词条
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* 头部信息卡片 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 relative overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-transparent to-current opacity-5 rounded-bl-full pointer-events-none" style={{ color: style.stroke }}></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <span 
                  className="px-3 py-1 rounded-md text-sm font-bold border"
                  style={{ backgroundColor: style.fill, color: style.stroke, borderColor: style.stroke }}
                >
                  {node.category}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  ID: {node.id}
                </span>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${node.status === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                {node.status === 1 ? '已启用' : '未启用'}
              </span>
            </div>

            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight pl-1">
              {node.title}
            </h1>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" /> 消歧义描述
              </h3>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                {node.description || '暂无描述信息。'}
              </p>
            </div>
            
            {/* 新增：扩展模块展示 */}
            {node.modules && node.modules.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {node.modules.map(module => (
                  <div key={module.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                    <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Box className="w-4 h-4" /> {module.title}
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                      {module.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* 关系网络板块 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 发出的关联 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                 <ArrowRight className="w-5 h-5 text-blue-500" />
                 发出的关联 (Outgoing)
               </h3>
               <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-full">
                 {outgoingLinks.length}
               </span>
            </div>
            {renderLinkList(outgoingLinks, true)}
          </div>

          {/* 收到的引用 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                 <ArrowLeftIcon className="w-5 h-5 text-emerald-500" />
                 被引用 (Incoming)
               </h3>
               <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2 py-1 rounded-full">
                 {incomingLinks.length}
               </span>
            </div>
            {renderLinkList(incomingLinks, false)}
          </div>

        </div>

      </div>
    </div>
  );
};

export default EntryDetailView;
