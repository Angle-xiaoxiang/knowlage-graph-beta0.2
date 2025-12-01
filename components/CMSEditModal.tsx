
import React, { useState, useEffect } from 'react';
import { Entry, EntryModule, CATEGORIES } from '../types';
import { X, Plus, Trash2, Save, Sparkles, Box, Lock, Hash } from 'lucide-react';

interface CMSEditModalProps {
  node: Entry;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedNode: Entry) => void;
}

const CMSEditModal: React.FC<CMSEditModalProps> = ({ node, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Entry>(node);
  
  useEffect(() => {
    if (isOpen) {
      setFormData(JSON.parse(JSON.stringify(node))); // Deep copy
    }
  }, [isOpen, node]);

  if (!isOpen) return null;

  const handleAddModule = (presetTitle?: string) => {
    const newModule: EntryModule = {
      id: Date.now().toString(),
      title: presetTitle || '',
      content: ''
    };
    setFormData(prev => ({
      ...prev,
      modules: [...(prev.modules || []), newModule]
    }));
  };

  const handleRemoveModule = (id: string) => {
    setFormData(prev => ({
      ...prev,
      modules: (prev.modules || []).filter(m => m.id !== id)
    }));
  };

  const handleUpdateModule = (id: string, field: 'title' | 'content', value: string) => {
    setFormData(prev => ({
      ...prev,
      modules: (prev.modules || []).map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
          <div>
            <div className="mb-1">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                ID: {node.id}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <EditIcon className="w-5 h-5 text-blue-600" />
              编辑词条详情
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
              基本信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">词条标题</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">所属分类</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">消歧义描述</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Section 2: Extended Modules */}
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">
               <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                 扩展信息模块
               </h3>
               <div className="flex gap-2">
                 <button onClick={() => handleAddModule('直观特征')} className="text-xs flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 transition-colors">
                   <Box className="w-3 h-3" /> 直观特征
                 </button>
                 <button onClick={() => handleAddModule('专属特征')} className="text-xs flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 transition-colors">
                   <Lock className="w-3 h-3" /> 专属特征
                 </button>
                 <button onClick={() => handleAddModule('趣味小彩蛋')} className="text-xs flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-1 rounded hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-800 transition-colors">
                   <Sparkles className="w-3 h-3" /> 趣味小彩蛋
                 </button>
                 <button onClick={() => handleAddModule()} className="text-xs flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-colors">
                   <Plus className="w-3 h-3" /> 自定义
                 </button>
               </div>
            </div>
            
            <div className="space-y-4 min-h-[100px]">
              {(formData.modules && formData.modules.length > 0) ? (
                formData.modules.map((module) => (
                  <div key={module.id} className="relative group bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4 transition-all hover:border-blue-300 dark:hover:border-blue-700">
                    <button 
                      onClick={() => handleRemoveModule(module.id)}
                      className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="删除模块"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid gap-3">
                      <div>
                        <input 
                          type="text" 
                          value={module.title}
                          onChange={(e) => handleUpdateModule(module.id, 'title', e.target.value)}
                          placeholder="模块标题 (如: 直观特征)"
                          className="font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-200 w-full placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>
                      <div>
                        <textarea 
                          value={module.content}
                          onChange={(e) => handleUpdateModule(module.id, 'content', e.target.value)}
                          placeholder="请输入详细内容..."
                          rows={2}
                          className="w-full text-sm bg-transparent border-none outline-none text-slate-600 dark:text-slate-300 resize-y placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 text-sm">
                  暂无扩展信息，请点击上方按钮添加
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md transition-transform active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> 保存更改
          </button>
        </div>
      </div>
    </div>
  );
};

function EditIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  );
}

export default CMSEditModal;
