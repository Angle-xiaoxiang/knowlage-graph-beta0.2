
import React, { useState } from 'react';
import { Entry, CATEGORIES, CATEGORY_STYLES } from '../types';
import { ArrowLeft, Search, Filter, Database, Edit, Trash2, Plus, LayoutGrid, Network, Eye } from 'lucide-react';
import CMSEditModal from './CMSEditModal';

interface CMSPageProps {
  nodes: Entry[];
  onDeleteNode: (id: string) => void;
  onAddNode: () => void;
  onUpdateNode: (node: Entry) => void; // Added prop
  onNavigateToGraph: () => void;
  onNavigateToDetail: (id: string) => void;
}

const CMSPage: React.FC<CMSPageProps> = ({ nodes, onDeleteNode, onAddNode, onUpdateNode, onNavigateToGraph, onNavigateToDetail }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Entry | null>(null);

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          node.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || node.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEditClick = (node: Entry) => {
    setEditingNode(node);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedNode: Entry) => {
    if (onUpdateNode) {
        onUpdateNode(updatedNode);
    }
    setIsEditModalOpen(false);
    setEditingNode(null);
  };

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={onNavigateToGraph}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            返回图谱
          </button>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-lg">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>词条内容管理系统 (CMS)</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={onAddNode}
             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
           >
             <Plus className="w-4 h-4" /> 新增词条
           </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Database className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">总词条数</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-white">{nodes.length}</div>
              </div>
           </div>
           
           <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <LayoutGrid className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">分类数量</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-white">{CATEGORIES.length}</div>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <Network className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">系统状态</div>
                <div className="text-lg font-bold text-slate-800 dark:text-white">运行中</div>
              </div>
           </div>
        </div>

        {/* 过滤器工具栏 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
           <div className="relative w-full md:w-96">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="搜索词条标题或描述..." 
               className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-700 dark:text-slate-200"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           
           <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
             <Filter className="w-4 h-4 text-slate-400 shrink-0" />
             <select 
               className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
               value={filterCategory}
               onChange={(e) => setFilterCategory(e.target.value)}
             >
               <option value="All">所有分类</option>
               {CATEGORIES.map(cat => (
                 <option key={cat} value={cat}>{cat}</option>
               ))}
             </select>
           </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead>
                 <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                   <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">词条信息</th>
                   <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">分类</th>
                   <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 w-1/3">描述</th>
                   <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">操作</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {filteredNodes.length > 0 ? (
                   filteredNodes.map(node => {
                     const style = CATEGORY_STYLES[node.category] || CATEGORY_STYLES['其他'];
                     return (
                       <tr key={node.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-2 h-8 rounded-full shrink-0" style={{ backgroundColor: style.stroke }}></div>
                               <div>
                                 <div className="font-semibold text-slate-800 dark:text-slate-200">{node.title}</div>
                                 <div className="text-xs text-slate-400 font-mono mt-0.5">{node.id}</div>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border" 
                             style={{ backgroundColor: style.fill, color: style.stroke, borderColor: style.stroke + '40' }}>
                             {node.category}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-slate-600 dark:text-slate-400 truncate max-w-xs" title={node.description}>
                           {node.description || '-'}
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                               <button 
                                 onClick={() => onNavigateToDetail(node.id)}
                                 className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                 title="查看详情"
                               >
                                 <Eye className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => handleEditClick(node)}
                                 className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                 title="编辑内容 (含扩展模块)"
                               >
                                 <Edit className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => {
                                   if(window.confirm(`确定要删除 "${node.title}" 吗？此操作无法撤销。`)) {
                                     onDeleteNode(node.id);
                                   }
                                 }}
                                 className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                 title="删除"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                         </td>
                       </tr>
                     );
                   })
                 ) : (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                       未找到匹配的词条
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
           
           <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
              <span>显示 {filteredNodes.length} 个结果 (共 {nodes.length} 个)</span>
              <span>CMS v1.1</span>
           </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingNode && (
        <CMSEditModal 
          isOpen={isEditModalOpen}
          node={editingNode}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default CMSPage;
