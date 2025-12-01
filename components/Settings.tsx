import React, { useState, useEffect } from 'react';
import { X, Save, ChevronRight, ChevronLeft, Settings as SettingsIcon } from 'lucide-react';

// AI模型类型定义
export type AIModel = 'gemini' | 'doubao';

// AI模型配置接口
export interface AIModelConfig {
  type: AIModel;
  apiKey: string;
  modelName: string;
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIModelConfig;
  onSave: (config: AIModelConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AIModelConfig>(config);
  const [isSaving, setIsSaving] = useState(false);

  // 当外部配置变化时更新本地配置
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // 模型选项
  const modelOptions = [
    { value: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-2.5-flash' },
    { value: 'doubao', label: '豆包大模型', defaultModel: 'doubao-pro' }
  ] as const;

  // 处理模型类型变化
  const handleModelTypeChange = (type: AIModel) => {
    const selectedModel = modelOptions.find(opt => opt.value === type);
    setLocalConfig(prev => ({
      ...prev,
      type,
      modelName: selectedModel?.defaultModel || prev.modelName
    }));
  };

  // 处理保存
  const handleSave = async () => {
    setIsSaving(true);
    try {
      onSave(localConfig);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* AI模型设置 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">AI 大模型设置</h3>
            
            {/* 模型选择 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                选择模型
              </label>
              <div className="grid grid-cols-2 gap-3">
                {modelOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleModelTypeChange(option.value as AIModel)}
                    className={`p-4 rounded-xl border-2 transition-all ${localConfig.type === option.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                  >
                    <div className="font-medium text-slate-900 dark:text-white">{option.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      当前模型: {localConfig.type === option.value ? localConfig.modelName : option.defaultModel}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div className="space-y-2 mt-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                API Key
              </label>
              <input
                type="password"
                value={localConfig.apiKey}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder={`请输入${localConfig.type === 'gemini' ? 'Google Gemini' : '豆包'} API Key`}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {localConfig.type === 'gemini' 
                  ? '获取API Key: https://aistudio.google.com/app/apikey'
                  : '获取API Key: https://console.volcengine.com/ark/'}
              </p>
            </div>

            {/* 模型名称 */}
            <div className="space-y-2 mt-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                模型名称
              </label>
              <input
                type="text"
                value={localConfig.modelName}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, modelName: e.target.value }))}
                placeholder="模型名称"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center gap-2"
          >
            {isSaving ? '保存中...' : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;