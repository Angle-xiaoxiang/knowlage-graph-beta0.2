import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 配置CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 处理OPTIONS请求
app.options('*', cors());

// 解析JSON请求
app.use(express.json());

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'buji_land',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 测试数据库连接
const testConnection = async () => {
  try {
    console.log('🔍 Testing database connection with config:', {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD ? '******' : 'empty',
      database: process.env.DB_NAME || 'buji_land',
      port: parseInt(process.env.DB_PORT || '3306')
    });
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // 不退出进程，让服务器继续运行
    console.log('⚠️  Server will continue running without database connection');
  }
};

testConnection();

// 定义API接口

// 获取所有百科条目
app.get('/api/entries', async (req, res) => {
  try {
    // 先获取所有分类，用于后续映射
    const [categories] = await pool.execute(
      'SELECT id, name FROM buji_land_baike_categories'
    );
    const categoryMap = new Map((categories as any[]).map(cat => [cat.id, cat.name]));
    
    const [rows] = await pool.execute(
      'SELECT id, term AS title, disambiguation AS description, label_ids AS category FROM buji_land_baike WHERE is_deleted = 0'
    );
    
    // 处理数据格式
    const entries = (rows as any[]).map(entry => ({
      ...entry,
      id: entry.id?.toString() || '',
      tags: [], // 暂时为空，根据用户要求不使用tags字段
      category: parseInt(entry.category) || 0 // 使用label_ids作为分类ID
    }));
    
    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// 获取所有分类
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM buji_land_baike_categories WHERE is_deleted = 0 ORDER BY id'
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// 获取所有关联关系
app.get('/api/relationships', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, source_entry_id AS source, target_entry_id AS target, relation_type AS type, weight FROM buji_land_baike_entry_relations'
    );
    
    // 定义关系类型映射
    const relationTypeMap: Record<number, string> = {
      1: 'BELONGS_TO',
      2: 'CONTAINS',
      3: 'RELATED_TO',
      4: 'SIMILAR_TO',
      5: 'HOMONYM'
    };
    
    // 转换关系类型
    const processedRows = (rows as any[]).map(row => ({
      ...row,
      source: row.source?.toString() || '',
      target: row.target?.toString() || '',
      type: relationTypeMap[row.type] || 'RELATED_TO' // 将整数类型转换为字符串枚举值
    }));
    
    res.json(processedRows);
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});

// 获取完整的图谱数据
app.get('/api/graph-data', async (req, res) => {
  try {
    // 先获取所有分类，用于后续映射
    const [categories] = await pool.execute(
      'SELECT id, name FROM buji_land_baike_categories'
    );
    const categoryMap = new Map((categories as any[]).map(cat => [cat.id, cat.name]));
    
    // 获取所有条目，根据用户要求使用指定字段
    const [entries] = await pool.execute(
      'SELECT id, term AS title, disambiguation AS description, label_ids AS category FROM buji_land_baike WHERE is_deleted = 0'
    );
    
    // 获取所有关联关系
    const [relationships] = await pool.execute(
      'SELECT id, source_entry_id, target_entry_id, relation_type AS type, weight FROM buji_land_baike_entry_relations'
    );
    
    // 处理数据格式
    const processedEntries = (entries as any[]).map(entry => ({
      ...entry,
      id: entry.id?.toString() || '',
      title: entry.title || '无标题',
      description: entry.description || '', // 确保description是字符串，不为null
      tags: [], // 暂时为空，根据用户要求不使用tags字段
      category: parseInt(entry.category) || 0 // 使用label_ids作为分类ID
    }));
    
    // 创建节点ID集合，用于验证连线的有效性
    const nodeIds = new Set(processedEntries.map(entry => entry.id));
    
    // 定义关系类型映射
    const relationTypeMap: Record<number, string> = {
      1: 'BELONGS_TO',
      2: 'CONTAINS',
      3: 'RELATED_TO',
      4: 'SIMILAR_TO',
      5: 'HOMONYM'
    };

    // 过滤掉无效的关联关系，并处理空值
    const processedRelationships = (relationships as any[])
      .filter(rel => rel.source_entry_id && rel.target_entry_id) // 过滤掉缺少必要字段的记录
      .map(rel => ({
        ...rel,
        id: rel.id?.toString() || '',
        source: rel.source_entry_id?.toString() || '',
        target: rel.target_entry_id?.toString() || '',
        type: relationTypeMap[rel.type] || 'RELATED_TO' // 将整数类型转换为字符串枚举值
      }))
      .filter(rel => nodeIds.has(rel.source) && nodeIds.has(rel.target)); // 过滤掉连接不存在节点的连线
    
    res.json({
      nodes: processedEntries,
      links: processedRelationships
    });
  } catch (error) {
    console.error('Error fetching graph data:', error);
    res.status(500).json({ error: 'Failed to fetch graph data' });
  }
});

// 添加新条目
app.post('/api/entries', async (req, res) => {
  try {
    const { title, description, tags, category } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO buji_land_baike (term, disambiguation, label_ids, status) VALUES (?, ?, ?, 0)',
      [title, description, category]
    );
    
    res.json({ id: (result as any).insertId, title, description, tags, category });
  } catch (error) {
    console.error('Error adding entry:', error);
    res.status(500).json({ error: 'Failed to add entry' });
  }
});

