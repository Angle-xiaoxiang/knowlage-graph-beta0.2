
import React, { useEffect, useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { Entry, Relationship, RelationType, RELATION_LABELS, CATEGORY_STYLES } from '../types';

export interface GraphViewHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  centerNode: (nodeId: string) => void;
}

interface GraphViewProps {
  nodes: Entry[];
  links: Relationship[];
  categories: Category[];
  onNodeClick: (node: Entry) => void;
  onBackgroundClick: () => void;
  width: number;
  height: number;
  selectedNodeId?: string;
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
  onZoomChange?: (scale: number) => void;
  isDarkMode: boolean;
  onNodeDrop?: (sourceNode: Entry, targetNode: Entry) => void; // 新增：节点拖拽放置回调
  pendingLinkTargetId?: string; // 新增：用于指示待连接的目标节点 ID
}

const NODE_RADIUS = 20;
const LINK_GAP = 3;

// 源节点的偏移量（连线起点）
// 连线始于 半径 + 间隙
const SOURCE_OFFSET = NODE_RADIUS + LINK_GAP; // 23

// 目标节点的偏移量（连线终点）
// 我们希望箭头的视觉末端（尖端）位于距离节点中心 23px 的位置。
// 箭头长 10px。中心点 (refX) 为 5px。
// 需要设置目标偏移量，以便箭头覆盖连线末端。
const TARGET_OFFSET = 28;

const DEFAULT_NODE_STYLE = CATEGORY_STYLES['其他'];
const PENDING_LINK_COLOR = '#f97316'; // 橙色

