import { Entry, Relationship, GraphData } from '../types';

// AI模型配置类型定义
export interface AIServiceConfig {
  type: 'gemini' | 'doubao';
  name: string;
  apiKey: string;
  defaultModelName: string;
}

export interface AIConfig {
  models: AIServiceConfig[];
}

// API基础URL
const API_BASE_URL = '/api';

// 通用请求处理函数
const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    const fullUrl = `${API_BASE_URL}${url}`;
    console.log(`正在请求API: ${fullUrl}`);
    
    // 添加更详细的请求日志
    console.log(`请求选项:`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body
    });
    
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    console.log(`API响应状态: ${response.status}`);
    console.log(`响应头:`, response.headers);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API错误响应数据:`, errorData);
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }

    const data = await response.json();
    console.log(`API响应数据长度:`, JSON.stringify(data).length);
    console.log(`API响应数据结构:`, {
      nodes: data.nodes?.length || 0,
      links: data.links?.length || 0
    });
    return data;
  } catch (error) {
    console.error('API请求错误详细信息:', error);
    if (error instanceof Error) {
      console.error('错误名称:', error.name);
      console.error('错误信息:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    throw error;
  }
};

// API服务对象
export const apiService = {
  // 获取所有百科条目
  getAllEntries: async (): Promise<Entry[]> => {
    return request<Entry[]>('/entries');
  },

  // 获取所有分类
  getAllCategories: async (): Promise<Category[]> => {
    return request<Category[]>('/categories');
  },

  // 获取所有关联关系
  getAllRelationships: async (): Promise<Relationship[]> => {
    return request<Relationship[]>('/relationships');
  },

  // 获取完整的图谱数据
  getGraphData: async (): Promise<GraphData> => {
    return request<GraphData>('/graph-data');
  },

  // 添加新条目
  addEntry: async (entry: Omit<Entry, 'id'>): Promise<Entry> => {
    return request<Entry>('/entries', {
      method: 'POST',
      body: JSON.stringify(entry)
    });
  },

  // 添加新关联关系
  addRelationship: async (relationship: Omit<Relationship, 'id'>): Promise<Relationship> => {
    return request<Relationship>('/relationships', {
      method: 'POST',
      body: JSON.stringify(relationship)
    });
  },

  // 更新条目
  updateEntry: async (id: string, entry: Partial<Entry>): Promise<Entry> => {
    return request<Entry>(`/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry)
    });
  },

  // 更新关联关系
  updateRelationship: async (id: string, relationship: Partial<Relationship>): Promise<Relationship> => {
    return request<Relationship>(`/relationships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(relationship)
    });
  },

  // 删除条目
  deleteEntry: async (id: string): Promise<{ success: boolean; id: string }> => {
    return request<{ success: boolean; id: string }>(`/entries/${id}`, {
      method: 'DELETE'
    });
  },

  // 删除关联关系
  deleteRelationship: async (id: string): Promise<{ success: boolean; id: string }> => {
    return request<{ success: boolean; id: string }>(`/relationships/${id}`, {
      method: 'DELETE'
    });
  },

  // 获取AI模型配置
  getAIConfig: async (): Promise<AIConfig> => {
    return request<AIConfig>('/ai-config');
  }
};
