import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { Entry, Relationship } from '../types';

// 加载环境变量
dotenv.config();

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'buji_land',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 初始化数据库表
const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // 创建节点表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS nodes (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        description TEXT,
        tags JSON,
        modules JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 创建关系表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS links (
        id VARCHAR(255) PRIMARY KEY,
        source VARCHAR(255) NOT NULL,
        target VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        weight INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (source) REFERENCES nodes(id) ON DELETE CASCADE,
        FOREIGN KEY (target) REFERENCES nodes(id) ON DELETE CASCADE
      )
    `);
    
    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// 获取所有节点
const getAllNodes = async (): Promise<Entry[]> => {
  try {
    const [rows] = await pool.execute('SELECT * FROM nodes');
    return rows as Entry[];
  } catch (error) {
    console.error('Error getting all nodes:', error);
    throw error;
  }
};

// 获取所有关系
const getAllLinks = async (): Promise<Relationship[]> => {
  try {
    const [rows] = await pool.execute('SELECT * FROM links');
    return rows as Relationship[];
  } catch (error) {
    console.error('Error getting all links:', error);
    throw error;
  }
};

// 添加节点
const addNode = async (node: Entry): Promise<void> => {
  try {
    await pool.execute(
      'INSERT INTO nodes (id, title, category, description, tags, modules) VALUES (?, ?, ?, ?, ?, ?)',
      [node.id, node.title, node.category, node.description, JSON.stringify(node.tags), JSON.stringify(node.modules)]
    );
  } catch (error) {
    console.error('Error adding node:', error);
    throw error;
  }
};

// 更新节点
const updateNode = async (node: Entry): Promise<void> => {
  try {
    await pool.execute(
      'UPDATE nodes SET title = ?, category = ?, description = ?, tags = ?, modules = ? WHERE id = ?',
      [node.title, node.category, node.description, JSON.stringify(node.tags), JSON.stringify(node.modules), node.id]
    );
  } catch (error) {
    console.error('Error updating node:', error);
    throw error;
  }
};

// 删除节点
const deleteNode = async (id: string): Promise<void> => {
  try {
    await pool.execute('DELETE FROM nodes WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting node:', error);
    throw error;
  }
};

// 添加关系
const addLink = async (link: Relationship): Promise<void> => {
  try {
    await pool.execute(
      'INSERT INTO links (id, source, target, type, weight) VALUES (?, ?, ?, ?, ?)',
      [link.id, link.source, link.target, link.type, link.weight]
    );
  } catch (error) {
    console.error('Error adding link:', error);
    throw error;
  }
};

// 更新关系
const updateLink = async (link: Relationship): Promise<void> => {
  try {
    await pool.execute(
      'UPDATE links SET source = ?, target = ?, type = ?, weight = ? WHERE id = ?',
      [link.source, link.target, link.type, link.weight, link.id]
    );
  } catch (error) {
    console.error('Error updating link:', error);
    throw error;
  }
};

// 删除关系
const deleteLink = async (id: string): Promise<void> => {
  try {
    await pool.execute('DELETE FROM links WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting link:', error);
    throw error;
  }
};

// 从数据库加载数据到本地存储（用于迁移）
const loadDataFromDBToLocalStorage = async () => {
  try {
    const nodes = await getAllNodes();
    const links = await getAllLinks();
    
    localStorage.setItem('bujidao_nodes', JSON.stringify(nodes));
    localStorage.setItem('bujidao_links', JSON.stringify(links));
    
    console.log('Data loaded from database to localStorage');
  } catch (error) {
    console.error('Error loading data from database to localStorage:', error);
    throw error;
  }
};

// 从本地存储迁移数据到数据库
const migrateDataFromLocalStorageToDB = async () => {
  try {
    // 从本地存储获取数据
    const nodesJson = localStorage.getItem('bujidao_nodes');
    const linksJson = localStorage.getItem('bujidao_links');
    
    if (!nodesJson || !linksJson) {
      console.log('No data in localStorage to migrate');
      return;
    }
    
    const nodes: Entry[] = JSON.parse(nodesJson);
    const links: Relationship[] = JSON.parse(linksJson);
    
    // 清空数据库
    await pool.execute('DELETE FROM links');
    await pool.execute('DELETE FROM nodes');
    
    // 插入数据
    for (const node of nodes) {
      await addNode(node);
    }
    
    for (const link of links) {
      await addLink(link);
    }
    
    console.log('Data migrated from localStorage to database');
  } catch (error) {
    console.error('Error migrating data from localStorage to database:', error);
    throw error;
  }
};

export {
  initDatabase,
  getAllNodes,
  getAllLinks,
  addNode,
  updateNode,
  deleteNode,
  addLink,
  updateLink,
  deleteLink,
  loadDataFromDBToLocalStorage,
  migrateDataFromLocalStorageToDB,
  pool
};