// 添加新关联关系
app.post('/api/relationships', async (req, res) => {
  try {
    const { source, target, type, weight } = req.body;
    
    // 将source和target转换为整数，因为数据库中的source_entry_id和target_entry_id列是整数类型
    const sourceId = parseInt(source);
    const targetId = parseInt(target);
    
    // 将relation_type转换为整数，因为数据库中的relation_type列是整数类型
    // 这里我们需要根据实际情况将字符串类型的relation_type转换为对应的整数值
    // 例如：BELONGS_TO -> 1, CONTAINS -> 2, RELATED_TO -> 3, SIMILAR_TO -> 4, HOMONYM -> 5
    let relationType = 3; // 默认值为3，表示RELATED_TO
    switch (type) {
      case 'BELONGS_TO':
        relationType = 1;
        break;
      case 'CONTAINS':
        relationType = 2;
        break;
      case 'RELATED_TO':
        relationType = 3;
        break;
      case 'SIMILAR_TO':
        relationType = 4;
        break;
      case 'HOMONYM':
        relationType = 5;
        break;
      default:
        relationType = 3;
    }
    
    // 插入原始关系
    const [result] = await pool.execute(
      'INSERT INTO buji_land_baike_entry_relations (source_entry_id, target_entry_id, relation_type, weight) VALUES (?, ?, ?, ?)',
      [sourceId, targetId, relationType, weight]
    );
    
    // 插入反向关系
    let reverseRelationType = relationType;
    switch (relationType) {
      case 1: // BELONGS_TO → CONTAINS
        reverseRelationType = 2;
        break;
      case 2: // CONTAINS → BELONGS_TO
        reverseRelationType = 1;
        break;
      // RELATED_TO (3), SIMILAR_TO (4), HOMONYM (5) 反向关系类型相同
      default:
        reverseRelationType = relationType;
    }
    
    await pool.execute(
      'INSERT INTO buji_land_baike_entry_relations (source_entry_id, target_entry_id, relation_type, weight) VALUES (?, ?, ?, ?)',
      [targetId, sourceId, reverseRelationType, weight]
    );
    
    res.json({ id: (result as any).insertId, source, target, type, weight });
  } catch (error) {
    console.error('Error adding relationship:', error);
    res.status(500).json({ error: 'Failed to add relationship' });
  }
});

