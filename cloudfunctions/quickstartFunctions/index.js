const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

const COLLECTIONS = {
  QUESTIONS: "pet_questions",
  RESULTS: "pet_results",
  RECORDS: "pet_answer_records",
};

const defaultQuestions = [
  {
    qid: "q1",
    order: 1,
    dim: "EI",
    title: "参加陌生聚会时，你通常会？",
    options: [
      { text: "主动破冰认识新朋友", scoreMap: { golden: 2, samoyed: 1 } },
      { text: "先观察氛围再慢慢加入", scoreMap: { deer: 2, britishShorthair: 1 } },
      { text: "只和熟人深聊", scoreMap: { ragdoll: 2, rabbit: 1 } },
      { text: "带着任务去社交", scoreMap: { borderCollie: 2, shiba: 1 } },
      { text: "短暂出现后安静离场", scoreMap: { orangeCat: 2, fox: 1 } },
    ],
  },
  {
    qid: "q2",
    order: 2,
    dim: "SN",
    title: "开始一个新项目时，你先关注？",
    options: [
      { text: "可执行步骤和时间节点", scoreMap: { borderCollie: 2, shiba: 1 } },
      { text: "整体愿景和可能性", scoreMap: { fox: 2, deer: 1 } },
      { text: "过往经验是否可复用", scoreMap: { britishShorthair: 2, orangeCat: 1 } },
      { text: "团队感受与合作状态", scoreMap: { golden: 2, ragdoll: 1 } },
      { text: "先试试再说", scoreMap: { samoyed: 2, rabbit: 1 } },
    ],
  },
  {
    qid: "q3",
    order: 3,
    dim: "TF",
    title: "朋友纠结选工作，你更可能给出？",
    options: [
      { text: "客观利弊分析", scoreMap: { borderCollie: 2, fox: 1 } },
      { text: "先安抚情绪再建议", scoreMap: { ragdoll: 2, golden: 1 } },
      { text: "鼓励他忠于内心", scoreMap: { rabbit: 2, deer: 1 } },
      { text: "建议先做最稳妥选择", scoreMap: { britishShorthair: 2, shiba: 1 } },
      { text: "给几个有趣新方向", scoreMap: { samoyed: 2, orangeCat: 1 } },
    ],
  },
  {
    qid: "q4",
    order: 4,
    dim: "JP",
    title: "旅行前你更像哪种人？",
    options: [
      { text: "行程表精确到小时", scoreMap: { borderCollie: 2, shiba: 1 } },
      { text: "定大框架，现场微调", scoreMap: { golden: 2, fox: 1 } },
      { text: "只订来回，其他随缘", scoreMap: { orangeCat: 2, deer: 1 } },
      { text: "按同伴节奏配合", scoreMap: { ragdoll: 2, rabbit: 1 } },
      { text: "计划越少越轻松", scoreMap: { samoyed: 2, britishShorthair: 1 } },
    ],
  },
  {
    qid: "q5",
    order: 5,
    dim: "EI",
    title: "连续忙了一周后，你充电方式是？",
    options: [
      { text: "约朋友热闹一下", scoreMap: { samoyed: 2, golden: 1 } },
      { text: "独处做自己的事", scoreMap: { orangeCat: 2, britishShorthair: 1 } },
      { text: "和少数知己深聊", scoreMap: { ragdoll: 2, rabbit: 1 } },
      { text: "运动释放能量", scoreMap: { shiba: 2, deer: 1 } },
      { text: "边玩边认识新圈子", scoreMap: { fox: 2, borderCollie: 1 } },
    ],
  },
  {
    qid: "q6",
    order: 6,
    dim: "SN",
    title: "你更容易注意到？",
    options: [
      { text: "具体细节和异常点", scoreMap: { borderCollie: 2, britishShorthair: 1 } },
      { text: "趋势、隐喻和联想", scoreMap: { fox: 2, deer: 1 } },
      { text: "人与人之间微妙变化", scoreMap: { ragdoll: 2, rabbit: 1 } },
      { text: "是否能立刻落地", scoreMap: { shiba: 2, golden: 1 } },
      { text: "有没有好玩的可能", scoreMap: { samoyed: 2, orangeCat: 1 } },
    ],
  },
  {
    qid: "q7",
    order: 7,
    dim: "TF",
    title: "你做重要决定时更看重？",
    options: [
      { text: "逻辑一致与长期收益", scoreMap: { borderCollie: 2, shiba: 1 } },
      { text: "关系影响与内心感受", scoreMap: { golden: 2, ragdoll: 1 } },
      { text: "安全边界是否可控", scoreMap: { britishShorthair: 2, rabbit: 1 } },
      { text: "灵感和时机", scoreMap: { deer: 2, fox: 1 } },
      { text: "先做了再优化", scoreMap: { samoyed: 2, orangeCat: 1 } },
    ],
  },
  {
    qid: "q8",
    order: 8,
    dim: "JP",
    title: "面对突发变更，你通常？",
    options: [
      { text: "立刻重排计划", scoreMap: { borderCollie: 2, shiba: 1 } },
      { text: "先稳住情绪再处理", scoreMap: { ragdoll: 2, golden: 1 } },
      { text: "顺势调整，保持弹性", scoreMap: { deer: 2, orangeCat: 1 } },
      { text: "快速找替代方案", scoreMap: { fox: 2, samoyed: 1 } },
      { text: "降低预期，慢慢推进", scoreMap: { britishShorthair: 2, rabbit: 1 } },
    ],
  },
  {
    qid: "q9",
    order: 9,
    dim: "PET",
    title: "你理想的人际距离是？",
    options: [
      { text: "高频互动，及时回应", scoreMap: { golden: 2, samoyed: 1 } },
      { text: "亲密但保留边界", scoreMap: { britishShorthair: 2, shiba: 1 } },
      { text: "少量深度连接", scoreMap: { ragdoll: 2, rabbit: 1 } },
      { text: "来去自由，不束缚", scoreMap: { orangeCat: 2, fox: 1 } },
      { text: "自然流动，慢热靠近", scoreMap: { deer: 2, borderCollie: 1 } },
    ],
  },
  {
    qid: "q10",
    order: 10,
    dim: "EI",
    title: "在团队讨论中你更常？",
    options: [
      { text: "边想边说，带动节奏", scoreMap: { samoyed: 2, golden: 1 } },
      { text: "先听完再给关键观点", scoreMap: { fox: 2, britishShorthair: 1 } },
      { text: "补充执行细节", scoreMap: { borderCollie: 2, shiba: 1 } },
      { text: "关注大家是否被理解", scoreMap: { ragdoll: 2, rabbit: 1 } },
      { text: "话不多但观点独到", scoreMap: { deer: 2, orangeCat: 1 } },
    ],
  },
  {
    qid: "q11",
    order: 11,
    dim: "SN",
    title: "你学习新技能时偏好？",
    options: [
      { text: "看教程按步骤练", scoreMap: { borderCollie: 2, britishShorthair: 1 } },
      { text: "先理解原理再动手", scoreMap: { fox: 2, shiba: 1 } },
      { text: "边试边玩找到感觉", scoreMap: { samoyed: 2, orangeCat: 1 } },
      { text: "结合场景举一反三", scoreMap: { deer: 2, golden: 1 } },
      { text: "和人一起练习更快", scoreMap: { ragdoll: 2, rabbit: 1 } },
    ],
  },
  {
    qid: "q12",
    order: 12,
    dim: "TF",
    title: "当你指出问题时，更在意？",
    options: [
      { text: "表达准确、结论清晰", scoreMap: { shiba: 2, borderCollie: 1 } },
      { text: "语气温和、减少伤害", scoreMap: { ragdoll: 2, golden: 1 } },
      { text: "给人留有回旋空间", scoreMap: { rabbit: 2, deer: 1 } },
      { text: "快速推进到可执行", scoreMap: { fox: 2, britishShorthair: 1 } },
      { text: "先鼓励再提建议", scoreMap: { samoyed: 2, orangeCat: 1 } },
    ],
  },
];

