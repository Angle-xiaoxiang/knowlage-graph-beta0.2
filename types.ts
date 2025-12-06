

export enum RelationType {
  BELONGS_TO = 'BELONGS_TO',
  CONTAINS = 'CONTAINS',
  RELATED_TO = 'RELATED_TO',
  SIMILAR_TO = 'SIMILAR_TO',
  HOMONYM = 'HOMONYM' // 新增：同名关系
}

export const RELATION_LABELS: Record<RelationType, string> = {
  [RelationType.BELONGS_TO]: '属于',
  [RelationType.CONTAINS]: '包含',
  [RelationType.RELATED_TO]: '关联',
  [RelationType.SIMILAR_TO]: '相似',
  [RelationType.HOMONYM]: '同名'
};

// 分类类型定义
export interface Category {
  id: number;
  name: string;
  description?: string;
}

// 下拉菜单的预定义分类
export const CATEGORIES = [
  '概念', '科学', '技术', '人物', '地点', '组织', '事件', '艺术', '历史', '自然', '社会', '物品', '其他'
];

// 定义分类的视觉样式：
// fill: 节点的柔和背景色
// stroke: 边框和指示器的深色强调色
export const CATEGORY_STYLES: Record<string, { fill: string; stroke: string }> = {
  '概念': { fill: '#f1f5f9', stroke: '#475569' }, // 板岩灰
  '科学': { fill: '#dbeafe', stroke: '#2563eb' }, // 蓝色
  '技术': { fill: '#e0e7ff', stroke: '#4f46e5' }, // 靛青
  '人物': { fill: '#ffedd5', stroke: '#ea580c' }, // 橙色
  '地点': { fill: '#dcfce7', stroke: '#16a34a' }, // 绿色
  '组织': { fill: '#f3e8ff', stroke: '#9333ea' }, // 紫色
  '事件': { fill: '#ffe4e6', stroke: '#e11d48' }, // 玫瑰红
  '艺术': { fill: '#fce7f3', stroke: '#db2777' }, // 粉色
  '历史': { fill: '#fef9c3', stroke: '#ca8a04' }, // 黄色
  '自然': { fill: '#ccfbf1', stroke: '#0d9488' }, // 蓝绿色
  '社会': { fill: '#e0f2fe', stroke: '#0284c7' }, // 天蓝
  '物品': { fill: '#ecfccb', stroke: '#65a30d' }, // 青柠色
  '其他': { fill: '#f3f4f6', stroke: '#6b7280' }  // 灰色
};

export interface EntryModule {
  id: string;
  title: string;
  content: string;
}

export interface Entry {
  id: string;
  title: string;
  category: number;
  description: string;
  tags: string[];
  status: number; // 0: 未启用, 1: 启用
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  modules?: EntryModule[];
}

export interface Relationship {
  id: string;
  source: string | Entry; // D3 会将其突变为对象，但我们要先存储 ID
  target: string | Entry;
  type: string; // 使用字符串类型，接受任何关系类型值
  weight: number; // 1 到 10，10 代表最强
}

export interface GraphData {
  nodes: Entry[];
  links: Relationship[];
}

export interface AIResponse {
  title?: string;
  description?: string;
  category?: string;
  suggestedRelations?: {
    targetTitle: string; // 我们将其匹配到现有节点
    type: RelationType;
    reason: string;
  }[];
}