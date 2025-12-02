
import React, { useRef, useState, useMemo } from 'react';
import { Entry, Relationship, CATEGORY_STYLES } from '../types';
import GraphView, { GraphViewHandle } from './GraphView';
import KanbanView, { KanbanViewHandle } from './KanbanView';
import Sidebar from './Sidebar';
import { Plus, Search, Database, LayoutGrid, Network, Minus, RotateCcw, Unplug, X, ExternalLink, Sun, Moon, Monitor } from 'lucide-react';

interface GraphPageProps {
  nodes: Entry[];
  links: Relationship[];
  categories: Category[];
  theme: 'light' | 'dark' | 'system';
  isDarkMode: boolean;
  onAddNode: (node: Entry) => void;
  onUpdateNode: (node: Entry) => void;
  onDeleteNode: (id: string) => void;
  onAddLink: (link: Relationship) => void;
  onUpdateLink: (link: Relationship) => void;
  onDeleteLink: (id: string) => void;
  onToggleTheme: () => void;
  onResetData: () => void;
  onNavigateToCMS: () => void;
  onNavigateToDetail: (id: string) => void;
}

const GraphPage: React.FC<GraphPageProps> = ({ 
  nodes, 
  links, 
  categories, 
  theme, 
  isDarkMode, 
  onAddNode, 
  onUpdateNode, 
  onDeleteNode, 
  onAddLink, 
  onUpdateLink, 
  onDeleteLink, 
  onToggleTheme, 
  onResetData, 
  onNavigateToCMS, 
  onNavigateToDetail 
}) => {
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
  
  const graphRef = useRef<GraphViewHandle>(null);
  const kanbanRef = useRef<KanbanViewHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 视口尺寸
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  React.useEffect(() => {
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

  // 当关联关系变化时，自动定位到当前选中节点
  React.useEffect(() => {
    if (selectedNode && viewMode === 'graph' && graphRef.current) {
      // 延迟执行，确保simulation有足够时间更新节点位置
      const timer = setTimeout(() => {
        graphRef.current?.centerNode(selectedNode.id);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [links, selectedNode, viewMode]);

  return (
    <div className="w-full h-full relative" ref={containerRef} onClick={() => setShowSearchDropdown(false)}>
      
      {/* 视图内容 */}
      <div className="absolute inset-0 z-0">
          {viewMode === 'graph' ? (
            viewport.width > 0 && (
              <GraphView 
                ref={graphRef}
                nodes={nodes}
                links={links} 
                onNodeClick={handleNodeClick}
                onBackgroundClick={handleBackgroundClick}
                width={viewport.width}
                height={viewport.height}
                selectedNodeId={selectedNode?.id}
                hoveredNodeId={hoveredNodeId}
                setHoveredNodeId={setHoveredNodeId}
                onZoomChange={setZoomLevel}
                isDarkMode={isDarkMode}
                onNodeDrop={handleNodeDrop}
                pendingLinkTargetId={previewConnectionId || pendingLinkTarget?.id}
              />
            )
          ) : (
            <div className="w-full h-full pt-20 pb-20">
              <KanbanView 
                ref={kanbanRef}
                nodes={nodes}
                onNodeSelect={handleNodeClick}
                onNodeUpdate={onUpdateNode}
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

      {/* 右上角：搜索与 CMS 入口 */}
      <div className="absolute top-6 right-6 z-10 flex flex-col sm:flex-row gap-3 items-end pointer-events-none">
          
          {/* CMS 入口按钮 */}
          <button
            onClick={onNavigateToCMS}
            className="pointer-events-auto h-[42px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold transition-transform hover:scale-105"
            title="进入内容管理系统 (CMS)"
          >
             <Database className="w-4 h-4" /> CMS
          </button>

          {/* 搜索框 */}
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
                    onFocus={() => setShowSearchDropdown(true)}
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
                       const style = CATEGORY_STYLES[node.category] || CATEGORY_STYLES['其他'];
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
             <button onClick={onToggleTheme} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">{theme === 'light' ? <Sun className="w-4 h-4" /> : theme === 'dark' ? <Moon className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}</button>
             <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
             <button onClick={onResetData} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600"><Database className="w-4 h-4" /></button>
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
              onAddNode={onAddNode}
              onUpdateNode={onUpdateNode}
              onDeleteNode={onDeleteNode}
              onAddLink={onAddLink}
              onUpdateLink={onUpdateLink}
              onDeleteLink={onDeleteLink}
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
              onOpenDetailView={() => selectedNode && onNavigateToDetail(selectedNode.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphPage;