const defaultResults = [
  {
    animalKey: "golden",
    title: "金毛系·阳光治愈犬",
    tags: ["阳光", "治愈", "共情强"],
    desc: "你热情温暖、亲和力强，擅长让周围的人放松下来。你重视连接感，常常在关系中扮演支持与鼓励的角色。",
    imageUrl: "",
  },
  {
    animalKey: "shiba",
    title: "柴犬系·独立行动派",
    tags: ["果断", "自律", "有主见"],
    desc: "你做事干脆、边界清晰，面对问题会直接推进。你不依赖外界评价，更看重结果和长期成长。",
    imageUrl: "",
  },
  {
    animalKey: "borderCollie",
    title: "边牧系·高能智性脑",
    tags: ["聪明", "高效", "逻辑强"],
    desc: "你思维敏捷、学习力强，喜欢结构化解决问题。你在复杂情境下也能快速抓住关键。",
    imageUrl: "",
  },
  {
    animalKey: "samoyed",
    title: "萨摩耶系·快乐感染者",
    tags: ["开朗", "社交力", "乐观"],
    desc: "你天生带着轻快能量，善于活跃氛围。你会用积极心态面对挑战，也乐于把快乐传递给他人。",
    imageUrl: "",
  },
  {
    animalKey: "ragdoll",
    title: "布偶系·温柔陪伴猫",
    tags: ["细腻", "温柔", "稳定"],
    desc: "你情绪感知细致，善于倾听和安抚。你追求舒服、真实的人际关系，并愿意长期投入。",
    imageUrl: "",
  },
  {
    animalKey: "britishShorthair",
    title: "英短系·沉稳秩序感",
    tags: ["冷静", "稳重", "可靠"],
    desc: "你不急不躁，偏好可预期的节奏。你重视规则和边界，在关键时刻总能给人安心感。",
    imageUrl: "",
  },
  {
    animalKey: "orangeCat",
    title: "橘猫系·松弛享受派",
    tags: ["随和", "治愈", "生活感"],
    desc: "你擅长在日常里找到快乐，懂得照顾自己和他人的情绪。你追求平衡，不卷但持续向前。",
    imageUrl: "",
  },
  {
    animalKey: "rabbit",
    title: "兔子系·柔软感知者",
    tags: ["敏感", "体贴", "有温度"],
    desc: "你心思细腻、共情力强，能捕捉别人忽略的情绪细节。你重视安全感，也很会经营小确幸。",
    imageUrl: "",
  },
  {
    animalKey: "deer",
    title: "小鹿系·灵动治愈感",
    tags: ["灵气", "直觉", "纯净"],
    desc: "你敏锐又轻盈，面对变化有很强的感知力。你不喜欢僵硬模式，更适合在自由空间里发光。",
    imageUrl: "",
  },
  {
    animalKey: "fox",
    title: "狐狸系·机敏创意派",
    tags: ["机智", "审美", "策略感"],
    desc: "你反应快、点子多，擅长用巧思解决问题。你有独特风格，懂得在变化中找到最优路径。",
    imageUrl: "",
  },
];

