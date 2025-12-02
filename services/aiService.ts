import { Entry, RelationType } from "../types";
import GeminiService from "./geminiService";
import DoubaoService from "./doubaoService";
import { apiService } from "./apiService";

// 定义AI服务配置接口
interface AIServiceConfig {
  type: "gemini" | "doubao";
  apiKey: string;
  modelName: string;
}

// 定义AI服务接口
interface AIService {
  generateEntryDetails(title: string): Promise<{ description: string; category: string }>;
  suggestRelationships(currentEntry: Entry, allEntries: Entry[]): Promise<{ targetId: string; type: RelationType; reason: string }[]>;
}

// AI服务管理器
class AIServiceManager {
  private currentService: AIService | null = null;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.initService();
  }

  // 初始化AI服务
  private initService(): void {
    switch (this.config.type) {
      case "gemini":
        this.currentService = new GeminiService(this.config.apiKey, this.config.modelName);
        break;
      case "doubao":
        this.currentService = new DoubaoService(this.config.apiKey, this.config.modelName);
        break;
      default:
        this.currentService = null;
    }
  }

  // 更新配置
  updateConfig(config: AIServiceConfig): void {
    this.config = config;
    this.initService();
  }

  // 生成词条详情
  async generateEntryDetails(title: string): Promise<{ description: string; category: string }> {
    if (!this.currentService) {
      throw new Error("AI service not configured");
    }
    return this.currentService.generateEntryDetails(title);
  }

  // 生成关系建议
  async suggestRelationships(
    currentEntry: Entry,
    allEntries: Entry[]
  ): Promise<{ targetId: string; type: RelationType; reason: string }[]> {
    if (!this.currentService) {
      return [];
    }
    return this.currentService.suggestRelationships(currentEntry, allEntries);
  }

  // 检查服务是否可用
  isServiceAvailable(): boolean {
    return this.currentService !== null;
  }
}

// 导出单例实例
let aiServiceInstance: AIServiceManager | null = null;

// 初始化AI服务，从后端获取完整配置
export const initAIService = async (modelType: "gemini" | "doubao"): Promise<AIServiceManager> => {
  try {
    // 从后端获取AI配置
    const aiConfig = await apiService.getAIConfig();
    // 找到对应的模型配置
    const modelConfig = aiConfig.models.find(model => model.type === modelType);
    
    if (!modelConfig) {
      throw new Error(`Model ${modelType} not configured`);
    }
    
    // 创建完整的服务配置
    const serviceConfig: AIServiceConfig = {
      type: modelType,
      apiKey: modelConfig.apiKey,
      modelName: modelConfig.defaultModelName
    };
    
    if (!aiServiceInstance) {
      aiServiceInstance = new AIServiceManager(serviceConfig);
    } else {
      aiServiceInstance.updateConfig(serviceConfig);
    }
    
    return aiServiceInstance;
  } catch (error) {
    console.error("Failed to initialize AI service:", error);
    throw error;
  }
};

export const getAIService = (): AIServiceManager => {
  if (!aiServiceInstance) {
    throw new Error("AI service not initialized");
  }
  return aiServiceInstance;
};

export default AIServiceManager;