import { Entry, Relationship, RelationType } from '../types';

// --- 简化的知识图谱数据 --- 10个相关词条

// 主题：计算机科学
const COMPUTER_SCIENCE_DATA = [
  // 1. 计算机科学 (根节点)
  { title: '计算机科学', category: '科学', desc: '研究计算机及其应用的学科。', parent: null },
  
  // 2. 编程语言 (子节点1)
  { title: '编程语言', category: '技术', desc: '用于编写计算机程序的形式语言。', parent: '计算机科学' },
  
  // 3. Python (子节点2)
  { title: 'Python', category: '技术', desc: '一种广泛使用的解释型高级编程语言。', parent: '编程语言' },
  
  // 4. JavaScript (子节点3)
  { title: 'JavaScript', category: '技术', desc: '一种轻量级的编程语言，用于网页交互。', parent: '编程语言' },
  
  // 5. 算法 (子节点4)
  { title: '算法', category: '科学', desc: '解决问题的步骤集合。', parent: '计算机科学' },
  
  // 6. 数据结构 (子节点5)
  { title: '数据结构', category: '科学', desc: '组织和存储数据的方式。', parent: '计算机科学' },
  
  // 7. 数据库 (子节点6)
  { title: '数据库', category: '技术', desc: '存储和管理数据的系统。', parent: '计算机科学' },
  
  // 8. 人工智能 (子节点7)
  { title: '人工智能', category: '技术', desc: '模拟人类智能的技术。', parent: '计算机科学' },
  
  // 9. 机器学习 (子节点8)
  { title: '机器学习', category: '技术', desc: '让计算机从数据中学习的技术。', parent: '人工智能' },
  
  // 10. 深度学习 (子节点9)
  { title: '深度学习', category: '技术', desc: '基于神经网络的机器学习技术。', parent: '机器学习' }
];

// 额外的关系，用于创建更丰富的图谱
const ADDITIONAL_RELATIONSHIPS = [
  ['算法', '数据结构', 'RELATED_TO', '相辅相成'],
  ['Python', '人工智能', 'RELATED_TO', '常用语言'],
  ['JavaScript', '网页开发', 'RELATED_TO', '核心语言'],
  ['数据库', '数据结构', 'RELATED_TO', '基于'],
  ['机器学习', '算法', 'RELATED_TO', '依赖'],
  ['深度学习', '算法', 'RELATED_TO', '基于']
];

// 将数据处理为节点和连线
const generateInitialData = () => {
  let nodes: Entry[] = [];
  let links: Relationship[] = [];
  const createdIds = new Set<string>();

  const addNode = (title: string, category: string, desc: string, parentTitle?: string | null) => {
    // 基于标题的简单确定性 ID 生成
    const id = `n_${title}`;
    if (createdIds.has(id)) return id;

    nodes.push({
      id,
      title,
      category,
      description: desc,
      tags: [category]
    });
    createdIds.add(id);
    return id;
  };

  // 1. 添加主要节点
  COMPUTER_SCIENCE_DATA.forEach(item => {
    const id = addNode(item.title, item.category, item.desc);
    if (item.parent) {
      const parentId = `n_${item.parent}`;
      // 确保父节点存在
      if (createdIds.has(parentId)) {
        links.push({
          id: `l_${parentId}_${id}`,
          source: parentId,
          target: id,
          type: RelationType.CONTAINS,
          weight: 8
        });
        // 互逆关系
        links.push({
          id: `l_${id}_${parentId}`,
          source: id,
          target: parentId,
          type: RelationType.BELONGS_TO,
          weight: 8
        });
      }
    }
  });

  // 2. 添加在关系中发现的额外节点
  ADDITIONAL_RELATIONSHIPS.forEach(([src, tgt]) => {
    if (!createdIds.has(`n_${src}`)) addNode(src, '其他', '补充节点', null);
    if (!createdIds.has(`n_${tgt}`)) addNode(tgt, '其他', '补充节点', null);
  });

  // 3. 添加额外关系
  ADDITIONAL_RELATIONSHIPS.forEach(([src, tgt, type, reason], idx) => {
    const sId = `n_${src}`;
    const tId = `n_${tgt}`;
    const rType = RelationType[type as keyof typeof RelationType];
    
    links.push({
      id: `l_ext_${idx}`,
      source: sId,
      target: tId,
      type: rType,
      weight: 6
    });

    // 互逆逻辑
    let recType = RelationType.RELATED_TO;
    if (rType === RelationType.SIMILAR_TO) recType = RelationType.SIMILAR_TO;
    if (rType === RelationType.HOMONYM) recType = RelationType.HOMONYM;
    if (rType === RelationType.RELATED_TO) recType = RelationType.RELATED_TO;
    if (rType === RelationType.BELONGS_TO) recType = RelationType.CONTAINS;
    if (rType === RelationType.CONTAINS) recType = RelationType.BELONGS_TO;

    links.push({
      id: `l_ext_${idx}_r`,
      source: tId,
      target: sId,
      type: recType,
      weight: 6
    });
  });

  return { nodes, links };
};

// 执行生成并导出
const { nodes: seedNodes, links: seedLinks } = generateInitialData();

export { seedNodes, seedLinks };