// 更新条目
app.put('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, category } = req.body;
    
    await pool.execute(
      'UPDATE buji_land_baike SET term = ?, disambiguation = ?, label_ids = ? WHERE id = ?',
      [title, description, category, id]
    );
    
    res.json({ id, title, description, tags, category });
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// 更新关联关系
app.put('/api/relationships/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, weight } = req.body;
    
    // 将relation_type转换为整数
    let relationType = 3;
    switch (type) {
      case 'BELONGS_TO':
        relationType = 1;
        break;
      case 'CONTAINS':
        relationType = 2;
        break;
      case 'RELATED_TO':
        relationType = 3;
        break;
      case 'SIMILAR_TO':
        relationType = 4;
        break;
      case 'HOMONYM':
        relationType = 5;
        break;
      default:
        relationType = 3;
    }
    
    // 更新原始关系
    await pool.execute(
      'UPDATE buji_land_baike_entry_relations SET relation_type = ?, weight = ? WHERE id = ?',
      [relationType, weight, id]
    );
    
    // 获取原始关系的详细信息，用于查找反向关系
    const [originalRelation] = await pool.execute(
      'SELECT source_entry_id, target_entry_id, relation_type FROM buji_land_baike_entry_relations WHERE id = ?',
      [id]
    );
    
    if ((originalRelation as any[]).length > 0) {
      const { source_entry_id, target_entry_id } = (originalRelation as any[])[0];
      
      // 确定反向关系类型
      let reverseRelationType = relationType;
      switch (relationType) {
        case 1: // BELONGS_TO → CONTAINS
          reverseRelationType = 2;
          break;
        case 2: // CONTAINS → BELONGS_TO
          reverseRelationType = 1;
          break;
        default:
          reverseRelationType = relationType;
      }
      
      // 更新反向关系
      await pool.execute(
        'UPDATE buji_land_baike_entry_relations SET relation_type = ?, weight = ? WHERE source_entry_id = ? AND target_entry_id = ?',
        [reverseRelationType, weight, target_entry_id, source_entry_id]
      );
    }
    
    res.json({ id, ...req.body });
  } catch (error) {
    console.error('Error updating relationship:', error);
    res.status(500).json({ error: 'Failed to update relationship' });
  }
});

// 删除条目
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 软删除条目
    await pool.execute('UPDATE buji_land_baike SET is_deleted = 1 WHERE id = ?', [id]);
    
    // 删除相关的关联关系
    await pool.execute(
      'DELETE FROM buji_land_baike_entry_relations WHERE source_entry_id = ? OR target_entry_id = ?',
      [id, id]
    );
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// 删除关联关系
app.delete('/api/relationships/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取原始关系的详细信息，用于查找反向关系
    const [originalRelation] = await pool.execute(
      'SELECT source_entry_id, target_entry_id FROM buji_land_baike_entry_relations WHERE id = ?',
      [id]
    );
    
    if ((originalRelation as any[]).length > 0) {
      const { source_entry_id, target_entry_id } = (originalRelation as any[])[0];
      
      // 删除原始关系
      await pool.execute('DELETE FROM buji_land_baike_entry_relations WHERE id = ?', [id]);
      
      // 删除反向关系
      await pool.execute(
        'DELETE FROM buji_land_baike_entry_relations WHERE source_entry_id = ? AND target_entry_id = ?',
        [target_entry_id, source_entry_id]
      );
    }
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    res.status(500).json({ error: 'Failed to delete relationship' });
  }
});

// 获取AI模型配置
app.get('/api/ai-config', async (req, res) => {
  try {
    // 从环境变量中获取AI模型配置
    const aiConfig = {
      models: [
        // {
        //   type: 'gemini',
        //   name: 'Google Gemini',
        //   apiKey: process.env.GEMINI_API_KEY || '',
        //   defaultModelName: process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash'
        // },
        {
          type: 'doubao',
          name: '豆包大模型',
          apiKey: process.env.DOUBAO_API_KEY || '',
          defaultModelName: process.env.DOUBAO_MODEL_NAME || 'doubao-pro'
        }
      ]
    };
    
    res.json(aiConfig);
  } catch (error) {
    console.error('Error fetching AI config:', error);
    res.status(500).json({ error: 'Failed to fetch AI config' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});
