
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Entry, Relationship, RelationType, Category, RELATION_LABELS, CATEGORIES, CATEGORY_STYLES } from '../types';
import { Plus, Trash2, Wand2, Network, Save, X, Link2, Search, ChevronsUpDown, Check, Pencil, Undo2, Weight, ListTree, LocateFixed, CopyPlus, Eye, Hash } from 'lucide-react';
import { getAIService } from '../services/aiService';

interface SidebarProps {
  selectedNode: Entry | null;
  allNodes: Entry[];
  links: Relationship[];
  categories: Category[];
  onAddNode: (node: Entry) => void;
  onUpdateNode: (node: Entry) => void;
  onDeleteNode: (id: string) => void;
  onAddLink: (link: Relationship) => void;
  onUpdateLink: (link: Relationship) => void;
  onDeleteLink: (id: string) => void;
  onSelectNode: (node: Entry) => void;
  onCenterNode: () => void;
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
  onClose: () => void;
  initialTitle?: string; // 新增属性：用于快速创建时的初始标题
  pendingLinkTarget?: Entry | null; // 新增：用于接收拖拽放置的目标节点
  onPreviewConnection: (targetId: string | null) => void; // 新增：用于预览连接的回调
  onOpenDetailView?: () => void; // 新增：打开详情页回调
  onAISuggestions?: (sourceNode: Entry, suggestions: Array<{
    targetId: string;
    type: RelationType;
    weight?: number;
  }>) => void; // 新增：AI建议回调
}

// 适用于无安全上下文环境的安全 ID 生成器
// 生成临时ID，用于创建新节点时的临时标识
const generateId = () => `temp-${Date.now().toString(36) + Math.random().toString(36).substr(2)}`;