const GraphView = forwardRef<GraphViewHandle, GraphViewProps>(({ 
  nodes, 
  links, 
  categories,
  onNodeClick, 
  onBackgroundClick,
  width, 
  height,
  selectedNodeId,
  hoveredNodeId,
  setHoveredNodeId,
  onZoomChange,
  isDarkMode,
  onNodeDrop,
  pendingLinkTargetId
}, ref) => {
  // 创建分类映射，将分类ID映射到分类名称
  const categoryMap = useMemo(() => {
    return new Map(categories.map(cat => [cat.id, cat.name]));
  }, [categories]);
  // 添加调试日志
  console.log('GraphView渲染参数:', {
    nodesCount: nodes.length,
    linksCount: links.length,
    width,
    height,
    selectedNodeId,
    hoveredNodeId
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomGroupRef = useRef<SVGGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  
  const onNodeClickRef = useRef(onNodeClick);
  const onBackgroundClickRef = useRef(onBackgroundClick);
  const setHoveredNodeIdRef = useRef(setHoveredNodeId);
  const onZoomChangeRef = useRef(onZoomChange);
  const onNodeDropRef = useRef(onNodeDrop);
  const pendingLinkTargetIdRef = useRef(pendingLinkTargetId);
  const selectedNodeIdRef = useRef(selectedNodeId);
  
  const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);
  
  // 跟踪先前的节点映射以保留坐标
  const prevNodesRef = useRef<Map<string, any>>(new Map());

  // 定义基于模式的颜色
  const LINK_COLOR_DEFAULT = isDarkMode ? '#334155' : '#cbd5e1';
  const LINK_COLOR_ACTIVE = isDarkMode ? '#94a3b8' : '#64748b';
  const TEXT_COLOR = isDarkMode ? '#f1f5f9' : '#1e293b';
  const TEXT_HALO_COLOR = isDarkMode ? '#020617' : '#f8fafc'; // 背景色作为描边，产生 Halo 效果

  // 当处理程序更改时更新引用
  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
    onBackgroundClickRef.current = onBackgroundClick;
    setHoveredNodeIdRef.current = setHoveredNodeId;
    onZoomChangeRef.current = onZoomChange;
    onNodeDropRef.current = onNodeDrop;
    pendingLinkTargetIdRef.current = pendingLinkTargetId;
    selectedNodeIdRef.current = selectedNodeId;
  }, [onNodeClick, onBackgroundClick, setHoveredNodeId, onZoomChange, onNodeDrop, pendingLinkTargetId, selectedNodeId]);

  // 向父组件暴露缩放控制
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (svgRef.current && zoomBehaviorRef.current) {
        d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.2);
      }
    },
    zoomOut: () => {
      if (svgRef.current && zoomBehaviorRef.current) {
        d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.8);
      }
    },
    resetZoom: () => {
      if (svgRef.current && zoomBehaviorRef.current) {
        d3.select(svgRef.current).transition().duration(750).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
      }
    },
    centerNode: (nodeId: string) => {
      if (!svgRef.current || !zoomBehaviorRef.current || !simulationRef.current) return;
      
      const simulationNodes = simulationRef.current.nodes() as any[];
      const targetNode = simulationNodes.find(n => n.id === nodeId);

      if (targetNode) {
        const svg = d3.select(svgRef.current);
        const currentTransform = d3.zoomTransform(svgRef.current);
        
        // 考虑到侧边栏宽度，将选中节点定位到屏幕中心偏左位置
        const sidebarWidth = 400;
        const visibleWidth = width > 768 ? width - sidebarWidth : width;
        
        // 目标位置：屏幕中心偏左，约占可见宽度的40%位置
        const targetX = visibleWidth * 0.4;
        const targetY = height / 2;
        
        // 保持当前缩放比例，或至少为1.5
        const targetScale = Math.max(currentTransform.k, 1.5); 

        const x = targetX - targetNode.x * targetScale;
        const y = targetY - targetNode.y * targetScale;
        
        const transform = d3.zoomIdentity.translate(x, y).scale(targetScale);

        svg.transition()
          .duration(1000)
          .ease(d3.easeCubicOut)
          .call(zoomBehaviorRef.current.transform, transform);
      }
    }
  }));

  // 缓存数据准备逻辑并与先前的位置合并
  const graphData = useMemo(() => {
    // 1. 准备节点（保留位置，确保所有节点都有 x/y 坐标）
    const newNodes = nodes.map((d, index) => {
      const prev = prevNodesRef.current.get(d.id);
      if (prev) {
        return { ...d, x: prev.x, y: prev.y, vx: 0, vy: 0 };
      }
      // 为新节点添加均匀分布的初始坐标，避免初始布局拥挤
      const centerX = width / 2;
      const centerY = height / 2;
      
      // 根据节点数量动态调整布局策略
      if (nodes.length <= 1) {
        // 只有一个节点时，放在中心
        return { ...d, x: centerX, y: centerY, vx: 0, vy: 0 };
      } else if (nodes.length <= 5) {
        // 少量节点时，使用较大半径的圆形布局
        const radius = Math.min(width, height) * 0.35;
        const angle = (index / nodes.length) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return { ...d, x, y, vx: 0, vy: 0 };
      } else {
        // 多个节点时，使用带随机扰动的圆形布局，更自然
        const baseRadius = Math.min(width, height) * 0.3;
        // 添加随机半径扰动，范围为基础半径的 ±20%
        const radiusVariation = baseRadius * 0.2;
        const radius = baseRadius + (Math.random() - 0.5) * radiusVariation;
        
        // 均匀分布的角度，添加轻微随机扰动
        const baseAngle = (index / nodes.length) * 2 * Math.PI;
        const angleVariation = 0.1; // 10% 的角度扰动
        const angle = baseAngle + (Math.random() - 0.5) * angleVariation;
        
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return { ...d, x, y, vx: 0, vy: 0 };
      }
    });

    // 2. 准备连线
    const newLinks = links.map(d => ({ ...d }));
    
    return { nodes: newNodes, links: newLinks };
  }, [nodes, links, width, height]);

  // 确保 SVG 元素能够正确渲染
  if (!width || !height) {
    return <div className="w-full h-full flex items-center justify-center text-gray-500">加载中...</div>;
  }

  // 确保选中节点始终保持在屏幕中心偏左的位置
  useEffect(() => {
    if (!selectedNodeId || !svgRef.current || !zoomBehaviorRef.current || !simulationRef.current) return;

    // 稍微延迟以等待侧边栏动画开始，或者确保布局计算完成
    const timer = setTimeout(() => {
      if (!simulationRef.current || !svgRef.current) return;
      const simulationNodes = simulationRef.current.nodes() as any[];
      const targetNode = simulationNodes.find(n => n.id === selectedNodeId);

      if (targetNode) {
        const svg = d3.select(svgRef.current);
        const currentTransform = d3.zoomTransform(svgRef.current);

        // 考虑到侧边栏宽度，将选中节点定位到屏幕中心偏左位置
        const sidebarWidth = 400;
        const visibleWidth = width > 768 ? width - sidebarWidth : width;
        
        // 目标位置：屏幕中心偏左，约占可见宽度的40%位置
        const targetX = visibleWidth * 0.4;
        const targetY = height / 2;
        
        // 保持当前缩放比例，或至少为1.5
        const targetScale = Math.max(currentTransform.k, 1.5);

        // 计算所需的平移值
        const newTx = targetX - targetNode.x * targetScale;
        const newTy = targetY - targetNode.y * targetScale;

        // 平滑过渡到目标位置
        svg.transition()
          .duration(600)
          .ease(d3.easeCubicOut)
          .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(newTx, newTy).scale(targetScale));
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [selectedNodeId, width, height]);

  // 副作用 1：仿真与结构 (只在数据或尺寸变化时运行)
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    // 只有当第一次渲染或重置时清空，这里为了简单，我们每次数据变化重绘
    svg.selectAll("*").remove(); 

    // 直接使用 graphData.nodes 作为仿真数据，因为它已经包含了正确的 x/y 坐标
    // 为下一次渲染更新 prevNodes 映射
    graphData.nodes.forEach(n => {
      if (n.id) prevNodesRef.current.set(n.id, n);
    });

    const zoomGroup = svg.append("g").attr("class", "zoom-group");
    // @ts-ignore
    zoomGroupRef.current = zoomGroup.node();

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
        if (onZoomChangeRef.current) {
          onZoomChangeRef.current(event.transform.k);
        }
      });
    
    zoomBehaviorRef.current = zoom;
    svg.call(zoom);
    
    // 禁用默认的双击缩放
    svg.on("dblclick.zoom", null);

    // 背景点击处理程序
    svg.on("click", (event) => {
      if (event.defaultPrevented) return;
      onBackgroundClickRef.current();
    });

    // 物理仿真
    // 调整了 charge (互斥力) 和 collide (碰撞半径) 以降低排斥，使图谱更紧凑
    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force("link", d3.forceLink(graphData.links)
        .id((d: any) => d.id)
        .distance((d: any) => Math.max(60, 200 - ((d.weight || 1) * 15))) // 稍微缩短距离
        .strength(0.8) // 增加连接强度，使边更稳定
      )
      .force("charge", d3.forceManyBody().strength(-250)) // 降低斥力 (从 -400 到 -250)
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.3)) // 增加中心引力，使新节点更稳定
      .force("collide", d3.forceCollide().radius(30).strength(0.8)); // 增加碰撞强度，防止节点重叠
    
    simulationRef.current = simulation;

    // 标记定义 (Arrows)
    const defs = svg.append("defs");
    
    defs.append("marker")
      .attr("id", "arrow-active")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 5) 
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("class", "arrow-path"); 

    // --- 渲染层级控制 (DOM 顺序决定层级：后添加的在上层) ---

    // 1. 连线组 (Layer 1 - 最底层)
    const linkGroup = zoomGroup.append("g").attr("class", "links-group");
    
    const linkLines = linkGroup
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("class", "graph-link")
      .attr("stroke-width", 1.5);

    // 2. 拖拽和预览连接线 (Layer 2 - 在连线之上，但在节点之下)
    // 之前拖拽线在节点之上，现在移到节点之下，以避免遮挡节点文字
    const dragLine = zoomGroup.append("line")
      .attr("class", "drag-indicator")
      .attr("stroke", PENDING_LINK_COLOR) // 橙色
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6, 4") // 虚线效果
      .attr("opacity", 0) // 默认隐藏
      .attr("pointer-events", "none");

    const connectionLine = zoomGroup.append("line")
      .attr("class", "connection-indicator")
      .attr("stroke", PENDING_LINK_COLOR) // 橙色
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "6, 4") // 更密集的虚线
      .attr("opacity", 0)
      .attr("pointer-events", "none");

    // 3. 连线标签组 (Layer 3)
    const labelGroup = zoomGroup.append("g").attr("class", "labels-group");

    const linkLabels = labelGroup
      .selectAll("text")
      .data(graphData.links)
      .join("text")
      .attr("class", "graph-label")
      .text((d: any) => RELATION_LABELS[d.type as RelationType] || d.type) // 当关系类型不在枚举中时，直接使用关系类型字符串
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle") 
      .attr("font-size", "10px")
      .style("pointer-events", "none")
      .style("paint-order", "stroke")
      .style("stroke-width", "3px")
      .style("stroke-linecap", "butt")
      .style("stroke-linejoin", "miter");

    // 4. 节点组 (Layer 4 - 最顶层)
    const nodeGroup = zoomGroup.append("g").attr("class", "nodes-group")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .attr("class", "graph-node")
      .attr("cursor", "pointer")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // 事件监听器
    nodeGroup
      .on("click", (event, d) => {
        if (event.defaultPrevented) return;
        event.stopPropagation(); 
        const originalNode = nodes.find(n => n.id === d.id);
        if (originalNode) {
          onNodeClickRef.current(originalNode);
        }
      })
      .on("mouseover", (event, d) => {
        setHoveredNodeIdRef.current(d.id);
      })
      .on("mouseout", () => {
        setHoveredNodeIdRef.current(null);
      });

    // 圆圈 - 外部圆环（已启用状态显示）
    const outerCircles = nodeGroup.append("circle")
      .attr("r", NODE_RADIUS)
      .attr("fill", "transparent")
      .transition()
      .duration(300);

    // 圆圈 - 内部填充圆
    const innerCircles = nodeGroup.append("circle")
      .attr("r", NODE_RADIUS - 4)
      .transition()
      .duration(300);

    // 节点文本标签
    nodeGroup.append("text")
      .attr("class", "node-text")
      .text(d => d.title)
      .attr("x", 0)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .style("pointer-events", "none")
      .style("font-weight", "500")
      .each(function(d) {
        if (d.title.length > 15) {
           d3.select(this).text(d.title.substring(0, 12) + "...");
        }
      });

    simulation.on("tick", () => {
      // 更新连线位置
      linkLines
        .attr("x1", (d: any) => {
           const dx = d.target.x - d.source.x;
           const dy = d.target.y - d.source.y;
           const dist = Math.sqrt(dx * dx + dy * dy) || 1;
           const ux = dx / dist;
           return d.source.x + (ux * SOURCE_OFFSET);
        })
        .attr("y1", (d: any) => {
           const dx = d.target.x - d.source.x;
           const dy = d.target.y - d.source.y;
           const dist = Math.sqrt(dx * dx + dy * dy) || 1;
           const uy = dy / dist;
           return d.source.y + (uy * SOURCE_OFFSET);
        })
        .attr("x2", (d: any) => {
           const dx = d.target.x - d.source.x;
           const dy = d.target.y - d.source.y;
           const dist = Math.sqrt(dx * dx + dy * dy) || 1;
           const ux = dx / dist;
           return d.target.x - (ux * TARGET_OFFSET);
        })
        .attr("y2", (d: any) => {
           const dx = d.target.x - d.source.x;
           const dy = d.target.y - d.source.y;
           const dist = Math.sqrt(dx * dx + dy * dy) || 1;
           const uy = dy / dist;
           return d.target.y - (uy * TARGET_OFFSET);
        });

      // 更新标签位置
      linkLabels
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      // 更新节点位置
      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      
      // 更新待连接指示线位置 (Tick 中更新，用于动画过程)
      const pId = pendingLinkTargetIdRef.current;
      const sId = selectedNodeIdRef.current;
      
      if (pId && sId) {
        const simNodes = simulationRef.current?.nodes() as any[];
        const sourceNode = simNodes?.find(n => n.id === sId);
        const targetNode = simNodes?.find(n => n.id === pId);

        if (sourceNode && targetNode) {
          connectionLine
            .attr("x1", sourceNode.x)
            .attr("y1", sourceNode.y)
            .attr("x2", targetNode.x)
            .attr("y2", targetNode.y)
            .attr("opacity", 1);
        } else {
          connectionLine.attr("opacity", 0);
        }
      } else {
        connectionLine.attr("opacity", 0);
      }
        
      // 保存仿真中所有节点的位置，而不是 graphData.nodes
      const simNodes = simulationRef.current?.nodes() as any[];
      simNodes.forEach(n => {
        if(n.id) prevNodesRef.current.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy });
      });
    });

    // 拖拽逻辑相关变量
    let potentialTargetId: string | null = null;

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      potentialTargetId = null;
      dragLine.attr("opacity", 0); // 确保开始时隐藏虚线

      // 优化：拖拽时完全移除全局碰撞力，允许节点自由重叠
      simulation.force("collide", null);
      
      // 被拖拽节点不产生排斥力
      // 注意：这里需要与全局 charge 值保持一致（未选中时为 -250，选中为 0）
      simulation.force("charge", d3.forceManyBody().strength((n: any) => {
        return n.id === d.id ? 0 : -250;
      }));
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;

      // 碰撞检测逻辑保持不变
      const simNodes = simulationRef.current?.nodes() as any[];
      let foundTarget: any = null;
      let minDistance = Infinity;
      const SNAP_DISTANCE = 50; // 检测距离

      if (simNodes) {
        simNodes.forEach(node => {
          if (node.id === d.id) return; 
          
          const dx = event.x - node.x;
          const dy = event.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < SNAP_DISTANCE && dist < minDistance) {
            minDistance = dist;
            foundTarget = node;
          }
        });
      }

      // 如果找到目标，绘制虚线
      if (foundTarget) {
        potentialTargetId = foundTarget.id;
        dragLine
          .attr("x1", event.x)
          .attr("y1", event.y)
          .attr("x2", foundTarget.x)
          .attr("y2", foundTarget.y)
          .attr("opacity", 1);
      } else {
        potentialTargetId = null;
        dragLine.attr("opacity", 0);
      }
      
      // 更新高亮样式 (拖拽时的实时反馈)
      svg.selectAll("circle")
        .attr("stroke-width", (n: any) => {
          if (n.id === potentialTargetId) return 5;
          if (n.id === selectedNodeId || n.id === hoveredNodeId) return 3;
          return 2;
        })
        .attr("stroke-opacity", (n: any) => {
           if (n.id === potentialTargetId) return 0.5;
           return 1;
        });
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      
      dragLine.attr("opacity", 0); // 拖拽结束隐藏虚线

      // 拖拽结束：恢复所有物理力
      simulation.force("collide", d3.forceCollide().radius(30)); // 恢复半径 30
      simulation.force("charge", d3.forceManyBody().strength(-250)); // 恢复斥力 -250

      // 如果放置在有效目标上
      if (potentialTargetId && onNodeDropRef.current) {
         const targetNode = nodes.find(n => n.id === potentialTargetId);
         const sourceNode = nodes.find(n => n.id === d.id);
         if (sourceNode && targetNode) {
            onNodeDropRef.current(sourceNode, targetNode);
         }
      }

      potentialTargetId = null;
      
      // 轻微重启仿真以消除重叠
      simulation.alpha(0.1).restart();
    }

    return () => {
      simulation.stop();
    };
  }, [graphData, width, height]); 

  // 副作用 2：样式更新 (响应 isDarkMode、选中、悬停、待连接状态)
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const connectedNodeIds = new Set<string>();
    if (selectedNodeId) {
      connectedNodeIds.add(selectedNodeId);
      graphData.links.forEach((l: any) => {
        if (l.source.id === selectedNodeId) connectedNodeIds.add(l.target.id);
        if (l.target.id === selectedNodeId) connectedNodeIds.add(l.source.id);
      });
    }

    // 更新虚线指示器颜色 (确保总是橙色)
    svg.select(".drag-indicator").attr("stroke", PENDING_LINK_COLOR);
    svg.select(".connection-indicator").attr("stroke", PENDING_LINK_COLOR);

    // 1. 更新箭头颜色
    svg.select("#arrow-active path")
       .attr("fill", LINK_COLOR_ACTIVE);

    // 2. 更新连线
    svg.selectAll(".graph-link")
      .sort((a: any, b: any) => {
        const isAActive = selectedNodeId && a.source.id === selectedNodeId;
        const isBActive = selectedNodeId && b.source.id === selectedNodeId;
        if (isAActive && !isBActive) return 1;
        if (!isAActive && isBActive) return -1;
        return 0;
      })
      .transition().duration(300)
      .attr("opacity", (d: any) => {
        if (selectedNodeId) {
          if (d.source.id === selectedNodeId || d.target.id === selectedNodeId) return 1;
          return 0.1; 
        }
        return 1;
      })
      .attr("stroke", (d: any) => {
        if (selectedNodeId && d.source.id === selectedNodeId) return LINK_COLOR_ACTIVE;
        return LINK_COLOR_DEFAULT;
      })
      .attr("marker-end", (d: any) => {
        if (selectedNodeId && d.source.id === selectedNodeId) {
           return "url(#arrow-active)";
        }
        return null; 
      });

    // 3. 更新标签
    svg.selectAll(".graph-label")
      .attr("opacity", (d: any) => {
        if (selectedNodeId && d.source.id === selectedNodeId) return 1;
        return 0; 
      })
      .attr("fill", LINK_COLOR_ACTIVE)
      .style("stroke", TEXT_HALO_COLOR); 

    // 4. 更新节点文字
    svg.selectAll(".node-text")
       .attr("fill", TEXT_COLOR);

    // 5. 更新节点
    svg.selectAll(".graph-node")
      .transition()
      .duration(300)
      .attr("opacity", (d: any) => {
         if (!selectedNodeId) return 1;
         // 如果有 pendingLinkTargetId，也确保它不透明
         if (pendingLinkTargetId && d.id === pendingLinkTargetId) return 1;
         return connectedNodeIds.has(d.id) ? 1 : 0.5;
      });

    // 5.1 更新外部圆环样式（已启用状态显示）
    svg.selectAll(".graph-node circle:nth-of-type(1)")
      .attr("fill", (d: any) => {
         // 外部圆环始终为透明，只显示边框
         return "transparent";
      })
      .attr("stroke", (d: any) => {
         const categoryName = categoryMap.get(d.category) || '其他';
         const style = CATEGORY_STYLES[categoryName] || DEFAULT_NODE_STYLE;
         return style.stroke;
      })
      .attr("stroke-width", (d: any) => {
         // 根据状态调整外环宽度
         if (d.status === 1) {
           // 已启用节点：粗外环
           if (d.id === selectedNodeId || d.id === pendingLinkTargetId) return 5;
           if (d.id === hoveredNodeId) return 4;
           return 3;
         } else {
           // 未启用节点：细外环
           if (d.id === selectedNodeId || d.id === pendingLinkTargetId) return 4;
           if (d.id === hoveredNodeId) return 3;
           return 2;
         }
      })
      .attr("stroke-opacity", (d: any) => {
         if (d.id === pendingLinkTargetId) return 0.5; // 待连接目标：半透明描边，区分起点
         return 1;
      })
      .attr("stroke-dasharray", null) // 确保节点外环移除虚线
      .attr("r", (d: any) => {
         if (d.id === selectedNodeId || d.id === hoveredNodeId || d.id === pendingLinkTargetId) return 22;
         return NODE_RADIUS;
      });

    // 5.2 更新内部填充圆样式
    svg.selectAll(".graph-node circle:nth-of-type(2)")
      .attr("fill", (d: any) => {
         const categoryName = categoryMap.get(d.category) || '其他';
         const style = CATEGORY_STYLES[categoryName] || DEFAULT_NODE_STYLE;
         return style.fill;
      })
      .attr("stroke", "none") // 内部圆不需要边框
      .attr("r", (d: any) => {
         const baseRadius = d.status === 1 ? NODE_RADIUS - 4 : NODE_RADIUS;
         if (d.id === selectedNodeId || d.id === hoveredNodeId || d.id === pendingLinkTargetId) {
           return baseRadius + 2; // 选中/悬停/待连接时放大
         }
         return baseRadius;
      });

    // 手动更新连接线 (connectionLine) 的位置
    // 这确保了即使仿真已停止（tick 不再触发），当 pendingLinkTargetId 变化时，连线依然能立即更新到正确位置
    if (pendingLinkTargetId && selectedNodeId) {
       // 从仿真节点中获取正确的 x/y 坐标
       const simNodes = simulationRef.current?.nodes() as any[];
       const sourceNode = simNodes?.find(n => n.id === selectedNodeId);
       const targetNode = simNodes?.find(n => n.id === pendingLinkTargetId);

       if (sourceNode && targetNode && sourceNode.x != null && targetNode.x != null) {
          svg.select(".connection-indicator")
             .attr("x1", sourceNode.x)
             .attr("y1", sourceNode.y)
             .attr("x2", targetNode.x)
             .attr("y2", targetNode.y)
             .attr("opacity", 1);
       }
    } else {
       svg.select(".connection-indicator").attr("opacity", 0);
    }

  }, [selectedNodeId, hoveredNodeId, graphData, isDarkMode, pendingLinkTargetId]); 

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height} 
      className="bg-slate-50 dark:bg-slate-950 touch-none block w-full h-full transition-colors duration-300"
    />
  );
});

GraphView.displayName = 'GraphView';

export default GraphView;
