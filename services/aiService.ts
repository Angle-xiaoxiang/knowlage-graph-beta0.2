import { Entry, RelationType } from "../types";
import GeminiService from "./geminiService";
import DoubaoService from "./doubaoService";
import { AIModelConfig } from "../components/Settings";

// 定义AI服务接口
interface AIService {
  generateEntryDetails(title: string): Promise<{ description: string; category: string }>;
  suggestRelationships(currentEntry: Entry, allEntries: Entry[]): Promise<{ targetId: string; type: RelationType; reason: string }[]>;
}

// AI服务管理器
class AIServiceManager {
  private currentService: AIService | null = null;
  private config: AIModelConfig;

  constructor(config: AIModelConfig) {
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
  updateConfig(config: AIModelConfig): void {
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

export const initAIService = (config: AIModelConfig): AIServiceManager => {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIServiceManager(config);
  } else {
    aiServiceInstance.updateConfig(config);
  }
  return aiServiceInstance;
};

export const getAIService = (): AIServiceManager => {
  if (!aiServiceInstance) {
    throw new Error("AI service not initialized");
  }
  return aiServiceInstance;
};

export default AIServiceManager;