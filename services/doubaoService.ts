import { Entry, RelationType, CATEGORIES } from "../types";

interface DoubaoResponse {
  data: {
    choices: {
      message: {
        content: string;
      };
    }[];
  };
}

class DoubaoService {
  private apiKey: string;
  private modelName: string;
  private baseUrl = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

  constructor(apiKey: string, modelName: string) {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  // 调用豆包API
  private async callApi(messages: any[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error("API Key not configured");
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          model: this.modelName,
          messages,
          temperature: 0.3
          // 移除可能不支持的response_format参数
        })
      });

      // 打印完整响应信息用于调试
      const responseText = await response.text();
      console.log("Doubao API Response:", responseText);
      console.log("Response Status:", response.status);
      console.log("Response Headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${responseText}`);
      }

      const data = JSON.parse(responseText);
      
      // 兼容不同的响应格式
      let content: string;
      if (data.data && data.data.choices && data.data.choices.length > 0) {
        // 格式1: { data: { choices: [{ message: { content: string } }] } }
        content = data.data.choices[0].message?.content;
      } else if (data.choices && data.choices.length > 0) {
        // 格式2: { choices: [{ message: { content: string } }] }
        content = data.choices[0].message?.content;
      } else if (data.result) {
        // 格式3: { result: string }
        content = data.result;
      } else {
        throw new Error(`Unexpected response format: ${JSON.stringify(data)}`);
      }

      if (!content) {
        throw new Error(`No content in response: ${JSON.stringify(data)}`);
      }

      return content;
    } catch (error) {
      console.error("Doubao API Error:", error);
      throw error;
    }
  }

  // 生成词条详情
  async generateEntryDetails(title: string): Promise<{ description: string; category: string }> {
    const categoriesList = CATEGORIES.join(', ');

    const messages = [
      {
        role: "system",
        content: "你是一个百科词条生成助手，请严格按照要求生成内容。"
      },
      {
        role: "user",
        content: `
          请为百科词条 "${title}" 生成以下内容：
          1. description: 一段简明扼要的中文消歧义描述（最多50字）。这应该是一句话，用于区分此词条与其他可能同名的概念。
          2. category: 从以下列表中选择最合适的分类：[${categoriesList}]。如果都不合适，请选择 '其他'。

          请直接返回 JSON 格式，不要包含任何其他内容。
        `
      }
    ];

    const responseText = await this.callApi(messages);
    return JSON.parse(responseText);
  }

  // 生成关系建议
  async suggestRelationships(
    currentEntry: Entry,
    allEntries: Entry[]
  ): Promise<{ targetId: string; type: RelationType; reason: string }[]> {
    const availableTargets = allEntries
      .filter(e => e.id !== currentEntry.id)
      .map(e => ({ id: e.id, title: e.title }));

    if (availableTargets.length === 0) return [];

    const messages = [
      {
        role: "system",
        content: "你是一个百科关系分析助手，请严格按照要求生成关系建议。"
      },
      {
        role: "user",
        content: `
          请分析源词条与候选词条列表之间的逻辑关系，注意关系的方向：源词条是主语，目标词条是宾语。
          
          源词条: "${currentEntry.title}" - ${currentEntry.description}
          
          候选词条列表: ${JSON.stringify(availableTargets)}
          
          请返回一个JSON列表，包含最多10条你认为存在的最高置信度逻辑关系。
          
          每个关系对象必须包含以下字段：
          1. targetId: 目标词条的ID（从候选词条列表中获取）
          2. type: 关系类型，使用以下英文枚举值之一: ${Object.values(RelationType).join(', ')}
          3. reason: 简短的中文解释
          
          请严格按照以下规则和定义使用关系类型：
          1. 只推荐直接关系，不推荐间接关系
             - 例如：猫属于哺乳动物，哺乳动物属于动物，只推荐猫和哺乳动物的关系，不推荐猫和动物的关系
          2. 当两个实体有共同上级概念时，不直接关联这两个实体
             - 例如：猫和狗都属于哺乳动物，不推荐猫和狗的关联关系，应该建议创建"哺乳动物"实体
          3. 关系类型定义和方向（源词条是主语，目标词条是宾语）：
             - BELONGS_TO (属于): 源词条属于目标词条，用于更具体的概念属于更一般的概念（例如：猫属于哺乳动物，圆珠笔属于笔）
               结构：[具体概念] 属于 [一般概念]
             - CONTAINS (包含): 源词条包含目标词条，用于更一般的概念包含更具体的概念（例如：哺乳动物包含猫，笔包含圆珠笔）
               结构：[一般概念] 包含 [具体概念]
             - HOMONYM (同名): 源词条与目标词条同名不同义（例如：猫（动物）和猫（调制解调器））
             - SIMILAR_TO (相似): 源词条与目标词条同义不同名，即它们是同一个概念的不同名称，仅当两个词条完全同义时使用（例如：西红柿和番茄，猫和猫咪，土豆和马铃薯）
               注意：
               - 不要将同类别实体（如芹菜和黄瓜都是蔬菜）标记为相似关系
               - 不要将"XX是XX的一种"的关系标记为相似关系
               - 仅当两个词条是同一个概念的不同名称时，才使用相似关系
             - RELATED_TO (关联): 源词条与目标词条有其他一定联系的直接关系（例如：蝌蚪和青蛙）
          
          重要：
          - 对于BELONGS_TO和CONTAINS关系，只需要推荐其中一种关系（根据源词条和目标词条的概念层次选择合适的方向），不需要同时推荐两种
          - 系统会自动创建反向关系，例如：如果推荐"圆珠笔属于笔"，系统会自动创建"笔包含圆珠笔"的反向关系

          请直接返回 JSON 格式，不要包含任何其他内容。
        `
      }
    ];

    const responseText = await this.callApi(messages);
    let rawSuggestions = [];
    try {
      // 尝试直接解析JSON
      rawSuggestions = JSON.parse(responseText);
      console.log("Successfully parsed AI response:", rawSuggestions);
    } catch (error) {
      console.error("Failed to parse AI response directly:", error);
      console.error("Raw response text:", responseText);
      
      try {
        // 尝试提取JSON数组部分（处理可能包含其他内容的响应）
        const jsonMatch = responseText.match(/\[.*\]/s);
        if (jsonMatch) {
          console.log("Extracted JSON part:", jsonMatch[0]);
          rawSuggestions = JSON.parse(jsonMatch[0]);
          console.log("Successfully parsed extracted JSON:", rawSuggestions);
        } else {
          // 尝试提取JSON对象部分
          const objMatch = responseText.match(/\{.*\}/s);
          if (objMatch) {
            console.log("Extracted JSON object part:", objMatch[0]);
            rawSuggestions = [JSON.parse(objMatch[0])];
            console.log("Successfully parsed extracted JSON object:", rawSuggestions);
          } else {
            console.error("Could not extract valid JSON from response");
            return [];
          }
        }
      } catch (error2) {
        console.error("Failed to extract and parse JSON from response:", error2);
        return [];
      }
    }

    // 转换AI返回的格式到我们需要的格式，并处理可能的字段名差异
    return rawSuggestions.map((suggestion: any) => {
        // 处理不同字段名的情况
        const targetValue = suggestion.targetId || suggestion.target;
        const typeValue = suggestion.type || suggestion.relation;
        
        // 如果targetValue是标题而不是ID，尝试通过标题查找对应的ID
        let targetId = targetValue;
        if (targetValue && !allEntries.some(entry => entry.id === targetValue)) {
          // 尝试通过标题查找ID
          const matchingEntry = allEntries.find(entry => entry.title === targetValue);
          if (matchingEntry) {
            targetId = matchingEntry.id;
          }
        }
        
        return {
          targetId: targetId,
          type: typeValue as RelationType,
          reason: suggestion.reason || "AI建议的关联"
        };
      }).filter((suggestion: { targetId: string; type: RelationType }) => {
        // 过滤掉无效的建议
        return suggestion.targetId && 
               Object.values(RelationType).includes(suggestion.type) &&
               allEntries.some(entry => entry.id === suggestion.targetId);
      });
  }
}

export default DoubaoService;