
import { GoogleGenAI, Type } from "@google/genai";
import { Entry, RelationType, CATEGORIES } from "../types";

const apiKey = process.env.API_KEY;
// 确定是否有有效的密钥来实例化。
// 注意：在实际应用中，我们可能会抛出错误或在 UI 中更优雅地处理此问题。
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MODEL_NAME = "gemini-2.5-flash";

export const generateEntryDetails = async (title: string): Promise<{ description: string; category: string }> => {
  if (!ai) throw new Error("API Key not configured");

  // 允许模型从这些分类中选择，或者选择 '其他'
  const categoriesList = CATEGORIES.join(', ');

  const prompt = `
  请为百科词条 "${title}" 生成以下内容：
  1. description: 一段简明扼要的中文消歧义描述（最多50字）。这应该是一句话，用于区分此词条与其他可能同名的概念。
  2. category: 从以下列表中选择最合适的分类：[${categoriesList}]。如果都不合适，请选择 '其他'。

  请直接返回 JSON 格式。
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          category: { type: Type.STRING, enum: CATEGORIES }
        },
        required: ["description", "category"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};

export const suggestRelationships = async (
  currentEntry: Entry,
  allEntries: Entry[]
): Promise<{ targetId: string; type: RelationType; reason: string }[]> => {
  if (!ai) throw new Error("API Key not configured");

  const availableTargets = allEntries
    .filter(e => e.id !== currentEntry.id)
    .map(e => ({ id: e.id, title: e.title }));

  if (availableTargets.length === 0) return [];

  const prompt = `
    请分析源词条与候选词条列表之间的逻辑关系。
    
    源词条: "${currentEntry.title}" - ${currentEntry.description}
    
    候选词条列表:
    ${JSON.stringify(availableTargets)}
    
    请返回一个JSON列表，包含你认为存在的高置信度逻辑关系。
    
    允许的关系类型 (Relation Types) 请使用以下英文枚举值: ${Object.values(RelationType).join(', ')}。
    对应中文含义：
    BELONGS_TO: 属于
    CONTAINS: 包含
    RELATED_TO: 关联
    SIMILAR_TO: 相似
    HOMONYM: 同名 (指名称相同但含义不同的词条)

    reason 字段请用简短的中文解释。
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            targetId: { type: Type.STRING, description: "The exact ID of the candidate entry" },
            type: { type: Type.STRING, enum: Object.values(RelationType) },
            reason: { type: Type.STRING }
          },
          required: ["targetId", "type", "reason"]
        }
      }
    }
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text);
};
