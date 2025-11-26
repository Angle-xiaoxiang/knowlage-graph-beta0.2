
import { Entry, Relationship, RelationType } from '../types';

// --- 模拟数据库原始数据 ---

export const CATEGORIES_MAP = {
  '自然': ['动物', '植物', '天气', '地理'],
  '社会': ['职业', '交通', '教育', '经济'],
  '科学': ['物理', '化学', '天文', '生物'],
  '技术': ['数码', '互联网', '家电', '航天'],
  '生活': ['食物', '家居', '节日', '运动'],
  '物品': ['工具', '玩具', '乐器', '衣物'],
  '概念': ['时间', '情感', '色彩', '形状']
};

const RAW_DATA = [
  // --- 自然 ---
  { title: '自然界', category: '科学', desc: '物质世界及其现象的总和。', parent: null },
  { title: '动物', category: '科学', desc: '生物界的一大类，多以有机物为食。', parent: '自然界' },
  { title: '植物', category: '科学', desc: '生物界的一大类，多能进行光合作用。', parent: '自然界' },
  
  // 动物细分
  { title: '哺乳动物', category: '科学', desc: '恒温脊椎动物。', parent: '动物' },
  { title: '猫', category: '自然', desc: '常见的家庭宠物，擅长捕鼠。', parent: '哺乳动物' },
  { title: '狗', category: '自然', desc: '人类忠实的朋友，由狼驯化而来。', parent: '哺乳动物' },
  { title: '大熊猫', category: '自然', desc: '中国的国宝，以竹子为食。', parent: '哺乳动物' },
  { title: '狮子', category: '自然', desc: '草原之王，大型猫科动物。', parent: '哺乳动物' },
  { title: '大象', category: '自然', desc: '陆地上最大的哺乳动物，有长鼻。', parent: '哺乳动物' },
  { title: '长颈鹿', category: '自然', desc: '脖子最长的陆生动物。', parent: '哺乳动物' },
  { title: '鲸鱼', category: '自然', desc: '生活在海洋中的巨大哺乳动物。', parent: '哺乳动物' },
  { title: '海豚', category: '自然', desc: '聪明的海洋哺乳动物。', parent: '哺乳动物' },
  
  { title: '鸟类', category: '科学', desc: '体表被覆羽毛，前肢变成翼。', parent: '动物' },
  { title: '麻雀', category: '自然', desc: '常见的群居小型鸟类。', parent: '鸟类' },
  { title: '老鹰', category: '自然', desc: '视力敏锐的猛禽。', parent: '鸟类' },
  { title: '企鹅', category: '自然', desc: '生活在南极，不会飞但善泳。', parent: '鸟类' },
  { title: '鹦鹉', category: '自然', desc: '色彩斑斓，善于模仿声音。', parent: '鸟类' },

  { title: '昆虫', category: '科学', desc: '节肢动物门中种类最多的一纲。', parent: '动物' },
  { title: '蜜蜂', category: '自然', desc: '采集花粉酿蜜的昆虫。', parent: '昆虫' },
  { title: '蝴蝶', category: '自然', desc: '经过变态发育的美丽昆虫。', parent: '昆虫' },
  { title: '蚂蚁', category: '自然', desc: '具有高度社会性的群居昆虫。', parent: '昆虫' },

  // 植物细分
  { title: '树木', category: '自然', desc: '木本植物的总称。', parent: '植物' },
  { title: '松树', category: '自然', desc: '常绿乔木，耐寒。', parent: '树木' },
  { title: '柳树', category: '自然', desc: '枝条柔顺，常见于水边。', parent: '树木' },
  { title: '苹果树', category: '自然', desc: '结苹果的落叶乔木。', parent: '树木' },
  
  { title: '花卉', category: '自然', desc: '具有观赏价值的草本或木本植物。', parent: '植物' },
  { title: '玫瑰', category: '自然', desc: '象征爱情的花朵。', parent: '花卉' },
  { title: '向日葵', category: '自然', desc: '花盘随太阳转动的植物。', parent: '花卉' },
  { title: '荷花', category: '自然', desc: '生长在水中的美丽花朵。', parent: '花卉' },
  { title: '仙人掌', category: '自然', desc: '耐旱，多刺的沙漠植物。', parent: '植物' },

  // 水果/蔬菜 (生活/自然 交叉)
  { title: '水果', category: '生活', desc: '多汁且有甜味的植物果实。', parent: '植物' },
  { title: '苹果', category: '生活', desc: '常见且营养丰富的红色水果。', parent: '水果' },
  { title: '香蕉', category: '生活', desc: '热带水果，弯曲且呈黄色。', parent: '水果' },
  { title: '西瓜', category: '生活', desc: '夏季解暑的瓜类水果。', parent: '水果' },
  { title: '葡萄', category: '生活', desc: '成串生长，可酿酒。', parent: '水果' },
  { title: '草莓', category: '生活', desc: '红色的浆果，味道酸甜。', parent: '水果' },

  { title: '蔬菜', category: '生活', desc: '可烹饪食用的植物。', parent: '植物' },
  { title: '白菜', category: '生活', desc: '常见的叶菜类蔬菜。', parent: '蔬菜' },
  { title: '土豆', category: '生活', desc: '块茎植物，富含淀粉。', parent: '蔬菜' },
  { title: '番茄', category: '生活', desc: '既是蔬菜也是水果，红润多汁。', parent: '蔬菜' },

  // --- 社会 ---
  { title: '人类社会', category: '社会', desc: '人类共同生活的群体关系。', parent: null },
  
  { title: '职业', category: '社会', desc: '个人在社会中从事的工作。', parent: '人类社会' },
  { title: '医生', category: '社会', desc: '治病救人的专业人员。', parent: '职业' },
  { title: '教师', category: '社会', desc: '传授知识和技能的专业人员。', parent: '职业' },
  { title: '工程师', category: '社会', desc: '从事工程设计和制造的人员。', parent: '职业' },
  { title: '警察', category: '社会', desc: '维护社会治安的人员。', parent: '职业' },
  { title: '厨师', category: '社会', desc: '专门从事烹饪工作的人。', parent: '职业' },
  { title: '宇航员', category: '社会', desc: '探索太空的先驱。', parent: '职业' },

  { title: '交通', category: '社会', desc: '人或物的运输与输送。', parent: '人类社会' },
  { title: '汽车', category: '技术', desc: '最常见的陆地交通工具。', parent: '交通' },
  { title: '火车', category: '技术', desc: '在轨道上行驶的大型运输工具。', parent: '交通' },
  { title: '飞机', category: '技术', desc: '在空中飞行的交通工具。', parent: '交通' },
  { title: '轮船', category: '技术', desc: '水上交通工具。', parent: '交通' },
  { title: '自行车', category: '技术', desc: '环保的人力交通工具。', parent: '交通' },
  { title: '地铁', category: '技术', desc: '城市地下轨道交通。', parent: '交通' },

  { title: '教育', category: '社会', desc: '培养人才的社会活动。', parent: '人类社会' },
  { title: '学校', category: '地点', desc: '进行教育教学的场所。', parent: '教育' },
  { title: '图书馆', category: '地点', desc: '搜集整理并供人阅读图书的场所。', parent: '教育' },
  { title: '大学', category: '地点', desc: '实施高等教育的学校。', parent: '教育' },

  // --- 技术与科学 ---
  { title: '科学技术', category: '技术', desc: '科学与技术的合称。', parent: null },

  { title: '数码产品', category: '技术', desc: '数字化的电子产品。', parent: '科学技术' },
  { title: '手机', category: '技术', desc: '移动通讯工具，现代生活必备。', parent: '数码产品' },
  { title: '电脑', category: '技术', desc: '高速计算和处理信息的电子设备。', parent: '数码产品' },
  { title: '相机', category: '技术', desc: '记录影像的设备。', parent: '数码产品' },
  { title: '电视', category: '技术', desc: '接收和播放视频信号的家电。', parent: '数码产品' },

  { title: '互联网', category: '技术', desc: '全球性的计算机网络。', parent: '科学技术' },
  { title: '人工智能', category: '技术', desc: '模拟人类智能的技术。', parent: '互联网' },
  { title: '大数据', category: '技术', desc: '海量的数据集合。', parent: '互联网' },
  { title: '社交软件', category: '技术', desc: '用于人际交流的应用程序。', parent: '互联网' },

  { title: '基础科学', category: '科学', desc: '研究自然现象的基础学科。', parent: '科学技术' },
  { title: '物理', category: '科学', desc: '研究物质运动规律的学科。', parent: '基础科学' },
  { title: '化学', category: '科学', desc: '研究物质组成和变化的学科。', parent: '基础科学' },
  { title: '数学', category: '科学', desc: '研究数量、结构、变化的学科。', parent: '基础科学' },
  { title: '天文', category: '科学', desc: '研究宇宙天体的学科。', parent: '基础科学' },
  { title: '地球', category: '自然', desc: '我们赖以生存的行星。', parent: '天文' },
  { title: '太阳', category: '自然', desc: '太阳系的中心恒星。', parent: '天文' },
  { title: '月亮', category: '自然', desc: '地球的天然卫星。', parent: '天文' },

  // --- 生活 ---
  { title: '日常生活', category: '生活', desc: '人们每天进行的活动。', parent: null },

  { title: '家居', category: '生活', desc: '家庭居住的环境和用品。', parent: '日常生活' },
  { title: '桌子', category: '生活', desc: '有平面的家具，供放物或工作。', parent: '家居' },
  { title: '椅子', category: '生活', desc: '供人坐的家具。', parent: '家居' },
  { title: '床', category: '生活', desc: '供人睡觉的家具。', parent: '家居' },
  { title: '冰箱', category: '技术', desc: '储存食物并保持低温的电器。', parent: '家居' },
  { title: '空调', category: '技术', desc: '调节室内温度的电器。', parent: '家居' },

  { title: '食物', category: '生活', desc: '能被食用并提供营养的物质。', parent: '日常生活' },
  { title: '米饭', category: '生活', desc: '亚洲常见的主食。', parent: '食物' },
  { title: '面包', category: '生活', desc: '西方面食，由面粉发酵烤制。', parent: '食物' },
  { title: '牛奶', category: '生活', desc: '富含钙质的饮品。', parent: '食物' },
  { title: '咖啡', category: '生活', desc: '提神的深色饮料。', parent: '食物' },
  { title: '茶', category: '生活', desc: '中国的传统饮品。', parent: '食物' },

  { title: '运动', category: '生活', desc: '锻炼身体的活动。', parent: '日常生活' },
  { title: '足球', category: '生活', desc: '世界第一大运动。', parent: '运动' },
  { title: '篮球', category: '生活', desc: '五人制的对抗性球类运动。', parent: '运动' },
  { title: '游泳', category: '生活', desc: '在水中进行的运动。', parent: '运动' },
  { title: '跑步', category: '生活', desc: '最基础的有氧运动。', parent: '运动' },

  { title: '节日', category: '事件', desc: '具有特殊意义的庆祝日。', parent: '日常生活' },
  { title: '春节', category: '事件', desc: '中国农历新年。', parent: '节日' },
  { title: '中秋节', category: '事件', desc: '团圆赏月的传统节日。', parent: '节日' },
  { title: '圣诞节', category: '事件', desc: '西方传统节日。', parent: '节日' },

  // --- 概念 ---
  { title: '抽象概念', category: '概念', desc: '非实体的思维产物。', parent: null },
  { title: '时间', category: '概念', desc: '物质运动持续性的表现。', parent: '抽象概念' },
  { title: '颜色', category: '概念', desc: '光作用于眼产生的视觉感受。', parent: '抽象概念' },
  { title: '红色', category: '概念', desc: '充满活力和热情的颜色。', parent: '颜色' },
  { title: '蓝色', category: '概念', desc: '象征天空和海洋的颜色。', parent: '颜色' },
  { title: '绿色', category: '概念', desc: '象征生命和自然的颜色。', parent: '颜色' },
  { title: '形状', category: '概念', desc: '物体存在的空间形式。', parent: '抽象概念' },
  { title: '圆形', category: '概念', desc: '中心到边缘距离相等的形状。', parent: '形状' },
  { title: '方形', category: '概念', desc: '四边相等的形状。', parent: '形状' },
  { title: '三角形', category: '概念', desc: '三条边组成的形状。', parent: '形状' }
];

