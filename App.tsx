import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Entry, Relationship, RelationType, Category, CATEGORY_STYLES } from './types';
import GraphView, { GraphViewHandle } from './components/GraphView';
import KanbanView, { KanbanViewHandle } from './components/KanbanView';
import Sidebar from './components/Sidebar';
import Settings, { AIModelConfig } from './components/Settings';
import AISuggestionModal from './components/AISuggestionModal';
import { Plus, Search, LayoutGrid, Network, Minus, RotateCcw, Unplug, X, ExternalLink, Sun, Moon, Monitor, Database, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import { initAIService } from './services/aiService';
import { apiService } from './services/apiService';
import { seedNodes, seedLinks } from './data/seedData';

const STORAGE_KEY_THEME = 'bujidao_theme';
const STORAGE_KEY_AI_CONFIG = 'bujidao_ai_config';

type Theme = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  // --- Data State ---
  const [nodes, setNodes] = useState<Entry[]>([]);
  const [links, setLinks] = useState<Relationship[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  // --- UI State ---
  const [viewMode, setViewMode] = useState<'graph' | 'kanban'>('graph');
  const [selectedNode, setSelectedNode] = useState<Entry | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showOrphanList, setShowOrphanList] = useState(false);
  const [pendingCreateTitle, setPendingCreateTitle] = useState('');
  const [pendingLinkTarget, setPendingLinkTarget] = useState<Entry | null>(null);
  const [previewConnectionId, setPreviewConnectionId] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  // AI建议弹窗状态
  const [showAISuggestionModal, setShowAISuggestionModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    targetId: string;
    type: RelationType;
    weight?: number;
    reason?: string;
  }>>([]);
  const [aiSuggestionSourceNode, setAiSuggestionSourceNode] = useState<Entry | null>(null);
  
  // --- AI Model Settings ---  
  const [aiConfig, setAiConfig] = useState<AIModelConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AI_CONFIG);
      const parsedConfig = saved ? JSON.parse(saved) : { type: 'doubao' };
      // 只保留type字段，确保使用doubao作为默认值
      const configType = parsedConfig.type === 'doubao' ? 'doubao' : 'doubao';
      return { type: configType };
    } catch { 
      return { type: 'doubao' };
    }
  });
  const [aiModels, setAiModels] = useState<Array<{ type: string; name: string; defaultModelName: string }>>([]);
  const [showSettings, setShowSettings] = useState(false);

  // 获取AI模型配置
  useEffect(() => {
    const fetchAIConfig = async () => {
      try {
        const config = await apiService.getAIConfig();
        setAiModels(config.models);
        
        // 获取本地配置
        const savedConfig = localStorage.getItem(STORAGE_KEY_AI_CONFIG);
        let localConfig: AIModelConfig;
        
        if (savedConfig) {
          localConfig = JSON.parse(savedConfig);
          // 只保留type字段
          localConfig = { type: localConfig.type };
          // 检查本地配置的模型类型是否在后端配置中存在
          const modelConfig = config.models.find(model => model.type === localConfig.type);
          if (modelConfig) {
            setAiConfig(localConfig);
          }
        } else if (config.models.length > 0) {
          // 如果本地没有配置，使用第一个模型作为默认配置
          const defaultModel = config.models[0];
          const defaultConfig: AIModelConfig = {
            type: defaultModel.type as 'gemini' | 'doubao'
          };
          setAiConfig(defaultConfig);
          localStorage.setItem(STORAGE_KEY_AI_CONFIG, JSON.stringify(defaultConfig));
        }
      } catch (error) {
        console.error('获取AI配置失败:', error);
      }
    };

    fetchAIConfig();
  }, []);

  const graphRef = useRef<GraphViewHandle>(null);
  const kanbanRef = useRef<KanbanViewHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // 初始化viewport为0，然后在useEffect中更新为实际值
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  // --- Effects ---
  // 初始化和更新AI服务
  useEffect(() => {
    const initializeAIService = async () => {
      try {
        await initAIService(aiConfig.type);
      } catch (error) {
        console.error("初始化AI服务失败:", error);
      }
    };

    initializeAIService();
  }, [aiConfig]);

  // 从数据库加载数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      setErrorDetails(null);
      try {
        console.log('开始从数据库加载数据...');
        // 并行获取数据和分类
        const [graphData, categoriesData] = await Promise.all([
          apiService.getGraphData(),
          apiService.getAllCategories()
        ]);
        
        console.log('成功获取到数据:', {
          nodesCount: graphData.nodes?.length || 0,
          linksCount: graphData.links?.length || 0,
          categoriesCount: categoriesData.length
        });
        
        // 定义分类的期望顺序
        const categoryOrder = [
          '概念', '科学', '技术', '人物', '地点', '组织', '事件', '艺术', '历史', '自然', '社会', '物品', '其他'
        ];
        
        // 按照期望顺序对分类进行排序
        const sortedCategories = [...categoriesData].sort((a, b) => {
          const indexA = categoryOrder.indexOf(a.name);
          const indexB = categoryOrder.indexOf(b.name);
          // 如果分类不在预定义列表中，将其放在最后
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
        
        setNodes(graphData.nodes);
        setLinks(graphData.links);
        setCategories(sortedCategories);
      } catch (err) {
        console.error('❌ 加载数据失败:', err);
        let errorMsg = '加载数据失败';
        let details = '';
        
        if (err instanceof Error) {
          console.error('错误名称:', err.name);
          console.error('错误信息:', err.message);
          console.error('错误堆栈:', err.stack);
          
          details = err.message;
          
          // 检查是否是CORS错误
          if (err.message.includes('CORS')) {
            errorMsg = 'CORS错误：无法从服务器获取数据';
            details = '请检查服务器的CORS配置，确保允许当前域名访问';
          }
          // 检查是否是网络错误
          else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
            errorMsg = '网络错误：无法连接到服务器';
            details = '请检查服务器是否正在运行，以及URL是否正确';
          }
          // 检查是否是HTTP错误
          else if (err.message.includes('HTTP error')) {
            errorMsg = '服务器错误：请求失败';
            details = err.message;
          }
        }
        
        setError(errorMsg);
        setErrorDetails(details);
        setShowError(true);
        // 使用本地种子数据作为备用
        console.log('使用本地种子数据作为备用...');
        setNodes(seedNodes);
        setLinks(seedLinks);
        // 分类加载失败时使用默认分类
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setViewport({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const applyTheme = (t: Theme) => {
      const isDark = t === 'dark' || (t === 'system' && systemDark);
      if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, t);
    };
    
    // 默认使用系统主题
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) as Theme || 'system';
    applyTheme(savedTheme);
    
    if (savedTheme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => applyTheme('system');
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, []);

  // --- Helpers & Handlers ---
  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
  const getId = (item: any) => (typeof item === 'string' ? item : item?.id);

  const handleAddNode = useCallback(async (node: Entry) => {
    try {
      // 调用API创建新节点，API会忽略传入的id并生成新id
      const newNode = await apiService.addEntry(node);
      
      // 更新nodes数组：如果存在临时节点（id以temp-开头），则替换它，否则添加新节点
      setNodes(prev => {
        // 尝试通过title和description匹配临时节点
        const tempNodeIndex = prev.findIndex(n => 
          n.title === newNode.title && 
          n.description === newNode.description && 
          n.id.startsWith('temp-')
        );
        
        if (tempNodeIndex !== -1) {
          // 替换临时节点为真实节点
          const newNodes = [...prev];
          newNodes[tempNodeIndex] = newNode;
          return newNodes;
        } else {
          // 添加新节点
          return [...prev, newNode];
        }
      });
      
      // 立即设置selectedNode为真实节点，确保Sidebar组件显示真实ID
      setSelectedNode(newNode);
      
      // 如果侧边栏未打开，自动打开
      setShowSidebar(true);
    } catch (err) {
      console.error('添加节点失败:', err);
      setError('添加节点失败');
      setShowError(true);
    }
  }, []);

  const handleUpdateNode = useCallback(async (updatedNode: Entry) => {
    try {
      const updated = await apiService.updateEntry(updatedNode.id, updatedNode);
      setNodes(prev => prev.map(n => n.id === updated.id ? updated : n));
    } catch (err) {
      console.error('更新节点失败:', err);
      setError('更新节点失败');
      setShowError(true);
    }
  }, []);

  const handleDeleteNode = useCallback(async (id: string) => {
    try {
      await apiService.deleteEntry(id);
      setNodes(prev => prev.filter(n => n.id !== id));
      setLinks(prev => prev.filter(l => getId(l.source) !== id && getId(l.target) !== id));
      setShowSidebar(false);
    } catch (err) {
      console.error('删除节点失败:', err);
      setError('删除节点失败');
      setShowError(true);
    }
  }, [getId]);

  const handleAddLink = useCallback(async (link: Relationship) => {
    try {
      await apiService.addRelationship(link);
      // 重新获取所有数据，确保双向关系同步
      const graphData = await apiService.getGraphData();
      setNodes(graphData.nodes);
      setLinks(graphData.links);
    } catch (err) {
      console.error('添加关联失败:', err);
      setError('添加关联失败');
      setShowError(true);
    }
  }, []);

  const handleUpdateLink = useCallback(async (updatedLink: Relationship) => {
    try {
      await apiService.updateRelationship(updatedLink.id, updatedLink);
      // 重新获取所有数据，确保双向关系同步
      const graphData = await apiService.getGraphData();
      setNodes(graphData.nodes);
      setLinks(graphData.links);
    } catch (err) {
      console.error('更新关联失败:', err);
      setError('更新关联失败');
      setShowError(true);
    }
  }, []);

  const handleDeleteLink = useCallback(async (id: string) => {
    try {
      await apiService.deleteRelationship(id);
      // 重新获取所有数据，确保双向关系同步
      const graphData = await apiService.getGraphData();
      setNodes(graphData.nodes);
      setLinks(graphData.links);
    } catch (err) {
      console.error('删除关联失败:', err);
      setError('删除关联失败');
      setShowError(true);
    }
  }, []);

  const handleResetData = async () => {
    if(window.confirm('确定要从数据库重新加载所有数据吗？')) {
      setIsLoading(true);
      setError(null);
      setErrorDetails(null);
      try {
        console.log('开始从数据库重新加载所有数据...');
        const graphData = await apiService.getGraphData();
        console.log('成功获取到数据:', {
          nodesCount: graphData.nodes?.length || 0,
          linksCount: graphData.links?.length || 0
        });
        setNodes(graphData.nodes);
        setLinks(graphData.links);
      } catch (err) {
        console.error('❌ 重新加载数据失败:', err);
        let errorMsg = '重新加载数据失败';
        let details = '';
        
        if (err instanceof Error) {
          details = err.message;
        }
        
        setError(errorMsg);
        setErrorDetails(details);
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
    }
  };



  const toggleTheme = () => {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) as Theme || 'system';
    let newTheme: Theme;
    if (savedTheme === 'light') newTheme = 'dark';
    else if (savedTheme === 'dark') newTheme = 'system';
    else newTheme = 'light';
    
    const root = window.document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = newTheme === 'dark' || (newTheme === 'system' && systemDark);
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem(STORAGE_KEY_THEME, newTheme);
  };

  const handleNodeClick = (node: Entry) => {
    setSelectedNode(node);
    setShowSidebar(true);
    setSearchQuery('');
    setShowSearchDropdown(false);
    setShowOrphanList(false);
    setPendingLinkTarget(null);
    setPreviewConnectionId(null);
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
    setShowSidebar(false);
    setShowOrphanList(false);
    setPendingLinkTarget(null);
    setPreviewConnectionId(null);
  };

  const handleNodeDrop = (source: Entry, target: Entry) => {
    setSelectedNode(source);
    setPendingLinkTarget(target);
    setShowSidebar(true);
  };

  const handleCreateNew = () => {
    setPendingCreateTitle(''); 
    setSelectedNode(null);
    setShowSidebar(true);
    setShowOrphanList(false);
  };

  const handleQuickCreate = () => {
    setPendingCreateTitle(searchQuery); 
    setSelectedNode(null);
    setShowSidebar(true);
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  // AI弹窗相关函数
  const handleAISuggestions = (sourceNode: Entry, suggestions: typeof aiSuggestions) => {
    setAiSuggestionSourceNode(sourceNode);
    setAiSuggestions(suggestions);
    setShowAISuggestionModal(true);
  };

  const handleAISuggestionsConfirm = (selectedSuggestions: any[]) => {
    // 确认添加选中的AI建议，只添加弹窗中保留的关系
    if (aiSuggestionSourceNode) {
      selectedSuggestions.forEach(s => {
        if (s.type && s.targetId) {
          handleAddLink({
            id: generateId(),
            source: aiSuggestionSourceNode.id,
            target: s.targetId,
            type: s.type,
            weight: 5 // 固定默认权重为5
          });
        }
      });
      // AI 建议的关联关系添加后，自动定位到当前选中节点
      if (aiSuggestionSourceNode) {
        if (viewMode === 'graph' && graphRef.current) {
          graphRef.current.centerNode(aiSuggestionSourceNode.id);
        } else if (viewMode === 'kanban' && kanbanRef.current) {
          kanbanRef.current.scrollToNode(aiSuggestionSourceNode.id);
        }
      }
    }
    setShowAISuggestionModal(false);
  };

  const handleSearchSelect = (node: Entry) => {
    handleNodeClick(node);
    if (viewMode === 'graph' && graphRef.current) {
      graphRef.current.centerNode(node.id);
    } else if (viewMode === 'kanban' && kanbanRef.current) {
      kanbanRef.current.scrollToNode(node.id);
    }
  };

  const orphanNodes = useMemo(() => {
    const connectedNodeIds = new Set<string>();
    links.forEach(l => {
       const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
       const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
       connectedNodeIds.add(sId);
       connectedNodeIds.add(tId);
    });
    return nodes.filter(n => !connectedNodeIds.has(n.id));
  }, [nodes, links]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return nodes.filter(n => 
      n.title.toLowerCase().includes(query) || 
      n.tags.some(t => t.toLowerCase().includes(query))
    );
  }, [nodes, searchQuery]);

  return (
    <div className="w-full h-screen overflow-hidden text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative" ref={containerRef} onClick={() => setShowSearchDropdown(false)}>
      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-slate-800 dark:text-slate-200">正在加载数据...</span>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {showError && error && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg shadow-lg flex flex-col items-start gap-2 max-w-md">
          <div className="flex items-center justify-between w-full">
            <span className="font-medium">{error}</span>
            <button onClick={() => setShowError(false)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          {errorDetails && (
            <span className="text-sm text-red-600 dark:text-red-400">{errorDetails}</span>
          )}
        </div>
      )}

      {/* 视图内容 */}
      <div className="absolute inset-0 z-0">
          {viewMode === 'graph' ? (
            <GraphView 
              ref={graphRef}
              nodes={nodes}
              links={links} 
              categories={categories}
              onNodeClick={handleNodeClick}
              onBackgroundClick={handleBackgroundClick}
              width={Math.max(viewport.width, 800)} // 确保至少有800px宽度
              height={Math.max(viewport.height, 600)} // 确保至少有600px高度
              selectedNodeId={selectedNode?.id}
              hoveredNodeId={hoveredNodeId}
              setHoveredNodeId={setHoveredNodeId}
              onZoomChange={setZoomLevel}
              isDarkMode={document.documentElement.classList.contains('dark')}
              onNodeDrop={handleNodeDrop}
              pendingLinkTargetId={previewConnectionId || pendingLinkTarget?.id}
            />
          ) : (
            <div className="w-full h-full pt-20 pb-20">
              <KanbanView 
                ref={kanbanRef}
                nodes={nodes}
                categories={categories}
                onNodeSelect={handleNodeClick}
                onNodeUpdate={handleUpdateNode}
                selectedNodeId={selectedNode?.id}
              />
            </div>
          )}
      </div>

      {/* 左上角 Logo */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg border border-slate-100 dark:border-slate-800 rounded-2xl p-3 pr-6 pointer-events-auto flex items-center gap-4 transition-colors">
               <div className="shrink-0">
                  {!logoError ? (
                    <img 
                      src="https://video.xinkesmart.com/cover_picture/微信图片_20250912183220_438_33.png" 
                      alt="布吉岛百科图谱" 
                      className="h-12 w-auto object-contain"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <h1 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">布吉岛百科图谱</h1>
                    </div>
                  )}
               </div>
               <div className="h-8 w-[1.5px] bg-slate-200 dark:bg-slate-700 rounded-full"></div>
               <p className="text-sm font-bold text-slate-600 dark:text-slate-300 tracking-wide">专为少年儿童打造的百科知识库</p>
          </div>
      </div>

      {/* 右上角：搜索与创建 */}
      <div className="absolute top-6 right-6 z-10 flex items-end pointer-events-none">
          <div className="relative pointer-events-auto shadow-lg rounded-xl" onClick={e => e.stopPropagation()}>
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input 
                    type="text"
                    placeholder="快速定位或新建词条..."
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setShowSearchDropdown(true);
                    }}
                    onFocus={() => {
                      setShowSearchDropdown(true);
                      setShowSidebar(false); // 聚焦时关闭详情窗口
                    }}
                    onClick={() => setShowSidebar(false)} // 点击时关闭详情窗口
                    className="w-64 sm:w-80 pl-9 pr-12 h-[42px] bg-white/90 dark:bg-slate-900/90 dark:text-white backdrop-blur-sm border border-slate-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-700 placeholder:text-slate-400"
                />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateNew();
                  }}
                  className="absolute right-2 p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* 搜索下拉 */}
              {showSearchDropdown && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto overflow-x-hidden z-50">
                   {searchResults.length > 0 ? (
                     searchResults.map(node => {
                       const categoryObj = categories.find(cat => cat.id === node.category) || { name: '其他', id: 0 };
                       const categoryName = categoryObj.name;
                       const style = CATEGORY_STYLES[categoryName] || CATEGORY_STYLES['其他'];
                       return (
                         <div 
                           key={node.id}
                           onClick={() => handleSearchSelect(node)}
                           className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 last:border-none"
                         >
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: style.stroke }}></div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{node.title}</span>
                         </div>
                       );
                     })
                   ) : (
                     <div className="p-4 text-center text-sm text-slate-400 flex flex-col gap-3">
                       <span>未找到相关词条</span>
                       <button
                         onClick={handleQuickCreate}
                         className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 w-full"
                       >
                         <Plus className="w-3.5 h-3.5" /> 创建 "{searchQuery}"
                       </button>
                     </div>
                   )}
                </div>
              )}
          </div>
      </div>

      {/* 左下角工具栏 */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-auto flex flex-col gap-3">
        {showOrphanList && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-72 max-h-96 flex flex-col overflow-hidden animate-in slide-in-from-bottom-2">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Unplug className="w-4 h-4 text-orange-500" /> 游离词条 ({orphanNodes.length})
              </h3>
              <button onClick={() => setShowOrphanList(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-1">
              {orphanNodes.length > 0 ? (
                <div className="space-y-1">
                  {orphanNodes.map(node => (
                    <div key={node.id} onClick={() => { handleSearchSelect(node); setShowOrphanList(false); }} className="px-3 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer rounded-lg flex items-center gap-3 transition-colors group">
                       <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-orange-600">{node.title}</span>
                       <ExternalLink className="w-3 h-3 text-slate-300 ml-auto opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              ) : <div className="p-8 text-center text-xs text-slate-400">所有节点均已建立连接</div>}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {/* 视图切换 */}
          <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg border border-slate-100 dark:border-slate-800 rounded-xl p-1">
            <button onClick={() => setViewMode('graph')} className={`p-2 rounded-lg ${viewMode === 'graph' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}><Network className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg ${viewMode === 'kanban' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
          </div>

          {/* 缩放 */}
          {viewMode === 'graph' && (
            <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg border border-slate-100 dark:border-slate-800 rounded-xl p-1">
              <button onClick={() => graphRef.current?.zoomOut()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><Minus className="w-4 h-4" /></button>
              <span className="w-12 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => graphRef.current?.zoomIn()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><Plus className="w-4 h-4" /></button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <button onClick={() => graphRef.current?.resetZoom()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><RotateCcw className="w-4 h-4" /></button>
            </div>
          )}

          {/* 杂项 */}
          <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg border border-slate-100 dark:border-slate-800 rounded-xl p-1">
             <button onClick={() => setShowOrphanList(!showOrphanList)} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${showOrphanList ? 'bg-orange-100 text-orange-700' : 'text-slate-600 dark:text-slate-400'}`}><Unplug className="w-4 h-4" /> 游离词条 {orphanNodes.length > 0 && <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{orphanNodes.length}</span>}</button>
             <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
             <button onClick={toggleTheme} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">{document.documentElement.classList.contains('dark') ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}</button>
             <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
             <button onClick={handleResetData} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600" title="从数据库重新加载数据"><Database className="w-4 h-4" /></button>
             {/* <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div> */}
             {/* <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600"><SettingsIcon className="w-4 h-4" /></button> */}
          </div>
        </div>
      </div>

      {/* 侧边栏 */}
      <div className={`absolute top-20 bottom-6 right-6 w-[400px] z-30 pointer-events-none flex flex-col justify-start items-end transition-all duration-300 ${showSidebar ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        {showSidebar && (
          <div className="pointer-events-auto w-full h-full">
            <Sidebar 
            selectedNode={selectedNode}
            allNodes={nodes}
            links={links}
            categories={categories}
            onAddNode={handleAddNode}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onAddLink={handleAddLink}
            onUpdateLink={handleUpdateLink}
            onDeleteLink={handleDeleteLink}
            onSelectNode={handleNodeClick}
            onCenterNode={() => {
              if (selectedNode) {
                if (viewMode === 'graph' && graphRef.current) graphRef.current.centerNode(selectedNode.id);
                else if (viewMode === 'kanban' && kanbanRef.current) kanbanRef.current.scrollToNode(selectedNode.id);
              }
            }}
            hoveredNodeId={hoveredNodeId}
            setHoveredNodeId={setHoveredNodeId}
            onClose={() => { setShowSidebar(false); setSelectedNode(null); }}
            initialTitle={pendingCreateTitle}
            pendingLinkTarget={pendingLinkTarget}
            onPreviewConnection={setPreviewConnectionId}
            onAISuggestions={handleAISuggestions}
          />
          </div>
        )}
      </div>

      {/* 设置面板 - 暂时禁用 */}
      {/* <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={aiConfig}
        onSave={setAiConfig}
        aiModels={aiModels}
      /> */}

      {/* AI关联关系建议弹窗 */}
      <AISuggestionModal
        isOpen={showAISuggestionModal}
        suggestions={aiSuggestions.map(s => ({ ...s, id: generateId() }))}
        allNodes={nodes}
        onConfirm={handleAISuggestionsConfirm}
        onCancel={() => setShowAISuggestionModal(false)}
      />

      {/* 统计数据组件 */}
      <div className="absolute bottom-6 right-6 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4 flex gap-6">
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">词条总数</span>
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{nodes.length}</span>
        </div>
        <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">启用词条</span>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">{nodes.filter(node => node.status === 1).length}</span>
        </div>
        <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">未启用词条</span>
          <span className="text-2xl font-bold text-red-600 dark:text-red-400">{nodes.filter(node => node.status === 0).length}</span>
        </div>
      </div>
    </div>
  );
};

export default App;