const Sidebar: React.FC<SidebarProps> = ({
  selectedNode,
  allNodes,
  links,
  categories,
  onAddNode,
  onUpdateNode,
  onDeleteNode,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
  onSelectNode,
  onCenterNode,
  hoveredNodeId,
  setHoveredNodeId,
  onClose,
  initialTitle = '', // 默认为空
  pendingLinkTarget,
  onPreviewConnection,
  onOpenDetailView,
  onAISuggestions
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [homonymSourceId, setHomonymSourceId] = useState<string | null>(null); // 记录同名词条的来源ID
  
  // 表单状态
  const [formData, setFormData] = useState<Partial<Entry>>({
    title: '',
    category: 0,
    description: '',
    tags: []
  });

  // 连线管理状态
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkFormData, setLinkFormData] = useState({
    targetId: '',
    type: RelationType.RELATED_TO,
    weight: 5
  });

  // 可搜索下拉菜单状态
  const [linkSearchTerm, setLinkSearchTerm] = useState('');
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);
  
  // 引用，用于滚动到关联表单
  const linkSectionRef = useRef<HTMLDivElement>(null);

  // 重置表单函数，现在包含 initialTitle
  const resetForm = () => {
    setFormData({
      title: initialTitle || '', // 如果有初始标题则使用
      category: categories.length > 0 ? categories[0].id : 0,
      description: '',
      tags: [],
      status: 1 // 默认启用
    });
    resetLinkForm();
  };

  useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode);
      setIsCreating(false);
      setIsEditing(false); // 现有节点默认为查看模式
      setHomonymSourceId(null); // 切换节点时清除同名来源状态
    } else {
      // 检查是否处于“创建模式”（侧边栏打开但未选择节点）
      resetForm();
      setIsCreating(true);
      setIsEditing(true); // 新节点默认为编辑模式
      setHomonymSourceId(null);
    }
    // 节点更改时重置连线表单
    resetLinkForm();
  }, [selectedNode, initialTitle]); 

  // 监听拖拽放置事件
  useEffect(() => {
    if (pendingLinkTarget && selectedNode) {
       // 立即触发视觉预览：在两个节点之间绘制橙色虚线
       onPreviewConnection(pendingLinkTarget.id);

       // 检查是否已存在关联
       const existingLink = links.find(l => {
         const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
         const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
         return sId === selectedNode.id && tId === pendingLinkTarget.id;
       });

       if (existingLink) {
         // 存在则进入编辑模式
         setEditingLinkId(existingLink.id);
         setLinkFormData({
            targetId: pendingLinkTarget.id,
            type: existingLink.type as RelationType,
            weight: existingLink.weight
         });
         setLinkSearchTerm(pendingLinkTarget.title); 
       } else {
         // 不存在则进入创建模式
         setEditingLinkId(null);
         setLinkFormData({
            targetId: pendingLinkTarget.id,
            type: RelationType.RELATED_TO,
            weight: 5
         });
         setLinkSearchTerm('');
       }

       // 自动滚动到连线部分
       setTimeout(() => {
          linkSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
       }, 100);
    }
  }, [pendingLinkTarget, selectedNode, links]);

  const resetLinkForm = () => {
    setLinkFormData({ targetId: '', type: RelationType.RELATED_TO, weight: 5 });
    setLinkSearchTerm('');
    setShowLinkDropdown(false);
    setEditingLinkId(null);
    // 清除视觉预览
    onPreviewConnection(null);
  };

  // 检查表单相对于 selectedNode 是否有更改
  const hasChanges = useMemo(() => {
    if (isCreating) return true;
    if (!selectedNode) return false;

    return (
      (formData.title || '') !== (selectedNode.title || '') ||
      (formData.category || '概念') !== (selectedNode.category || '概念') ||
      (formData.description || '') !== (selectedNode.description || '') ||
      formData.status !== selectedNode.status
    );
  }, [formData, selectedNode, isCreating]);

  const isSaveEnabled = !!formData.title && (isCreating || hasChanges);

  const handleSave = async () => {
    if (!isSaveEnabled) return;
    
    setLoading(true);
    try {
      if (isCreating) {
        // 创建不包含id的新节点对象，id由服务器生成
        const newNodeWithoutId: Omit<Entry, 'id'> = {
          title: formData.title || '新建词条',
          category: formData.category || 0,
          description: formData.description || '',
          tags: [],
          status: formData.status || 1 
        };
        
        // 调用父组件的添加节点函数，传递不包含id的节点对象
        // 注意：这里我们假设onAddNode会返回真实节点
        // 但由于onAddNode是props，我们需要修改它的类型定义
        // 因此，我们需要另一种方式来实现
        
        // 直接调用onAddNode，然后等待selectedNode更新
        onAddNode(newNodeWithoutId as Entry);

        // 如果是创建同名词条，自动建立关系
        if (homonymSourceId) {
          // 注意：这里的targetId暂时使用临时ID，实际会被服务器替换
          const tempId = generateId();
          onAddLink({
            id: generateId(),
            source: homonymSourceId,
            target: tempId,
            type: RelationType.HOMONYM, // 使用同名关系
            weight: 8
          });
          // 重置状态
          setHomonymSourceId(null);
        }
        
        // 注意：不再手动更新本地状态，而是等待父组件通过useEffect更新
        // 父组件的handleAddNode会异步保存节点到服务器，然后更新nodes和selectedNode
        // useEffect会监听selectedNode变化，自动更新formData、isCreating和isEditing
        
      } else if (selectedNode && formData.id) {
        onUpdateNode(formData as Entry);
        setIsEditing(false); // 保存后退出编辑模式
      }
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (isCreating) {
      onClose();
      setHomonymSourceId(null);
    } else {
      if (selectedNode) setFormData(selectedNode);
      setIsEditing(false);
    }
  };

  // 启动创建同名词条模式
  const handleCreateHomonym = () => {
    if (!selectedNode) return;
    setHomonymSourceId(selectedNode.id);
    
    setFormData({
      title: selectedNode.title, // 保留标题
      category: 0, // 重置分类 (通常不同义项分类不同)
      description: '', // 强制清空描述，要求重新输入
      tags: []
    });
    
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleAIGenerate = async () => {
    if (!formData.title) return;
    setLoading(true);
    try {
      const aiService = getAIService();
      const details = await aiService.generateEntryDetails(formData.title);
      
      // 将豆包返回的分类名称转换为对应的分类ID
      const categoryName = details.category;
      const matchedCategory = categories.find(cat => cat.name === categoryName);
      const categoryId = matchedCategory ? matchedCategory.id : categories.find(cat => cat.name === '其他')?.id || 1;
      
      setFormData(prev => ({ 
        ...prev, 
        description: details.description, 
        category: categoryId 
      }));
    } catch (error) {
      console.error(error);
      alert("生成内容失败。请确保已配置 AI 服务。");
    } finally {
      setLoading(false);
    }
  };

  // 过滤与此节点相关的连线（按要求仅限出站连线）
  const relatedLinks = useMemo(() => {
    return links.filter(l => {
      const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      return selectedNode && sId === selectedNode.id;
    });
  }, [links, selectedNode]);

  // 按类型分组连线
  const groupedLinks = useMemo(() => {
    const groups: Record<string, Relationship[]> = {};
    relatedLinks.forEach(link => {
      if (!groups[link.type]) groups[link.type] = [];
      groups[link.type].push(link);
    });
    return groups;
  }, [relatedLinks]);

  // 计算已关联节点的 ID（目标节点）
  const existingTargetIds = useMemo(() => {
    const ids = new Set<string>();
    relatedLinks.forEach(l => {
      const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      ids.add(tId);
    });
    return ids;
  }, [relatedLinks]);

  const handleAISuggestLinks = async () => {
    if (!selectedNode) return;
    setLoading(true);
    try {
      const aiService = getAIService();
      const suggestions = await aiService.suggestRelationships(selectedNode, allNodes);
      
      // 过滤掉已存在的建议，并添加类型检查
      const validSuggestions = suggestions.filter(s => {
        // 确保type是有效的RelationType
        const isValidType = Object.values(RelationType).includes(s.type);
        // 确保targetId存在于allNodes中
        const isValidTarget = allNodes.some(n => n.id === s.targetId);
        // 检查是否已经存在相同源、目标和类型的关系
        const isNew = !links.some(l => {
          const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
          return sId === selectedNode.id && tId === s.targetId && l.type === s.type;
        });
        return isValidType && isValidTarget && isNew;
      }).slice(0, 10); // 最多返回10条置信度最高的建议

      if (validSuggestions.length === 0) {
        alert("AI 未发现新的关联建议，或建议的关联已存在。");
        return;
      }
      
      // 通过回调将建议传递给App组件
      if (onAISuggestions) {
        onAISuggestions(selectedNode, validSuggestions);
      }
    } catch (error) {
      console.error('AI建议关系错误:', error);
      alert("获取建议失败。");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateLink = () => {
    if (!selectedNode || !linkFormData.targetId) return;

    // 去重检查：确保不会向同一目标添加第二条连线
    const isDuplicate = relatedLinks.some(l => {
       // 如果当前正在编辑，则忽略连线本身
       if (editingLinkId && l.id === editingLinkId) return false;
       
       const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
       return tId === linkFormData.targetId;
    });

    if (isDuplicate) {
       const targetTitle = allNodes.find(n => n.id === linkFormData.targetId)?.title;
       alert(`与目标词条 "${targetTitle}" 之间已存在关联关系，请勿重复添加。`);
       return;
    }

    if (editingLinkId) {
      // 更新现有
      onUpdateLink({
        id: editingLinkId,
        source: selectedNode.id,
        target: linkFormData.targetId,
        type: linkFormData.type,
        weight: linkFormData.weight
      });
    } else {
      // 创建新关联
      onAddLink({
        id: generateId(),
        source: selectedNode.id,
        target: linkFormData.targetId,
        type: linkFormData.type,
        weight: linkFormData.weight
      });
    }
    
    resetLinkForm();
    // 关联关系建立后，自动定位到当前选中节点
    onCenterNode();
  };

  const handleEditLinkClick = (link: Relationship) => {
    // 因为我们严格过滤出站连线，目标始终是另一个节点
    const targetId = (typeof link.target === 'object' ? link.target.id : link.target);
    const targetNode = allNodes.find(n => n.id === targetId);

    setEditingLinkId(link.id);
    setLinkFormData({
      targetId: targetId,
      type: link.type as RelationType,
      weight: link.weight
    });
    setLinkSearchTerm(targetNode ? targetNode.title : '');
    // 触发视觉预览：显示橙色虚线
    onPreviewConnection(targetId);
  };

  // 为下拉菜单过滤节点
  const filteredTargetNodes = allNodes
    .filter(n => n.id !== selectedNode?.id) // 排除自身
    .filter(n => {
      if (existingTargetIds.has(n.id)) {
        // 节点已关联。
        // 仅允许在它是我们 当前正在编辑 的连线的目标时出现。
        if (editingLinkId) {
          const currentEditingLink = relatedLinks.find(l => l.id === editingLinkId);
          const currentTargetId = currentEditingLink ? (typeof currentEditingLink.target === 'object' ? (currentEditingLink.target as any).id : currentEditingLink.target) : null;
          return n.id === currentTargetId;
        }
        // 如果未编辑，则直接排除它
        return false;
      }
      return true;
    })
    .filter(n => n.title.toLowerCase().includes(linkSearchTerm.toLowerCase()));

  const selectedTargetNode = allNodes.find(n => n.id === linkFormData.targetId);

  return (
      <div className="w-full h-auto max-h-full flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden transition-colors">
        {/* 顶部标题 */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 min-h-[60px] shrink-0">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2">
            {isCreating ? <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <Network className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            {isCreating ? (homonymSourceId ? '创建同名词条' : '新建词条') : '词条详情'}
          </h2>
          <div className="flex items-center gap-1">
            {!isCreating && (
               <>
                {onOpenDetailView && (
                   <button 
                     onClick={onOpenDetailView}
                     className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                     title="查看详情页"
                   >
                     <Eye className="w-5 h-5" />
                   </button>
                )}
                <button 
                  onClick={onCenterNode}
                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                  title="在画布中定位"
                >
                  <LocateFixed className="w-5 h-5" />
                </button>
             </>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
        
        {/* 基本信息部分 */}
        <div className="space-y-4">
          
          {!isEditing ? (
            /* 查看模式 */
            <div className="space-y-4 animate-in fade-in duration-300">
               <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      {(() => {
                        const categoryObj = categories.find(cat => cat.id === formData.category) || { name: '其他', id: 0 };
                        const categoryName = categoryObj.name;
                        return (
                          <span 
                            className="inline-block px-2.5 py-0.5 text-xs rounded-md font-medium border"
                            style={{
                              backgroundColor: (CATEGORY_STYLES[categoryName] || CATEGORY_STYLES['其他']).fill,
                              color: (CATEGORY_STYLES[categoryName] || CATEGORY_STYLES['其他']).stroke,
                              borderColor: (CATEGORY_STYLES[categoryName] || CATEGORY_STYLES['其他']).stroke
                            }}
                          >
                            {categoryName}
                          </span>
                        );
                      })()}
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        ID: {formData.id}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${formData.status === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                      {formData.status === 1 ? '已启用' : '未启用'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2 mb-3 pl-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight break-words">
                        {formData.title || '无标题'}
                      </h3>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={handleCreateHomonym}
                          className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/30 px-2.5 py-1.5 rounded-md transition-colors shrink-0"
                          title="创建同名但不同含义的词条（自动建立同名关系）"
                        >
                          <CopyPlus className="w-3.5 h-3.5" /> 同名
                        </button>
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 px-2.5 py-1.5 rounded-md transition-colors shrink-0"
                        >
                          <Pencil className="w-3.5 h-3.5" /> 编辑
                        </button>
                      </div>
                  </div>
               </div>
               
               <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">消歧义描述</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {formData.description || <span className="italic text-slate-400">暂无描述...</span>}
                  </p>
               </div>
            </div>
          ) : (
            /* 编辑模式 */
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* 同名词条提示 */}
              {homonymSourceId && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-3 rounded-lg text-xs text-indigo-700 dark:text-indigo-300 flex gap-2 items-start">
                  <div className="mt-0.5"><CopyPlus className="w-3.5 h-3.5" /></div>
                  <div>
                    正在创建 <strong>{formData.title}</strong> 的同名词条。
                    <br/>保存后将自动与原词条建立<span className="font-bold">同名</span>关系 (权重8)。
                  </div>
                </div>
              )}

              {/* 标题字段 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">词条名称</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                    placeholder="例如：量子力学"
                    autoFocus={isCreating}
                  />
                  <button 
                    onClick={handleAIGenerate}
                    disabled={loading || !formData.title}
                    className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/40 disabled:opacity-50 transition-colors border border-purple-100 dark:border-purple-800"
                    title="AI 自动生成"
                  >
                    <Wand2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 分类字段（下拉） */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">分类</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 启用状态字段 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">启用状态</label>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${formData.status === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                    {formData.status === 1 ? '已启用' : '未启用'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.status === 1}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* 描述字段（消歧义） */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">消歧义描述 {homonymSourceId && <span className="text-red-500">*</span>}</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all resize-none"
                  placeholder="请输入简短的消歧义描述（区分于原义）..."
                />
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 py-2 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Undo2 className="w-4 h-4" /> 取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isSaveEnabled}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm
                    ${!isSaveEnabled 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md'
                    }`}
                >
                  <Save className="w-4 h-4" />
                  {isCreating ? '创建' : '保存'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* 关系部分 */}
        {!isCreating && selectedNode && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6" ref={linkSectionRef}>
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                 <Link2 className="w-4 h-4" /> 关系链接
               </h3>
               <button 
                 onClick={handleAISuggestLinks}
                 disabled={loading || !!editingLinkId}
                 className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 font-medium bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-full border border-purple-100 dark:border-purple-800 transition-colors disabled:opacity-50"
               >
                 <Wand2 className="w-3 h-3" /> AI 建议
               </button>
            </div>

            {/* 添加/编辑关联表单 */}
            <div className={`bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg mb-4 border relative shadow-sm transition-colors ${editingLinkId || linkFormData.targetId ? 'border-blue-300 dark:border-blue-500 ring-1 ring-blue-100 dark:ring-blue-900' : 'border-slate-200/60 dark:border-slate-700'}`}>
               {editingLinkId && (
                 <div className="absolute -top-2.5 left-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                   正在编辑关联
                 </div>
               )}
               {pendingLinkTarget && !editingLinkId && (
                 <div className="absolute -top-2.5 left-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200 dark:border-green-800">
                   建立新关联
                 </div>
               )}

               <div className="flex flex-col gap-2 mt-1">
                  {/* 类型选择 */}
                  <select 
                    className="text-sm p-2 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 outline-none focus:border-blue-400 text-slate-700 dark:text-slate-200"
                    value={linkFormData.type}
                    onChange={e => setLinkFormData({...linkFormData, type: e.target.value as RelationType})}
                  >
                    {Object.values(RelationType).map(t => (
                      <option key={t} value={t}>{RELATION_LABELS[t]}</option>
                    ))}
                  </select>
                  
                  {/* 目标节点组合框 */}
                  <div className="relative">
                    <div 
                      className="flex items-center border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 focus-within:border-blue-400 overflow-hidden transition-all"
                      onClick={() => setShowLinkDropdown(true)}
                    >
                      <Search className="w-4 h-4 text-slate-400 ml-2" />
                      <input 
                        type="text"
                        className="w-full text-sm p-2 outline-none bg-transparent text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                        placeholder={selectedTargetNode ? selectedTargetNode.title : "搜索目标词条..."}
                        value={showLinkDropdown ? linkSearchTerm : (selectedTargetNode?.title || '')}
                        onChange={(e) => {
                           setLinkSearchTerm(e.target.value);
                           if (!showLinkDropdown) setShowLinkDropdown(true);
                           if (linkFormData.targetId) {
                             setLinkFormData(prev => ({...prev, targetId: ''}));
                             onPreviewConnection(null);
                           }
                        }}
                        onFocus={() => setShowLinkDropdown(true)}
                      />
                      <div className="pr-2 text-slate-400 cursor-pointer">
                        {linkFormData.targetId ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setLinkFormData(prev => ({...prev, targetId: ''}));
                              setLinkSearchTerm('');
                              onPreviewConnection(null);
                            }}
                            className="hover:text-red-500 flex items-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <ChevronsUpDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {/* 下拉菜单 */}
                    {showLinkDropdown && (
                      <>
                        <div className="fixed inset-0 z-10 cursor-default" onClick={() => setShowLinkDropdown(false)}></div>
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md shadow-xl max-h-48 overflow-y-auto ring-1 ring-black/5">
                          {filteredTargetNodes.length === 0 ? (
                            <div className="p-3 text-xs text-slate-400 text-center">
                               {allNodes.filter(n => n.id !== selectedNode.id).length === 0 ? "无其他词条可选" : 
                                (linkSearchTerm ? "未找到匹配词条" : "暂无其他可选词条 (已关联)")}
                            </div>
                          ) : (
                            filteredTargetNodes.map(node => (
                              <div 
                                key={node.id}
                                className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center border-b border-slate-50 dark:border-slate-700 last:border-none"
                                onClick={() => {
                                  setLinkFormData(prev => ({...prev, targetId: node.id}));
                                  setLinkSearchTerm('');
                                  setShowLinkDropdown(false);
                                  onPreviewConnection(node.id);
                                }}
                              >
                                <span>{node.title}</span>
                                {linkFormData.targetId === node.id && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* 权重滑块 */}
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                       <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                         <Weight className="w-3 h-3" /> 关联强度 (权重)
                       </label>
                       <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{linkFormData.weight}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={linkFormData.weight}
                      onChange={(e) => setLinkFormData({...linkFormData, weight: parseInt(e.target.value)})}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                       <span>弱</span>
                       <span>强</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                     {(editingLinkId || linkFormData.targetId) && (
                       <button
                         onClick={resetLinkForm}
                         className="flex-1 py-1.5 rounded text-sm font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                       >
                         取消
                       </button>
                     )}
                     <button 
                      onClick={handleCreateOrUpdateLink}
                      disabled={!linkFormData.targetId}
                      className={`flex-1 py-1.5 rounded text-sm font-medium text-white transition-colors shadow-sm
                        ${editingLinkId ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {editingLinkId ? '更新关联' : '添加关联'}
                    </button>
                  </div>
               </div>
            </div>

            {/* 列出现有连线（按分类分组） */}
            <div className="space-y-4">
              {Object.keys(groupedLinks).length === 0 && (
                 <p className="text-xs text-slate-400 italic text-center py-2">暂无关联数据</p>
              )}
              
              {Object.entries(groupedLinks).map(([type, groupLinks]) => (
                <div key={type} className="animate-in fade-in duration-300">
                   <h4 className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2 flex items-center gap-2 pl-1">
                     <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                     {RELATION_LABELS[type as RelationType]} ({groupLinks.length})
                     <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                   </h4>
                   
                   <div className="space-y-2">
                     {groupLinks.map(link => {
                        // 由于我们严格过滤 source == selectedNode，另一个节点 始终 是目标节点
                        const otherId = (typeof link.target === 'object' ? link.target.id : link.target);
                        const otherNode = allNodes.find(n => n.id === otherId);
                        const isEditingThis = editingLinkId === link.id;
                        const isHovered = otherId === hoveredNodeId;
                        const categoryStyle = CATEGORY_STYLES[otherNode?.category || '其他'] || CATEGORY_STYLES['其他'];
                        
                        return (
                          <div 
                            key={link.id} 
                            onMouseEnter={() => otherNode && setHoveredNodeId(otherNode.id)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                            className={`flex items-center justify-between text-sm bg-white dark:bg-slate-800 border p-2.5 rounded-md shadow-sm group transition-all
                              ${isEditingThis ? 'border-blue-400 ring-1 ring-blue-100 dark:ring-blue-900 bg-blue-50/30 dark:bg-blue-900/20' : 
                                isHovered ? 'border-blue-300 dark:border-blue-500 ring-1 ring-blue-50 dark:ring-blue-900 bg-blue-50/10 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'}
                            `}
                          >
                             <div 
                                className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer p-1 -m-1 rounded transition-colors"
                                onClick={() => otherNode && onSelectNode(otherNode)}
                                title="点击查看该词条"
                             >
                               <div 
                                 className="w-1 h-8 rounded-full shrink-0 transition-colors"
                                 style={{ backgroundColor: categoryStyle.stroke, opacity: isHovered ? 1 : 0.7 }}
                               ></div>
                               <div className="flex flex-col min-w-0">
                                 <div className="flex items-baseline gap-2 mt-1">
                                   <span className={`truncate font-semibold transition-colors ${isHovered ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                     {otherNode?.title || '未知'}
                                   </span>
                                   <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 rounded-full whitespace-nowrap">
                                      权重: {link.weight || 1}
                                   </span>
                                 </div>
                               </div>
                             </div>
                             
                             <div className="flex items-center gap-1 pl-2">
                               <button
                                 onClick={() => handleEditLinkClick(link)}
                                 className={`p-1.5 rounded-md transition-all shrink-0
                                   ${isEditingThis 
                                     ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300' 
                                     : 'text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-0 group-hover:opacity-100'
                                   }
                                 `}
                                 title="编辑关联"
                               >
                                 <Pencil className="w-3.5 h-3.5" />
                               </button>
                               <button 
                                 onClick={() => onDeleteLink(link.id)}
                                 disabled={!!editingLinkId}
                                 className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 shrink-0 disabled:opacity-20"
                                 title="移除关联"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                             </div>
                          </div>
                        );
                     })}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 底部操作 */}
      {!isCreating && (
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button 
            onClick={() => selectedNode && onDeleteNode(selectedNode.id)}
            className="w-full py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 border border-red-200 dark:border-red-800 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-all"
          >
            <Trash2 className="w-4 h-4" /> 删除当前词条
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