// 显式的额外关系以创建密集图谱
const EXTRA_RELATIONSHIPS = [
  ['猫', '鱼', 'RELATED_TO', '爱吃'], // 如果缺失则添加“鱼”
  ['猫', '老虎', 'SIMILAR_TO', '猫科'],
  ['狗', '狼', 'SIMILAR_TO', '近亲'],
  ['狗', '骨头', 'RELATED_TO', '爱吃'], // Add Bone
  ['蜜蜂', '花卉', 'RELATED_TO', '采蜜'],
  ['蝴蝶', '花卉', 'RELATED_TO', '采蜜'],
  ['鸟类', '飞机', 'RELATED_TO', '仿生学'],
  ['鱼', '游泳', 'RELATED_TO', '本能'],
  ['医生', '医院', 'BELONGS_TO', '工作地点'], // Add Hospital
  ['教师', '学校', 'BELONGS_TO', '工作地点'],
  ['学生', '学校', 'BELONGS_TO', '学习地点'], // Add Student
  ['宇航员', '火箭', 'RELATED_TO', '搭乘'], // Add Rocket
  ['手机', '互联网', 'RELATED_TO', '接入'],
  ['电脑', '互联网', 'RELATED_TO', '接入'],
  ['人工智能', '机器人', 'RELATED_TO', '核心技术'], // Add Robot
  ['汽车', '汽油', 'RELATED_TO', '燃料'], // Add Gas
  ['太阳', '向日葵', 'RELATED_TO', '吸引'],
  ['地球', '月亮', 'RELATED_TO', '卫星'],
  ['咖啡', '牛奶', 'RELATED_TO', '拿铁'],
  ['春节', '饺子', 'RELATED_TO', '习俗'], // Add Dumpling
  ['中秋节', '月饼', 'RELATED_TO', '习俗'], // Add Mooncake
  ['画家', '颜色', 'RELATED_TO', '使用'], // Add Painter
  ['音乐家', '钢琴', 'RELATED_TO', '演奏'], // Add Musician, Piano
];

// 将 RAW_DATA 处理为节点和连线
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

  // 1. 添加主要层级节点
  RAW_DATA.forEach(item => {
    const id = addNode(item.title, item.category, item.desc);
    if (item.parent) {
      const parentId = `n_${item.parent}`;
      // 确保父节点存在（根据顺序应该存在，但做个安全检查）
      if (createdIds.has(parentId)) {
        links.push({
          id: `l_${parentId}_${id}`,
          source: parentId,
          target: id,
          type: RelationType.CONTAINS,
          weight: 8
        });
        // 互逆
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

  // 2. 添加在关系中发现的额外隐式节点
  EXTRA_RELATIONSHIPS.forEach(([src, tgt]) => {
    if (!createdIds.has(`n_${src}`)) addNode(src, '其他', '补充节点', null);
    if (!createdIds.has(`n_${tgt}`)) addNode(tgt, '其他', '补充节点', null);
  });

  // 3. 添加额外关系
  EXTRA_RELATIONSHIPS.forEach(([src, tgt, type, reason], idx) => {
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
    if (rType === RelationType.HOMONYM) recType = RelationType.HOMONYM; // 同名互逆
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