async function ensureCollection(name) {
  try {
    await db.createCollection(name);
  } catch (error) {
    const raw = [
      error && error.errMsg,
      error && error.message,
      typeof error === "string" ? error : "",
      JSON.stringify(error || {}),
    ]
      .filter(Boolean)
      .join(" | ");

    const alreadyExists =
      raw.includes("already exists") ||
      raw.includes("DATABASE_COLLECTION_ALREADY_EXIST") ||
      raw.includes("ResourceExist") ||
      raw.includes("Table exist") ||
      raw.includes("createCollection:fail -501001");

    if (!alreadyExists) {
      throw error;
    }
  }
}

async function clearCollection(name) {
  const MAX_LIMIT = 100;
  while (true) {
    const query = await db.collection(name).limit(MAX_LIMIT).get();
    const list = query.data || [];
    if (!list.length) break;
    await Promise.all(list.map((item) => db.collection(name).doc(item._id).remove()));
    if (list.length < MAX_LIMIT) break;
  }
}

async function initMvpData(event = {}) {
  await ensureCollection(COLLECTIONS.QUESTIONS);
  await ensureCollection(COLLECTIONS.RESULTS);
  await ensureCollection(COLLECTIONS.RECORDS);

  const force = !!event.force;
  if (force) {
    await clearCollection(COLLECTIONS.QUESTIONS);
    await clearCollection(COLLECTIONS.RESULTS);
  }

  const qCount = await db.collection(COLLECTIONS.QUESTIONS).count();
  if (qCount.total === 0) {
    await Promise.all(
      defaultQuestions.map((item) =>
        db.collection(COLLECTIONS.QUESTIONS).add({ data: item })
      )
    );
  }

  const rCount = await db.collection(COLLECTIONS.RESULTS).count();
  if (rCount.total === 0) {
    await Promise.all(
      defaultResults.map((item) =>
        db.collection(COLLECTIONS.RESULTS).add({ data: item })
      )
    );
  }

  return {
    success: true,
    forcedReset: force,
    questionTotal: defaultQuestions.length,
    resultTotal: defaultResults.length,
  };
}

async function getQuestions() {
  const res = await db
    .collection(COLLECTIONS.QUESTIONS)
    .orderBy("order", "asc")
    .get();
  return { success: true, data: res.data };
}

async function getResults() {
  const res = await db.collection(COLLECTIONS.RESULTS).get();
  return { success: true, data: res.data };
}

async function saveAnswerRecord(event) {
  const wxContext = cloud.getWXContext();
  const answers = Array.isArray(event.answers) ? event.answers : [];

  await db.collection(COLLECTIONS.RECORDS).add({
    data: {
      openid: wxContext.OPENID,
      answers,
      resultKey: event.resultKey || "",
      createdAt: Date.now(),
      version: "mvp-v1",
    },
  });

  return { success: true };
}

exports.main = async (event) => {
  switch (event.type) {
    case "initMvpData":
      return initMvpData(event);
    case "getQuestions":
      return getQuestions();
    case "getResults":
      return getResults();
    case "saveAnswerRecord":
      return saveAnswerRecord(event);
    default:
      return {
        success: false,
        errMsg: `Unknown event type: ${event.type}`,
      };
  }
};
