const SCREEN_DESIGN_WIDTH = 1920;
const SCREEN_DESIGN_HEIGHT = 1080;
let screenScaleAnimationFrame = 0;

function getVisibleViewportBounds() {
  const visualViewport = window.visualViewport;
  const width = visualViewport?.width || document.documentElement.clientWidth || window.innerWidth;
  const height = visualViewport?.height || document.documentElement.clientHeight || window.innerHeight;
  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
    left: visualViewport?.offsetLeft || 0,
    top: visualViewport?.offsetTop || 0,
  };
}

function syncScreenScale() {
  const viewport = getVisibleViewportBounds();
  const scale = Math.min(
    viewport.width / SCREEN_DESIGN_WIDTH,
    viewport.height / SCREEN_DESIGN_HEIGHT,
  );
  const normalizedScale = Math.max(0.05, Number(scale.toFixed(6)));
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--screen-scale", String(normalizedScale));
  rootStyle.setProperty("--screen-center-x", `${viewport.left + viewport.width / 2}px`);
  rootStyle.setProperty("--screen-center-y", `${viewport.top + viewport.height / 2}px`);
  document.documentElement.dataset.screenScale = String(normalizedScale);
}

function requestScreenScaleSync() {
  if (screenScaleAnimationFrame) return;
  screenScaleAnimationFrame = window.requestAnimationFrame(() => {
    screenScaleAnimationFrame = 0;
    syncScreenScale();
  });
}

syncScreenScale();
window.addEventListener("resize", requestScreenScaleSync, { passive: true });
window.addEventListener("orientationchange", requestScreenScaleSync, { passive: true });
window.addEventListener("pageshow", requestScreenScaleSync, { passive: true });
document.addEventListener("fullscreenchange", requestScreenScaleSync);
window.visualViewport?.addEventListener("resize", requestScreenScaleSync, { passive: true });
window.visualViewport?.addEventListener("scroll", requestScreenScaleSync, { passive: true });

const LINEUP_SLOT_COUNT = 5;
const LINEUP_INSERT_EDGE_RATIO = 0.32;
const LINEUP_DRAG_DIRECTION_THRESHOLD = 8;
const TURN_GOLD = 10;
const GOLD_CAP = 100;
const REFRESH_COST = 1;
const HERO_COST = 3;
const ITEM_COST = 2;
const STRATAGEM_COST = 3;
const MAX_UNIT_BONDS = 2;
const MAX_UNIT_LEVEL = 3;
const MAX_EFFECT_CHAIN_STEPS = 500;
const WU_OPENING_BURN_PRIORITY = Number.MAX_SAFE_INTEGER;
const PLAYER_DATA_TEST_MAX_ROUND = 20;
const PLAYER_STARTING_LIFE = 5;
const PLAYER_MAX_LIFE = 5;
const ROUND_THREE_LIFE_RECOVERY_ROUND = 3;
const ROUND_THREE_LIFE_RECOVERY = 1;
const ROUND_REWARD_ROUNDS = [3, 7, 11];
const ROUND_REWARD_TITLES = Object.freeze({
  3: "前期奖励",
  7: "中期奖励",
  11: "后期奖励",
});
const ROUND_REWARD_CARD_NAMES = Object.freeze({
  3: ["帅印", "虎符", "百厄角", "龙方壶"],
  7: ["白玉龟", "阎魔帆", "筹措军资", "厉兵秣马"],
  11: ["众志成城", "合纵连横", "方天画戟", "黄天令旗"],
});
const FLAG_VICTORY_TARGET = 10;
const PLAYER_DATA_TEST_ENEMY_COUNT = 5;
const PLAYER_DATA_TEST_ENEMY_STAT_MULTIPLIER = 2.5;
const PLAYER_DATA_TEST_STORAGE_KEY = "bond-system.player-lineup-test.v1";
const OPPONENT_POOL_WINDOW_SIZE = 10;
const OPPONENT_POOL_MAX_PER_WINDOW = 3;
const OPPONENT_POOL_MIN_SIZE = Math.ceil(
  OPPONENT_POOL_WINDOW_SIZE / OPPONENT_POOL_MAX_PER_WINDOW,
);
const BONUS_ANIMATION_DURATION = 900;
const BONUS_ANIMATION_STAGGER = 120;
const UPGRADE_ANIMATION_DURATION = 1050;
const UPGRADE_ANIMATION_STAGGER = 160;
const SHOP_SKILL_ANIMATION_DURATION = 900;
const BOND_UPGRADE_ANIMATION_DURATION = 1450;
const UNIT_LEVEL_COPY_THRESHOLDS = {
  1: 1,
  2: 3,
  3: 6,
};
const BOND_FACTIONS = ["魏", "蜀", "吴", "群"];
const NEGATIVE_STATUS_POOL = [
  "burn",
  "broken-morale",
  "fear",
  "chain",
  "intimidated",
  "counterplot",
];
const NEGATIVE_STATUS_IDS = [...NEGATIVE_STATUS_POOL];
const POSITIVE_STATUS_IDS = ["unparalleled", "rest"];
const STATUS_LABELS = {
  burn: "灼烧",
  "broken-morale": "破胆",
  fear: "畏惧",
  chain: "连锁",
  intimidated: "震慑",
  counterplot: "反间",
  unparalleled: "无双",
  rest: "休整",
  "skill-disabled": "技能禁用",
};
const STATUS_DESCRIPTIONS = {
  burn: "每次任意普通攻击完成后受到 1 点真实伤害；再次获得任意负面状态时，新状态先覆盖旧灼烧并触发 6 点真实引燃伤害；引燃后只清除状态槽中当前的灼烧。",
  "broken-morale": "受到的普通攻击伤害和技能普通伤害 +5；不增加真实伤害。",
  fear: "普通攻击造成的伤害 -3，最低为 0；不减少技能或真实伤害。",
  chain: "受到其他负面状态时，全部连锁单位的连锁会统一替换为该状态；该批替换不会再次触发连锁传播。",
  intimidated: "下一次普通攻击伤害变为 0；触发后状态保留并标记为已消耗。",
  counterplot: "阵亡后，在施加者一方最前方以 LV1、3/3 召唤自身。",
  unparalleled: "免疫后续负面状态；只有新的正面状态可以覆盖无双；普通攻击会对目标后方单位造成追加伤害。",
  rest: "其他友军完成普通攻击后，自身获得生命；将获得负面状态时，清除休整并阻止该负面状态。",
  "skill-disabled": "本轮武将技能无法触发；装备、羁绊、状态与系统效果仍可生效。",
};
const STATUS_PRESENTATION_ORDER = [
  "burn",
  "broken-morale",
  "fear",
  "chain",
  "intimidated",
  "counterplot",
  "unparalleled",
  "rest",
];
const EVENT_DISPLAY_NAMES = {
  "battle:start": "战斗开始",
  "battle:start:end": "战斗开始阶段结束",
  "attack:before": "攻击前",
  "damage:before": "伤害结算前",
  "damage:after": "造成伤害后",
  "attack:after": "攻击后",
  "battle:end": "战斗结束",
  "round:start": "回合开始",
  "round:end": "回合结束",
  "stratagem:use": "使用计策",
  "card:purchase": "购买",
  "unit:recruit": "招募",
  "unit:summon": "召唤",
  "unit:sell": "出售",
  "experience:gain": "获得经验",
  "unit:upgrade": "武将升级",
  "unit:death": "武将阵亡",
  "unit:revive": "武将复活",
  "status:apply": "获得状态",
  "bond:count-change": "羁绊人数变化",
};
const GLOBAL_STATUS_EFFECT_LABELS = {
  "status.burn-tick": STATUS_LABELS.burn,
  "status.rest-recovery": STATUS_LABELS.rest,
  "status.broken-morale-damage": STATUS_LABELS["broken-morale"],
  "status.fear-damage": STATUS_LABELS.fear,
  "status.intimidated-damage": STATUS_LABELS.intimidated,
  "status.unparalleled-cleave": STATUS_LABELS.unparalleled,
  "status.counterplot-revive": STATUS_LABELS.counterplot,
};
const GLOBAL_STATUS_EFFECT_IDS = Object.keys(GLOBAL_STATUS_EFFECT_LABELS);
const BOND_VISUAL_COLORS = {
  魏: "#69c8ff",
  蜀: "#72ff9e",
  吴: "#ff745e",
  群: "#ffd65c",
};
const BATTLE_ANIMATION_SPEEDS = [1, 2, 3, 5];
const GAME_AUDIO_ENABLED = false;

const AUDIO_CUES = Object.freeze({
  shopMusic: { src: "res/Audio/bg_arena.wav", volume: 0.16, loop: true },
  battleMusic: { src: "res/Audio/bg_battleContest.wav", volume: 0.18, loop: true },
  uiConfirm: { src: "res/Audio/BtnCheck.wav", volume: 0.48, cooldownMs: 80 },
  uiCancel: { src: "res/Audio/BtnUnCheck.wav", volume: 0.44, cooldownMs: 80 },
  uiTab: { src: "res/Audio/BtnClickTab.wav", volume: 0.36, cooldownMs: 70 },
  uiError: { src: "res/Audio/BtnTips.wav", volume: 0.52, cooldownMs: 180 },
  codexOpen: { src: "res/Audio/BtnInfoBarHeroEntry.wav", volume: 0.56, cooldownMs: 160 },
  shopRefresh: { src: "res/Audio/BtnDealCard.wav", volume: 0.66, cooldownMs: 120 },
  heroRecruit: { src: "res/Audio/BtnBuyResourceCrit.wav", volume: 0.58, cooldownMs: 120 },
  heroLevel2: { src: "res/Audio/BtnTurnSilverCard.wav", volume: 0.64, cooldownMs: 160 },
  heroLevel3: { src: "res/Audio/BtnTurnGoldCard.wav", volume: 0.68, cooldownMs: 180 },
  equipmentEquip: { src: "res/Audio/BtnEnhanceTreasure.wav", volume: 0.58, cooldownMs: 140 },
  equipmentSwap: {
    src: "res/Audio/BtnReplaceTreasurePurify.wav",
    volume: 0.54,
    cooldownMs: 120,
  },
  stratagemUse: { src: "res/Audio/StudyTech.wav", volume: 0.62, cooldownMs: 140 },
  cardMove: { src: "res/Audio/BtnMoveCard.wav", volume: 0.5, cooldownMs: 80 },
  heroSell: { src: "res/Audio/BtnHeroRetreat.wav", volume: 0.56, cooldownMs: 180 },
  equipmentSell: { src: "res/Audio/BtnDecomposeStar.wav", volume: 0.52, cooldownMs: 160 },
  shopSkill: { src: "res/Audio/towerdef_skill2.wav", volume: 0.52, cooldownMs: 100 },
  bondGain: { src: "res/Audio/BtnGainPresidentSkill.wav", volume: 0.62, cooldownMs: 180 },
  rewardClaim: { src: "res/Audio/GetReward.wav", volume: 0.66, cooldownMs: 180 },
  nextRound: { src: "res/Audio/BtnGoOn.wav", volume: 0.58, cooldownMs: 180 },
  battleEnter: { src: "res/Audio/BtnCommonFight.wav", volume: 0.64, cooldownMs: 240 },
  battleReady: { src: "res/Audio/MarchHorse.wav", volume: 0.42, cooldownMs: 500 },
  battleClash: { src: "res/Audio/BtnBattleContest.wav", volume: 0.5, cooldownMs: 180 },
  battleDamage: {
    src: "res/Audio/towerdef_monsterhurt.wav",
    volume: 0.48,
    cooldownMs: 45,
    poolSize: 5,
  },
  battleDeath: { src: "res/Audio/towerdef_wallhurt.wav", volume: 0.58, cooldownMs: 120 },
  battleSkill1: { src: "res/Audio/towerdef_skill1.wav", volume: 0.52, cooldownMs: 90 },
  battleSkill2: { src: "res/Audio/towerdef_skill2.wav", volume: 0.52, cooldownMs: 90 },
  battleSkill3: { src: "res/Audio/towerdef_skill3.wav", volume: 0.52, cooldownMs: 90 },
  battleSkill4: { src: "res/Audio/towerdef_skill4.wav", volume: 0.52, cooldownMs: 90 },
  battleSkill5: { src: "res/Audio/towerdef_skill5.wav", volume: 0.52, cooldownMs: 90 },
  battleSpeed: { src: "res/Audio/BtnCommonSpeedup.wav", volume: 0.44, cooldownMs: 140 },
  battleVictory: { src: "res/Audio/GetReward.wav", volume: 0.68, cooldownMs: 500 },
  battleDefeat: { src: "res/Audio/BtnHeroRetreat.wav", volume: 0.56, cooldownMs: 500 },
  gameVictory: { src: "res/Audio/fireworks.wav", volume: 0.56, cooldownMs: 1000 },
});
const AUDIO_SCENE_CUES = Object.freeze({
  shop: "shopMusic",
  battle: "battleMusic",
});
const audioRuntime = {
  unlocked: false,
  scene: null,
  music: null,
  musicCue: null,
  pools: new Map(),
  lastPlayedAt: new Map(),
  warnedSources: new Set(),
  lastGameOutcomeKey: null,
};

function createGameAudio(cue) {
  const audio = new Audio(cue.src);
  audio.preload = cue.loop ? "auto" : "metadata";
  audio.loop = Boolean(cue.loop);
  audio.volume = cue.volume ?? 1;
  return audio;
}

function warnGameAudioOnce(cue, error) {
  if (
    error?.name === "AbortError" ||
    error?.name === "NotAllowedError" ||
    audioRuntime.warnedSources.has(cue.src)
  ) {
    return;
  }
  audioRuntime.warnedSources.add(cue.src);
  console.warn(`音效加载或播放失败：${cue.src}`, error);
}

function resumeGameMusic() {
  if (!GAME_AUDIO_ENABLED || !audioRuntime.unlocked || !audioRuntime.music?.paused) return;
  const cue = AUDIO_CUES[audioRuntime.musicCue];
  if (!cue) return;
  audioRuntime.music.play().catch((error) => warnGameAudioOnce(cue, error));
}

function playAudioCue(cueName, { volumeScale = 1, playbackRate = 1 } = {}) {
  if (!GAME_AUDIO_ENABLED) return false;
  const cue = AUDIO_CUES[cueName];
  if (!audioRuntime.unlocked || !cue || cue.loop) return false;
  resumeGameMusic();

  const now = performance.now();
  const lastPlayedAt = audioRuntime.lastPlayedAt.get(cueName) ?? Number.NEGATIVE_INFINITY;
  if (now - lastPlayedAt < (cue.cooldownMs ?? 0)) return false;
  audioRuntime.lastPlayedAt.set(cueName, now);

  const pool = audioRuntime.pools.get(cueName) ?? [];
  let audio = pool.find((candidate) => candidate.paused || candidate.ended);
  if (!audio && pool.length < (cue.poolSize ?? 3)) {
    audio = createGameAudio(cue);
    pool.push(audio);
    audioRuntime.pools.set(cueName, pool);
  }
  audio ??= pool[0];
  if (!audio) return false;

  audio.pause();
  audio.currentTime = 0;
  audio.volume = Math.max(0, Math.min(1, (cue.volume ?? 1) * volumeScale));
  audio.playbackRate = Math.max(0.5, Math.min(2, playbackRate));
  audio.play().catch((error) => warnGameAudioOnce(cue, error));
  return true;
}

function setGameAudioScene(scene) {
  if (!GAME_AUDIO_ENABLED) {
    if (audioRuntime.music) {
      audioRuntime.music.pause();
      audioRuntime.music.currentTime = 0;
    }
    return;
  }
  const cueName = AUDIO_SCENE_CUES[scene] ?? null;
  const cue = cueName ? AUDIO_CUES[cueName] : null;
  if (!audioRuntime.unlocked || !applicationStarted || !cue) return;
  audioRuntime.scene = scene;

  if (audioRuntime.musicCue === cueName && audioRuntime.music) {
    if (audioRuntime.music.paused) {
      audioRuntime.music.play().catch((error) => warnGameAudioOnce(cue, error));
    }
    return;
  }

  if (audioRuntime.music) {
    audioRuntime.music.pause();
    audioRuntime.music.currentTime = 0;
  }
  const music = createGameAudio(cue);
  audioRuntime.music = music;
  audioRuntime.musicCue = cueName;
  music.play().catch((error) => warnGameAudioOnce(cue, error));
}

function syncGameAudioScene() {
  setGameAudioScene(state?.phase === "battle" ? "battle" : "shop");
}

function unlockGameAudio() {
  if (!GAME_AUDIO_ENABLED || audioRuntime.unlocked) return;
  audioRuntime.unlocked = true;
  document.removeEventListener("pointerdown", unlockGameAudio, true);
  document.removeEventListener("keydown", unlockGameAudio, true);
  syncGameAudioScene();
}

if (GAME_AUDIO_ENABLED) {
  document.addEventListener("pointerdown", unlockGameAudio, { capture: true, passive: true });
  document.addEventListener("keydown", unlockGameAudio, { capture: true });
}

const SHOP_PROGRESSION = [
  { maxRound: 2, tier: 1, heroSlots: 3, itemSlots: 1 },
  { maxRound: 4, tier: 2, heroSlots: 3, itemSlots: 1 },
  { maxRound: 6, tier: 3, heroSlots: 4, itemSlots: 2 },
  { maxRound: 8, tier: 4, heroSlots: 4, itemSlots: 2 },
  { maxRound: 10, tier: 5, heroSlots: 5, itemSlots: 2 },
  { maxRound: Number.POSITIVE_INFINITY, tier: 6, heroSlots: 5, itemSlots: 2 },
];
const SHOP_POSITION_COUNT = 9;
// 槽位底图的笔触并非等距，以下坐标按 1920 × 1080 设计坐标逐格对齐。
const SHOP_POSITION_X = [-757, -563, -369, -176, 18, 212, 405, 599, 792];

const TEAM_SLOT_RECTS = [
  { x: -430, y: -22, w: 160, h: 231 },
  { x: -214, y: -22, w: 160, h: 231 },
  { x: -2, y: -22, w: 160, h: 231 },
  { x: 211, y: -22, w: 160, h: 231 },
  { x: 425, y: -22, w: 160, h: 231 },
];

const HERO_IMAGE_BY_NAME = {
  甄姬: "hero_icon/hero_zhenji.png",
  庞德: "hero_icon/hero_pangde.png",
  马岱: "hero_icon/hero_madai.png",
  廖化: "hero_icon/hero_liaohua.png",
  马云禄: "hero_icon/hero_mayunlu.png",
  诸葛瑾: "hero_icon/hero_zhugejin.png",
  韩当: "hero_icon/hero_handang.png",
  华雄: "hero_icon/hero_huaxiong.png",
  陈宫: "hero_icon/hero_chengong.png",
  左慈: "hero_icon/hero_zuoci.png",
  夏侯渊: "hero_icon/hero_xiahouyuan.png",
  于禁: "hero_icon/hero_yujin.png",
  魏延: "hero_icon/hero_weiyan.png",
  黄忠: "hero_icon/hero_huangzhong.png",
  程普: "hero_icon/hero_chengpu.png",
  小乔: "hero_icon/hero_xiaoqiao.png",
  黄盖: "hero_icon/hero_huanggai.png",
  颜良: "hero_icon/hero_yanliang.png",
  汉献帝: "hero_icon/hero_hanxiandi.png",
  貂蝉: "hero_icon/hero_diaochan.png",
  夏侯惇: "hero_icon/hero_xiahoudun.png",
  乐进: "hero_icon/hero_yuejin.png",
  徐晃: "hero_icon/hero_xuhuang.png",
  张飞: "hero_icon/hero_zhangfei.png",
  徐庶: "hero_icon/hero_xushu.png",
  太史慈: "hero_icon/hero_taishici.png",
  周泰: "hero_icon/hero_zhoutai.png",
  鲁肃: "hero_icon/hero_lusu.png",
  文丑: "hero_icon/hero_wenchou.png",
  于吉: "hero_icon/hero_yuji.png",
  荀攸: "hero_icon/hero_xunyou.png",
  典韦: "hero_icon/hero_dianwei.png",
  赵云: "hero_icon/hero_zhaoyun.png",
  法正: "hero_icon/hero_fazheng.png",
  孙策: "hero_icon/hero_sunce.png",
  凌统: "hero_icon/hero_lingtong.png",
  吕蒙: "hero_icon/hero_lvmeng.png",
  公孙瓒: "hero_icon/hero_gongsunzan.png",
  张郃: "hero_icon/hero_zhanghe.png",
  司马徽: "hero_icon/hero_simahui.png",
  贾诩: "hero_icon/hero_jiaxu.png",
  郭嘉: "hero_icon/hero_guojia.png",
  张辽: "hero_icon/hero_zhangliao.png",
  马超: "hero_icon/hero_machao.png",
  庞统: "hero_icon/hero_pangtong.png",
  陆逊: "hero_icon/hero_luxun.png",
  甘宁: "hero_icon/hero_ganning.png",
  袁术: "hero_icon/hero_yuanshu.png",
  董卓: "hero_icon/hero_dongzhuo.png",
  华佗: "hero_icon/hero_huatuo.png",
  曹操: "hero_icon/hero_caocao.png",
  荀彧: "hero_icon/hero_xunyu.png",
  刘备: "hero_icon/hero_liubei.png",
  诸葛亮: "hero_icon/hero_zhugeliang.png",
  关羽: "hero_icon/hero_guanyu.png",
  孙权: "hero_icon/hero_sunquan.png",
  周瑜: "hero_icon/hero_zhouyu.png",
  张角: "hero_icon/hero_zhangjiao.png",
  吕布: "hero_icon/hero_lvbu.png",
  袁绍: "hero_icon/hero_yuanshao.png",
  骑兵: "hero_icon/hero_qibing.png",
  重骑兵: "hero_icon/hero_zhongqibing.png",
  白马义从: "hero_icon/hero_qibing.png",
};

const BOND_RULES = {
  魏: {
    name: "魏",
    label: "魏武遗风",
    effectIds: ["bond.wei-death"],
    effects: {
      2: "每阵亡4名魏武将，在己方最前方召唤1名骑兵",
      3: "每阵亡4名魏武将，在己方最前方召唤2名骑兵",
      4: "每阵亡4名魏武将，在己方最前方召唤1名重骑兵",
      5: "每阵亡4名魏武将，在己方最前方召唤2名重骑兵",
    },
  },
  蜀: {
    name: "蜀",
    label: "蜀汉再兴",
    effectIds: ["bond.shu-upgrade"],
    effects: {
      2: "蜀武将升级时，自身获得 +1/+1",
      3: "蜀武将升级时，自身获得 +2/+2",
      4: "蜀武将升级时，使全军 +1/+1",
      5: "蜀武将升级时，使全军 +2/+2",
    },
  },
  吴: {
    name: "吴",
    label: "东吴业火",
    effectIds: ["bond.wu-battle-start"],
    effects: {
      2: "战斗开始时，使随机2名敌军获得灼烧",
      3: "战斗开始时，使最后3名敌军获得灼烧",
      4: "战斗开始时，使敌军全体获得灼烧",
      5: "战斗开始时，使敌军全体获得灼烧；敌军被引燃且当前灼烧被清除后再次获得原灼烧",
    },
  },
  群: {
    name: "群",
    label: "群雄并起",
    effectIds: [],
    effects: {
      2: "回合结束时，最前方的群武将 +1/+1",
      3: "回合结束时，最前方的群武将 +2/+2",
      4: "回合结束时，最前方的群武将 +4/+4",
      5: "回合结束时，最前方的群武将 +8/+8",
    },
  },
};

const DERIVED_CONTENT_DEFINITIONS = [
  {
    id: "heavy-cavalry",
    name: "重骑兵",
    kind: "衍生单位",
    keywords: ["重骑兵"],
    attack: 5,
    health: 5,
    description: "攻击前，自身 +（2/2）",
    internalRules: "拥有魏羁绊；自身每次攻击前按当前等级获得属性，1/2/3级分别 +2/+2、+4/+4、+6/+6",
    effectId: "summon.heavy-cavalry-growth",
    skill: "[衍生技] 攻击前，自身 +（2/2）",
  },
  {
    id: "cavalry",
    name: "骑兵",
    kind: "衍生单位",
    keywords: ["骑兵"],
    attack: 2,
    health: 1,
    description: "无技能",
    internalRules: "继承召唤者的基础阵营。马云禄召唤时等级随马云禄，1/2/3 级分别为 2/1、4/2、6/3",
    effectId: null,
    skill: "[无技能] 该衍生单位没有武将技能",
  },
  {
    id: "white-horse",
    name: "白马义从",
    kind: "衍生单位",
    keywords: ["白马义从"],
    attack: 4,
    health: 4,
    description: "攻击前，对生命值最低的敌军造成（4）点伤害",
    internalRules: "等级等于召唤者等级；基础攻血和技能伤害都随等级缩放；继承召唤者的全部当前羁绊",
    effectId: "summon.white-horse-attack",
    skill: "[白马突袭] 攻击前，对生命值最低的敌军造成（4）点伤害",
  },
  {
    id: "fangshi",
    name: "方士",
    kind: "衍生单位",
    keywords: ["方士"],
    attack: 1,
    health: 1,
    description: "阵亡时，使随机 1 名友军 +（3/3）",
    internalRules: "等级等于于吉等级；在于吉阵亡前的原位置召唤；继承于吉的全部当前羁绊",
    effectId: "summon.fangshi-death",
    skill: "[方术遗泽] 阵亡时，使随机 1 名友军 +（3/3）",
  },
  {
    id: "imperial-edict",
    name: "诏书",
    kind: "衍生装备",
    keywords: ["诏书"],
    description: "抵挡最多 10 点伤害，或阻止 1 次负面状态并清空状态槽；生效后消失",
  },
  {
    id: "imperial-jade-seal",
    name: "传国玉玺",
    kind: "衍生装备",
    keywords: ["传国玉玺"],
    description: "阵亡时，使商店中自身羁绊武将永久 +1/+1",
  },
  {
    id: "burn",
    name: STATUS_LABELS.burn,
    kind: "负面状态",
    keywords: [STATUS_LABELS.burn],
    description: "每次任意普通攻击完成后受到 1 点真实伤害",
  },
  {
    id: "ignite",
    name: "引燃",
    kind: "状态机制",
    keywords: ["引燃"],
    description: "已有灼烧的单位再次获得任意负面状态时触发 6 点真实伤害",
  },
  {
    id: "broken-morale",
    name: STATUS_LABELS["broken-morale"],
    kind: "负面状态",
    keywords: [STATUS_LABELS["broken-morale"]],
    description: STATUS_DESCRIPTIONS["broken-morale"],
  },
  {
    id: "fear",
    name: STATUS_LABELS.fear,
    kind: "负面状态",
    keywords: [STATUS_LABELS.fear],
    description: STATUS_DESCRIPTIONS.fear,
  },
  {
    id: "chain",
    name: STATUS_LABELS.chain,
    kind: "负面状态",
    keywords: [STATUS_LABELS.chain],
    description: STATUS_DESCRIPTIONS.chain,
  },
  {
    id: "intimidated",
    name: STATUS_LABELS.intimidated,
    kind: "负面状态",
    keywords: [STATUS_LABELS.intimidated],
    description: STATUS_DESCRIPTIONS.intimidated,
  },
  {
    id: "counterplot",
    name: STATUS_LABELS.counterplot,
    kind: "负面状态",
    keywords: [STATUS_LABELS.counterplot],
    description: STATUS_DESCRIPTIONS.counterplot,
  },
  {
    id: "skill-disabled",
    name: STATUS_LABELS["skill-disabled"],
    kind: "独立战斗效果",
    keywords: [STATUS_LABELS["skill-disabled"], "本轮无法触发技能"],
    description: STATUS_DESCRIPTIONS["skill-disabled"],
  },
  {
    id: "unparalleled",
    name: STATUS_LABELS.unparalleled,
    kind: "正面状态",
    keywords: [STATUS_LABELS.unparalleled],
    description: STATUS_DESCRIPTIONS.unparalleled,
  },
  {
    id: "rest",
    name: STATUS_LABELS.rest,
    kind: "正面状态",
    keywords: [STATUS_LABELS.rest],
    description: STATUS_DESCRIPTIONS.rest,
  },
  {
    id: "negative-status",
    name: "负面状态",
    kind: "状态集合",
    keywords: ["负面状态"],
    description: "灼烧、破胆、畏惧、连锁、震慑与反间共用一个状态槽，新状态会覆盖旧状态；技能禁用是独立效果",
  },
];

const DERIVED_CONTENT_ENTRY_BY_KEYWORD = new Map(
  DERIVED_CONTENT_DEFINITIONS.flatMap((entry) =>
    entry.keywords.map((keyword) => [keyword, entry]),
  ),
);
const DERIVED_CONTENT_KEYWORD_PATTERN = new RegExp(
  [...DERIVED_CONTENT_ENTRY_BY_KEYWORD.keys()]
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp)
    .join("|"),
  "g",
);

const DERIVED_UNIT_DEFINITION_BY_NAME = Object.fromEntries(
  DERIVED_CONTENT_DEFINITIONS
    .filter((entry) => entry.kind === "衍生单位")
    .map((entry) => [entry.name, entry]),
);

function defineHeroEffect(trigger, target, data = {}, conditions = {}) {
  const triggers = Array.isArray(trigger) ? trigger : null;
  return {
    sourceType: "hero",
    ...(triggers ? { triggers } : { trigger }),
    target,
    priority: 0,
    conditions,
    operations: [{ type: "resolve-hero-skill", ...data }],
  };
}

const HERO_EFFECT_DEFINITIONS = {
  "hero.zhenji.luoshen": defineHeroEffect("unit:summon", "summoned-ally"),
  "hero.pangde.xunjie": defineHeroEffect("unit:death", "nearest-ally-behind"),
  "hero.huangzhong.laodang-yizhuang": defineHeroEffect("attack:after", "owner"),
  "hero.liaohua.sujiang": defineHeroEffect("experience:gain", "experienced-ally"),
  "hero.mayunlu.xiliang-lienv": defineHeroEffect("unit:death", "ahead-of-owner"),
  "hero.zhugejin.hongya": defineHeroEffect("round:end", "random-other-ally"),
  "hero.huanggai.kurouji": defineHeroEffect("damage:after", "random-enemies"),
  "hero.huaxiong.xiaoyong": defineHeroEffect("battle:start", "front-enemies"),
  "hero.chengong.baiji-duomou": defineHeroEffect("unit:recruit", "nearest-ally-ahead"),
  "hero.zuoci.bianhuan-moce": defineHeroEffect("unit:sell", "adjacent-allies"),
  "hero.xiahouyuan.qianli-benxi": defineHeroEffect("attack:after", "ahead-of-owner"),
  "hero.yujin.junji-yanming": defineHeroEffect("round:end", "nearest-allies-ahead"),
  "hero.weiyan.caigao-qilie": defineHeroEffect("unit:death", "owner"),
  "hero.madai.fuzhan": defineHeroEffect("round:end", "nearest-ally-ahead"),
  "hero.chengpu.yuanxun": defineHeroEffect("unit:recruit", "nearest-ally-ahead"),
  "hero.xiaoqiao.huaron-yuemao": defineHeroEffect("attack:after", "nearest-ally-ahead"),
  "hero.handang.zuoyou-kaigong": defineHeroEffect("attack:before", "random-debuffed-enemy"),
  "hero.wenchou.yongguan-sanjun": defineHeroEffect("attack:after", "owner"),
  "hero.hanxiandi.piaoyao": defineHeroEffect("unit:death", "random-unequipped-ally"),
  "hero.diaochan.qingcheng": defineHeroEffect("attack:after", "random-enemies"),
  "hero.xiahoudun.gangyong": defineHeroEffect("damage:after", "nearest-ally-behind"),
  "hero.yuejin.xiandeng-xianzhen": defineHeroEffect("unit:death", "front-ally"),
  "hero.xuhuang.changqu-zhiru": defineHeroEffect("attack:after", "last-enemy"),
  "hero.zhangfei.yanren-paoxiao": defineHeroEffect("battle:start", "front-enemies"),
  "hero.xushu.jiancai": defineHeroEffect("battle:start", "nearest-ally-ahead"),
  "hero.taishici.jianwu-xufa": defineHeroEffect("battle:start", "highest-health-enemy"),
  "hero.zhoutai.roushen-tiebi": defineHeroEffect("damage:before", "owner"),
  "hero.lusu.lianhe": defineHeroEffect("round:start", "player"),
  "hero.yanliang.yongguan-sanjun": defineHeroEffect("unit:death", "owner"),
  "hero.yuji.guhuo": defineHeroEffect("unit:death", "owner-death-position"),
  "hero.xunyou.qice": defineHeroEffect("stratagem:use", "adjacent-allies"),
  "hero.dianwei.guzhi-elai": defineHeroEffect(
    ["battle:start", "unit:death"],
    "consumed-unit-death-position",
  ),
  "hero.zhaoyun.longdan": defineHeroEffect("unit:upgrade", "owner"),
  "hero.fazheng.yiyi-dailao": defineHeroEffect("battle:start", "nearest-ally-behind"),
  "hero.sunce.jiangdong-bawang": defineHeroEffect("battle:start", "owner"),
  "hero.lingtong.guoshi-zhifeng": defineHeroEffect("unit:recruit", "recruited-ally"),
  "hero.lvmeng.baiyi-dujiang": defineHeroEffect("attack:before", "front-enemies"),
  "hero.dongzhuo.baonue": defineHeroEffect("round:end", "random-nonbond-ally"),
  "hero.zhanghe.qiaobian": defineHeroEffect("unit:death", "ahead-of-owner"),
  "hero.simahui.guangshi": defineHeroEffect("card:purchase", "selected-ally-and-bond"),
  "hero.jiaxu.fanjian": defineHeroEffect("battle:start", "random-enemies"),
  "hero.guojia.yiji-pingliao": defineHeroEffect("unit:death", "all-shared-bond-allies"),
  "hero.zhangliao.weizhen-xiaoyao": defineHeroEffect("battle:start", "all-enemies"),
  "hero.machao.pozhen": defineHeroEffect("attack:before", "owner"),
  "hero.pangtong.tiesuo-lianhuan": defineHeroEffect("battle:start", "random-enemies"),
  "hero.luxun.huoshao-lianying": defineHeroEffect("attack:after", "all-burned-enemies"),
  "hero.ganning.baiqi-jieying": defineHeroEffect("battle:start", "last-enemy"),
  "hero.yuanshu.yuxi": defineHeroEffect("unit:summon", "owner"),
  "hero.gongsunzan.baima-yicong": defineHeroEffect("unit:death", "ahead-of-owner"),
  "hero.huatuo.jijiu": defineHeroEffect("unit:death", "ahead-of-dead-target"),
  "hero.caocao.jianxiong": defineHeroEffect("unit:death", "random-other-ally"),
  "hero.xunyu.wangzuo-zhicai": defineHeroEffect("unit:summon", "summoned-shared-bond-ally"),
  "hero.liubei.renze": defineHeroEffect("unit:summon", "summoned-shared-bond-ally"),
  "hero.zhugeliang.yunchou": defineHeroEffect("attack:after", "random-enemy"),
  "hero.guanyu.weizhen-huaxia": defineHeroEffect("attack:after", "front-enemies"),
  "hero.sunquan.quanheng": defineHeroEffect("round:end", "nearest-shared-bond-allies"),
  "hero.zhouyu.fengzhu-huoshi": defineHeroEffect("damage:before", "enemy-burn-damage"),
  "hero.zhangjiao.wulei-hongding": defineHeroEffect("battle:start", "random-enemy"),
  "hero.lvbu.tianxia-wushuang": defineHeroEffect("attack:before", "owner"),
  "hero.yuanshao.haoling-qunxiong": defineHeroEffect("unit:recruit", "all-allies"),
  "summon.white-horse-attack": defineHeroEffect("attack:before", "lowest-health-enemy"),
  "summon.fangshi-death": defineHeroEffect("unit:death", "random-other-ally"),
};
HERO_EFFECT_DEFINITIONS["hero.zhouyu.fengzhu-huoshi"].priority = 440;

const EFFECT_DEFINITIONS = {
  ...HERO_EFFECT_DEFINITIONS,
  "stratagem.encourage": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "selected-unit",
    priority: 0,
    operations: [{ type: "modify-body-stats", attack: 1, health: 1 }],
  },
  "stratagem.temporary-bond": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "selected-unit-and-bond",
    priority: 0,
    operations: [{ type: "add-extra-bond", temporary: true }],
  },
  "stratagem.recommend-talent": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "random-unit-in-highest-bond",
    priority: 0,
    operations: [
      { type: "buff-random-highest-bond", count: 1, attack: 2, health: 2 },
    ],
  },
  "stratagem.advance-together": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "frontmost-units-in-highest-bond",
    priority: 0,
    operations: [
      { type: "buff-frontmost-highest-bond", count: 2, attack: 1, health: 1 },
    ],
  },
  "stratagem.hidden-potential": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "all-units-in-inactive-bonds",
    priority: 0,
    operations: [{ type: "buff-inactive-bonds", attack: 2, health: 2 }],
  },
  "stratagem.train-army": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "shop-units-in-selected-bond",
    priority: 0,
    operations: [{ type: "buff-shop-selected-bond", attack: 2, health: 2 }],
  },
  "stratagem.blood-oath": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "selected-unit",
    priority: 0,
    operations: [{ type: "modify-body-stats", attack: 3, health: 3 }],
  },
  "stratagem.united-force": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "all-units-in-highest-bond",
    priority: 0,
    operations: [{ type: "buff-all-highest-bond", attack: 1, health: 2 }],
  },
  "stratagem.master-guidance": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "selected-unit",
    priority: 0,
    operations: [{ type: "grant-experience", amount: 1 }],
  },
  "stratagem.gather-strength": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "selected-unit",
    priority: 0,
    operations: [
      {
        type: "scaling-body-stats",
        baseAttack: 4,
        baseHealth: 4,
        attackPerPriorUse: 1,
        healthPerPriorUse: 1,
      },
    ],
  },
  "reward.military-funds": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "player",
    priority: 0,
    operations: [{ type: "gain-gold", amount: 12 }],
  },
  "reward.ready-army": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "shop",
    priority: 0,
    operations: [{ type: "generate-shop-cards", names: ["聚势强军", "聚势强军"] }],
  },
  "reward.united-bond": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "highest-bond",
    priority: 0,
    operations: [{ type: "unlock-five-person-bond" }],
  },
  "reward.alliance-pacts": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "shop",
    priority: 0,
    operations: [{ type: "generate-shop-cards", names: ["盟书", "盟书", "盟书"] }],
  },
  "reward.alliance-scroll": {
    sourceType: "stratagem",
    trigger: "stratagem:use",
    target: "selected-unit-and-bond",
    priority: 0,
    operations: [{ type: "add-extra-bond", temporary: false }],
  },
  "equipment.iron-armor": {
    sourceType: "equipment",
    trigger: "damage:before",
    target: "owner",
    priority: 100,
    conditions: {
      damageTypes: ["attack", "skill"],
      targetIsOwner: true,
    },
    operations: [{ type: "modify-damage", amount: -2, minimum: 0 }],
  },
  "equipment.initiative-flag": {
    sourceType: "equipment",
    trigger: "battle:start",
    target: "owner",
    priority: 100,
    operations: [{ type: "announce-equipment-ready" }],
  },
  "equipment.cavalry-talisman": {
    sourceType: "equipment",
    trigger: "unit:death",
    target: "owner-side-front",
    priority: 0,
    conditions: {
      eventUnitIsOwner: true,
    },
    operations: [{ type: "summon-cavalry", count: 1, attack: 2, health: 1, position: "front" }],
  },
  "equipment.calamity-blade": {
    sourceType: "equipment",
    trigger: "attack:after",
    target: "enemy-front",
    priority: 0,
    conditions: {
      ownerIsAttacker: true,
    },
    operations: [{ type: "apply-random-negative-status" }],
  },
  "equipment.iron-shield": {
    sourceType: "equipment",
    trigger: "damage:before",
    target: "owner",
    priority: 225,
    conditions: { targetIsOwner: true },
    operations: [{ type: "block-damage-with-charges", amount: 10, charges: 1 }],
  },
  "equipment.commander-seal": {
    sourceType: "equipment",
    trigger: "unit:summon",
    target: "allied-summoned-unit",
    priority: 0,
    operations: [{ type: "buff-allied-summon", attack: 1, health: 1 }],
  },
  "equipment.tiger-tally": {
    sourceType: "equipment",
    trigger: "battle:start",
    target: "owner",
    priority: 0,
    operations: [{ type: "tiger-tally-opening", attack: 3, health: 3, experience: 1 }],
  },
  "equipment.dragon-square-pot": {
    sourceType: "equipment",
    trigger: "round:end",
    target: "owner",
    priority: 0,
    operations: [{ type: "grow-without-active-bond", attack: 2, health: 2 }],
  },
  "equipment.white-jade-turtle": {
    sourceType: "equipment",
    trigger: "status:apply",
    target: "owner",
    priority: 300,
    operations: [{ type: "cleanse-negative-and-grow", attack: 2, health: 2 }],
  },
  "equipment.yanmo-sail": {
    sourceType: "equipment",
    trigger: "unit:death",
    target: "owner-death-position",
    priority: 300,
    conditions: { eventUnitIsOwner: true },
    operations: [{ type: "revive-without-equipment", attack: 5, health: 5 }],
  },
  "equipment.fangtian-halberd": {
    sourceType: "equipment",
    trigger: "damage:before",
    target: "owner-attack-exchange",
    priority: 325,
    operations: [{ type: "fangtian-attack-modifier", ratio: 0.3 }],
  },
  "equipment.yellow-heaven-banner": {
    sourceType: "equipment",
    trigger: "damage:before",
    target: "owner-skill-damage",
    priority: 325,
    conditions: { damageTypes: ["skill"], sourceIsOwner: true },
    operations: [{ type: "add-attack-ratio-damage", ratio: 0.2 }],
  },
  "equipment.blood-armor": {
    sourceType: "equipment",
    triggers: ["status:apply", "damage:after"],
    target: "owner",
    priority: 0,
    operations: [{ type: "grow-when-hurt-or-debuffed", attack: 2, health: 2 }],
  },
  "equipment.imperial-jade-seal": {
    sourceType: "equipment",
    trigger: "unit:death",
    target: "shop-bond-units",
    priority: 0,
    conditions: {
      eventUnitIsOwner: true,
    },
    operations: [{ type: "resolve-imperial-jade-seal-death" }],
  },
  "equipment.imperial-edict": {
    sourceType: "equipment",
    trigger: "damage:before",
    target: "owner",
    priority: 250,
    conditions: {
      targetIsOwner: true,
    },
    operations: [{ type: "block-damage-with-charges", amount: 10, charges: 1 }],
  },
  "equipment.black-tortoise-shield": {
    sourceType: "equipment",
    trigger: "damage:before",
    target: "owner",
    priority: 200,
    conditions: {
      damageTypes: ["attack", "skill"],
      targetIsOwner: true,
    },
    operations: [{ type: "block-damage-with-charges", amount: 10, charges: 2 }],
  },
  "equipment.siege-crossbow": {
    sourceType: "equipment",
    trigger: "damage:before",
    target: "owner-attack-damage",
    priority: 300,
    conditions: {
      damageTypes: ["attack"],
      sourceIsOwner: true,
    },
    operations: [{ type: "increase-damage-with-charges", amount: 20, charges: 1 }],
  },
  "bond.wei-death": {
    sourceType: "bond",
    trigger: "unit:death",
    target: "allied-death",
    priority: 10,
    operations: [{ type: "resolve-wei-death" }],
  },
  "bond.shu-upgrade": {
    sourceType: "bond",
    trigger: "unit:upgrade",
    target: "allied-upgrade",
    priority: 10,
    operations: [{ type: "resolve-shu-upgrade" }],
  },
  "bond.wu-battle-start": {
    sourceType: "bond",
    trigger: "battle:start",
    target: "enemy-team",
    priority: WU_OPENING_BURN_PRIORITY,
    operations: [{ type: "apply-wu-opening-burn" }],
  },
  "status.burn-tick": {
    sourceType: "status",
    trigger: "attack:after",
    target: "all-burned-units",
    priority: -100,
    operations: [{ type: "resolve-burn-tick" }],
  },
  "status.rest-recovery": {
    sourceType: "status",
    trigger: "attack:after",
    target: "resting-units",
    priority: -90,
    operations: [{ type: "resolve-rest-recovery" }],
  },
  "status.broken-morale-damage": {
    sourceType: "status",
    trigger: "damage:before",
    target: "broken-morale-target",
    priority: 450,
    operations: [{ type: "resolve-broken-morale-damage" }],
  },
  "status.fear-damage": {
    sourceType: "status",
    trigger: "damage:before",
    target: "fear-source",
    priority: 450,
    operations: [{ type: "resolve-fear-damage" }],
  },
  "status.intimidated-damage": {
    sourceType: "status",
    trigger: "damage:before",
    target: "intimidated-source",
    priority: 500,
    operations: [{ type: "resolve-intimidated-damage" }],
  },
  "status.unparalleled-cleave": {
    sourceType: "status",
    trigger: "attack:after",
    target: "units-behind-attack-target",
    priority: -80,
    operations: [{ type: "resolve-unparalleled-cleave" }],
  },
  "status.counterplot-revive": {
    sourceType: "status",
    trigger: "unit:death",
    target: "counterplot-owner-side-front",
    priority: 20,
    operations: [{ type: "resolve-counterplot-revive" }],
  },
  "summon.heavy-cavalry-growth": {
    sourceType: "hero",
    trigger: "attack:before",
    target: "owner",
    priority: 0,
    conditions: {
      ownerIsAttacker: true,
    },
    operations: [
      {
        type: "modify-battle-unit-stats",
        attack: 2,
        health: 2,
        scaleWithOwnerLevel: true,
      },
    ],
  },
};

const CARD_POOLS = {
  hero: window.GAME_DATA.heroes,
  stratagem: window.GAME_DATA.items,
};

const codexFilters = {
  type: "全部",
  tier: "全部",
  faction: "全部",
};

let state = createInitialState();
let toastTimer = 0;
let pointerDraggedShopIndex = null;
let pointerDraggedLineupIndex = null;
let pointerDraggedEquipmentIndex = null;
let pointerMoved = false;
let lineupDragDirection = 0;
let lineupDragDirectionAnchorX = null;
let dragPreviewElement = null;
let dragPreviewOrigin = null;
let queuedShopSkillAnimations = [];
let queuedShopBonusAnimations = [];
let queuedShopUpgradeAnimations = [];
let shopPresentationSequence = 0;
let shopPresentationTimer = 0;
let pendingEndTurnReportEntries = [];
let resolvingEndTurn = false;
const bondSelectionHintSources = new Map();
let previousRenderedBondEffectCounts = null;
let queuedBondUpgradeCelebrations = [];
let bondUpgradeAnimationTimer = 0;
let battleAnimationTimer = 0;
let battleAnimationPlaybackSpeed = BATTLE_ANIMATION_SPEEDS[0];

const elements = {
  loadingScreen: document.querySelector("#loadingScreen"),
  loadingStatus: document.querySelector("#loadingStatus"),
  loadingProgressTrack: document.querySelector("#loadingProgressTrack"),
  loadingProgressBar: document.querySelector("#loadingProgressBar"),
  loadingPercent: document.querySelector("#loadingPercent"),
  loadingCount: document.querySelector("#loadingCount"),
  loadingActions: document.querySelector("#loadingActions"),
  loadingRetryButton: document.querySelector("#loadingRetryButton"),
  loadingContinueButton: document.querySelector("#loadingContinueButton"),
  gameViewport: document.querySelector("#gameViewport"),
  roundText: document.querySelector("#roundText"),
  phaseText: document.querySelector("#phaseText"),
  tierText: document.querySelector("#tierText"),
  shopTipText: document.querySelector("#shopTipText"),
  goldText: document.querySelector("#goldText"),
  lifeText: document.querySelector("#lifeText"),
  flagText: document.querySelector("#flagText"),
  refreshButton: document.querySelector("#refreshButton"),
  endTurnButton: document.querySelector("#endTurnButton"),
  codexButton: document.querySelector("#codexButton"),
  fullscreenButton: document.querySelector("#fullscreenButton"),
  codexOverlay: document.querySelector("#codexOverlay"),
  codexCloseButton: document.querySelector("#codexCloseButton"),
  codexTypeFilters: document.querySelector("#codexTypeFilters"),
  codexTierFilters: document.querySelector("#codexTierFilters"),
  codexFactionFilterGroup: document.querySelector("#codexFactionFilterGroup"),
  codexFactionFilters: document.querySelector("#codexFactionFilters"),
  codexCount: document.querySelector("#codexCount"),
  codexGrid: document.querySelector("#codexGrid"),
  shopGrid: document.querySelector("#shopGrid"),
  sellZone: document.querySelector("#sellZone"),
  lineupGrid: document.querySelector("#lineupGrid"),
  bondList: document.querySelector("#bondList"),
  logList: document.querySelector("#logList"),
  toast: document.querySelector("#toast"),
  flowShop: document.querySelector("#flowShop"),
  flowBattle: document.querySelector("#flowBattle"),
  flowNext: document.querySelector("#flowNext"),
  battleOverlay: document.querySelector("#battleOverlay"),
  battleTitle: document.querySelector("#battleTitle"),
  battleSummary: document.querySelector("#battleSummary"),
  battleTeams: document.querySelector("#battleTeams"),
  battleLog: document.querySelector("#battleLog"),
  battleAnimationTab: document.querySelector("#battleAnimationTab"),
  battleReportTab: document.querySelector("#battleReportTab"),
  battleAnimation: document.querySelector("#battleAnimation"),
  battleAnimationPhase: document.querySelector("#battleAnimationPhase"),
  battleAnimationProgress: document.querySelector("#battleAnimationProgress"),
  battleAnimationStage: document.querySelector("#battleAnimationStage"),
  battleAnimationEvents: document.querySelector("#battleAnimationEvents"),
  battleAnimationSpeed: document.querySelector("#battleAnimationSpeed"),
  battleAnimationSpeedValue: document.querySelector("#battleAnimationSpeedValue"),
  battleAnimationPrevious: document.querySelector("#battleAnimationPrevious"),
  battleAnimationPlay: document.querySelector("#battleAnimationPlay"),
  battleAnimationFastForward: document.querySelector("#battleAnimationFastForward"),
  battleAnimationNext: document.querySelector("#battleAnimationNext"),
  battleAnimationReplay: document.querySelector("#battleAnimationReplay"),
  battleAnimationSkip: document.querySelector("#battleAnimationSkip"),
  battleLineupPanel: document.querySelector("#battleLineupPanel"),
  battleLineupHint: document.querySelector("#battleLineupHint"),
  nextExchangeButton: document.querySelector("#nextExchangeButton"),
  continueButton: document.querySelector("#continueButton"),
  gameResultOverlay: document.querySelector("#gameResultOverlay"),
  gameResultDialog: document.querySelector("#gameResultDialog"),
  gameResultKicker: document.querySelector("#gameResultKicker"),
  gameResultTitle: document.querySelector("#gameResultTitle"),
  gameResultMessage: document.querySelector("#gameResultMessage"),
  gameResultSeal: document.querySelector("#gameResultSeal"),
  gameResultStats: document.querySelector("#gameResultStats"),
  gameResultLineup: document.querySelector("#gameResultLineup"),
  gameResultBondSummary: document.querySelector("#gameResultBondSummary"),
  gameResultRestartButton: document.querySelector("#gameResultRestartButton"),
  rewardOverlay: document.querySelector("#rewardOverlay"),
  rewardOptions: document.querySelector("#rewardOptions"),
  rewardSkipButton: document.querySelector("#rewardSkipButton"),
  shopStage: document.querySelector(".shop-stage"),
  roundRewardOverlay: document.querySelector("#roundRewardOverlay"),
  roundRewardTitle: document.querySelector("#roundRewardTitle"),
  roundRewardOptions: document.querySelector("#roundRewardOptions"),
  roundRewardCollapseButton: document.querySelector("#roundRewardCollapseButton"),
  roundRewardCollapsedBar: document.querySelector("#roundRewardCollapsedBar"),
  roundRewardExpandButton: document.querySelector("#roundRewardExpandButton"),
  stratagemChoiceOverlay: document.querySelector("#stratagemChoiceOverlay"),
  stratagemChoiceTitle: document.querySelector("#stratagemChoiceTitle"),
  stratagemChoiceDescription: document.querySelector("#stratagemChoiceDescription"),
  stratagemChoiceOptions: document.querySelector("#stratagemChoiceOptions"),
  stratagemChoiceCancelButton: document.querySelector("#stratagemChoiceCancelButton"),
};

const RUNTIME_IMAGE_ASSETS = [
  "res/HeroCard/star.png",
  "res/ShopPanel/exp-bar-base.png",
  "res/ShopPanel/exp-bar-fill.png",
  "res/HeroCard/coin_no_diamond_preview2.png",
  "res/HeroCard/wave.png",
  "res/HeroCard/atk_bk.png",
  "res/HeroCard/hp_bk.png",
  "res/item_icon/50100010.png",
  "res/StatIcon/attack.png",
  "res/StatIcon/experience.png",
  "res/StatIcon/health.png",
];
const ASSET_LOAD_TIMEOUT = 30000;
let failedAssetUrls = [];
let applicationStarted = false;

function normalizeAssetUrl(assetUrl, baseUrl = document.baseURI) {
  if (!assetUrl || assetUrl.startsWith("data:")) return "";
  try {
    return new URL(assetUrl, baseUrl).href;
  } catch (error) {
    console.warn("无法识别资源地址：", assetUrl, error);
    return "";
  }
}

function collectCssAssetUrls() {
  const assetUrls = [];
  const collectFromRules = (rules, baseUrl) => {
    Array.from(rules ?? []).forEach((rule) => {
      const cssText = rule.cssText ?? "";
      const urlPattern = /url\(\s*(['"]?)(.*?)\1\s*\)/giu;
      for (const match of cssText.matchAll(urlPattern)) {
        assetUrls.push(normalizeAssetUrl(match[2], baseUrl));
      }
      if (rule.cssRules) collectFromRules(rule.cssRules, baseUrl);
    });
  };

  Array.from(document.styleSheets).forEach((styleSheet) => {
    try {
      collectFromRules(styleSheet.cssRules, styleSheet.href || document.baseURI);
    } catch (error) {
      console.warn("无法读取样式表中的资源列表：", styleSheet.href, error);
    }
  });
  return assetUrls;
}

function collectGameAssetUrls() {
  const htmlImages = Array.from(document.images, (image) => image.currentSrc || image.src);
  const heroImages = Object.values(HERO_IMAGE_BY_NAME);
  const cardImages = Object.values(CARD_POOLS)
    .flat()
    .map((card) => card.image)
    .filter(Boolean);
  return Array.from(
    new Set(
      [
        ...htmlImages,
        ...collectCssAssetUrls(),
        ...heroImages,
        ...cardImages,
        ...RUNTIME_IMAGE_ASSETS,
      ]
        .map((assetUrl) => normalizeAssetUrl(assetUrl))
        .filter(Boolean),
    ),
  );
}

function updateLoadingProgress(completed, total, status = "正在加载图片资源…") {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 100;
  if (elements.loadingStatus) elements.loadingStatus.textContent = status;
  if (elements.loadingProgressBar) elements.loadingProgressBar.style.width = `${percent}%`;
  if (elements.loadingPercent) elements.loadingPercent.textContent = `${percent}%`;
  if (elements.loadingCount) {
    elements.loadingCount.textContent = total > 0 ? `${completed} / ${total}` : "无需加载";
  }
  elements.loadingProgressTrack?.setAttribute("aria-valuenow", String(percent));
}

function loadImageAsset(assetUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      image.onload = null;
      image.onerror = null;
      resolve({ url: assetUrl, ok });
    };
    const timeoutId = window.setTimeout(() => finish(false), ASSET_LOAD_TIMEOUT);
    image.decoding = "async";
    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.src = assetUrl;
    if (image.complete) finish(image.naturalWidth > 0);
  });
}

async function preloadGameAssets(assetUrls = collectGameAssetUrls()) {
  const uniqueUrls = Array.from(new Set(assetUrls.filter(Boolean)));
  let completed = 0;
  updateLoadingProgress(0, uniqueUrls.length);
  const results = await Promise.all(
    uniqueUrls.map(async (assetUrl) => {
      const result = await loadImageAsset(assetUrl);
      completed += 1;
      updateLoadingProgress(completed, uniqueUrls.length);
      return result;
    }),
  );
  return results.filter((result) => !result.ok).map((result) => result.url);
}

function revealApplication({ withMissingAssets = false } = {}) {
  if (applicationStarted) return;
  applicationStarted = true;
  refreshShop({ free: true });

  const runtimeSearchParams = new URLSearchParams(window.location.search);
  if (runtimeSearchParams.has("battle-animation-test")) {
    mountBattleAnimationRegressionResults();
  } else if (runtimeSearchParams.has("game-rules-test")) {
    mountGameRuleRegressionResults();
  } else if (runtimeSearchParams.has("battle-animation-preview")) {
    mountBattleAnimationPreview();
  } else if (["victory", "defeat"].includes(runtimeSearchParams.get("game-result-preview"))) {
    mountGameResultPreview(runtimeSearchParams.get("game-result-preview"));
  }

  elements.gameViewport?.removeAttribute("inert");
  elements.gameViewport?.setAttribute("aria-hidden", "false");
  document.body.classList.remove("app-loading");
  elements.loadingScreen?.setAttribute("aria-busy", "false");
  elements.loadingScreen?.classList.add("is-complete");
  if (withMissingAssets) {
    window.setTimeout(() => showToast("部分图片加载失败，已按你的选择继续进入。"), 360);
  }
  window.setTimeout(() => elements.loadingScreen?.remove(), 400);
}

async function startAssetPreload(assetUrls) {
  if (elements.loadingActions) elements.loadingActions.hidden = true;
  elements.loadingScreen?.setAttribute("aria-busy", "true");
  failedAssetUrls = await preloadGameAssets(assetUrls);
  if (failedAssetUrls.length === 0) {
    updateLoadingProgress(1, 1, "资源整备完成，正在进入…");
    window.setTimeout(() => revealApplication(), 180);
    return;
  }

  updateLoadingProgress(
    failedAssetUrls.length,
    failedAssetUrls.length,
    `${failedAssetUrls.length} 项资源加载失败，请重试。`,
  );
  elements.loadingScreen?.setAttribute("aria-busy", "false");
  if (elements.loadingActions) elements.loadingActions.hidden = false;
}

elements.loadingRetryButton?.addEventListener("click", () => {
  playAudioCue("shopRefresh");
  startAssetPreload(failedAssetUrls);
});
elements.loadingContinueButton?.addEventListener("click", () => {
  playAudioCue("uiConfirm");
  revealApplication({ withMissingAssets: true });
});

function isPageFullscreen() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function updateFullscreenButton() {
  const button = elements.fullscreenButton;
  if (!button) return;
  const isFullscreen = isPageFullscreen();
  const label = isFullscreen ? "退出" : "全屏";
  const accessibleLabel = isFullscreen ? "退出全屏" : "进入全屏";
  button.setAttribute("aria-pressed", String(isFullscreen));
  button.setAttribute("aria-label", accessibleLabel);
  button.title = accessibleLabel;
  const labelElement = button.querySelector(".fullscreen-button-label");
  if (labelElement) labelElement.textContent = label;
}

async function togglePageFullscreen() {
  try {
    if (isPageFullscreen()) {
      const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
      await exitFullscreen?.call(document);
    } else {
      const root = document.documentElement;
      const requestFullscreen = root.requestFullscreen || root.webkitRequestFullscreen;
      if (!requestFullscreen) throw new Error("当前浏览器不支持网页全屏");
      await requestFullscreen.call(root);
    }
  } catch (error) {
    console.warn("切换全屏失败：", error);
  }
}

function hasCompleteOpponentRounds(session, roundCount = PLAYER_DATA_TEST_MAX_ROUND) {
  if (
    session?.schemaVersion !== 1 ||
    session?.status !== "completed" ||
    !Array.isArray(session.rounds)
  ) {
    return false;
  }
  const rounds = new Map(session.rounds.map((entry) => [entry?.round, entry]));
  return Array.from({ length: roundCount }, (_, index) => index + 1).every((round) => {
    const entry = rounds.get(round);
    return entry && Array.isArray(entry.lineup) && entry.lineup.length === LINEUP_SLOT_COUNT;
  });
}

function getOpponentDataPool() {
  const source = Array.isArray(window.OPPONENT_DATA_POOL) ? window.OPPONENT_DATA_POOL : [];
  const seenKeys = new Set();
  return source.reduce((pool, entry, index) => {
    const session = entry?.session;
    const key = String(entry?.key ?? session?.id ?? "");
    if (!key || seenKeys.has(key) || !hasCompleteOpponentRounds(session)) return pool;
    seenKeys.add(key);
    pool.push({
      key,
      label: entry?.label ?? `对手数据 ${index + 1}`,
      fileName: entry?.fileName ?? "",
      session,
    });
    return pool;
  }, []);
}

function createOpponentPoolSchedule(
  pool,
  { roundCount = PLAYER_DATA_TEST_MAX_ROUND, random = Math.random } = {},
) {
  if (!Array.isArray(pool) || pool.length < OPPONENT_POOL_MIN_SIZE) return [];

  const schedule = [];
  for (let round = 1; round <= roundCount; round += 1) {
    const recentEntries = schedule.slice(-(OPPONENT_POOL_WINDOW_SIZE - 1));
    const recentCounts = recentEntries.reduce((counts, entry) => {
      counts.set(entry.key, (counts.get(entry.key) ?? 0) + 1);
      return counts;
    }, new Map());
    const previousKey = schedule.at(-1)?.key ?? null;
    const candidates = pool.filter(
      (entry) =>
        entry.key !== previousKey &&
        (recentCounts.get(entry.key) ?? 0) < OPPONENT_POOL_MAX_PER_WINDOW &&
        entry.session.rounds.some((snapshot) => snapshot.round === round),
    );
    if (candidates.length === 0) return [];

    const randomValue = Number(random());
    const normalizedRandom = Number.isFinite(randomValue)
      ? Math.min(1 - Number.EPSILON, Math.max(0, randomValue))
      : 0;
    const selected = candidates[Math.floor(normalizedRandom * candidates.length)];
    schedule.push({
      round,
      key: selected.key,
      label: selected.label,
      fileName: selected.fileName,
    });
  }
  return schedule;
}

function createInitialState() {
  const opponentPool = getOpponentDataPool();
  const opponentSchedule = createOpponentPoolSchedule(opponentPool);
  return {
    round: 1,
    phase: "shop",
    gold: TURN_GOLD,
    life: PLAYER_STARTING_LIFE,
    flags: 0,
    shop: Array.from({ length: SHOP_POSITION_COUNT }, () => null),
    lineup: Array.from({ length: LINEUP_SLOT_COUNT }, () => null),
    logs: [`第 1 回合开始，获得 ${TURN_GOLD} 金币。`],
    serial: 1,
    battle: null,
    pendingRewards: [],
    pendingStratagemUse: null,
    pendingHeroBondChoice: null,
    pendingRoundReward: null,
    roundRewardCollapsed: false,
    unlockedFivePersonBonds: [],
    stratagemUseCounts: {},
    heroBondDefinitions: {},
    shopBondBonuses: Object.fromEntries(
      BOND_FACTIONS.map((faction) => [faction, { attack: 0, health: 0 }]),
    ),
    effectEvents: [],
    gameOver: false,
    gameOutcome: null,
    battleRecord: { wins: 0, losses: 0, draws: 0 },
    playerDataTest: createPlayerDataTestSession({ opponentPool, opponentSchedule }),
    opponentPool,
    opponentSchedule,
  };
}

function getLifeAfterRoundStart(life, round) {
  return round === ROUND_THREE_LIFE_RECOVERY_ROUND
    ? Math.min(PLAYER_MAX_LIFE, life + ROUND_THREE_LIFE_RECOVERY)
    : life;
}

function applyBattleResultToGameState(gameState, result) {
  if (result === "win") {
    gameState.flags = Math.min(FLAG_VICTORY_TARGET, gameState.flags + 1);
    gameState.battleRecord.wins += 1;
  } else if (result === "loss") {
    gameState.life = Math.max(0, gameState.life - 1);
    gameState.battleRecord.losses += 1;
  } else {
    gameState.battleRecord.draws += 1;
  }
}

function getGameOutcome(life, flags) {
  return life <= 0 ? "defeat" : flags >= FLAG_VICTORY_TARGET ? "victory" : null;
}

function createPlayerDataTestSession({ opponentPool = [], opponentSchedule = [] } = {}) {
  const startedAt = new Date().toISOString();
  const fallbackId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    schemaVersion: 1,
    id: window.crypto?.randomUUID?.() ?? fallbackId,
    status: "in_progress",
    startedAt,
    completedAt: null,
    rules: {
      maxRound: PLAYER_DATA_TEST_MAX_ROUND,
      startingLife: PLAYER_STARTING_LIFE,
      maxLife: PLAYER_MAX_LIFE,
      roundThreeLifeRecovery: ROUND_THREE_LIFE_RECOVERY,
      flagVictoryTarget: FLAG_VICTORY_TARGET,
      enemy: {
        source: "opponent-data-pool",
        poolSize: opponentPool.length,
        noConsecutiveRepeat: true,
        windowSize: OPPONENT_POOL_WINDOW_SIZE,
        maxPerWindow: OPPONENT_POOL_MAX_PER_WINDOW,
        fallback: {
          name: "骑兵",
          count: PLAYER_DATA_TEST_ENEMY_COUNT,
          attackFormula: "round * 2.5",
          healthFormula: "round * 2.5",
        },
      },
    },
    opponentSchedule: opponentSchedule.map((entry) => ({ ...entry })),
    operations: [],
    rounds: [],
  };
}

function getStoredPlayerDataTests() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(PLAYER_DATA_TEST_STORAGE_KEY) ?? "{}");
    return {
      schemaVersion: 1,
      updatedAt: stored.updatedAt ?? null,
      sessions: Array.isArray(stored.sessions) ? stored.sessions : [],
    };
  } catch {
    return { schemaVersion: 1, updatedAt: null, sessions: [] };
  }
}

function persistPlayerDataTestSession() {
  const session = state.playerDataTest;
  if (!session) return false;
  try {
    const stored = getStoredPlayerDataTests();
    const existingIndex = stored.sessions.findIndex((entry) => entry.id === session.id);
    const snapshot = JSON.parse(JSON.stringify(session));
    if (existingIndex >= 0) {
      stored.sessions[existingIndex] = snapshot;
    } else {
      stored.sessions.push(snapshot);
    }
    stored.updatedAt = new Date().toISOString();
    window.localStorage.setItem(PLAYER_DATA_TEST_STORAGE_KEY, JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

function getPlayerDataTestUnitSnapshot(unit, slotIndex) {
  if (!unit) {
    return { slot: slotIndex + 1, empty: true };
  }
  const equipment = getUnitEquipment(unit);
  return {
    slot: slotIndex + 1,
    empty: false,
    id: unit.id,
    name: unit.name,
    tier: unit.tier,
    level: unit.level ?? 1,
    experience: unit.experience ?? 0,
    copies: getUnitCopies(unit),
    bonusExperience: unit.bonusExperience ?? 0,
    attack: unit.attack,
    health: unit.health,
    faction: unit.faction,
    extraFactions: [...(unit.extraFactions ?? [])],
    temporaryExtraFactions: [...(unit.tempExtraFactions ?? [])],
    effectiveBonds: getEffectiveUnitBonds(unit),
    skillEffectId: unit.effectId ?? unit.skillEffectIds?.[0] ?? null,
    equipment: equipment
      ? {
          name: equipment.name,
          tier: equipment.tier,
          effectId: equipment.effectId ?? null,
          remainingUses: equipment.remainingUses ?? null,
        }
      : null,
  };
}

function recordCurrentPlayerLineup() {
  const session = state.playerDataTest;
  if (!session || state.round > PLAYER_DATA_TEST_MAX_ROUND) return;
  const roundSnapshot = {
    round: state.round,
    recordedAt: new Date().toISOString(),
    lineup: state.lineup.map(getPlayerDataTestUnitSnapshot),
    bonds: getBondEntries().map((entry) => ({
      faction: entry.faction,
      count: entry.count,
      effectCount: entry.effectCount,
    })),
    unlockedFivePersonBonds: [...(state.unlockedFivePersonBonds ?? [])],
    operations: session.operations
      .filter((entry) => entry.round === state.round)
      .map((entry) => ({ ...entry })),
  };
  const existingIndex = session.rounds.findIndex((entry) => entry.round === state.round);
  if (existingIndex >= 0) {
    session.rounds[existingIndex] = roundSnapshot;
  } else {
    session.rounds.push(roundSnapshot);
    session.rounds.sort((left, right) => left.round - right.round);
  }
  persistPlayerDataTestSession();
}

function exportCompletedPlayerDataTest(session) {
  const blob = new Blob([`${JSON.stringify(session, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `player-lineup-test-${session.id}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function completePlayerDataTestSession() {
  const session = state.playerDataTest;
  if (
    !session ||
    session.status === "completed" ||
    state.round < PLAYER_DATA_TEST_MAX_ROUND
  ) {
    return false;
  }
  session.status = "completed";
  session.completedAt = new Date().toISOString();
  session.finalLife = state.life;
  session.finalFlags = state.flags;
  session.battleRecord = { ...state.battleRecord };
  persistPlayerDataTestSession();
  exportCompletedPlayerDataTest(session);
  return true;
}

function getShopRule(round) {
  return SHOP_PROGRESSION.find((rule) => round <= rule.maxRound) ?? SHOP_PROGRESSION.at(-1);
}

function getTier(round) {
  return getShopRule(round).tier;
}

function isRefreshSlot(index, round) {
  return index >= 0 && index < SHOP_POSITION_COUNT;
}

function createCard(type) {
  const tier = getTier(state.round);
  const pool = CARD_POOLS[type].filter(
    (card) => card.tier <= tier && !card.generatedOnly && !card.rewardOnly,
  );
  const base = pool[Math.floor(Math.random() * pool.length)];
  return createCardFromBase(base, type);
}

function createCardFromBase(base, type) {
  const id = `${type}-${state.serial}`;
  state.serial += 1;
  const isHero = type === "hero";
  const baseAttack = isHero ? (base.baseAttack ?? base.attack) : null;
  const baseHealth = isHero ? (base.baseHealth ?? base.health) : null;
  const intrinsicBodyAttackBonus = isHero
    ? (base.intrinsicBodyAttackBonus ?? base.bodyAttackBonus ?? 0)
    : 0;
  const intrinsicBodyHealthBonus = isHero
    ? (base.intrinsicBodyHealthBonus ?? base.bodyHealthBonus ?? 0)
    : 0;
  const card = {
    ...base,
    id,
    type,
    isLocked: false,
    tier: base.tier ?? getTier(state.round),
    cost:
      base.cost ??
      (type === "hero"
        ? HERO_COST
        : base.category === "计策"
          ? STRATAGEM_COST
          : ITEM_COST),
    ...(isHero
      ? {
          baseAttack,
          baseHealth,
          intrinsicBodyAttackBonus,
          intrinsicBodyHealthBonus,
          shopBondAttackBonus: 0,
          shopBondHealthBonus: 0,
          bodyAttackBonus: intrinsicBodyAttackBonus,
          bodyHealthBonus: intrinsicBodyHealthBonus,
          attack: Math.min(50, baseAttack + intrinsicBodyAttackBonus),
          health: Math.min(50, baseHealth + intrinsicBodyHealthBonus),
        }
      : {}),
    image:
      base.image ??
      (type === "hero" ? HERO_IMAGE_BY_NAME[base.name] ?? "" : "res/item_icon/50100010.png"),
  };
  if (isHero) {
    const definition = getHeroBondDefinition(base.name);
    card.extraFactions = [...definition.extraFactions];
    card.tempExtraFactions = [...definition.tempExtraFactions];
    syncShopHeroCardBonuses(card);
  }
  return card;
}

function compactSharedShopSlots() {
  const heroes = state.shop.filter((card) => card?.type === "hero");
  const items = state.shop.filter((card) => card && card.type !== "hero");
  state.shop = Array.from({ length: SHOP_POSITION_COUNT }, () => null);
  heroes.slice(0, SHOP_POSITION_COUNT).forEach((card, index) => {
    state.shop[index] = card;
  });
  const availableItemCount = Math.min(items.length, SHOP_POSITION_COUNT - heroes.length);
  if (availableItemCount > 0) {
    items.slice(-availableItemCount).forEach((card, index) => {
      state.shop[SHOP_POSITION_COUNT - availableItemCount + index] = card;
    });
  }
}

function addCardsToSharedShop(cards, sourceName = "卡牌") {
  const added = [];
  compactSharedShopSlots();
  cards.filter(Boolean).forEach((card) => {
    const isHero = card.type === "hero";
    let occupiedCount = state.shop.filter(Boolean).length;
    if (occupiedCount >= SHOP_POSITION_COUNT) {
      if (isHero) {
        const itemIndex = state.shop.findLastIndex((entry) => entry && entry.type !== "hero");
        if (itemIndex < 0) {
          addLog(`商店九格均为武将，${card.name}无法进入商店。`);
          return;
        }
        const removed = state.shop[itemIndex];
        state.shop[itemIndex] = null;
        addLog(`商店九格已满：${removed.name}被新增武将卡挤出并移除。`);
      } else {
        const heroIndex = state.shop.findIndex((entry) => entry?.type === "hero");
        if (heroIndex < 0) {
          addLog(`商店九格均为道具，${card.name}无法进入商店。`);
          return;
        }
        const removed = state.shop[heroIndex];
        state.shop[heroIndex] = null;
        addLog(`商店九格已满：${removed.name}被新增道具卡挤出并移除。`);
      }
      compactSharedShopSlots();
      occupiedCount = state.shop.filter(Boolean).length;
    }
    if (occupiedCount >= SHOP_POSITION_COUNT) return;
    if (isHero) {
      const heroCount = state.shop.filter((entry) => entry?.type === "hero").length;
      state.shop[heroCount] = card;
    } else {
      const itemCount = state.shop.filter((entry) => entry && entry.type !== "hero").length;
      state.shop[SHOP_POSITION_COUNT - itemCount - 1] = card;
    }
    added.push(card);
  });
  if (added.length > 0) {
    addLog(`${sourceName}进入商店：${added.map((card) => card.name).join("、")}。`);
  }
  return added;
}

function createFreeShopItemFromBase(base) {
  const card = createCardFromBase({ ...base, cost: 0 }, "stratagem");
  card.rewardItem = true;
  card.isLocked = false;
  return card;
}

function addFreeShopItemsByName(names, sourceName) {
  const cards = names
    .map((name) => CARD_POOLS.stratagem.find((entry) => entry.name === name))
    .filter(Boolean)
    .map(createFreeShopItemFromBase);
  return addCardsToSharedShop(cards, sourceName);
}

function createHeroCardByFaction(faction) {
  const tier = getTier(state.round);
  const unlocked = CARD_POOLS.hero.filter((hero) => hero.tier <= tier);
  const candidates = unlocked.filter((hero) => getBaseUnitBonds(hero).includes(faction));
  const pool = candidates.length > 0 ? candidates : unlocked;
  const base = pool[Math.floor(Math.random() * pool.length)];
  return createCardFromBase(base, "hero");
}

function createUnitFromCard(card) {
  const baseAttack = card.baseAttack ?? card.attack - (card.bodyAttackBonus ?? 0);
  const baseHealth = card.baseHealth ?? card.health - (card.bodyHealthBonus ?? 0);
  const bodyAttack = Math.min(50, baseAttack + (card.bodyAttackBonus ?? 0));
  const bodyHealth = Math.min(50, baseHealth + (card.bodyHealthBonus ?? 0));
  return {
    id: card.id,
    name: card.name,
    faction: card.faction,
    tier: card.tier,
    attack: bodyAttack,
    health: bodyHealth,
    skill: card.skill,
    skillEffectIds: card.effectId ? [card.effectId] : [],
    image: card.image,
    baseAttack,
    baseHealth,
    bodyAttack,
    bodyHealth,
    directModifiers: {
      equipment: null,
      status: null,
      bond: null,
    },
    level: 1,
    experience: 0,
    copies: 1,
    bonusExperience: 0,
    statuses: {},
    extraFactions: [...(card.extraFactions ?? [])],
    tempExtraFactions: [...(card.tempExtraFactions ?? [])],
  };
}

function getUnitProgress(progressValue) {
  if (progressValue >= UNIT_LEVEL_COPY_THRESHOLDS[3]) {
    return { level: 3, experience: 0 };
  }
  if (progressValue >= UNIT_LEVEL_COPY_THRESHOLDS[2]) {
    return {
      level: 2,
      experience: progressValue - UNIT_LEVEL_COPY_THRESHOLDS[2],
    };
  }
  return {
    level: 1,
    experience: progressValue - UNIT_LEVEL_COPY_THRESHOLDS[1],
  };
}

function getExperienceNeeded(level) {
  if (level >= MAX_UNIT_LEVEL) return 0;
  return UNIT_LEVEL_COPY_THRESHOLDS[level + 1] - UNIT_LEVEL_COPY_THRESHOLDS[level];
}

function getUnitCopies(unit) {
  return unit?.copies ?? UNIT_LEVEL_COPY_THRESHOLDS[unit?.level ?? 1];
}

function getUnitProgressValue(unit) {
  return getUnitCopies(unit) + Math.max(0, unit?.bonusExperience ?? 0);
}

function getUnitStackGrowth(unit) {
  return Math.max(0, getUnitProgressValue(unit) - 1);
}

function cloneDirectModifier(modifier) {
  if (Array.isArray(modifier)) return modifier.map(cloneDirectModifier);
  if (!modifier || typeof modifier !== "object") return modifier ?? null;
  return Object.fromEntries(
    Object.entries(modifier).map(([key, value]) => [
      key,
      cloneDirectModifier(value),
    ]),
  );
}

function getUnitEquipment(unit) {
  return unit?.directModifiers?.equipment ?? null;
}

function createEquipmentFromCard(card) {
  return {
    id: card.id,
    name: card.name,
    category: card.category,
    tier: card.tier,
    skill: card.skill,
    effectId: card.effectId ?? null,
    image: card.image,
  };
}

function createGeneratedEquipment(effectId) {
  const definition = CARD_POOLS.stratagem.find((item) => item.effectId === effectId);
  if (!definition) return null;
  const equipment = createEquipmentFromCard({
    ...definition,
    id: `generated-equipment-${state.serial}`,
  });
  state.serial += 1;
  return equipment;
}

function getDirectStatTotals(unit) {
  const total = { attack: 0, health: 0 };
  const collect = (modifier) => {
    if (Array.isArray(modifier)) {
      modifier.forEach(collect);
      return;
    }
    if (!modifier || typeof modifier !== "object") return;
    total.attack += Number.isFinite(modifier.attack) ? modifier.attack : 0;
    total.health += Number.isFinite(modifier.health) ? modifier.health : 0;
  };
  Object.values(unit?.directModifiers ?? {}).forEach(collect);
  return total;
}

function ensureUnitBodyStats(unit) {
  const stackGrowth = getUnitStackGrowth(unit);
  const directStats = getDirectStatTotals(unit);
  if (!Number.isFinite(unit.baseAttack)) unit.baseAttack = unit.attack - stackGrowth - directStats.attack;
  if (!Number.isFinite(unit.baseHealth)) unit.baseHealth = unit.health - stackGrowth - directStats.health;
  if (!Number.isFinite(unit.bodyAttack)) {
    unit.bodyAttack = unit.attack - stackGrowth - directStats.attack;
  }
  if (!Number.isFinite(unit.bodyHealth)) {
    unit.bodyHealth = unit.health - stackGrowth - directStats.health;
  }
}

function syncUnitStats(unit) {
  ensureUnitBodyStats(unit);
  const stackGrowth = getUnitStackGrowth(unit);
  const directStats = getDirectStatTotals(unit);
  unit.attack = Math.min(50, Math.max(1, unit.bodyAttack + stackGrowth + directStats.attack));
  unit.health = Math.min(50, unit.bodyHealth + stackGrowth + directStats.health);
}

function addUnitBodyStats(unit, attack, health) {
  ensureUnitBodyStats(unit);
  unit.bodyAttack += attack;
  unit.bodyHealth += health;
  syncUnitStats(unit);
}

function formatBonusText(attack, health) {
  if (attack > 0 && health > 0) return `+${attack}/${health}`;
  if (attack > 0) return `+${attack} 攻击`;
  if (health > 0) return `+${health} 生命`;
  return "";
}

function getNextShopPresentationSequence() {
  shopPresentationSequence += 1;
  return shopPresentationSequence;
}

function queueShopSkillAnimation(candidate, trigger, explicitSkillName = "") {
  const owner = candidate?.owner;
  if (!owner?.id) return false;
  queuedShopSkillAnimations.push({
    sequence: getNextShopPresentationSequence(),
    unitId: owner.id,
    unitName: owner.name,
    lineupIndex: getShopUnitIndex(owner),
    skillName: explicitSkillName || getHeroSkillName(candidate.effectId, owner),
    triggerName: getEventDisplayName(trigger),
  });
  return true;
}

function queueShopBonusAnimation(unit, attack, health, sourceName = "") {
  const text = formatBonusText(attack, health);
  if (!unit?.id || !text) return false;
  queuedShopBonusAnimations.push({
    sequence: getNextShopPresentationSequence(),
    unitId: unit.id,
    text,
    sourceName,
  });
  return true;
}

function queueShopUpgradeAnimation(unit, level, sourceName = "") {
  if (!unit?.id || !Number.isInteger(level)) return false;
  queuedShopUpgradeAnimations.push({
    sequence: getNextShopPresentationSequence(),
    unitId: unit.id,
    unitName: unit.name,
    level,
    sourceName,
  });
  return true;
}

function applyShopUnitStatBonus(unit, attack, health, sourceName = "") {
  addUnitBodyStats(unit, attack, health);
  return queueShopBonusAnimation(unit, attack, health, sourceName);
}

function revealDeferredUpgradeReward() {
  if (state.phase !== "shop") return;
  const reward = state.pendingRewards.find(
    (entry) =>
      entry.ready === false &&
      (entry.availableRound ?? state.round) <= state.round,
  );
  if (!reward) return;
  reward.ready = true;
  renderRewardChoice();
}

function hasQueuedShopPresentations() {
  return (
    queuedShopSkillAnimations.length > 0 ||
    queuedShopUpgradeAnimations.length > 0 ||
    queuedShopBonusAnimations.length > 0
  );
}

function finishShopPresentationSequence() {
  if (shopPresentationTimer) return;
  if (hasQueuedShopPresentations()) {
    playQueuedShopPresentations();
    return;
  }
  if (resolvingEndTurn && state.phase === "end-turn") {
    resolvingEndTurn = false;
    state.phase = "battle";
    state.gold = 0;
    state.battle = simulateBasicBattle({
      preBattleEntries: pendingEndTurnReportEntries,
    });
    pendingEndTurnReportEntries = [];
    applyBattleResultToGameState(state, state.battle.result);
    addLog(
      state.battle.result === "win"
        ? "战斗胜利，旗帜 +1。"
        : state.battle.result === "loss"
          ? "战斗失败，生命 -1。"
          : "战斗平局，生命与旗帜不变。",
    );
    const playerDataComplete = completePlayerDataTestSession();
    state.gameOutcome = getGameOutcome(state.life, state.flags);
    // 终局只在玩家看完最后一场战斗并主动点击“游戏结算”后展示。
    state.gameOver = false;
    if (playerDataComplete) {
      addLog("第 20 回合数据记录完成，已保存并导出玩家阵容测试数据。");
      persistPlayerDataTestSession();
    }
    render();
    return;
  }
  revealDeferredUpgradeReward();
}

function getNextShopPresentationBatch() {
  const queues = [
    { kind: "skill", items: queuedShopSkillAnimations },
    { kind: "upgrade", items: queuedShopUpgradeAnimations },
    { kind: "bonus", items: queuedShopBonusAnimations },
  ];
  const nextQueue = queues
    .filter((entry) => entry.items.length > 0)
    .sort((left, right) => left.items[0].sequence - right.items[0].sequence)[0];
  if (!nextQueue) return null;
  if (nextQueue.kind === "skill") {
    return { kind: nextQueue.kind, items: [nextQueue.items.shift()] };
  }

  const nextOtherSequence = Math.min(
    ...queues
      .filter((entry) => entry !== nextQueue && entry.items.length > 0)
      .map((entry) => entry.items[0].sequence),
    Number.POSITIVE_INFINITY,
  );
  const batchSize = nextQueue.items.findIndex(
    (animation) => animation.sequence >= nextOtherSequence,
  );
  return {
    kind: nextQueue.kind,
    items: nextQueue.items.splice(0, batchSize < 0 ? nextQueue.items.length : batchSize),
  };
}

function getShopPresentationTarget(animation) {
  const slots = Array.from(elements.lineupGrid?.querySelectorAll(".lineup-slot") ?? []);
  const targetSlot =
    slots.find((slot) => slot.dataset.unitId === animation.unitId) ??
    slots.find((slot) => Number(slot.dataset.lineupIndex) === animation.lineupIndex);
  return {
    slot: targetSlot ?? null,
    card: targetSlot?.querySelector(".hero-card") ?? null,
  };
}

function playQueuedShopPresentations() {
  if (shopPresentationTimer) return;
  const batch = getNextShopPresentationBatch();
  if (!batch) {
    window.setTimeout(finishShopPresentationSequence, 0);
    return;
  }

  if (batch.kind === "skill") {
    const animation = batch.items[0];
    const { slot, card } = getShopPresentationTarget(animation);
    const target = card ?? slot?.querySelector(".slot-body");
    if (!target) {
      window.setTimeout(playQueuedShopPresentations, 0);
      return;
    }

    card?.classList.add("shop-skill-active");
    playAudioCue("shopSkill");
    const label = document.createElement("span");
    label.className = "shop-skill-float";
    label.innerHTML = getSkillTriggerTagMarkup(animation.skillName);
    label.setAttribute("aria-label", `${animation.unitName}的${animation.skillName}触发`);
    label.title = `${animation.triggerName}触发`;
    target.append(label);

    shopPresentationTimer = window.setTimeout(() => {
      label.remove();
      card?.classList.remove("shop-skill-active");
      shopPresentationTimer = 0;
      playQueuedShopPresentations();
    }, SHOP_SKILL_ANIMATION_DURATION);
    return;
  }

  if (batch.kind === "upgrade") {
    const animations = batch.items;
    const highestLevel = Math.max(...animations.map((animation) => animation.level));
    playAudioCue(highestLevel >= 3 ? "heroLevel3" : "heroLevel2");
    animations.forEach((animation, index) => {
      const targetSlot = Array.from(elements.lineupGrid.querySelectorAll(".lineup-slot")).find(
        (slot) => slot.dataset.unitId === animation.unitId,
      );
      const target = targetSlot?.querySelector(".hero-card");
      if (!target) return;

      target.classList.add("unit-upgrade-active");
      const label = document.createElement("span");
      label.className = "unit-upgrade-float";
      label.textContent = `升级 · LV${animation.level}`;
      label.title = animation.sourceName;
      label.style.setProperty("--upgrade-delay", `${index * UPGRADE_ANIMATION_STAGGER}ms`);
      target.append(label);
    });

    const totalDuration =
      UPGRADE_ANIMATION_DURATION +
      Math.max(0, animations.length - 1) * UPGRADE_ANIMATION_STAGGER;
    shopPresentationTimer = window.setTimeout(() => {
      elements.lineupGrid
        ?.querySelectorAll(".unit-upgrade-float")
        .forEach((label) => label.remove());
      elements.lineupGrid
        ?.querySelectorAll(".unit-upgrade-active")
        .forEach((card) => card.classList.remove("unit-upgrade-active"));
      shopPresentationTimer = 0;
      playQueuedShopPresentations();
    }, totalDuration);
    return;
  }

  const animations = batch.items;

  animations.forEach((animation, index) => {
    const targetSlot = Array.from(elements.lineupGrid.querySelectorAll(".lineup-slot")).find(
      (slot) => slot.dataset.unitId === animation.unitId,
    );
    const target = targetSlot?.querySelector(".hero-card");
    if (!target) return;

    const label = document.createElement("span");
    label.className = "bonus-float";
    label.innerHTML = getFloatingAttributeTextMarkup(animation.text);
    label.setAttribute("aria-label", getFloatingAttributeAccessibleText(animation.text));
    label.title = animation.sourceName;
    label.style.setProperty("--bonus-delay", `${index * BONUS_ANIMATION_STAGGER}ms`);
    target.append(label);
  });

  const totalDuration =
    BONUS_ANIMATION_DURATION + Math.max(0, animations.length - 1) * BONUS_ANIMATION_STAGGER;
  shopPresentationTimer = window.setTimeout(() => {
    document.querySelectorAll(".lineup-grid .bonus-float").forEach((label) => label.remove());
    shopPresentationTimer = 0;
    playQueuedShopPresentations();
  }, totalDuration);
}

function getEffectDefinition(effectId) {
  return effectId ? EFFECT_DEFINITIONS[effectId] ?? null : null;
}

function getEventDisplayName(eventType) {
  return EVENT_DISPLAY_NAMES[eventType] ?? eventType;
}

function getHeroSkillText(effectId, owner = null) {
  const ownerSkill = String(owner?.skill ?? "").trim();
  const heroSkill = CARD_POOLS.hero.find((hero) => hero.effectId === effectId)?.skill ?? "";
  const derivedUnit = DERIVED_UNIT_DEFINITION_BY_NAME[owner?.name];
  return ownerSkill || heroSkill || derivedUnit?.skill || "";
}

function getHeroSkillLevel(owner) {
  return Math.max(1, Math.min(MAX_UNIT_LEVEL, Number(owner?.level) || 1));
}

function resolveHeroSkillDisplay(skillText, level = 1, owner = null) {
  const resolvedLevel = Math.max(1, Math.min(MAX_UNIT_LEVEL, Number(level) || 1));
  const scaledValues = [];
  const bondValues = [];
  const markScaledValue = (value) => {
    const index = scaledValues.push(String(value)) - 1;
    return `\uE000${index}\uE001`;
  };
  const markBondValue = (faction) => {
    const index = bondValues.push(faction) - 1;
    return `\uE002${index}\uE003`;
  };
  let text = String(skillText || "");
  const ownerBonds = getBaseUnitBonds(owner).filter((faction) =>
    BOND_FACTIONS.includes(faction),
  );

  if (ownerBonds.length > 0) {
    const dynamicBondText = ownerBonds.map(markBondValue).join("、");
    text = text.replace(/自身羁绊/g, dynamicBondText);
  }

  text = text.replace(/（LV1）([、，]?)\s*(\d+)\/(\d+)/g, (_match, separator, attack, health) => {
    return `${markScaledValue(`LV${resolvedLevel}`)}${separator || " "}${markScaledValue(
      `${Number(attack) * resolvedLevel}/${Number(health) * resolvedLevel}`,
    )}`;
  });
  text = text.replace(/（LV1）/g, () => markScaledValue(`LV${resolvedLevel}`));
  text = text.replace(/(\+?)（(\d+(?:\/\d+)?)(%)?）/g, (_match, plusSign, rawValue, percentSign) => {
    const scaledValue = rawValue
      .split("/")
      .map((value) => Number(value) * resolvedLevel)
      .join("/");
    return markScaledValue(`${plusSign}${scaledValue}${percentSign || ""}`);
  });

  const plainText = text
    .replace(/\uE000(\d+)\uE001/g, (_match, index) => scaledValues[Number(index)] || "")
    .replace(/\uE002(\d+)\uE003/g, (_match, index) => bondValues[Number(index)] || "");
  const html = text
    .split(/(\uE000\d+\uE001|\uE002\d+\uE003)/g)
    .map((part) => {
      const scaledToken = part.match(/^\uE000(\d+)\uE001$/);
      if (scaledToken) {
        return `<span class="hero-skill-scaled-value">${escapeBattleReportHtml(
          scaledValues[Number(scaledToken[1])] || "",
        )}</span>`;
      }
      const bondToken = part.match(/^\uE002(\d+)\uE003$/);
      if (bondToken) {
        const faction = bondValues[Number(bondToken[1])] || "";
        return `<span class="hero-skill-bond" data-faction="${escapeBattleReportHtml(
          faction,
        )}">${escapeBattleReportHtml(faction)}</span>`;
      }
      return escapeBattleReportHtml(part);
    })
    .join("");

  return {
    text: plainText,
    html,
    scaledValues,
    bondValues,
  };
}

function getHeroSkillName(effectId, owner = null) {
  const skillText = getHeroSkillText(effectId, owner);
  return skillText.match(/^\[([^\]]+)\]/)?.[1] ?? "技能";
}

function getSkillDescriptionDisplay(skillText, level = 1, owner = null) {
  const rawDescription = String(skillText ?? "")
    .replace(/^\[[^\]]+\]\s*/, "")
    .trim();
  const display = resolveHeroSkillDisplay(rawDescription, level, owner);
  return {
    ...display,
    html: getStatDescriptionMarkup(getDerivedContentHighlightedMarkup(display.html)),
  };
}

function getHeroSkillDescriptionDisplay(effectId, owner = null) {
  const display = getSkillDescriptionDisplay(
    getHeroSkillText(effectId, owner),
    getHeroSkillLevel(owner),
    owner,
  );
  return {
    ...display,
    html: getExperienceDescriptionMarkup(display.html),
  };
}

function getHeroSkillDescription(effectId, owner = null) {
  return getHeroSkillDescriptionDisplay(effectId, owner).text;
}

function getDerivedContentEntries(values) {
  const sourceText = (Array.isArray(values) ? values : [values])
    .flat(Infinity)
    .filter(Boolean)
    .map(String)
    .join("\n");
  if (!sourceText) return [];

  const candidates = DERIVED_CONTENT_DEFINITIONS.flatMap((entry) =>
    entry.keywords.flatMap((keyword) => {
      const matches = [];
      let start = sourceText.indexOf(keyword);
      while (start >= 0) {
        matches.push({ entry, start, end: start + keyword.length, length: keyword.length });
        start = sourceText.indexOf(keyword, start + keyword.length);
      }
      return matches;
    }),
  ).sort((left, right) => left.start - right.start || right.length - left.length);

  const occupiedRanges = [];
  const selectedIds = new Set();
  const selectedEntries = [];
  candidates.forEach((candidate) => {
    if (selectedIds.has(candidate.entry.id)) return;
    if (
      occupiedRanges.some(
        (range) => candidate.start < range.end && candidate.end > range.start,
      )
    ) {
      return;
    }
    occupiedRanges.push({ start: candidate.start, end: candidate.end });
    selectedIds.add(candidate.entry.id);
    selectedEntries.push({ ...candidate.entry, firstIndex: candidate.start });
  });
  return selectedEntries.sort((left, right) => left.firstIndex - right.firstIndex);
}

function getDerivedContentHighlightedMarkup(markup) {
  return String(markup ?? "").replace(DERIVED_CONTENT_KEYWORD_PATTERN, (keyword) => {
    const entry = DERIVED_CONTENT_ENTRY_BY_KEYWORD.get(keyword);
    return entry
      ? `<span class="derived-content-term" data-derived-id="${escapeBattleReportHtml(entry.id)}">${keyword}</span>`
      : keyword;
  });
}

function createDerivedContentRailMarkup(entries, className = "") {
  if (!entries.length) return "";
  const derivedCount = Math.min(2, entries.length);
  return `
    <aside class="derived-detail-rail ${className}" style="--derived-count: ${derivedCount}" aria-label="衍生内容说明">
      ${entries
        .map((entry) => {
          const descriptionDisplay = getSkillDescriptionDisplay(entry.description, 1);
          const statsMarkup =
            Number.isFinite(entry.attack) && Number.isFinite(entry.health)
              ? `<span class="derived-detail-stats" aria-label="攻击力 ${entry.attack}，生命值 ${entry.health}">${getStatPairMarkup(`${entry.attack}/${entry.health}`)}</span>`
              : "";
          const kindMarkup = statsMarkup
            ? ""
            : `<span class="derived-detail-kind">${escapeBattleReportHtml(entry.kind)}</span>`;
          return `
            <section class="derived-detail-card card-detail-paper" data-derived-id="${escapeBattleReportHtml(entry.id)}">
              <div class="card-detail-heading">
                <strong class="card-detail-ink-tag">衍生</strong>
                <span class="card-detail-title derived-detail-name">${escapeBattleReportHtml(entry.name)}</span>
                ${statsMarkup}
                ${kindMarkup}
              </div>
              <span class="derived-detail-description">${descriptionDisplay.html}</span>
            </section>
          `;
        })
        .join("")}
    </aside>
  `;
}

function isEffectImplemented(effectId) {
  return Boolean(getEffectDefinition(effectId));
}

function recordShopEffectEvent(type, payload) {
  state.effectEvents.push({
    id: `shop-event-${state.effectEvents.length + 1}`,
    type,
    round: state.round,
    phase: state.phase,
    ...payload,
  });
}

function getShopUnitIndex(unit) {
  return state.lineup.indexOf(unit);
}

function getNearestShopUnit(unit, direction, predicate = () => true) {
  const ownerIndex = getShopUnitIndex(unit);
  if (ownerIndex < 0) return null;
  const step = direction === "ahead" ? 1 : -1;
  for (
    let index = ownerIndex + step;
    index >= 0 && index < state.lineup.length;
    index += step
  ) {
    const target = state.lineup[index];
    if (target && predicate(target)) return target;
  }
  return null;
}

function shareAnyBond(left, right) {
  const rightBonds = new Set(getBaseUnitBonds(right));
  return getBaseUnitBonds(left).some((faction) => rightBonds.has(faction));
}

function getShopBondCountSnapshot() {
  return Object.fromEntries(getBondEntries().map((entry) => [entry.faction, entry.count]));
}

function dispatchShopBondCountChanges(previousCounts) {
  const currentCounts = getShopBondCountSnapshot();
  const changes = BOND_FACTIONS.map((faction) => ({
    faction,
    previousCount: previousCounts?.[faction] ?? 0,
    count: currentCounts[faction] ?? 0,
  })).filter((entry) => entry.previousCount !== entry.count);
  if (changes.length > 0) {
    dispatchShopEvent("bond:count-change", {
      changes,
      decreased: changes.some((entry) => entry.count < entry.previousCount),
      increased: changes.some((entry) => entry.count > entry.previousCount),
    });
  }
}

function isShopHeroEventApplicable(candidate, type, payload) {
  const { owner, effectId } = candidate;
  const unit = payload.unit ?? null;
  const sharedUnit = unit && shareAnyBond(owner, unit);
  if (type === "card:purchase") return effectId === "hero.simahui.guangshi" && unit === owner;
  if (type === "unit:sell") return effectId === "hero.zuoci.bianhuan-moce" && unit === owner;
  if (type === "unit:recruit") {
    if (["hero.chengong.baiji-duomou", "hero.chengpu.yuanxun"].includes(effectId)) {
      return unit === owner;
    }
    return [
      "hero.lingtong.guoshi-zhifeng",
      "hero.yuanshao.haoling-qunxiong",
    ].includes(effectId) && sharedUnit && unit !== owner;
  }
  if (type === "unit:summon") {
    if (effectId === "hero.zhenji.luoshen") {
      return Boolean(unit && unit !== owner && !payload.revived);
    }
    if (effectId === "hero.yuanshu.yuxi") {
      return unit === owner && !payload.revived;
    }
    return ["hero.xunyu.wangzuo-zhicai", "hero.liubei.renze"].includes(effectId) &&
      sharedUnit &&
      unit !== owner &&
      !payload.revived;
  }
  if (type === "stratagem:use") return effectId === "hero.xunyou.qice";
  if (type === "experience:gain") {
    if (effectId === "hero.liaohua.sujiang") return Boolean(unit && unit !== owner);
    return false;
  }
  if (type === "unit:upgrade") {
    if (effectId === "hero.zhaoyun.longdan") return unit === owner;
    return false;
  }
  if (type === "unit:death") {
    if ([
      "hero.pangde.xunjie",
      "hero.yuejin.xiandeng-xianzhen",
      "hero.guojia.yiji-pingliao",
      "hero.hanxiandi.piaoyao",
    ].includes(effectId)) {
      return unit === owner;
    }
    if (effectId === "hero.weiyan.caigao-qilie") {
      return Boolean(unit && unit !== owner);
    }
    if (effectId === "hero.yanliang.yongguan-sanjun") {
      return Boolean(unit && unit !== owner && payload.killer === owner);
    }
    if (effectId === "hero.huatuo.jijiu") {
      return Boolean(
        unit &&
        unit !== owner &&
        !payload.consumed &&
        !payload.revived &&
        (owner.huatuoRevivesUsedThisRound ?? 0) < (owner.level ?? 1) &&
        getNearestShopUnit(owner, "ahead") === unit
      );
    }
    if (effectId === "hero.caocao.jianxiong") {
      return Boolean(unit && unit !== owner && shareAnyBond(owner, unit));
    }
    return false;
  }
  return true;
}

function dispatchShopEvent(type, payload = {}) {
  resolveShopEquipmentEvent(type, payload);
  resolveShopBondEvent(type);
  const candidates = [];
  let sequence = 0;
  getLineupUnits().forEach((owner) => {
    (owner.skillEffectIds ?? []).forEach((effectId) => {
      const definition = getEffectDefinition(effectId);
      const triggers = definition?.triggers ?? [definition?.trigger];
      if (definition?.sourceType !== "hero" || !triggers.includes(type)) return;
      candidates.push({
        effectId,
        definition,
        owner,
        sourceName: owner.name,
        sequence,
        resolved: false,
      });
      sequence += 1;
    });
  });

  while (true) {
    const valid = candidates.filter(
      (candidate) =>
        !candidate.resolved &&
        isShopHeroEventApplicable(candidate, type, payload) &&
        (state.lineup.includes(candidate.owner) ||
          (type === "unit:death" && payload.unit === candidate.owner)),
    );
    if (valid.length === 0) break;
    const highestAttack = Math.max(...valid.map((candidate) => candidate.owner.attack));
    const tied = valid.filter((candidate) => candidate.owner.attack === highestAttack);
    const candidate = tied[Math.floor(Math.random() * tied.length)];
    candidate.resolved = true;
    const skillName = getHeroSkillName(candidate.effectId, candidate.owner);
    const skillDescription = getHeroSkillDescription(
      candidate.effectId,
      candidate.owner,
    );
    recordShopEffectEvent("skill:trigger", {
      sourceEffectId: candidate.effectId,
      sourceName: candidate.sourceName,
      ownerId: candidate.owner.id,
      ownerName: candidate.owner.name,
      trigger: type,
      message: `${candidate.owner.name}【${skillName}】触发（${getEventDisplayName(type)}）${
        skillDescription ? `：${skillDescription}` : ""
      }。`,
    });
    queueShopSkillAnimation(candidate, type);
    resolveShopHeroSkill(candidate, { type, payload });
    recordShopEffectEvent(type, {
      sourceEffectId: candidate.effectId,
      sourceName: candidate.sourceName,
      ownerId: candidate.owner.id,
      ownerName: candidate.owner.name,
      payload,
    });
  }
}

function resolveShopBondEvent(type) {
  if (type !== "round:end") return;
  const effectCount = getCurrentShopBondEffectCount("群");
  if (effectCount < 2) return;
  const amount = { 2: 1, 3: 2, 4: 4, 5: 8 }[effectCount] ?? 0;
  const target = state.lineup
    .map((unit, index) => ({ unit, index }))
    .filter(({ unit }) => unit && getEffectiveUnitBonds(unit).includes("群"))
    .sort((left, right) => right.index - left.index)[0]?.unit;
  if (!target || amount <= 0) return;
  applyShopUnitStatBonus(target, amount, amount, BOND_RULES.群.label);
  const message = `${BOND_RULES.群.label} ${effectCount}人：最前方群武将${target.name}永久 +${amount}/+${amount}。`;
  addLog(message);
  recordShopEffectEvent("round:end", {
    sourceEffectId: "bond.group-round-end",
    sourceName: `${BOND_RULES.群.label} ${effectCount}人`,
    targetId: target.id,
    targetName: target.name,
    message,
  });
}

function resolveShopEquipmentEvent(type, payload) {
  if (type === "round:end") {
    const hasActiveBond = getBondEntries().some((entry) => entry.count >= 2);
    if (!hasActiveBond) {
      getLineupUnits().forEach((owner) => {
        const equipment = getUnitEquipment(owner);
        if (equipment?.effectId !== "equipment.dragon-square-pot") return;
        applyShopUnitStatBonus(owner, 2, 2, equipment.name);
        addLog(`${owner.name}的${equipment.name}触发：阵容无激活羁绊，自身永久 +2/+2。`);
      });
    }
    return;
  }
  const unit = payload.unit ?? null;
  if (type === "unit:summon" && unit && !payload.revived) {
    getLineupUnits().forEach((owner) => {
      const equipment = getUnitEquipment(owner);
      if (equipment?.effectId !== "equipment.commander-seal") return;
      queueShopSkillAnimation(
        { owner, effectId: equipment.effectId },
        type,
        equipment.name,
      );
      applyShopUnitStatBonus(unit, 1, 1, equipment.name);
      addLog(`${owner.name}的${equipment.name}触发：${unit.name} +1/+1。`);
    });
    return;
  }
  const equipment = getUnitEquipment(unit);
  if (
    type !== "unit:death" ||
    equipment?.effectId !== "equipment.imperial-jade-seal"
  ) {
    return;
  }
  const count = applyImperialJadeSealShopBonus(unit, getBaseUnitBonds(unit));
  if (count > 0) {
    addLog(
      `${unit.name}的${equipment.name}结算${count}次，使商店中其羁绊武将永久 +${count}/+${count}。`,
    );
  }
}

function logShopHeroSkill(owner, message) {
  addLog(`${owner.name}【${owner.skill?.match(/^\[([^\]]+)\]/)?.[1] ?? "技能"}】：${message}`);
}

function resolveGeneratedStratagem(owner) {
  const tier = Math.min(6, Math.max(1, owner.level ?? 1));
  const pool = CARD_POOLS.stratagem.filter(
    (card) =>
      card.category === "计策" &&
      card.tier === tier &&
      !card.rewardOnly &&
      !card.generatedOnly &&
      getEffectDefinition(card.effectId),
  );
  const targetUnit = getNearestShopUnit(owner, "ahead");
  if (pool.length === 0 || !targetUnit) return;
  const card = pool[Math.floor(Math.random() * pool.length)];
  const validation = getStratagemUseValidation(card, targetUnit);
  if (!validation.valid) return;
  if (validation.requiresBondChoice) {
    state.pendingStratagemUse = {
      generated: true,
      ownerId: owner.id,
      ownerName: owner.name,
      card: { ...card },
      cardName: card.name,
      targetId: targetUnit.id,
      targetName: targetUnit.name,
      targetIndex: getShopUnitIndex(targetUnit),
      availableFactions: validation.availableFactions,
      choiceDescription: `${owner.name}【百计多谋】对${targetUnit.name}使用${card.name}：${validation.choiceDescription}`,
    };
    return;
  }
  const outcome = resolveShopEffect(card.effectId, {
    card,
    targetUnit,
    targetIndex: getShopUnitIndex(targetUnit),
    selectedFaction: null,
  });
  if (outcome.applied) {
    logShopHeroSkill(owner, `对${targetUnit.name}使用了${tier}阶计策${card.name}`);
  }
}

function completeGeneratedStratagemUse(selectedFaction) {
  const pending = state.pendingStratagemUse;
  if (!pending?.generated || !pending.availableFactions.includes(selectedFaction)) return false;
  const owner = getLineupUnits().find((unit) => unit.id === pending.ownerId);
  const targetUnit = getLineupUnits().find((unit) => unit.id === pending.targetId);
  if (!owner || !targetUnit) {
    state.pendingStratagemUse = null;
    render();
    return false;
  }
  const previousBondCounts = getShopBondCountSnapshot();
  const outcome = resolveShopEffect(pending.card.effectId, {
    card: pending.card,
    targetUnit,
    targetIndex: getShopUnitIndex(targetUnit),
    selectedFaction,
  });
  if (!outcome.applied) return false;
  state.pendingStratagemUse = null;
  dispatchShopBondCountChanges(previousBondCounts);
  logShopHeroSkill(
    owner,
    `对${targetUnit.name}使用了${pending.card.tier}阶计策${pending.card.name}`,
  );
  render();
  return true;
}

function reviveShopUnit(deadUnit, owner, eventPayload) {
  const reviveLimit = owner.level ?? 1;
  if (
    !deadUnit ||
    eventPayload.revived ||
    (owner.huatuoRevivesUsedThisRound ?? 0) >= reviveLimit ||
    getNearestShopUnit(owner, "ahead") !== deadUnit
  ) {
    return false;
  }
  const level = 2;
  deadUnit.level = level;
  deadUnit.copies = UNIT_LEVEL_COPY_THRESHOLDS[level];
  deadUnit.bonusExperience = 0;
  deadUnit.experience = 0;
  deadUnit.baseAttack = 1;
  deadUnit.baseHealth = 1;
  deadUnit.bodyAttack = 1;
  deadUnit.bodyHealth = 1;
  deadUnit.directModifiers = { equipment: null, status: null, bond: null };
  deadUnit.statuses = {};
  syncUnitStats(deadUnit);
  eventPayload.revived = true;
  owner.huatuoRevivesUsedThisRound = (owner.huatuoRevivesUsedThisRound ?? 0) + 1;
  logShopHeroSkill(owner, `${deadUnit.name}以LV2 3/3复活`);
  dispatchShopEvent("unit:revive", { unit: deadUnit, source: owner });
  dispatchShopEvent("unit:summon", { unit: deadUnit, source: owner, revived: true });
  return true;
}

function killShopUnit(target, killer, sourceEffectId) {
  if (!target) return false;
  target.health = 0;
  const index = getShopUnitIndex(target);
  const payload = {
    unit: target,
    killer,
    sourceEffectId,
    index,
    revived: false,
  };
  dispatchShopEvent("unit:death", payload);
  if (!payload.revived && index >= 0 && state.lineup[index] === target) {
    state.lineup[index] = null;
  }
  return true;
}

function reduceShopUnitExperience(unit, amount) {
  let remaining = Math.max(0, amount);
  while (remaining > 0 && getUnitProgressValue(unit) > 1) {
    if ((unit.bonusExperience ?? 0) > 0) {
      unit.bonusExperience -= 1;
    } else if ((unit.copies ?? 1) > 1) {
      unit.copies -= 1;
    }
    remaining -= 1;
  }
  const progress = getUnitProgress(getUnitProgressValue(unit));
  unit.level = progress.level;
  unit.experience = progress.experience;
  syncUnitStats(unit);
  return amount - remaining;
}

function resolveShopHeroSkill(candidate, event) {
  const { owner, effectId } = candidate;
  const { type, payload } = event;
  const level = owner.level ?? 1;
  const eventUnit = payload.unit ?? null;
  const sharedRecruit =
    type === "unit:recruit" &&
    eventUnit &&
    shareAnyBond(owner, eventUnit);

  if (effectId === "hero.zhenji.luoshen" && type === "unit:summon" && eventUnit) {
    applyShopUnitStatBonus(eventUnit, level, 0, owner.name);
    logShopHeroSkill(owner, `${eventUnit.name}获得 +${level} 攻击`);
    return;
  }
  if (effectId === "hero.pangde.xunjie" && type === "unit:death" && eventUnit === owner) {
    const target = getNearestShopUnit(owner, "behind");
    if (target) applyShopUnitStatBonus(target, 2 * level, level, owner.name);
    return;
  }
  if (
    effectId === "hero.weiyan.caigao-qilie" &&
    type === "unit:death" &&
    eventUnit &&
    eventUnit !== owner
  ) {
    applyShopUnitStatBonus(owner, level, level, owner.name);
    return;
  }
  if (
    effectId === "hero.yanliang.yongguan-sanjun" &&
    type === "unit:death" &&
    eventUnit !== owner &&
    payload.killer === owner
  ) {
    applyShopUnitStatBonus(owner, 2 * level, 2 * level, owner.name);
    return;
  }
  if (
    effectId === "hero.hanxiandi.piaoyao" &&
    type === "unit:death" &&
    eventUnit === owner
  ) {
    const target = pickShopRandomUnits(
      getLineupUnits().filter(
        (unit) => unit !== owner && !getUnitEquipment(unit),
      ),
      1,
    )[0];
    if (!target) return;
    target.directModifiers ??= {};
    target.directModifiers.equipment = createGeneratedEquipment(
      "equipment.imperial-edict",
    );
    syncUnitStats(target);
    logShopHeroSkill(owner, `${target.name}获得诏书`);
    return;
  }
  if (
    effectId === "hero.liaohua.sujiang" &&
    type === "experience:gain" &&
    eventUnit &&
    eventUnit !== owner
  ) {
    applyShopUnitStatBonus(eventUnit, 0, level, owner.name);
    return;
  }
  if (
    effectId === "hero.chengong.baiji-duomou" &&
    type === "unit:recruit" &&
    eventUnit === owner
  ) {
    resolveGeneratedStratagem(owner);
    return;
  }
  if (effectId === "hero.zuoci.bianhuan-moce" && type === "unit:sell" && eventUnit === owner) {
    const ahead = getNearestShopUnit(owner, "ahead");
    const behind = getNearestShopUnit(owner, "behind");
    const tierLimit = 2 * level;
    if (
      ahead &&
      behind &&
      ahead.tier <= tierLimit &&
      behind.tier <= tierLimit
    ) {
      ensureUnitBodyStats(ahead);
      ensureUnitBodyStats(behind);
      const aheadPanel = { attack: ahead.attack, health: ahead.health };
      const behindPanel = { attack: behind.attack, health: behind.health };
      const aheadStackGrowth = getUnitStackGrowth(ahead);
      const behindStackGrowth = getUnitStackGrowth(behind);
      const aheadDirectStats = getDirectStatTotals(ahead);
      const behindDirectStats = getDirectStatTotals(behind);
      ahead.bodyAttack = behindPanel.attack - aheadStackGrowth - aheadDirectStats.attack;
      ahead.bodyHealth = behindPanel.health - aheadStackGrowth - aheadDirectStats.health;
      behind.bodyAttack = aheadPanel.attack - behindStackGrowth - behindDirectStats.attack;
      behind.bodyHealth = aheadPanel.health - behindStackGrowth - behindDirectStats.health;
      syncUnitStats(ahead);
      syncUnitStats(behind);
      logShopHeroSkill(owner, `交换了${ahead.name}与${behind.name}的最终面板攻血`);
    }
    return;
  }
  if (effectId === "hero.yujin.junji-yanming" && type === "round:end") {
    let target = getNearestShopUnit(owner, "ahead");
    for (let count = 0; target && count < level; count += 1) {
      applyShopUnitStatBonus(target, 1, 1, owner.name);
      target = getNearestShopUnit(target, "ahead");
    }
    return;
  }
  if (effectId === "hero.madai.fuzhan" && type === "round:end") {
    const target = getNearestShopUnit(owner, "ahead");
    if (!target) return;
    const amount = 2 * level;
    target.health -= amount;
    logShopHeroSkill(owner, `对${target.name}造成${amount}点伤害`);
    if (target.health <= 0) killShopUnit(target, owner, effectId);
    return;
  }
  if (effectId === "hero.zhugejin.hongya" && type === "round:end") {
    const target = pickShopRandomUnits(
      getLineupUnits().filter((unit) => unit !== owner),
      1,
    )[0];
    if (target) applyShopUnitStatBonus(target, level, level, owner.name);
    return;
  }
  if (
    effectId === "hero.chengpu.yuanxun" &&
    type === "unit:recruit" &&
    eventUnit === owner
  ) {
    const target = getNearestShopUnit(owner, "ahead");
    if (target) applyShopUnitStatBonus(target, level, level, owner.name);
    return;
  }
  if (effectId === "hero.xunyou.qice" && type === "stratagem:use") {
    const ahead = getNearestShopUnit(owner, "ahead");
    const behind = getNearestShopUnit(owner, "behind");
    if (ahead) applyShopUnitStatBonus(ahead, level, level, owner.name);
    if (behind) applyShopUnitStatBonus(behind, level, level, owner.name);
    return;
  }
  if (effectId === "hero.lusu.lianhe" && type === "round:start") {
    const gain = Math.floor(getActiveBondCount() / 2) * 2 * level;
    if (gain > 0) {
      state.gold = Math.min(GOLD_CAP, state.gold + gain);
      logShopHeroSkill(owner, `获得${gain}金币`);
    }
    return;
  }
  if (effectId === "hero.zhaoyun.longdan" && type === "unit:upgrade" && eventUnit === owner) {
    applyPositiveStatus(owner, "unparalleled", {
      sourceEffectId: effectId,
      sourceName: owner.name,
    });
    applyShopUnitStatBonus(owner, 2 * level, 2 * level, owner.name);
    return;
  }
  if (effectId === "hero.lingtong.guoshi-zhifeng" && sharedRecruit) {
    applyShopUnitStatBonus(eventUnit, level, 2 * level, owner.name);
    return;
  }
  if (
    effectId === "hero.simahui.guangshi" &&
    type === "card:purchase" &&
    eventUnit === owner
  ) {
    const options = getLineupUnits().filter((unit) => unit !== owner).flatMap((unit) =>
      getAvailableExtraBondFactions(unit).map((faction) => ({
        unitId: unit.id,
        unitName: unit.name,
        faction,
      })),
    );
    if (options.length > 0) {
      state.pendingHeroBondChoice = {
        ownerId: owner.id,
        ownerName: owner.name,
        kind: "sima-hui",
        cancelable: false,
        options,
      };
    }
    return;
  }
  if (
    effectId === "hero.yuanshu.yuxi" &&
    type === "unit:summon" &&
    eventUnit === owner &&
    !payload.revived
  ) {
    const equipment = getUnitEquipment(owner);
    if (!equipment) {
      owner.directModifiers.equipment = createGeneratedEquipment(
        "equipment.imperial-jade-seal",
      );
      syncUnitStats(owner);
      logShopHeroSkill(owner, `获得并佩戴传国玉玺，当前阵亡效果共结算${1 + level}次`);
    } else if (equipment.effectId === "equipment.imperial-jade-seal") {
      logShopHeroSkill(owner, `强化传国玉玺，当前阵亡效果共结算${1 + level}次`);
    } else {
      logShopHeroSkill(owner, `装备槽已有${equipment.name}，未能佩戴传国玉玺`);
    }
    return;
  }
  if (
    effectId === "hero.liubei.renze" &&
    type === "unit:summon" &&
    eventUnit &&
    eventUnit !== owner &&
    !payload.revived &&
    shareAnyBond(owner, eventUnit)
  ) {
    grantUnitExperience(eventUnit, level, owner.name, effectId);
    return;
  }
  if (
    effectId === "hero.guojia.yiji-pingliao" &&
    type === "unit:death" &&
    eventUnit === owner
  ) {
    getLineupUnits()
      .filter((unit) => unit !== owner && shareAnyBond(owner, unit))
      .forEach((unit) =>
        applyShopUnitStatBonus(unit, 2 * level, 2 * level, owner.name),
      );
    return;
  }
  if (effectId === "hero.dongzhuo.baonue" && type === "round:end") {
    const targets = getLineupUnits().filter(
      (unit) => unit !== owner && !shareAnyBond(owner, unit),
    );
    const target = pickShopRandomUnits(targets, 1)[0];
    if (target && killShopUnit(target, owner, effectId)) {
      applyShopUnitStatBonus(owner, 2 * level, 2 * level, owner.name);
    }
    return;
  }
  if (
    effectId === "hero.huatuo.jijiu" &&
    type === "unit:death" &&
    eventUnit !== owner
  ) {
    reviveShopUnit(eventUnit, owner, payload);
    return;
  }
  if (
    effectId === "hero.caocao.jianxiong" &&
    type === "unit:death" &&
    eventUnit &&
    eventUnit !== owner &&
    shareAnyBond(owner, eventUnit)
  ) {
    const target = pickShopRandomUnits(
      getLineupUnits().filter((unit) => unit !== owner && unit !== eventUnit),
      1,
    )[0];
    if (target) applyShopUnitStatBonus(target, 4 * level, 4 * level, owner.name);
    return;
  }
  if (
    effectId === "hero.xunyu.wangzuo-zhicai" &&
    type === "unit:summon" &&
    eventUnit &&
    eventUnit !== owner &&
    shareAnyBond(owner, eventUnit)
  ) {
    applyShopUnitStatBonus(eventUnit, 4 * level, 4 * level, owner.name);
    return;
  }
  if (effectId === "hero.sunquan.quanheng" && type === "round:end") {
    const ahead = getNearestShopUnit(owner, "ahead", (unit) => shareAnyBond(owner, unit));
    const behind = getNearestShopUnit(owner, "behind", (unit) => shareAnyBond(owner, unit));
    if (ahead) applyShopUnitStatBonus(ahead, 5 * level, 0, owner.name);
    if (behind) applyShopUnitStatBonus(behind, 0, 5 * level, owner.name);
    return;
  }
  if (effectId === "hero.yuanshao.haoling-qunxiong" && sharedRecruit) {
    getLineupUnits().filter((unit) => unit !== owner).forEach((unit) =>
      applyShopUnitStatBonus(unit, level, 2 * level, owner.name),
    );
  }
}

function getStratagemUseCount(effectId) {
  return state.stratagemUseCounts[effectId] ?? 0;
}

function pickShopRandomUnits(units, count) {
  const pool = [...units];
  const selected = [];
  while (pool.length > 0 && selected.length < count) {
    selected.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return selected;
}

function getHighestActiveBondFactions() {
  const active = getBondEntries().filter((entry) => entry.count >= 2);
  if (active.length === 0) return [];
  const highestCount = Math.max(...active.map((entry) => entry.count));
  return active
    .filter((entry) => entry.count === highestCount)
    .map((entry) => entry.faction);
}

function getHighestBondFactions({ excludeUnlocked = false } = {}) {
  const entries = getBondEntries().filter(
    (entry) =>
      entry.count > 0 &&
      (!excludeUnlocked || !state.unlockedFivePersonBonds.includes(entry.faction)),
  );
  if (entries.length === 0) return [];
  const highestCount = Math.max(...entries.map((entry) => entry.count));
  return entries
    .filter((entry) => entry.count === highestCount)
    .map((entry) => entry.faction);
}

function pickHighestActiveBondFaction() {
  const factions = getHighestActiveBondFactions();
  if (factions.length === 0) return null;
  return factions[Math.floor(Math.random() * factions.length)];
}

function getLineupUnitsInBond(faction) {
  return getLineupUnits().filter((unit) => getEffectiveUnitBonds(unit).includes(faction));
}

function getAvailableExtraBondFactions(unit) {
  if (!unit || getBaseUnitBonds(unit).length >= MAX_UNIT_BONDS) return [];
  const current = new Set(getBaseUnitBonds(unit));
  return BOND_FACTIONS.filter((faction) => !current.has(faction));
}

function applyShopUnitBonuses(units, attack, health, sourceName) {
  units.forEach((unit) => applyShopUnitStatBonus(unit, attack, health, sourceName));
  return units;
}

function grantUnitExperience(unit, amount, sourceName, sourceEffectId = null) {
  const maximumProgress = UNIT_LEVEL_COPY_THRESHOLDS[MAX_UNIT_LEVEL];
  const requested = Math.max(0, amount);
  const initialLevel = unit.level;
  let granted = 0;
  let convertedToStats = 0;
  for (let point = 0; point < requested; point += 1) {
    if (getUnitProgressValue(unit) >= maximumProgress) {
      applyShopUnitStatBonus(unit, 1, 1, sourceName);
      convertedToStats += 1;
      continue;
    }
    const previousLevel = unit.level;
    unit.bonusExperience = Math.max(0, unit.bonusExperience ?? 0) + 1;
    const progress = getUnitProgress(getUnitProgressValue(unit));
    unit.level = progress.level;
    unit.experience = progress.experience;
    syncUnitStats(unit);
    granted += 1;
    const queuedExperienceAnimation = queueShopBonusAnimation(unit, 1, 1, sourceName);
    dispatchShopEvent("experience:gain", {
      unit,
      amount: 1,
      sourceName,
      sourceEffectId,
    });
    if (unit.level > previousLevel) {
      const queuedUpgradeAnimation = queueShopUpgradeAnimation(
        unit,
        unit.level,
        sourceName,
      );
      recordShopEffectEvent("unit:upgrade", {
        sourceEffectId,
        sourceName,
        targetId: unit.id,
        targetName: unit.name,
        previousLevel,
        unitLevel: unit.level,
        message: `${unit.name}由 LV${previousLevel} 升至 LV${unit.level}。`,
      });
      const deferReward =
        resolveShopUpgradeBondEffects(unit, previousLevel, unit.level) ||
        queuedExperienceAnimation ||
        queuedUpgradeAnimation;
      dispatchShopEvent("unit:upgrade", {
        unit,
        previousLevel,
        level: unit.level,
        sourceName,
        sourceEffectId,
      });
      queueUpgradeRewards(unit, previousLevel, unit.level, {
        deferFirstReward: deferReward,
      });
    }
  }

  return {
    granted,
    convertedToStats,
    leveledUp: unit.level > initialLevel,
    previousLevel: initialLevel,
    level: unit.level,
    experience: unit.experience,
  };
}

function resolveShopEffect(effectId, context) {
  const definition = getEffectDefinition(effectId);
  if (!definition || definition.trigger !== "stratagem:use") {
    return { applied: false, messages: [] };
  }

  const messages = [];
  const affectedUnitIds = new Set();
  const affectedShopCardIds = new Set();
  const priorUseCount = getStratagemUseCount(effectId);
  let selectedFaction = context.selectedFaction ?? null;
  definition.operations.forEach((operation) => {
    if (operation.type === "modify-body-stats" && context.targetUnit) {
      applyShopUnitStatBonus(
        context.targetUnit,
        operation.attack ?? 0,
        operation.health ?? 0,
        context.card.name,
      );
      affectedUnitIds.add(context.targetUnit.id);
      messages.push(
        `${context.targetUnit.name}永久获得 +${operation.attack ?? 0}/+${
          operation.health ?? 0
        }`,
      );
      return;
    }

    if (operation.type === "add-extra-bond" && context.targetUnit && selectedFaction) {
      if (addExtraBond(context.targetUnit, selectedFaction, { temporary: operation.temporary })) {
        getLineupUnits()
          .filter((unit) => unit.name === context.targetUnit.name)
          .forEach((unit) => affectedUnitIds.add(unit.id));
        messages.push(
          `${context.targetUnit.name}的全部同名卡牌获得${
            operation.temporary ? "本回合" : "本局永久"
          }“${selectedFaction}”羁绊`,
        );
      }
      return;
    }

    if (operation.type === "buff-random-highest-bond") {
      selectedFaction ??= pickHighestActiveBondFaction();
      const candidates = selectedFaction ? getLineupUnitsInBond(selectedFaction) : [];
      const targets = pickShopRandomUnits(candidates, operation.count ?? 1);
      applyShopUnitBonuses(
        targets,
        operation.attack ?? 0,
        operation.health ?? 0,
        context.card.name,
      ).forEach((unit) => affectedUnitIds.add(unit.id));
      if (targets.length > 0) {
        messages.push(
          `从人数最多的已激活“${selectedFaction}”羁绊中选中${targets
            .map((unit) => unit.name)
            .join("、")}，分别永久 +${operation.attack ?? 0}/+${operation.health ?? 0}`,
        );
      }
      return;
    }

    if (operation.type === "buff-frontmost-highest-bond") {
      selectedFaction ??= pickHighestActiveBondFaction();
      const candidates = selectedFaction ? getLineupUnitsInBond(selectedFaction) : [];
      const count = Math.max(0, operation.count ?? 1);
      const targets = count > 0 ? candidates.slice(-count) : [];
      applyShopUnitBonuses(
        targets,
        operation.attack ?? 0,
        operation.health ?? 0,
        context.card.name,
      ).forEach((unit) => affectedUnitIds.add(unit.id));
      if (targets.length > 0) {
        messages.push(
          `人数最多的已激活“${selectedFaction}”羁绊中最前方的${targets
            .map((unit) => unit.name)
            .join("、")}分别永久 +${operation.attack ?? 0}/+${operation.health ?? 0}`,
        );
      }
      return;
    }

    if (operation.type === "buff-inactive-bonds") {
      const inactiveFactions = getBondEntries()
        .filter((entry) => entry.count < 2)
        .map((entry) => entry.faction);
      const inactiveSet = new Set(inactiveFactions);
      const targets = getLineupUnits().filter((unit) =>
        getEffectiveUnitBonds(unit).some((faction) => inactiveSet.has(faction)),
      );
      applyShopUnitBonuses(
        targets,
        operation.attack ?? 0,
        operation.health ?? 0,
        context.card.name,
      ).forEach((unit) => affectedUnitIds.add(unit.id));
      if (targets.length > 0) {
        messages.push(
          `${targets.map((unit) => unit.name).join("、")}分别永久 +${
            operation.attack ?? 0
          }/+${operation.health ?? 0}`,
        );
      }
      return;
    }

    if (operation.type === "buff-shop-selected-bond" && selectedFaction) {
      const cumulativeBonus = addShopBondBonus(
        selectedFaction,
        operation.attack ?? 0,
        operation.health ?? 0,
      );
      const targets = state.shop.filter(
        (card) => card?.type === "hero" && getBaseUnitBonds(card).includes(selectedFaction),
      );
      targets.forEach((card) => {
        syncShopHeroCardBonuses(card);
        affectedShopCardIds.add(card.id);
      });
      messages.push(
        `本局商店的“${selectedFaction}”羁绊武将加成累计为 +${
          cumulativeBonus.attack
        }/+${cumulativeBonus.health}；当前商店影响 ${
          targets.length > 0 ? targets.map((card) => card.name).join("、") : "0 张卡牌"
        }，未来刷新与奖励生成的同羁绊武将也会继承`,
      );
      return;
    }

    if (operation.type === "buff-all-highest-bond") {
      selectedFaction ??= pickHighestActiveBondFaction();
      const targets = selectedFaction ? getLineupUnitsInBond(selectedFaction) : [];
      applyShopUnitBonuses(
        targets,
        operation.attack ?? 0,
        operation.health ?? 0,
        context.card.name,
      ).forEach((unit) => affectedUnitIds.add(unit.id));
      if (targets.length > 0) {
        messages.push(
          `人数最多的已激活“${selectedFaction}”羁绊下的${targets
            .map((unit) => unit.name)
            .join("、")}分别永久 +${operation.attack ?? 0}/+${operation.health ?? 0}`,
        );
      }
      return;
    }

    if (operation.type === "grant-experience" && context.targetUnit) {
      const result = grantUnitExperience(
        context.targetUnit,
        operation.amount ?? 0,
        context.card.name,
      );
      if (result.granted > 0 || result.convertedToStats > 0) {
        affectedUnitIds.add(context.targetUnit.id);
        const experienceMessage =
          result.granted > 0
            ? `经验值 +${result.granted}，当前为 ${result.level} 级 ${result.experience} 经验${
                result.leveledUp ? "，并触发升级" : ""
              }`
            : "";
        const overflowMessage =
          result.convertedToStats > 0
            ? `${experienceMessage ? "；" : ""}${result.convertedToStats} 点溢出经验转化为 +${result.convertedToStats}/+${result.convertedToStats}`
            : "";
        messages.push(`${context.targetUnit.name}${experienceMessage}${overflowMessage}`);
      }
      return;
    }

    if (operation.type === "gain-gold") {
      const before = state.gold;
      state.gold = Math.min(GOLD_CAP, state.gold + Math.max(0, operation.amount ?? 0));
      messages.push(`获得 ${state.gold - before} 金币，当前 ${state.gold} 金币`);
      return;
    }

    if (operation.type === "generate-shop-cards") {
      const names = Array.isArray(operation.names) ? operation.names : [];
      const added = addFreeShopItemsByName(names, context.card.name);
      messages.push(
        `生成 ${added.length} 张免费商店卡${
          added.length ? `：${added.map((card) => card.name).join("、")}` : ""
        }`,
      );
      return;
    }

    if (operation.type === "unlock-five-person-bond" && selectedFaction) {
      if (!state.unlockedFivePersonBonds.includes(selectedFaction)) {
        state.unlockedFivePersonBonds.push(selectedFaction);
      }
      messages.push(`“${selectedFaction}”羁绊的5人效果资格在本局永久解锁`);
      return;
    }

    if (operation.type === "scaling-body-stats" && context.targetUnit) {
      const attack =
        (operation.baseAttack ?? 0) + priorUseCount * (operation.attackPerPriorUse ?? 0);
      const health =
        (operation.baseHealth ?? 0) + priorUseCount * (operation.healthPerPriorUse ?? 0);
      applyShopUnitStatBonus(context.targetUnit, attack, health, context.card.name);
      affectedUnitIds.add(context.targetUnit.id);
      messages.push(
        `${context.targetUnit.name}永久获得 +${attack}/+${health}（第 ${
          priorUseCount + 1
        } 次使用）`,
      );
    }
  });

  const applied = messages.length > 0;
  if (applied) state.stratagemUseCounts[effectId] = priorUseCount + 1;
  recordShopEffectEvent("stratagem:use", {
    sourceEffectId: effectId,
    sourceName: context.card.name,
    targetId: context.targetUnit?.id ?? null,
    targetName: context.targetUnit?.name ?? null,
    selectedFaction,
    affectedUnitIds: [...affectedUnitIds],
    affectedShopCardIds: [...affectedShopCardIds],
    useCount: applied ? priorUseCount + 1 : priorUseCount,
    applied,
  });
  if (applied) {
    dispatchShopEvent("stratagem:use", {
      card: context.card,
      unit: context.targetUnit ?? null,
      selectedFaction,
      affectedUnitIds: [...affectedUnitIds],
      affectedShopCardIds: [...affectedShopCardIds],
    });
  }
  return {
    applied,
    messages,
    selectedFaction,
    affectedUnitIds: [...affectedUnitIds],
    affectedShopCardIds: [...affectedShopCardIds],
  };
}

function getCurrentShopBondEffectCount(faction) {
  return getBondEntries().find((entry) => entry.faction === faction)?.effectCount ?? 0;
}

function resolveShopUpgradeBondEffects(unit, previousLevel, currentLevel) {
  const shuEffectCount = getCurrentShopBondEffectCount("蜀");
  if (shuEffectCount <= 0 || !getEffectiveUnitBonds(unit).includes("蜀")) return false;

  const statGain = shuEffectCount >= 5 ? 2 : shuEffectCount >= 4 ? 1 : shuEffectCount - 1;
  const affectsArmy = shuEffectCount >= 4;
  let queuedAnimation = false;
  for (let level = previousLevel + 1; level <= currentLevel; level += 1) {
    const targets = affectsArmy ? getLineupUnits() : [unit];
    targets.forEach((target) => {
      queuedAnimation =
        applyShopUnitStatBonus(
          target,
          statGain,
          statGain,
          `${BOND_RULES.蜀.label} ${shuEffectCount}人`,
        ) || queuedAnimation;
    });
    const targetLabel = affectsArmy ? "全军" : unit.name;
    addLog(
      `${BOND_RULES.蜀.label} ${shuEffectCount}人：${unit.name} 升到 ${level} 级，${targetLabel}永久 +${statGain}/+${statGain}。`,
    );
    recordShopEffectEvent("unit:upgrade", {
      sourceEffectId: "bond.shu-upgrade",
      sourceName: `${BOND_RULES.蜀.label} ${shuEffectCount}人`,
      targetId: unit.id,
      targetName: unit.name,
      unitLevel: level,
      affectedUnitIds: targets.map((target) => target.id),
      message: `${BOND_RULES.蜀.label} ${shuEffectCount}人：${unit.name}升级，${
        affectsArmy ? "全军" : unit.name
      }获得 +${statGain}/+${statGain}。`,
    });
  }
  return queuedAnimation;
}

function canMergeCardIntoUnit(card, unit) {
  return Boolean(
    card &&
      unit &&
      card.type === "hero" &&
      card.name === unit.name &&
      getUnitProgressValue(unit) + 1 <= UNIT_LEVEL_COPY_THRESHOLDS[MAX_UNIT_LEVEL],
  );
}

function canMergeUnits(sourceUnit, targetUnit) {
  return Boolean(
    sourceUnit &&
      targetUnit &&
      sourceUnit !== targetUnit &&
      sourceUnit.name === targetUnit.name &&
      getUnitProgressValue(sourceUnit) + getUnitProgressValue(targetUnit) <=
        UNIT_LEVEL_COPY_THRESHOLDS[MAX_UNIT_LEVEL],
  );
}

function inheritEmptyMergeSlots(targetUnit, sourceUnit) {
  const targetModifiers = targetUnit.directModifiers ?? {};
  const sourceModifiers = sourceUnit.directModifiers ?? {};
  const modifierKeys = new Set([...Object.keys(targetModifiers), ...Object.keys(sourceModifiers)]);
  targetUnit.directModifiers = { ...targetModifiers };
  modifierKeys.forEach((key) => {
    const targetValue = targetUnit.directModifiers[key];
    const targetIsEmpty =
      targetValue == null || (Array.isArray(targetValue) && targetValue.length === 0);
    if (targetIsEmpty && sourceModifiers[key] != null) {
      targetUnit.directModifiers[key] = cloneDirectModifier(sourceModifiers[key]);
    }
  });

  if ((targetUnit.extraFactions ?? []).length === 0 && (sourceUnit.extraFactions ?? []).length > 0) {
    targetUnit.extraFactions = [...sourceUnit.extraFactions];
  }
  if (
    (targetUnit.tempExtraFactions ?? []).length === 0 &&
    (sourceUnit.tempExtraFactions ?? []).length > 0
  ) {
    targetUnit.tempExtraFactions = [...sourceUnit.tempExtraFactions];
  }
}

function mergeUnitIntoTarget(sourceUnit, targetUnit) {
  if (!canMergeUnits(sourceUnit, targetUnit)) return null;

  const previousLevel = targetUnit.level;
  ensureUnitBodyStats(sourceUnit);
  ensureUnitBodyStats(targetUnit);
  targetUnit.bodyAttack = Math.max(targetUnit.bodyAttack, sourceUnit.bodyAttack);
  targetUnit.bodyHealth = Math.max(targetUnit.bodyHealth, sourceUnit.bodyHealth);
  targetUnit.copies = getUnitCopies(targetUnit) + getUnitCopies(sourceUnit);
  targetUnit.bonusExperience =
    Math.max(0, targetUnit.bonusExperience ?? 0) +
    Math.max(0, sourceUnit.bonusExperience ?? 0);
  const progress = getUnitProgress(getUnitProgressValue(targetUnit));
  targetUnit.level = progress.level;
  targetUnit.experience = progress.experience;
  inheritEmptyMergeSlots(targetUnit, sourceUnit);
  syncUnitStats(targetUnit);

  return {
    leveledUp: targetUnit.level > previousLevel,
    previousLevel,
    level: targetUnit.level,
    experience: targetUnit.experience,
    copies: targetUnit.copies,
  };
}

function mergeCardIntoUnit(card, targetUnit) {
  if (!canMergeCardIntoUnit(card, targetUnit)) return null;
  return mergeUnitIntoTarget(createUnitFromCard(card), targetUnit);
}

function queueUpgradeRewards(
  unit,
  previousLevel,
  currentLevel,
  { deferFirstReward = false } = {},
) {
  const rewardTier = Math.min(6, getTier(state.round) + 1);
  const pool = CARD_POOLS.hero.filter((hero) => hero.tier === rewardTier);
  for (let level = previousLevel + 1; level <= currentLevel; level += 1) {
    const candidates = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    state.pendingRewards.push({
      unitName: unit.name,
      level,
      rewardTier,
      candidates,
      availableRound: resolvingEndTurn ? state.round + 1 : state.round,
      ready:
        !resolvingEndTurn &&
        !(deferFirstReward && level === previousLevel + 1),
    });
  }
}

function selectUpgradeReward(candidateIndex) {
  const reward = state.pendingRewards[0];
  const base = reward?.candidates[candidateIndex];
  if (!reward || reward.ready === false || !base) return;

  clearAllBondSelectionHints();
  const card = createCardFromBase({ ...base, cost: HERO_COST }, "hero");
  card.isReward = true;
  addCardsToSharedShop([card], "升级奖励");
  state.pendingRewards.shift();
  addLog(
    `${reward.unitName} 升到 ${reward.level} 级：选择 ${card.name} 作为升级奖励，购买费用 ${HERO_COST} 金币。`,
  );
  playAudioCue("rewardClaim");
  render();
}

function skipUpgradeReward() {
  const reward = state.pendingRewards[0];
  if (!reward || reward.ready === false) return;
  clearAllBondSelectionHints();
  state.pendingRewards.shift();
  addLog(`${reward.unitName} 升到 ${reward.level} 级：跳过本次升级奖励。`);
  playAudioCue("uiCancel");
  render();
}

function buildShop({ guaranteeFaction = null } = {}) {
  const rule = getShopRule(state.round);
  const lockedCards = state.shop.filter((card) => card?.isLocked);
  const lockedHeroes = lockedCards.filter((card) => card.type === "hero");
  const lockedItems = lockedCards.filter((card) => card.type !== "hero");
  const generatedHeroes = [];
  const generatedItems = [];

  for (let index = lockedHeroes.length; index < rule.heroSlots; index += 1) {
    generatedHeroes.push(
      guaranteeFaction && generatedHeroes.length === 0
        ? createHeroCardByFaction(guaranteeFaction)
        : createCard("hero"),
    );
  }
  for (let index = lockedItems.length; index < rule.itemSlots; index += 1) {
    generatedItems.push(createCard("stratagem"));
  }

  const heroes = [...lockedHeroes, ...generatedHeroes];
  const items = [...generatedItems, ...lockedItems];
  state.shop = Array.from({ length: SHOP_POSITION_COUNT }, () => null);
  heroes.slice(0, SHOP_POSITION_COUNT).forEach((card, index) => {
    state.shop[index] = card;
  });
  const itemCount = Math.min(items.length, SHOP_POSITION_COUNT - heroes.length);
  if (itemCount > 0) {
    items.slice(-itemCount).forEach((card, index) => {
      state.shop[SHOP_POSITION_COUNT - itemCount + index] = card;
    });
  }
}

function refreshShop({ free = false, guaranteeFaction = null } = {}) {
  if (!free && isRoundRewardBlockingShop({ notifyPlayer: true })) return;
  if (!free && state.gold < REFRESH_COST) {
    notify("金币不足，无法刷新。");
    return;
  }

  if (!free) state.gold -= REFRESH_COST;

  buildShop({ guaranteeFaction });

  addLog(free ? "商店已生成本回合内容。" : "消耗 1 金币刷新商店。");
  if (!free) playAudioCue("shopRefresh");
  render();
}

function buyHeroToLineup(shopIndex, lineupIndex, intent = null) {
  if (state.phase !== "shop") return;
  if (isRoundRewardBlockingShop({ notifyPlayer: true })) return;
  const card = state.shop[shopIndex];
  if (!card || card.type !== "hero") return;
  if (state.gold < card.cost) {
    notify("金币不足，无法购买武将。");
    return;
  }
  const targetUnit = state.lineup[lineupIndex];
  const insertionDirection = intent?.mode === "insert" ? intent.direction : 0;
  const insertionGap =
    intent?.targetIndex === lineupIndex &&
    targetUnit &&
    (insertionDirection === -1 || insertionDirection === 1)
      ? findLineupInsertionGap(lineupIndex, null, insertionDirection)
      : null;
  const shouldInsert =
    insertionGap !== null && insertionGap === intent?.emptyIndex;
  if (targetUnit && targetUnit.name !== card.name && !shouldInsert) {
    notify("目标阵容槽已有其他武将。");
    return;
  }
  if (targetUnit && !shouldInsert && !canMergeCardIntoUnit(card, targetUnit)) {
    notify(`${targetUnit.name} 已达到 3 级，不能继续叠加。`);
    return;
  }

  const previousBondCounts = getShopBondCountSnapshot();
  state.gold -= card.cost;
  state.shop[shopIndex] = null;
  let unit = targetUnit;
  let mergeResult = null;
  const isNewUnit = !targetUnit || shouldInsert;
  if (!isNewUnit) {
    const result = mergeCardIntoUnit(card, unit);
    mergeResult = result;
    addLog(
      result.leveledUp
        ? `拖拽叠加 ${card.name}，升级为 ${result.level} 级。`
        : `拖拽叠加 ${card.name}，当前为 ${result.level} 级 ${result.experience} 经验。`,
    );
    if (result.leveledUp) {
      const queuedUpgradeAnimation = queueShopUpgradeAnimation(
        unit,
        result.level,
        card.name,
      );
      const queuedBondAnimation = resolveShopUpgradeBondEffects(
        unit,
        result.previousLevel,
        result.level,
      );
      const deferReward = queuedUpgradeAnimation || queuedBondAnimation;
      queueUpgradeRewards(unit, result.previousLevel, result.level, {
        deferFirstReward: deferReward,
      });
    }
  } else {
    unit = createUnitFromCard(card);
    if (shouldInsert) {
      shiftLineupForInsertion(
        unit,
        lineupIndex,
        insertionDirection,
        insertionGap,
      );
      addLog(
        `拖拽购买 ${card.name} 到 ${lineupIndex + 1} 号阵容槽，向${
          insertionDirection < 0 ? "左" : "右"
        }挤动至 ${insertionGap + 1} 号空位（1级0经验）。`,
      );
    } else {
      state.lineup[lineupIndex] = unit;
      addLog(`拖拽购买 ${card.name} 到 ${lineupIndex + 1} 号阵容槽（1级0经验）。`);
    }
  }
  dispatchShopEvent("card:purchase", { card, unit, isNewUnit });
  dispatchShopEvent("unit:recruit", { card, unit, isNewUnit });
  if (isNewUnit) {
    dispatchShopEvent("unit:summon", { card, unit, source: "purchase" });
  } else {
    dispatchShopEvent("experience:gain", {
      unit,
      amount: 1,
      sourceName: card.name,
      sourceEffectId: "system.recruit-merge",
    });
    if (mergeResult?.leveledUp) {
      dispatchShopEvent("unit:upgrade", {
        unit,
        previousLevel: mergeResult.previousLevel,
        level: mergeResult.level,
        sourceName: card.name,
        sourceEffectId: "system.recruit-merge",
      });
    }
  }
  dispatchShopBondCountChanges(previousBondCounts);
  if (isNewUnit) {
    playAudioCue("heroRecruit");
  } else if (!mergeResult?.leveledUp) {
    playAudioCue("cardMove");
  }
  render();
}

function buyEquipmentToLineup(shopIndex, lineupIndex) {
  if (state.phase !== "shop") return;
  if (isRoundRewardBlockingShop({ notifyPlayer: true })) return;
  const card = state.shop[shopIndex];
  const unit = state.lineup[lineupIndex];
  if (!card || card.type !== "stratagem" || card.category !== "装备") return;
  if (!unit) {
    notify("装备只能交给阵容中的武将。");
    return;
  }
  if (getUnitEquipment(unit)) {
    notify(`${unit.name} 已有装备，请先移动或出售原装备。`);
    return;
  }
  if (state.gold < card.cost) {
    notify("金币不足，无法购买装备。");
    return;
  }

  state.gold -= card.cost;
  state.shop[shopIndex] = null;
  unit.directModifiers ??= {};
  unit.directModifiers.equipment = createEquipmentFromCard(card);
  syncUnitStats(unit);
  addLog(
    isEffectImplemented(card.effectId)
      ? `购买装备 ${card.name}，由 ${unit.name} 佩戴；真实效果已接入。`
      : `购买装备 ${card.name}，由 ${unit.name} 佩戴；当前只展示描述，不执行真实效果。`,
  );
  playAudioCue("equipmentEquip");
  render();
}

function getStratagemUseValidation(card, targetUnit) {
  if (!card?.effectId || !getEffectDefinition(card.effectId)) {
    return { valid: false, reason: `${card?.name ?? "该计策"}尚未配置结构化效果。` };
  }

  if (card.targetMode === "unit" && !targetUnit) {
    return { valid: false, reason: `${card.name}需要拖到一名阵容武将上。` };
  }

  if (card.effectId === "stratagem.temporary-bond") {
    const factions = getAvailableExtraBondFactions(targetUnit);
    return factions.length > 0
      ? {
          valid: true,
          requiresBondChoice: true,
          availableFactions: factions,
          choiceDescription: `为${targetUnit.name}选择一个持续到本回合结束的额外羁绊。`,
        }
      : { valid: false, reason: `${targetUnit.name}已经拥有两个羁绊，无法再添加。` };
  }

  if (card.effectId === "reward.alliance-scroll") {
    const factions = getAvailableExtraBondFactions(targetUnit);
    return factions.length > 0
      ? {
          valid: true,
          requiresBondChoice: true,
          availableFactions: factions,
          choiceDescription: `为${targetUnit.name}选择一个本局永久额外羁绊。`,
        }
      : { valid: false, reason: `${targetUnit.name}已经拥有两个羁绊，无法再添加。` };
  }

  if (card.effectId === "reward.united-bond") {
    const factions = getHighestBondFactions({ excludeUnlocked: true });
    if (factions.length === 0) {
      return { valid: false, reason: "当前没有可解锁5人效果的羁绊。" };
    }
    return {
      valid: true,
      requiresBondChoice: factions.length > 1,
      availableFactions: factions,
      defaultFaction: factions.length === 1 ? factions[0] : null,
      choiceDescription: "人数最多的羁绊并列，请选择其中1个解锁5人效果。",
    };
  }

  if (
    card.effectId === "stratagem.recommend-talent" ||
    card.effectId === "stratagem.advance-together" ||
    card.effectId === "stratagem.united-force"
  ) {
    const factions = getHighestActiveBondFactions().filter(
      (faction) => getLineupUnitsInBond(faction).length > 0,
    );
    return factions.length > 0
      ? { valid: true }
      : { valid: false, reason: `${card.name}需要阵容中至少存在一个已激活羁绊。` };
  }

  if (card.effectId === "stratagem.hidden-potential") {
    const inactiveFactions = new Set(
      getBondEntries()
        .filter((entry) => entry.count < 2)
        .map((entry) => entry.faction),
    );
    const hasTarget = getLineupUnits().some((unit) =>
      getEffectiveUnitBonds(unit).some((faction) => inactiveFactions.has(faction)),
    );
    return hasTarget
      ? { valid: true }
      : { valid: false, reason: "当前阵容中没有属于未激活羁绊的武将。" };
  }

  if (card.effectId === "stratagem.train-army") {
    return {
      valid: true,
      requiresBondChoice: true,
      availableFactions: [...BOND_FACTIONS],
      choiceDescription:
        "选择一个羁绊：本局当前及未来生成的该羁绊商店武将均获得累计 +2/+2。",
    };
  }

  return { valid: true };
}

function completeStratagemUse(shopIndex, lineupIndex, selectedFaction = null) {
  const card = state.shop[shopIndex];
  const targetUnit = state.lineup[lineupIndex];
  if (!card || card.type !== "stratagem" || card.category !== "计策") return false;
  if (state.gold < card.cost) {
    notify("金币不足，无法使用计策。");
    return false;
  }

  const validation = getStratagemUseValidation(card, targetUnit);
  if (!validation.valid) {
    notify(validation.reason);
    return false;
  }
  const resolvedFaction = selectedFaction ?? validation.defaultFaction ?? null;
  if (
    validation.requiresBondChoice &&
    !validation.availableFactions.includes(resolvedFaction)
  ) {
    notify("请选择一个有效羁绊。");
    return false;
  }

  const previousBondCounts = getShopBondCountSnapshot();
  state.shop[shopIndex] = null;
  const outcome = resolveShopEffect(card.effectId, {
    card,
    targetUnit,
    targetIndex: lineupIndex,
    selectedFaction: resolvedFaction,
  });
  if (!outcome.applied) {
    state.shop[shopIndex] = card;
    notify(`${card.name}当前没有可结算的目标。`);
    return false;
  }

  state.gold -= card.cost;
  state.pendingStratagemUse = null;
  dispatchShopBondCountChanges(previousBondCounts);
  const targetLabel =
    card.targetMode === "unit"
      ? `，目标为 ${targetUnit.name}`
      : `，由 ${lineupIndex + 1} 号阵容位触发`;
  addLog(`使用计策 ${card.name}${targetLabel}：${outcome.messages.join("；")}。`);
  playAudioCue("stratagemUse");
  render();
  return true;
}

function useStratagemOnLineup(shopIndex, lineupIndex) {
  if (state.phase !== "shop") return;
  if (isRoundRewardBlockingShop({ notifyPlayer: true })) return;
  if (state.pendingStratagemUse) return;
  const card = state.shop[shopIndex];
  const targetUnit = state.lineup[lineupIndex];
  if (!card || card.type !== "stratagem" || card.category !== "计策") return;
  if (state.gold < card.cost) {
    notify("金币不足，无法使用计策。");
    return;
  }

  const validation = getStratagemUseValidation(card, targetUnit);
  if (!validation.valid) {
    notify(validation.reason);
    return;
  }
  if (validation.requiresBondChoice) {
    state.pendingStratagemUse = {
      shopIndex,
      lineupIndex,
      cardId: card.id,
      cardName: card.name,
      availableFactions: validation.availableFactions,
      choiceDescription: validation.choiceDescription,
    };
    render();
    return;
  }
  completeStratagemUse(shopIndex, lineupIndex, validation.defaultFaction ?? null);
}

function selectStratagemBondChoice(faction) {
  const pending = state.pendingStratagemUse;
  if (!pending || !pending.availableFactions.includes(faction)) return;
  if (pending.generated) {
    completeGeneratedStratagemUse(faction);
    return;
  }
  completeStratagemUse(pending.shopIndex, pending.lineupIndex, faction);
}

function cancelStratagemChoice() {
  if (!state.pendingStratagemUse || state.pendingStratagemUse.generated) return;
  state.pendingStratagemUse = null;
  render();
}

function selectHeroBondChoice(optionIndex) {
  const pending = state.pendingHeroBondChoice;
  const option = pending?.options?.[optionIndex];
  const unit = option
    ? getLineupUnits().find((candidate) => candidate.id === option.unitId)
    : null;
  if (!pending || !option || !unit) return;
  const previousBondCounts = getShopBondCountSnapshot();
  if (!addExtraBond(unit, option.faction)) {
    notify("该羁绊选择已经失效，请重新选择。");
    return;
  }
  state.pendingHeroBondChoice = null;
  dispatchShopBondCountChanges(previousBondCounts);
  addLog(`${pending.ownerName}【广识】：为${unit.name}永久添加“${option.faction}”羁绊。`);
  playAudioCue("bondGain");
  render();
}

function moveOrSwapEquipment(sourceIndex, targetIndex) {
  if (isRoundRewardBlockingShop({ notifyPlayer: true })) return;
  if (sourceIndex === targetIndex) return;
  const sourceUnit = state.lineup[sourceIndex];
  const targetUnit = state.lineup[targetIndex];
  const sourceEquipment = getUnitEquipment(sourceUnit);
  if (!sourceUnit || !sourceEquipment) return;
  if (!targetUnit) {
    notify("装备只能交给阵容中的武将。");
    return;
  }

  const targetEquipment = getUnitEquipment(targetUnit);
  sourceUnit.directModifiers.equipment = targetEquipment
    ? cloneDirectModifier(targetEquipment)
    : null;
  targetUnit.directModifiers ??= {};
  targetUnit.directModifiers.equipment = cloneDirectModifier(sourceEquipment);
  syncUnitStats(sourceUnit);
  syncUnitStats(targetUnit);
  addLog(
    targetEquipment
      ? `${sourceUnit.name} 与 ${targetUnit.name} 交换装备：${sourceEquipment.name} / ${targetEquipment.name}。`
      : `${sourceUnit.name} 将 ${sourceEquipment.name} 交给 ${targetUnit.name}。`,
  );
  playAudioCue(targetEquipment ? "equipmentSwap" : "equipmentEquip");
  render();
}

function clearLineupDropState() {
  document.querySelectorAll(".lineup-slot").forEach((slot) => {
    slot.classList.remove(
      "drop-target",
      "drop-merge",
      "drop-blocked",
      "drop-insert-left",
      "drop-insert-right",
      "drop-insert-gap",
      "drop-shift-left",
      "drop-shift-right",
    );
  });
}

function setSellZoneVisible(visible) {
  elements.sellZone?.classList.toggle("visible", visible);
  elements.sellZone?.classList.remove("drag-over");
  elements.sellZone?.setAttribute("aria-hidden", visible ? "false" : "true");
}

function isPointInSellZone(clientX, clientY) {
  if (!elements.sellZone?.classList.contains("visible")) return false;
  const rect = elements.sellZone.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function markSellZoneTarget(clientX, clientY) {
  elements.sellZone?.classList.toggle("drag-over", isPointInSellZone(clientX, clientY));
}

function clearDragPreview() {
  if (dragPreviewElement && dragPreviewOrigin) {
    const {
      parent,
      nextSibling,
      className,
      styleAttribute,
      originSlot,
      equipmentPlaceholder,
    } = dragPreviewOrigin;
    if (nextSibling?.parentNode === parent) {
      parent.insertBefore(dragPreviewElement, nextSibling);
    } else {
      parent.append(dragPreviewElement);
    }
    dragPreviewElement.className = className;
    if (styleAttribute === null) {
      dragPreviewElement.removeAttribute("style");
    } else {
      dragPreviewElement.setAttribute("style", styleAttribute);
    }
    originSlot?.classList.remove("drag-origin-empty");
    equipmentPlaceholder?.remove();
  }
  dragPreviewElement = null;
  dragPreviewOrigin = null;
}

function startDragPreview(sourceElement, clientX, clientY) {
  clearDragPreview();
  if (!sourceElement) return;

  const rect = sourceElement.getBoundingClientRect();
  const baseWidth = sourceElement.offsetWidth || rect.width || 1;
  const isEquipment = sourceElement.classList.contains("hero-equipment-slot");
  const originSlot = isEquipment
    ? null
    : sourceElement.closest(".lineup-slot, .shop-slot-shell");
  const equipmentPlaceholder = isEquipment
    ? document.createElement("div")
    : null;
  if (equipmentPlaceholder) {
    equipmentPlaceholder.className =
      "hero-equipment-slot empty drag-origin-equipment-placeholder";
    equipmentPlaceholder.setAttribute("aria-hidden", "true");
    sourceElement.parentNode.insertBefore(equipmentPlaceholder, sourceElement);
  }
  originSlot?.classList.add("drag-origin-empty");
  dragPreviewOrigin = {
    parent: sourceElement.parentNode,
    nextSibling: sourceElement.nextSibling,
    className: sourceElement.className,
    styleAttribute: sourceElement.getAttribute("style"),
    originSlot,
    equipmentPlaceholder,
  };
  sourceElement.classList.add(
    "drag-source-follow",
    isEquipment ? "equipment-follow" : "card-follow",
  );
  sourceElement.style.setProperty("--drag-scale", String(rect.width / baseWidth));
  document.body.append(sourceElement);
  dragPreviewElement = sourceElement;
  updateDragPreview(clientX, clientY);
}

function updateDragPreview(clientX, clientY) {
  if (!dragPreviewElement) return;
  dragPreviewElement.style.left = `${clientX}px`;
  dragPreviewElement.style.top = `${clientY}px`;
}

function showDragPreview() {
  dragPreviewElement?.classList.add("visible");
}

function markLineupDropTarget(clientX, clientY) {
  clearLineupDropState();
  const target = document.elementFromPoint(clientX, clientY)?.closest(".lineup-slot");
  if (!target) return;
  const lineupIndex = Number.parseInt(target.dataset.lineupIndex, 10);
  if (!Number.isInteger(lineupIndex)) return;
  const card = state.shop[pointerDraggedShopIndex];
  const unit = state.lineup[lineupIndex];
  if (card?.category === "装备") {
    const canEquip = Boolean(unit && !getUnitEquipment(unit));
    target.classList.toggle("drop-target", canEquip);
    target.classList.toggle("drop-blocked", !canEquip);
    return;
  }
  if (card?.category === "计策") {
    const canUse = card.targetMode !== "unit" || Boolean(unit);
    target.classList.toggle("drop-target", canUse);
    target.classList.toggle("drop-blocked", !canUse);
    return;
  }
  const intent = getShopHeroDragIntent(
    clientX,
    clientY,
    pointerDraggedShopIndex,
  );
  if (!intent) return;
  if (intent.mode === "merge") {
    intent.target.classList.add("drop-merge");
    return;
  }
  if (intent.mode === "blocked") {
    intent.target.classList.add("drop-blocked");
    return;
  }
  intent.target.classList.add("drop-target");
  markLineupInsertionPreview(intent);
}

function markLineupEquipmentTarget(clientX, clientY, sourceIndex) {
  clearLineupDropState();
  const target = document.elementFromPoint(clientX, clientY)?.closest(".lineup-slot");
  if (!target) return;
  const lineupIndex = Number.parseInt(target.dataset.lineupIndex, 10);
  if (!Number.isInteger(lineupIndex) || lineupIndex === sourceIndex) return;
  target.classList.add(state.lineup[lineupIndex] ? "drop-target" : "drop-blocked");
}

function beginLineupDragDirection(clientX) {
  lineupDragDirection = 0;
  lineupDragDirectionAnchorX = clientX;
}

function updateLineupDragDirection(clientX) {
  if (lineupDragDirectionAnchorX === null) {
    lineupDragDirectionAnchorX = clientX;
    return lineupDragDirection;
  }

  const horizontalDelta = clientX - lineupDragDirectionAnchorX;
  if (Math.abs(horizontalDelta) >= LINEUP_DRAG_DIRECTION_THRESHOLD) {
    lineupDragDirection = Math.sign(horizontalDelta);
    lineupDragDirectionAnchorX = clientX;
  }
  return lineupDragDirection;
}

function resetLineupDragDirection() {
  lineupDragDirection = 0;
  lineupDragDirectionAnchorX = null;
}

function findLineupInsertionGap(targetIndex, sourceIndex, direction) {
  for (
    let emptyIndex = targetIndex + direction;
    emptyIndex >= 0 && emptyIndex < LINEUP_SLOT_COUNT;
    emptyIndex += direction
  ) {
    if (emptyIndex === sourceIndex || state.lineup[emptyIndex] === null) {
      return emptyIndex;
    }
  }
  return null;
}

function getShopHeroDragIntent(
  clientX,
  clientY,
  shopIndex,
  directionHint = lineupDragDirection,
) {
  const target = document.elementFromPoint(clientX, clientY)?.closest(".lineup-slot");
  if (!target) return null;
  const targetIndex = Number.parseInt(target.dataset.lineupIndex, 10);
  const card = state.shop[shopIndex];
  if (!Number.isInteger(targetIndex) || card?.type !== "hero") return null;
  const targetUnit = state.lineup[targetIndex];

  if (!targetUnit) {
    return { mode: "move", target, targetIndex };
  }

  let direction = directionHint;
  if (direction === 0) {
    const rect = target.getBoundingClientRect();
    const horizontalRatio =
      rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5;
    direction =
      horizontalRatio <= LINEUP_INSERT_EDGE_RATIO
        ? -1
        : horizontalRatio >= 1 - LINEUP_INSERT_EDGE_RATIO
          ? 1
          : 0;
  }

  if (direction !== 0) {
    const emptyIndex = findLineupInsertionGap(targetIndex, null, direction);
    if (emptyIndex !== null) {
      return {
        mode: "insert",
        target,
        targetIndex,
        direction,
        emptyIndex,
      };
    }
  }

  if (targetUnit.name === card.name && canMergeCardIntoUnit(card, targetUnit)) {
    return { mode: "merge", target, targetIndex };
  }
  return { mode: "blocked", target, targetIndex };
}

function getLineupDragIntent(
  clientX,
  clientY,
  sourceIndex,
  directionHint = lineupDragDirection,
) {
  const target = document.elementFromPoint(clientX, clientY)?.closest(".lineup-slot");
  if (!target) return null;
  const targetIndex = Number.parseInt(target.dataset.lineupIndex, 10);
  if (!Number.isInteger(targetIndex) || targetIndex === sourceIndex) return null;
  const sourceUnit = state.lineup[sourceIndex];
  const targetUnit = state.lineup[targetIndex];
  if (!sourceUnit) return null;

  if (!targetUnit) {
    return { mode: "move", target, targetIndex };
  }

  let direction = directionHint;
  if (direction === 0) {
    const rect = target.getBoundingClientRect();
    const horizontalRatio =
      rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5;
    direction =
      horizontalRatio <= LINEUP_INSERT_EDGE_RATIO
        ? -1
        : horizontalRatio >= 1 - LINEUP_INSERT_EDGE_RATIO
          ? 1
          : 0;
  }

  if (direction !== 0) {
    const emptyIndex = findLineupInsertionGap(
      targetIndex,
      sourceIndex,
      direction,
    );
    if (emptyIndex !== null) {
      return {
        mode: "insert",
        target,
        targetIndex,
        direction,
        emptyIndex,
      };
    }
  }

  if (sourceUnit.name === targetUnit.name) {
    return {
      mode: canMergeUnits(sourceUnit, targetUnit) ? "merge" : "blocked",
      target,
      targetIndex,
    };
  }

  return { mode: "swap", target, targetIndex };
}

function markLineupReorderTarget(clientX, clientY, sourceIndex) {
  clearLineupDropState();
  const intent = getLineupDragIntent(clientX, clientY, sourceIndex);
  if (!intent) return;

  if (intent.mode === "merge") {
    intent.target.classList.add("drop-merge");
    return;
  }
  if (intent.mode === "blocked") {
    intent.target.classList.add("drop-blocked");
    return;
  }

  intent.target.classList.add("drop-target");
  markLineupInsertionPreview(intent);
}

function markLineupInsertionPreview(intent) {
  if (intent.mode !== "insert") return;

  const directionName = intent.direction < 0 ? "left" : "right";
  intent.target.classList.add(`drop-insert-${directionName}`);
  const slots = Array.from(document.querySelectorAll(".lineup-slot"));
  for (
    let shiftedIndex = intent.targetIndex;
    shiftedIndex !== intent.emptyIndex;
    shiftedIndex += intent.direction
  ) {
    slots[shiftedIndex]?.classList.add(`drop-shift-${directionName}`);
  }
  slots[intent.emptyIndex]?.classList.add("drop-insert-gap");
}

function shiftLineupForInsertion(unit, targetIndex, direction, emptyIndex) {
  for (
    let shiftedIndex = emptyIndex;
    shiftedIndex !== targetIndex;
    shiftedIndex -= direction
  ) {
    state.lineup[shiftedIndex] = state.lineup[shiftedIndex - direction];
  }
  state.lineup[targetIndex] = unit;
}

function insertLineupUnit(sourceIndex, targetIndex, direction, emptyIndex) {
  const sourceUnit = state.lineup[sourceIndex];
  if (
    !sourceUnit ||
    sourceIndex === targetIndex ||
    (direction !== -1 && direction !== 1) ||
    emptyIndex < 0 ||
    emptyIndex >= LINEUP_SLOT_COUNT ||
    (emptyIndex !== sourceIndex && state.lineup[emptyIndex] !== null)
  ) {
    return false;
  }

  state.lineup[sourceIndex] = null;
  shiftLineupForInsertion(sourceUnit, targetIndex, direction, emptyIndex);
  addLog(
    `${sourceUnit.name} 插入 ${targetIndex + 1} 号阵容位，向${
      direction < 0 ? "左" : "右"
    }挤动至 ${emptyIndex + 1} 号空位。`,
  );
  playAudioCue("cardMove");
  render();
  return true;
}

function moveOrMergeLineupUnit(sourceIndex, targetIndex, intent = null) {
  if (isRoundRewardBlockingShop({ notifyPlayer: true })) return;
  if (sourceIndex === targetIndex) return;
  const sourceUnit = state.lineup[sourceIndex];
  const targetUnit = state.lineup[targetIndex];
  if (!sourceUnit) return;

  if (
    intent?.mode === "insert" &&
    insertLineupUnit(
      sourceIndex,
      targetIndex,
      intent.direction,
      intent.emptyIndex,
    )
  ) {
    return;
  }

  if (targetUnit?.name === sourceUnit.name) {
    if (!canMergeUnits(sourceUnit, targetUnit)) {
      notify(`${targetUnit.name} 合并后会超过 3 级上限。`);
      return;
    }
    const previousBondCounts = getShopBondCountSnapshot();
    const gainedProgress = getUnitProgressValue(sourceUnit);
    const result = mergeUnitIntoTarget(sourceUnit, targetUnit);
    state.lineup[sourceIndex] = null;
    addLog(
      result.leveledUp
        ? `${sourceUnit.name} 合并到 ${targetIndex + 1} 号位，升级为 ${result.level} 级。`
        : `${sourceUnit.name} 合并到 ${targetIndex + 1} 号位，当前为 ${result.level} 级 ${result.experience} 经验。`,
    );
    if (result.leveledUp) {
      const queuedUpgradeAnimation = queueShopUpgradeAnimation(
        targetUnit,
        result.level,
        sourceUnit.name,
      );
      const queuedBondAnimation = resolveShopUpgradeBondEffects(
        targetUnit,
        result.previousLevel,
        result.level,
      );
      const deferReward = queuedUpgradeAnimation || queuedBondAnimation;
      queueUpgradeRewards(targetUnit, result.previousLevel, result.level, {
        deferFirstReward: deferReward,
      });
    }
    for (let point = 0; point < gainedProgress; point += 1) {
      dispatchShopEvent("experience:gain", {
        unit: targetUnit,
        amount: 1,
        sourceName: sourceUnit.name,
        sourceEffectId: "system.unit-merge",
      });
    }
    if (result.leveledUp) {
      dispatchShopEvent("unit:upgrade", {
        unit: targetUnit,
        previousLevel: result.previousLevel,
        level: result.level,
        sourceName: sourceUnit.name,
        sourceEffectId: "system.unit-merge",
      });
    }
    dispatchShopBondCountChanges(previousBondCounts);
    if (!result.leveledUp) playAudioCue("cardMove");
    render();
    return;
  }

  state.lineup[sourceIndex] = targetUnit;
  state.lineup[targetIndex] = sourceUnit;
  addLog(
    targetUnit
      ? `交换 ${sourceIndex + 1} 号与 ${targetIndex + 1} 号阵容位。`
      : `${sourceUnit.name} 移动到 ${targetIndex + 1} 号阵容位。`,
  );
  playAudioCue("cardMove");
  render();
}

function sellUnit(index) {
  if (state.phase !== "shop") return;
  if (isRoundRewardBlockingShop({ notifyPlayer: true })) return;
  const unit = state.lineup[index];
  if (!unit) return;
  const previousBondCounts = getShopBondCountSnapshot();
  dispatchShopEvent("unit:sell", { unit, index });
  const salePrice = unit.level;
  state.gold = Math.min(GOLD_CAP, state.gold + salePrice);
  state.lineup[index] = null;
  dispatchShopBondCountChanges(previousBondCounts);
  addLog(`出售 ${unit.name}，获得 ${salePrice} 金币。`);
  playAudioCue("heroSell");
  render();
}

function sellEquipment(index) {
  if (state.phase !== "shop") return;
  if (isRoundRewardBlockingShop({ notifyPlayer: true })) return;
  const unit = state.lineup[index];
  const equipment = getUnitEquipment(unit);
  if (!unit || !equipment) return;
  unit.directModifiers.equipment = null;
  syncUnitStats(unit);
  addLog(`出售 ${unit.name} 佩戴的 ${equipment.name}，不获得金币。`);
  playAudioCue("equipmentSell");
  render();
}

function cloneBattleUnit(unit, { side = "enemy", index = 0 } = {}) {
  const health = Number.isFinite(unit.health) ? unit.health : 1;
  const snapshotBonds =
    side === "player"
      ? getBaseUnitBonds(unit)
      : normalizeBondTags([
          unit.faction,
          ...(unit.extraFactions ?? []),
          ...(unit.tempExtraFactions ?? []),
        ]);
  return {
    id: `${side}-${unit.id ?? unit.name}-${index}`,
    sourceId: unit.id ?? null,
    name: unit.name,
    attack: Number.isFinite(unit.attack) ? unit.attack : 1,
    health,
    maxHealth: health,
    faction: unit.faction,
    extraFactions: snapshotBonds.filter((faction) => faction !== unit.faction),
    tempExtraFactions: [],
    usesBondDefinitionSnapshot: true,
    tier: unit.tier,
    side,
    lineupIndex: index,
    skill: unit.skill ?? "",
    skillEffectIds: [
      ...(unit.skillEffectIds ?? (unit.effectId ? [unit.effectId] : [])),
    ],
    equipment: cloneDirectModifier(getUnitEquipment(unit)),
    statuses: normalizeUnitStatuses(unit.statuses ?? {}),
    level: unit.level ?? 1,
    experience: unit.experience ?? 0,
    copies: getUnitCopies(unit),
    bonusExperience: unit.bonusExperience ?? 0,
    isSummon: Boolean(unit.isSummon),
    skillDisabled: false,
    skillDisabledUntilExchange: null,
    consumedSnapshot: null,
    lastDamageSource: null,
    huatuoRevivesUsedThisRound: unit.huatuoRevivesUsedThisRound ?? 0,
  };
}

function hashBattleSeed(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function getBattleSeed() {
  const lineupKey = state.lineup
    .map((unit) =>
      unit
        ? [
            unit.name,
            unit.attack,
            unit.health,
            unit.level,
            getUnitEquipment(unit)?.effectId ?? "",
            getEffectiveUnitBonds(unit).join(","),
          ].join(":")
        : "-",
    )
    .join("|");
  return hashBattleSeed(`${state.round}:${state.serial}:${lineupKey}`);
}

function getScheduledOpponentRound(round = state.round) {
  const scheduleEntry =
    state.opponentSchedule?.find((entry) => entry.round === round) ?? null;
  const poolEntry =
    state.opponentPool?.find((entry) => entry.key === scheduleEntry?.key) ?? null;
  const replayRound =
    poolEntry?.session?.rounds?.find((entry) => entry.round === round) ?? null;
  if (!scheduleEntry || !poolEntry || !replayRound) return null;
  return { scheduleEntry, poolEntry, replayRound };
}

function getReplayEquipment(equipmentSnapshot) {
  if (!equipmentSnapshot?.name) return null;
  const definition =
    CARD_POOLS.stratagem.find(
      (item) =>
        item.category === "装备" &&
        ((equipmentSnapshot.effectId && item.effectId === equipmentSnapshot.effectId) ||
          item.name === equipmentSnapshot.name),
    ) ?? {};
  return {
    ...equipmentSnapshot,
    ...definition,
    id: `enemy-replay-equipment-${definition.effectId ?? equipmentSnapshot.name}`,
    category: "装备",
  };
}

function createReplayEnemyBattleUnit(unitSnapshot, index) {
  const definition = CARD_POOLS.hero.find((hero) => hero.name === unitSnapshot.name) ?? {};
  const faction = unitSnapshot.faction ?? definition.faction ?? "无";
  const effectiveBonds = normalizeBondTags([
    ...(unitSnapshot.effectiveBonds ?? []),
    faction,
    ...(unitSnapshot.extraFactions ?? []),
    ...(unitSnapshot.temporaryExtraFactions ?? []),
  ]);
  const replayUnit = {
    ...definition,
    id: `enemy-replay-${state.round}-${unitSnapshot.slot ?? index + 1}`,
    name: unitSnapshot.name ?? definition.name ?? `回放武将${index + 1}`,
    attack: Number.isFinite(unitSnapshot.attack) ? unitSnapshot.attack : 1,
    health: Number.isFinite(unitSnapshot.health) ? unitSnapshot.health : 1,
    faction,
    extraFactions: effectiveBonds.filter((bond) => bond !== faction),
    tempExtraFactions: [],
    tier: unitSnapshot.tier ?? definition.tier ?? 0,
    level: unitSnapshot.level ?? 1,
    experience: unitSnapshot.experience ?? 0,
    copies: unitSnapshot.copies ?? 1,
    bonusExperience: unitSnapshot.bonusExperience ?? 0,
    skillEffectIds: [
      definition.effectId ?? unitSnapshot.skillEffectId,
    ].filter(Boolean),
    directModifiers: {
      equipment: getReplayEquipment(unitSnapshot.equipment),
    },
    statuses: {},
    isSummon: false,
  };
  return cloneBattleUnit(replayUnit, { side: "enemy", index });
}

function createCavalryEnemyBattleTeam() {
  const roundStat = state.round * PLAYER_DATA_TEST_ENEMY_STAT_MULTIPLIER;
  return Array.from({ length: PLAYER_DATA_TEST_ENEMY_COUNT }, (_, index) => {
    const cavalry = {
      id: `test-cavalry-${state.round}-${index + 1}`,
      name: "骑兵",
      attack: roundStat,
      health: roundStat,
      faction: "无",
      tier: 0,
      level: 1,
      experience: 0,
      copies: 1,
      bonusExperience: 0,
      skillEffectIds: [],
      equipment: null,
      statuses: {},
      isSummon: false,
    };
    return cloneBattleUnit(cavalry, { side: "enemy", index });
  });
}

function createEnemyBattleSetup() {
  const opponentRound = getScheduledOpponentRound();
  if (!opponentRound || !Array.isArray(opponentRound.replayRound.lineup)) {
    return {
      team: createCavalryEnemyBattleTeam(),
      lockedBonds: Object.fromEntries(BOND_FACTIONS.map((faction) => [faction, 0])),
      source: {
        type: "cavalry-fallback",
        round: state.round,
      },
    };
  }

  const { scheduleEntry, poolEntry, replayRound } = opponentRound;
  const team = replayRound.lineup
    .filter((unit) => unit && !unit.empty && unit.name)
    .sort((left, right) => (left.slot ?? 0) - (right.slot ?? 0))
    .reverse()
    .map(createReplayEnemyBattleUnit);
  const lockedBonds = Object.fromEntries(
    BOND_FACTIONS.map((faction) => {
      const entry = replayRound.bonds?.find((bond) => bond.faction === faction);
      const recordedCount = Number(entry?.count);
      if (Number.isFinite(recordedCount)) {
        return [
          faction,
          getBondEffectCount(
            recordedCount,
            faction,
            replayRound.unlockedFivePersonBonds ?? [],
          ),
        ];
      }
      const legacyEffectCount = { 1: 2, 2: 3, 3: 4, 4: 4 }[entry?.level] ?? 0;
      return [faction, legacyEffectCount];
    }),
  );
  return {
    team,
    lockedBonds,
    source: {
      type: "opponent-pool",
      poolKey: poolEntry.key,
      label: poolEntry.label,
      fileName: poolEntry.fileName,
      sessionId: poolEntry.session.id,
      poolSize: state.opponentPool.length,
      round: replayRound.round,
      recordedAt: replayRound.recordedAt ?? null,
      scheduleEntry: { ...scheduleEntry },
    },
  };
}

function getLockedPlayerBondEffectCounts() {
  return Object.fromEntries(
    getBondEntries().map((entry) => [entry.faction, entry.effectCount]),
  );
}

function createBattleRuntime(player, enemy, { seed, lockedBonds }) {
  const runtime = {
    teams: { player, enemy },
    battleStartPositions: new Map([
      ...player.map((unit, index) => [unit.id, { side: "player", index }]),
      ...enemy.map((unit, index) => [unit.id, { side: "enemy", index }]),
    ]),
    seed,
    random: createSeededRandom(seed),
    lockedBonds,
    phase: "battle:start",
    queue: [],
    processing: false,
    nextEventId: 1,
    nextChainId: 1,
    chainSteps: new Map(),
    abortedChains: new Set(),
    resolvedDeathIds: new Set(),
    deferredDeathIds: new Set(),
    bondCounters: {
      player: { 魏阵亡: 0 },
      enemy: { 魏阵亡: 0 },
    },
    nextSummonId: 1,
    currentEvent: null,
    currentCandidate: null,
    currentExchange: null,
    currentAttackers: null,
    log: [],
    structuredLog: [],
    presentationTimeline: [],
    presentationSequence: 1,
    presentationSnapshot: null,
  };
  runtime.presentationSnapshot = getBattlePresentationSnapshot(runtime);
  return runtime;
}

function recordBattleLog(runtime, type, message, details = {}) {
  const currentEvent = runtime.currentEvent;
  const currentCandidate = runtime.currentCandidate;
  const entry = {
    type,
    message,
    phase: details.phase ?? runtime.phase,
    exchange: details.exchange ?? runtime.currentExchange ?? null,
    eventId: details.eventId ?? currentEvent?.id ?? null,
    chainId: details.chainId ?? currentEvent?.chainId ?? null,
    parentEventId: details.parentEventId ?? currentEvent?.parentEventId ?? null,
    eventType: details.eventType ?? currentEvent?.type ?? null,
    effectId:
      details.effectId ??
      details.sourceEffectId ??
      currentCandidate?.effectId ??
      null,
    effectGroupId: details.effectGroupId ?? currentCandidate?.id ?? null,
    ...details,
  };
  runtime.log.push(message);
  runtime.structuredLog.push(entry);
  return entry;
}

function getBattlePresentationSnapshot(runtime) {
  return {
    exchange: runtime.currentExchange ?? 0,
    player: runtime.teams.player.map(getBattleUnitSnapshot),
    enemy: runtime.teams.enemy.map(getBattleUnitSnapshot),
    bondCounters: cloneDirectModifier(runtime.bondCounters ?? {}),
  };
}

function getBattlePresentationUnitMap(snapshot) {
  return new Map(
    ["player", "enemy"].flatMap((side) =>
      (snapshot?.[side] ?? []).map((unit, index) => [
        unit.id,
        { unit, side, index },
      ]),
    ),
  );
}

function areBattlePresentationValuesEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (
    (left && typeof left === "object") ||
    (right && typeof right === "object")
  ) {
    return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
  }
  return false;
}

function diffBattlePresentationSnapshots(beforeSnapshot, afterSnapshot) {
  const beforeUnits = getBattlePresentationUnitMap(beforeSnapshot);
  const afterUnits = getBattlePresentationUnitMap(afterSnapshot);
  const changes = [];
  const unitFields = [
    "attack",
    "health",
    "maxHealth",
    "level",
    "experience",
    "bonusExperience",
    "copies",
    "statuses",
    "equipment",
    "skillDisabled",
    "skillDisabledUntilExchange",
  ];

  new Set([...beforeUnits.keys(), ...afterUnits.keys()]).forEach((unitId) => {
    const before = beforeUnits.get(unitId) ?? null;
    const after = afterUnits.get(unitId) ?? null;
    if (!before || !after) {
      changes.push({
        unitId,
        unitName: after?.unit.name ?? before?.unit.name ?? "",
        side: after?.side ?? before?.side ?? null,
        field: "presence",
        before: before ? before.side : null,
        after: after ? after.side : null,
      });
      return;
    }
    unitFields.forEach((field) => {
      const beforeValue = before.unit[field] ?? null;
      const afterValue = after.unit[field] ?? null;
      if (areBattlePresentationValuesEqual(beforeValue, afterValue)) return;
      changes.push({
        unitId,
        unitName: after.unit.name,
        side: after.side,
        field,
        before: beforeValue,
        after: afterValue,
        delta:
          Number.isFinite(beforeValue) && Number.isFinite(afterValue)
            ? afterValue - beforeValue
            : null,
      });
    });
  });

  ["player", "enemy"].forEach((side) => {
    const beforeOrder = (beforeSnapshot?.[side] ?? []).map((unit) => unit.id);
    const afterOrder = (afterSnapshot?.[side] ?? []).map((unit) => unit.id);
    if (areBattlePresentationValuesEqual(beforeOrder, afterOrder)) return;
    changes.push({
      unitId: null,
      unitName: "",
      side,
      field: "teamOrder",
      before: beforeOrder,
      after: afterOrder,
    });
  });
  if (
    !areBattlePresentationValuesEqual(
      beforeSnapshot?.bondCounters ?? {},
      afterSnapshot?.bondCounters ?? {},
    )
  ) {
    changes.push({
      unitId: null,
      unitName: "",
      side: null,
      field: "bondCounters",
      before: cloneDirectModifier(beforeSnapshot?.bondCounters ?? {}),
      after: cloneDirectModifier(afterSnapshot?.bondCounters ?? {}),
    });
  }
  return changes;
}

function recordBattlePresentationStep(
  runtime,
  {
    kind = "effect",
    title = "效果结算",
    description = "",
    entries = [],
    phase = null,
    exchange = null,
    eventType = null,
    effectId = null,
    effectName = "",
    sourceIds = [],
    targetIds = [],
    deathIds = [],
    actorIds = [],
    cues = [],
    movements = [],
    simultaneous = false,
    animationSkip = false,
    resolvedAttack = null,
    durationMs = null,
  } = {},
) {
  const beforeSnapshot =
    runtime.presentationSnapshot ?? getBattlePresentationSnapshot(runtime);
  const snapshot = getBattlePresentationSnapshot(runtime);
  const currentEvent = runtime.currentEvent;
  const currentCandidate = runtime.currentCandidate;
  const step = {
    id: `battle-presentation-${runtime.presentationSequence}`,
    sequence: runtime.presentationSequence,
    kind,
    title,
    description,
    phase: phase ?? runtime.phase,
    exchange: exchange ?? runtime.currentExchange ?? 0,
    timingWindow: eventType ?? currentEvent?.type ?? null,
    eventId: currentEvent?.id ?? null,
    chainId: currentEvent?.chainId ?? null,
    parentEventId: currentEvent?.parentEventId ?? null,
    effectGroupId: currentCandidate?.id ?? null,
    effectId: effectId ?? currentCandidate?.effectId ?? null,
    effectName: effectName || currentCandidate?.sourceName || "",
    sourceIds: [...new Set(sourceIds.filter(Boolean))],
    targetIds: [...new Set(targetIds.filter(Boolean))],
    deathIds: [...new Set(deathIds.filter(Boolean))],
    actorIds: [...new Set(actorIds.filter(Boolean))],
    cues: cues.filter((cue) => cue?.text && cue?.unitId),
    movements: movements
      .filter(
        (movement) =>
          movement?.unitId &&
          ["player", "enemy"].includes(movement.side) &&
          Number.isInteger(movement.fromSlot) &&
          Number.isInteger(movement.toSlot),
      )
      .map((movement) => ({ ...movement })),
    simultaneous,
    animationSkip,
    resolvedAttack:
      resolvedAttack ??
      currentCandidate?.resolvedAttack ??
      currentCandidate?.owner?.attack ??
      null,
    durationMs,
    entries,
    beforeSnapshot,
    snapshot,
    changes: diffBattlePresentationSnapshots(beforeSnapshot, snapshot),
  };
  runtime.presentationSequence += 1;
  runtime.presentationSnapshot = snapshot;
  runtime.presentationTimeline.push(step);
  entries.forEach((entry) => {
    if (entry) entry.presentationStepId = step.id;
  });
  return step;
}

function recordBattlePresentationLog(
  runtime,
  type,
  message,
  details = {},
  presentation = {},
) {
  const entry = recordBattleLog(runtime, type, message, details);
  recordBattlePresentationStep(runtime, {
    ...presentation,
    entries: [entry],
  });
  return entry;
}

function isBattleUnitActive(runtime, unit) {
  if (!unit || unit.health <= 0) return false;
  return runtime.teams[unit.side]?.includes(unit) ?? false;
}

function getBattleUnitBonds(unit) {
  if (!unit) return [];
  return normalizeBondTags([
    unit.faction,
    ...(unit.extraFactions ?? []),
    ...(unit.tempExtraFactions ?? []),
  ]);
}

function getNegativeStatusId(unit) {
  const statusId = getUnitStatusId(unit);
  return NEGATIVE_STATUS_IDS.includes(statusId) ? statusId : null;
}

function getNegativeStatus(unit) {
  const statusId = getNegativeStatusId(unit);
  return statusId ? { statusId, data: unit.statuses[statusId] } : null;
}

function hasNegativeStatus(unit, statusId = null) {
  const currentStatusId = getNegativeStatusId(unit);
  return statusId ? currentStatusId === statusId : Boolean(currentStatusId);
}

function getUnitStatusId(unit) {
  const statusIds = Object.entries(unit?.statuses ?? {})
    .filter(([statusId, status]) => STATUS_PRESENTATION_ORDER.includes(statusId) && Boolean(status))
    .map(([statusId]) => statusId);
  return statusIds.reduce(
    (activeStatusId, statusId) =>
      activeStatusId === "unparalleled" && NEGATIVE_STATUS_IDS.includes(statusId)
        ? activeStatusId
        : statusId,
    null,
  );
}

function normalizeUnitStatuses(statuses = {}) {
  const statusId = getUnitStatusId({ statuses });
  return statusId ? { [statusId]: cloneDirectModifier(statuses[statusId]) } : {};
}

function replaceUnitStatus(unit, statusId, statusData) {
  unit.statuses = statusId ? { [statusId]: statusData } : {};
}

function replaceNegativeStatus(unit, statusId, statusData) {
  replaceUnitStatus(unit, statusId, statusData);
}

function applyPositiveStatus(unit, statusId, statusData) {
  if (!POSITIVE_STATUS_IDS.includes(statusId)) return false;
  replaceUnitStatus(unit, statusId, statusData);
  return true;
}

function isUnitSkillDisabled(unit, exchange) {
  return Boolean(unit?.skillDisabled) ||
    (Number.isInteger(unit?.skillDisabledUntilExchange) &&
      unit.skillDisabledUntilExchange === exchange);
}

function clearExpiredTemporaryStatuses(runtime) {
  Object.values(runtime.teams)
    .flat()
    .forEach((unit) => {
      if (
        unit.skillDisabled &&
        Number.isInteger(unit.skillDisabledUntilExchange) &&
        unit.skillDisabledUntilExchange !== runtime.currentExchange
      ) {
        unit.skillDisabled = false;
        unit.skillDisabledUntilExchange = null;
      }
    });
}

function applySkillDisable(runtime, target, options) {
  if (!target || target.health <= 0) return false;
  const { ownerSide, sourceEffectId, sourceName, untilExchange } = options;
  if (target.skillDisabled && target.skillDisabledUntilExchange === untilExchange) {
    return false;
  }
  target.skillDisabled = true;
  target.skillDisabledUntilExchange = untilExchange;
  recordBattlePresentationLog(
    runtime,
    "effect",
    `${sourceName}：${target.side === "player" ? "我方" : "敌方"} ${target.name}的武将技能本轮无法触发。`,
    {
      targetUnitId: target.id,
      targetName: target.name,
      targetSide: target.side,
      effectId: "skill-disabled",
      effectName: STATUS_LABELS["skill-disabled"],
      ownerSide,
      sourceEffectId,
      sourceName,
    },
    {
      kind: "effect",
      title: `${target.name}的技能本轮禁用`,
      effectName: sourceName,
      sourceIds:
        runtime.currentCandidate?.effectId === sourceEffectId
          ? [runtime.currentCandidate?.owner?.id].filter(Boolean)
          : [],
      targetIds: [target.id],
      cues: [{ unitId: target.id, text: "技能禁用", tone: "status" }],
      durationMs: 1450,
    },
  );
  return true;
}

function pickBattleRandomUnits(runtime, units, count) {
  const pool = [...units];
  const selected = [];
  while (pool.length > 0 && selected.length < count) {
    const index = Math.floor(runtime.random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected;
}

function addBattleUnitStats(unit, attack, health) {
  if (!unit) return null;
  const before = {
    attack: unit.attack,
    health: unit.health,
    maxHealth: unit.maxHealth,
  };
  unit.attack = Math.min(50, Math.max(1, unit.attack + attack));
  unit.maxHealth = Math.min(50, Math.max(1, unit.maxHealth + health));
  unit.health = Math.min(unit.maxHealth, unit.health + health);
  return {
    before,
    after: {
      attack: unit.attack,
      health: unit.health,
      maxHealth: unit.maxHealth,
    },
    attackDelta: unit.attack - before.attack,
    healthDelta: unit.health - before.health,
    maxHealthDelta: unit.maxHealth - before.maxHealth,
  };
}

function applyBattleUnitStatBonus(runtime, unit, attack, health, sourceName = "") {
  const result = addBattleUnitStats(unit, attack, health);
  if (!result) return null;
  const attackDelta = result.attackDelta;
  const healthDelta = result.healthDelta;
  const maxHealthDelta = result.maxHealthDelta;
  if (attackDelta === 0 && healthDelta === 0 && maxHealthDelta === 0) {
    return result;
  }
  const source = runtime.currentCandidate?.owner ?? null;
  const attackText =
    attackDelta === 0 ? "" : `攻击${attackDelta > 0 ? "+" : ""}${attackDelta}`;
  const healthText =
    maxHealthDelta === 0
      ? ""
      : `生命${maxHealthDelta > 0 ? "+" : ""}${maxHealthDelta}`;
  const changeText = [attackText, healthText].filter(Boolean).join("、");
  const cueText =
    attackDelta !== 0 && maxHealthDelta !== 0
      ? `${attackDelta > 0 ? "+" : ""}${attackDelta}/${
          maxHealthDelta > 0 ? "+" : ""
        }${maxHealthDelta}`
      : changeText;
  recordBattlePresentationLog(
    runtime,
    "stat",
    `${sourceName || "属性效果"}：${unit.name}${changeText}，当前 ${unit.attack}/${
      unit.health
    }。`,
    {
      sourceName: sourceName || runtime.currentCandidate?.sourceName || "属性效果",
      sourceUnitId: source?.id ?? null,
      sourceSide: source?.side ?? runtime.currentCandidate?.ownerSide ?? null,
      targetUnitId: unit.id,
      targetName: unit.name,
      targetSide: unit.side,
      attackBefore: result.before.attack,
      attackAfter: result.after.attack,
      healthBefore: result.before.health,
      healthAfter: result.after.health,
      maxHealthBefore: result.before.maxHealth,
      maxHealthAfter: result.after.maxHealth,
      attackDelta,
      healthDelta,
      maxHealthDelta,
    },
    {
      kind: "stat",
      title: `${unit.name}属性变化`,
      effectName: sourceName,
      sourceIds: [source?.id],
      targetIds: [unit.id],
      cues: [
        {
          unitId: unit.id,
          text: cueText,
          tone: attackDelta >= 0 && maxHealthDelta >= 0 ? "buff" : "debuff",
        },
      ],
      durationMs: 1450,
    },
  );
  return result;
}

function getSummonedUnitFaction(summonerOrFaction) {
  return getSummonedUnitBondSnapshot(summonerOrFaction).faction;
}

function getSummonedUnitBondSnapshot(summonerOrFaction) {
  const bonds = Array.isArray(summonerOrFaction)
    ? normalizeBondTags(summonerOrFaction)
    : typeof summonerOrFaction === "string"
      ? normalizeBondTags([summonerOrFaction])
      : getBattleUnitBonds(summonerOrFaction);
  const preferredFaction =
    !Array.isArray(summonerOrFaction) &&
    typeof summonerOrFaction !== "string" &&
    BOND_FACTIONS.includes(summonerOrFaction?.faction) &&
    bonds.includes(summonerOrFaction.faction)
      ? summonerOrFaction.faction
      : bonds[0];
  const faction = BOND_FACTIONS.includes(preferredFaction)
    ? preferredFaction
    : "无";
  return {
    faction,
    extraFactions: bonds.filter((bond) => bond !== faction),
  };
}

function createHeavyCavalry(runtime, side) {
  const summonId = runtime.nextSummonId;
  runtime.nextSummonId += 1;
  return {
    id: `${side}-heavy-cavalry-${summonId}`,
    sourceId: null,
    name: "重骑兵",
    attack: 5,
    health: 5,
    maxHealth: 5,
    faction: "魏",
    extraFactions: [],
    tempExtraFactions: [],
    tier: 0,
    side,
    lineupIndex: runtime.teams[side].length,
    skill: DERIVED_UNIT_DEFINITION_BY_NAME.重骑兵.skill,
    skillEffectIds: ["summon.heavy-cavalry-growth"],
    equipment: null,
    statuses: {},
    level: 1,
    experience: 0,
    copies: UNIT_LEVEL_COPY_THRESHOLDS[1],
    bonusExperience: 0,
    isSummon: true,
    skillDisabled: false,
  };
}

function summonHeavyCavalry(runtime, side, count, sourceEffectId) {
  for (let index = 0; index < count; index += 1) {
    if (!hasBattleSummonSlot(runtime, side)) {
      recordBattleSummonFailure(runtime, side, "魏武遗风", sourceEffectId);
      break;
    }
    const cavalry = createHeavyCavalry(runtime, side);
    addBattleUnitToTeamFront(runtime, side, cavalry);
    recordBattlePresentationLog(
      runtime,
      "summon",
      `${side === "player" ? "我方" : "敌方"}在最前方召唤重骑兵 ${cavalry.attack}/${cavalry.health}。`,
      {
        unitId: cavalry.id,
        unitName: cavalry.name,
        unitSide: side,
        side,
        sourceEffectId,
      },
      {
        kind: "summon",
        title: `${cavalry.name}加入战场`,
        effectName: BOND_RULES.魏.label,
        targetIds: [cavalry.id],
        cues: [{ unitId: cavalry.id, text: "召唤", tone: "buff" }],
        durationMs: 1550,
      },
    );
    dispatchBattleEvent(runtime, "unit:summon", {
      unit: cavalry,
      side,
      sourceEffectId,
    });
  }
}

function createCavalry(
  runtime,
  side,
  attack = 2,
  health = 1,
  faction = "无",
  level = 1,
) {
  const summonId = runtime.nextSummonId;
  runtime.nextSummonId += 1;
  const bondSnapshot = getSummonedUnitBondSnapshot(faction);
  return {
    id: `${side}-cavalry-${summonId}`,
    sourceId: null,
    name: "骑兵",
    attack,
    health,
    maxHealth: health,
    faction: bondSnapshot.faction,
    extraFactions: bondSnapshot.extraFactions,
    tempExtraFactions: [],
    tier: 0,
    side,
    lineupIndex: runtime.teams[side].length,
    skill: DERIVED_UNIT_DEFINITION_BY_NAME.骑兵.skill,
    skillEffectIds: [],
    equipment: null,
    statuses: {},
    level,
    experience: 0,
    copies: UNIT_LEVEL_COPY_THRESHOLDS[level] ?? UNIT_LEVEL_COPY_THRESHOLDS[1],
    bonusExperience: 0,
    isSummon: true,
    skillDisabled: false,
  };
}

function summonCavalry(
  runtime,
  side,
  count,
  {
    attack = 2,
    health = 1,
    sourceEffectId = null,
    sourceName = "",
    summoner = null,
    target = null,
    position = "tail",
    level = 1,
  } = {},
) {
  const summoned = [];
  let summonAnchor = target;
  for (let index = 0; index < count; index += 1) {
    if (!hasBattleSummonSlot(runtime, side)) {
      recordBattleSummonFailure(runtime, side, sourceName || "召唤效果", sourceEffectId);
      break;
    }
    const cavalry = createCavalry(runtime, side, attack, health, summoner, level);
    const inserted =
      position === "target-front"
        ? insertBattleUnitInFrontOfTarget(runtime, summonAnchor, cavalry)
        : position === "front"
          ? (addBattleUnitToTeamFront(runtime, side, cavalry), true)
          : (addBattleUnitToTeamTail(runtime, side, cavalry), true);
    if (!inserted) {
      recordBattleSummonFailure(runtime, side, sourceName || "召唤效果", sourceEffectId);
      break;
    }
    summonAnchor = cavalry;
    summoned.push(cavalry);
    recordBattlePresentationLog(
      runtime,
      "summon",
      `${sourceName}：${side === "player" ? "我方" : "敌方"}${
        position === "target-front"
          ? "在目标身前"
          : position === "front"
            ? "在最前方"
            : "在队尾"
      }召唤骑兵 ${cavalry.attack}/${cavalry.health}。`,
      {
        unitId: cavalry.id,
        unitName: cavalry.name,
        unitSide: side,
        side,
        sourceEffectId,
        sourceName,
      },
      {
        kind: "summon",
        title: `${cavalry.name}加入战场`,
        effectName: sourceName,
        sourceIds: [summoner?.id],
        targetIds: [cavalry.id],
        cues: [{ unitId: cavalry.id, text: "召唤", tone: "buff" }],
        durationMs: 1550,
      },
    );
    dispatchBattleEvent(runtime, "unit:summon", {
      unit: cavalry,
      side,
      source: summoner,
      sourceEffectId,
    });
  }
  return summoned;
}

function getBattleFrontUnit(team, side) {
  return side === "player" ? team.at(-1) : team[0];
}

function addBattleUnitToTeamTail(runtime, side, unit) {
  if (side === "player") {
    runtime.teams[side].unshift(unit);
    return;
  }
  runtime.teams[side].push(unit);
}

function hasBattleSummonSlot(runtime, side) {
  return runtime.teams[side].filter((unit) => unit.health > 0).length < LINEUP_SLOT_COUNT;
}

function recordBattleSummonFailure(runtime, side, sourceName, sourceEffectId = null) {
  recordBattlePresentationLog(
    runtime,
    "summon",
    `${sourceName}：${side === "player" ? "我方" : "敌方"}阵容没有空位，召唤失败。`,
    { side, sourceName, sourceEffectId, failed: true },
    {
      kind: "summon-failed",
      title: `${sourceName}召唤失败`,
      effectName: sourceName,
      durationMs: 1150,
    },
  );
}

function captureBattleDeathPosition(runtime, unit) {
  const team = runtime.teams[unit.side];
  const index = team.indexOf(unit);
  if (index < 0) return null;
  return {
    side: unit.side,
    frontRank: unit.side === "player" ? team.length - 1 - index : index,
  };
}

function insertBattleUnitAtDeathPosition(runtime, side, unit, deathPosition) {
  if (!hasBattleSummonSlot(runtime, side)) return false;
  const fromFront = getBattleUnitsFromFront(runtime, side);
  const frontRank = Math.max(
    0,
    Math.min(deathPosition?.frontRank ?? 0, fromFront.length),
  );
  const unitBehindInsertion = fromFront[frontRank] ?? null;
  if (!unitBehindInsertion) {
    addBattleUnitToTeamTail(runtime, side, unit);
    return true;
  }
  const team = runtime.teams[side];
  const anchorIndex = team.indexOf(unitBehindInsertion);
  const insertIndex = side === "player" ? anchorIndex + 1 : anchorIndex;
  team.splice(insertIndex, 0, unit);
  return true;
}

function insertBattleUnitInFrontOfTarget(runtime, target, unit, deathPosition = null) {
  if (!target || !hasBattleSummonSlot(runtime, unit.side)) return false;
  const team = runtime.teams[unit.side];
  const targetIndex = team.indexOf(target);
  if (targetIndex < 0) {
    return insertBattleUnitAtDeathPosition(runtime, unit.side, unit, deathPosition);
  }
  const insertIndex = unit.side === "player" ? targetIndex + 1 : targetIndex;
  team.splice(insertIndex, 0, unit);
  return true;
}

function resolveWeiBondDeath(runtime, candidate, event) {
  const unit = event.payload.unit;
  const side = candidate.ownerSide;
  const effectCount = runtime.lockedBonds[side]?.魏 ?? 0;
  if (
    effectCount <= 0 ||
    !unit ||
    unit.side !== side ||
    !getBattleUnitBonds(unit).includes("魏")
  ) {
    return;
  }

  const counter = runtime.bondCounters[side];
  counter.魏阵亡 += 1;
  const summonProgress = ((counter.魏阵亡 - 1) % 4) + 1;
  const summonName = effectCount >= 4 ? "重骑兵" : "骑兵";
  recordBattlePresentationLog(
    runtime,
    "bond",
    `${BOND_RULES.魏.label} ${effectCount}人：${summonName}召唤进度 ${summonProgress}/4（本场累计 ${counter.魏阵亡} 名魏羁绊单位阵亡）。`,
    {
      faction: "魏",
      effectCount,
      ownerSide: side,
      deathCount: counter.魏阵亡,
      summonProgress,
      summonThreshold: 4,
      summonName,
    },
    {
      kind: "counter",
      title: `${summonName}召唤进度 ${summonProgress}/4`,
      effectId: candidate.effectId,
      effectName: `${BOND_RULES.魏.label} ${effectCount}人`,
      durationMs: 1250,
    },
  );
  if (counter.魏阵亡 % 4 === 0) {
    const summonCount = effectCount === 3 || effectCount === 5 ? 2 : 1;
    recordBattleLog(
      runtime,
      "bond",
      `${BOND_RULES.魏.label}累计 ${counter.魏阵亡} 名魏羁绊武将阵亡，在己方最前方召唤 ${summonCount} 名${summonName}。`,
      { faction: "魏", effectCount, deathCount: counter.魏阵亡, summonCount, summonName },
    );
    if (effectCount >= 4) {
      summonHeavyCavalry(runtime, side, summonCount, candidate.effectId);
    } else {
      summonCavalry(runtime, side, summonCount, {
        attack: 2,
        health: 1,
        sourceEffectId: candidate.effectId,
        sourceName: BOND_RULES.魏.label,
        summoner: "魏",
        position: "front",
      });
    }
  }
}

function resolveShuBattleUpgrade(runtime, candidate, event) {
  const unit = event.payload.unit;
  const side = candidate.ownerSide;
  const effectCount = runtime.lockedBonds[side]?.蜀 ?? 0;
  if (
    effectCount <= 0 ||
    !unit ||
    unit.side !== side ||
    !getBattleUnitBonds(unit).includes("蜀")
  ) {
    return;
  }
  const statGain = effectCount >= 5 ? 2 : effectCount >= 4 ? 1 : effectCount - 1;
  const targets = effectCount >= 4
    ? runtime.teams[side].filter((target) => target.health > 0)
    : [unit];
  targets.forEach((target) =>
    applyBattleUnitStatBonus(
      runtime,
      target,
      statGain,
      statGain,
      `${BOND_RULES.蜀.label} ${effectCount}人`,
    ),
  );
  recordBattleLog(
    runtime,
    "bond",
    `${BOND_RULES.蜀.label} ${effectCount}人：${unit.name}升级，${
      effectCount >= 4 ? "全军" : unit.name
    }获得 +${statGain}/+${statGain}。`,
    { faction: "蜀", effectCount, unitId: unit.id, affectedUnitIds: targets.map((target) => target.id) },
  );
}

function getWuOpeningTargets(runtime, side, effectCount) {
  const opposingSide = side === "player" ? "enemy" : "player";
  const enemies = getBattleUnitsFromFront(runtime, opposingSide);
  if (effectCount >= 4) return enemies;
  if (effectCount === 3) return enemies.slice(-3);
  return pickBattleRandomUnits(runtime, enemies, 2);
}

function applyNegativeStatus(
  runtime,
  target,
  statusId,
  options,
) {
  if (!target || target.health <= 0) return false;
  const {
    ownerSide,
    summonFaction = null,
    summonBonds = null,
    sourceUnit = runtime.currentCandidate?.owner ?? null,
    sourceEffectId,
    sourceName,
    ...statusMetadata
  } = options;
  target.statuses ??= {};
  if (target.statuses.unparalleled) {
    recordBattlePresentationLog(
      runtime,
      "status",
      `${target.name}拥有无双，免疫${STATUS_LABELS[statusId] ?? statusId}。`,
      { targetUnitId: target.id, statusId, immune: true },
      {
        kind: "status",
        title: `${target.name}免疫负面状态`,
        effectName: STATUS_LABELS[statusId] ?? statusId,
        targetIds: [target.id],
        cues: [
          {
            unitId: target.id,
            text: `免疫${STATUS_LABELS[statusId] ?? statusId}`,
            tone: "status",
          },
        ],
        durationMs: 1250,
      },
    );
    return false;
  }
  if (target.equipment?.effectId === "equipment.imperial-edict") {
    const clearedStatusId = getUnitStatusId(target);
    replaceUnitStatus(target, null, null);
    target.equipment = null;
    recordBattlePresentationLog(
      runtime,
      "equipment",
      `${target.name}的诏书清空状态槽并阻止${STATUS_LABELS[statusId] ?? statusId}，诏书消失。`,
      {
        targetUnitId: target.id,
        targetName: target.name,
        targetSide: target.side,
        statusId,
        clearedStatusId,
        sourceEffectId: "equipment.imperial-edict",
        equipmentRemoved: true,
      },
      {
        kind: "equipment",
        title: `${target.name}的诏书阻止负面状态`,
        effectId: "equipment.imperial-edict",
        effectName: "诏书",
        targetIds: [target.id],
        cues: [{ unitId: target.id, text: "诏书消失", tone: "equipment" }],
        durationMs: 1350,
      },
    );
    return true;
  }
  if (target.statuses?.rest) {
    replaceUnitStatus(target, null, null);
    recordBattlePresentationLog(
      runtime,
      "status",
      `${target.name}的休整清除自身并阻止${STATUS_LABELS[statusId] ?? statusId}。`,
      {
        targetUnitId: target.id,
        targetName: target.name,
        targetSide: target.side,
        statusId,
        sourceEffectId: "status.rest-intercept",
      },
      {
        kind: "status",
        title: `${target.name}以休整化解负面状态`,
        effectId: "status.rest-intercept",
        effectName: "休整",
        targetIds: [target.id],
        cues: [{ unitId: target.id, text: "休整清除", tone: "status" }],
        durationMs: 1350,
      },
    );
    return true;
  }
  const existingNegativeStatus = getNegativeStatus(target);
  const existingBurn = existingNegativeStatus?.statusId === "burn"
    ? existingNegativeStatus.data
    : null;
  const appliedStatus = {
    ...statusMetadata,
    ownerSide,
    summonFaction,
    summonBonds:
      summonBonds ??
      (sourceUnit ? getBattleUnitBonds(sourceUnit) : null),
    sourceUnitId: sourceUnit?.id ?? null,
    sourceEffectId,
    sourceName,
  };
  if (statusId === "intimidated") appliedStatus.spent = false;

  if (
    existingNegativeStatus?.statusId === "intimidated" &&
    statusId === "intimidated"
  ) {
    recordBattleLog(
      runtime,
      "status",
      `${target.name}已有震慑，重复施加不会刷新其下一次普通攻击归零标记。`,
      { targetUnitId: target.id, statusId, ignoredRefresh: true },
    );
    return false;
  }

  const recordApplication = (
    appliedTarget,
    appliedStatusId,
    statusData = appliedStatus,
  ) => {
    const applicationOwnerSide = statusData?.ownerSide ?? ownerSide;
    const applicationSourceEffectId = statusData?.sourceEffectId ?? sourceEffectId;
    const applicationSourceName = statusData?.sourceName ?? sourceName;
    recordBattlePresentationLog(
      runtime,
      "status",
      `${applicationSourceName}：${appliedTarget.side === "player" ? "我方" : "敌方"} ${
        appliedTarget.name
      }获得${STATUS_LABELS[appliedStatusId] ?? appliedStatusId}。`,
      {
        targetUnitId: appliedTarget.id,
        targetName: appliedTarget.name,
        targetSide: appliedTarget.side,
        statusId: appliedStatusId,
        statusName: STATUS_LABELS[appliedStatusId] ?? appliedStatusId,
        ownerSide: applicationOwnerSide,
        sourceEffectId: applicationSourceEffectId,
        sourceName: applicationSourceName,
        sourceSide: applicationOwnerSide,
      },
      {
        kind: "status",
        title: `${appliedTarget.name}获得${STATUS_LABELS[appliedStatusId] ?? appliedStatusId}`,
        effectName: applicationSourceName,
        sourceIds:
          runtime.currentCandidate?.effectId === applicationSourceEffectId
            ? [runtime.currentCandidate?.owner?.id].filter(Boolean)
            : [],
        targetIds: [appliedTarget.id],
        cues: [
          {
            unitId: appliedTarget.id,
            text: STATUS_LABELS[appliedStatusId] ?? appliedStatusId,
            tone: "status",
          },
        ],
        durationMs: 1450,
      },
    );
    resolveImmediateBattleEvent(runtime, "status:apply", {
      target: appliedTarget,
      statusId: appliedStatusId,
      ownerSide: applicationOwnerSide,
      sourceEffectId: applicationSourceEffectId,
      sourceName: applicationSourceName,
    });
  };

  if (existingBurn) {
    const burnOwnerSide = existingBurn.ownerSide;
    const wuEffectCount = runtime.lockedBonds[burnOwnerSide]?.吴 ?? 0;
    const igniteDamage = 6;
    replaceNegativeStatus(target, statusId, appliedStatus);
    recordApplication(target, statusId, appliedStatus);
    const virtualSource = getBattleStatusDamageSource(runtime, existingBurn, {
      id: `${burnOwnerSide ?? "neutral"}-burn-status`,
      name: "引燃",
      side: burnOwnerSide,
    });
    const damage = dealBattleDamage(runtime, {
      source: virtualSource,
      target,
      amount: igniteDamage,
      type: "true",
      sourceEffectId: "status.burn-ignite",
      extraPayload: { statusId: "ignite" },
    });
    const currentNegativeStatus = getNegativeStatus(target);
    const clearedCurrentBurn = currentNegativeStatus?.statusId === "burn";
    if (clearedCurrentBurn) replaceNegativeStatus(target, null, null);
    const restoreOriginalBurn =
      wuEffectCount >= 5 && clearedCurrentBurn && target.health > 0;
    recordBattleLog(
      runtime,
      "status",
      `${target.name}被引燃，受到 ${damage?.finalAmount ?? 0} 点真实伤害${
        restoreOriginalBurn
          ? "，东吴业火 5 人重新施加原灼烧"
          : clearedCurrentBurn
            ? "，现有灼烧清除"
            : currentNegativeStatus
              ? `，当前${STATUS_LABELS[currentNegativeStatus.statusId] ?? currentNegativeStatus.statusId}保留`
              : ""
      }。`,
      {
        targetUnitId: target.id,
        damage,
        wuEffectCount,
        clearedCurrentBurn,
        retainedStatusId: clearedCurrentBurn ? null : currentNegativeStatus?.statusId ?? null,
        restoredOriginalBurn: restoreOriginalBurn,
      },
    );
    if (target.health <= 0) return true;
    if (restoreOriginalBurn) {
      replaceNegativeStatus(target, "burn", existingBurn);
      recordApplication(target, "burn", existingBurn);
    }
    return true;
  }

  if (existingNegativeStatus?.statusId === "chain" && statusId !== "chain") {
    const chainedUnits = Object.values(runtime.teams)
      .flat()
      .filter((unit) => unit.health > 0 && hasNegativeStatus(unit, "chain"));
    const replacements = chainedUnits.map((unit) => ({
      unit,
      statusData: { ...appliedStatus },
    }));
    replacements.forEach(({ unit, statusData }) => {
      replaceNegativeStatus(unit, statusId, statusData);
    });
    replacements.forEach(({ unit }) => recordApplication(unit, statusId));
    return replacements.length > 0;
  }

  if (!existingBurn && existingNegativeStatus?.statusId === statusId) return false;
  replaceNegativeStatus(target, statusId, appliedStatus);
  recordApplication(target, statusId);
  return true;
}

function resolveWuOpeningBurn(runtime, candidate) {
  const side = candidate.ownerSide;
  const effectCount = runtime.lockedBonds[side]?.吴 ?? 0;
  if (effectCount <= 0) return;
  const targets = getWuOpeningTargets(runtime, side, effectCount);
  targets.forEach((target) =>
    applyNegativeStatus(runtime, target, "burn", {
      ownerSide: side,
      sourceEffectId: candidate.effectId,
      sourceName: `${BOND_RULES.吴.label} ${effectCount}人`,
    }),
  );
  recordBattleLog(
    runtime,
    "bond",
    `${BOND_RULES.吴.label} ${effectCount}人：战斗开始时使 ${targets.length} 名敌军获得灼烧。`,
    { faction: "吴", effectCount, targetUnitIds: targets.map((target) => target.id) },
  );
}

function resolveBurnTick(runtime, event) {
  const burnedUnits = Object.values(runtime.teams)
    .flat()
    .filter((unit) => unit.health > 0 && unit.statuses?.burn);
  if (burnedUnits.length === 0) return;

  const resolvedDamages = burnedUnits.map((target) => {
    const burn = target.statuses.burn;
    const virtualSource = getBattleStatusDamageSource(runtime, burn, {
      id: `${burn.ownerSide ?? "neutral"}-burn-status`,
      name: burn.sourceName || STATUS_LABELS.burn,
      side: burn.ownerSide,
    });
    return resolveBattleDamage(runtime, {
      source: virtualSource,
      target,
      amount: 1,
      type: "true",
      sourceEffectId: "status.burn-tick",
    });
  });
  const committedDamages = resolvedDamages
    .map((damage) =>
      commitResolvedBattleDamage(runtime, damage, {
        extraPayload: { statusId: "burn" },
        exchange: event.payload.exchange,
      }),
    )
    .filter(Boolean);
  recordBattleLog(
    runtime,
    "status",
    `第${event.payload.exchange}次交锋后，灼烧结算 1 次：${committedDamages
      .map((damage) => `${damage.target.name}-${damage.finalAmount}`)
      .join("，")}。`,
    {
      exchange: event.payload.exchange,
      targetUnitIds: committedDamages.map((damage) => damage.target.id),
    },
  );
}

function getBattleDeathNearestAheadOwnerIds(runtime, unit) {
  return runtime.teams[unit.side]
    .filter((owner) => owner !== unit && owner.health > 0)
    .filter((owner) => getNearestBattlePositionUnit(runtime, owner, "ahead") === unit)
    .map((owner) => owner.id);
}

function resolveBattleDeathBatch(
  runtime,
  candidates,
  exchange,
  { recordDeathPresentation = true } = {},
) {
  const pendingDeaths = candidates
    .map((candidate) => ({
      unit: candidate?.unit ?? candidate,
      deathPosition:
        candidate?.deathPosition ?? captureBattleDeathPosition(runtime, candidate?.unit ?? candidate),
      killer: candidate?.killer ?? candidate?.unit?.lastDamageSource ?? null,
      sourceEffectId:
        candidate?.sourceEffectId ?? candidate?.unit?.lastDamageEffectId ?? null,
      consumed: Boolean(candidate?.consumed),
    }))
    .filter(
      ({ unit }) =>
        unit &&
        unit.health <= 0 &&
        !runtime.resolvedDeathIds.has(unit.id) &&
        !runtime.deferredDeathIds.has(unit.id),
    );
  if (pendingDeaths.length === 0) return 0;

  const deathEntries = [];
  const preparedDeathEvents = [];
  pendingDeaths.forEach(({ unit, deathPosition, killer, sourceEffectId, consumed }) => {
    runtime.resolvedDeathIds.add(unit.id);
    unit.deathPosition = deathPosition;
    const nearestAheadOwnerIds = getBattleDeathNearestAheadOwnerIds(runtime, unit);
    const entry = recordBattleLog(
      runtime,
      "death",
      `${unit.side === "player" ? "我方" : "敌方"} ${unit.name}${
        consumed ? "被吞噬并视为" : ""
      }阵亡。`,
      {
        unitId: unit.id,
        unitName: unit.name,
        unitSide: unit.side,
        exchange,
        consumed,
        killerUnitId: killer?.id ?? null,
        sourceEffectId,
      },
    );
    deathEntries.push(entry);
    preparedDeathEvents.push(
      prepareBattleEvent(runtime, "unit:death", {
        unit,
        killer,
        sourceEffectId,
        consumed,
        exchange,
        deathPosition,
        nearestAheadOwnerIds,
      }),
    );
  });

  if (recordDeathPresentation) {
    const playerDeathCount = pendingDeaths.filter(
      ({ unit }) => unit.side === "player",
    ).length;
    const enemyDeathCount = pendingDeaths.length - playerDeathCount;
    const title =
      playerDeathCount > 0 && enemyDeathCount > 0
        ? "双方武将同时阵亡"
        : pendingDeaths.length > 1
          ? `${playerDeathCount > 0 ? "我方" : "敌方"}多名武将同时阵亡`
          : `${pendingDeaths[0].unit.name}阵亡`;
    recordBattlePresentationStep(runtime, {
      kind: "death",
      title,
      description: "阵亡卡牌同时化为烟雾并退出战场",
      entries: deathEntries,
      exchange,
      effectId:
        pendingDeaths.length === 1 ? pendingDeaths[0].sourceEffectId : null,
      sourceIds: pendingDeaths.map(({ killer }) => killer?.id),
      targetIds: pendingDeaths.map(({ unit }) => unit.id),
      deathIds: pendingDeaths.map(({ unit }) => unit.id),
      cues: pendingDeaths.map(({ unit, consumed }) => ({
        unitId: unit.id,
        text: consumed ? "被吞噬" : "阵亡",
        tone: "death",
      })),
      simultaneous: pendingDeaths.length > 1,
      durationMs: 1500,
    });
  }

  const removedIds = new Set(pendingDeaths.map(({ unit }) => unit.id));
  ["player", "enemy"].forEach((side) => {
    const team = runtime.teams[side];
    const survivors = team.filter((unit) => !removedIds.has(unit.id));
    team.splice(0, team.length, ...survivors);
  });
  const leaveEntries = pendingDeaths.map(({ unit }) =>
    recordBattleLog(
      runtime,
      "leave",
      `${unit.side === "player" ? "我方" : "敌方"} ${unit.name}离开战场，队列前移。`,
      {
        unitId: unit.id,
        unitName: unit.name,
        unitSide: unit.side,
        exchange,
      },
    ),
  );
  const beforeAdvanceSnapshot = runtime.presentationSnapshot;
  const afterAdvanceSnapshot = getBattlePresentationSnapshot(runtime);
  const movements = getBattleAdvanceMovements(beforeAdvanceSnapshot, afterAdvanceSnapshot);
  recordBattlePresentationStep(runtime, {
    kind: "advance",
    title: "存活武将向阵容前方补位",
    description: "阵容补位完成后再继续结算后续效果",
    entries: leaveEntries,
    exchange,
    movements,
    animationSkip: movements.length === 0,
    durationMs: movements.length > 0 ? 700 : 0,
  });

  preparedDeathEvents.forEach((event) =>
    resolvePreparedBattleEventImmediately(runtime, event),
  );
  return pendingDeaths.length;
}

function resolveBattleUnitDeath(
  runtime,
  unit,
  exchange,
  {
    deathPosition = captureBattleDeathPosition(runtime, unit),
    killer = unit?.lastDamageSource ?? null,
    sourceEffectId = unit?.lastDamageEffectId ?? null,
    consumed = false,
  } = {},
) {
  return (
    resolveBattleDeathBatch(
      runtime,
      [{ unit, deathPosition, killer, sourceEffectId, consumed }],
      exchange,
      { recordDeathPresentation: !consumed },
    ) > 0
  );
}

function resolveAllBattleDeaths(runtime, exchange) {
  const pendingDeaths = [];
  ["player", "enemy"].forEach((side) => {
    runtime.teams[side].forEach((unit) => {
      if (
        unit.health > 0 ||
        runtime.resolvedDeathIds.has(unit.id) ||
        runtime.deferredDeathIds.has(unit.id)
      ) {
        return;
      }
      pendingDeaths.push({
        unit,
        deathPosition: captureBattleDeathPosition(runtime, unit),
      });
    });
  });
  return resolveBattleDeathBatch(runtime, pendingDeaths, exchange);
}

function createBattleEvent(runtime, type, payload = {}, parentEvent = null) {
  const eventId = `battle-event-${runtime.nextEventId}`;
  runtime.nextEventId += 1;
  const chainId = parentEvent?.chainId ?? `battle-chain-${runtime.nextChainId++}`;
  return {
    id: eventId,
    chainId,
    parentEventId: parentEvent?.id ?? null,
    type,
    payload,
    phase: runtime.phase,
  };
}

function prepareBattleEvent(
  runtime,
  type,
  payload = {},
  parentEvent = runtime.currentEvent,
  { lockHeroAvailability = false } = {},
) {
  const event = createBattleEvent(runtime, type, payload, parentEvent);
  const candidates = collectBattleEffectCandidates(runtime, event);
  event.lockedCandidates = lockHeroAvailability
    ? candidates.filter((candidate) => {
        if (candidate.definition.sourceType !== "hero") return true;
        const owner = candidate.owner;
        const ownerParticipated = event.payload.attackers?.includes(owner);
        const ownerWasAvailable = ownerParticipated || isBattleUnitActive(runtime, owner);
        if (
          !owner ||
          !ownerWasAvailable ||
          isUnitSkillDisabled(owner, runtime.currentExchange)
        ) {
          return false;
        }
        candidate.ownerAvailabilityLocked = true;
        return true;
      })
    : candidates;
  return event;
}

function dispatchPreparedBattleEvent(runtime, event) {
  if (!event) return null;
  runtime.queue.push(event);
  processBattleEventQueue(runtime);
  return event;
}

function dispatchBattleEvent(runtime, type, payload = {}, parentEvent = runtime.currentEvent) {
  return dispatchPreparedBattleEvent(
    runtime,
    createBattleEvent(runtime, type, payload, parentEvent),
  );
}

function resolvePreparedBattleEventImmediately(runtime, event) {
  if (!event) return null;
  const stepCount = (runtime.chainSteps.get(event.chainId) ?? 0) + 1;
  runtime.chainSteps.set(event.chainId, stepCount);
  if (stepCount > MAX_EFFECT_CHAIN_STEPS) {
    runtime.abortedChains.add(event.chainId);
    recordBattleLog(
      runtime,
      "error",
      `事件链 ${event.chainId} 超过 ${MAX_EFFECT_CHAIN_STEPS} 步，已停止后续结算。`,
      { eventId: event.id, chainId: event.chainId },
    );
    return event;
  }

  const previousEvent = runtime.currentEvent;
  runtime.currentEvent = event;
  runtime.structuredLog.push({
    type: "event",
    eventId: event.id,
    chainId: event.chainId,
    parentEventId: event.parentEventId,
    eventType: event.type,
    phase: event.phase,
  });
  resolveBattleEvent(runtime, event);
  runtime.currentEvent = previousEvent;
  return event;
}

function resolveImmediateBattleEvent(
  runtime,
  type,
  payload = {},
  parentEvent = runtime.currentEvent,
) {
  return resolvePreparedBattleEventImmediately(
    runtime,
    createBattleEvent(runtime, type, payload, parentEvent),
  );
}

function processBattleEventQueue(runtime) {
  if (runtime.processing) return;
  runtime.processing = true;
  while (runtime.queue.length > 0) {
    const event = runtime.queue.shift();
    if (runtime.abortedChains.has(event.chainId)) continue;
    const stepCount = (runtime.chainSteps.get(event.chainId) ?? 0) + 1;
    runtime.chainSteps.set(event.chainId, stepCount);
    if (stepCount > MAX_EFFECT_CHAIN_STEPS) {
      recordBattleLog(
        runtime,
        "error",
        `事件链 ${event.chainId} 超过 ${MAX_EFFECT_CHAIN_STEPS} 步，已停止后续结算。`,
        { eventId: event.id, chainId: event.chainId },
      );
      runtime.abortedChains.add(event.chainId);
      runtime.queue = runtime.queue.filter((queued) => queued.chainId !== event.chainId);
      continue;
    }

    runtime.currentEvent = event;
    runtime.structuredLog.push({
      type: "event",
      eventId: event.id,
      chainId: event.chainId,
      parentEventId: event.parentEventId,
      eventType: event.type,
      phase: event.phase,
    });
    resolveBattleEvent(runtime, event);
  }
  runtime.currentEvent = null;
  runtime.processing = false;
}

function collectBattleEffectCandidates(runtime, event) {
  const candidates = [];
  let sequence = 0;
  const addCandidate = ({ effectId, owner = null, ownerSide = null, sourceName = "" }) => {
    const definition = getEffectDefinition(effectId);
    const triggers = definition?.triggers ?? [definition?.trigger];
    if (!definition || !triggers.includes(event.type)) return;
    candidates.push({
      id: `${event.id}:${effectId}:${sequence}`,
      sequence,
      effectId,
      definition,
      owner,
      ownerSide: ownerSide ?? owner?.side ?? null,
      sourceName,
      battleStartLocked:
        event.type === "battle:start" &&
        definition.sourceType === "hero" &&
        Boolean(owner) &&
        isBattleUnitActive(runtime, owner) &&
        !isUnitSkillDisabled(owner, runtime.currentExchange),
      resolved: false,
    });
    sequence += 1;
  };

  Object.values(runtime.teams)
    .flat()
    .forEach((unit) => {
      unit.skillEffectIds.forEach((effectId) => {
        addCandidate({ effectId, owner: unit, sourceName: unit.name });
      });
      if (unit.equipment?.effectId) {
        addCandidate({
          effectId: unit.equipment.effectId,
          owner: unit,
          sourceName: unit.equipment.name,
        });
      }
    });

  GLOBAL_STATUS_EFFECT_IDS.forEach((effectId) => {
    addCandidate({
      effectId,
      sourceName: GLOBAL_STATUS_EFFECT_LABELS[effectId],
    });
  });

  Object.entries(runtime.lockedBonds).forEach(([side, effectCounts]) => {
    BOND_FACTIONS.forEach((faction) => {
      const effectCount = effectCounts?.[faction] ?? 0;
      if (effectCount <= 0) return;
      (BOND_RULES[faction].effectIds ?? []).forEach((effectId) => {
        addCandidate({
          effectId,
          ownerSide: side,
          sourceName: `${BOND_RULES[faction].label} ${effectCount}人`,
        });
      });
    });
  });

  return candidates;
}

function isBattleHeroSkillApplicable(runtime, candidate, event) {
  if (candidate.definition.sourceType !== "hero") {
    return true;
  }
  const { owner, effectId } = candidate;
  const unit = event.payload.unit ?? null;
  const damage = event.payload.damage ?? null;
  const ownerAttacked = event.payload.attackers?.includes(owner);
  const sameSideUnit = unit?.side === owner.side;
  const sharedUnit = sameSideUnit && shareBattleBond(owner, unit);

  if (event.type === "unit:death") {
    if ([
      "hero.pangde.xunjie",
      "hero.mayunlu.xiliang-lienv",
      "hero.yuejin.xiandeng-xianzhen",
      "hero.zhanghe.qiaobian",
      "hero.gongsunzan.baima-yicong",
      "hero.guojia.yiji-pingliao",
      "hero.hanxiandi.piaoyao",
      "hero.yuji.guhuo",
      "summon.fangshi-death",
    ].includes(effectId)) {
      return unit === owner;
    }
    if (effectId === "hero.weiyan.caigao-qilie") {
      return Boolean(sameSideUnit && unit !== owner);
    }
    if (effectId === "hero.yanliang.yongguan-sanjun") {
      return Boolean(unit && unit !== owner && event.payload.killer === owner);
    }
    if (effectId === "hero.dianwei.guzhi-elai") return unit === owner && Boolean(owner.consumedSnapshot);
    if (effectId === "hero.huatuo.jijiu") {
      const wasNearestAhead = Array.isArray(event.payload.nearestAheadOwnerIds)
        ? event.payload.nearestAheadOwnerIds.includes(owner.id)
        : getNearestBattlePositionUnit(runtime, owner, "ahead") === unit;
      return Boolean(
        sameSideUnit &&
        unit !== owner &&
        !event.payload.consumed &&
        wasNearestAhead &&
        !event.payload.revived &&
        (owner.huatuoRevivesUsedThisRound ?? 0) < (owner.level ?? 1)
      );
    }
    if (effectId === "hero.caocao.jianxiong") return Boolean(sharedUnit && unit !== owner);
    return false;
  }
  if (event.type === "unit:summon") {
    if (effectId === "hero.zhenji.luoshen") {
      return sameSideUnit && unit !== owner && !event.payload.revived;
    }
    if (effectId === "hero.yuanshu.yuxi") {
      return unit === owner && !event.payload.revived;
    }
    return ["hero.xunyu.wangzuo-zhicai", "hero.liubei.renze"].includes(effectId) &&
      Boolean(sharedUnit && unit !== owner && !event.payload.revived);
  }
  if (event.type === "experience:gain") {
    return effectId === "hero.liaohua.sujiang" && sameSideUnit && unit !== owner;
  }
  if (event.type === "unit:upgrade") {
    return effectId === "hero.zhaoyun.longdan" && unit === owner;
  }
  if (event.type === "status:apply") return false;
  if (event.type === "damage:before") {
    if (effectId === "hero.zhoutai.roushen-tiebi") {
      return damage?.target === owner &&
        ["attack", "skill"].includes(damage.type) &&
        runtime.currentAttackers?.includes(owner);
    }
    if (effectId === "hero.zhouyu.fengzhu-huoshi") {
      const enemySide = getOpposingSide(owner.side);
      return (
        (damage?.target?.side === enemySide &&
          (["status.burn-tick", "status.burn-ignite"].includes(damage.sourceEffectId) ||
            (damage.target.statuses?.["broken-morale"] &&
              ["attack", "skill"].includes(damage.type)))) ||
        (damage?.source?.side === enemySide &&
          damage.source.statuses?.fear &&
          damage.type === "attack")
      );
    }
    return false;
  }
  if (event.type === "damage:after") {
    if (["hero.huanggai.kurouji", "hero.xiahoudun.gangyong"].includes(effectId)) {
      return damage?.target === owner && damage.finalAmount > 0;
    }
    return false;
  }
  if (event.type === "attack:before") {
    if (effectId === "hero.machao.pozhen") {
      return ownerAttacked && !owner.machaoFirstAttackUsed;
    }
    return ownerAttacked;
  }
  if (event.type === "attack:after") {
    if ([
      "hero.xiaoqiao.huaron-yuemao",
      "hero.wenchou.yongguan-sanjun",
      "hero.xuhuang.changqu-zhiru",
    ].includes(effectId)) {
      const target = getNearestBattleUnit(runtime, owner, "ahead");
      return Boolean(target && event.payload.attackers?.includes(target));
    }
    if (effectId === "hero.zhugeliang.yunchou") {
      return event.payload.attackers?.some(
        (attacker) => attacker.side === owner.side && attacker !== owner,
      );
    }
    return ownerAttacked;
  }
  return true;
}

function isEffectCandidateValid(runtime, candidate, event) {
  if (candidate.resolved) return false;
  if (candidate.definition.sourceType === "bond") {
    const eventUnit = event.payload.unit ?? null;
    if (
      candidate.effectId === "bond.wei-death" &&
      (!eventUnit ||
        eventUnit.side !== candidate.ownerSide ||
        !getBattleUnitBonds(eventUnit).includes("魏"))
    ) {
      return false;
    }
    if (
      candidate.effectId === "bond.shu-upgrade" &&
      (!eventUnit ||
        eventUnit.side !== candidate.ownerSide ||
        !getBattleUnitBonds(eventUnit).includes("蜀"))
    ) {
      return false;
    }
  }
  const isOwnersDeathEvent =
    event.type === "unit:death" && event.payload.unit === candidate.owner;
  const isLockedBattleStartHeroSkill = Boolean(candidate.battleStartLocked);
  const isOwnerAvailabilityLocked = Boolean(candidate.ownerAvailabilityLocked);
  if (
    candidate.definition.sourceType === "hero" &&
    !isLockedBattleStartHeroSkill &&
    !isOwnerAvailabilityLocked &&
    isUnitSkillDisabled(candidate.owner, runtime.currentExchange)
  ) {
    return false;
  }
  if (!isBattleHeroSkillApplicable(runtime, candidate, event)) return false;

  const conditions = candidate.definition.conditions ?? {};
  const damage = event.payload.damage;
  const isOwnersDamageAfterEvent =
    event.type === "damage:after" && damage?.target === candidate.owner;
  const isOwnersAttackAfterEvent =
    event.type === "attack:after" && event.payload.attackers?.includes(candidate.owner);
  if (conditions.phase && event.phase !== conditions.phase) return false;
  if (conditions.damageTypes && !conditions.damageTypes.includes(damage?.type)) return false;
  if (conditions.targetIsOwner && damage?.target !== candidate.owner) return false;
  if (conditions.sourceIsOwner && damage?.source !== candidate.owner) return false;
  if (conditions.sourceSideIsOwnerSide && damage?.source?.side !== candidate.ownerSide) return false;
  if (conditions.eventUnitIsOwner && event.payload.unit !== candidate.owner) return false;
  if (
    conditions.ownerIsAttacker &&
    !event.payload.attackers?.includes(candidate.owner)
  ) {
    return false;
  }
  if (
    candidate.effectId === "equipment.blood-armor" &&
    event.type === "status:apply" &&
    event.payload.target !== candidate.owner
  ) {
    return false;
  }
  if (
    candidate.effectId === "equipment.commander-seal" &&
    event.type === "unit:summon" &&
    (event.payload.unit?.side !== candidate.owner?.side || event.payload.revived)
  ) {
    return false;
  }
  if (
    candidate.effectId === "equipment.white-jade-turtle" &&
    event.type === "status:apply" &&
    event.payload.target !== candidate.owner
  ) {
    return false;
  }
  if (
    candidate.effectId === "equipment.yanmo-sail" &&
    event.type === "unit:death" &&
    (event.payload.unit !== candidate.owner || event.payload.revived)
  ) {
    return false;
  }
  if (candidate.effectId === "equipment.fangtian-halberd") {
    const owner = candidate.owner;
    const isOwnersAttackExchange = runtime.currentAttackers?.includes(owner);
    if (
      event.type !== "damage:before" ||
      damage?.type !== "attack" ||
      !isOwnersAttackExchange ||
      (damage?.source !== owner && damage?.target !== owner)
    ) {
      return false;
    }
  }
  if (
    candidate.effectId === "equipment.blood-armor" &&
    event.type === "damage:after" &&
    (damage?.target !== candidate.owner || damage.finalAmount <= 0)
  ) {
    return false;
  }
  if (
    candidate.owner &&
    !isOwnersDeathEvent &&
    !isOwnersDamageAfterEvent &&
    !isOwnersAttackAfterEvent &&
    !isLockedBattleStartHeroSkill &&
    !isOwnerAvailabilityLocked &&
    !isBattleUnitActive(runtime, candidate.owner)
  ) {
    return false;
  }
  return true;
}

function chooseDynamicHeroCandidate(runtime, candidates, event) {
  const valid = candidates.filter((candidate) => isEffectCandidateValid(runtime, candidate, event));
  if (valid.length === 0) return null;
  const highestAttack = Math.max(...valid.map((candidate) => candidate.owner.attack));
  const tied = valid.filter((candidate) => candidate.owner.attack === highestAttack);
  if (tied.length === 1) return tied[0];
  const selected = tied[Math.floor(runtime.random() * tied.length)];
  runtime.structuredLog.push({
    type: "timing-tie",
    eventId: event.id,
    attack: highestAttack,
    candidates: tied.map((candidate) => candidate.owner.name),
    selected: selected.owner.name,
  });
  return selected;
}

function chooseNextEffectCandidate(runtime, candidates, event) {
  const valid = candidates.filter((candidate) => isEffectCandidateValid(runtime, candidate, event));
  if (valid.length === 0) return null;
  const getCandidatePriority = (candidate) => {
    const initiativeBonus =
      candidate.definition.sourceType === "hero" &&
      candidate.owner?.equipment?.effectId === "equipment.initiative-flag"
        ? 1000
        : 0;
    return (candidate.definition.priority ?? 0) + initiativeBonus;
  };
  const highestPriority = Math.max(...valid.map(getCandidatePriority));
  const priorityCandidates = valid.filter(
    (candidate) => getCandidatePriority(candidate) === highestPriority,
  );
  const heroCandidates = priorityCandidates.filter(
    (candidate) => candidate.definition.sourceType === "hero" && candidate.owner,
  );
  if (heroCandidates.length > 0) {
    return chooseDynamicHeroCandidate(runtime, heroCandidates, event);
  }
  return priorityCandidates.sort((left, right) => left.sequence - right.sequence)[0];
}

function getEquipmentRuntimeState(owner, defaultCharges = null) {
  if (!owner?.equipment) return null;
  owner.equipment.runtime ??= {};
  if (
    defaultCharges !== null &&
    !Number.isFinite(owner.equipment.runtime.remainingCharges)
  ) {
    owner.equipment.runtime.remainingCharges = defaultCharges;
  }
  return owner.equipment.runtime;
}

function consumeEquipmentRuntimeCharge(owner, defaultCharges = 0) {
  const equipmentState = getEquipmentRuntimeState(owner, defaultCharges);
  if (!equipmentState || equipmentState.remainingCharges <= 0) return null;
  equipmentState.remainingCharges = Math.max(
    0,
    equipmentState.remainingCharges - 1,
  );
  const remainingCharges = equipmentState.remainingCharges;
  const exhausted = remainingCharges === 0;
  if (exhausted) owner.equipment = null;
  return { remainingCharges, exhausted };
}

function getOpposingSide(side) {
  return side === "player" ? "enemy" : "player";
}

function getLivingBattleUnits(runtime, side) {
  return runtime.teams[side].filter((unit) => unit.health > 0);
}

function getBattleUnitById(runtime, unitId) {
  if (!unitId) return null;
  return Object.values(runtime.teams)
    .flat()
    .find((unit) => unit.id === unitId) ?? null;
}

function getBattleStatusDamageSource(runtime, status, fallback) {
  return getBattleUnitById(runtime, status?.sourceUnitId) ?? fallback;
}

function getBattleUnitsFromFront(runtime, side) {
  const units = getLivingBattleUnits(runtime, side);
  return side === "player" ? [...units].reverse() : units;
}

function getNearestBattleUnit(runtime, owner, direction, predicate = () => true) {
  const team = runtime.teams[owner.side];
  const ownerIndex = team.indexOf(owner);
  const step =
    direction === "ahead"
      ? owner.side === "player"
        ? 1
        : -1
      : owner.side === "player"
        ? -1
        : 1;
  if (ownerIndex < 0) {
    const ownerStartPosition = runtime.battleStartPositions?.get(owner.id);
    if (!ownerStartPosition) return null;
    return (
      team
        .filter((target) => target.health > 0 && predicate(target))
        .map((target) => ({
          target,
          position: runtime.battleStartPositions?.get(target.id),
        }))
        .filter(
          ({ position }) =>
            position?.side === ownerStartPosition.side &&
            (position.index - ownerStartPosition.index) * step > 0,
        )
        .sort(
          (left, right) =>
            Math.abs(left.position.index - ownerStartPosition.index) -
            Math.abs(right.position.index - ownerStartPosition.index),
        )[0]?.target ?? null
    );
  }
  for (
    let index = ownerIndex + step;
    index >= 0 && index < team.length;
    index += step
  ) {
    const target = team[index];
    if (target.health > 0 && predicate(target)) return target;
  }
  return null;
}

function getNearestBattlePositionUnit(runtime, owner, direction) {
  const team = runtime.teams[owner.side];
  const ownerIndex = team.indexOf(owner);
  if (ownerIndex < 0) return null;
  const step =
    direction === "ahead"
      ? owner.side === "player"
        ? 1
        : -1
      : owner.side === "player"
        ? -1
        : 1;
  for (
    let index = ownerIndex + step;
    index >= 0 && index < team.length;
    index += step
  ) {
    if (team[index]) return team[index];
  }
  return null;
}

function shareBattleBond(left, right) {
  const rightBonds = new Set(getBattleUnitBonds(right));
  return getBattleUnitBonds(left).some((faction) => rightBonds.has(faction));
}

function getOwnerAttackPair(event, owner) {
  return event.payload.attackPairs?.find((pair) => pair.source === owner) ?? null;
}

function recordHeroBattleSkill(runtime, owner, message, effectId, details = {}) {
  recordBattleLog(runtime, "hero-skill", `${owner.name}：${message}。`, {
    ownerId: owner.id,
    ownerName: owner.name,
    ownerSide: owner.side,
    effectId,
    ...details,
  });
}

function commitResolvedBattleDamage(
  runtime,
  damage,
  {
    extraPayload = {},
    resolveDeaths = true,
    exchange = runtime.currentExchange,
  } = {},
) {
  const { source, target, sourceEffectId } = damage;
  if (!source || !target || target.health <= 0) return null;
  if (damage.finalAmount > 0) {
    target.lastDamageSource = source;
    target.lastDamageEffectId = sourceEffectId;
  }
  const healthBefore = target.health;
  target.health -= damage.finalAmount;
  const entry = recordBattleLog(
    runtime,
    "damage",
    `${source.side === "player" ? "我方" : source.side === "enemy" ? "敌方" : ""} ${
      source.name
    } 对${target.side === "player" ? "我方" : "敌方"} ${target.name}造成${
      damage.finalAmount
    }点伤害${formatDamageModifiers(damage)}。`.trim(),
    {
      damage: damage.finalAmount,
      baseDamage: damage.originalAmount,
      damageType: damage.type,
      modifiers: damage.modifiers.map((modifier) => ({ ...modifier })),
      sourceEffectId,
      sourceUnitId: source.id,
      sourceName: source.name,
      sourceSide: source.side ?? null,
      targetUnitId: target.id,
      targetName: target.name,
      targetSide: target.side ?? null,
      targetHealthBefore: healthBefore,
      targetHealthAfter: target.health,
      exchange,
    },
  );
  recordBattlePresentationStep(runtime, {
    kind: "damage",
    title: `${source.name}对${target.name}造成 ${damage.finalAmount} 点伤害`,
    effectId: sourceEffectId,
    effectName: runtime.currentCandidate?.sourceName || source.name,
    sourceIds: [source.id],
    targetIds: [target.id],
    cues: [
      {
        unitId: target.id,
        text: damage.finalAmount > 0 ? `-${damage.finalAmount}` : "伤害抵挡",
        tone: "damage",
        damageAmount: damage.finalAmount,
        damageType: damage.type,
      },
    ],
    entries: [entry],
    durationMs: 1450,
  });
  resolveImmediateBattleEvent(runtime, "damage:after", {
    damage,
    exchange,
    ...extraPayload,
  });
  if (resolveDeaths) resolveAllBattleDeaths(runtime, exchange);
  return damage;
}

function dealBattleDamage(
  runtime,
  {
    source,
    target,
    amount,
    type = "skill",
    sourceEffectId,
    extraPayload = {},
    resolveDeaths = true,
  },
) {
  if (!source || !target || target.health <= 0) return null;
  const damage = resolveBattleDamage(runtime, {
    source,
    target,
    amount,
    type,
    sourceEffectId,
  });
  return commitResolvedBattleDamage(runtime, damage, {
    extraPayload,
    resolveDeaths,
  });
}

function grantBattleExperience(runtime, unit, amount, source, sourceEffectId) {
  const maximumProgress = UNIT_LEVEL_COPY_THRESHOLDS[MAX_UNIT_LEVEL];
  let granted = 0;
  let convertedToStats = 0;
  for (let point = 0; point < amount; point += 1) {
    if (unit.health <= 0) break;
    const previousLevel = unit.level ?? 1;
    const previousExperience = unit.experience ?? 0;
    const previousAttack = unit.attack;
    const previousHealth = unit.health;
    const previousMaxHealth = unit.maxHealth;
    if (getUnitProgressValue(unit) >= maximumProgress) {
      const statResult = addBattleUnitStats(unit, 1, 1);
      convertedToStats += 1;
      recordBattlePresentationLog(
        runtime,
        "experience",
        `${source?.name ?? "经验效果"}：${unit.name}经验已满，1 点溢出经验转化为 +1/+1，当前 ${unit.attack}/${unit.health}。`,
        {
          ownerId: source?.id ?? null,
          ownerName: source?.name ?? null,
          ownerSide: source?.side ?? null,
          targetUnitId: unit.id,
          targetName: unit.name,
          targetSide: unit.side,
          sourceEffectId,
          grantedExperience: 0,
          convertedToStats: 1,
          levelBefore: previousLevel,
          levelAfter: unit.level ?? previousLevel,
          experienceBefore: previousExperience,
          experienceAfter: unit.experience ?? previousExperience,
          attackBefore: previousAttack,
          attackAfter: unit.attack,
          healthBefore: previousHealth,
          healthAfter: unit.health,
          maxHealthBefore: previousMaxHealth,
          maxHealthAfter: unit.maxHealth,
          attackDelta: statResult?.attackDelta ?? 0,
          healthDelta: statResult?.healthDelta ?? 0,
          maxHealthDelta: statResult?.maxHealthDelta ?? 0,
        },
        {
          kind: "experience",
          title: `${unit.name}溢出经验转化`,
          effectId: sourceEffectId,
          effectName: source?.name ?? "经验效果",
          sourceIds: [source?.id],
          targetIds: [unit.id],
          cues: [
            {
              unitId: unit.id,
              text: "满级经验 → +1/+1",
              tone: "experience",
            },
          ],
          durationMs: 1550,
        },
      );
      continue;
    }
    unit.bonusExperience = Math.max(0, unit.bonusExperience ?? 0) + 1;
    const progress = getUnitProgress(getUnitProgressValue(unit));
    unit.level = progress.level;
    unit.experience = progress.experience;
    const statResult = addBattleUnitStats(unit, 1, 1);
    granted += 1;
    const leveledUp = unit.level > previousLevel;
    const experienceBeforeLabel =
      previousLevel >= MAX_UNIT_LEVEL
        ? "满级"
        : `${previousExperience}/${getExperienceNeeded(previousLevel)}`;
    const experienceAfterLabel =
      unit.level >= MAX_UNIT_LEVEL
        ? "满级"
        : `${unit.experience}/${getExperienceNeeded(unit.level)}`;
    recordBattlePresentationLog(
      runtime,
      "experience",
      `${source?.name ?? "经验效果"}：${unit.name}获得 1 点经验（${experienceBeforeLabel} → ${experienceAfterLabel}）并获得 +1/+1${
        leveledUp ? `，升级至 LV${unit.level}` : ""
      }。`,
      {
        ownerId: source?.id ?? null,
        ownerName: source?.name ?? null,
        ownerSide: source?.side ?? null,
        targetUnitId: unit.id,
        targetName: unit.name,
        targetSide: unit.side,
        sourceEffectId,
        grantedExperience: 1,
        convertedToStats: 0,
        leveledUp,
        levelBefore: previousLevel,
        levelAfter: unit.level,
        experienceBefore: previousExperience,
        experienceAfter: unit.experience,
        attackBefore: previousAttack,
        attackAfter: unit.attack,
        healthBefore: previousHealth,
        healthAfter: unit.health,
        maxHealthBefore: previousMaxHealth,
        maxHealthAfter: unit.maxHealth,
        attackDelta: statResult?.attackDelta ?? 0,
        healthDelta: statResult?.healthDelta ?? 0,
        maxHealthDelta: statResult?.maxHealthDelta ?? 0,
      },
      {
        kind: "experience",
        title: `${unit.name}获得 1 点经验${leveledUp ? `并升至 LV${unit.level}` : ""}`,
        effectId: sourceEffectId,
        effectName: source?.name ?? "经验效果",
        sourceIds: [source?.id],
        targetIds: [unit.id],
        cues: [
          {
            unitId: unit.id,
            text: `EXP +1 · +1/+1${leveledUp ? ` · LV${unit.level}` : ""}`,
            tone: "experience",
          },
        ],
        durationMs: leveledUp ? 1800 : 1550,
      },
    );
    resolveImmediateBattleEvent(runtime, "experience:gain", {
      unit,
      amount: 1,
      source,
      sourceEffectId,
    });
    if (unit.level > previousLevel) {
      resolveImmediateBattleEvent(runtime, "unit:upgrade", {
        unit,
        previousLevel,
        level: unit.level,
        source,
        sourceEffectId,
      });
    }
  }
  if (granted > 0 || convertedToStats > 0) {
    const experienceMessage = granted > 0 ? `${unit.name}获得 ${granted} 点经验` : "";
    const overflowMessage =
      convertedToStats > 0
        ? `${experienceMessage ? "；" : `${unit.name}`}经验已满，${convertedToStats} 点溢出经验转化为 +${convertedToStats}/+${convertedToStats}`
        : "";
    recordBattleLog(
      runtime,
      "hero-skill",
      `${source?.name ?? "经验效果"}：${experienceMessage}${overflowMessage}。`,
      {
        ownerId: source?.id ?? null,
        ownerName: source?.name ?? null,
        ownerSide: source?.side ?? null,
        targetUnitId: unit.id,
        targetUnitName: unit.name,
        effectId: sourceEffectId,
        grantedExperience: granted,
        convertedToStats,
        animationSkip: true,
      },
    );
  }
  return { granted, convertedToStats };
}

function addBattleUnitToTeamFront(runtime, side, unit) {
  if (side === "player") runtime.teams[side].push(unit);
  else runtime.teams[side].unshift(unit);
}

function summonScaledCavalryInFront(runtime, owner, count, effectId) {
  let summonAnchor = owner;
  for (let index = 0; index < count; index += 1) {
    if (!hasBattleSummonSlot(runtime, owner.side)) {
      recordBattleSummonFailure(runtime, owner.side, owner.name, effectId);
      break;
    }
    const level = owner.level ?? 1;
    const cavalry = createCavalry(
      runtime,
      owner.side,
      2 * level,
      level,
      owner,
      level,
    );
    if (!insertBattleUnitInFrontOfTarget(runtime, summonAnchor, cavalry)) {
      recordBattleSummonFailure(runtime, owner.side, owner.name, effectId);
      break;
    }
    summonAnchor = cavalry;
    recordBattlePresentationLog(
      runtime,
      "summon",
      `${owner.name}：在身前召唤骑兵 LV${level} ${cavalry.attack}/${cavalry.health}。`,
      {
        ownerId: owner.id,
        ownerName: owner.name,
        ownerSide: owner.side,
        unitId: cavalry.id,
        unitName: cavalry.name,
        unitSide: cavalry.side,
        sourceEffectId: effectId,
      },
      {
        kind: "summon",
        title: `${owner.name}召唤骑兵`,
        effectId,
        effectName: owner.name,
        sourceIds: [owner.id],
        targetIds: [cavalry.id],
        cues: [{ unitId: cavalry.id, text: "召唤", tone: "buff" }],
        durationMs: 1550,
      },
    );
    dispatchBattleEvent(runtime, "unit:summon", {
      unit: cavalry,
      side: owner.side,
      source: owner,
      sourceEffectId: effectId,
    });
  }
}

function cloneBattleIdentityForSummon(
  runtime,
  source,
  side,
  attack,
  health,
  level = 1,
  summonerOrFaction = source.faction,
  { preserveSourceBonds = false } = {},
) {
  const summonId = runtime.nextSummonId++;
  const inheritedBonds = preserveSourceBonds
    ? {
        faction: source.faction,
        extraFactions: [
          ...(source.extraFactions ?? []),
          ...(source.tempExtraFactions ?? []),
        ],
      }
    : getSummonedUnitBondSnapshot(summonerOrFaction);
  return {
    id: `${side}-${source.name}-skill-summon-${summonId}`,
    sourceId: source.sourceId ?? null,
    name: source.name,
    attack,
    health,
    maxHealth: health,
    faction: inheritedBonds.faction,
    extraFactions: normalizeBondTags(inheritedBonds.extraFactions),
    tempExtraFactions: [],
    usesBondDefinitionSnapshot: true,
    tier: source.tier,
    side,
    lineupIndex: 0,
    skill: source.skill ?? "",
    skillEffectIds: [...(source.skillEffectIds ?? [])],
    equipment: null,
    statuses: {},
    level,
    experience: 0,
    copies: UNIT_LEVEL_COPY_THRESHOLDS[level] ?? 1,
    bonusExperience: 0,
    isSummon: true,
    skillDisabled: false,
    skillDisabledUntilExchange: null,
    consumedSnapshot: null,
    lastDamageSource: null,
    huatuoRevivesUsedThisRound: source.huatuoRevivesUsedThisRound ?? 0,
  };
}

function createFormalHeroSummon(runtime, owner, heroDefinition) {
  const level = Math.max(1, Math.min(MAX_UNIT_LEVEL, owner.level ?? 1));
  const summonId = runtime.nextSummonId++;
  const attack = Math.max(1, Number(heroDefinition.attack) * level);
  const health = Math.max(1, Number(heroDefinition.health) * level);
  const inheritedBonds = getSummonedUnitBondSnapshot(owner);
  return {
    id: `${owner.side}-${heroDefinition.name}-formal-summon-${summonId}`,
    sourceId: null,
    name: heroDefinition.name,
    attack,
    health,
    maxHealth: health,
    faction: inheritedBonds.faction,
    extraFactions: inheritedBonds.extraFactions,
    tempExtraFactions: [],
    usesBondDefinitionSnapshot: true,
    tier: heroDefinition.tier,
    side: owner.side,
    lineupIndex: 0,
    skill: heroDefinition.skill ?? "",
    skillEffectIds: [heroDefinition.effectId].filter(Boolean),
    equipment: null,
    statuses: {},
    level,
    experience: 0,
    copies: UNIT_LEVEL_COPY_THRESHOLDS[level] ?? 1,
    bonusExperience: 0,
    isSummon: true,
    skillDisabled: false,
    skillDisabledUntilExchange: null,
    consumedSnapshot: null,
    lastDamageSource: null,
  };
}

function createBattleGeneratedEquipment(runtime, effectId) {
  const definition = CARD_POOLS.stratagem.find(
    (item) => item.effectId === effectId,
  );
  if (!definition) return null;
  const equipment = createEquipmentFromCard({
    ...definition,
    id: `battle-generated-equipment-${runtime.nextSummonId}`,
  });
  runtime.nextSummonId += 1;
  return equipment;
}

function createFangshiSummon(runtime, owner) {
  const level = Math.max(1, Math.min(MAX_UNIT_LEVEL, owner.level ?? 1));
  const summonId = runtime.nextSummonId++;
  const inheritedBonds = getSummonedUnitBondSnapshot(owner);
  return {
    id: `${owner.side}-fangshi-${summonId}`,
    sourceId: null,
    name: "方士",
    attack: level,
    health: level,
    maxHealth: level,
    faction: inheritedBonds.faction,
    extraFactions: inheritedBonds.extraFactions,
    tempExtraFactions: [],
    usesBondDefinitionSnapshot: true,
    tier: 0,
    side: owner.side,
    lineupIndex: 0,
    skillEffectIds: ["summon.fangshi-death"],
    skill: DERIVED_UNIT_DEFINITION_BY_NAME.方士.skill,
    equipment: null,
    statuses: {},
    level,
    experience: 0,
    copies: UNIT_LEVEL_COPY_THRESHOLDS[level] ?? 1,
    bonusExperience: 0,
    isSummon: true,
    skillDisabled: false,
    skillDisabledUntilExchange: null,
    consumedSnapshot: null,
    lastDamageSource: null,
  };
}

function summonUnitAtDeadOwnerPosition(runtime, owner, summon, effectId) {
  if (
    !hasBattleSummonSlot(runtime, owner.side) ||
    !insertBattleUnitAtDeathPosition(
      runtime,
      owner.side,
      summon,
      owner.deathPosition,
    )
  ) {
    recordBattleSummonFailure(runtime, owner.side, owner.name, effectId);
    return false;
  }
  recordBattlePresentationLog(
    runtime,
    "summon",
    `${owner.name}：在原位置召唤${summon.name} LV${summon.level} ${summon.attack}/${summon.health}。`,
    {
      ownerId: owner.id,
      ownerName: owner.name,
      ownerSide: owner.side,
      unitId: summon.id,
      unitName: summon.name,
      unitSide: summon.side,
      sourceEffectId: effectId,
    },
    {
      kind: "summon",
      title: `${owner.name}在原位置召唤${summon.name}`,
      effectId,
      effectName: owner.name,
      sourceIds: [owner.id],
      targetIds: [summon.id],
      cues: [{ unitId: summon.id, text: "召唤", tone: "buff" }],
      durationMs: 1550,
    },
  );
  dispatchBattleEvent(runtime, "unit:summon", {
    unit: summon,
    side: owner.side,
    source: owner,
    sourceEffectId: effectId,
  });
  return true;
}

function summonUnitInFrontOfDeadOwner(runtime, owner, summon, effectId, sourceName) {
  if (!hasBattleSummonSlot(runtime, owner.side)) {
    recordBattleSummonFailure(runtime, owner.side, sourceName, effectId);
    return false;
  }
  if (!insertBattleUnitInFrontOfTarget(runtime, owner, summon, owner.deathPosition)) {
    recordBattleSummonFailure(runtime, owner.side, sourceName, effectId);
    return false;
  }
  recordBattlePresentationLog(
    runtime,
    "summon",
    `${sourceName}：召唤${summon.name} LV${summon.level} ${summon.attack}/${summon.health}。`,
    {
      ownerId: owner.id,
      ownerName: owner.name,
      ownerSide: owner.side,
      unitId: summon.id,
      unitName: summon.name,
      unitSide: summon.side,
      sourceEffectId: effectId,
    },
    {
      kind: "summon",
      title: `${summon.name}加入战场`,
      effectId,
      effectName: sourceName,
      sourceIds: [owner.id],
      targetIds: [summon.id],
      cues: [{ unitId: summon.id, text: "召唤", tone: "buff" }],
      durationMs: 1550,
    },
  );
  dispatchBattleEvent(runtime, "unit:summon", {
    unit: summon,
    side: owner.side,
    source: owner,
    sourceEffectId: effectId,
  });
  return true;
}

function summonZhangHeHero(runtime, owner, effectId) {
  const ownerBonds = new Set(getBattleUnitBonds(owner));
  const pool = CARD_POOLS.hero.filter(
    (hero) =>
      hero.name !== "张郃" &&
      BOND_FACTIONS.includes(hero.faction) &&
      ownerBonds.has(hero.faction),
  );
  if (pool.length === 0) return false;
  const heroDefinition = pool[Math.floor(runtime.random() * pool.length)];
  const summon = createFormalHeroSummon(runtime, owner, heroDefinition);
  return summonUnitInFrontOfDeadOwner(runtime, owner, summon, effectId, owner.name);
}

function createWhiteHorseSummon(runtime, owner) {
  const level = Math.max(1, Math.min(MAX_UNIT_LEVEL, owner.level ?? 1));
  const summonId = runtime.nextSummonId++;
  const inheritedBonds = getSummonedUnitBondSnapshot(owner);
  return {
    id: `${owner.side}-white-horse-${summonId}`,
    sourceId: null,
    name: "白马义从",
    attack: 4 * level,
    health: 4 * level,
    maxHealth: 4 * level,
    faction: inheritedBonds.faction,
    extraFactions: inheritedBonds.extraFactions,
    tempExtraFactions: [],
    usesBondDefinitionSnapshot: true,
    tier: 0,
    side: owner.side,
    lineupIndex: 0,
    skillEffectIds: ["summon.white-horse-attack"],
    skill: "[白马突袭] 攻击前，对生命值最低的敌军造成（4）点伤害",
    equipment: null,
    statuses: {},
    level,
    experience: 0,
    copies: UNIT_LEVEL_COPY_THRESHOLDS[level] ?? 1,
    bonusExperience: 0,
    isSummon: true,
    skillDisabled: false,
    skillDisabledUntilExchange: null,
    consumedSnapshot: null,
    lastDamageSource: null,
  };
}

function releaseDianweiConsumedUnit(runtime, owner, level, effectId) {
  const snapshot = owner.consumedSnapshot;
  if (!snapshot) return;
  const released = cloneBattleIdentityForSummon(
    runtime,
    snapshot,
    owner.side,
    snapshot.attack,
    snapshot.maxHealth,
    level,
    owner,
  );
  released.health = Math.min(snapshot.health, released.maxHealth);
  if (
    !insertBattleUnitAtDeathPosition(
      runtime,
      owner.side,
      released,
      snapshot.deathPosition,
    )
  ) {
    recordBattleSummonFailure(runtime, owner.side, owner.name, effectId);
    owner.consumedSnapshot = null;
    return;
  }
  recordBattlePresentationLog(
    runtime,
    "summon",
    `${owner.name}释放被吞噬的${released.name}，以 LV${released.level} ${released.attack}/${released.health}回到战场。`,
    {
      ownerId: owner.id,
      ownerName: owner.name,
      ownerSide: owner.side,
      unitId: released.id,
      unitName: released.name,
      unitSide: released.side,
      sourceEffectId: effectId,
    },
    {
      kind: "summon",
      title: `${released.name}重返战场`,
      effectId,
      effectName: owner.name,
      sourceIds: [owner.id],
      targetIds: [released.id],
      cues: [{ unitId: released.id, text: "释放", tone: "buff" }],
      durationMs: 1550,
    },
  );
  dispatchBattleEvent(runtime, "unit:summon", {
    unit: released,
    side: owner.side,
    source: owner,
    sourceEffectId: effectId,
  });
  owner.consumedSnapshot = null;
}

function resolveRestRecovery(runtime, event) {
  const attackers = event.payload.attackers ?? [];
  Object.values(runtime.teams)
    .flat()
    .filter((unit) => unit.health > 0 && unit.statuses?.rest)
    .forEach((unit) => {
      const triggered = attackers.some(
        (attacker) => attacker.side === unit.side && attacker !== unit,
      );
      if (!triggered) return;
      const amount = unit.statuses.rest.amount ?? 0;
      applyBattleUnitStatBonus(runtime, unit, 0, amount, "休整");
    });
}

function resolveIntimidatedDamage(runtime, event) {
  const damage = event.payload.damage;
  const status = damage?.source?.statuses?.intimidated;
  if (!status || status.spent || damage.type !== "attack") return;
  const before = damage.amount;
  damage.amount = 0;
  status.spent = true;
  damage.modifiers.push({
    effectId: "status.intimidated-damage",
    sourceName: "震慑",
    amount: damage.amount - before,
  });
}

function resolveBrokenMoraleDamage(runtime, event) {
  const damage = event.payload.damage;
  if (
    !damage?.target?.statuses?.["broken-morale"] ||
    !["attack", "skill"].includes(damage.type)
  ) {
    return;
  }
  damage.amount += 5;
  damage.modifiers.push({
    effectId: "status.broken-morale-damage",
    sourceName: "破胆",
    amount: 5,
  });
}

function resolveFearDamage(runtime, event) {
  const damage = event.payload.damage;
  if (!damage?.source?.statuses?.fear || damage.type !== "attack") return;
  const before = damage.amount;
  damage.amount = Math.max(0, damage.amount - 3);
  damage.modifiers.push({
    effectId: "status.fear-damage",
    sourceName: "畏惧",
    amount: damage.amount - before,
  });
}

function resolveUnparalleledCleave(runtime, event) {
  (event.payload.attackPairs ?? []).forEach((pair) => {
    const status = pair.source.statuses?.unparalleled;
    if (!status || pair.damage.finalAmount <= 0) return;
    const targets = [];
    let target = getNearestBattleUnit(runtime, pair.target, "behind");
    const count = Math.max(1, status.targetCount ?? 1);
    while (target && targets.length < count) {
      targets.push(target);
      target = getNearestBattleUnit(runtime, target, "behind");
    }
    targets.forEach((cleaveTarget) => {
      const amount = Math.max(1, Math.floor(pair.damage.finalAmount * 0.3));
      dealBattleDamage(runtime, {
        source: pair.source,
        target: cleaveTarget,
        amount,
        sourceEffectId: "status.unparalleled-cleave",
      });
    });
  });
}

function resolveCounterplotRevive(runtime, event) {
  const deadUnit = event.payload.unit;
  const status = deadUnit?.statuses?.counterplot;
  if (!status || status.resolved) return;
  status.resolved = true;
  const side = status.ownerSide;
  if (!hasBattleSummonSlot(runtime, side)) {
    recordBattleSummonFailure(
      runtime,
      side,
      status.sourceName || "反间",
      status.sourceEffectId || "status.counterplot-revive",
    );
    return;
  }
  const summon = cloneBattleIdentityForSummon(
    runtime,
    deadUnit,
    side,
    3,
    3,
    1,
    status.summonBonds ?? status.summonFaction,
  );
  addBattleUnitToTeamFront(runtime, side, summon);
  recordBattlePresentationLog(
    runtime,
    "status",
    `${deadUnit.name}的反间触发，在${side === "player" ? "我方" : "敌方"}队首以LV1 3/3加入。`,
    {
      deadUnitId: deadUnit.id,
      deadUnitName: deadUnit.name,
      deadUnitSide: deadUnit.side,
      summonId: summon.id,
      side,
    },
    {
      kind: "summon",
      title: `${deadUnit.name}因反间加入敌方`,
      effectName: status.sourceName || "反间",
      targetIds: [summon.id],
      cues: [{ unitId: summon.id, text: "反间召唤", tone: "status" }],
      durationMs: 1650,
    },
  );
  dispatchBattleEvent(runtime, "unit:summon", {
    unit: summon,
    side,
    sourceEffectId: "status.counterplot-revive",
  });
}

function resolveBattleHeroSkill(runtime, candidate, event) {
  const { owner, effectId } = candidate;
  const level = owner.level ?? 1;
  const eventUnit = event.payload.unit ?? null;
  const enemySide = getOpposingSide(owner.side);
  const ownerAttacked = event.payload.attackers?.includes(owner);
  const sharedEventUnit =
    eventUnit &&
    eventUnit.side === owner.side &&
    shareBattleBond(owner, eventUnit);

  if (effectId === "summon.white-horse-attack" && event.type === "attack:before" && ownerAttacked) {
    const enemies = getLivingBattleUnits(runtime, enemySide);
    const lowestHealth = Math.min(...enemies.map((unit) => unit.health), Infinity);
    const target = pickBattleRandomUnits(
      runtime,
      enemies.filter((unit) => unit.health === lowestHealth),
      1,
    )[0];
    if (target) {
      dealBattleDamage(runtime, {
        source: owner,
        target,
        amount: 4 * level,
        type: "skill",
        sourceEffectId: effectId,
      });
    }
    return;
  }
  if (
    effectId === "summon.fangshi-death" &&
    event.type === "unit:death" &&
    eventUnit === owner
  ) {
    const target = pickBattleRandomUnits(
      runtime,
      getLivingBattleUnits(runtime, owner.side).filter((unit) => unit !== owner),
      1,
    )[0];
    if (target) {
      applyBattleUnitStatBonus(
        runtime,
        target,
        3 * level,
        3 * level,
        owner.name,
      );
    }
    return;
  }

  if (
    effectId === "hero.zhenji.luoshen" &&
    event.type === "unit:summon" &&
    eventUnit?.side === owner.side
  ) {
    applyBattleUnitStatBonus(runtime, eventUnit, level, 0, owner.name);
    return;
  }
  if (effectId === "hero.pangde.xunjie" && event.type === "unit:death" && eventUnit === owner) {
    const target = getNearestBattleUnit(runtime, owner, "behind");
    if (target) applyBattleUnitStatBonus(runtime, target, 2 * level, level, owner.name);
    return;
  }
  if (
    effectId === "hero.liaohua.sujiang" &&
    event.type === "experience:gain" &&
    eventUnit?.side === owner.side &&
    eventUnit !== owner
  ) {
    applyBattleUnitStatBonus(runtime, eventUnit, 0, level, owner.name);
    return;
  }
  if (effectId === "hero.mayunlu.xiliang-lienv" && event.type === "unit:death" && eventUnit === owner) {
    const summon = createCavalry(runtime, owner.side, 2 * level, level, owner, level);
    summonUnitInFrontOfDeadOwner(runtime, owner, summon, effectId, owner.name);
    return;
  }
  if (
    effectId === "hero.yuji.guhuo" &&
    event.type === "unit:death" &&
    eventUnit === owner
  ) {
    const summon = createFangshiSummon(runtime, owner);
    summonUnitAtDeadOwnerPosition(runtime, owner, summon, effectId);
    return;
  }
  if (effectId === "hero.handang.zuoyou-kaigong" && event.type === "attack:before" && ownerAttacked) {
    const target = pickBattleRandomUnits(
      runtime,
      getLivingBattleUnits(runtime, enemySide).filter((unit) => hasNegativeStatus(unit)),
      1,
    )[0];
    if (!target) return;
    dealBattleDamage(runtime, {
      source: owner,
      target,
      amount: 3 * level,
      type: "skill",
      sourceEffectId: effectId,
    });
    return;
  }
  if (effectId === "hero.huaxiong.xiaoyong" && event.type === "battle:start") {
    getBattleUnitsFromFront(runtime, enemySide)
      .slice(0, level)
      .forEach((target) =>
        dealBattleDamage(runtime, { source: owner, target, amount: 1, sourceEffectId: effectId }),
      );
    return;
  }
  if (effectId === "hero.xiahouyuan.qianli-benxi" && event.type === "attack:after" && ownerAttacked) {
    const ratio = 0.33 * level;
    summonCavalry(runtime, owner.side, 1, {
      attack: Math.max(1, Math.floor(owner.attack * ratio)),
      health: Math.max(1, Math.floor(owner.health * ratio)),
      level: 1,
      sourceEffectId: effectId,
      sourceName: owner.name,
      summoner: owner,
      target: owner,
      position: "target-front",
    });
    return;
  }
  if (effectId === "hero.diaochan.qingcheng" && event.type === "attack:after" && ownerAttacked) {
    pickBattleRandomUnits(runtime, getLivingBattleUnits(runtime, enemySide), level).forEach(
      (target) =>
        applyNegativeStatus(runtime, target, "counterplot", {
          ownerSide: owner.side,
          summonFaction: owner.faction,
          sourceEffectId: effectId,
          sourceName: owner.name,
        }),
    );
    return;
  }
  if (effectId === "hero.huangzhong.laodang-yizhuang" && event.type === "attack:after" && ownerAttacked) {
    grantBattleExperience(runtime, owner, level, owner, effectId);
    return;
  }
  if (
    effectId === "hero.weiyan.caigao-qilie" &&
    event.type === "unit:death" &&
    eventUnit?.side === owner.side &&
    eventUnit !== owner
  ) {
    applyBattleUnitStatBonus(runtime, owner, level, level, owner.name);
    return;
  }
  if (effectId === "hero.wenchou.yongguan-sanjun" && event.type === "attack:after") {
    const target = getNearestBattleUnit(runtime, owner, "ahead");
    if (target && event.payload.attackers?.includes(target)) {
      applyBattleUnitStatBonus(runtime, owner, level, level, owner.name);
    }
    return;
  }
  if (effectId === "hero.xiaoqiao.huaron-yuemao" && event.type === "attack:after") {
    const target = getNearestBattleUnit(runtime, owner, "ahead");
    if (target && event.payload.attackers?.includes(target)) {
      applyBattleUnitStatBonus(runtime, target, 0, 2 * level, owner.name);
    }
    return;
  }
  if (
    effectId === "hero.huanggai.kurouji" &&
    event.type === "damage:after" &&
    event.payload.damage?.target === owner &&
    event.payload.damage.finalAmount > 0
  ) {
    pickBattleRandomUnits(runtime, getLivingBattleUnits(runtime, enemySide), level).forEach(
      (target) =>
        applyNegativeStatus(runtime, target, "burn", {
          ownerSide: owner.side,
          sourceEffectId: effectId,
          sourceName: owner.name,
        }),
    );
    return;
  }
  if (
    effectId === "hero.xiahoudun.gangyong" &&
    event.type === "damage:after" &&
    event.payload.damage?.target === owner &&
    event.payload.damage.finalAmount > 0
  ) {
    const target = getNearestBattleUnit(runtime, owner, "behind");
    if (target) applyBattleUnitStatBonus(runtime, target, 2 * level, 2 * level, owner.name);
    return;
  }
  if (effectId === "hero.yuejin.xiandeng-xianzhen" && event.type === "unit:death" && eventUnit === owner) {
    const target = getBattleUnitsFromFront(runtime, owner.side)[0] ?? null;
    if (target) applyBattleUnitStatBonus(runtime, target, 4 * level, 4 * level, owner.name);
    return;
  }
  if (effectId === "hero.xuhuang.changqu-zhiru" && event.type === "attack:after") {
    const ahead = getNearestBattleUnit(runtime, owner, "ahead");
    if (ahead && event.payload.attackers?.includes(ahead)) {
      const target = getBattleUnitsFromFront(runtime, enemySide).at(-1);
      if (target) {
        dealBattleDamage(runtime, {
          source: owner,
          target,
          amount: 3 * level,
          type: "skill",
          sourceEffectId: effectId,
        });
      }
    }
    return;
  }
  if (effectId === "hero.zhangfei.yanren-paoxiao" && event.type === "battle:start") {
    getBattleUnitsFromFront(runtime, enemySide)
      .slice(0, level)
      .forEach((target) =>
        applyNegativeStatus(runtime, target, "broken-morale", {
          ownerSide: owner.side,
          sourceEffectId: effectId,
          sourceName: owner.name,
        }),
      );
    return;
  }
  if (effectId === "hero.xushu.jiancai" && event.type === "battle:start") {
    const target = getNearestBattleUnit(runtime, owner, "ahead");
    if (target) grantBattleExperience(runtime, target, level, owner, effectId);
    return;
  }
  if (effectId === "hero.taishici.jianwu-xufa" && event.type === "battle:start") {
    const enemies = getLivingBattleUnits(runtime, enemySide);
    const highestHealth = Math.max(...enemies.map((unit) => unit.health), -Infinity);
    const target = pickBattleRandomUnits(
      runtime,
      enemies.filter((unit) => unit.health === highestHealth),
      1,
    )[0];
    if (!target) return;
    dealBattleDamage(runtime, {
      source: owner,
      target,
      amount: 3 * level,
      sourceEffectId: effectId,
    });
    if (target.health > 0) {
      applyNegativeStatus(runtime, target, "burn", {
        ownerSide: owner.side,
        sourceEffectId: effectId,
        sourceName: owner.name,
      });
    }
    return;
  }
  if (
    effectId === "hero.zhoutai.roushen-tiebi" &&
    event.type === "damage:before" &&
    event.payload.damage?.target === owner &&
    runtime.currentAttackers?.includes(owner) &&
    ["attack", "skill"].includes(event.payload.damage.type)
  ) {
    const damage = event.payload.damage;
    const before = damage.amount;
    damage.amount = Math.max(0, damage.amount - 3 * level);
    damage.modifiers.push({
      effectId,
      sourceName: owner.name,
      amount: damage.amount - before,
    });
    return;
  }
  if (
    effectId === "hero.yanliang.yongguan-sanjun" &&
    event.type === "unit:death" &&
    eventUnit !== owner &&
    event.payload.killer === owner
  ) {
    applyBattleUnitStatBonus(runtime, owner, 2 * level, 2 * level, owner.name);
    return;
  }
  if (
    effectId === "hero.hanxiandi.piaoyao" &&
    event.type === "unit:death" &&
    eventUnit === owner
  ) {
    const target = pickBattleRandomUnits(
      runtime,
      getLivingBattleUnits(runtime, owner.side).filter(
        (unit) => unit !== owner && !unit.equipment,
      ),
      1,
    )[0];
    if (!target) return;
    target.equipment = createBattleGeneratedEquipment(
      runtime,
      "equipment.imperial-edict",
    );
    recordBattlePresentationLog(
      runtime,
      "equipment",
      `${owner.name}使${target.name}获得诏书。`,
      {
        ownerId: owner.id,
        ownerName: owner.name,
        ownerSide: owner.side,
        targetUnitId: target.id,
        targetName: target.name,
        targetSide: target.side,
        sourceEffectId: effectId,
      },
      {
        kind: "equipment",
        title: `${target.name}获得诏书`,
        effectId,
        effectName: owner.name,
        sourceIds: [owner.id],
        targetIds: [target.id],
        cues: [{ unitId: target.id, text: "诏书", tone: "equipment" }],
        durationMs: 1450,
      },
    );
    return;
  }
  if (effectId === "hero.dianwei.guzhi-elai") {
    if (event.type === "battle:start") {
      const target = getNearestBattleUnit(runtime, owner, "ahead");
      if (!target) return;
      const deathPosition = captureBattleDeathPosition(runtime, target);
      owner.consumedSnapshot = {
        ...getBattleUnitSnapshot(target),
        faction: target.faction,
        extraFactions: [...(target.extraFactions ?? [])],
        tier: target.tier,
        skillEffectIds: [...(target.skillEffectIds ?? [])],
        deathPosition,
      };
      target.health = 0;
      target.deathPosition = deathPosition;
      recordBattlePresentationLog(
        runtime,
        "consume",
        `${owner.name}吞噬${target.name}，${target.name}生命降至 0。`,
        {
          ownerId: owner.id,
          ownerName: owner.name,
          ownerSide: owner.side,
          targetUnitId: target.id,
          targetName: target.name,
          targetSide: target.side,
          sourceEffectId: effectId,
        },
        {
          kind: "consume",
          title: `${owner.name}吞噬${target.name}`,
          effectId,
          effectName: owner.name,
          sourceIds: [owner.id],
          targetIds: [target.id],
          deathIds: [target.id],
          cues: [{ unitId: target.id, text: "被吞噬", tone: "death" }],
          durationMs: 1550,
        },
      );
      resolveImmediateBattleEvent(runtime, "unit:consume", {
        unit: target,
        consumer: owner,
        sourceEffectId: effectId,
        deathPosition,
      });
      resolveBattleUnitDeath(runtime, target, runtime.currentExchange, {
        deathPosition,
        killer: owner,
        sourceEffectId: effectId,
        consumed: true,
      });
      if (!isBattleUnitActive(runtime, owner)) {
        releaseDianweiConsumedUnit(runtime, owner, level, effectId);
      }
      return;
    }
    if (event.type === "unit:death" && eventUnit === owner && owner.consumedSnapshot) {
      releaseDianweiConsumedUnit(runtime, owner, level, effectId);
    }
    return;
  }
  if (effectId === "hero.zhaoyun.longdan" && event.type === "unit:upgrade" && eventUnit === owner) {
    applyPositiveStatus(owner, "unparalleled", {
      targetCount: 1,
      sourceEffectId: effectId,
      sourceName: owner.name,
    });
    recordBattlePresentationLog(
      runtime,
      "status",
      `${owner.name}获得无双。`,
      {
        ownerId: owner.id,
        ownerName: owner.name,
        ownerSide: owner.side,
        targetUnitId: owner.id,
        targetName: owner.name,
        targetSide: owner.side,
        statusId: "unparalleled",
        statusName: STATUS_LABELS.unparalleled,
        sourceEffectId: effectId,
      },
      {
        kind: "status",
        title: `${owner.name}获得无双`,
        effectId,
        effectName: owner.name,
        sourceIds: [owner.id],
        targetIds: [owner.id],
        cues: [{ unitId: owner.id, text: "无双", tone: "status" }],
        durationMs: 1450,
      },
    );
    applyBattleUnitStatBonus(runtime, owner, 2 * level, 2 * level, owner.name);
    return;
  }
  if (
    effectId === "hero.fazheng.yiyi-dailao" &&
    event.type === "battle:start"
  ) {
    const target = getNearestBattleUnit(runtime, owner, "behind");
    if (!target) return;
    grantBattleExperience(runtime, target, level, owner, effectId);
    applyPositiveStatus(target, "rest", {
      amount: 2 * level,
      sourceEffectId: effectId,
      sourceName: owner.name,
    });
    recordBattlePresentationLog(
      runtime,
      "status",
      `${owner.name}使${target.name}获得休整。`,
      {
        ownerId: owner.id,
        ownerName: owner.name,
        ownerSide: owner.side,
        targetUnitId: target.id,
        targetName: target.name,
        targetSide: target.side,
        statusId: "rest",
        statusName: STATUS_LABELS.rest,
        sourceEffectId: effectId,
      },
      {
        kind: "status",
        title: `${target.name}获得休整`,
        effectId,
        effectName: owner.name,
        sourceIds: [owner.id],
        targetIds: [target.id],
        cues: [{ unitId: target.id, text: "休整", tone: "status" }],
        durationMs: 1450,
      },
    );
    return;
  }
  if (effectId === "hero.sunce.jiangdong-bawang" && event.type === "battle:start") {
    const count = getLivingBattleUnits(runtime, owner.side).filter(
      (unit) => unit !== owner && shareBattleBond(owner, unit),
    ).length;
    applyBattleUnitStatBonus(runtime, owner, count * level, count * 2 * level, owner.name);
    return;
  }
  if (effectId === "hero.lvmeng.baiyi-dujiang" && event.type === "attack:before" && ownerAttacked) {
    getBattleUnitsFromFront(runtime, enemySide)
      .slice(0, level)
      .forEach((unit) => {
        applySkillDisable(runtime, unit, {
          ownerSide: owner.side,
          sourceEffectId: effectId,
          sourceName: owner.name,
          untilExchange: runtime.currentExchange,
        });
      });
    return;
  }
  if (effectId === "hero.gongsunzan.baima-yicong" && event.type === "unit:death" && eventUnit === owner) {
    const summon = createWhiteHorseSummon(runtime, owner);
    summonUnitInFrontOfDeadOwner(runtime, owner, summon, effectId, owner.name);
    return;
  }
  if (effectId === "hero.zhanghe.qiaobian" && event.type === "unit:death" && eventUnit === owner) {
    summonZhangHeHero(runtime, owner, effectId);
    return;
  }
  if (effectId === "hero.jiaxu.fanjian" && event.type === "battle:start") {
    pickBattleRandomUnits(runtime, getLivingBattleUnits(runtime, enemySide), level).forEach(
      (target) =>
        applyNegativeStatus(runtime, target, "counterplot", {
          ownerSide: owner.side,
          summonFaction: owner.faction,
          sourceEffectId: effectId,
          sourceName: owner.name,
        }),
    );
    return;
  }
  if (effectId === "hero.guojia.yiji-pingliao" && event.type === "unit:death" && eventUnit === owner) {
    getLivingBattleUnits(runtime, owner.side)
      .filter((unit) => unit !== owner && shareBattleBond(owner, unit))
      .forEach((unit) =>
        applyBattleUnitStatBonus(runtime, unit, 2 * level, 2 * level, owner.name),
      );
    return;
  }
  if (effectId === "hero.zhangliao.weizhen-xiaoyao" && event.type === "battle:start") {
    getLivingBattleUnits(runtime, enemySide)
      .forEach((target) => {
        const healthBefore = target.health;
        const retainedRatio = 1 - 0.2 * level;
        target.health = Math.floor(target.health * retainedRatio);
        const reductionPercent = 20 * level;
        recordBattlePresentationLog(
          runtime,
          "health",
          `${owner.name}使${target.name}当前生命降低 ${reductionPercent}%（${healthBefore} → ${target.health}）。`,
          {
            ownerId: owner.id,
            ownerName: owner.name,
            ownerSide: owner.side,
            targetUnitId: target.id,
            targetName: target.name,
            targetSide: target.side,
            healthBefore,
            healthAfter: target.health,
            healthDelta: target.health - healthBefore,
            sourceEffectId: effectId,
          },
          {
            kind: "health",
            title: `${target.name}当前生命降低 ${reductionPercent}%`,
            effectId,
            effectName: owner.name,
            sourceIds: [owner.id],
            targetIds: [target.id],
            cues: [
              {
                unitId: target.id,
                text: `生命 ${target.health - healthBefore}`,
                tone: "debuff",
              },
            ],
            durationMs: 1450,
          },
        );
      });
    resolveAllBattleDeaths(runtime, runtime.currentExchange);
    return;
  }
  if (effectId === "hero.machao.pozhen" && event.type === "attack:before" && ownerAttacked) {
    if (!owner.machaoFirstAttackUsed) {
      owner.machaoFirstAttackUsed = true;
      owner.nextBasicAttackDamageMultiplier = 1 + level;
    }
    return;
  }
  if (effectId === "hero.pangtong.tiesuo-lianhuan" && event.type === "battle:start") {
    pickBattleRandomUnits(runtime, getLivingBattleUnits(runtime, enemySide), 2 * level).forEach(
      (target) =>
        applyNegativeStatus(runtime, target, "chain", {
          ownerSide: owner.side,
          sourceEffectId: effectId,
          sourceName: owner.name,
        }),
    );
    return;
  }
  if (effectId === "hero.luxun.huoshao-lianying" && event.type === "attack:after" && ownerAttacked) {
    getLivingBattleUnits(runtime, enemySide)
      .filter((target) => hasNegativeStatus(target, "burn"))
      .forEach((target) => {
        dealBattleDamage(runtime, {
          source: owner,
          target,
          amount: Math.max(1, Math.floor(owner.attack * 0.2 * level)),
          type: "skill",
          sourceEffectId: effectId,
        });
      });
    return;
  }
  if (effectId === "hero.ganning.baiqi-jieying" && event.type === "battle:start") {
    for (let application = 0; application < 2 * level; application += 1) {
      const target = getBattleUnitsFromFront(runtime, enemySide).at(-1);
      if (!target) break;
      applyNegativeStatus(runtime, target, "burn", {
        ownerSide: owner.side,
        sourceEffectId: effectId,
        sourceName: owner.name,
      });
    }
    return;
  }
  if (
    effectId === "hero.yuanshu.yuxi" &&
    event.type === "unit:summon" &&
    eventUnit === owner &&
    !event.payload.revived
  ) {
    if (!owner.equipment) {
      owner.equipment = createBattleGeneratedEquipment(
        runtime,
        "equipment.imperial-jade-seal",
      );
      recordBattlePresentationLog(
        runtime,
        "equipment",
        `${owner.name}被召唤并佩戴传国玉玺。`,
        {
          ownerId: owner.id,
          ownerName: owner.name,
          ownerSide: owner.side,
          sourceEffectId: effectId,
        },
        {
          kind: "equipment",
          title: `${owner.name}佩戴传国玉玺`,
          effectId,
          effectName: owner.name,
          sourceIds: [owner.id],
          targetIds: [owner.id],
          cues: [{ unitId: owner.id, text: "传国玉玺", tone: "equipment" }],
          durationMs: 1450,
        },
      );
    }
    return;
  }
  if (
    effectId === "hero.huatuo.jijiu" &&
    event.type === "unit:death" &&
    eventUnit?.side === owner.side &&
    eventUnit !== owner &&
    !event.payload.consumed &&
    (Array.isArray(event.payload.nearestAheadOwnerIds)
      ? event.payload.nearestAheadOwnerIds.includes(owner.id)
      : getNearestBattlePositionUnit(runtime, owner, "ahead") === eventUnit) &&
    !event.payload.revived &&
    (owner.huatuoRevivesUsedThisRound ?? 0) < level
  ) {
    const revived = cloneBattleIdentityForSummon(
      runtime,
      eventUnit,
      owner.side,
      3,
      3,
      2,
      eventUnit,
      { preserveSourceBonds: true },
    );
    if (
      !insertBattleUnitInFrontOfTarget(
        runtime,
        eventUnit,
        revived,
        event.payload.deathPosition ?? eventUnit.deathPosition,
      )
    ) {
      recordBattleSummonFailure(runtime, owner.side, owner.name, effectId);
      return;
    }
    event.payload.revived = true;
    owner.huatuoRevivesUsedThisRound = (owner.huatuoRevivesUsedThisRound ?? 0) + 1;
    recordBattlePresentationLog(
      runtime,
      "summon",
      `${owner.name}复活${eventUnit.name}，以 LV${revived.level} ${revived.attack}/${revived.health}回到战场。`,
      {
        ownerId: owner.id,
        ownerName: owner.name,
        ownerSide: owner.side,
        unitId: revived.id,
        unitName: revived.name,
        unitSide: revived.side,
        sourceEffectId: effectId,
        revived: true,
      },
      {
        kind: "summon",
        title: `${eventUnit.name}被复活`,
        effectId,
        effectName: owner.name,
        sourceIds: [owner.id],
        targetIds: [revived.id],
        cues: [{ unitId: revived.id, text: "复活", tone: "buff" }],
        durationMs: 1650,
      },
    );
    dispatchBattleEvent(runtime, "unit:revive", { unit: revived, source: owner });
    dispatchBattleEvent(runtime, "unit:summon", {
      unit: revived,
      side: owner.side,
      source: owner,
      sourceEffectId: effectId,
      revived: true,
    });
    return;
  }
  if (
    effectId === "hero.caocao.jianxiong" &&
    event.type === "unit:death" &&
    eventUnit?.side === owner.side &&
    eventUnit !== owner &&
    shareBattleBond(owner, eventUnit)
  ) {
    const target = pickBattleRandomUnits(
      runtime,
      getLivingBattleUnits(runtime, owner.side).filter(
        (unit) => unit !== owner && unit !== eventUnit,
      ),
      1,
    )[0];
    if (target) {
      const statGain = 4 * level;
      applyBattleUnitStatBonus(runtime, target, statGain, statGain, owner.name);
      recordHeroBattleSkill(
        runtime,
        owner,
        `${target.name}获得 +${statGain}/+${statGain}`,
        effectId,
        {
          targetUnitId: target.id,
          targetUnitName: target.name,
          attackGain: statGain,
          healthGain: statGain,
        },
      );
    }
    return;
  }
  if (effectId === "hero.xunyu.wangzuo-zhicai" && event.type === "unit:summon" && sharedEventUnit && eventUnit !== owner) {
    applyBattleUnitStatBonus(runtime, eventUnit, 4 * level, 4 * level, owner.name);
    return;
  }
  if (
    effectId === "hero.liubei.renze" &&
    event.type === "unit:summon" &&
    sharedEventUnit &&
    eventUnit !== owner &&
    !event.payload.revived
  ) {
    grantBattleExperience(runtime, eventUnit, level, owner, effectId);
    return;
  }
  if (effectId === "hero.zhugeliang.yunchou" && event.type === "attack:after") {
    const friendlyAttacked = event.payload.attackers?.some(
      (attacker) => attacker.side === owner.side && attacker !== owner,
    );
    if (!friendlyAttacked) return;
    const target = pickBattleRandomUnits(runtime, getLivingBattleUnits(runtime, enemySide), 1)[0];
    if (target) {
      dealBattleDamage(runtime, {
        source: owner,
        target,
        amount: 4 * level,
        type: "skill",
        sourceEffectId: effectId,
      });
    }
    return;
  }
  if (effectId === "hero.guanyu.weizhen-huaxia" && event.type === "attack:after" && ownerAttacked) {
    getBattleUnitsFromFront(runtime, enemySide)
      .slice(0, level)
      .forEach((target) =>
        applyNegativeStatus(runtime, target, "intimidated", {
          ownerSide: owner.side,
          sourceEffectId: effectId,
          sourceName: owner.name,
        }),
      );
    return;
  }
  if (
    effectId === "hero.zhouyu.fengzhu-huoshi" &&
    event.type === "damage:before"
  ) {
    const damage = event.payload.damage;
    let amount = 0;
    if (
      damage.target?.side === enemySide &&
      ["status.burn-tick", "status.burn-ignite"].includes(damage.sourceEffectId)
    ) {
      amount = damage.originalAmount * level;
    } else if (
      damage.target?.side === enemySide &&
      damage.target.statuses?.["broken-morale"] &&
      ["attack", "skill"].includes(damage.type)
    ) {
      amount = 5 * level;
    } else if (
      damage.source?.side === enemySide &&
      damage.source.statuses?.fear &&
      damage.type === "attack"
    ) {
      amount = -Math.min(damage.amount, 3 * level);
    }
    if (amount === 0) return;
    damage.amount += amount;
    damage.modifiers.push({
      effectId,
      sourceName: owner.name,
      amount,
    });
    return;
  }
  if (effectId === "hero.zhangjiao.wulei-hongding" && event.type === "battle:start") {
    for (let hit = 0; hit < 5; hit += 1) {
      const target = pickBattleRandomUnits(runtime, getLivingBattleUnits(runtime, enemySide), 1)[0];
      if (!target) break;
      dealBattleDamage(runtime, {
        source: owner,
        target,
        amount: Math.max(1, Math.floor(owner.attack * 0.1 * level)),
        sourceEffectId: effectId,
      });
    }
    return;
  }
  if (effectId === "hero.lvbu.tianxia-wushuang" && event.type === "attack:before" && ownerAttacked) {
    applyPositiveStatus(owner, "unparalleled", {
      targetCount: level,
      sourceEffectId: effectId,
      sourceName: owner.name,
    });
    recordBattlePresentationLog(
      runtime,
      "status",
      `${owner.name}获得无双。`,
      {
        ownerId: owner.id,
        ownerName: owner.name,
        ownerSide: owner.side,
        targetUnitId: owner.id,
        targetName: owner.name,
        targetSide: owner.side,
        statusId: "unparalleled",
        statusName: STATUS_LABELS.unparalleled,
        sourceEffectId: effectId,
      },
      {
        kind: "status",
        title: `${owner.name}获得无双`,
        effectId,
        effectName: owner.name,
        sourceIds: [owner.id],
        targetIds: [owner.id],
        cues: [{ unitId: owner.id, text: "无双", tone: "status" }],
        durationMs: 1450,
      },
    );
  }
}

function applyBattleOperation(runtime, candidate, event, operation) {
  const damage = event.payload.damage;
  if (operation.type === "resolve-hero-skill" && candidate.owner) {
    resolveBattleHeroSkill(runtime, candidate, event);
    return;
  }
  if (operation.type === "resolve-rest-recovery") {
    resolveRestRecovery(runtime, event);
    return;
  }
  if (operation.type === "resolve-broken-morale-damage") {
    resolveBrokenMoraleDamage(runtime, event);
    return;
  }
  if (operation.type === "resolve-fear-damage") {
    resolveFearDamage(runtime, event);
    return;
  }
  if (operation.type === "resolve-intimidated-damage") {
    resolveIntimidatedDamage(runtime, event);
    return;
  }
  if (operation.type === "resolve-unparalleled-cleave") {
    resolveUnparalleledCleave(runtime, event);
    return;
  }
  if (operation.type === "resolve-counterplot-revive") {
    resolveCounterplotRevive(runtime, event);
    return;
  }
  if (operation.type === "announce-equipment-ready" && candidate.owner) {
    recordBattlePresentationLog(
      runtime,
      "equipment",
      `${candidate.owner.name}的${candidate.sourceName}生效：相同触发条件下，其武将技能优先结算；东吴业火仍先行结算。`,
      {
        ownerId: candidate.owner.id,
        ownerName: candidate.owner.name,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
      },
      {
        kind: "equipment",
        title: `${candidate.owner.name}的${candidate.sourceName}生效`,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        sourceIds: [candidate.owner.id],
        targetIds: [candidate.owner.id],
        cues: [
          {
            unitId: candidate.owner.id,
            text: candidate.sourceName,
            tone: "equipment",
          },
        ],
        durationMs: 1250,
      },
    );
    return;
  }

  if (operation.type === "summon-cavalry" && candidate.owner) {
    summonCavalry(runtime, candidate.owner.side, operation.count ?? 1, {
      attack: operation.attack ?? 1,
      health: operation.health ?? 1,
      sourceEffectId: candidate.effectId,
      sourceName: candidate.sourceName,
      summoner: candidate.owner,
      position: operation.position ?? "tail",
    });
    return;
  }

  if (operation.type === "apply-random-negative-status" && candidate.owner) {
    const enemySide = getOpposingSide(candidate.owner.side);
    const target = getBattleUnitsFromFront(runtime, enemySide)[0] ?? null;
    if (!target || target.health <= 0 || NEGATIVE_STATUS_POOL.length === 0) return;
    const statusId =
      NEGATIVE_STATUS_POOL[Math.floor(runtime.random() * NEGATIVE_STATUS_POOL.length)];
    applyNegativeStatus(runtime, target, statusId, {
      ownerSide: candidate.owner.side,
      summonFaction: candidate.owner.faction,
      sourceEffectId: candidate.effectId,
      sourceName: candidate.sourceName,
    });
    return;
  }

  if (operation.type === "buff-allied-summon" && candidate.owner) {
    const summonedUnit = event.payload.unit ?? null;
    if (!summonedUnit || summonedUnit.health <= 0) return;
    const entry = recordBattleLog(
      runtime,
      "equipment",
      `${candidate.owner.name}的${candidate.sourceName}触发（${getEventDisplayName(event.type)}）。`,
      {
        effectId: candidate.effectId,
        ownerId: candidate.owner.id,
        unitId: summonedUnit.id,
      },
    );
    recordBattlePresentationStep(runtime, {
      kind: "equipment",
      title: `${candidate.owner.name} · ${candidate.sourceName}`,
      entries: [entry],
      eventType: event.type,
      effectId: candidate.effectId,
      effectName: candidate.sourceName,
      sourceIds: [candidate.owner.id],
      targetIds: [summonedUnit.id],
      cues: [
        {
          unitId: candidate.owner.id,
          text: `【${candidate.sourceName}】`,
          tone: "skill",
        },
      ],
      durationMs: 1250,
    });
    applyBattleUnitStatBonus(
      runtime,
      summonedUnit,
      operation.attack ?? 0,
      operation.health ?? 0,
      candidate.sourceName,
    );
    return;
  }

  if (operation.type === "tiger-tally-opening" && candidate.owner) {
    applyBattleUnitStatBonus(
      runtime,
      candidate.owner,
      operation.attack ?? 0,
      operation.health ?? 0,
      candidate.sourceName,
    );
    grantBattleExperience(
      runtime,
      candidate.owner,
      operation.experience ?? 0,
      candidate.owner,
      candidate.effectId,
    );
    recordBattlePresentationLog(
      runtime,
      "equipment",
      `${candidate.owner.name}的${candidate.sourceName}使其 +${operation.attack ?? 0}/+${operation.health ?? 0}并获得${operation.experience ?? 0}经验。`,
      { effectId: candidate.effectId, ownerId: candidate.owner.id },
      {
        kind: "equipment",
        title: `${candidate.sourceName}战斗开始`,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        sourceIds: [candidate.owner.id],
        targetIds: [candidate.owner.id],
        cues: [{ unitId: candidate.owner.id, text: `+${operation.attack ?? 0}/+${operation.health ?? 0} · 经验+${operation.experience ?? 0}`, tone: "buff" }],
        durationMs: 1450,
      },
    );
    return;
  }

  if (operation.type === "cleanse-negative-and-grow" && candidate.owner) {
    const statusId = getNegativeStatusId(candidate.owner);
    if (!statusId) return;
    replaceNegativeStatus(candidate.owner, null, null);
    applyBattleUnitStatBonus(
      runtime,
      candidate.owner,
      operation.attack ?? 0,
      operation.health ?? 0,
      candidate.sourceName,
    );
    recordBattlePresentationLog(
      runtime,
      "equipment",
      `${candidate.owner.name}的${candidate.sourceName}清除${STATUS_LABELS[statusId] ?? statusId}并使其 +${operation.attack ?? 0}/+${operation.health ?? 0}。`,
      { effectId: candidate.effectId, ownerId: candidate.owner.id, statusId },
      {
        kind: "equipment",
        title: `${candidate.sourceName}清除负面状态`,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        sourceIds: [candidate.owner.id],
        targetIds: [candidate.owner.id],
        cues: [{ unitId: candidate.owner.id, text: `清除${STATUS_LABELS[statusId] ?? statusId} · +2/+2`, tone: "buff" }],
        durationMs: 1450,
      },
    );
    return;
  }

  if (operation.type === "revive-without-equipment" && candidate.owner) {
    const owner = candidate.owner;
    const revived = cloneBattleIdentityForSummon(
      runtime,
      owner,
      owner.side,
      operation.attack ?? 5,
      operation.health ?? 5,
      owner.level ?? 1,
      owner,
      { preserveSourceBonds: true },
    );
    if (
      !insertBattleUnitInFrontOfTarget(
        runtime,
        owner,
        revived,
        event.payload.deathPosition ?? owner.deathPosition,
      )
    ) {
      recordBattleSummonFailure(runtime, owner.side, candidate.sourceName, candidate.effectId);
      return;
    }
    event.payload.revived = true;
    recordBattlePresentationLog(
      runtime,
      "summon",
      `${owner.name}的${candidate.sourceName}使其以 LV${revived.level} 5/5复活；复活后无装备和状态。`,
      { effectId: candidate.effectId, ownerId: owner.id, unitId: revived.id, revived: true },
      {
        kind: "summon",
        title: `${owner.name}被${candidate.sourceName}复活`,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        sourceIds: [owner.id],
        targetIds: [revived.id],
        cues: [{ unitId: revived.id, text: "5/5复活", tone: "buff" }],
        durationMs: 1650,
      },
    );
    dispatchBattleEvent(runtime, "unit:revive", { unit: revived, source: owner });
    dispatchBattleEvent(runtime, "unit:summon", {
      unit: revived,
      side: owner.side,
      source: owner,
      sourceEffectId: candidate.effectId,
      revived: true,
    });
    return;
  }

  if (operation.type === "fangtian-attack-modifier" && damage && candidate.owner) {
    const amount = Math.floor(Math.max(0, candidate.owner.attack) * (operation.ratio ?? 0));
    if (amount <= 0) return;
    const modifier = damage.source === candidate.owner ? amount : -Math.min(amount, damage.amount);
    damage.amount = Math.max(0, damage.amount + modifier);
    damage.modifiers.push({
      effectId: candidate.effectId,
      sourceName: candidate.sourceName,
      amount: modifier,
    });
    recordBattlePresentationLog(
      runtime,
      "equipment",
      `${candidate.owner.name}的${candidate.sourceName}使本次攻击伤害${modifier > 0 ? ` +${modifier}` : ` -${Math.abs(modifier)}`}。`,
      { effectId: candidate.effectId, ownerId: candidate.owner.id, damageChange: modifier },
      {
        kind: "equipment",
        title: `${candidate.sourceName}修正同时攻击伤害`,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        sourceIds: [candidate.owner.id],
        targetIds: [damage.target?.id],
        cues: [{ unitId: modifier > 0 ? damage.target?.id : candidate.owner.id, text: `伤害${modifier > 0 ? "+" : ""}${modifier}`, tone: "equipment" }],
        durationMs: 1250,
      },
    );
    return;
  }

  if (operation.type === "add-attack-ratio-damage" && damage && candidate.owner) {
    const amount = Math.floor(Math.max(0, candidate.owner.attack) * (operation.ratio ?? 0));
    if (amount <= 0) return;
    damage.amount += amount;
    damage.modifiers.push({
      effectId: candidate.effectId,
      sourceName: candidate.sourceName,
      amount,
    });
    recordBattlePresentationLog(
      runtime,
      "equipment",
      `${candidate.owner.name}的${candidate.sourceName}使本次技能伤害 +${amount}。`,
      { effectId: candidate.effectId, ownerId: candidate.owner.id, damageChange: amount },
      {
        kind: "equipment",
        title: `${candidate.sourceName}附加技能伤害`,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        sourceIds: [candidate.owner.id],
        targetIds: [damage.target?.id],
        cues: [{ unitId: damage.target?.id, text: `技能伤害 +${amount}`, tone: "equipment" }],
        durationMs: 1250,
      },
    );
    return;
  }

  if (operation.type === "grow-when-hurt-or-debuffed" && candidate.owner) {
    const triggerName = event.type === "status:apply" ? "获得负面状态" : "受到伤害";
    applyBattleUnitStatBonus(
      runtime,
      candidate.owner,
      operation.attack ?? 0,
      operation.health ?? 0,
      candidate.sourceName,
    );
    recordBattleLog(
      runtime,
      "equipment",
      `${candidate.owner.name}${triggerName}，${candidate.sourceName}使其 +${
        operation.attack ?? 0
      }/+${operation.health ?? 0}，当前 ${candidate.owner.attack}/${
        candidate.owner.health
      }。`,
      {
        ownerId: candidate.owner.id,
        ownerName: candidate.owner.name,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        trigger: event.type,
      },
    );
    return;
  }

  if (
    operation.type === "resolve-imperial-jade-seal-death" &&
    candidate.owner?.side === "player"
  ) {
    const count = applyImperialJadeSealShopBonus(
      candidate.owner,
      getBattleUnitBonds(candidate.owner),
    );
    if (count > 0) {
      recordBattlePresentationLog(
        runtime,
        "equipment",
        `我方 ${candidate.owner.name}的${candidate.sourceName}结算${count}次，使商店中其羁绊武将永久 +${count}/+${count}。`,
        {
          ownerId: candidate.owner.id,
          ownerName: candidate.owner.name,
          effectId: candidate.effectId,
          effectName: candidate.sourceName,
          triggerCount: count,
        },
        {
          kind: "equipment",
          title: `${candidate.sourceName}强化商店武将`,
          description: `同羁绊商店武将永久 +${count}/+${count}`,
          effectId: candidate.effectId,
          effectName: candidate.sourceName,
          sourceIds: [candidate.owner.id],
          targetIds: [candidate.owner.id],
          cues: [
            {
              unitId: candidate.owner.id,
              text: `商店同羁绊 +${count}/+${count}`,
              tone: "equipment",
            },
          ],
          durationMs: 1550,
        },
      );
    }
    return;
  }

  if (operation.type === "block-damage-with-charges" && damage && candidate.owner) {
    const equipmentState = getEquipmentRuntimeState(
      candidate.owner,
      operation.charges ?? 0,
    );
    if (!equipmentState || equipmentState.remainingCharges <= 0 || damage.amount <= 0) return;
    const blocked = Math.min(operation.amount ?? 0, damage.amount);
    if (blocked <= 0) return;
    damage.amount -= blocked;
    const chargeUse = consumeEquipmentRuntimeCharge(
      candidate.owner,
      operation.charges ?? 0,
    );
    if (!chargeUse) return;
    const chargeLabel = chargeUse.exhausted
      ? "次数耗尽，装备已移除"
      : `剩余 ${chargeUse.remainingCharges} 次`;
    damage.modifiers.push({
      effectId: candidate.effectId,
      sourceName: candidate.sourceName,
      amount: -blocked,
    });
    recordBattlePresentationLog(
      runtime,
      "equipment",
      `${candidate.owner.name}的${candidate.sourceName}抵挡 ${blocked} 点伤害，${chargeLabel}。`,
      {
        ownerId: candidate.owner.id,
        ownerName: candidate.owner.name,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        blocked,
        remainingCharges: chargeUse.remainingCharges,
        equipmentRemoved: chargeUse.exhausted,
      },
      {
        kind: "equipment",
        title: `${candidate.sourceName}抵挡 ${blocked} 点伤害`,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        sourceIds: [candidate.owner.id],
        targetIds: [candidate.owner.id],
        cues: [
          {
            unitId: candidate.owner.id,
            text: `抵挡 ${blocked} · ${
              chargeUse.exhausted
                ? "装备移除"
                : `剩${chargeUse.remainingCharges}次`
            }`,
            tone: "equipment",
          },
        ],
        durationMs: 1350,
      },
    );
    return;
  }

  if (operation.type === "increase-damage-with-charges" && damage && candidate.owner) {
    const equipmentState = getEquipmentRuntimeState(
      candidate.owner,
      operation.charges ?? 0,
    );
    if (!equipmentState || equipmentState.remainingCharges <= 0) return;
    const increase = operation.amount ?? 0;
    damage.amount += increase;
    const chargeUse = consumeEquipmentRuntimeCharge(
      candidate.owner,
      operation.charges ?? 0,
    );
    if (!chargeUse) return;
    const chargeLabel = chargeUse.exhausted
      ? "次数耗尽，装备已移除"
      : `剩余 ${chargeUse.remainingCharges} 次`;
    damage.modifiers.push({
      effectId: candidate.effectId,
      sourceName: candidate.sourceName,
      amount: increase,
    });
    recordBattlePresentationLog(
      runtime,
      "equipment",
      `${candidate.owner.name}的${candidate.sourceName}使本次攻击伤害 +${increase}，${chargeLabel}。`,
      {
        ownerId: candidate.owner.id,
        ownerName: candidate.owner.name,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        increase,
        remainingCharges: chargeUse.remainingCharges,
        equipmentRemoved: chargeUse.exhausted,
      },
      {
        kind: "equipment",
        title: `${candidate.sourceName}使伤害 +${increase}`,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        sourceIds: [candidate.owner.id],
        targetIds: [candidate.owner.id],
        cues: [
          {
            unitId: candidate.owner.id,
            text: `伤害 +${increase} · ${
              chargeUse.exhausted
                ? "装备移除"
                : `剩${chargeUse.remainingCharges}次`
            }`,
            tone: "equipment",
          },
        ],
        durationMs: 1350,
      },
    );
    return;
  }

  if (operation.type === "resolve-wei-death") {
    resolveWeiBondDeath(runtime, candidate, event);
    return;
  }

  if (operation.type === "resolve-shu-upgrade") {
    resolveShuBattleUpgrade(runtime, candidate, event);
    return;
  }

  if (operation.type === "apply-wu-opening-burn") {
    resolveWuOpeningBurn(runtime, candidate, event);
    return;
  }

  if (operation.type === "resolve-burn-tick") {
    resolveBurnTick(runtime, event);
    return;
  }

  if (operation.type === "modify-battle-unit-stats" && candidate.owner) {
    const levelMultiplier = operation.scaleWithOwnerLevel
      ? getHeroSkillLevel(candidate.owner)
      : 1;
    const attackGain = (operation.attack ?? 0) * levelMultiplier;
    const healthGain = (operation.health ?? 0) * levelMultiplier;
    applyBattleUnitStatBonus(
      runtime,
      candidate.owner,
      attackGain,
      healthGain,
      candidate.sourceName,
    );
    recordBattleLog(
      runtime,
      "effect",
      `${candidate.owner.name}在攻击前获得 +${attackGain}/+${healthGain}，当前 ${
        candidate.owner.attack
      }/${candidate.owner.health}。`,
      { effectId: candidate.effectId, ownerId: candidate.owner.id },
    );
    return;
  }

  if (operation.type === "modify-damage" && damage) {
    const before = damage.amount;
    damage.amount = Math.max(operation.minimum ?? 0, damage.amount + (operation.amount ?? 0));
    const appliedAmount = damage.amount - before;
    damage.modifiers.push({
      effectId: candidate.effectId,
      sourceName: candidate.sourceName,
      amount: appliedAmount,
    });
    if (appliedAmount !== 0) {
      recordBattlePresentationLog(
        runtime,
        "equipment",
        `${candidate.owner?.name ?? damage.target.name}的${candidate.sourceName}使本次伤害${
          appliedAmount > 0 ? `增加 ${appliedAmount}` : `减少 ${Math.abs(appliedAmount)}`
        }。`,
        {
          ownerId: candidate.owner?.id ?? null,
          ownerName: candidate.owner?.name ?? null,
          effectId: candidate.effectId,
          effectName: candidate.sourceName,
          damageChange: appliedAmount,
        },
        {
          kind: "equipment",
          title: `${candidate.sourceName}修正伤害`,
          effectId: candidate.effectId,
          effectName: candidate.sourceName,
          sourceIds: [candidate.owner?.id],
          targetIds: [damage.target?.id],
          cues: [
            {
              unitId: damage.target?.id,
              text: `伤害${appliedAmount > 0 ? "+" : ""}${appliedAmount}`,
              tone: "equipment",
            },
          ],
          durationMs: 1250,
        },
      );
    }
    return;
  }

}

function resolveEffectCandidate(runtime, candidate, event) {
  candidate.resolved = true;
  const stepCount = (runtime.chainSteps.get(event.chainId) ?? 0) + 1;
  runtime.chainSteps.set(event.chainId, stepCount);
  if (stepCount > MAX_EFFECT_CHAIN_STEPS) {
    runtime.abortedChains.add(event.chainId);
    runtime.queue = runtime.queue.filter((queued) => queued.chainId !== event.chainId);
    recordBattleLog(
      runtime,
      "error",
      `事件链 ${event.chainId} 超过 ${MAX_EFFECT_CHAIN_STEPS} 步，已停止后续结算。`,
      { eventId: event.id, chainId: event.chainId },
    );
    return;
  }
  candidate.resolvedAttack = candidate.owner?.attack ?? null;
  const previousCandidate = runtime.currentCandidate;
  runtime.currentCandidate = candidate;
  try {
    if (candidate.definition.sourceType === "hero" && candidate.owner) {
      const skillDescription = getHeroSkillDescriptionDisplay(
        candidate.effectId,
        candidate.owner,
      );
      const skillName = getHeroSkillName(candidate.effectId, candidate.owner);
      const entry = recordBattleLog(
        runtime,
        "hero-skill",
        `${candidate.owner.name}【${skillName}】触发（${getEventDisplayName(event.type)}）${
          skillDescription.text ? `：${skillDescription.text}` : ""
        }。`,
        {
          ownerId: candidate.owner.id,
          ownerName: candidate.owner.name,
          ownerSide: candidate.ownerSide,
          effectId: candidate.effectId,
          trigger: event.type,
          triggerName: getEventDisplayName(event.type),
          skillName,
          skillDescriptionHtml: skillDescription.html,
          resolvedAttack: candidate.resolvedAttack,
        },
      );
      recordBattlePresentationStep(runtime, {
        kind: "skill",
        title: `${candidate.owner.name} · ${skillName}`,
        description: `${getEventDisplayName(event.type)}，按当前 ${candidate.resolvedAttack} 攻击力结算`,
        entries: [entry],
        eventType: event.type,
        effectId: candidate.effectId,
        effectName: skillName,
        sourceIds: [candidate.owner.id],
        cues: [
          {
            unitId: candidate.owner.id,
            text: `【${skillName}】`,
            tone: "skill",
          },
        ],
        resolvedAttack: candidate.resolvedAttack,
        durationMs: 1450,
      });
    } else if (candidate.definition.sourceType === "bond") {
      const entry = recordBattleLog(
        runtime,
        "bond",
        `${candidate.sourceName}触发（${getEventDisplayName(event.type)}）。`,
        {
          effectId: candidate.effectId,
          effectName: candidate.sourceName,
          trigger: event.type,
          ownerSide: candidate.ownerSide,
        },
      );
      recordBattlePresentationStep(runtime, {
        kind: "bond",
        title: `${candidate.sourceName}触发`,
        entries: [entry],
        eventType: event.type,
        effectId: candidate.effectId,
        effectName: candidate.sourceName,
        durationMs: 1250,
      });
    }
    candidate.definition.operations.forEach((operation) => {
      applyBattleOperation(runtime, candidate, event, operation);
    });
    runtime.structuredLog.push({
      type: "effect",
      eventId: event.id,
      chainId: event.chainId,
      parentEventId: event.parentEventId,
      effectId: candidate.effectId,
      sourceName: candidate.sourceName,
      ownerId: candidate.owner?.id ?? null,
      ownerAttack: candidate.resolvedAttack,
      phase: runtime.phase,
      exchange: runtime.currentExchange,
    });
  } finally {
    runtime.currentCandidate = previousCandidate;
  }
}

function resolveBattleEvent(runtime, event) {
  const candidates = event.lockedCandidates ?? collectBattleEffectCandidates(runtime, event);
  while (!runtime.abortedChains.has(event.chainId)) {
    const candidate = chooseNextEffectCandidate(runtime, candidates, event);
    if (!candidate) break;
    resolveEffectCandidate(runtime, candidate, event);
  }
}

function resolveBattleDamage(runtime, { source, target, amount, type, sourceEffectId }) {
  const damage = {
    source,
    target,
    type,
    sourceEffectId,
    originalAmount: Math.max(0, amount),
    amount: Math.max(0, amount),
    finalAmount: 0,
    phase: runtime.phase,
    modifiers: [],
  };
  resolveImmediateBattleEvent(runtime, "damage:before", { damage });
  damage.finalAmount = Math.max(0, Math.floor(damage.amount));
  return damage;
}

function formatDamageModifiers(damage) {
  if (damage.modifiers.length === 0) return "";
  return `（${damage.modifiers
    .map((modifier) => `${modifier.sourceName}${modifier.amount >= 0 ? "+" : ""}${modifier.amount}`)
    .join("，")}）`;
}

function getBattleUnitSnapshot(unit) {
  return {
    id: unit.id,
    sourceId: unit.sourceId ?? null,
    name: unit.name,
    attack: unit.attack,
    health: unit.health,
    maxHealth: unit.maxHealth,
    faction: unit.faction,
    extraFactions: [...(unit.extraFactions ?? [])],
    tempExtraFactions: [...(unit.tempExtraFactions ?? [])],
    usesBondDefinitionSnapshot: true,
    tier: unit.tier,
    side: unit.side,
    skill: unit.skill ?? "",
    skillEffectIds: [...(unit.skillEffectIds ?? [])],
    equipment: cloneDirectModifier(unit.equipment),
    statuses: cloneDirectModifier(unit.statuses ?? {}),
    level: unit.level ?? 1,
    experience: unit.experience ?? 0,
    copies: getUnitCopies(unit),
    bonusExperience: unit.bonusExperience ?? 0,
    isSummon: Boolean(unit.isSummon),
    skillDisabled: Boolean(unit.skillDisabled),
    skillDisabledUntilExchange: unit.skillDisabledUntilExchange ?? null,
  };
}

function simulateBasicBattle({ preBattleEntries = [] } = {}) {
  const seed = getBattleSeed();
  const player = getLineupUnits().map((unit, index) =>
    cloneBattleUnit(unit, { side: "player", index }),
  );
  const enemySetup = createEnemyBattleSetup();
  const enemy = enemySetup.team;
  const lockedBonds = {
    player: getLockedPlayerBondEffectCounts(),
    enemy: enemySetup.lockedBonds,
  };
  return simulateBattleScenario({
    player,
    enemy,
    seed,
    lockedBonds,
    enemySource: enemySetup.source,
    preBattleEntries,
    battleRound: state.round,
  });
}

function simulateBattleScenario({
  player,
  enemy,
  seed,
  lockedBonds,
  enemySource = { type: "custom" },
  preBattleEntries = [],
  battleRound = state.round,
  maxExchanges = 100,
}) {
  const playerStart = player.map(getBattleUnitSnapshot);
  const enemyStart = enemy.map(getBattleUnitSnapshot);
  const roundSnapshots = [];
  const runtime = createBattleRuntime(player, enemy, { seed, lockedBonds });
  const preparationEntries = [];
  preparationEntries.push(recordBattleLog(
    runtime,
    "system",
    `技能结算底座已启动，战斗随机种子 ${seed}；魏、蜀、吴、群羁绊人数效果已在战前锁定。`,
    { seed },
  ));
  preparationEntries.push(recordBattleLog(
    runtime,
    "system",
    enemySource.type === "opponent-pool"
      ? `敌方从对手数据池抽取「${enemySource.label}」，使用其第 ${enemySource.round} 回合快照。`
      : enemySource.type === "cavalry-fallback"
        ? `对手数据池缺失或无效，敌方使用第 ${battleRound} 回合测试骑兵阵容。`
        : "敌方阵容已就位。",
    { enemySource },
  ));
  preBattleEntries.forEach((entry) => {
    preparationEntries.push(recordBattleLog(
      runtime,
      entry.type ?? "effect",
      entry.message,
      {
        sourceEffectId: entry.sourceEffectId ?? null,
        sourceName: entry.sourceName ?? "",
        ownerId: entry.ownerId ?? null,
        trigger: entry.trigger ?? "round:end",
        phase: "round:end",
      },
    ));
  });

  BOND_FACTIONS.forEach((faction) => {
    const effectCount = lockedBonds.player[faction] ?? 0;
    if (effectCount <= 0) return;
    preparationEntries.push(recordBattleLog(
      runtime,
      "bond",
      `${BOND_RULES[faction].label} ${effectCount}人效果已锁定，本场战斗不再变化。`,
      { faction, effectCount },
    ));
  });
  recordBattlePresentationStep(runtime, {
    kind: "ready",
    title: "双方阵容就位",
    description: "先锁定战斗副本与羁绊，再依次结算战斗开始技能",
    entries: preparationEntries,
    phase: "battle:start",
    durationMs: 1600,
  });

  dispatchBattleEvent(runtime, "battle:start", { player, enemy });
  dispatchBattleEvent(runtime, "battle:start:end", { player, enemy });
  recordBattlePresentationStep(runtime, {
    kind: "timing",
    title: "战斗开始技能结算完毕",
    description: "进入正常交锋",
    phase: "battle:start:end",
    eventType: "battle:start:end",
    durationMs: 900,
  });
  runtime.phase = "battle";

  if (player.length === 0) {
    const resultEntry = recordBattleLog(
      runtime,
      "result",
      "我方没有上阵武将，战斗失败。",
      { result: "loss" },
    );
    recordBattlePresentationStep(runtime, {
      kind: "result",
      title: "我方战斗失败",
      entries: [resultEntry],
      phase: "battle:end",
      durationMs: 2400,
    });
    return {
      result: "loss",
      playerStart,
      enemyStart,
      playerEnd: player.map(getBattleUnitSnapshot),
      enemyEnd: enemy.map(getBattleUnitSnapshot),
      roundSnapshots,
      log: runtime.log,
      structuredLog: runtime.structuredLog,
      presentationTimeline: runtime.presentationTimeline,
      seed,
      lockedBonds,
      enemySource,
      selectedExchange: 0,
    };
  }

  let exchange = 1;
  while (player.length > 0 && enemy.length > 0 && exchange <= maxExchanges) {
    runtime.currentExchange = exchange;
    clearExpiredTemporaryStatuses(runtime);
    roundSnapshots.push({
      exchange,
      player: player.map(getBattleUnitSnapshot),
      enemy: enemy.map(getBattleUnitSnapshot),
    });
    const ally = getBattleFrontUnit(player, "player");
    const foe = getBattleFrontUnit(enemy, "enemy");
    runtime.currentAttackers = [ally, foe];
    dispatchBattleEvent(runtime, "attack:before", { attackers: [ally, foe], exchange });
    if (!isBattleUnitActive(runtime, ally) || !isBattleUnitActive(runtime, foe)) {
      runtime.currentAttackers = null;
      exchange += 1;
      continue;
    }
    const allyHealthBefore = ally.health;
    const foeHealthBefore = foe.health;
    const allyAttackDamage = Math.max(
      1,
      ally.attack * (ally.nextBasicAttackDamageMultiplier ?? 1),
    );
    const foeAttackDamage = Math.max(
      1,
      foe.attack * (foe.nextBasicAttackDamageMultiplier ?? 1),
    );
    delete ally.nextBasicAttackDamageMultiplier;
    delete foe.nextBasicAttackDamageMultiplier;

    const damageToEnemy = resolveBattleDamage(runtime, {
      source: ally,
      target: foe,
      amount: allyAttackDamage,
      type: "attack",
      sourceEffectId: "system.basic-attack",
    });
    const damageToPlayer = resolveBattleDamage(runtime, {
      source: foe,
      target: ally,
      amount: foeAttackDamage,
      type: "attack",
      sourceEffectId: "system.basic-attack",
    });

    foe.health -= damageToEnemy.finalAmount;
    ally.health -= damageToPlayer.finalAmount;
    if (damageToEnemy.finalAmount > 0) {
      foe.lastDamageSource = ally;
      foe.lastDamageEffectId = "system.basic-attack";
    }
    if (damageToPlayer.finalAmount > 0) {
      ally.lastDamageSource = foe;
      ally.lastDamageEffectId = "system.basic-attack";
    }
    [ally, foe]
      .filter((unit) => unit.health <= 0)
      .forEach((unit) => runtime.deferredDeathIds.add(unit.id));
    const clashEntry = recordBattleLog(
      runtime,
      "exchange",
      `第${exchange}次交锋：${ally.name}造成${damageToEnemy.finalAmount}点伤害${formatDamageModifiers(
        damageToEnemy,
      )}，${foe.name}造成${damageToPlayer.finalAmount}点伤害${formatDamageModifiers(
        damageToPlayer,
      )}。`,
      {
        exchange,
        damageToEnemy,
        damageToPlayer,
        allyHealthBefore,
        foeHealthBefore,
        allyHealthAfter: ally.health,
        foeHealthAfter: foe.health,
      },
    );
    recordBattlePresentationStep(runtime, {
      kind: "clash",
      title: `第 ${exchange} 轮 · 双方同时攻击`,
      description: `${ally.name}与${foe.name}的普通攻击在同一步同时扣血`,
      entries: [clashEntry],
      phase: "battle",
      exchange,
      eventType: "basic-attack",
      effectId: "system.basic-attack",
      effectName: "普通交锋",
      sourceIds: [ally.id, foe.id],
      targetIds: [ally.id, foe.id],
      actorIds: [ally.id, foe.id],
      cues: [
        {
          unitId: ally.id,
          text: `-${damageToPlayer.finalAmount}`,
          tone: "damage",
          damageAmount: damageToPlayer.finalAmount,
          damageType: damageToPlayer.type,
        },
        {
          unitId: foe.id,
          text: `-${damageToEnemy.finalAmount}`,
          tone: "damage",
          damageAmount: damageToEnemy.finalAmount,
          damageType: damageToEnemy.type,
        },
      ],
      simultaneous: true,
      durationMs: 2200,
    });

    dispatchBattleEvent(runtime, "damage:after", { damage: damageToEnemy, exchange });
    dispatchBattleEvent(runtime, "damage:after", { damage: damageToPlayer, exchange });
    const attackAfterEvent = prepareBattleEvent(
      runtime,
      "attack:after",
      {
        attackers: [ally, foe],
        attackPairs: [
          { source: ally, target: foe, damage: damageToEnemy },
          { source: foe, target: ally, damage: damageToPlayer },
        ],
        exchange,
      },
      runtime.currentEvent,
      { lockHeroAvailability: true },
    );
    runtime.deferredDeathIds.clear();
    resolveAllBattleDeaths(runtime, exchange);
    dispatchPreparedBattleEvent(runtime, attackAfterEvent);
    runtime.currentAttackers = null;
    recordBattleLog(
      runtime,
      "round-summary",
      `第${exchange}次交锋结束：${ally.name} ${Math.max(0, ally.health)} 生命，${
        foe.name
      } ${Math.max(0, foe.health)} 生命。`,
      {
        exchange,
        ally: {
          id: ally.id,
          name: ally.name,
          healthBefore: allyHealthBefore,
          healthAfter: Math.max(0, ally.health),
          alive: ally.health > 0,
        },
        foe: {
          id: foe.id,
          name: foe.name,
          healthBefore: foeHealthBefore,
          healthAfter: Math.max(0, foe.health),
          alive: foe.health > 0,
        },
        damageToEnemy,
        damageToPlayer,
      },
    );
    exchange += 1;
  }

  runtime.currentExchange = null;
  clearExpiredTemporaryStatuses(runtime);
  runtime.phase = "battle:end";
  const result =
    player.length > 0 && enemy.length === 0
      ? "win"
      : enemy.length > 0 && player.length === 0
        ? "loss"
        : "draw";
  dispatchBattleEvent(runtime, "battle:end", { result });
  const resultEntry = recordBattleLog(
    runtime,
    "result",
    result === "win" ? "战斗胜利。" : result === "loss" ? "战斗失败。" : "战斗平局。",
    { result },
  );
  recordBattlePresentationStep(runtime, {
    kind: "result",
    title:
      result === "win"
        ? "我方取得胜利"
        : result === "loss"
          ? "我方战斗失败"
          : "本场战斗平局",
    entries: [resultEntry],
    phase: "battle:end",
    durationMs: 2400,
  });
  return {
    result,
    playerStart,
    enemyStart,
    playerEnd: player.map(getBattleUnitSnapshot),
    enemyEnd: enemy.map(getBattleUnitSnapshot),
    roundSnapshots,
    log: runtime.log,
    structuredLog: runtime.structuredLog,
    presentationTimeline: runtime.presentationTimeline,
    seed,
    lockedBonds,
    enemySource,
    selectedExchange: 0,
  };
}

function isRoundRewardBlockingShop({ notifyPlayer = false } = {}) {
  const blocked = Boolean(state.pendingRoundReward);
  if (blocked && notifyPlayer) {
    notify(`请先完成第${state.pendingRoundReward.round}回合奖励选择。`);
  }
  return blocked;
}

function queueRoundReward(round = state.round) {
  if (!ROUND_REWARD_ROUNDS.includes(round) || state.pendingRoundReward) return;
  const pool = (ROUND_REWARD_CARD_NAMES[round] ?? [])
    .map((name) => CARD_POOLS.stratagem.find((card) => card.name === name))
    .filter(Boolean);
  const candidates = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  if (candidates.length !== 3) {
    addLog(`第 ${round} 回合奖励卡池配置不完整。`);
    return;
  }
  state.pendingRoundReward = { round, candidates };
  state.roundRewardCollapsed = false;
  addLog(`第 ${round} 回合初始商店已生成；必须从3张奖励卡中选择1张。`);
}

function setRoundRewardCollapsed(collapsed) {
  if (!state.pendingRoundReward) return;
  state.roundRewardCollapsed = collapsed;
  render();
  window.requestAnimationFrame(() => {
    const focusTarget = collapsed
      ? elements.roundRewardExpandButton
      : elements.roundRewardOptions?.querySelector(".reward-option");
    focusTarget?.focus();
  });
}

function chooseRoundRewardCard(candidateIndex) {
  const pending = state.pendingRoundReward;
  const base = pending?.candidates?.[candidateIndex];
  if (!pending || !base) return;
  const card = createFreeShopItemFromBase(base);
  state.pendingRoundReward = null;
  state.roundRewardCollapsed = false;
  addCardsToSharedShop([card], `第 ${pending.round} 回合奖励`);
  addLog(`第 ${pending.round} 回合奖励选择：${card.name}。`);
  playAudioCue("rewardClaim");
  render();
}

function cancelCurrentChoice() {
  if (state.pendingHeroBondChoice?.cancelable) {
    state.pendingHeroBondChoice = null;
    playAudioCue("uiCancel");
    render();
    return;
  }
  if (state.pendingStratagemUse) playAudioCue("uiCancel");
  cancelStratagemChoice();
}

function endTurn() {
  if (state.phase !== "shop") return;
  if (isRoundRewardBlockingShop({ notifyPlayer: true })) return;
  if (state.pendingHeroBondChoice) {
    notify("请先完成司马徽的额外羁绊选择。");
    return;
  }
  playAudioCue("battleEnter");
  resolvingEndTurn = true;
  const effectEventStart = state.effectEvents.length;
  const previousBondCounts = getShopBondCountSnapshot();
  dispatchShopEvent("round:end", { round: state.round });
  dispatchShopBondCountChanges(previousBondCounts);
  pendingEndTurnReportEntries = state.effectEvents
    .slice(effectEventStart)
    .filter((entry) => entry.message)
    .map((entry) => ({
      ...entry,
      type: entry.sourceEffectId?.startsWith("bond.") ? "bond" : "hero-skill",
    }));
  recordCurrentPlayerLineup();
  state.phase = "end-turn";
  render();
}

function startNextRound() {
  if (state.gameOver) {
    resetDemo();
    return;
  }
  if (state.gameOutcome) {
    state.gameOver = true;
    render();
    return;
  }
  playAudioCue("nextRound");
  state.round += 1;
  state.phase = "shop";
  state.gold = TURN_GOLD;
  state.battle = null;
  getLineupUnits().forEach((unit) => {
    unit.huatuoRevivesUsedThisRound = 0;
  });
  const previousBondCounts = getShopBondCountSnapshot();
  clearTemporaryBonds();
  dispatchShopBondCountChanges(previousBondCounts);
  addLog(`第 ${state.round} 回合开始，获得 ${TURN_GOLD} 金币。`);
  if (state.round === ROUND_THREE_LIFE_RECOVERY_ROUND) {
    const previousLife = state.life;
    state.life = getLifeAfterRoundStart(state.life, state.round);
    const recoveredLife = state.life - previousLife;
    addLog(
      recoveredLife > 0
        ? `第 3 回合生命补给，生命 +${recoveredLife}（${state.life}/${PLAYER_MAX_LIFE}）。`
        : `第 3 回合生命补给触发，生命已达上限 ${PLAYER_MAX_LIFE}。`,
    );
  }
  dispatchShopEvent("round:start", { round: state.round });
  refreshShop({ free: true });
  if (ROUND_REWARD_ROUNDS.includes(state.round)) {
    queueRoundReward();
    render();
  }
}

function resetDemo() {
  playAudioCue("nextRound");
  closeCodex({ restoreFocus: false, silent: true });
  window.clearTimeout(shopPresentationTimer);
  shopPresentationTimer = 0;
  queuedShopSkillAnimations = [];
  queuedShopBonusAnimations = [];
  queuedShopUpgradeAnimations = [];
  shopPresentationSequence = 0;
  pendingEndTurnReportEntries = [];
  resolvingEndTurn = false;
  previousRenderedBondEffectCounts = null;
  queuedBondUpgradeCelebrations = [];
  clearBondUpgradeEffects();
  clearAllBondSelectionHints();
  state = createInitialState();
  refreshShop({ free: true });
}

function addLog(message) {
  if (state.playerDataTest) {
    state.playerDataTest.operations.push({
      sequence: state.playerDataTest.operations.length + 1,
      round: state.round,
      phase: state.phase,
      recordedAt: new Date().toISOString(),
      message,
    });
  }
  state.logs.unshift(message);
  state.logs = state.logs.slice(0, 12);
}

function notify(message) {
  playAudioCue("uiError");
  elements.toast.innerHTML = getEscapedGameTextMarkup(message);
  elements.toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 1800);
}

function getCardMetaText(card) {
  if (!card) return "空";
  if (card.type === "hero") {
    return `${card.tier} 阶 · ${card.attack}/${card.health} · ${card.cost} 金币`;
  }
  return `${card.cost} 金币`;
}

function getUnitMetaText(unit) {
  return `${unit.tier} 阶 · ${unit.level} 级 ${unit.experience ?? 0} 经验 · ${unit.attack}/${unit.health}`;
}

function isFivePersonBondUnlocked(faction, unlockedFactions = state?.unlockedFivePersonBonds) {
  return Array.isArray(unlockedFactions) && unlockedFactions.includes(faction);
}

function getBondEffectCount(count, faction, unlockedFactions = state?.unlockedFivePersonBonds) {
  if (count >= 5 && isFivePersonBondUnlocked(faction, unlockedFactions)) return 5;
  if (count >= 4) return 4;
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  return 0;
}

function getVisibleBondEffectTiers(faction, unlockedFactions = state?.unlockedFivePersonBonds) {
  return isFivePersonBondUnlocked(faction, unlockedFactions) ? [2, 3, 4, 5] : [2, 3, 4];
}

function getBondProgressMarkup(count, faction, unlockedFactions = state?.unlockedFivePersonBonds) {
  const currentCount = Math.max(0, Math.min(5, Math.floor(Number(count) || 0)));
  if (currentCount < 2) return `<strong>${currentCount}</strong>/2`;

  const fivePersonUnlocked = isFivePersonBondUnlocked(faction, unlockedFactions);
  const activeTier = getBondEffectCount(currentCount, faction, unlockedFactions);

  const visibleTiers = currentCount === 2
    ? [2, 3]
    : currentCount === 3
      ? [2, 3, 4]
      : !fivePersonUnlocked
        ? [2, 3, 4]
        : [2, 3, 4, 5];

  return visibleTiers
    .map((tier) => {
      return tier === activeTier ? `<strong>${tier}</strong>` : String(tier);
    })
    .join("/");
}

function getLineupUnits() {
  return state.lineup.filter(Boolean);
}

function clearTemporaryBonds() {
  Object.values(state.heroBondDefinitions ?? {}).forEach((definition) => {
    definition.tempExtraFactions = [];
  });
  state.lineup.forEach((unit) => {
    if (unit) unit.tempExtraFactions = [];
  });
  state.shop.forEach((card) => {
    if (card?.type !== "hero") return;
    card.tempExtraFactions = [];
    syncShopHeroCardBonuses(card);
  });
}

function normalizeBondTags(tags) {
  const unique = [];
  tags.forEach((faction) => {
    if (!BOND_RULES[faction] || unique.includes(faction)) return;
    if (unique.length < MAX_UNIT_BONDS) unique.push(faction);
  });
  return unique;
}

function getHeroBondDefinition(heroName) {
  const definition = state.heroBondDefinitions?.[heroName];
  return {
    extraFactions: [...(definition?.extraFactions ?? [])],
    tempExtraFactions: [...(definition?.tempExtraFactions ?? [])],
  };
}

function ensureHeroBondDefinition(heroName) {
  state.heroBondDefinitions ??= {};
  state.heroBondDefinitions[heroName] ??= {
    extraFactions: [],
    tempExtraFactions: [],
  };
  return state.heroBondDefinitions[heroName];
}

function getShopBondBonus(faction) {
  return state.shopBondBonuses?.[faction] ?? { attack: 0, health: 0 };
}

function addShopBondBonus(faction, attack, health) {
  state.shopBondBonuses ??= {};
  const current = getShopBondBonus(faction);
  const next = {
    attack: current.attack + Math.max(0, attack),
    health: current.health + Math.max(0, health),
  };
  state.shopBondBonuses[faction] = next;
  return next;
}

function getImperialJadeSealTriggerCount(unit) {
  const isYuanShu =
    unit?.name === "袁术" &&
    unit.skillEffectIds?.includes("hero.yuanshu.yuxi");
  return 1 + (isYuanShu ? Math.max(1, unit.level ?? 1) : 0);
}

function applyImperialJadeSealShopBonus(unit, bonds) {
  const factions = normalizeBondTags(bonds);
  if (factions.length === 0) return 0;
  const count = getImperialJadeSealTriggerCount(unit);
  factions.forEach((faction) => addShopBondBonus(faction, count, count));
  state.shop.forEach((card) => syncShopHeroCardBonuses(card));
  return count;
}

function getShopBondBonusTotals(card) {
  return getBaseUnitBonds(card).reduce(
    (total, faction) => {
      const bonus = getShopBondBonus(faction);
      total.attack += bonus.attack;
      total.health += bonus.health;
      return total;
    },
    { attack: 0, health: 0 },
  );
}

function syncShopHeroCardBonuses(card) {
  if (!card || card.type !== "hero") return false;
  const previousBodyAttackBonus = card.bodyAttackBonus ?? 0;
  const previousBodyHealthBonus = card.bodyHealthBonus ?? 0;
  card.baseAttack ??= card.attack - previousBodyAttackBonus;
  card.baseHealth ??= card.health - previousBodyHealthBonus;
  card.intrinsicBodyAttackBonus ??=
    previousBodyAttackBonus - (card.shopBondAttackBonus ?? 0);
  card.intrinsicBodyHealthBonus ??=
    previousBodyHealthBonus - (card.shopBondHealthBonus ?? 0);
  const shopBonus = getShopBondBonusTotals(card);
  card.shopBondAttackBonus = shopBonus.attack;
  card.shopBondHealthBonus = shopBonus.health;
  card.bodyAttackBonus = card.intrinsicBodyAttackBonus + shopBonus.attack;
  card.bodyHealthBonus = card.intrinsicBodyHealthBonus + shopBonus.health;
  card.attack = Math.min(50, card.baseAttack + card.bodyAttackBonus);
  card.health = Math.min(50, card.baseHealth + card.bodyHealthBonus);
  return true;
}

function syncHeroBondDefinitionInstances(heroName) {
  const definition = getHeroBondDefinition(heroName);
  state.lineup.forEach((unit) => {
    if (!unit || unit.name !== heroName) return;
    unit.extraFactions = [...definition.extraFactions];
    unit.tempExtraFactions = [...definition.tempExtraFactions];
  });
  state.shop.forEach((card) => {
    if (card?.type !== "hero" || card.name !== heroName) return;
    card.extraFactions = [...definition.extraFactions];
    card.tempExtraFactions = [...definition.tempExtraFactions];
    syncShopHeroCardBonuses(card);
  });
}

function getBaseUnitBonds(unit) {
  if (!unit) return [];
  const definition = unit.usesBondDefinitionSnapshot
    ? { extraFactions: [], tempExtraFactions: [] }
    : getHeroBondDefinition(unit.name);
  return normalizeBondTags([
    unit.faction,
    ...definition.extraFactions,
    ...definition.tempExtraFactions,
    ...(unit.extraFactions ?? []),
    ...(unit.tempExtraFactions ?? []),
  ]);
}

function getHighlightedBondFactions() {
  return new Set(Array.from(bondSelectionHintSources.values()).flat());
}

function applyBondSelectionHints() {
  const highlighted = getHighlightedBondFactions();
  elements.bondList?.querySelectorAll(".bond-card").forEach((card) => {
    const isHighlighted = highlighted.has(card.dataset.faction);
    card.classList.toggle("card-selection-hint", isHighlighted);
    card.setAttribute("aria-highlighted", isHighlighted ? "true" : "false");
  });
}

function setBondSelectionHintSource(source, factions) {
  const normalized = normalizeBondTags(factions ?? []);
  if (normalized.length > 0) {
    bondSelectionHintSources.set(source, normalized);
  } else {
    bondSelectionHintSources.delete(source);
  }
  applyBondSelectionHints();
}

function clearAllBondSelectionHints() {
  bondSelectionHintSources.clear();
  applyBondSelectionHints();
}

function bindCardBondSelectionHint(element, card, sourcePrefix) {
  const factions = getBaseUnitBonds(card);
  if (!element || factions.length === 0) return;

  element.addEventListener("pointerenter", () => {
    setBondSelectionHintSource(`${sourcePrefix}-hover`, factions);
  });
  element.addEventListener("pointerleave", () => {
    setBondSelectionHintSource(`${sourcePrefix}-hover`, []);
  });
  element.addEventListener("focusin", () => {
    setBondSelectionHintSource(`${sourcePrefix}-focus`, factions);
  });
  element.addEventListener("focusout", (event) => {
    if (!element.contains(event.relatedTarget)) {
      setBondSelectionHintSource(`${sourcePrefix}-focus`, []);
    }
  });
}

function getEffectiveUnitBonds(unit, index = -1) {
  return getBaseUnitBonds(unit);
}

function addExtraBond(unit, faction, { temporary = false } = {}) {
  if (!BOND_RULES[faction]) return false;
  if (getBaseUnitBonds(unit).includes(faction)) return false;
  if (getBaseUnitBonds(unit).length >= MAX_UNIT_BONDS) return false;

  const key = temporary ? "tempExtraFactions" : "extraFactions";
  const definition = ensureHeroBondDefinition(unit.name);
  definition[key] = normalizeBondTags([...(definition[key] ?? []), faction]);
  syncHeroBondDefinitionInstances(unit.name);
  return true;
}

function getBondCounts() {
  const namesByFaction = Object.fromEntries(BOND_FACTIONS.map((faction) => [faction, new Set()]));
  state.lineup.forEach((unit, index) => {
    if (!unit) return;
    getEffectiveUnitBonds(unit, index).forEach((faction) => {
      namesByFaction[faction]?.add(unit.name);
    });
  });
  return Object.fromEntries(
    Object.entries(namesByFaction).map(([faction, names]) => [faction, names.size]),
  );
}

function getBondEntries() {
  const counts = getBondCounts();
  return BOND_FACTIONS.map((faction) => ({
    faction,
    count: counts[faction] ?? 0,
    effectCount: getBondEffectCount(counts[faction] ?? 0, faction),
  }));
}

function getActiveBondCount() {
  return getBondEntries().filter((entry) => entry.count >= 2).length;
}

function getHighestActiveBondNames() {
  const active = getBondEntries().filter((entry) => entry.count >= 2);
  if (active.length === 0) return [];
  const highestCount = Math.max(...active.map((entry) => entry.count));
  return active.filter((entry) => entry.count === highestCount).map((entry) => entry.faction);
}

function getHighestBondFactionForRecruit() {
  const entries = getBondEntries();
  const highestCount = Math.max(...entries.map((entry) => entry.count));
  const target = entries.find((entry) => entry.count === highestCount && entry.count > 0);
  return target?.faction ?? null;
}

function getMostCountedBondFaction() {
  const entries = getBondEntries().filter((entry) => entry.count > 0);
  if (entries.length === 0) return null;
  const highestCount = Math.max(...entries.map((entry) => entry.count));
  return entries.find((entry) => entry.count === highestCount)?.faction ?? null;
}

function getBestExtraBondTarget(faction) {
  const candidates = state.lineup
    .map((unit, index) => ({ unit, index }))
    .filter(({ unit, index }) => {
      if (!unit) return false;
      const bonds = getEffectiveUnitBonds(unit, index);
      return !bonds.includes(faction) && getBaseUnitBonds(unit).length < MAX_UNIT_BONDS;
    });
  candidates.sort((a, b) => b.unit.attack - a.unit.attack || a.index - b.index);
  return candidates[0] ?? null;
}

function getHighestAttackUnit() {
  const candidates = state.lineup
    .map((unit, index) => ({ unit, index }))
    .filter(({ unit }) => Boolean(unit));
  candidates.sort((a, b) => b.unit.attack - a.unit.attack || a.index - b.index);
  return candidates[0] ?? null;
}

function pickRandomUnits(units, count) {
  return [...units]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, units.length));
}

function formatFactionList(factions) {
  return factions.map((faction) => `${faction}国`).join("、");
}

function getFactionClass(faction) {
  return `faction-${faction}`;
}

function getFateLabel(faction) {
  return BOND_RULES[faction]?.label ?? "无羁绊";
}

function applyUnityRect(element, rect) {
  element.style.left = `${960 + rect.x - rect.w / 2}px`;
  element.style.top = `${540 - rect.y - rect.h / 2}px`;
  element.style.width = `${rect.w}px`;
  element.style.height = `${rect.h}px`;
}

function applyLocalRect(element, rect, parentWidth, parentHeight) {
  element.style.left = `${parentWidth / 2 + rect.x - rect.w / 2}px`;
  element.style.top = `${parentHeight / 2 - rect.y - rect.h / 2}px`;
  element.style.width = `${rect.w}px`;
  element.style.height = `${rect.h}px`;
}

function applyShopPanelRect(element, rect) {
  const globalLeft = 960 + rect.x - rect.w / 2;
  const globalTop = 540 - rect.y - rect.h / 2;
  element.style.left = `${globalLeft - 61}px`;
  element.style.top = `${globalTop - 540}px`;
  element.style.width = `${rect.w}px`;
  element.style.height = `${rect.h}px`;
}

function getShopFixedSlotRects() {
  return Array.from({ length: SHOP_POSITION_COUNT }, (_, index) => ({
    x: SHOP_POSITION_X[index],
    y: -210,
    w: 210,
    h: 270,
  }));
}

function getShopPositionIndex(index, round) {
  return Math.max(0, Math.min(SHOP_POSITION_COUNT - 1, index));
}

function getShopSlotRects(cards, round) {
  const fixedRects = getShopFixedSlotRects();
  return cards.map((card, index) => fixedRects[getShopPositionIndex(index, round)]);
}

function createFactionTag(faction) {
  const tag = document.createElement("div");
  tag.className = `faction-tag ${getFactionClass(faction)}`;
  tag.innerHTML = `<span>羁绊</span><strong>${faction}</strong>`;
  return tag;
}

function createTierStars(tier, { purple = false } = {}) {
  return Array.from(
    { length: tier },
    () => `<img${purple ? ' class="purple-star"' : ""} src="res/HeroCard/star.png" alt="" />`,
  ).join("");
}

function createHeroFateMarkup(hero, lineupIndex = null) {
  const bonds =
    Number.isInteger(lineupIndex) ? getEffectiveUnitBonds(hero, lineupIndex) : getBaseUnitBonds(hero);
  if (bonds.length === 0) return "";

  return `
    <div class="hero-fate-row ${bonds.length > 1 ? "multi" : ""}">
      ${bonds
        .map(
          (faction) => `<div class="hero-fate hero-fate-${faction}">
            <strong>${getFateLabel(faction)}</strong>
          </div>`,
        )
        .join("")}
    </div>
  `;
}

function createHeroCardMarkup(
  hero,
  { showCost = false, lineupIndex = null, battleSnapshot = false } = {},
) {
  const isLineupUnit = Number.isInteger(lineupIndex);
  const showOwnedDetails = isLineupUnit || battleSnapshot;
  const fateMarkup = createHeroFateMarkup(hero, isLineupUnit ? lineupIndex : null);
  const portraitImage = hero.image ?? HERO_IMAGE_BY_NAME[hero.name] ?? "";
  const derivedUnitDefinition = DERIVED_UNIT_DEFINITION_BY_NAME[hero.name] ?? null;
  const heroEffectId =
    hero.effectId ?? hero.skillEffectIds?.[0] ?? derivedUnitDefinition?.effectId ?? null;
  const equipment = battleSnapshot ? hero.equipment ?? null : isLineupUnit ? getUnitEquipment(hero) : null;
  const equipmentSkillDisplay = equipment
    ? resolveHeroSkillDisplay(equipment.skill, 1, hero)
    : null;
  const remainingEquipmentCharges = equipment?.runtime?.remainingCharges;
  const equipmentRuntimeLabel =
    battleSnapshot && Number.isFinite(remainingEquipmentCharges)
      ? `，剩余${remainingEquipmentCharges}次`
      : "";
  const level = hero.level ?? 1;
  const experience = hero.experience ?? 0;
  const skillName = getHeroSkillName(heroEffectId, hero);
  const skillDescriptionDisplay = getHeroSkillDescriptionDisplay(heroEffectId, hero);
  const skillCaption = hero.isSummon ? "召唤物" : "武将技";
  const derivedContentEntries = getDerivedContentEntries([
    skillDescriptionDisplay.text,
    equipmentSkillDisplay?.text,
    hero.isSummon ? hero.name : "",
  ]);
  const derivedContentMarkup = createDerivedContentRailMarkup(
    derivedContentEntries,
    "hero-derived-detail-rail",
  );
  const experienceNeeded = getExperienceNeeded(level);
  const experienceProgress =
    level >= MAX_UNIT_LEVEL ? 100 : Math.round((experience / experienceNeeded) * 100);
  const progressionLabel =
    level >= MAX_UNIT_LEVEL ? `${level}级，满级` : `${level}级，${experience}/${experienceNeeded}经验`;
  const progressionMarkup = showOwnedDetails
    ? `
      <div class="hero-progression" aria-label="${progressionLabel}">
        <div class="hero-level-text">LV${level}</div>
        <div class="hero-exp-track" style="--exp-progress: ${experienceProgress}%">
          <img class="hero-exp-base" src="res/ShopPanel/exp-bar-base.png" alt="" />
          <img class="hero-exp-fill" src="res/ShopPanel/exp-bar-fill.png" alt="" />
        </div>
      </div>
    `
    : "";
  const bondLabel = (Number.isInteger(lineupIndex) ? getEffectiveUnitBonds(hero, lineupIndex) : getBaseUnitBonds(hero))
    .map(getFateLabel)
    .join("、") || "无羁绊";
  const portraitContent = portraitImage
    ? `<img class="hero-portrait" src="${portraitImage}" alt="${hero.name}" />`
    : `<div class="hero-portrait-placeholder" aria-hidden="true">${hero.name.slice(0, 1)}</div>`;
  const portraitMarkup = `<div class="hero-portrait-viewport">${portraitContent}</div>`;
  const equipmentMarkup = showOwnedDetails
    ? `
      <div class="hero-equipment-slot ${equipment ? "equipped" : "empty"}" aria-label="${
        equipment
          ? battleSnapshot
            ? `已装备${equipment.name}${equipmentRuntimeLabel}`
            : `已装备${equipment.name}，可拖拽移动、交换或出售`
          : "空装备槽"
      }">
        ${
          equipment
            ? `<img class="hero-equipment-icon" src="${equipment.image}" alt="${equipment.name}" />
               ${
                 Number.isFinite(remainingEquipmentCharges)
                   ? `<span class="battle-equipment-charges">${remainingEquipmentCharges}</span>`
                   : ""
               }
              `
            : ""
        }
      </div>
    `
    : "";
  const statusEntries = showOwnedDetails ? getBattleUnitStatusEntries(hero) : [];
  const statusNames = statusEntries.map((status) => status.label);
  const statusClassNames = statusEntries
    .map((status) => ` has-status-${status.id}`)
    .join("");
  const statusMarkup =
    statusEntries.length > 0
      ? `<div class="hero-card-status-effects" role="img" aria-label="状态与独立效果：${statusNames.join("、")}">${statusEntries
          .map(
            (status, index) =>
              `<span class="hero-card-status-effect status-effect-${status.id}" style="--status-offset: ${index * 3}px" aria-hidden="true"></span>`,
          )
          .join("")}</div>`
      : "";
  const statusTooltipMarkup =
    statusEntries.length > 0
      ? `<div class="hero-status-tooltip card-detail-paper">
           <div class="card-detail-heading">
             <strong class="card-detail-ink-tag">状态 / 效果</strong>
             <span class="card-detail-title">状态与独立效果描述</span>
           </div>
           <div class="hero-status-tooltip-list">
             ${statusEntries
               .map(
                 (status) => `<div class="hero-status-tooltip-entry">
                   <b>${escapeBattleReportHtml(status.label)}</b>
                   <span>${getEscapedGameTextMarkup(status.description)}</span>
                 </div>`,
               )
               .join("")}
           </div>
         </div>`
      : "";
  const detailTooltipMarkup = `
    <div class="hero-card-detail-stack" role="tooltip">
      <div class="hero-skill-tooltip card-detail-paper">
        <div class="card-detail-heading">
          <strong class="hero-skill-name-tag card-detail-ink-tag">${escapeBattleReportHtml(skillName)}</strong>
          <span class="card-detail-caption">${skillCaption}</span>
        </div>
        <span class="hero-skill-description">${skillDescriptionDisplay.html}</span>
      </div>
      ${
        equipment
          ? `<div class="hero-equipment-tooltip card-detail-paper">
               <div class="card-detail-heading">
                 <strong class="card-detail-ink-tag">装备</strong>
                 <span class="card-detail-title">${escapeBattleReportHtml(equipment.name)}</span>
               </div>
               <span class="card-detail-body">${equipmentSkillDisplay ? getStatDescriptionMarkup(equipmentSkillDisplay.html) : getEscapedStatDescriptionMarkup(equipment.skill)}</span>
               ${equipmentRuntimeLabel ? `<em>${equipmentRuntimeLabel.slice(1)}</em>` : ""}
             </div>`
          : ""
      }
      ${statusTooltipMarkup}
      ${derivedContentMarkup}
    </div>`;

  return `
    <div class="hero-card${battleSnapshot ? " battle-snapshot-card" : ""}${statusEntries.length > 0 ? " has-status-effect" : ""}${statusClassNames}" tabindex="0" aria-label="${hero.name}，${hero.isLocked ? "已锁定，" : ""}${showOwnedDetails ? `${progressionLabel}，` : ""}${bondLabel}，${equipment ? `装备${equipment.name}，` : ""}${statusNames.length > 0 ? `状态${statusNames.join("、")}，` : ""}技能${skillName}，${getStatPairAccessibleText(skillDescriptionDisplay.text)}${derivedContentEntries.length > 0 ? `，衍生说明${derivedContentEntries.map((entry) => entry.name).join("、")}` : ""}">
      ${portraitMarkup}
      <div class="hero-nameplate">${hero.name}</div>
      ${showCost ? `<div class="hero-cost"><img src="res/HeroCard/coin_no_diamond_preview2.png" alt="" /><span>${hero.cost}</span></div>` : ""}
      ${hero.isReward ? `<div class="reward-badge">升级奖励</div>` : ""}
      ${progressionMarkup}
      ${equipmentMarkup}
      ${statusMarkup}
      ${fateMarkup}
      <div class="hero-stars">${createTierStars(hero.tier)}</div>
      <img class="hero-wave" src="res/HeroCard/wave.png" alt="" />
      <div class="hero-stat hero-attack">
        <img src="res/HeroCard/atk_bk.png" alt="" />
        <span>${hero.attack}</span>
      </div>
      <div class="hero-stat hero-health">
        <img src="res/HeroCard/hp_bk.png" alt="" />
        <span>${hero.health}</span>
      </div>
      ${detailTooltipMarkup}
      ${hero.isLocked ? '<div class="shop-card-lock-overlay" aria-hidden="true"><span>锁定</span></div>' : ""}
    </div>
  `;
}

function createItemCardMarkup(item) {
  return `
    <div class="item-card" tabindex="0" aria-label="${item.name}，${item.isLocked ? "已锁定，" : ""}${getStatPairAccessibleText(item.skill)}">
      <img class="item-icon" src="${item.image}" alt="${item.name}" />
      <div class="item-nameplate">${item.name}</div>
      <div class="item-cost">
        <img src="res/HeroCard/coin_no_diamond_preview2.png" alt="" />
        <span>${item.cost}</span>
      </div>
      <img class="item-wave" src="res/HeroCard/wave.png" alt="" />
      <div class="item-stars">${createTierStars(item.tier ?? 1, {
        purple: Boolean(item.purpleStars || item.rewardOnly || item.rewardItem),
      })}</div>
      <div class="item-type-tag">${item.category ?? "装备/计策"}</div>
      <div class="item-skill-tooltip card-detail-paper" role="tooltip">
        <div class="card-detail-heading">
          <strong class="item-skill-name-tag card-detail-ink-tag">${escapeBattleReportHtml(item.category ?? "装备/计策")}</strong>
          <span class="card-detail-title">${escapeBattleReportHtml(item.name)}</span>
          <span class="card-detail-meta">${item.rewardOnly || item.rewardItem ? `${item.tier ?? 1}星奖励` : `${item.tier ?? 1}阶`}</span>
        </div>
        <span class="item-skill-description">${getEscapedStatDescriptionMarkup(item.skill)}</span>
      </div>
      ${item.isLocked ? '<div class="shop-card-lock-overlay" aria-hidden="true"><span>锁定</span></div>' : ""}
    </div>
  `;
}

const CARD_DETAIL_VIEWPORT_MARGIN = 8;
const CARD_DETAIL_GAP = 10;
let adaptiveCardDetailLayer = null;
let adaptiveCardDetailCard = null;
let adaptiveCardDetailAnimationFrame = 0;

function clampCardDetailValue(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function normalizeCardDetailRect(rect) {
  const width = Number(rect?.width) || Math.max(0, Number(rect?.right) - Number(rect?.left));
  const height = Number(rect?.height) || Math.max(0, Number(rect?.bottom) - Number(rect?.top));
  const left = Number(rect?.left) || 0;
  const top = Number(rect?.top) || 0;
  return {
    left,
    top,
    width,
    height,
    right: Number.isFinite(rect?.right) ? Number(rect.right) : left + width,
    bottom: Number.isFinite(rect?.bottom) ? Number(rect.bottom) : top + height,
  };
}

function getCardDetailViewportBounds(viewport = getVisibleViewportBounds()) {
  return {
    left: viewport.left + CARD_DETAIL_VIEWPORT_MARGIN,
    top: viewport.top + CARD_DETAIL_VIEWPORT_MARGIN,
    right: viewport.left + viewport.width - CARD_DETAIL_VIEWPORT_MARGIN,
    bottom: viewport.top + viewport.height - CARD_DETAIL_VIEWPORT_MARGIN,
  };
}

function getCardDetailOverflow(position, size, bounds) {
  return (
    Math.max(0, bounds.left - position.left) +
    Math.max(0, position.left + size.width - bounds.right) +
    Math.max(0, bounds.top - position.top) +
    Math.max(0, position.top + size.height - bounds.bottom)
  );
}

function getPrioritizedHeroSkillPosition(cardRectValue, size, bounds) {
  const cardRect = normalizeCardDetailRect(cardRectValue);
  return {
    placement: "above",
    left: clampCardDetailValue(
      cardRect.left + cardRect.width / 2 - size.width / 2,
      bounds.left,
      bounds.right - size.width,
    ),
    top: clampCardDetailValue(
      cardRect.top - CARD_DETAIL_GAP - size.height,
      bounds.top,
      bounds.bottom - size.height,
    ),
  };
}

function getAdaptiveSingleDetailPosition(cardRectValue, size, bounds) {
  const cardRect = normalizeCardDetailRect(cardRectValue);
  const centeredLeft = clampCardDetailValue(
    cardRect.left + cardRect.width / 2 - size.width / 2,
    bounds.left,
    bounds.right - size.width,
  );
  const centeredTop = clampCardDetailValue(
    cardRect.top + cardRect.height / 2 - size.height / 2,
    bounds.top,
    bounds.bottom - size.height,
  );
  const candidates = [
    {
      placement: "above",
      left: centeredLeft,
      top: cardRect.top - CARD_DETAIL_GAP - size.height,
    },
    {
      placement: "below",
      left: centeredLeft,
      top: cardRect.bottom + CARD_DETAIL_GAP,
    },
    {
      placement: "right",
      left: cardRect.right + CARD_DETAIL_GAP,
      top: centeredTop,
    },
    {
      placement: "left",
      left: cardRect.left - CARD_DETAIL_GAP - size.width,
      top: centeredTop,
    },
  ];
  const best = candidates.reduce((currentBest, candidate, preference) => {
    const score = getCardDetailOverflow(candidate, size, bounds) * 100 + preference;
    return !currentBest || score < currentBest.score
      ? { ...candidate, score }
      : currentBest;
  }, null);
  return {
    placement: best.placement,
    left: clampCardDetailValue(best.left, bounds.left, bounds.right - size.width),
    top: clampCardDetailValue(best.top, bounds.top, bounds.bottom - size.height),
  };
}

function getCardDetailOverlapArea(firstRectValue, secondRectValue) {
  const firstRect = normalizeCardDetailRect(firstRectValue);
  const secondRect = normalizeCardDetailRect(secondRectValue);
  return (
    Math.max(0, Math.min(firstRect.right, secondRect.right) - Math.max(firstRect.left, secondRect.left)) *
    Math.max(0, Math.min(firstRect.bottom, secondRect.bottom) - Math.max(firstRect.top, secondRect.top))
  );
}

function getAuxiliaryCardDetailLayout(sizes, cardRectValue, primaryRectValue, bounds) {
  if (sizes.length === 0) return { placement: "none", positions: [] };
  const cardRect = normalizeCardDetailRect(cardRectValue);
  const primaryRect = normalizeCardDetailRect(primaryRectValue);
  const groupWidth = Math.max(...sizes.map((size) => size.width));
  const groupHeight =
    sizes.reduce((total, size) => total + size.height, 0) +
    CARD_DETAIL_GAP * Math.max(0, sizes.length - 1);
  const groupSize = { width: groupWidth, height: groupHeight };
  const rawCandidates = [
    {
      placement: "right",
      left: Math.max(cardRect.right, primaryRect.right) + CARD_DETAIL_GAP,
      top: cardRect.top - CARD_DETAIL_GAP - groupHeight,
    },
    {
      placement: "left",
      left: Math.min(cardRect.left, primaryRect.left) - CARD_DETAIL_GAP - groupWidth,
      top: cardRect.top - CARD_DETAIL_GAP - groupHeight,
    },
    {
      placement: "below",
      left: cardRect.left + cardRect.width / 2 - groupWidth / 2,
      top: cardRect.bottom + CARD_DETAIL_GAP,
    },
    {
      placement: "above",
      left: cardRect.left + cardRect.width / 2 - groupWidth / 2,
      top: primaryRect.top - CARD_DETAIL_GAP - groupHeight,
    },
  ];
  const candidates = rawCandidates.map((candidate, preference) => {
    const left = clampCardDetailValue(candidate.left, bounds.left, bounds.right - groupWidth);
    const top = clampCardDetailValue(candidate.top, bounds.top, bounds.bottom - groupHeight);
    const groupRect = { left, top, width: groupWidth, height: groupHeight };
    const collision =
      getCardDetailOverlapArea(groupRect, cardRect) +
      getCardDetailOverlapArea(groupRect, primaryRect);
    const overflow = getCardDetailOverflow(groupRect, groupSize, bounds);
    return {
      ...candidate,
      left,
      top,
      score: overflow * 10000 + collision * 100 + preference,
    };
  });
  const best = candidates.reduce((currentBest, candidate) =>
    !currentBest || candidate.score < currentBest.score ? candidate : currentBest,
  null);
  let top = best.top;
  const positions = sizes.map((size) => {
    const position = {
      placement: best.placement,
      left:
        best.placement === "left"
          ? best.left + groupWidth - size.width
          : best.placement === "right"
            ? best.left
            : best.left + (groupWidth - size.width) / 2,
      top,
    };
    top += size.height + CARD_DETAIL_GAP;
    return position;
  });
  return { placement: best.placement, positions };
}

function getRenderedCardDetailScale(source) {
  const naturalWidth = source?.offsetWidth || 1;
  const renderedWidth = source?.getBoundingClientRect().width || naturalWidth;
  const scale = renderedWidth / naturalWidth;
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

function ensureAdaptiveCardDetailLayer() {
  if (adaptiveCardDetailLayer?.isConnected) return adaptiveCardDetailLayer;
  adaptiveCardDetailLayer = document.createElement("div");
  adaptiveCardDetailLayer.className = "adaptive-card-detail-layer";
  adaptiveCardDetailLayer.setAttribute("aria-hidden", "true");
  document.body.append(adaptiveCardDetailLayer);
  document.documentElement.classList.add("adaptive-card-details-enabled");
  return adaptiveCardDetailLayer;
}

function createAdaptiveCardDetailPanel(source, kind, scale) {
  const layer = ensureAdaptiveCardDetailLayer();
  const naturalWidth = source.offsetWidth || 268;
  const naturalHeight = source.offsetHeight || 1;
  const panel = document.createElement("div");
  panel.className = `adaptive-card-detail-panel adaptive-card-detail-${kind}`;
  panel.style.width = `${naturalWidth}px`;
  panel.style.setProperty("--adaptive-card-detail-scale", String(scale));
  panel.append(source.cloneNode(true));
  layer.append(panel);
  return {
    element: panel,
    width: naturalWidth * scale,
    height: naturalHeight * scale,
  };
}

function setAdaptiveCardDetailPanelPosition(panel, position) {
  panel.element.dataset.placement = position.placement;
  panel.element.style.left = `${position.left}px`;
  panel.element.style.top = `${position.top}px`;
}

function renderAdaptiveCardDetails(card) {
  if (!card?.isConnected) {
    hideAdaptiveCardDetails();
    return;
  }
  const isHeroCard = card.classList.contains("hero-card");
  const sourceRoot = isHeroCard
    ? card.querySelector(".hero-card-detail-stack")
    : card.querySelector(".item-skill-tooltip");
  if (!sourceRoot) {
    hideAdaptiveCardDetails();
    return;
  }
  const layer = ensureAdaptiveCardDetailLayer();
  layer.replaceChildren();
  adaptiveCardDetailCard = card;
  const cardRect = normalizeCardDetailRect(card.getBoundingClientRect());
  const bounds = getCardDetailViewportBounds();
  const rawScale = getRenderedCardDetailScale(sourceRoot);
  const primarySource = isHeroCard
    ? sourceRoot.querySelector(".hero-skill-tooltip")
    : sourceRoot;
  if (!primarySource) return;
  const maximumPrimaryScale = Math.min(
    (bounds.right - bounds.left) / Math.max(1, primarySource.offsetWidth),
    (bounds.bottom - bounds.top) / Math.max(1, primarySource.offsetHeight),
  );
  const scale = Math.min(rawScale, maximumPrimaryScale);
  const primaryPanel = createAdaptiveCardDetailPanel(
    primarySource,
    isHeroCard ? "skill" : "item",
    scale,
  );
  const primaryPosition = isHeroCard
    ? getPrioritizedHeroSkillPosition(cardRect, primaryPanel, bounds)
    : getAdaptiveSingleDetailPosition(cardRect, primaryPanel, bounds);
  setAdaptiveCardDetailPanelPosition(primaryPanel, primaryPosition);
  layer.dataset.primaryPlacement = primaryPosition.placement;

  if (!isHeroCard) return;
  const auxiliarySources = Array.from(sourceRoot.children).filter(
    (child) =>
      child.classList.contains("hero-equipment-tooltip") ||
      child.classList.contains("hero-status-tooltip") ||
      child.classList.contains("hero-derived-detail-rail"),
  );
  const auxiliaryPanels = auxiliarySources.map((source) => {
    const kind = source.classList.contains("hero-equipment-tooltip")
      ? "equipment"
      : source.classList.contains("hero-status-tooltip")
        ? "status"
        : "derived";
    return createAdaptiveCardDetailPanel(source, kind, scale);
  });
  const primaryRect = {
    left: primaryPosition.left,
    top: primaryPosition.top,
    width: primaryPanel.width,
    height: primaryPanel.height,
  };
  const auxiliaryLayout = getAuxiliaryCardDetailLayout(
    auxiliaryPanels,
    cardRect,
    primaryRect,
    bounds,
  );
  auxiliaryPanels.forEach((panel, index) => {
    setAdaptiveCardDetailPanelPosition(panel, auxiliaryLayout.positions[index]);
  });
  layer.dataset.auxiliaryPlacement = auxiliaryLayout.placement;
}

function hideAdaptiveCardDetails() {
  if (adaptiveCardDetailAnimationFrame) {
    window.cancelAnimationFrame(adaptiveCardDetailAnimationFrame);
    adaptiveCardDetailAnimationFrame = 0;
  }
  adaptiveCardDetailCard = null;
  adaptiveCardDetailLayer?.replaceChildren();
  if (adaptiveCardDetailLayer) {
    delete adaptiveCardDetailLayer.dataset.primaryPlacement;
    delete adaptiveCardDetailLayer.dataset.auxiliaryPlacement;
  }
}

function requestAdaptiveCardDetailPosition() {
  if (!adaptiveCardDetailCard || adaptiveCardDetailAnimationFrame) return;
  adaptiveCardDetailAnimationFrame = window.requestAnimationFrame(() => {
    adaptiveCardDetailAnimationFrame = 0;
    if (!adaptiveCardDetailCard?.isConnected) {
      hideAdaptiveCardDetails();
      return;
    }
    renderAdaptiveCardDetails(adaptiveCardDetailCard);
  });
}

function initializeAdaptiveCardDetails() {
  ensureAdaptiveCardDetailLayer();
  document.addEventListener(
    "pointerover",
    (event) => {
      const card = event.target instanceof Element
        ? event.target.closest(".hero-card, .item-card")
        : null;
      if (!card || card === adaptiveCardDetailCard) return;
      renderAdaptiveCardDetails(card);
    },
    true,
  );
  document.addEventListener(
    "pointerout",
    (event) => {
      const card = event.target instanceof Element
        ? event.target.closest(".hero-card, .item-card")
        : null;
      if (!card || card !== adaptiveCardDetailCard) return;
      if (event.relatedTarget instanceof Node && card.contains(event.relatedTarget)) return;
      if (card.contains(document.activeElement)) return;
      hideAdaptiveCardDetails();
    },
    true,
  );
  document.addEventListener("focusin", (event) => {
    const card = event.target instanceof Element
      ? event.target.closest(".hero-card, .item-card")
      : null;
    if (card) renderAdaptiveCardDetails(card);
  });
  document.addEventListener("focusout", (event) => {
    if (!adaptiveCardDetailCard) return;
    if (
      event.relatedTarget instanceof Node &&
      adaptiveCardDetailCard.contains(event.relatedTarget)
    ) {
      return;
    }
    if (!adaptiveCardDetailCard.matches(":hover")) hideAdaptiveCardDetails();
  });
  document.addEventListener("pointerdown", hideAdaptiveCardDetails, true);
  document.addEventListener("scroll", requestAdaptiveCardDetailPosition, {
    capture: true,
    passive: true,
  });
  window.addEventListener("resize", requestAdaptiveCardDetailPosition, { passive: true });
  window.visualViewport?.addEventListener("resize", requestAdaptiveCardDetailPosition, {
    passive: true,
  });
  window.visualViewport?.addEventListener("scroll", requestAdaptiveCardDetailPosition, {
    passive: true,
  });
  document.addEventListener("fullscreenchange", requestAdaptiveCardDetailPosition);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hideAdaptiveCardDetails();
  });
}

function getCodexEntries() {
  const matchesTier = (entry) =>
    codexFilters.tier === "全部" || entry.tier === codexFilters.tier;
  const entries = [];

  if (codexFilters.type === "全部" || codexFilters.type === "武将") {
    entries.push(
      ...CARD_POOLS.hero
        .filter(
          (hero) =>
            matchesTier(hero) &&
            (codexFilters.type !== "武将" ||
              codexFilters.faction === "全部" ||
              hero.faction === codexFilters.faction),
        )
        .map((hero) => ({ ...hero, codexType: "武将" })),
    );
  }

  if (codexFilters.type !== "武将") {
    entries.push(
      ...CARD_POOLS.stratagem
        .filter(
          (item) =>
            matchesTier(item) &&
            (codexFilters.type === "全部" || item.category === codexFilters.type),
        )
        .map((item) => ({ ...item, codexType: item.category })),
    );
  }

  return entries;
}

function getCodexTypeTotal() {
  if (codexFilters.type === "全部") {
    return CARD_POOLS.hero.length + CARD_POOLS.stratagem.length;
  }
  if (codexFilters.type === "武将") return CARD_POOLS.hero.length;
  return CARD_POOLS.stratagem.filter((item) => item.category === codexFilters.type).length;
}

function createCodexCardView(entry) {
  if (entry.codexType === "武将") {
    return {
      ...entry,
      type: "hero",
      cost: entry.cost ?? HERO_COST,
      image: entry.image ?? HERO_IMAGE_BY_NAME[entry.name] ?? "",
      usesBondDefinitionSnapshot: true,
      extraFactions: [],
      tempExtraFactions: [],
    };
  }
  return {
    ...entry,
    type: "stratagem",
    cost:
      entry.cost ??
      (entry.category === "计策" ? STRATAGEM_COST : ITEM_COST),
    image: entry.image ?? "res/item_icon/50100010.png",
  };
}

function renderCodexFilters() {
  elements.codexTypeFilters?.querySelectorAll("[data-codex-type]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      button.dataset.codexType === codexFilters.type ? "true" : "false",
    );
  });
  elements.codexTierFilters?.querySelectorAll("[data-codex-tier]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      button.dataset.codexTier === String(codexFilters.tier)
        ? "true"
        : "false",
    );
  });
  if (elements.codexFactionFilterGroup) {
    elements.codexFactionFilterGroup.hidden = codexFilters.type !== "武将";
  }
  elements.codexFactionFilters
    ?.querySelectorAll("[data-codex-faction]")
    .forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        button.dataset.codexFaction === codexFilters.faction ? "true" : "false",
      );
    });
}

function renderCodex() {
  if (!elements.codexGrid) return;
  renderCodexFilters();
  const entries = getCodexEntries();
  const tierLabel =
    codexFilters.tier === "全部" ? "全部阶数" : `${codexFilters.tier}阶`;
  const typeLabel =
    codexFilters.type === "全部" ? "全部卡牌" : codexFilters.type;
  const factionLabel =
    codexFilters.type === "武将" && codexFilters.faction !== "全部"
      ? ` · ${codexFilters.faction}羁绊`
      : "";
  if (elements.codexCount) {
    elements.codexCount.innerHTML = `${tierLabel}${factionLabel} · 当前 <strong>${entries.length}</strong> 张 / ${typeLabel}总计 ${getCodexTypeTotal()} 张`;
  }

  elements.codexGrid.replaceChildren();
  if (entries.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "codex-empty-state";
    const emptyTypeLabel =
      codexFilters.type === "全部" ? "卡牌" : codexFilters.type;
    emptyState.innerHTML = `<div><strong>暂无对应卡牌</strong><span>${tierLabel}没有符合当前筛选条件的${emptyTypeLabel}。</span></div>`;
    elements.codexGrid.append(emptyState);
    return;
  }

  const fragment = document.createDocumentFragment();
  entries.forEach((entry) => {
    const card = createCodexCardView(entry);
    const shell = document.createElement("article");
    shell.className = "codex-card-shell";
    shell.setAttribute("aria-label", `${card.name}图鉴卡牌`);
    shell.innerHTML =
      card.type === "hero"
        ? createHeroCardMarkup(card, { showCost: true })
        : createItemCardMarkup(card);
    fragment.append(shell);
  });
  elements.codexGrid.append(fragment);
}

function openCodex() {
  if (!elements.codexOverlay) return;
  Object.assign(codexFilters, {
    type: "全部",
    tier: "全部",
    faction: "全部",
  });
  renderCodex();
  elements.codexOverlay.hidden = false;
  playAudioCue("codexOpen");
  elements.codexCloseButton?.focus();
}

function closeCodex({ restoreFocus = true, silent = false } = {}) {
  if (!elements.codexOverlay || elements.codexOverlay.hidden) return;
  elements.codexOverlay.hidden = true;
  if (!silent) playAudioCue("uiCancel");
  if (restoreFocus) elements.codexButton?.focus();
}

function renderShop() {
  setBondSelectionHintSource("shop-hover", []);
  setBondSelectionHintSource("shop-focus", []);
  elements.shopGrid.replaceChildren();
  const lineupHeroNames =
    state.phase === "shop"
      ? new Set(state.lineup.filter(Boolean).map((unit) => unit.name))
      : new Set();
  const fixedSlotRects = getShopFixedSlotRects();
  const slotRects = getShopSlotRects(state.shop, state.round);
  const usedPositionIndices = new Set(
    state.shop.map((card, index) => getShopPositionIndex(index, state.round)),
  );

  fixedSlotRects.forEach((rect, positionIndex) => {
    if (usedPositionIndices.has(positionIndex)) return;
    const placeholder = document.createElement("article");
    placeholder.className = "slot shop-slot-shell shop-slot-placeholder disabled";
    placeholder.setAttribute("aria-hidden", "true");
    applyShopPanelRect(placeholder, rect);

    const body = document.createElement("div");
    body.className = "slot-body";
    placeholder.append(body);
    elements.shopGrid.append(placeholder);
  });

  state.shop.forEach((card, index) => {
    const enabled = isRefreshSlot(index, state.round);
    const slot = document.createElement("article");
    slot.className = [
      "slot",
      "shop-slot-shell",
      enabled ? "enabled" : "disabled",
      card ? "draggable-card" : "",
    ].join(" ");
    applyShopPanelRect(slot, slotRects[index]);
    if (card) {
      slot.draggable = false;
      slot.dataset.cardId = card.id;
      slot.dataset.cardType = card.type;
      slot.classList.toggle("shop-card-locked", card.isLocked);
      slot.classList.toggle(
        "lineup-name-match",
        card.type === "hero" && lineupHeroNames.has(card.name),
      );
      slot.title = card.isLocked
        ? "已锁定：右键解除锁定"
        : "右键锁定，刷新时保留";
      slot.addEventListener("contextmenu", (event) => {
        if (state.phase !== "shop") return;
        event.preventDefault();
        if (isRoundRewardBlockingShop({ notifyPlayer: true })) return;
        card.isLocked = !card.isLocked;
        addLog(`${card.name}${card.isLocked ? "已锁定" : "已解除锁定"}。`);
        playAudioCue(card.isLocked ? "uiConfirm" : "uiCancel");
        render();
      });
      slot.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || event.target.closest("button") || state.phase !== "shop") return;
        event.preventDefault();
        if (card.type === "hero") {
          beginLineupDragDirection(event.clientX);
        } else {
          resetLineupDragDirection();
        }
        pointerDraggedShopIndex = index;
        pointerDraggedLineupIndex = null;
        pointerDraggedEquipmentIndex = null;
        pointerMoved = false;
        setBondSelectionHintSource(
          "shop-drag",
          card.type === "hero" ? getBaseUnitBonds(card) : [],
        );
        startDragPreview(
          slot.querySelector(".hero-card, .item-card"),
          event.clientX,
          event.clientY,
        );
      });
    }

    const header = document.createElement("div");
    header.className = "slot-index";
    header.innerHTML = `<span>${index + 1} 号位</span><span class="slot-type">${card?.type === "hero" ? "武将" : card?.category ?? "装备/计策"}</span>`;

    const body = document.createElement("div");
    body.className = "slot-body";
    if (card) {
      if (card.type === "hero") {
        body.innerHTML = `
          ${createHeroCardMarkup(card, { showCost: true })}
        `;
      } else {
        body.innerHTML = `
          ${createItemCardMarkup(card)}
        `;
      }
    } else {
      body.setAttribute("aria-label", "空商店槽位");
    }

    const actions = document.createElement("div");
    actions.className = "slot-actions";

    slot.append(header, body, actions);
    if (card?.type === "hero") {
      bindCardBondSelectionHint(body.querySelector(".hero-card"), card, "shop");
    }
    elements.shopGrid.append(slot);
  });
}

function renderLineup() {
  elements.lineupGrid.replaceChildren();
  state.lineup.forEach((unit, index) => {
    const slot = document.createElement("article");
    slot.className = "slot lineup-slot enabled";
    slot.draggable = false;
    applyLocalRect(slot, TEAM_SLOT_RECTS[index], 1125, 337);
    slot.style.zIndex = String(LINEUP_SLOT_COUNT - index);
    slot.dataset.lineupIndex = String(index);
    if (unit) slot.dataset.unitId = unit.id;
    slot.addEventListener("pointerdown", (event) => {
      if (!unit || event.target.closest("button") || state.phase !== "shop") return;
      const equipmentSlot = event.target.closest(".hero-equipment-slot");
      if (equipmentSlot) {
        if (!getUnitEquipment(unit)) return;
        event.preventDefault();
        resetLineupDragDirection();
        pointerDraggedEquipmentIndex = index;
        pointerDraggedLineupIndex = null;
        pointerDraggedShopIndex = null;
        pointerMoved = false;
        setBondSelectionHintSource("shop-drag", []);
        startDragPreview(equipmentSlot, event.clientX, event.clientY);
        setSellZoneVisible(true);
        return;
      }
      event.preventDefault();
      beginLineupDragDirection(event.clientX);
      pointerDraggedLineupIndex = index;
      pointerDraggedEquipmentIndex = null;
      pointerDraggedShopIndex = null;
      pointerMoved = false;
      setBondSelectionHintSource("shop-drag", []);
      startDragPreview(slot.querySelector(".hero-card"), event.clientX, event.clientY);
      setSellZoneVisible(true);
    });

    const header = document.createElement("div");
    header.className = "slot-index";
    header.innerHTML = `<span>${index + 1} 号位</span><span class="slot-type">上阵</span>`;

    const body = document.createElement("div");
    body.className = "slot-body";
    if (unit) {
      body.innerHTML = createHeroCardMarkup(unit, { lineupIndex: index });
    } else {
      body.setAttribute("aria-label", `第${index + 1}个空阵位`);
    }

    const actions = document.createElement("div");
    actions.className = "slot-actions";

    slot.append(header, body, actions);
    elements.lineupGrid.append(slot);
  });
}

function renderLogs() {
  if (!elements.logList) return;
  elements.logList.replaceChildren();
  state.logs.forEach((message) => {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.innerHTML = getEscapedGameTextMarkup(message);
    elements.logList.append(entry);
  });
}

function renderFlow() {
  if (!elements.flowShop || !elements.flowBattle || !elements.flowNext) return;
  elements.flowShop.classList.toggle("active", state.phase === "shop");
  elements.flowBattle.classList.toggle("active", state.phase === "battle");
  elements.flowNext.classList.toggle("active", false);
}

function renderBonds() {
  const counts = getBondCounts();
  const currentEffectCounts = Object.fromEntries(
    BOND_FACTIONS.map((faction) => [
      faction,
      getBondEffectCount(counts[faction] ?? 0, faction),
    ]),
  );
  if (previousRenderedBondEffectCounts) {
    BOND_FACTIONS.forEach((faction) => {
      const previousEffectCount = previousRenderedBondEffectCounts[faction] ?? 0;
      const effectCount = currentEffectCounts[faction] ?? 0;
      if (effectCount <= previousEffectCount) return;

      queuedBondUpgradeCelebrations.push({
        faction,
        previousLevel: previousEffectCount,
        level: effectCount,
        unitIds: state.lineup
          .filter(Boolean)
          .filter((unit) => getEffectiveUnitBonds(unit).includes(faction))
          .map((unit) => unit.id),
      });
    });
  }
  previousRenderedBondEffectCounts = currentEffectCounts;
  elements.bondList.replaceChildren();

  Object.values(BOND_RULES).forEach((bond) => {
    const count = counts[bond.name] ?? 0;
    const effectCount = getBondEffectCount(count, bond.name);
    const effectText = effectCount > 0
      ? bond.effects[effectCount]
      : `达到2人后：${bond.effects[2]}`;
    const effectMarkup = getBondDescriptionMarkup(effectText);
    const tooltipId = `bond-effect-tooltip-${bond.name}`;
    const visibleEffectTiers = getVisibleBondEffectTiers(bond.name);
    const derivedContentMarkup = createDerivedContentRailMarkup(
      getDerivedContentEntries(visibleEffectTiers.map((people) => bond.effects[people])),
      "bond-derived-detail-rail",
    );
    const peopleEffects = visibleEffectTiers
      .map(
        (people) => `
          <li class="bond-level-effect ${people === effectCount ? "current" : ""}">
            <span class="bond-level-badge">${people}人</span>
            <span class="bond-level-copy">${getBondDescriptionMarkup(bond.effects[people])}</span>
            ${people === effectCount ? '<em class="bond-level-current">当前</em>' : ""}
          </li>
        `,
      )
      .join("");
    const item = document.createElement("article");
    item.className = `bond-card bond-${bond.name} bond-level-${effectCount} ${effectCount > 0 ? "active" : ""} ${getFactionClass(bond.name)}`;
    item.dataset.faction = bond.name;
    item.tabIndex = 0;
    item.setAttribute(
      "aria-label",
      `${bond.label}：${getStatPairAccessibleText(normalizeBondDescription(effectText))}`,
    );
    item.setAttribute("aria-describedby", tooltipId);
    item.innerHTML = `
      <div class="bond-header">
        <strong>${bond.label}</strong>
      </div>
      <div class="bond-detail">
        <div class="bond-effect">${effectMarkup}</div>
      </div>
      <div class="bond-progress">
        <div class="bond-progress-count">${getBondProgressMarkup(count, bond.name)}</div>
      </div>
      <div id="${tooltipId}" class="bond-level-tooltip" role="tooltip">
        <div class="bond-level-tooltip-surface">
          <div class="bond-level-tooltip-title">
            <strong>${bond.label}</strong>
            <span>${visibleEffectTiers.join("/")}人效果 · 只结算最高人数档</span>
          </div>
          <ol class="bond-level-effects">
            ${peopleEffects}
          </ol>
        </div>
        ${derivedContentMarkup}
      </div>
    `;
    elements.bondList.append(item);
  });
  applyBondSelectionHints();
}

function clearBondUpgradeEffects() {
  window.clearTimeout(bondUpgradeAnimationTimer);
  bondUpgradeAnimationTimer = 0;
  elements.lineupGrid?.querySelectorAll(".bond-upgrade-effect").forEach((effect) => effect.remove());
  elements.lineupGrid?.querySelectorAll(".bond-upgrade-active").forEach((card) => {
    card.classList.remove("bond-upgrade-active");
    card.style.removeProperty("--bond-upgrade-color");
  });
}

function playQueuedBondUpgradeCelebrations() {
  if (queuedBondUpgradeCelebrations.length === 0) return;
  clearBondUpgradeEffects();
  const celebrations = queuedBondUpgradeCelebrations.splice(0);
  playAudioCue("bondGain");
  let longestDelay = 0;

  celebrations.forEach((celebration) => {
    celebration.unitIds.forEach((unitId) => {
      const slot = Array.from(elements.lineupGrid.querySelectorAll(".lineup-slot")).find(
        (candidate) => candidate.dataset.unitId === unitId,
      );
      const card = slot?.querySelector(".hero-card");
      if (!card) return;

      const delay = 0;
      longestDelay = Math.max(longestDelay, delay);
      const color = BOND_VISUAL_COLORS[celebration.faction] ?? "#ffe39a";
      card.classList.add("bond-upgrade-active");
      card.style.setProperty("--bond-upgrade-color", color);

      const effect = document.createElement("div");
      effect.className = "bond-upgrade-effect";
      effect.dataset.faction = celebration.faction;
      effect.setAttribute("aria-hidden", "true");
      effect.style.setProperty("--bond-upgrade-color", color);
      effect.style.setProperty("--bond-upgrade-delay", `${delay}ms`);

      const wash = document.createElement("span");
      wash.className = "bond-upgrade-wash";
      effect.append(wash);
      card.append(effect);
    });
  });

  bondUpgradeAnimationTimer = window.setTimeout(
    clearBondUpgradeEffects,
    BOND_UPGRADE_ANIMATION_DURATION + longestDelay + 120,
  );
}

function escapeBattleReportHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const BATTLE_NUMBER_GLYPH_COLUMNS = Object.freeze({
  "+": 0,
  "-": 1,
  0: 2,
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
  6: 8,
  7: 9,
  8: 10,
  9: 11,
});
const BATTLE_NUMBER_ROWS = Object.freeze({
  damage: 0,
  "true-damage": 4,
  buff: 5,
});

function getBattleNumberMarkup(value, tone = "buff") {
  const normalizedTone = Object.hasOwn(BATTLE_NUMBER_ROWS, tone) ? tone : "buff";
  const row = BATTLE_NUMBER_ROWS[normalizedTone];
  const glyphs = Array.from(String(value ?? ""));
  if (glyphs.length === 0 || glyphs.some((glyph) => !Object.hasOwn(BATTLE_NUMBER_GLYPH_COLUMNS, glyph))) {
    return escapeBattleReportHtml(value);
  }
  return `<span class="battle-number battle-number-${normalizedTone}" aria-hidden="true">${glyphs
    .map((glyph) => {
      const column = BATTLE_NUMBER_GLYPH_COLUMNS[glyph];
      const x = (column * 100) / 11;
      const y = (row * 100) / 6;
      return `<span class="battle-number-glyph" style="background-position:${x.toFixed(5)}% ${y.toFixed(5)}%"></span>`;
    })
    .join("")}</span>`;
}

function getFloatingStatValueMarkup(
  value,
  icon = "",
  { showPositiveSign = true, tone = null } = {},
) {
  const numericValue = Number(value) || 0;
  const signedValue = numericValue > 0 && showPositiveSign ? `+${numericValue}` : String(numericValue);
  const numberTone = tone || (numericValue < 0 ? "true-damage" : "buff");
  const iconMarkup = icon
    ? `<img class="floating-stat-icon floating-stat-icon-${icon}" src="res/StatIcon/${icon}.png" alt="" aria-hidden="true" />`
    : "";
  return `<span class="floating-stat-value${
    icon ? ` floating-stat-value-${icon}` : ""
  }">${getBattleNumberMarkup(
    signedValue,
    numberTone,
  )}${iconMarkup}</span>`;
}

function getFloatingStatChangeMarkup(attack, health) {
  const attackDelta = Number(attack) || 0;
  const healthDelta = Number(health) || 0;
  const hasAttack = attackDelta !== 0;
  const hasHealth = healthDelta !== 0;
  if (!hasAttack && !hasHealth) return "";
  const isPositivePair = attackDelta > 0 && healthDelta > 0;
  const attackMarkup = hasAttack
    ? getFloatingStatValueMarkup(attackDelta, isPositivePair ? "" : "attack")
    : "";
  const healthMarkup = hasHealth
    ? getFloatingStatValueMarkup(healthDelta, "", {
        showPositiveSign: !hasAttack,
      })
    : "";
  return `<span class="floating-stat-change">${attackMarkup}${
    hasAttack && hasHealth ? '<span class="floating-stat-separator" aria-hidden="true">/</span>' : ""
  }${healthMarkup}</span>`;
}

function parseFloatingAttributeText(value) {
  const text = String(value ?? "");
  const pairMatch = /\+(\d+)\s*\/\s*\+?(\d+)/u.exec(text);
  if (pairMatch) {
    return {
      prefix: text.slice(0, pairMatch.index),
      suffix: text.slice(pairMatch.index + pairMatch[0].length),
      attack: Number(pairMatch[1]),
      health: Number(pairMatch[2]),
    };
  }
  const attackMatch = /(?:攻击(?:力)?\s*([+-]\d+)|([+-]\d+)\s*攻击(?:力)?)/u.exec(text);
  if (attackMatch) {
    return {
      prefix: text.slice(0, attackMatch.index),
      suffix: text.slice(attackMatch.index + attackMatch[0].length),
      attack: Number(attackMatch[1] ?? attackMatch[2]),
      health: 0,
    };
  }
  const healthMatch = /(?:生命(?:值)?\s*([+-]\d+)|([+-]\d+)\s*生命(?:值)?)/u.exec(text);
  if (healthMatch) {
    return {
      prefix: text.slice(0, healthMatch.index),
      suffix: text.slice(healthMatch.index + healthMatch[0].length),
      attack: 0,
      health: Number(healthMatch[1] ?? healthMatch[2]),
    };
  }
  return null;
}

function getFloatingAttributeTextMarkup(value) {
  const parsed = parseFloatingAttributeText(value);
  if (!parsed) return getEscapedGameTextMarkup(value);
  return `<span class="floating-attribute-message">${
    parsed.prefix
      ? `<span class="floating-attribute-context">${escapeBattleReportHtml(parsed.prefix)}</span>`
      : ""
  }${getFloatingStatChangeMarkup(parsed.attack, parsed.health)}${
    parsed.suffix
      ? `<span class="floating-attribute-context">${escapeBattleReportHtml(parsed.suffix)}</span>`
      : ""
  }</span>`;
}

function getFloatingAttributeAccessibleText(value) {
  const parsed = parseFloatingAttributeText(value);
  if (!parsed) return getStatPairAccessibleText(value);
  const changes = [];
  if (parsed.attack) changes.push(`${parsed.attack > 0 ? "+" : ""}${parsed.attack}攻击力`);
  if (parsed.health) changes.push(`${parsed.health > 0 ? "+" : ""}${parsed.health}生命值`);
  return `${parsed.prefix}${changes.join("/")}${parsed.suffix}`;
}

function getFloatingDamageMarkup(amount, damageType = "attack") {
  const numericAmount = Math.max(0, Number(amount) || 0);
  const tone = damageType === "true" ? "true-damage" : "damage";
  return `<span class="floating-damage-value">${getBattleNumberMarkup(
    `-${numericAmount}`,
    tone,
  )}</span>`;
}

function getSkillTriggerTagMarkup(skillName) {
  const normalizedName = String(skillName || "技能").replace(/^【|】$/gu, "");
  return `<strong class="skill-trigger-tag hero-skill-name-tag card-detail-ink-tag">${escapeBattleReportHtml(normalizedName)}</strong>`;
}

function renderBattlePopupMarkup(popup) {
  const tone = String(popup?.tone || "effect");
  if (tone === "skill") {
    return getSkillTriggerTagMarkup(popup.text);
  }
  const damageMatch = /^-(\d+)$/u.exec(String(popup?.text ?? ""));
  if (tone === "damage" && damageMatch) {
    const amount = Number.isFinite(popup.damageAmount)
      ? popup.damageAmount
      : Number(damageMatch[1]);
    const isTrueDamage = popup.damageType === "true";
    return `<strong class="battle-value-popup damage-value-popup ${
      isTrueDamage ? "true-damage" : "damage"
    }" aria-label="造成${amount}点${isTrueDamage ? "真实" : "普通"}伤害">${getFloatingDamageMarkup(
      amount,
      popup.damageType,
    )}</strong>`;
  }
  const attributeMarkup = getFloatingAttributeTextMarkup(popup?.text);
  if (parseFloatingAttributeText(popup?.text)) {
    return `<strong class="battle-value-popup attribute-value-popup ${escapeBattleReportHtml(
      tone,
    )}" aria-label="${escapeBattleReportHtml(
      getFloatingAttributeAccessibleText(popup.text),
    )}">${attributeMarkup}</strong>`;
  }
  return `<strong class="${escapeBattleReportHtml(tone)}">${getEscapedGameTextMarkup(
    popup?.text,
  )}</strong>`;
}

function getStatPairMarkup(markup) {
  const bonusMarkup = String(markup ?? "").replace(
    /(^|[^\d+])(?:\+(\d+)\s*\/\s*\+?(\d+)|(\d+)\s*\/\s*\+(\d+))/g,
    (_match, prefix, attackWithPlus, healthAfterAttackPlus, attackBeforeHealthPlus, healthWithPlus) => {
      const attack = attackWithPlus ?? attackBeforeHealthPlus;
      const health = healthAfterAttackPlus ?? healthWithPlus;
      return `${prefix}<span class="inline-stat-pair inline-stat-pair-bonus"><span class="inline-stat-value">+${attack}<img class="inline-stat-icon inline-stat-icon-attack" src="res/StatIcon/attack.png" alt="攻击力" /></span><span class="inline-stat-separator">/</span><span class="inline-stat-value">+${health}<img class="inline-stat-icon inline-stat-icon-health" src="res/StatIcon/health.png" alt="生命值" /></span></span>`;
    },
  );
  return bonusMarkup.replace(
    /(^|[^\d+\/])(\d+)\s*\/\s*(\d+)(?!\s*\/\s*\d)/g,
    (_match, prefix, attack, health) =>
      `${prefix}<span class="inline-stat-pair inline-stat-pair-base"><span class="inline-stat-value"><img class="inline-stat-icon inline-stat-icon-attack" src="res/StatIcon/attack.png" alt="攻击力" />${attack}</span><span class="inline-stat-separator">/</span><span class="inline-stat-value"><img class="inline-stat-icon inline-stat-icon-health" src="res/StatIcon/health.png" alt="生命值" />${health}</span></span>`,
  );
}

function getInlineStatTermIconMarkup(statName) {
  const iconName = statName === "攻击力" ? "attack" : "health";
  return `<img class="inline-stat-icon inline-stat-term-icon inline-stat-icon-${iconName}" src="res/StatIcon/${iconName}.png" alt="${statName}" />`;
}

function getInlineExperienceIconMarkup() {
  return '<img class="inline-experience-icon" src="res/StatIcon/experience.png" alt="经验值" />';
}

function getExperienceDescriptionMarkup(markup) {
  return String(markup ?? "")
    .split(/(<[^>]+>)/g)
    .map((part, index) =>
      index % 2 === 0 ? part.replaceAll("经验值", getInlineExperienceIconMarkup()) : part,
    )
    .join("");
}

function getInlineStatTermPairMarkup() {
  return `<span class="inline-stat-pair inline-stat-term-pair">${getInlineStatTermIconMarkup("攻击力")}<span class="inline-stat-separator">/</span>${getInlineStatTermIconMarkup("生命值")}</span>`;
}

function getStatTermReplacementMarkup(statTerm) {
  if (statTerm === "攻血") return getInlineStatTermPairMarkup();
  if (statTerm === "面板攻击") {
    return `面板${getInlineStatTermIconMarkup("攻击力")}`;
  }
  if (statTerm.startsWith("当前生命")) {
    return `当前${getInlineStatTermIconMarkup("生命值")}`;
  }
  return getInlineStatTermIconMarkup(statTerm);
}

function getPercentBeforeAttackIconMarkup(markup) {
  return String(markup ?? "").replace(
    /攻击力(\s*)(<span\b(?=[^>]*\bhero-skill-scaled-value\b)[^>]*>\s*\d+(?:\.\d+)?%\s*<\/span>|\d+(?:\.\d+)?%)/g,
    (_match, spacing, percentageMarkup) =>
      `${percentageMarkup}${spacing}${getInlineStatTermIconMarkup("攻击力")}`,
  );
}

function getStatDescriptionMarkup(markup) {
  return getPercentBeforeAttackIconMarkup(getStatPairMarkup(markup))
    .split(/(<[^>]+>)/g)
    .map((part, index) =>
      index % 2 === 0
        ? part.replace(
            /攻血|当前生命(?:值)?|攻击力|生命值|面板攻击(?=和)/g,
            (statTerm) => getStatTermReplacementMarkup(statTerm),
          )
        : part,
    )
    .join("");
}

function getEscapedGameTextMarkup(value) {
  return getStatPairMarkup(escapeBattleReportHtml(value));
}

function getEscapedStatDescriptionMarkup(value) {
  return getStatDescriptionMarkup(escapeBattleReportHtml(value));
}

function getStatPairAccessibleText(value) {
  const bonusText = String(value ?? "").replace(
    /(^|[^\d+])(?:\+(\d+)\s*\/\s*\+?(\d+)|(\d+)\s*\/\s*\+(\d+))/g,
    (_match, prefix, attackWithPlus, healthAfterAttackPlus, attackBeforeHealthPlus, healthWithPlus) => {
      const attack = attackWithPlus ?? attackBeforeHealthPlus;
      const health = healthAfterAttackPlus ?? healthWithPlus;
      return `${prefix}+${attack}攻击力/+${health}生命值`;
    },
  );
  const baseText = bonusText.replace(
    /(^|[^\d+\/])(\d+)\s*\/\s*(\d+)(?!\s*\/\s*\d)/g,
    (_match, prefix, attack, health) => `${prefix}${attack}攻击力/${health}生命值`,
  );
  return baseText
    .replaceAll("攻血", "攻击力/生命值")
    .replace(/面板攻击(?=和生命值)/g, "面板攻击力")
    .replace(/当前生命(?!值)/g, "当前生命值");
}

function normalizeBondDescription(value) {
  return String(value ?? "")
    .replace(/([魏蜀吴群])将/g, "$1武将")
    .replaceAll("。", "");
}

function getBondDescriptionMarkup(value) {
  const factionMarkup = escapeBattleReportHtml(normalizeBondDescription(value)).replace(
    /([魏蜀吴群])(?=武将)/g,
    (faction) => `<span class="bond-faction-word" data-faction="${faction}">${faction}</span>`,
  );
  return getStatPairMarkup(getDerivedContentHighlightedMarkup(factionMarkup));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getBattleSideFromUnitId(unitId) {
  if (String(unitId || "").startsWith("player-")) return "player";
  if (String(unitId || "").startsWith("enemy-")) return "enemy";
  return null;
}

function getBattleUnitSideClass(side) {
  return side === "player" || side === "enemy" ? side : "neutral";
}

function renderBattleUnitToken(name, side) {
  return `<span class="battle-token-unit ${getBattleUnitSideClass(side)}">${escapeBattleReportHtml(
    name,
  )}</span>`;
}

function collectBattleUnitSidesByName(battle) {
  const sidesByName = new Map();
  const collectTeam = (units, side) => {
    (units ?? []).forEach((unit) => {
      if (!unit?.name) return;
      if (!sidesByName.has(unit.name)) sidesByName.set(unit.name, new Set());
      sidesByName.get(unit.name).add(side);
    });
  };
  collectTeam(battle.playerStart, "player");
  collectTeam(battle.enemyStart, "enemy");
  (battle.roundSnapshots ?? []).forEach((snapshot) => {
    collectTeam(snapshot.player, "player");
    collectTeam(snapshot.enemy, "enemy");
  });
  (battle.presentationTimeline ?? []).forEach((step) => {
    collectTeam(step.snapshot?.player, "player");
    collectTeam(step.snapshot?.enemy, "enemy");
  });
  return new Map(
    [...sidesByName].map(([name, sides]) => [
      name,
      sides.size === 1 ? [...sides][0] : null,
    ]),
  );
}

function getEntryUnitSidesByName(entry) {
  const sidesByName = new Map();
  const details = entry ?? {};
  [
    ["ownerName", "ownerSide", "ownerId"],
    ["sourceName", "sourceSide", "sourceUnitId"],
    ["targetName", "targetSide", "targetUnitId"],
    ["unitName", "unitSide", "unitId"],
    ["deadUnitName", "deadUnitSide", "deadUnitId"],
  ].forEach(([nameKey, sideKey, idKey]) => {
    const name = details[nameKey];
    if (!name) return;
    sidesByName.set(
      name,
      details[sideKey] ?? getBattleSideFromUnitId(details[idKey]),
    );
  });
  return sidesByName;
}

function formatBattleReportMessage(message, entry = {}, battleSidesByName = new Map()) {
  let output = escapeBattleReportHtml(message);
  const placeholders = [];
  const entrySidesByName = getEntryUnitSidesByName(entry);
  const protect = (html) => {
    const token = `\uE000${placeholders.length}\uE001`;
    placeholders.push(html);
    return token;
  };
  const replaceTokens = (tokens, className, renderToken = null) => {
    const uniqueTokens = [...new Set(tokens.filter(Boolean))].sort(
      (left, right) => right.length - left.length,
    );
    if (uniqueTokens.length === 0) return;
    const pattern = new RegExp(uniqueTokens.map(escapeRegExp).join("|"), "g");
    output = output.replace(pattern, (token) =>
      protect(
        renderToken
          ? renderToken(token)
          : `<span class="${className}">${token}</span>`,
      ),
    );
  };

  replaceTokens(
    [
      ...CARD_POOLS.hero.map((hero) => hero.name),
      "重骑兵",
      "骑兵",
    ],
    "battle-token-unit",
    (token) =>
      renderBattleUnitToken(
        token,
        entrySidesByName.get(token) ?? battleSidesByName.get(token),
      ),
  );
  replaceTokens(
    [
      ...CARD_POOLS.stratagem
        .filter((item) => item.category === "装备")
        .map((item) => item.name),
      ...Object.values(BOND_RULES).map((bond) => bond.label),
      ...CARD_POOLS.hero.map((hero) => getHeroSkillName(hero.effectId, hero)),
      ...Object.values(STATUS_LABELS),
      "引燃",
    ],
    "battle-token-effect",
  );
  output = output.replace(
    /(?:\+\d+\/\+\d+|\+\d+\/\d+|\d+\/\d+|\d+\s*点(?:真实)?伤害|\d+\s*生命)/g,
    (token) => protect(`<span class="battle-token-health">${token}</span>`),
  );
  placeholders.forEach((html, index) => {
    output = output.replace(`\uE000${index}\uE001`, html);
  });
  return getStatPairMarkup(output);
}

function renderBattleReportEntry(entry, battleSidesByName) {
  if (entry.type === "hero-skill" && entry.skillDescriptionHtml) {
    const ownerSide =
      entry.ownerSide ?? getBattleSideFromUnitId(entry.ownerId) ?? battleSidesByName.get(entry.ownerName);
    const sideLabel = ownerSide === "player" ? "我方" : ownerSide === "enemy" ? "敌方" : "";
    return `${sideLabel ? `<span class="battle-side-label ${getBattleUnitSideClass(ownerSide)}">${sideLabel}</span> ` : ""}${renderBattleUnitToken(
      entry.ownerName,
      ownerSide,
    )}【<span class="battle-token-effect">${escapeBattleReportHtml(
      entry.skillName,
    )}</span>】触发（${escapeBattleReportHtml(
      entry.triggerName ?? getEventDisplayName(entry.trigger),
    )}）${entry.skillDescriptionHtml ? `：${entry.skillDescriptionHtml}` : ""}。`;
  }

  if (entry.type === "damage" && Number.isFinite(entry.damage)) {
    const sourceSide =
      entry.sourceSide ??
      getBattleSideFromUnitId(entry.sourceUnitId) ??
      battleSidesByName.get(entry.sourceName);
    const targetSide =
      entry.targetSide ??
      getBattleSideFromUnitId(entry.targetUnitId) ??
      battleSidesByName.get(entry.targetName);
    const sourceSideLabel =
      sourceSide === "player" ? "我方" : sourceSide === "enemy" ? "敌方" : "";
    const targetSideLabel =
      targetSide === "player" ? "我方" : targetSide === "enemy" ? "敌方" : "";
    const modifiers = (entry.modifiers ?? []).filter((modifier) => modifier.amount !== 0);
    const breakdown = [
      `<span>基础 <strong>${entry.baseDamage ?? entry.damage}</strong></span>`,
      ...modifiers.map(
        (modifier) =>
          `<span><span class="battle-token-effect">${escapeBattleReportHtml(
            modifier.sourceName,
          )}</span> <strong>${modifier.amount >= 0 ? "+" : ""}${
            modifier.amount
          }</strong></span>`,
      ),
    ].join("<i>；</i>");
    return `<span class="battle-side-label ${getBattleUnitSideClass(sourceSide)}">${sourceSideLabel}</span> ${renderBattleUnitToken(
      entry.sourceName,
      sourceSide,
    )} 对<span class="battle-side-label ${getBattleUnitSideClass(targetSide)}">${targetSideLabel}</span> ${renderBattleUnitToken(
      entry.targetName,
      targetSide,
    )}造成<span class="battle-damage-final">${entry.damage}点伤害</span><span class="battle-damage-breakdown">（${breakdown}）</span>。`;
  }

  return formatBattleReportMessage(entry.message, entry, battleSidesByName);
}

function formatBattleDamageModifiersForReport(damage) {
  if (!damage?.modifiers?.length) return "";
  return `<span class="battle-round-modifiers">${damage.modifiers
    .map(
      (modifier) =>
        `<span class="battle-token-effect">${escapeBattleReportHtml(
          modifier.sourceName,
        )}</span><span class="battle-token-health">${
          modifier.amount >= 0 ? "+" : ""
        }${modifier.amount}</span>`,
    )
    .join(" ")}</span>`;
}

function renderBattleRoundSummary(entry) {
  const ally = entry.ally;
  const foe = entry.foe;
  const allyDamage = entry.damageToEnemy;
  const foeDamage = entry.damageToPlayer;
  if (!ally || !foe || !allyDamage || !foeDamage) return "";
  const renderFighter = (fighter, sideClass) => `
    <div class="battle-round-fighter ${sideClass}">
      ${renderBattleUnitToken(fighter.name, sideClass)}
      <span class="battle-token-health">${fighter.healthBefore} → ${fighter.healthAfter}</span>
      <span class="battle-round-state ${fighter.alive ? "alive" : "defeated"}">${
        fighter.alive ? "存活" : "阵亡"
      }</span>
    </div>
  `;
  const renderDamage = (source, sourceSide, target, targetSide, damage) => `
    <div class="battle-round-damage">
      ${renderBattleUnitToken(source.name, sourceSide)}
      <span class="battle-round-arrow">→</span>
      ${renderBattleUnitToken(target.name, targetSide)}
      <span class="battle-token-health">${damage.finalAmount} 点伤害</span>
      ${formatBattleDamageModifiersForReport(damage)}
    </div>
  `;
  return `
    <div class="battle-round-summary">
      <div class="battle-round-health">
        ${renderFighter(ally, "player")}
        <span class="battle-round-versus">VS</span>
        ${renderFighter(foe, "enemy")}
      </div>
      <div class="battle-round-damages">
        ${renderDamage(ally, "player", foe, "enemy", allyDamage)}
        ${renderDamage(foe, "enemy", ally, "player", foeDamage)}
      </div>
    </div>
  `;
}

function renderBattleReport(battle, selectedExchange = null) {
  const entries = battle.structuredLog.filter((entry) => entry.message);
  const battleSidesByName = collectBattleUnitSidesByName(battle);
  const preBattleEntries = entries.filter(
    (entry) => !Number.isInteger(entry.exchange) && entry.type !== "result",
  );
  const resultEntries = entries.filter((entry) => entry.type === "result");
  const exchangeNumbers = [
    ...new Set(
      entries
        .filter((entry) => Number.isInteger(entry.exchange))
        .map((entry) => entry.exchange),
    ),
  ].sort((left, right) => left - right);
  const renderEntries = (items) =>
    items
      .map(
        (entry) =>
          `<div class="battle-report-entry battle-report-${entry.type}">${renderBattleReportEntry(
            entry,
            battleSidesByName,
          )}</div>`,
      )
      .join("");

  const sections = [];
  sections.push(`
    <section
      class="battle-report-section battle-report-opening battle-report-round${
        selectedExchange === 0 ? " selected" : ""
      }"
      data-exchange="0"
      role="button"
      tabindex="0"
      aria-pressed="${selectedExchange === 0}"
      aria-label="查看战斗开始技能结算前阵容"
    >
      <h3><span>战斗开始时机</span></h3>
      <div class="battle-report-entry">查看全部“战斗开始时”效果结算前的双方阵容。</div>
    </section>
  `);
  if (preBattleEntries.length > 0) {
    sections.push(`
      <section class="battle-report-section battle-report-opening">
        <h3>战前结算</h3>
        ${renderEntries(preBattleEntries)}
      </section>
    `);
  }
  exchangeNumbers.forEach((exchange) => {
    const roundEntries = entries.filter((entry) => entry.exchange === exchange);
    const summary = roundEntries.find((entry) => entry.type === "round-summary");
    const details = roundEntries.filter(
      (entry) => entry.type !== "exchange" && entry.type !== "round-summary",
    );
    sections.push(`
      <section
        class="battle-report-section battle-report-round${
          exchange === selectedExchange ? " selected" : ""
        }"
        data-exchange="${exchange}"
        role="button"
        tabindex="0"
        aria-pressed="${exchange === selectedExchange}"
        aria-label="查看第 ${exchange} 轮交锋前阵容"
      >
        <h3><span>第 ${exchange} 轮交锋</span></h3>
        ${summary ? renderBattleRoundSummary(summary) : ""}
        ${details.length > 0 ? `<div class="battle-round-details">${renderEntries(details)}</div>` : ""}
      </section>
    `);
  });
  if (resultEntries.length > 0) {
    sections.push(`
      <section class="battle-report-section battle-report-result">
        <h3>战斗结果</h3>
        ${renderEntries(resultEntries)}
      </section>
    `);
  }
  return sections.join("");
}

function getSelectedBattleSnapshot(battle) {
  const snapshots = battle.roundSnapshots ?? [];
  if (battle.selectedExchange === 0) {
    return {
      exchange: 0,
      player: battle.playerStart,
      enemy: battle.enemyStart,
    };
  }
  if (snapshots.length === 0) {
    return {
      exchange: 0,
      player: battle.playerStart,
      enemy: battle.enemyStart,
    };
  }
  const selectedExchange = Number.isInteger(battle.selectedExchange)
    ? battle.selectedExchange
    : snapshots[0].exchange;
  return (
    snapshots.find((snapshot) => snapshot.exchange === selectedExchange) ?? snapshots[0]
  );
}

function getBattleUnitStatusEntries(unit) {
  const statusId = getUnitStatusId(unit);
  const effectIds = [statusId, unit.skillDisabled ? "skill-disabled" : null].filter(Boolean);
  return effectIds
    .map((statusId) => {
      const statusData = unit.statuses?.[statusId] ?? {};
      let description = STATUS_DESCRIPTIONS[statusId] ?? "当前单位正在受到此状态影响。";
      if (statusId === "intimidated" && statusData.spent) {
        description += " 当前标记已消耗。";
      }
      if (statusId === "unparalleled" && Number.isFinite(statusData.targetCount)) {
        description = `免疫后续负面状态；只有新的正面状态可以覆盖无双；普通攻击会对目标后方最近的 ${statusData.targetCount} 名单位造成本次普攻最终伤害 30% 的追加伤害。`;
      }
      if (statusId === "rest" && Number.isFinite(statusData.amount)) {
        description = `其他友军完成普通攻击后，自身 +${statusData.amount} 生命；自己的交锋不会触发自身休整；将获得负面状态时，清除休整并阻止该负面状态。`;
      }
      return {
        id: STATUS_LABELS[statusId] ? statusId : "unknown",
        label: STATUS_LABELS[statusId] ?? statusId,
        description,
      };
    });
}

function getBattleUnitStatusNames(unit) {
  return getBattleUnitStatusEntries(unit).map((status) => status.label);
}

function getBattleSnapshotCardUnit(unit, exchange) {
  const definition = CARD_POOLS.hero.find((hero) => hero.name === unit.name) ?? {};
  const derivedUnitDefinition = DERIVED_UNIT_DEFINITION_BY_NAME[unit.name] ?? {};
  return {
    ...definition,
    ...unit,
    image: unit.image ?? definition.image ?? HERO_IMAGE_BY_NAME[unit.name] ?? "",
    skill: unit.skill || definition.skill || derivedUnitDefinition.skill || "",
    effectId:
      unit.effectId ??
      definition.effectId ??
      unit.skillEffectIds?.[0] ??
      derivedUnitDefinition.effectId ??
      null,
    equipment: cloneDirectModifier(unit.equipment),
    statuses: cloneDirectModifier(unit.statuses ?? {}),
    extraFactions: [...(unit.extraFactions ?? [])],
    tempExtraFactions: [...(unit.tempExtraFactions ?? [])],
    usesBondDefinitionSnapshot: true,
    health: Math.max(0, unit.health),
    skillDisabled:
      Boolean(unit.skillDisabled) ||
      unit.skillDisabledUntilExchange === exchange,
  };
}

function getBattleTeamCardSlots(units, side) {
  const visibleUnits =
    side === "player"
      ? units.slice(-LINEUP_SLOT_COUNT)
      : units.slice(0, LINEUP_SLOT_COUNT);
  const emptySlots = Array.from(
    { length: Math.max(0, LINEUP_SLOT_COUNT - visibleUnits.length) },
    () => null,
  );
  return side === "player"
      ? [...emptySlots, ...visibleUnits]
      : [...visibleUnits, ...emptySlots];
}

function getBattleTeamSlotMap(units, side) {
  return new Map(
    getBattleTeamCardSlots(units ?? [], side)
      .map((unit, slotIndex) => (unit ? [unit.id, slotIndex] : null))
      .filter(Boolean),
  );
}

function getBattleAdvanceMovements(beforeSnapshot, afterSnapshot) {
  return ["player", "enemy"].flatMap((side) => {
    const beforeSlots = getBattleTeamSlotMap(beforeSnapshot?.[side] ?? [], side);
    const afterSlots = getBattleTeamSlotMap(afterSnapshot?.[side] ?? [], side);
    return [...afterSlots.entries()]
      .filter(
        ([unitId, toSlot]) =>
          beforeSlots.has(unitId) && beforeSlots.get(unitId) !== toSlot,
      )
      .map(([unitId, toSlot]) => ({
        unitId,
        side,
        fromSlot: beforeSlots.get(unitId),
        toSlot,
      }));
  });
}

function renderBattleTeams(battle) {
  const snapshot = getSelectedBattleSnapshot(battle);
  battle.selectedExchange = snapshot.exchange;
  const roundLabel =
    snapshot.exchange === 0
      ? " · 战斗开始前"
      : Number.isInteger(snapshot.exchange)
        ? ` · 第 ${snapshot.exchange} 轮交锋前`
        : "";
  const renderTeam = (title, units, side) => {
    const frontUnit = side === "player" ? units.at(-1) : units[0];
    const cardSlots = getBattleTeamCardSlots(units, side);
    return `
      <section class="battle-team battle-team-${side}">
        <h3>${title}${roundLabel}</h3>
        <div class="battle-card-row" data-side="${side}">
          ${cardSlots
            .map(
              (unit, slotIndex) => {
                if (!unit) {
                  return `<article class="battle-card-slot empty" aria-label="${
                    side === "player" ? "我方" : "敌方"
                  }第 ${slotIndex + 1} 个空位"><span>空位</span></article>`;
                }
                const isFront = unit.id === frontUnit?.id;
                const cardUnit = getBattleSnapshotCardUnit(unit, snapshot.exchange);
                return `<article class="battle-card-slot occupied${
                  isFront ? " front" : ""
                }" data-unit-id="${escapeBattleReportHtml(unit.id)}">
                  ${createHeroCardMarkup(cardUnit, { battleSnapshot: true })}
                  ${isFront ? '<em class="battle-card-front-marker">前排</em>' : ""}
                </article>`;
              },
            )
            .join("")}
        </div>
      </section>
    `;
  };
  elements.battleTeams.innerHTML =
    renderTeam("我方战斗副本", snapshot.player, "player") +
    '<div class="battle-versus" aria-hidden="true"><strong>VS</strong></div>' +
    renderTeam(
      battle.enemySource?.type === "opponent-pool"
        ? `对手数据池 · ${escapeBattleReportHtml(battle.enemySource.label ?? "未知数据")}`
        : "测试骑兵敌军",
      snapshot.enemy,
      "enemy",
    );
}

function getBattleExchangeSequence(battle) {
  return [
    0,
    ...new Set(
      (battle?.roundSnapshots ?? [])
        .map((snapshot) => snapshot.exchange)
        .filter(Number.isInteger),
    ),
  ].sort((left, right) => left - right);
}

function getNextBattleExchange(battle) {
  const sequence = getBattleExchangeSequence(battle);
  const currentIndex = sequence.indexOf(battle?.selectedExchange ?? 0);
  return currentIndex >= 0 && currentIndex < sequence.length - 1
    ? sequence[currentIndex + 1]
    : null;
}

function updateBattleExchangeControls(battle) {
  if (!elements.nextExchangeButton) return;
  const nextExchange = getNextBattleExchange(battle);
  elements.nextExchangeButton.disabled = !Number.isInteger(nextExchange);
  elements.nextExchangeButton.textContent = Number.isInteger(nextExchange)
    ? `查看第${nextExchange}轮交锋`
    : "已到最后一轮";
}

function selectBattleExchange(exchange) {
  const battle = state.battle;
  if (
    !battle ||
    (exchange !== 0 &&
      !battle.roundSnapshots?.some((snapshot) => snapshot.exchange === exchange))
  ) {
    return;
  }
  battle.selectedExchange = exchange;
  renderBattleTeams(battle);
  elements.battleLog.querySelectorAll(".battle-report-round").forEach((round) => {
    const selected = Number.parseInt(round.dataset.exchange ?? "", 10) === exchange;
    round.classList.toggle("selected", selected);
    round.setAttribute("aria-pressed", String(selected));
  });
  updateBattleExchangeControls(battle);
}

function selectNextBattleExchange() {
  const battle = state.battle;
  if (!battle) return;
  const nextExchange = getNextBattleExchange(battle);
  if (!Number.isInteger(nextExchange)) return;
  selectBattleExchange(nextExchange);
  elements.battleLog
    ?.querySelector(`.battle-report-round[data-exchange="${nextExchange}"]`)
    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function getBattleAnimationVisibleSnapshot(snapshot, removedUnitIds) {
  if (!snapshot || removedUnitIds.size === 0) return snapshot;
  return {
    ...snapshot,
    player: (snapshot.player ?? []).filter(
      (unit) => !removedUnitIds.has(unit.id),
    ),
    enemy: (snapshot.enemy ?? []).filter(
      (unit) => !removedUnitIds.has(unit.id),
    ),
  };
}

function buildBattleAnimationSteps(presentationTimeline) {
  const removedUnitIds = new Set();
  const steps = [];
  presentationTimeline.forEach((step) => {
    const isLeaveTransition = step.kind === "leave";
    const isSkippedAnimationStep = Boolean(step.animationSkip);
    const isDuplicateConsumedDeath = (step.entries ?? []).some(
      (entry) => entry.type === "death" && step.kind === "consume",
    );
    if (!isLeaveTransition && !isSkippedAnimationStep && !isDuplicateConsumedDeath) {
      steps.push({
        ...step,
        entries: (step.entries ?? []).filter((entry) => !entry.animationSkip),
        beforeSnapshot: getBattleAnimationVisibleSnapshot(
          step.beforeSnapshot,
          removedUnitIds,
        ),
        snapshot: getBattleAnimationVisibleSnapshot(
          step.snapshot,
          removedUnitIds,
        ),
        afterSnapshot: getBattleAnimationVisibleSnapshot(
          step.afterSnapshot,
          removedUnitIds,
        ),
      });
    }
    (step.deathIds ?? []).forEach((unitId) => removedUnitIds.add(unitId));
  });
  return steps;
}

function getBattleAnimationSteps(battle) {
  if (Array.isArray(battle.presentationTimeline) && battle.presentationTimeline.length > 0) {
    const timelineVersion = `${battle.presentationTimeline.length}:${
      battle.presentationTimeline.at(-1)?.id ?? ""
    }`;
    if (
      !Array.isArray(battle.animationSteps) ||
      battle.animationTimelineVersion !== timelineVersion
    ) {
      battle.animationSteps = buildBattleAnimationSteps(
        battle.presentationTimeline,
      );
      battle.animationTimelineVersion = timelineVersion;
    }
    return battle.animationSteps;
  }
  if (Array.isArray(battle.animationSteps)) return battle.animationSteps;
  const entries = (battle.structuredLog ?? []).filter(
    (entry) => entry.message && !entry.animationSkip,
  );
  const openingEntries = entries.filter(
    (entry) => !Number.isInteger(entry.exchange) && entry.type !== "result",
  );
  const steps = openingEntries.map((entry, index) => ({
    id: `opening-${index}`,
    kind: "opening",
    phase: entry.phase ?? entry.trigger ?? "battle:start",
    title:
      entry.type === "hero-skill"
        ? `${entry.ownerName || "武将"} · ${entry.skillName || "技能触发"}`
        : entry.type === "bond"
          ? entry.sourceName || BOND_RULES[entry.faction]?.label || "羁绊效果"
          : entry.type === "equipment"
            ? entry.sourceName || "装备效果"
            : entry.type === "damage"
              ? `${entry.sourceName || "效果"}造成伤害`
              : "战斗准备",
    entries: [entry],
  }));

  if (steps.length === 0) {
    steps.push({
      id: "opening-ready",
      kind: "opening",
      phase: "battle:start",
      title: "双方准备交锋",
      entries: [],
    });
  }

  (battle.roundSnapshots ?? []).forEach((snapshot) => {
    const roundEntries = entries.filter((entry) => entry.exchange === snapshot.exchange);
    steps.push({
      id: `exchange-${snapshot.exchange}`,
      kind: "exchange",
      phase: "battle",
      title: `第 ${snapshot.exchange} 轮 · 卡牌对撞`,
      exchange: snapshot.exchange,
      snapshot,
      entries: roundEntries,
    });
  });

  const resultEntries = entries.filter((entry) => entry.type === "result");
  steps.push({
    id: "battle-result",
    kind: "result",
    phase: "battle:end",
    title:
      battle.result === "win"
        ? "我方取得胜利"
        : battle.result === "loss"
          ? "我方战斗失败"
          : "本场战斗平局",
    entries: resultEntries,
  });
  battle.animationSteps = steps;
  return steps;
}

function getBattleAnimationPhaseLabel(step) {
  if (step.kind === "ready") return "战斗准备";
  if (step.kind === "clash") return `第 ${step.exchange} 轮 · 同时交锋`;
  if (step.kind === "exchange") return `第 ${step.exchange} 轮交锋`;
  if (step.kind === "advance") return `第 ${step.exchange} 轮 · 阵容补位`;
  if (step.kind === "result") return "战斗结果";
  if (step.kind === "death" || step.kind === "consume" || step.kind === "leave") {
    return Number.isInteger(step.exchange) && step.exchange > 0
      ? `第 ${step.exchange} 轮 · 阵亡结算`
      : "战斗开始 · 阵亡结算";
  }
  if (Number.isInteger(step.exchange) && step.exchange > 0) {
    const timingLabel =
      step.timingWindow === "attack:before"
        ? "攻击前"
        : step.timingWindow === "damage:after"
          ? "伤害后"
          : step.timingWindow === "attack:after"
            ? "攻击后"
            : step.timingWindow === "unit:death"
              ? "阵亡结算"
              : step.timingWindow === "status:apply"
                ? "状态连锁"
                : "技能结算";
    return `第 ${step.exchange} 轮 · ${timingLabel}`;
  }
  if (step.phase === "round:end") return "回合结束效果";
  if (
    step.phase === "battle:start" ||
    step.timingWindow === "battle:start"
  ) {
    return "战斗开始技能";
  }
  if (
    step.phase === "battle:start:end" ||
    step.timingWindow === "battle:start:end"
  ) {
    return "战斗开始阶段结束";
  }
  return getEventDisplayName(step.phase) || "战前结算";
}

function renderBattleAnimationContextRow(step, position) {
  const labels = {
    previous: "上一条操作",
    current: "当前操作",
    next: "下一条操作",
  };
  const emptyCopy = {
    previous: "已经是本场战斗的第一条操作",
    current: "暂无战斗操作",
    next: "已经是本场战斗的最后一条操作",
  };
  const currentAttribute = position === "current" ? ' aria-current="step"' : "";
  if (!step) {
    return `
      <div class="battle-animation-context-row is-${position} is-empty"${currentAttribute}>
        <span class="battle-animation-context-position">${labels[position]}</span>
        <span class="battle-animation-context-phase">—</span>
        <strong>${emptyCopy[position]}</strong>
      </div>
    `;
  }
  const title = getEscapedGameTextMarkup(step.title || step.description || "战斗操作");
  return `
    <div class="battle-animation-context-row is-${position}"${currentAttribute}>
      <span class="battle-animation-context-position">${labels[position]}</span>
      <span class="battle-animation-context-phase">${escapeBattleReportHtml(
        getBattleAnimationPhaseLabel(step),
      )}</span>
      <strong>${title}</strong>
    </div>
  `;
}

function renderBattleAnimationContextList(steps, currentIndex) {
  return [
    renderBattleAnimationContextRow(steps[currentIndex - 1], "previous"),
    renderBattleAnimationContextRow(steps[currentIndex], "current"),
    renderBattleAnimationContextRow(steps[currentIndex + 1], "next"),
  ].join("");
}

function getBattleAnimationSnapshot(battle, step) {
  if (step.snapshot) return step.snapshot;
  if (step.afterSnapshot) return step.afterSnapshot;
  if (step.kind === "result") {
    return {
      exchange: battle.roundSnapshots?.at(-1)?.exchange ?? 0,
      player: battle.playerEnd ?? [],
      enemy: battle.enemyEnd ?? [],
    };
  }
  return {
    exchange: 0,
    player: battle.playerStart ?? [],
    enemy: battle.enemyStart ?? [],
  };
}

function getBattleAnimationEffectName(entry) {
  return (
    entry?.skillName ||
    (entry?.sourceEffectId?.startsWith("bond.")
      ? Object.values(BOND_RULES).find((bond) =>
          bond.effectIds?.includes(entry.sourceEffectId),
        )?.label
      : "") ||
    (entry?.type === "bond" ? BOND_RULES[entry.faction]?.label : "") ||
    entry?.sourceName ||
    ""
  );
}

function getBattleBondFactionByEffectId(effectId) {
  if (!effectId) return null;
  return (
    BOND_FACTIONS.find((faction) =>
      BOND_RULES[faction]?.effectIds?.includes(effectId),
    ) ?? null
  );
}

function getBattleAnimationTriggeredBonds(step, snapshot) {
  const triggered = {
    player: new Set(),
    enemy: new Set(),
  };
  const snapshotUnits = [
    ...(snapshot?.player ?? []),
    ...(snapshot?.enemy ?? []),
    ...(step.beforeSnapshot?.player ?? []),
    ...(step.beforeSnapshot?.enemy ?? []),
  ];
  const addTriggeredBond = (effectId, details = {}) => {
    const faction = getBattleBondFactionByEffectId(effectId);
    if (!faction) return;
    const sides = new Set(
      [
        details.sourceSide,
        details.ownerSide,
        details.unitSide,
        details.side,
      ].filter((side) => side === "player" || side === "enemy"),
    );
    if (sides.size === 0) {
      (step.sourceIds ?? []).forEach((unitId) => {
        const side = snapshotUnits.find((unit) => unit.id === unitId)?.side;
        if (side === "player" || side === "enemy") sides.add(side);
      });
    }
    if (sides.size === 0 && faction === "魏") {
      ["player", "enemy"].forEach((side) => {
        const beforeCount =
          step.beforeSnapshot?.bondCounters?.[side]?.魏阵亡 ?? 0;
        const afterCount = snapshot?.bondCounters?.[side]?.魏阵亡 ?? 0;
        if (beforeCount !== afterCount) sides.add(side);
      });
    }
    if (
      sides.size === 0 &&
      (details.targetSide === "player" || details.targetSide === "enemy")
    ) {
      sides.add(
        faction === "吴"
          ? getOpposingSide(details.targetSide)
          : details.targetSide,
      );
    }
    sides.forEach((side) => triggered[side].add(faction));
  };

  (step.entries ?? []).forEach((entry) => {
    addTriggeredBond(entry.effectId, entry);
    addTriggeredBond(entry.sourceEffectId, entry);
    (entry.modifiers ?? []).forEach((modifier) =>
      addTriggeredBond(modifier.effectId, entry),
    );
    addTriggeredBond(step.effectId, entry);
  });
  if ((step.entries ?? []).length === 0) {
    addTriggeredBond(step.effectId);
  }

  return {
    player: [...triggered.player],
    enemy: [...triggered.enemy],
  };
}

function getBattleAnimationFieldState(battle, step, snapshot) {
  const sources = [];
  const targets = [];
  const deaths = [];
  const popups = [];
  const addIdentity = (collection, id, name) => {
    if (id) {
      collection.push({ id, name: null });
    } else if (name) {
      collection.push({ id: null, name });
    }
  };
  const addPopup = (id, name, text, tone = "effect", details = {}) => {
    if (!text || (!id && !name)) return;
    popups.push({ id: id ?? null, name: name ?? null, text, tone, ...details });
  };
  const findStepUnit = (unitId) =>
    ["player", "enemy"]
      .flatMap((side) => [
        ...(snapshot?.[side] ?? []),
        ...(step.beforeSnapshot?.[side] ?? []),
      ])
      .find((unit) => unit.id === unitId) ?? null;

  (step.sourceIds ?? []).forEach((unitId) =>
    addIdentity(sources, unitId, findStepUnit(unitId)?.name),
  );
  (step.targetIds ?? []).forEach((unitId) =>
    addIdentity(targets, unitId, findStepUnit(unitId)?.name),
  );
  (step.deathIds ?? []).forEach((unitId) =>
    addIdentity(deaths, unitId, findStepUnit(unitId)?.name),
  );
  (step.cues ?? []).forEach((cue) =>
    addPopup(cue.unitId, findStepUnit(cue.unitId)?.name, cue.text, cue.tone, cue),
  );

  (step.entries ?? []).forEach((entry) => {
    addIdentity(
      sources,
      entry.ownerId ?? entry.sourceUnitId,
      entry.ownerName ?? entry.sourceName,
    );
    addIdentity(
      targets,
      entry.targetUnitId ?? entry.deadUnitId ?? entry.unitId,
      entry.targetName ?? entry.deadUnitName ?? entry.unitName,
    );

    if ((step.cues ?? []).length > 0) return;
    if (entry.type === "hero-skill") {
      addPopup(
        entry.ownerId ?? entry.sourceUnitId,
        entry.ownerName ?? entry.sourceName,
        `【${entry.skillName || "技能"}】`,
        "skill",
      );
    } else if (entry.type === "damage" && Number.isFinite(entry.damage)) {
      addPopup(
        entry.targetUnitId,
        entry.targetName,
        `-${entry.damage}`,
        "damage",
        {
          damageAmount: entry.damage,
          damageType: entry.damageType,
        },
      );
    } else if (entry.type === "status") {
      addPopup(
        entry.targetUnitId ?? entry.unitId,
        entry.targetName ?? entry.unitName,
        entry.statusName || STATUS_LABELS[entry.statusId] || "状态变化",
        "status",
      );
    } else if (entry.type === "death") {
      addIdentity(
        deaths,
        entry.deadUnitId ?? entry.unitId,
        entry.deadUnitName ?? entry.unitName,
      );
      addPopup(
        entry.deadUnitId ?? entry.unitId,
        entry.deadUnitName ?? entry.unitName,
        "阵亡",
        "death",
      );
    } else if (entry.type === "summon") {
      addPopup(entry.unitId, entry.unitName, "召唤", "buff");
    }
  });

  const summary = (step.entries ?? []).find((entry) => entry.type === "round-summary");
  const actorUnits = (step.actorIds ?? [])
    .map(findStepUnit)
    .filter(Boolean);
  const ally =
    actorUnits.find((unit) => unit.side === "player") ??
    snapshot.player?.find((unit) => unit.id === summary?.ally?.id) ??
    (step.kind === "exchange" ? snapshot.player?.at(-1) : null);
  const foe =
    actorUnits.find((unit) => unit.side === "enemy") ??
    snapshot.enemy?.find((unit) => unit.id === summary?.foe?.id) ??
    (step.kind === "exchange" ? snapshot.enemy?.[0] : null);
  if (step.kind === "exchange") {
    addIdentity(sources, ally?.id, ally?.name);
    addIdentity(sources, foe?.id, foe?.name);
    addIdentity(targets, ally?.id, ally?.name);
    addIdentity(targets, foe?.id, foe?.name);
    addPopup(
      ally?.id,
      ally?.name,
      `-${summary?.damageToPlayer?.finalAmount ?? 0}`,
      "damage",
    );
    addPopup(
      foe?.id,
      foe?.name,
      `-${summary?.damageToEnemy?.finalAmount ?? 0}`,
      "damage",
    );
    if (summary?.ally?.alive === false) addIdentity(deaths, ally?.id, ally?.name);
    if (summary?.foe?.alive === false) addIdentity(deaths, foe?.id, foe?.name);
  }

  return {
    sources,
    targets,
    deaths,
    popups,
    ally,
    foe,
    changedUnitIds: [
      ...new Set(
        (step.changes ?? [])
          .map((change) => change.unitId)
          .filter(Boolean),
      ),
    ],
    effectName:
      step.effectName ||
      getBattleAnimationEffectName((step.entries ?? [])[0]) ||
      step.title,
    movements: step.movements ?? [],
    triggeredBonds: getBattleAnimationTriggeredBonds(step, snapshot),
  };
}

function battleAnimationIdentityMatches(unit, identities) {
  return identities.some(
    (identity) =>
      identity.id
        ? identity.id === unit.id
        : Boolean(identity.name && identity.name === unit.name),
  );
}

function renderBattleAnimationFieldCard(unit, side, exchange, fieldState, slotIndex) {
  if (!unit) {
    return `<article class="battle-field-slot empty" aria-label="${
      side === "player" ? "我方" : "敌方"
    }第 ${slotIndex + 1} 个空位"><span>空</span></article>`;
  }
  const isSource = battleAnimationIdentityMatches(unit, fieldState.sources);
  const isTarget = battleAnimationIdentityMatches(unit, fieldState.targets);
  const isDead = battleAnimationIdentityMatches(unit, fieldState.deaths);
  const movement = (fieldState.movements ?? []).find(
    (entry) => entry.unitId === unit.id && entry.side === side,
  );
  const isClashing =
    fieldState.ally?.id === unit.id || fieldState.foe?.id === unit.id;
  const unitPopups = fieldState.popups.filter((popup) =>
    battleAnimationIdentityMatches(unit, [popup]),
  );
  const cardUnit = getBattleSnapshotCardUnit(unit, exchange);
  return `
    <article
      class="battle-field-slot occupied ${side}${
        isSource ? " is-source" : ""
      }${isTarget ? " is-target" : ""}${isClashing ? " is-clashing" : ""}${
        isDead ? " is-defeated" : ""
      }${movement ? " is-advancing" : ""}"
      data-unit-id="${escapeBattleReportHtml(unit.id)}"
      ${
        movement
          ? `style="--battle-advance-offset: ${movement.fromSlot - movement.toSlot};"`
          : ""
      }
    >
      <div class="battle-field-card">
        ${createHeroCardMarkup(cardUnit, { battleSnapshot: true })}
      </div>
      ${
        isDead
          ? `<div class="battle-field-smoke" aria-hidden="true">${Array.from(
              { length: 7 },
              () => "<i></i>",
            ).join("")}</div>`
          : ""
      }
      <div class="battle-field-popups">
        ${unitPopups
          .map(
            (popup) => renderBattlePopupMarkup(popup),
          )
          .join("")}
      </div>
    </article>
  `;
}

function getBattleAnimationWeiProgress(step, snapshot, side) {
  const counterEntry = (step.entries ?? []).find(
    (entry) =>
      getBattleBondFactionByEffectId(entry.effectId) === "魏" &&
      entry.ownerSide === side &&
      Number.isFinite(entry.summonProgress),
  );
  if (counterEntry) return counterEntry.summonProgress;
  const deathCount = snapshot?.bondCounters?.[side]?.魏阵亡 ?? 0;
  return Math.max(0, deathCount % 4);
}

function renderBattleAnimationFieldBonds(
  battle,
  side,
  step,
  snapshot,
  fieldState,
) {
  const activeBonds = BOND_FACTIONS.map((faction) => ({
    faction,
    effectCount: battle.lockedBonds?.[side]?.[faction] ?? 0,
  })).filter((entry) => entry.effectCount > 0);
  const sideLabel = side === "player" ? "我方" : "敌方";
  if (activeBonds.length === 0) {
    return `<div class="battle-field-bonds empty" aria-label="${sideLabel}无激活羁绊">无激活羁绊</div>`;
  }
  return `
    <div class="battle-field-bonds" aria-label="${sideLabel}激活羁绊">
      ${activeBonds
        .map(({ faction, effectCount }) => {
          const bond = BOND_RULES[faction];
          const triggered = fieldState.triggeredBonds?.[side]?.includes(faction);
          const effectLabel = `${effectCount}人效果`;
          const weiProgress =
            faction === "魏"
              ? `<span class="battle-field-bond-progress">召唤 ${getBattleAnimationWeiProgress(
                  step,
                  snapshot,
                  side,
                )}/4</span>`
              : "";
          return `
            <article
              class="battle-field-bond${triggered ? " is-triggered" : ""}"
              data-faction="${faction}"
              aria-label="${escapeBattleReportHtml(
                `${bond.label} ${effectLabel}：${bond.effects[effectCount]}${
                  triggered ? "，当前正在触发" : ""
                }`,
              )}"
            >
              <div class="battle-field-bond-title">
                <strong>${escapeBattleReportHtml(bond.label)}</strong>
                <em>${effectLabel}</em>
                ${weiProgress}
              </div>
              <p>${getBondDescriptionMarkup(bond.effects[effectCount])}</p>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderBattleAnimationFieldTeam(
  units,
  side,
  exchange,
  fieldState,
) {
  const slots = getBattleTeamCardSlots(units ?? [], side);
  const livingCount = (units ?? []).filter((unit) => unit.health > 0).length;
  return `
    <section class="battle-field-team ${side}">
      <header>
        <span>${side === "player" ? "我方阵容" : "敌方阵容"}</span>
        <small>${livingCount} 名存活</small>
      </header>
      <div class="battle-field-cards">
        ${slots
          .map((unit, slotIndex) =>
            renderBattleAnimationFieldCard(
              unit,
              side,
              exchange,
              fieldState,
              slotIndex,
            ),
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderBattleAnimationFatePanel(
  battle,
  side,
  step,
  snapshot,
  fieldState,
) {
  const activeCount = BOND_FACTIONS.filter(
    (faction) => (battle.lockedBonds?.[side]?.[faction] ?? 0) > 0,
  ).length;
  const sideLabel = side === "player" ? "我方" : "敌方";
  return `
    <aside class="battle-fate-summary ${side}" aria-label="${sideLabel}缘分技能">
      <header>
        <strong>${sideLabel}缘分</strong>
        <small>${activeCount > 0 ? `${activeCount} 项技能生效` : "尚未激活技能"}</small>
      </header>
      ${renderBattleAnimationFieldBonds(
        battle,
        side,
        step,
        snapshot,
        fieldState,
      )}
    </aside>
  `;
}

function renderBattleAnimationBattlefield(battle, step) {
  const snapshot = getBattleAnimationSnapshot(battle, step);
  const fieldState = getBattleAnimationFieldState(battle, step, snapshot);
  const resultClass =
    battle.result === "win" ? "win" : battle.result === "loss" ? "loss" : "draw";
  const centerContent =
    step.kind === "result"
      ? `<div class="battle-field-result-mark ${resultClass}">${
          battle.result === "win" ? "胜" : battle.result === "loss" ? "败" : "平"
        }</div>`
      : "";
  return `
    <div class="battle-animation-field">
      ${renderBattleAnimationFatePanel(
        battle,
        "player",
        step,
        snapshot,
        fieldState,
      )}
      ${renderBattleAnimationFatePanel(
        battle,
        "enemy",
        step,
        snapshot,
        fieldState,
      )}
      <div class="battle-field-armies">
        ${renderBattleAnimationFieldTeam(
          snapshot.player,
          "player",
          snapshot.exchange ?? 0,
          fieldState,
        )}
        <div class="battle-field-divider" aria-hidden="true"></div>
        ${renderBattleAnimationFieldTeam(
          snapshot.enemy,
          "enemy",
          snapshot.exchange ?? 0,
          fieldState,
        )}
      </div>
      ${
        centerContent
          ? `<div class="battle-field-center ${step.kind}">${centerContent}</div>`
          : ""
      }
      ${
        step.kind === "result"
          ? `<div class="battle-field-result-copy ${resultClass}">
              <strong>${escapeBattleReportHtml(step.title)}</strong>
              <small>完整过程可切换到“查看战报”逐条回看</small>
            </div>`
          : ""
      }
    </div>
  `;
}

function getBattleSkillAudioCue(step) {
  const key = String(step?.effectId || step?.effectName || step?.title || "battle-skill");
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return `battleSkill${(hash % 5) + 1}`;
}

function playBattleAnimationStepAudio(battle, step) {
  if (!battle || !step || battle.view !== "animation" || battle.lastAudioStepId === step.id) {
    return;
  }
  battle.lastAudioStepId = step.id;

  let cueName = null;
  if (step.kind === "ready") {
    cueName = "battleReady";
  } else if (step.kind === "clash" || step.kind === "exchange") {
    cueName = "battleClash";
  } else if (step.kind === "damage") {
    cueName = "battleDamage";
  } else if (step.kind === "death" || step.kind === "consume") {
    cueName = "battleDeath";
  } else if (step.kind === "advance") {
    cueName = "cardMove";
  } else if (["skill", "bond", "equipment", "effect"].includes(step.kind)) {
    cueName = getBattleSkillAudioCue(step);
  } else if (step.kind === "result") {
    cueName =
      battle.result === "win"
        ? "battleVictory"
        : battle.result === "loss"
          ? "battleDefeat"
          : "uiCancel";
  } else if ((step.entries ?? []).some((entry) => entry.type === "damage")) {
    cueName = "battleDamage";
  }

  if (!cueName) return;
  const speed = getBattleAnimationSpeed(battle.animationSpeed);
  playAudioCue(cueName, { playbackRate: Math.min(1.25, 1 + (speed - 1) * 0.05) });
}

function getBattleAnimationSpeed(value) {
  const speed = Number(value);
  return BATTLE_ANIMATION_SPEEDS.includes(speed)
    ? speed
    : BATTLE_ANIMATION_SPEEDS[0];
}

function getBattleAnimationStepDuration(step) {
  return (
    step.durationMs ??
    (step.kind === "exchange" || step.kind === "clash"
      ? 2500
      : step.kind === "result"
        ? 2600
        : 1500)
  );
}

function syncBattleAnimationSpeedControl(battle) {
  const speed = getBattleAnimationSpeed(
    battle?.animationSpeed ?? battleAnimationPlaybackSpeed,
  );
  if (battle) battle.animationSpeed = speed;
  if (elements.battleAnimationSpeed) {
    elements.battleAnimationSpeed.value = String(
      BATTLE_ANIMATION_SPEEDS.indexOf(speed),
    );
    elements.battleAnimationSpeed.setAttribute("aria-valuetext", `${speed}倍速`);
  }
  if (elements.battleAnimationSpeedValue) {
    elements.battleAnimationSpeedValue.textContent = `${speed}×`;
  }
  if (elements.battleAnimationFastForward) {
    elements.battleAnimationFastForward.setAttribute(
      "aria-label",
      `切换战斗动画倍速，当前${speed}倍速`,
    );
  }
}

function applyBattleAnimationPlaybackSpeed(speed) {
  if (typeof elements.battleAnimationStage?.getAnimations !== "function") return;
  elements.battleAnimationStage
    .getAnimations({ subtree: true })
    .forEach((animation) => {
      animation.playbackRate = speed;
    });
}

function scheduleBattleAnimation(battle, step, remainingBaseDuration = null) {
  window.clearTimeout(battleAnimationTimer);
  battleAnimationTimer = 0;
  battle.animationTimerStartedAt = 0;
  battle.animationTimerBaseDuration = 0;
  if (!battle.animationPlaying || battle.view !== "animation") return;
  const speed = getBattleAnimationSpeed(battle.animationSpeed);
  const baseDuration =
    remainingBaseDuration ?? getBattleAnimationStepDuration(step);
  battle.animationTimerStartedAt = performance.now();
  battle.animationTimerBaseDuration = baseDuration;
  battleAnimationTimer = window.setTimeout(() => {
    battle.animationTimerStartedAt = 0;
    battle.animationTimerBaseDuration = 0;
    const steps = getBattleAnimationSteps(battle);
    if (battle.animationIndex >= steps.length - 1) {
      battle.animationPlaying = false;
      renderBattleAnimationStep(battle);
      return;
    }
    battle.animationIndex += 1;
    renderBattleAnimationStep(battle);
  }, baseDuration / speed);
}

function setBattleAnimationSpeedFromControl() {
  const sliderIndex = Math.min(
    BATTLE_ANIMATION_SPEEDS.length - 1,
    Math.max(0, Math.round(Number(elements.battleAnimationSpeed?.value) || 0)),
  );
  const speed = BATTLE_ANIMATION_SPEEDS[sliderIndex];
  const battle = state.battle;
  const previousSpeed = getBattleAnimationSpeed(
    battle?.animationSpeed ?? battleAnimationPlaybackSpeed,
  );
  let remainingBaseDuration = null;
  if (
    battle?.animationPlaying &&
    battle.view === "animation" &&
    battle.animationTimerStartedAt > 0
  ) {
    const elapsed = Math.max(0, performance.now() - battle.animationTimerStartedAt);
    remainingBaseDuration = Math.max(
      0,
      battle.animationTimerBaseDuration - elapsed * previousSpeed,
    );
  }
  battleAnimationPlaybackSpeed = speed;
  if (battle) battle.animationSpeed = speed;
  playAudioCue("battleSpeed");
  syncBattleAnimationSpeedControl(battle);
  applyBattleAnimationPlaybackSpeed(speed);
  if (battle?.animationPlaying && battle.view === "animation") {
    const steps = getBattleAnimationSteps(battle);
    scheduleBattleAnimation(
      battle,
      steps[battle.animationIndex],
      remainingBaseDuration,
    );
  }
}

function cycleBattleAnimationSpeed() {
  if (!elements.battleAnimationSpeed) return;
  const currentIndex = Math.min(
    BATTLE_ANIMATION_SPEEDS.length - 1,
    Math.max(0, Math.round(Number(elements.battleAnimationSpeed.value) || 0)),
  );
  elements.battleAnimationSpeed.value = String(
    (currentIndex + 1) % BATTLE_ANIMATION_SPEEDS.length,
  );
  setBattleAnimationSpeedFromControl();
}

function renderBattleAnimationStep(battle) {
  if (!elements.battleAnimationStage) return;
  const steps = getBattleAnimationSteps(battle);
  battle.animationIndex = Math.min(
    Math.max(0, battle.animationIndex ?? 0),
    Math.max(0, steps.length - 1),
  );
  const step = steps[battle.animationIndex];
  elements.battleAnimationPhase.textContent = getBattleAnimationPhaseLabel(step);
  elements.battleAnimationProgress.textContent = `${battle.animationIndex + 1} / ${steps.length}`;
  elements.battleAnimationStage.className = `battle-animation-stage is-${step.kind}`;
  elements.battleAnimationStage.innerHTML = renderBattleAnimationBattlefield(
    battle,
    step,
  );
  syncBattleAnimationSpeedControl(battle);
  applyBattleAnimationPlaybackSpeed(battle.animationSpeed);
  elements.battleAnimationEvents.innerHTML = renderBattleAnimationContextList(
    steps,
    battle.animationIndex,
  );
  elements.battleAnimationPrevious.disabled = battle.animationIndex === 0;
  elements.battleAnimationNext.disabled = battle.animationIndex >= steps.length - 1;
  playBattleAnimationStepAudio(battle, step);
  const playLabel = battle.animationPlaying
    ? "暂停"
    : battle.animationIndex >= steps.length - 1
      ? "从头播放"
      : "继续";
  const playLabelElement =
    elements.battleAnimationPlay?.querySelector(".battle-operation-label");
  if (playLabelElement) {
    playLabelElement.textContent = playLabel;
  } else if (elements.battleAnimationPlay) {
    elements.battleAnimationPlay.textContent = playLabel;
  }
  elements.battleAnimationPlay?.classList.toggle(
    "is-active",
    battle.animationPlaying,
  );
  elements.battleAnimationPlay?.setAttribute("aria-label", playLabel);

  if (step.kind === "exchange" || step.kind === "clash") {
    battle.selectedExchange = step.exchange;
    renderBattleTeams(battle);
  } else if (step.kind === "opening" || step.exchange === 0) {
    battle.selectedExchange = 0;
    renderBattleTeams(battle);
  }
  scheduleBattleAnimation(battle, step);
}

function setBattleAnimationIndex(index, { keepPlaying = false } = {}) {
  const battle = state.battle;
  if (!battle) return;
  const steps = getBattleAnimationSteps(battle);
  battle.animationIndex = Math.min(Math.max(0, index), steps.length - 1);
  if (!keepPlaying) battle.animationPlaying = false;
  renderBattleAnimationStep(battle);
}

function toggleBattleAnimationPlayback() {
  const battle = state.battle;
  if (!battle) return;
  const steps = getBattleAnimationSteps(battle);
  if (!battle.animationPlaying && battle.animationIndex >= steps.length - 1) {
    battle.animationIndex = 0;
  }
  battle.animationPlaying = !battle.animationPlaying;
  renderBattleAnimationStep(battle);
}

function replayBattleAnimation() {
  const battle = state.battle;
  if (!battle) return;
  battle.animationIndex = 0;
  battle.animationPlaying = true;
  battle.lastAudioStepId = null;
  setBattleView("animation");
  renderBattleAnimationStep(battle);
}

function skipBattleAnimation() {
  const battle = state.battle;
  if (!battle) return;
  const steps = getBattleAnimationSteps(battle);
  setBattleAnimationIndex(steps.length - 1);
}

function setBattleView(view) {
  const battle = state.battle;
  if (!battle) return;
  battle.view = view === "report" ? "report" : "animation";
  const showAnimation = battle.view === "animation";
  elements.battleAnimation.hidden = !showAnimation;
  elements.battleLog.hidden = showAnimation;
  elements.nextExchangeButton.hidden = showAnimation;
  elements.battleAnimationTab.classList.toggle("active", showAnimation);
  elements.battleReportTab.classList.toggle("active", !showAnimation);
  elements.battleAnimationTab.setAttribute("aria-selected", String(showAnimation));
  elements.battleReportTab.setAttribute("aria-selected", String(!showAnimation));
  if (elements.battleLineupPanel) {
    elements.battleLineupPanel.hidden = showAnimation;
    elements.battleLineupPanel.open = !showAnimation;
  }
  if (!showAnimation) {
    battle.animationPlaying = false;
    window.clearTimeout(battleAnimationTimer);
    battleAnimationTimer = 0;
  } else {
    renderBattleAnimationStep(battle);
  }
}

function renderBattle() {
  if (!elements.battleOverlay) return;
  const battle = state.battle;
  elements.battleOverlay.hidden = state.phase !== "battle" || !battle || state.gameOver;
  if (!battle || state.gameOver) {
    window.clearTimeout(battleAnimationTimer);
    battleAnimationTimer = 0;
    return;
  }

  const resultLabel =
    battle.result === "win" ? "战斗胜利" : battle.result === "loss" ? "战斗失败" : "战斗平局";
  elements.battleTitle.textContent = resultLabel;
  elements.battleSummary.textContent =
    state.playerDataTest?.status === "completed"
      ? "第 20 回合玩家阵容数据已记录并导出；本局继续按生命与旗帜条件进行。"
      : "本场使用商店阵容的独立副本；结算完成后不会回写任何战斗状态。";
  renderBattleTeams(battle);
  elements.battleLog.innerHTML = renderBattleReport(battle, battle.selectedExchange);
  elements.battleLog.scrollTop = 0;
  battle.view ??= "animation";
  battle.animationIndex ??= 0;
  battle.animationPlaying ??= true;
  battle.animationSpeed ??= battleAnimationPlaybackSpeed;
  if (elements.battleLineupPanel) elements.battleLineupPanel.open = false;
  setBattleView(battle.view);
  updateBattleExchangeControls(battle);
  elements.continueButton.textContent = state.gameOutcome
    ? "游戏结算"
    : "进入下一回合";
}

function playGameResultAudio(outcome) {
  const outcomeKey = `${outcome}:${state.round}`;
  if (audioRuntime.lastGameOutcomeKey === outcomeKey) return;
  audioRuntime.lastGameOutcomeKey = outcomeKey;
  playAudioCue(
    outcome === "victory"
      ? "gameVictory"
      : outcome === "defeat"
        ? "battleDefeat"
        : "rewardClaim",
  );
}

function renderGameResult() {
  if (!elements.gameResultOverlay) return;
  const outcome = state.gameOver ? state.gameOutcome : null;
  const isVictory = outcome === "victory";
  const isDefeat = outcome === "defeat";
  const hasOutcome = isVictory || isDefeat;
  document.body.classList.toggle("game-result-visible", hasOutcome);
  elements.gameResultOverlay.hidden = !hasOutcome;
  if (!hasOutcome) {
    audioRuntime.lastGameOutcomeKey = null;
    return;
  }
  playGameResultAudio(outcome);

  elements.gameResultDialog.classList.toggle("victory", isVictory);
  elements.gameResultDialog.classList.toggle("defeat", isDefeat);
  elements.gameResultKicker.textContent = isVictory
    ? "十旗定鼎 · 战局终结"
    : "心火尽灭 · 战局终结";
  elements.gameResultTitle.textContent = isVictory ? "问鼎中原" : "本局落败";
  elements.gameResultSeal.textContent = isVictory ? "胜" : "败";
  elements.gameResultMessage.textContent = isVictory
    ? `第 ${state.round} 回合集齐 ${FLAG_VICTORY_TARGET} 面旗帜，你赢得了本局。`
    : `生命在第 ${state.round} 回合归零，本局征途到此为止。`;

  const stats = [
    ["最终回合", state.round],
    ["旗帜", `${state.flags} / ${FLAG_VICTORY_TARGET}`],
    ["生命", `${state.life} / ${PLAYER_MAX_LIFE}`],
    ["胜场", state.battleRecord.wins],
    ["负场", state.battleRecord.losses],
    ["平局", state.battleRecord.draws],
  ];
  elements.gameResultStats.innerHTML = stats
    .map(
      ([label, value]) => `
        <article class="game-result-stat">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `,
    )
    .join("");

  elements.gameResultLineup.replaceChildren();
  state.lineup.forEach((unit, index) => {
    const slot = document.createElement("article");
    slot.className = `game-result-lineup-slot${unit ? " occupied" : " empty"}`;
    slot.innerHTML = `
      <span class="game-result-slot-number">${index + 1}号位</span>
      <div class="game-result-card-frame">
        ${
          unit
            ? createHeroCardMarkup(unit, { lineupIndex: index })
            : '<span class="game-result-empty-mark">空</span>'
        }
      </div>
    `;
    elements.gameResultLineup.append(slot);
  });

  const activeBonds = getBondEntries().filter((entry) => entry.effectCount > 0);
  elements.gameResultBondSummary.textContent =
    activeBonds.length > 0
      ? activeBonds
          .map(
            (entry) =>
              `${BOND_RULES[entry.faction].label} ${entry.count}人 · 使用${entry.effectCount}人效果`,
          )
          .join("　")
      : "未激活羁绊";
}

function renderRoundReward() {
  if (!elements.roundRewardOverlay) return;
  const pending = state.pendingRoundReward;
  const collapsed = Boolean(pending && state.roundRewardCollapsed);
  elements.roundRewardOverlay.hidden = !pending || collapsed;
  if (elements.roundRewardCollapsedBar) {
    elements.roundRewardCollapsedBar.hidden = !collapsed;
  }
  elements.shopStage?.toggleAttribute("inert", collapsed);
  if (!pending) return;

  elements.roundRewardOptions.replaceChildren();
  elements.roundRewardTitle.textContent = ROUND_REWARD_TITLES[pending.round] ?? "回合奖励";
  pending.candidates.forEach((candidate, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reward-option";
    button.setAttribute("aria-label", `选择${candidate.name}作为回合奖励`);
    button.innerHTML = createItemCardMarkup({ ...candidate, cost: 0, rewardItem: true });
    button.addEventListener("click", () => chooseRoundRewardCard(index));
    elements.roundRewardOptions.append(button);
  });
}

function renderRewardChoice() {
  if (!elements.rewardOverlay) return;
  setBondSelectionHintSource("reward-hover", []);
  setBondSelectionHintSource("reward-focus", []);
  const reward = state.pendingRewards[0];
  const canShow = Boolean(
    state.phase === "shop" &&
    reward &&
    reward.ready !== false &&
    (reward.availableRound ?? state.round) <= state.round,
  );
  elements.rewardOverlay.hidden = !canShow;
  if (!canShow) return;
  setBondSelectionHintSource("shop-hover", []);
  setBondSelectionHintSource("shop-focus", []);
  setBondSelectionHintSource("shop-drag", []);

  elements.rewardOptions.replaceChildren();
  reward.candidates.forEach((candidate, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reward-option";
    button.setAttribute("aria-label", `选择${candidate.name}作为升级奖励`);
    button.innerHTML = createHeroCardMarkup(
      {
        ...candidate,
        cost: HERO_COST,
        isReward: true,
      },
      { showCost: true },
    );
    bindCardBondSelectionHint(button, candidate, "reward");
    button.addEventListener("click", () => selectUpgradeReward(index));
    elements.rewardOptions.append(button);
  });
}

function renderStratagemChoice() {
  if (!elements.stratagemChoiceOverlay) return;
  const pending = state.pendingStratagemUse;
  const heroPending = state.pendingHeroBondChoice;
  elements.stratagemChoiceOverlay.hidden = !pending && !heroPending;
  if (!pending && !heroPending) return;

  if (heroPending) {
    elements.stratagemChoiceTitle.textContent = `${heroPending.ownerName}【广识】：选择额外羁绊`;
    elements.stratagemChoiceDescription.innerHTML = getEscapedGameTextMarkup(
      "选择1名其他友军，为其及本局全部同名武将添加1个额外羁绊；购买成功后的选择不可取消。",
    );
    elements.stratagemChoiceOptions.replaceChildren();
    heroPending.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `stratagem-bond-option bond-${option.faction}`;
      button.innerHTML = `<strong>${option.unitName} · ${BOND_RULES[option.faction].label}</strong><span>本局永久添加${option.faction}羁绊，同名武将同步</span>`;
      button.addEventListener("click", () => selectHeroBondChoice(index));
      elements.stratagemChoiceOptions.append(button);
    });
    elements.stratagemChoiceCancelButton.hidden = !heroPending.cancelable;
    elements.stratagemChoiceCancelButton.textContent = "暂不使用";
    return;
  }

  elements.stratagemChoiceTitle.textContent = `${pending.cardName}：选择羁绊`;
  elements.stratagemChoiceDescription.innerHTML = getEscapedGameTextMarkup(
    pending.choiceDescription,
  );
  elements.stratagemChoiceOptions.replaceChildren();
  pending.availableFactions.forEach((faction) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `stratagem-bond-option bond-${faction}`;
    const affectedShopCount =
      pending.cardName === "整军经武"
        ? state.shop.filter(
            (card) => card?.type === "hero" && getBaseUnitBonds(card).includes(faction),
          ).length
        : null;
    button.innerHTML = `
      <strong>${BOND_RULES[faction].label}</strong>
      <span>${faction}羁绊${
        affectedShopCount === null ? "" : ` · 当前可强化 ${affectedShopCount} 张商店武将`
      }</span>
    `;
    button.addEventListener("click", () => selectStratagemBondChoice(faction));
    elements.stratagemChoiceOptions.append(button);
  });
  elements.stratagemChoiceCancelButton.hidden = Boolean(pending.generated);
  elements.stratagemChoiceCancelButton.textContent = "取消使用";
}

function render() {
  hideAdaptiveCardDetails();
  const shopRule = getShopRule(state.round);
  elements.roundText.textContent = state.round;
  elements.phaseText.textContent =
    state.phase === "shop"
      ? "商店"
      : state.phase === "end-turn"
        ? "回合结束结算"
        : "战斗";
  elements.tierText.textContent = `${shopRule.tier}阶 · ${shopRule.heroSlots}武将 / ${shopRule.itemSlots}道具`;
  elements.shopTipText.textContent = `当前商店阶数 - ${shopRule.tier}阶 · ${shopRule.heroSlots}武将 + ${shopRule.itemSlots}道具；鼠标右键可以锁定指定的卡牌`;
  elements.goldText.textContent = state.gold;
  elements.lifeText.textContent = state.life;
  document.querySelectorAll(".heart-strip img").forEach((heart, index) => {
    heart.style.opacity = index < state.life ? "1" : "0.18";
  });
  elements.flagText.textContent = `${state.flags} / ${FLAG_VICTORY_TARGET}`;
  elements.refreshButton.disabled =
    state.phase !== "shop" ||
    state.gold < REFRESH_COST ||
    state.pendingRewards.length > 0 ||
    Boolean(state.pendingStratagemUse) ||
    Boolean(state.pendingHeroBondChoice) ||
    Boolean(state.pendingRoundReward);
  elements.endTurnButton.disabled =
    state.phase !== "shop" ||
    state.pendingRewards.length > 0 ||
    Boolean(state.pendingStratagemUse) ||
    Boolean(state.pendingHeroBondChoice) ||
    Boolean(state.pendingRoundReward);
  const shopBlocked = Boolean(state.pendingRoundReward);
  elements.shopGrid?.toggleAttribute("inert", shopBlocked);
  elements.lineupGrid?.toggleAttribute("inert", shopBlocked);
  renderFlow();
  renderBonds();
  renderShop();
  renderLineup();
  renderLogs();
  renderBattle();
  renderGameResult();
  renderRoundReward();
  renderRewardChoice();
  renderStratagemChoice();
  playQueuedShopPresentations();
  playQueuedBondUpgradeCelebrations();
  syncGameAudioScene();
}

elements.refreshButton.addEventListener("click", () => refreshShop());
elements.endTurnButton.addEventListener("click", endTurn);
elements.codexButton?.addEventListener("click", openCodex);
elements.fullscreenButton?.addEventListener("click", () => {
  playAudioCue("uiConfirm");
  togglePageFullscreen();
});
document.addEventListener("fullscreenchange", updateFullscreenButton);
document.addEventListener("webkitfullscreenchange", updateFullscreenButton);
updateFullscreenButton();
elements.codexCloseButton?.addEventListener("click", () => closeCodex());
elements.codexTypeFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-codex-type]");
  if (!button) return;
  codexFilters.type = button.dataset.codexType;
  playAudioCue("uiTab");
  renderCodex();
});
elements.codexTierFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-codex-tier]");
  if (!button) return;
  if (button.dataset.codexTier === "全部") {
    codexFilters.tier = "全部";
    playAudioCue("uiTab");
    renderCodex();
    return;
  }
  const tier = Number.parseInt(button.dataset.codexTier ?? "", 10);
  if (!Number.isInteger(tier)) return;
  codexFilters.tier = tier;
  playAudioCue("uiTab");
  renderCodex();
});
elements.codexFactionFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-codex-faction]");
  if (!button) return;
  codexFilters.faction = button.dataset.codexFaction;
  playAudioCue("uiTab");
  renderCodex();
});
elements.codexOverlay?.addEventListener("click", (event) => {
  if (event.target === elements.codexOverlay) closeCodex();
});
elements.nextExchangeButton?.addEventListener("click", () => {
  playAudioCue("uiTab");
  selectNextBattleExchange();
});
elements.continueButton?.addEventListener("click", startNextRound);
elements.gameResultRestartButton?.addEventListener("click", resetDemo);
elements.battleAnimationTab?.addEventListener("click", () => {
  playAudioCue("uiTab");
  setBattleView("animation");
});
elements.battleReportTab?.addEventListener("click", () => {
  playAudioCue("uiTab");
  setBattleView("report");
});
elements.battleAnimationPrevious?.addEventListener("click", () => {
  const battle = state.battle;
  if (battle) setBattleAnimationIndex((battle.animationIndex ?? 0) - 1);
});
elements.battleAnimationPlay?.addEventListener("click", () => {
  playAudioCue("uiConfirm");
  toggleBattleAnimationPlayback();
});
elements.battleAnimationFastForward?.addEventListener(
  "click",
  cycleBattleAnimationSpeed,
);
elements.battleAnimationSpeed?.addEventListener(
  "input",
  setBattleAnimationSpeedFromControl,
);
elements.battleAnimationNext?.addEventListener("click", () => {
  const battle = state.battle;
  if (battle) setBattleAnimationIndex((battle.animationIndex ?? 0) + 1);
});
elements.battleAnimationReplay?.addEventListener("click", replayBattleAnimation);
elements.battleAnimationSkip?.addEventListener("click", skipBattleAnimation);
elements.battleLineupPanel?.addEventListener("toggle", () => {
  if (!elements.battleLineupHint) return;
  elements.battleLineupHint.textContent = elements.battleLineupPanel.open
    ? "收起完整卡牌"
    : "展开查看完整卡牌";
});
elements.battleLog?.addEventListener("click", (event) => {
  const round = event.target.closest(".battle-report-round");
  if (!round) return;
  const exchange = Number.parseInt(round.dataset.exchange ?? "", 10);
  if (Number.isInteger(exchange)) {
    playAudioCue("uiTab");
    selectBattleExchange(exchange);
  }
});
elements.battleLog?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const round = event.target.closest(".battle-report-round");
  if (!round) return;
  event.preventDefault();
  const exchange = Number.parseInt(round.dataset.exchange ?? "", 10);
  if (Number.isInteger(exchange)) {
    playAudioCue("uiTab");
    selectBattleExchange(exchange);
  }
});
elements.rewardSkipButton?.addEventListener("click", skipUpgradeReward);
elements.roundRewardCollapseButton?.addEventListener("click", () => setRoundRewardCollapsed(true));
elements.roundRewardExpandButton?.addEventListener("click", () => setRoundRewardCollapsed(false));
elements.stratagemChoiceCancelButton?.addEventListener("click", cancelCurrentChoice);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (elements.codexOverlay && !elements.codexOverlay.hidden) {
    closeCodex();
  }
});
document.addEventListener("pointermove", (event) => {
  if (
    pointerDraggedShopIndex === null &&
    pointerDraggedLineupIndex === null &&
    pointerDraggedEquipmentIndex === null
  ) {
    return;
  }
  event.preventDefault();
  pointerMoved = true;
  updateDragPreview(event.clientX, event.clientY);
  showDragPreview();
  if (pointerDraggedEquipmentIndex !== null) {
    markLineupEquipmentTarget(
      event.clientX,
      event.clientY,
      pointerDraggedEquipmentIndex,
    );
    markSellZoneTarget(event.clientX, event.clientY);
    return;
  }
  if (pointerDraggedShopIndex !== null) {
    if (state.shop[pointerDraggedShopIndex]?.type === "hero") {
      updateLineupDragDirection(event.clientX);
    }
    markLineupDropTarget(event.clientX, event.clientY);
    return;
  }
  updateLineupDragDirection(event.clientX);
  markLineupReorderTarget(event.clientX, event.clientY, pointerDraggedLineupIndex);
  markSellZoneTarget(event.clientX, event.clientY);
});
document.addEventListener("pointerup", (event) => {
  if (
    pointerDraggedShopIndex === null &&
    pointerDraggedLineupIndex === null &&
    pointerDraggedEquipmentIndex === null
  ) {
    return;
  }
  if (pointerDraggedLineupIndex !== null) {
    updateLineupDragDirection(event.clientX);
  }
  const lineupDragIntent =
    pointerDraggedLineupIndex !== null
      ? getLineupDragIntent(
          event.clientX,
          event.clientY,
          pointerDraggedLineupIndex,
        )
      : null;
  if (
    pointerDraggedShopIndex !== null &&
    state.shop[pointerDraggedShopIndex]?.type === "hero"
  ) {
    updateLineupDragDirection(event.clientX);
  }
  const shopHeroDragIntent =
    pointerDraggedShopIndex !== null
      ? getShopHeroDragIntent(
          event.clientX,
          event.clientY,
          pointerDraggedShopIndex,
        )
      : null;
  resetLineupDragDirection();
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const droppedInSellZone = isPointInSellZone(event.clientX, event.clientY);
  clearDragPreview();
  clearLineupDropState();
  setSellZoneVisible(false);
  setBondSelectionHintSource("shop-drag", []);
  if (pointerDraggedEquipmentIndex !== null) {
    const sourceIndex = pointerDraggedEquipmentIndex;
    pointerDraggedEquipmentIndex = null;
    if (!pointerMoved) return;
    if (droppedInSellZone) {
      sellEquipment(sourceIndex);
      return;
    }
    const targetSlot = target?.closest(".lineup-slot");
    const targetIndex = Number.parseInt(targetSlot?.dataset.lineupIndex ?? "", 10);
    if (Number.isInteger(targetIndex)) moveOrSwapEquipment(sourceIndex, targetIndex);
    return;
  }
  if (pointerDraggedLineupIndex !== null) {
    const sourceIndex = pointerDraggedLineupIndex;
    pointerDraggedLineupIndex = null;
    if (!pointerMoved) return;
    if (droppedInSellZone) {
      sellUnit(sourceIndex);
      return;
    }
    if (lineupDragIntent) {
      moveOrMergeLineupUnit(
        sourceIndex,
        lineupDragIntent.targetIndex,
        lineupDragIntent,
      );
    }
    return;
  }
  const shopIndex = pointerDraggedShopIndex;
  pointerDraggedShopIndex = null;
  if (!pointerMoved) return;
  const targetSlot = target?.closest(".lineup-slot");
  const lineupIndex = Number.parseInt(targetSlot?.dataset.lineupIndex ?? "", 10);
  if (!Number.isInteger(lineupIndex)) return;
  const card = state.shop[shopIndex];
  if (card?.category === "装备") {
    buyEquipmentToLineup(shopIndex, lineupIndex);
    return;
  }
  if (card?.category === "计策") {
    useStratagemOnLineup(shopIndex, lineupIndex);
    return;
  }
  buyHeroToLineup(shopIndex, lineupIndex, shopHeroDragIntent);
});
document.addEventListener("pointercancel", () => {
  pointerDraggedShopIndex = null;
  pointerDraggedLineupIndex = null;
  pointerDraggedEquipmentIndex = null;
  pointerMoved = false;
  resetLineupDragDirection();
  clearDragPreview();
  setSellZoneVisible(false);
  clearLineupDropState();
  setBondSelectionHintSource("shop-drag", []);
});

initializeAdaptiveCardDetails();

function createBattleTestUnit({
  name,
  side,
  index = 0,
  attack = null,
  health = null,
  level = 1,
  experience = 0,
  copies = null,
  bonusExperience = 0,
  skillEffectIds = null,
  equipment = null,
  statuses = {},
  faction = null,
  extraFactions = [],
  tempExtraFactions = [],
}) {
  const definition = CARD_POOLS.hero.find((hero) => hero.name === name) ?? {};
  const unit = {
    ...definition,
    id: `test-${side}-${name}-${index}`,
    name,
    attack: attack ?? definition.attack ?? 1,
    health: health ?? definition.health ?? 1,
    faction: faction ?? definition.faction ?? "无",
    tier: definition.tier ?? 0,
    level,
    experience,
    copies: copies ?? UNIT_LEVEL_COPY_THRESHOLDS[level] ?? 1,
    bonusExperience,
    skillEffectIds:
      skillEffectIds ??
      [definition.effectId].filter(Boolean),
    directModifiers: {
      equipment: cloneDirectModifier(equipment),
    },
    statuses: cloneDirectModifier(statuses),
    extraFactions: [...extraFactions],
    tempExtraFactions: [...tempExtraFactions],
  };
  return cloneBattleUnit(unit, { side, index });
}

function simulateBattleTestScenario({
  player = [],
  enemy = [],
  seed = 1,
  lockedBonds = {},
  maxExchanges = 100,
}) {
  const emptyBondLevels = Object.fromEntries(
    BOND_FACTIONS.map((faction) => [faction, 0]),
  );
  return simulateBattleScenario({
    player: player.map((unit, index) =>
      createBattleTestUnit({ ...unit, side: "player", index }),
    ),
    enemy: enemy.map((unit, index) =>
      createBattleTestUnit({ ...unit, side: "enemy", index }),
    ),
    seed,
    lockedBonds: {
      player: { ...emptyBondLevels, ...(lockedBonds.player ?? {}) },
      enemy: { ...emptyBondLevels, ...(lockedBonds.enemy ?? {}) },
    },
    enemySource: { type: "custom" },
    battleRound: 1,
    maxExchanges,
  });
}

function runBattleAnimationRegressionTests() {
  const tests = [];
  const test = (name, callback) => {
    try {
      callback();
      tests.push({ name, passed: true });
    } catch (error) {
      tests.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const getUnit = (step, side, name) =>
    step?.snapshot?.[side]?.find((unit) => unit.name === name) ?? null;
  const assertContinuous = (battle) => {
    battle.presentationTimeline.forEach((step, index) => {
      if (index === 0) return;
      assert(
        JSON.stringify(battle.presentationTimeline[index - 1].snapshot) ===
          JSON.stringify(step.beforeSnapshot),
        `步骤 ${index} 的前态与上一步后态不连续`,
      );
    });
  };
  const createShopSkillTestUnit = ({
    id,
    name,
    faction,
    level = 1,
    copies = 1,
    bonusExperience = 0,
    attack = 5,
    health = 5,
  }) => ({
    id,
    name,
    faction,
    level,
    copies,
    bonusExperience,
    experience: getUnitProgress(copies + bonusExperience).experience,
    attack: attack + Math.max(0, copies + bonusExperience - 1),
    health: health + Math.max(0, copies + bonusExperience - 1),
    baseAttack: attack,
    baseHealth: health,
    bodyAttack: attack,
    bodyHealth: health,
    directModifiers: { equipment: null, status: null, bond: null },
    statuses: {},
    extraFactions: [],
    tempExtraFactions: [],
  });

  test("新版正式数据包含60名武将并同步颜良汉献帝阶级", () => {
    assert(CARD_POOLS.hero.length === 60, `正式武将数量应为60，实际为${CARD_POOLS.hero.length}`);
    assert(CARD_POOLS.hero.find((hero) => hero.name === "文丑")?.tier === 2, "文丑不是2阶");
    assert(CARD_POOLS.hero.find((hero) => hero.name === "颜良")?.tier === 2, "颜良不是2阶");
    assert(CARD_POOLS.hero.find((hero) => hero.name === "汉献帝")?.tier === 3, "汉献帝不是3阶");
  });

  test("全部正式卡牌效果ID均已接入结构化结算", () => {
    const missingHeroEffects = CARD_POOLS.hero
      .filter((hero) => !hero.effectId || !EFFECT_DEFINITIONS[hero.effectId])
      .map((hero) => hero.name);
    const missingItemEffects = CARD_POOLS.stratagem
      .filter((item) => !item.effectId || !EFFECT_DEFINITIONS[item.effectId])
      .map((item) => item.name);
    assert(missingHeroEffects.length === 0, `缺少武将效果：${missingHeroEffects.join("、")}`);
    assert(missingItemEffects.length === 0, `缺少装备/计策效果：${missingItemEffects.join("、")}`);
  });

  test("羁绊只使用最高人数效果且5人效果需要解锁", () => {
    const previousUnlocked = state.unlockedFivePersonBonds;
    try {
      state.unlockedFivePersonBonds = [];
      assert(getBondEffectCount(1, "魏") === 0, "1人羁绊不应激活");
      assert(getBondEffectCount(3, "魏") === 3, "3人羁绊没有使用3人效果");
      assert(getBondEffectCount(5, "魏") === 4, "未解锁的5人羁绊没有回退到4人效果");
      state.unlockedFivePersonBonds = ["魏"];
      assert(getBondEffectCount(5, "魏") === 5, "解锁后的5人羁绊没有使用5人效果");
    } finally {
      state.unlockedFivePersonBonds = previousUnlocked;
    }
  });

  test("羁绊面板按当前人数和5人资格显示进度档位", () => {
    assert(
      JSON.stringify(getVisibleBondEffectTiers("魏", [])) === JSON.stringify([2, 3, 4]),
      "未解锁5人资格时的羁绊详情仍显示5人效果",
    );
    assert(
      JSON.stringify(getVisibleBondEffectTiers("魏", ["魏"])) === JSON.stringify([2, 3, 4, 5]),
      "解锁5人资格后的羁绊详情没有显示5人效果",
    );
    assert(
      getBondProgressMarkup(0, "魏", []) === "<strong>0</strong>/2",
      "0人羁绊进度不正确",
    );
    assert(
      getBondProgressMarkup(1, "魏", []) === "<strong>1</strong>/2",
      "1人羁绊进度不正确",
    );
    assert(
      getBondProgressMarkup(2, "魏", []) === "<strong>2</strong>/3",
      "2人羁绊进度不正确",
    );
    assert(
      getBondProgressMarkup(3, "魏", []) === "2/<strong>3</strong>/4",
      "3人羁绊进度不正确",
    );
    assert(
      getBondProgressMarkup(4, "魏", []) === "2/3/<strong>4</strong>",
      "未解锁5人资格时的4人羁绊进度不正确",
    );
    assert(
      getBondProgressMarkup(4, "魏", ["魏"]) === "2/3/<strong>4</strong>/5",
      "已解锁5人资格时的4人羁绊进度不正确",
    );
    assert(
      getBondProgressMarkup(5, "魏", []) === "2/3/<strong>4</strong>",
      "未解锁资格时的5人羁绊进度不正确",
    );
    assert(
      getBondProgressMarkup(5, "魏", ["魏"]) === "2/3/4/<strong>5</strong>",
      "已解锁资格时的5人羁绊进度不正确",
    );
  });

  test("六种负面状态共用正式随机池", () => {
    assert(
      JSON.stringify(NEGATIVE_STATUS_POOL) ===
        JSON.stringify(["burn", "broken-morale", "fear", "chain", "intimidated", "counterplot"]),
      `负面状态池不正确：${NEGATIVE_STATUS_POOL.join("、")}`,
    );
  });

  test("友军效果排除拥有者但允许另一张同名武将", () => {
    const previousLineup = state.lineup;
    const previousLogLength = state.logs.length;
    const previousSkillAnimationCount = queuedShopSkillAnimations.length;
    const previousBonusAnimationCount = queuedShopBonusAnimations.length;
    try {
      const recruited = createShopSkillTestUnit({
        id: "lingtong-recruited",
        name: "凌统",
        faction: "吴",
        attack: 4,
        health: 4,
      });
      const allyCopy = createShopSkillTestUnit({
        id: "lingtong-ally-copy",
        name: "凌统",
        faction: "吴",
        attack: 4,
        health: 4,
      });
      recruited.skillEffectIds = ["hero.lingtong.guoshi-zhifeng"];
      allyCopy.skillEffectIds = ["hero.lingtong.guoshi-zhifeng"];
      state.lineup = [recruited, allyCopy, null, null, null];
      dispatchShopEvent("unit:recruit", { unit: recruited });
      assert(
        recruited.bodyAttack === 5 && recruited.bodyHealth === 6,
        "另一张凌统没有给新招募凌统提供 +1/+2",
      );
      assert(
        allyCopy.bodyAttack === 4 && allyCopy.bodyHealth === 4,
        "技能拥有者错误地给自己增加了属性",
      );
    } finally {
      state.lineup = previousLineup;
      state.logs.splice(previousLogLength);
      queuedShopSkillAnimations.splice(previousSkillAnimationCount);
      queuedShopBonusAnimations.splice(previousBonusAnimationCount);
    }
  });

  test("商店武将技能标签先于对应效果入队", () => {
    const previousLineup = state.lineup;
    const previousEffectEventCount = state.effectEvents.length;
    const previousSkillAnimationCount = queuedShopSkillAnimations.length;
    const previousBonusAnimationCount = queuedShopBonusAnimations.length;
    const previousSequence = shopPresentationSequence;
    try {
      const owner = createShopSkillTestUnit({
        id: "zhugejin-skill-label-owner",
        name: "诸葛瑾",
        faction: "吴",
      });
      const target = createShopSkillTestUnit({
        id: "zhugejin-skill-label-target",
        name: "韩当",
        faction: "吴",
      });
      owner.skillEffectIds = ["hero.zhugejin.hongya"];
      state.lineup = [owner, target, null, null, null];

      dispatchShopEvent("round:end", { round: state.round });

      const skillAnimation = queuedShopSkillAnimations[previousSkillAnimationCount];
      const bonusAnimation = queuedShopBonusAnimations[previousBonusAnimationCount];
      assert(Boolean(skillAnimation), "诸葛瑾触发时没有生成技能标签表现");
      assert(Boolean(bonusAnimation), "诸葛瑾触发时没有生成属性效果表现");
      assert(
        skillAnimation.sequence < bonusAnimation.sequence,
        "技能标签没有排在对应属性效果之前",
      );
      assert(hasQueuedShopPresentations(), "商店表现队列错误地被视为空队列");
    } finally {
      state.lineup = previousLineup;
      state.effectEvents.splice(previousEffectEventCount);
      queuedShopSkillAnimations.splice(previousSkillAnimationCount);
      queuedShopBonusAnimations.splice(previousBonusAnimationCount);
      shopPresentationSequence = previousSequence;
    }
  });

  test("左慈交换不要求前后目标共享羁绊", () => {
    const previousLineup = state.lineup;
    const previousLogLength = state.logs.length;
    const previousSkillAnimationCount = queuedShopSkillAnimations.length;
    try {
      const behind = createShopSkillTestUnit({
        id: "zuoci-behind",
        name: "甄姬",
        faction: "魏",
        attack: 5,
        health: 6,
      });
      const owner = createShopSkillTestUnit({
        id: "zuoci-owner",
        name: "左慈",
        faction: "无",
        attack: 3,
        health: 1,
      });
      const ahead = createShopSkillTestUnit({
        id: "zuoci-ahead",
        name: "黄忠",
        faction: "蜀",
        attack: 9,
        health: 10,
      });
      behind.tier = 1;
      owner.tier = 1;
      ahead.tier = 1;
      owner.skillEffectIds = ["hero.zuoci.bianhuan-moce"];
      state.lineup = [behind, owner, ahead, null, null];
      dispatchShopEvent("unit:sell", { unit: owner });
      assert(
        behind.attack === 9 && behind.health === 10 && ahead.attack === 5 && ahead.health === 6,
        "左慈没有交换不同羁绊目标的最终面板攻血",
      );
    } finally {
      state.lineup = previousLineup;
      state.logs.splice(previousLogLength);
      queuedShopSkillAnimations.splice(previousSkillAnimationCount);
    }
  });

  test("孙策计算自身羁绊武将时不包含自己", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "孙策", health: 50 }],
      enemy: [{ name: "木桩", attack: 1, health: 50, skillEffectIds: [] }],
      seed: 11,
      maxExchanges: 0,
    });
    const sunce = battle.playerEnd.find((unit) => unit.name === "孙策");
    assert(sunce?.attack === 5 && sunce?.maxHealth === 50, "孙策错误地计算了自己");
    assertContinuous(battle);
  });

  test("马超首次普攻额外伤害合并在同一普攻段", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "马超", level: 1, attack: 7, health: 50 }],
      enemy: [{ name: "木桩", attack: 1, health: 50, skillEffectIds: [] }],
      seed: 13,
      maxExchanges: 1,
    });
    const exchange = battle.structuredLog.find((entry) => entry.type === "exchange");
    assert(exchange?.damageToEnemy?.finalAmount === 14, "马超首次普攻总伤害不是14");
    assert(
      !battle.structuredLog.some(
        (entry) => entry.type === "damage" && entry.effectId === "hero.machao.pozhen",
      ),
      "马超额外伤害被拆成了独立伤害段",
    );
    assertContinuous(battle);
  });

  test("赵云升级获得无双会覆盖开场灼烧", () => {
    const battle = simulateBattleTestScenario({
      player: [
        { name: "徐庶", level: 1, attack: 3, health: 50 },
        { name: "赵云", level: 1, copies: 2, attack: 7, health: 50 },
      ],
      enemy: [{ name: "木桩", attack: 1, health: 50, skillEffectIds: [] }],
      lockedBonds: { enemy: { 吴: 2 } },
      seed: 15,
      maxExchanges: 0,
    });
    const zhaoyun = battle.playerEnd.find((unit) => unit.name === "赵云");
    assert(zhaoyun?.level === 2, "徐庶没有使赵云在战斗开始时升级");
    assert(
      JSON.stringify(Object.keys(zhaoyun?.statuses ?? {})) === JSON.stringify(["unparalleled"]),
      `赵云升级后应只保留无双，实际为${Object.keys(zhaoyun?.statuses ?? {}).join("、")}`,
    );
    assertContinuous(battle);
  });

  test("无双免疫后续负面状态且正面状态可以覆盖无双", () => {
    const battle = simulateBattleTestScenario({
      player: [
        {
          name: "赵云",
          attack: 7,
          health: 50,
          statuses: { unparalleled: { targetCount: 1 } },
        },
      ],
      enemy: [{ name: "木桩", attack: 1, health: 50, skillEffectIds: [] }],
      lockedBonds: { enemy: { 吴: 2 } },
      seed: 16,
      maxExchanges: 0,
    });
    const zhaoyun = battle.playerEnd.find((unit) => unit.name === "赵云");
    assert(
      JSON.stringify(Object.keys(zhaoyun?.statuses ?? {})) === JSON.stringify(["unparalleled"]),
      "无双被后续负面状态覆盖或产生了状态共存",
    );

    const positiveTarget = {
      statuses: { unparalleled: { targetCount: 1 } },
      skillDisabled: false,
      skillDisabledUntilExchange: null,
    };
    applyPositiveStatus(positiveTarget, "rest", { amount: 3 });
    assert(
      JSON.stringify(Object.keys(positiveTarget.statuses)) === JSON.stringify(["rest"]),
      "休整没有作为新正面状态覆盖无双",
    );
    assertContinuous(battle);
  });

  test("技能禁用独立于状态槽并在下一轮清除", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "吕蒙", attack: 4, health: 50 }],
      enemy: [
        {
          name: "休整木桩",
          attack: 1,
          health: 50,
          skillEffectIds: [],
          statuses: { rest: { amount: 3 } },
        },
      ],
      seed: 17,
      maxExchanges: 2,
    });
    const disabledStep = battle.presentationTimeline.find(
      (step) => step.effectId === "hero.lvmeng.baiyi-dujiang" && step.kind === "effect",
    );
    const disabledTarget = getUnit(disabledStep, "enemy", "休整木桩");
    assert(
      JSON.stringify(Object.keys(disabledTarget?.statuses ?? {})) === JSON.stringify(["rest"]) &&
        disabledTarget?.skillDisabled === true,
      "技能禁用没有与休整独立共存",
    );
    assert(
      Object.keys(battle.roundSnapshots[1]?.enemy[0]?.statuses ?? {}).includes("rest") &&
        battle.roundSnapshots[1]?.enemy[0]?.skillDisabled === false,
      "下一轮没有独立清除技能禁用并保留原状态",
    );
    assertContinuous(battle);
  });

  test("震慑只令下一次普攻归零并保留已消耗标记", () => {
    const battle = simulateBattleTestScenario({
      player: [
        {
          name: "震慑测试者",
          attack: 5,
          health: 50,
          skillEffectIds: [],
          statuses: { intimidated: { spent: false } },
        },
      ],
      enemy: [{ name: "木桩", attack: 1, health: 50, skillEffectIds: [] }],
      seed: 17,
      maxExchanges: 2,
    });
    const exchanges = battle.structuredLog.filter((entry) => entry.type === "exchange");
    assert(exchanges[0]?.damageToEnemy?.finalAmount === 0, "震慑没有令第一次普攻归零");
    assert(exchanges[1]?.damageToEnemy?.finalAmount === 5, "已消耗震慑错误影响了第二次普攻");
    assert(
      battle.playerEnd[0]?.statuses?.intimidated?.spent === true,
      "震慑触发后没有保留已消耗标记",
    );
    assertContinuous(battle);
  });

  test("连锁先快照全部连锁单位再统一替换状态", () => {
    const battle = simulateBattleTestScenario({
      player: [
        { name: "张飞", health: 50 },
        { name: "庞统", attack: 8, health: 50 },
      ],
      enemy: [
        { name: "木桩甲", attack: 1, health: 50, skillEffectIds: [] },
        { name: "木桩乙", attack: 1, health: 50, skillEffectIds: [] },
      ],
      seed: 19,
      maxExchanges: 0,
    });
    assert(
      battle.enemyEnd.every((unit) => unit.statuses?.["broken-morale"]),
      "连锁单位没有被原子替换为破胆",
    );
    assertContinuous(battle);
  });

  test("东吴业火以最高优先级先于令箭武将技能结算", () => {
    const battle = simulateBattleTestScenario({
      player: [
        {
          name: "张飞",
          health: 50,
          equipment: {
            name: "令箭",
            effectId: "equipment.initiative-flag",
          },
        },
      ],
      enemy: [{ name: "木桩", attack: 1, health: 50, skillEffectIds: [] }],
      lockedBonds: { enemy: { 吴: 2 } },
      seed: 20,
      maxExchanges: 0,
    });
    const wuTriggerIndex = battle.presentationTimeline.findIndex(
      (step) => step.kind === "bond" && step.effectId === "bond.wu-battle-start",
    );
    const zhangfeiSkillIndex = battle.presentationTimeline.findIndex(
      (step) =>
        step.kind === "skill" && step.effectId === "hero.zhangfei.yanren-paoxiao",
    );
    assert(wuTriggerIndex >= 0, "缺少东吴业火战斗开始触发步骤");
    assert(zhangfeiSkillIndex >= 0, "缺少佩戴令箭的张飞战斗开始技能步骤");
    assert(
      wuTriggerIndex < zhangfeiSkillIndex,
      "佩戴令箭的张飞错误先于东吴业火结算",
    );
    assertContinuous(battle);
  });

  test("灼烧覆盖灼烧时新灼烧触发引燃后被清除", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "太史慈", level: 1, attack: 5, health: 20 }],
      enemy: [{ name: "木桩", attack: 1, health: 50, skillEffectIds: [] }],
      lockedBonds: { player: { 吴: 2 } },
      seed: 21,
      maxExchanges: 0,
    });
    const target = battle.enemyEnd[0];
    assert(target?.health === 41, `太史慈伤害与引燃后应剩41生命，实际为${target?.health}`);
    assert(!hasNegativeStatus(target), "引燃后没有清除当前的新灼烧");
    assertContinuous(battle);
  });

  test("其他负面状态覆盖灼烧时吴5也保留新状态", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "关羽", level: 1, attack: 10, health: 30 }],
      enemy: [{ name: "木桩", attack: 1, health: 50, skillEffectIds: [] }],
      lockedBonds: { player: { 吴: 5 } },
      seed: 22,
      maxExchanges: 1,
    });
    const target = battle.enemyEnd[0];
    assert(target?.health === 34, `普攻与引燃后应剩34生命，实际为${target?.health}`);
    assert(target?.statuses?.intimidated, "震慑覆盖灼烧并引燃后没有保留震慑");
    assert(!target?.statuses?.burn, "当前槽不是灼烧时，东吴业火5人仍错误补回了灼烧");
    assertContinuous(battle);
  });

  test("东吴业火5人会在新灼烧被引燃清除后补回原灼烧", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "太史慈", level: 1, attack: 5, health: 20 }],
      enemy: [{ name: "木桩", attack: 1, health: 50, skillEffectIds: [] }],
      lockedBonds: { player: { 吴: 5 } },
      seed: 23,
      maxExchanges: 0,
    });
    const target = battle.enemyEnd[0];
    assert(target?.health === 41, `太史慈伤害与引燃后应剩41生命，实际为${target?.health}`);
    assert(target?.statuses?.burn, "东吴业火5人没有补回原灼烧");
    assert(
      target.statuses.burn.sourceEffectId === "bond.wu-battle-start",
      "东吴业火5人补回的不是原灼烧",
    );
    assertContinuous(battle);
  });

  test("夏侯渊按触发时当前攻血的66%向下取整召唤LV1骑兵", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "夏侯渊", level: 2, attack: 10, health: 9 }],
      enemy: [{ name: "木桩", attack: 1, health: 50, skillEffectIds: [] }],
      seed: 23,
      maxExchanges: 1,
    });
    const cavalry = battle.playerEnd.find((unit) => unit.name === "骑兵");
    assert(
      cavalry?.level === 1 && cavalry?.attack === 6 && cavalry?.maxHealth === 5,
      `夏侯渊骑兵应为LV1 6/5，实际为LV${cavalry?.level} ${cavalry?.attack}/${cavalry?.maxHealth}`,
    );
    assertContinuous(battle);
  });

  test("马云禄召唤骑兵按自身等级变为2/1、4/2、6/3", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "马云禄", level: 2, attack: 2, health: 1 }],
      enemy: [{ name: "木桩", attack: 20, health: 50, skillEffectIds: [] }],
      seed: 25,
      maxExchanges: 1,
    });
    const cavalry = battle.playerEnd.find((unit) => unit.name === "骑兵");
    assert(
      cavalry?.level === 2 && cavalry?.attack === 4 && cavalry?.maxHealth === 2,
      `马云禄LV2骑兵应为4/2，实际为LV${cavalry?.level} ${cavalry?.attack}/${cavalry?.maxHealth}`,
    );
    assert(cavalry?.faction === "蜀", "马云禄骑兵没有继承其基础羁绊");
    assertContinuous(battle);
  });

  test("华佗固定复活为LV2 3/3、保留死者羁绊且升级只增加每回合次数", () => {
    const createScenario = (level, maxExchanges) =>
      simulateBattleTestScenario({
        player: [
          { name: "华佗", level, attack: 3, health: 50 },
          {
            name: "羁绊木桩",
            faction: "蜀",
            extraFactions: ["魏"],
            attack: 1,
            health: 1,
            skillEffectIds: [],
          },
        ],
        enemy: [{ name: "敌方木桩", attack: 10, health: 100, skillEffectIds: [] }],
        seed: 26,
        maxExchanges,
      });

    const firstReviveBattle = createScenario(3, 1);
    const revived = firstReviveBattle.playerEnd.find((unit) => unit.name === "羁绊木桩");
    assert(
      revived?.level === 2 && revived?.attack === 3 && revived?.maxHealth === 3,
      `华佗复活体应为LV2 3/3，实际为LV${revived?.level} ${revived?.attack}/${revived?.maxHealth}`,
    );
    assert(
      JSON.stringify(getBattleUnitBonds(revived)) === JSON.stringify(["蜀", "魏"]),
      `华佗复活体羁绊应与阵亡单位一致，实际为${getBattleUnitBonds(revived).join("、")}`,
    );

    [1, 2, 3].forEach((level) => {
      const battle = createScenario(level, 4);
      const reviveCount = battle.presentationTimeline.filter(
        (step) => step.kind === "summon" && step.effectId === "hero.huatuo.jijiu",
      ).length;
      assert(
        reviveCount === level,
        `LV${level}华佗每回合应复活${level}次，实际为${reviveCount}次`,
      );
      assertContinuous(battle);
    });
    assertContinuous(firstReviveBattle);
  });

  test("重骑兵攻击前成长随等级缩放且技能变量使用等级标记", () => {
    const definition = DERIVED_UNIT_DEFINITION_BY_NAME.重骑兵;
    [1, 2, 3].forEach((level) => {
      const expectedGain = 2 * level;
      const display = resolveHeroSkillDisplay(definition.skill, level, {
        name: "重骑兵",
        level,
        faction: "魏",
      });
      assert(
        display.text.includes(`+${expectedGain}/${expectedGain}`) &&
          display.html.includes('class="hero-skill-scaled-value"'),
        `LV${level}重骑兵技能描述没有显示橘色等级变量 +${expectedGain}/${expectedGain}`,
      );

      const battle = simulateBattleTestScenario({
        player: [
          {
            name: "重骑兵",
            level,
            attack: 5,
            health: 5,
            faction: "魏",
            skillEffectIds: ["summon.heavy-cavalry-growth"],
          },
        ],
        enemy: [{ name: "重骑兵测试木桩", attack: 1, health: 100, skillEffectIds: [] }],
        seed: 26,
        maxExchanges: 1,
      });
      const heavyCavalry = battle.playerEnd.find((unit) => unit.name === "重骑兵");
      assert(
        heavyCavalry?.attack === 5 + expectedGain &&
          heavyCavalry?.maxHealth === 5 + expectedGain,
        `LV${level}重骑兵攻击前应获得 +${expectedGain}/+${expectedGain}`,
      );
      assertContinuous(battle);
    });
  });

  test("白马义从只在自己成为攻击者时触发突袭", () => {
    const battle = simulateBattleTestScenario({
      player: [
        {
          name: "白马义从",
          level: 2,
          attack: 8,
          health: 4,
          faction: "群",
          skillEffectIds: ["summon.white-horse-attack"],
        },
        { name: "前排木桩", attack: 1, health: 20, skillEffectIds: [] },
      ],
      enemy: [{ name: "敌方木桩", attack: 1, health: 30, skillEffectIds: [] }],
      seed: 27,
      maxExchanges: 1,
    });
    assert(
      !battle.structuredLog.some(
        (entry) => entry.type === "damage" && entry.sourceEffectId === "summon.white-horse-attack",
      ),
      "后排白马义从在自己未攻击时错误触发了突袭",
    );
    assertContinuous(battle);
  });

  test("张郃召唤同羁绊正式武将并清除附加内容", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "张郃", level: 2, attack: 4, health: 1 }],
      enemy: [{ name: "木桩", attack: 20, health: 50, skillEffectIds: [] }],
      seed: 29,
      maxExchanges: 1,
    });
    const summon = battle.playerEnd.find((unit) => unit.name !== "张郃");
    const definition = CARD_POOLS.hero.find((hero) => hero.name === summon?.name);
    assert(summon && definition, "张郃没有召唤正式武将");
    assert(definition.faction === "群" && summon.name !== "张郃", "张郃召唤池不正确");
    assert(
      summon.level === 2 &&
        summon.attack === definition.attack * 2 &&
        summon.maxHealth === definition.health * 2,
      "张郃召唤物等级或基础攻血不正确",
    );
    assert(
      summon.skillEffectIds?.[0] === definition.effectId && summon.faction === definition.faction,
      "张郃召唤物没有保留抽中武将的技能或原始羁绊",
    );
    assert(
      !summon.equipment &&
        summon.extraFactions.length === 0 &&
        Object.keys(summon.statuses).length === 0,
      "张郃召唤物错误继承了装备、额外羁绊或状态",
    );
    assertContinuous(battle);
  });

  test("攻击前技能击杀当前目标后不再播放普通交锋", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "韩当", level: 1, attack: 2, health: 20 }],
      enemy: [
        {
          name: "负面状态木桩",
          attack: 9,
          health: 3,
          skillEffectIds: [],
          statuses: { fear: { ownerSide: "player" } },
        },
      ],
      seed: 37,
      maxExchanges: 1,
    });
    assert(battle.result === "win", "韩当攻击前击杀目标后未正常结束战斗");
    assert(
      !battle.presentationTimeline.some((step) => step.kind === "clash"),
      "已阵亡目标仍生成了普通交锋步骤",
    );
    assert(
      !buildBattleAnimationSteps(battle.presentationTimeline).some(
        (step) => step.kind === "clash" || step.kind === "exchange",
      ),
      "已阵亡目标仍生成了交锋动画",
    );
    assert(
      !battle.structuredLog.some((entry) => entry.type === "exchange"),
      "已阵亡目标仍参与了普通攻击伤害结算",
    );
    assertContinuous(battle);
  });

  test("阵亡卡牌先播放消失动画再从阵亡效果场景移除", () => {
    const battle = simulateBattleTestScenario({
      player: [
        {
          name: "后排援军",
          attack: 1,
          health: 20,
          skillEffectIds: [],
        },
        { name: "庞德", attack: 1, health: 1 },
      ],
      enemy: [
        {
          name: "阵亡效果测试木桩",
          attack: 10,
          health: 100,
          skillEffectIds: [],
        },
      ],
      seed: 48,
      maxExchanges: 1,
    });
    const animationSteps = getBattleAnimationSteps(battle);
    const deathStep = animationSteps.find(
      (step) =>
        step.kind === "death" &&
        step.snapshot.player.some((unit) => unit.name === "庞德"),
    );
    const deathEffectStep = animationSteps.find(
      (step) =>
        step.effectId === "hero.pangde.xunjie" &&
        step.timingWindow === "unit:death",
    );
    assert(deathStep, "庞德阵亡时没有生成卡牌消失动画步骤");
    const deadUnitId = deathStep.deathIds.find((unitId) =>
      deathStep.snapshot.player.some(
        (unit) => unit.id === unitId && unit.name === "庞德",
      ),
    );
    assert(deadUnitId, "庞德阵亡动画没有记录对应单位");
    assert(deathEffectStep, "庞德阵亡效果没有生成独立动画步骤");
    assert(
      !animationSteps.some((step) => step.kind === "leave"),
      "动画仍保留了额外的离场文字停顿",
    );
    assert(
      deathStep.snapshot.player.some((unit) => unit.id === deadUnitId),
      "阵亡动画开始前卡牌已经从战场快照消失",
    );
    const deathMarkup = renderBattleAnimationBattlefield(battle, deathStep);
    assert(
      deathMarkup.includes(`data-unit-id="${deadUnitId}"`) &&
        deathMarkup.includes("is-defeated") &&
        deathMarkup.includes("battle-field-smoke"),
      "阵亡动画没有保留原卡牌并应用烟雾消失表现",
    );
    assert(
      !deathEffectStep.beforeSnapshot.player.some(
        (unit) => unit.id === deadUnitId,
      ) &&
        !deathEffectStep.snapshot.player.some(
          (unit) => unit.id === deadUnitId,
      ),
      "阵亡效果播放时原卡牌仍停留在战场",
    );
    const deathEffectMarkup = renderBattleAnimationBattlefield(
      battle,
      deathEffectStep,
    );
    assert(
      !deathEffectMarkup.includes(`data-unit-id="${deadUnitId}"`),
      "阵亡效果的实际战场DOM仍渲染原卡牌",
    );
    assertContinuous(battle);
  });

  test("一方前排阵亡淡出后由后排补位并进入下一次交锋", () => {
    const battle = simulateBattleTestScenario({
      player: [
        {
          name: "我方前排",
          attack: 5,
          health: 100,
          skillEffectIds: [],
        },
      ],
      enemy: [
        {
          name: "敌方前排",
          attack: 1,
          health: 1,
          skillEffectIds: [],
        },
        {
          name: "敌方后排",
          attack: 1,
          health: 20,
          skillEffectIds: [],
        },
      ],
      seed: 49,
      maxExchanges: 2,
    });
    const animationSteps = getBattleAnimationSteps(battle);
    const clashIndices = animationSteps
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => step.kind === "clash");
    const deathIndex = animationSteps.findIndex(
      (step) =>
        step.kind === "death" &&
        step.deathIds.some((unitId) =>
          step.snapshot.enemy.some(
            (unit) => unit.id === unitId && unit.name === "敌方前排",
          ),
        ),
    );
    const advanceIndex = animationSteps.findIndex(
      (step) =>
        step.kind === "advance" &&
        step.movements.some((movement) => movement.side === "enemy"),
    );
    assert(clashIndices.length === 2, "测试场景没有生成连续两轮交锋");
    assert(
      clashIndices[0].index < deathIndex &&
        deathIndex < advanceIndex &&
        advanceIndex < clashIndices[1].index,
      "交锋、阵亡烟雾、阵容补位和下一次交锋的顺序不正确",
    );
    assert(
      animationSteps[advanceIndex].movements.some(
        (movement) =>
          movement.side === "enemy" &&
          movement.fromSlot === 1 &&
          movement.toSlot === 0,
      ),
      "敌方后排没有记录向最前方补位的位移",
    );
    assert(
      clashIndices[1].step.snapshot.enemy.some(
        (unit) => unit.name === "敌方后排",
      ) &&
        !clashIndices[1].step.snapshot.enemy.some(
          (unit) => unit.name === "敌方前排",
        ),
      "下一次交锋没有直接使用补位后的新前排",
    );
    assertContinuous(battle);
  });

  test("双方同轮阵亡时同步烟雾退场并同时补位", () => {
    const battle = simulateBattleTestScenario({
      player: [
        { name: "我方后排", attack: 1, health: 20, skillEffectIds: [] },
        { name: "我方前排", attack: 5, health: 1, skillEffectIds: [] },
      ],
      enemy: [
        { name: "敌方前排", attack: 5, health: 1, skillEffectIds: [] },
        { name: "敌方后排", attack: 1, health: 20, skillEffectIds: [] },
      ],
      seed: 50,
      maxExchanges: 2,
    });
    const animationSteps = getBattleAnimationSteps(battle);
    const deathSteps = animationSteps.filter((step) => step.kind === "death");
    const advanceSteps = animationSteps.filter((step) => step.kind === "advance");
    assert(deathSteps.length === 1, "同轮双亡仍被拆成多个退场步骤");
    assert(
      deathSteps[0].simultaneous && deathSteps[0].deathIds.length === 2,
      "同轮双亡步骤没有记录两个同步阵亡单位",
    );
    const deathMarkup = renderBattleAnimationBattlefield(battle, deathSteps[0]);
    assert(
      (deathMarkup.match(/battle-field-smoke/g) ?? []).length === 2 &&
        (deathMarkup.match(/is-defeated/g) ?? []).length === 2,
      "同轮双亡没有在同一场景为双方生成烟雾退场",
    );
    assert(advanceSteps.length === 1, "双方补位没有合并为同一个动画步骤");
    assert(
      advanceSteps[0].movements.some(
        (movement) =>
          movement.side === "player" && movement.fromSlot === 3 && movement.toSlot === 4,
      ) &&
        advanceSteps[0].movements.some(
          (movement) =>
            movement.side === "enemy" && movement.fromSlot === 1 && movement.toSlot === 0,
        ),
      "双方后排没有在同一步骤朝各自前排补位",
    );
    assertContinuous(battle);
  });

  test("武将与道具详情共用宣纸面板和水墨标签结构", () => {
    const hero = CARD_POOLS.hero[0];
    const item = CARD_POOLS.stratagem[0];
    const heroTemplate = document.createElement("template");
    const itemTemplate = document.createElement("template");
    heroTemplate.innerHTML = createHeroCardMarkup(hero, { showCost: true }).trim();
    itemTemplate.innerHTML = createItemCardMarkup(item).trim();
    const heroTooltip = heroTemplate.content.querySelector(".hero-skill-tooltip.card-detail-paper");
    const itemTooltip = itemTemplate.content.querySelector(".item-skill-tooltip.card-detail-paper");
    assert(
      heroTooltip?.querySelector(".card-detail-ink-tag")?.textContent.trim(),
      "武将技能详情缺少水墨标签",
    );
    assert(
      itemTooltip?.querySelector(".card-detail-ink-tag")?.textContent.trim() === item.category,
      "道具详情的水墨类型标签不正确",
    );
    assert(
      itemTooltip?.querySelector(".card-detail-title")?.textContent.trim() === item.name,
      "道具详情缺少卡牌名称",
    );
    assert(
      itemTooltip?.querySelector(".card-detail-meta")?.textContent.trim() === `${item.tier ?? 1}阶`,
      "道具详情缺少阶数信息",
    );
    assert(itemTooltip?.children.length === 2, "道具详情没有保持标题与效果两行结构");
    assert(
      !itemTooltip?.querySelector("em") && !itemTooltip?.textContent.includes("拖到"),
      "道具详情仍显示拖拽使用提示",
    );
  });

  test("属性对描述统一显示攻击力与生命值图标", () => {
    const mixedMarkup = getEscapedGameTextMarkup(
      "甲 +1/1，乙 2/+3，丙 +4/+5；基础属性 5/5；等级 1/2/3；羁绊 2/3/4/5人",
    );
    const mixedTemplate = document.createElement("template");
    mixedTemplate.innerHTML = mixedMarkup;
    assert(
      mixedTemplate.content.querySelectorAll(".inline-stat-pair").length === 4,
      "属性对的兼容写法没有全部转换为图标标记",
    );
    assert(
      mixedTemplate.content.querySelectorAll(".inline-stat-icon-attack").length === 4 &&
        mixedTemplate.content.querySelectorAll(".inline-stat-icon-health").length === 4,
      "属性对缺少攻击力或生命值图标",
    );
    const basePair = mixedTemplate.content.querySelector(".inline-stat-pair-base");
    assert(
      basePair?.querySelector(".inline-stat-value")?.firstElementChild?.classList.contains(
        "inline-stat-icon-attack",
      ),
      "基础攻血没有按图标在前、数值在后的顺序显示",
    );
    assert(
      mixedMarkup.includes("等级 1/2/3") && mixedMarkup.includes("羁绊 2/3/4/5人"),
      "等级或羁绊人数序列被错误识别为攻血",
    );

    const yuJin = CARD_POOLS.hero.find((hero) => hero.name === "于禁");
    const yuJinTemplate = document.createElement("template");
    yuJinTemplate.innerHTML = createHeroCardMarkup(yuJin, { showCost: true }).trim();
    const heroDescription = yuJinTemplate.content.querySelector(".hero-skill-description");
    assert(
      heroDescription?.querySelector(".inline-stat-icon-attack") &&
        heroDescription?.querySelector(".inline-stat-icon-health"),
      "武将技能中的 +攻击/生命 描述没有显示双图标",
    );
    assert(
      yuJinTemplate.content
        .querySelector(".hero-card")
        ?.getAttribute("aria-label")
        ?.includes("+1攻击力/+1生命值"),
      "武将技能的无障碍描述没有规范为攻击力与生命值",
    );

    const pangDe = CARD_POOLS.hero.find((hero) => hero.name === "庞德");
    const pangDeTemplate = document.createElement("template");
    pangDeTemplate.innerHTML = createHeroCardMarkup(pangDe, { showCost: true }).trim();
    const scaledHeroDescription = pangDeTemplate.content.querySelector(
      ".hero-skill-description",
    );
    assert(
      scaledHeroDescription?.querySelector(".inline-stat-icon-attack") &&
        scaledHeroDescription?.querySelector(".inline-stat-icon-health"),
      "按等级缩放的 +（攻击/生命）描述没有显示双图标",
    );

    const recommendTalent = CARD_POOLS.stratagem.find((item) => item.name === "举贤");
    const itemTemplate = document.createElement("template");
    itemTemplate.innerHTML = createItemCardMarkup(recommendTalent).trim();
    const itemDescription = itemTemplate.content.querySelector(".item-skill-description");
    assert(
      itemDescription?.querySelector(".inline-stat-icon-attack") &&
        itemDescription?.querySelector(".inline-stat-icon-health"),
      "计策描述中的属性对没有显示双图标",
    );

    const cavalryTalisman = CARD_POOLS.stratagem.find((item) => item.name === "兵符");
    const cavalryTalismanTemplate = document.createElement("template");
    cavalryTalismanTemplate.innerHTML = createItemCardMarkup(cavalryTalisman).trim();
    assert(
      cavalryTalismanTemplate.content.querySelector(
        ".item-skill-description .inline-stat-pair-base",
      ),
      "装备描述中的基础攻血没有显示双图标",
    );
    assert(
      cavalryTalismanTemplate.content
        .querySelector(".item-card")
        ?.getAttribute("aria-label")
        ?.includes("2攻击力/1生命值"),
      "装备基础攻血的无障碍描述没有标明攻击力与生命值",
    );
  });

  test("技能描述面板用图标替换攻击力与生命值属性词", () => {
    [
      { heroName: "甄姬", statName: "攻击力", iconClass: "inline-stat-icon-attack" },
      { heroName: "廖化", statName: "生命值", iconClass: "inline-stat-icon-health" },
    ].forEach(({ heroName, statName, iconClass }) => {
      const hero = CARD_POOLS.hero.find((entry) => entry.name === heroName);
      const template = document.createElement("template");
      template.innerHTML = createHeroCardMarkup(hero, { showCost: true }).trim();
      const description = template.content.querySelector(".hero-skill-description");
      const icon = description?.querySelector(`.inline-stat-term-icon.${iconClass}`);
      assert(icon?.getAttribute("alt") === statName, `${heroName}技能没有用${statName}图标替换属性词`);
      assert(!description?.textContent.includes(statName), `${heroName}技能仍显示${statName}文字`);
      assert(
        template.content.querySelector(".hero-card")?.getAttribute("aria-label")?.includes(statName),
        `${heroName}技能的无障碍描述丢失${statName}文本`,
      );
    });
  });

  test("攻击力百分比统一显示为百分比在前、攻击力图标在后", () => {
    const entries = [
      ...CARD_POOLS.hero.map((card) => ({
        label: `${card.name}技能`,
        skill: card.skill,
        markup: getSkillDescriptionDisplay(card.skill, 1, card).html,
      })),
      ...CARD_POOLS.stratagem.map((card) => ({
        label: `${card.name}描述`,
        skill: card.skill,
        markup: getEscapedStatDescriptionMarkup(card.skill),
      })),
    ].filter(({ skill }) => /攻击力(?:（)?\d+(?:\.\d+)?%/.test(skill));

    assert(entries.length > 0, "卡池中没有找到攻击力百分比描述");
    entries.forEach(({ label, skill, markup }) => {
      const expectedCount = skill.match(/攻击力(?:（)?\d+(?:\.\d+)?%/g)?.length ?? 0;
      const template = document.createElement("template");
      template.innerHTML = markup;
      const reorderedIcons = Array.from(
        template.content.querySelectorAll(".inline-stat-term-icon.inline-stat-icon-attack"),
      ).filter((icon) => /\d+(?:\.\d+)?%\s*$/.test(icon.previousSibling?.textContent ?? ""));
      assert(
        reorderedIcons.length === expectedCount,
        `${label}没有按“百分比 + 攻击力图标”的顺序显示`,
      );
    });
  });

  test("全部武将技能中的经验值均替换为经验图标", () => {
    const experienceHeroes = CARD_POOLS.hero.filter((hero) => hero.skill.includes("经验值"));
    assert(experienceHeroes.length > 0, "武将池中没有找到包含经验值的技能");

    experienceHeroes.forEach((hero) => {
      const expectedIconCount = hero.skill.match(/经验值/g)?.length ?? 0;
      const template = document.createElement("template");
      template.innerHTML = createHeroCardMarkup(hero, { showCost: true }).trim();
      const description = template.content.querySelector(".hero-skill-description");
      const icons = description?.querySelectorAll(".inline-experience-icon") ?? [];
      assert(
        icons.length === expectedIconCount &&
          Array.from(icons).every((icon) => icon.getAttribute("alt") === "经验值"),
        `${hero.name}技能的经验图标数量或替代文本不正确`,
      );
      assert(
        !description?.textContent.includes("经验值"),
        `${hero.name}技能仍显示经验值文字`,
      );
      assert(
        template.content
          .querySelector(".hero-card")
          ?.getAttribute("aria-label")
          ?.includes("经验值"),
        `${hero.name}技能的无障碍描述丢失经验值文本`,
      );
    });

    const masterGuidance = CARD_POOLS.stratagem.find((item) => item.name === "开悟");
    const itemTemplate = document.createElement("template");
    itemTemplate.innerHTML = createItemCardMarkup(masterGuidance).trim();
    const itemDescription = itemTemplate.content.querySelector(".item-skill-description");
    assert(
      itemDescription?.textContent.includes("经验值") &&
        !itemDescription.querySelector(".inline-experience-icon"),
      "经验图标替换不应扩展到武将技能以外的描述",
    );
  });

  test("全部武将技能的攻血属性语义均转换为图标", () => {
    const getExpectedIconCounts = (skillText) => {
      const counts = { attack: 0, health: 0 };
      String(skillText ?? "").replace(
        /攻血|当前生命(?:值)?|攻击力|生命值|面板攻击(?=和)|\d+\s*\/\s*\d+/g,
        (statTerm) => {
          if (statTerm === "攻血" || /\d+\s*\/\s*\d+/.test(statTerm)) {
            counts.attack += 1;
            counts.health += 1;
          } else if (statTerm === "攻击力" || statTerm === "面板攻击") {
            counts.attack += 1;
          } else {
            counts.health += 1;
          }
          return statTerm;
        },
      );
      return counts;
    };

    CARD_POOLS.hero.forEach((hero) => {
      const expected = getExpectedIconCounts(hero.skill);
      if (expected.attack === 0 && expected.health === 0) return;
      const template = document.createElement("template");
      template.innerHTML = createHeroCardMarkup(hero, { showCost: true }).trim();
      const description = template.content.querySelector(".hero-skill-description");
      const actualAttack = description?.querySelectorAll(".inline-stat-icon-attack").length ?? 0;
      const actualHealth = description?.querySelectorAll(".inline-stat-icon-health").length ?? 0;
      assert(
        actualAttack === expected.attack && actualHealth === expected.health,
        `${hero.name}技能属性图标数量错误：应为${expected.attack}攻/${expected.health}血，实际为${actualAttack}攻/${actualHealth}血`,
      );
      assert(
        !/(?:攻血|攻击力|生命值|面板攻击|当前生命)/.test(description?.textContent ?? ""),
        `${hero.name}技能仍有未转换的攻血属性词`,
      );
    });

    ["黄忠", "韩当", "吕布"].forEach((heroName) => {
      const hero = CARD_POOLS.hero.find((entry) => entry.name === heroName);
      const template = document.createElement("template");
      template.innerHTML = createHeroCardMarkup(hero, { showCost: true }).trim();
      assert(
        template.content.querySelector(".hero-skill-description")?.textContent.includes("攻击"),
        `${heroName}技能的攻击动作词被错误替换`,
      );
    });

    const legacyMarkup = getStatDescriptionMarkup("最终面板攻击和生命值");
    const legacyTemplate = document.createElement("template");
    legacyTemplate.innerHTML = legacyMarkup;
    assert(
      legacyTemplate.content.querySelectorAll(".inline-stat-icon-attack").length === 1 &&
        legacyTemplate.content.querySelectorAll(".inline-stat-icon-health").length === 1,
      "旧版左慈技能文案没有兼容转换为攻击与生命图标",
    );
  });

  test("单属性词图标与属性对保持相同垂直基线", () => {
    const fixture = document.createElement("div");
    fixture.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
    fixture.innerHTML = [
      ["甄姬", "term-attack"],
      ["廖化", "term-health"],
      ["庞德", "stat-pair"],
    ]
      .map(([heroName, fixtureName]) => {
        const hero = CARD_POOLS.hero.find((entry) => entry.name === heroName);
        return `<div data-alignment-fixture="${fixtureName}">${createHeroCardMarkup(hero, { showCost: true })}</div>`;
      })
      .join("");
    document.body.append(fixture);
    try {
      const pair = fixture.querySelector(
        '[data-alignment-fixture="stat-pair"] .inline-stat-pair',
      );
      const termIcons = fixture.querySelectorAll(
        '[data-alignment-fixture^="term-"] .inline-stat-term-icon',
      );
      const pairBaseline = pair ? getComputedStyle(pair).verticalAlign : "";
      assert(
        pairBaseline &&
          termIcons.length === 2 &&
          Array.from(termIcons).every(
            (icon) => getComputedStyle(icon).verticalAlign === pairBaseline,
          ),
        "单属性词图标没有与属性对使用相同垂直基线",
      );
    } finally {
      fixture.remove();
    }
  });

  test("羁绊描述统一武将称谓、无句号并标记阵营色", () => {
    const normalized = normalizeBondDescription("每阵亡4名魏将，在己方最前方召唤1名骑兵。");
    const markup = getBondDescriptionMarkup("每阵亡4名魏将，在己方最前方召唤1名骑兵。");
    assert(normalized.includes("魏武将"), "魏将没有规范为魏武将");
    assert(!normalized.includes("魏将") && !normalized.includes("。"), "羁绊描述仍含简称或句号");
    assert(
      markup.includes('class="bond-faction-word" data-faction="魏"') && markup.includes("</span>武将"),
      "羁绊描述没有为阵营字生成对应颜色标记",
    );
    assert(
      Object.values(BOND_RULES).every((bond) =>
        Object.values(bond.effects).every(
          (effect) => !effect.includes("。") && !/([魏蜀吴群])将/.test(effect),
        ),
      ),
      "正式羁绊描述仍含句号或旧称谓",
    );
  });

  test("羁绊与武将详情在原面板旁显示衍生内容", () => {
    const renderHeroTemplate = (name) => {
      const hero = CARD_POOLS.hero.find((candidate) => candidate.name === name);
      const template = document.createElement("template");
      template.innerHTML = createHeroCardMarkup(hero, { showCost: true }).trim();
      return template;
    };
    assert(
      renderHeroTemplate("黄盖").content.querySelector('[data-derived-id="burn"]'),
      "涉及灼烧的武将详情没有显示灼烧说明",
    );
    assert(
      renderHeroTemplate("马云禄").content.querySelector('[data-derived-id="cavalry"]'),
      "涉及骑兵的武将详情没有显示骑兵说明",
    );
    assert(
      renderHeroTemplate("关羽").content.querySelector('[data-derived-id="intimidated"]'),
      "涉及震慑的武将详情没有显示震慑说明",
    );
    assert(
      renderHeroTemplate("袁术").content.querySelector('[data-derived-id="imperial-jade-seal"]'),
      "涉及传国玉玺的武将详情没有显示衍生装备说明",
    );
    const weiDerivedNames = getDerivedContentEntries(Object.values(BOND_RULES.魏.effects)).map(
      (entry) => entry.name,
    );
    assert(
      weiDerivedNames.includes("骑兵") && weiDerivedNames.includes("重骑兵"),
      "魏羁绊详情没有同时关联骑兵与重骑兵",
    );
    const wuDerivedNames = getDerivedContentEntries(Object.values(BOND_RULES.吴.effects)).map(
      (entry) => entry.name,
    );
    assert(
      wuDerivedNames.includes("灼烧") && wuDerivedNames.includes("引燃"),
      "吴羁绊详情没有同时关联灼烧与引燃",
    );
  });

  test("衍生内容名称在详情中使用独立颜色语义标记", () => {
    const hero = CARD_POOLS.hero.find((candidate) => candidate.name === "马云禄");
    const template = document.createElement("template");
    template.innerHTML = createHeroCardMarkup(hero, { showCost: true }).trim();
    assert(
      template.content.querySelector(
        '.hero-skill-description .derived-content-term[data-derived-id="cavalry"]',
      ),
      "武将技能描述中的骑兵名称没有生成衍生内容颜色标记",
    );
    assert(
      template.content.querySelector(
        '.derived-detail-name',
      )?.textContent.trim() === "骑兵",
      "衍生内容说明标题没有生成独立名称标记",
    );
    const cavalryDefinition = DERIVED_CONTENT_DEFINITIONS.find((entry) => entry.id === "cavalry");
    const cavalryDetail = template.content.querySelector(
      '.derived-detail-card[data-derived-id="cavalry"]',
    );
    const cavalryStatValues = cavalryDetail?.querySelectorAll(
      ".derived-detail-stats .inline-stat-value",
    );
    assert(
      cavalryDetail?.querySelector(".derived-detail-description")?.textContent.trim() === "无技能" &&
        !cavalryDetail.textContent.includes("马云禄召唤") &&
        cavalryDefinition?.internalRules.includes("马云禄召唤"),
      "骑兵的玩家显示文案与底层规则没有正确分离",
    );
    assert(
      cavalryStatValues?.length === 2 &&
        cavalryStatValues[0].querySelector(".inline-stat-icon-attack") &&
        cavalryStatValues[0].textContent.trim() === "2" &&
        cavalryStatValues[1].querySelector(".inline-stat-icon-health") &&
        cavalryStatValues[1].textContent.trim() === "1",
      "骑兵攻血没有以攻击图标在前、生命图标在前的格式显示在标题中",
    );
    const bondMarkup = getBondDescriptionMarkup(BOND_RULES.魏.effects[4]);
    assert(
      bondMarkup.includes('class="derived-content-term" data-derived-id="heavy-cavalry"'),
      "羁绊描述中的重骑兵名称没有生成衍生内容颜色标记",
    );
  });

  test("重骑兵与白马义从说明复用武将技能等级解析", () => {
    const derivedTemplate = document.createElement("template");
    const derivedEntries = DERIVED_CONTENT_DEFINITIONS.filter((entry) =>
      ["heavy-cavalry", "white-horse"].includes(entry.id),
    );
    derivedTemplate.innerHTML = createDerivedContentRailMarkup(derivedEntries).trim();

    const getDerivedDescription = (id) =>
      derivedTemplate.content.querySelector(
        `.derived-detail-card[data-derived-id="${id}"] .derived-detail-description`,
      );
    const heavyDescription = getDerivedDescription("heavy-cavalry");
    const whiteHorseDescription = getDerivedDescription("white-horse");
    const heavyScaledValue = heavyDescription?.querySelector(".hero-skill-scaled-value");
    const whiteHorseScaledValue = whiteHorseDescription?.querySelector(
      ".hero-skill-scaled-value",
    );

    assert(
      heavyDescription &&
        !/[（）]/.test(heavyDescription.textContent) &&
        heavyScaledValue?.textContent.replace(/\s/g, "") === "+2/+2",
      "重骑兵衍生说明没有把 +（2/2）解析为暖橘色 +2/+2",
    );
    assert(
      whiteHorseDescription &&
        !/[（）]/.test(whiteHorseDescription.textContent) &&
        whiteHorseDescription.querySelector(
          '.inline-stat-term-icon.inline-stat-icon-health[alt="生命值"]',
        ) &&
        whiteHorseDescription.textContent.includes("最低的敌军") &&
        whiteHorseScaledValue?.textContent.trim() === "4",
      "白马义从衍生说明没有把（4）解析为暖橘色 4 点伤害",
    );

    const pangde = CARD_POOLS.hero.find((hero) => hero.name === "庞德");
    const pangdeTemplate = document.createElement("template");
    pangdeTemplate.innerHTML = createHeroCardMarkup(pangde, { showCost: true }).trim();
    const heroScaledValue = pangdeTemplate.content.querySelector(
      ".hero-skill-description .hero-skill-scaled-value",
    );
    assert(
      heroScaledValue &&
        heavyScaledValue?.className === heroScaledValue.className &&
        whiteHorseScaledValue?.className === heroScaledValue.className,
      "衍生单位与正常武将技能没有复用同一等级变量标记",
    );
  });

  test("灼烧与引燃的衍生说明只保留玩家可读首段", () => {
    const burnDefinition = DERIVED_CONTENT_DEFINITIONS.find((entry) => entry.id === "burn");
    const igniteDefinition = DERIVED_CONTENT_DEFINITIONS.find((entry) => entry.id === "ignite");
    assert(
      burnDefinition?.description === "每次任意普通攻击完成后受到 1 点真实伤害",
      "灼烧衍生说明没有精简为首段",
    );
    assert(
      igniteDefinition?.description === "已有灼烧的单位再次获得任意负面状态时触发 6 点真实伤害",
      "引燃衍生说明没有精简为首段",
    );
    assert(
      !burnDefinition.description.includes("；") && !igniteDefinition.description.includes("；"),
      "灼烧或引燃的衍生说明仍包含后续分号段落",
    );
  });

  test("战斗召唤物技能文本完整保留到卡牌快照", () => {
    const runtime = { nextSummonId: 1, teams: { player: [] } };
    const heavyCavalry = createHeavyCavalry(runtime, "player");
    const cavalry = createCavalry(runtime, "player", 2, 1, "魏", 1);
    const whiteHorse = createWhiteHorseSummon(runtime, {
      side: "player",
      level: 2,
      faction: "群",
    });
    const getSummonTooltip = (unit) => {
      const snapshot = getBattleUnitSnapshot(unit);
      const cardUnit = getBattleSnapshotCardUnit(snapshot, 1);
      const template = document.createElement("template");
      template.innerHTML = createHeroCardMarkup(cardUnit, { battleSnapshot: true }).trim();
      return {
        snapshot,
        text: template.content.querySelector(".hero-skill-tooltip")?.textContent ?? "",
      };
    };
    const heavyDetail = getSummonTooltip(heavyCavalry);
    const cavalryDetail = getSummonTooltip(cavalry);
    const whiteHorseDetail = getSummonTooltip(whiteHorse);
    assert(
      heavyDetail.snapshot.skill && heavyDetail.text.includes("攻击前") && heavyDetail.text.includes("+2/+2"),
      "重骑兵技能在战斗快照或卡牌详情中丢失",
    );
    assert(
      cavalryDetail.snapshot.skill && cavalryDetail.text.includes("无技能"),
      "普通骑兵没有明确显示无技能",
    );
    assert(
      whiteHorseDetail.snapshot.skill && whiteHorseDetail.text.includes("白马突袭"),
      "白马义从技能在战斗快照或卡牌详情中丢失",
    );
  });

  test("商店与战斗技能触发复用详情面板水墨标签", () => {
    const shopTemplate = document.createElement("template");
    shopTemplate.innerHTML = getSkillTriggerTagMarkup("老当益壮");
    const shopTag = shopTemplate.content.querySelector(
      ".skill-trigger-tag.hero-skill-name-tag.card-detail-ink-tag",
    );
    assert(shopTag?.textContent.trim() === "老当益壮", "商店技能触发没有使用详情水墨标签");

    const battleTemplate = document.createElement("template");
    battleTemplate.innerHTML = renderBattlePopupMarkup({
      text: "【老当益壮】",
      tone: "skill",
    });
    const battleTag = battleTemplate.content.querySelector(
      ".skill-trigger-tag.hero-skill-name-tag.card-detail-ink-tag",
    );
    assert(battleTag?.textContent.trim() === "老当益壮", "战斗技能触发没有使用详情水墨标签");
    assert(!battleTemplate.content.textContent.includes("【"), "战斗技能标签仍显示书名括号");
  });

  test("属性与伤害浮字按新规则使用BattleNum字形、攻击图标和指定颜色行", () => {
    const pairTemplate = document.createElement("template");
    pairTemplate.innerHTML = getFloatingAttributeTextMarkup("+1/+1");
    assert(
      pairTemplate.content.querySelectorAll(".battle-number-buff .battle-number-glyph").length === 3,
      "属性对没有使用绿色BattleNum的+1/1字形",
    );
    assert(
      pairTemplate.content
        .querySelector(".battle-number-buff .battle-number-glyph")
        ?.getAttribute("style")
        ?.includes("83.33333%"),
      "属性加成没有读取BattleNum绿色字形行",
    );
    assert(
      !pairTemplate.content.querySelector(".floating-stat-icon"),
      "双属性加成仍错误显示攻击力或生命值图标",
    );

    const attackTemplate = document.createElement("template");
    attackTemplate.innerHTML = getFloatingAttributeTextMarkup("+1 攻击力");
    assert(
      attackTemplate.content.querySelectorAll(".battle-number-buff .battle-number-glyph").length === 2 &&
        attackTemplate.content.querySelector(".floating-stat-icon-attack") &&
        !attackTemplate.content.querySelector(".floating-stat-icon-health"),
      "单攻击加成没有显示为绿色+1与攻击图标",
    );

    const healthTemplate = document.createElement("template");
    healthTemplate.innerHTML = getFloatingAttributeTextMarkup("+1 生命值");
    assert(
      healthTemplate.content.querySelectorAll(".battle-number-buff .battle-number-glyph").length === 2 &&
        !healthTemplate.content.querySelector(".floating-stat-icon"),
      "单生命加成没有显示为绿色+1无图标",
    );

    const attackReductionTemplate = document.createElement("template");
    attackReductionTemplate.innerHTML = renderBattlePopupMarkup({
      text: "攻击力-2",
      tone: "debuff",
    });
    assert(
      attackReductionTemplate.content.querySelector(".battle-number-true-damage") &&
        attackReductionTemplate.content.querySelector(".floating-stat-icon-attack") &&
        !attackReductionTemplate.content.querySelector(".floating-stat-icon-health"),
      "减攻击没有显示为白色负数与攻击图标",
    );

    const normalDamageTemplate = document.createElement("template");
    normalDamageTemplate.innerHTML = renderBattlePopupMarkup({
      text: "-2",
      tone: "damage",
      damageAmount: 2,
      damageType: "attack",
    });
    assert(
      normalDamageTemplate.content.querySelector(".battle-number-damage") &&
        !normalDamageTemplate.content.querySelector(".floating-stat-icon"),
      "普通伤害没有显示为红色BattleNum无图标",
    );
    assert(
      normalDamageTemplate.content
        .querySelector(".battle-number-damage .battle-number-glyph")
        ?.getAttribute("style")
        ?.endsWith("0.00000%"),
      "普通伤害没有读取BattleNum红色字形行",
    );

    const trueDamageTemplate = document.createElement("template");
    trueDamageTemplate.innerHTML = renderBattlePopupMarkup({
      text: "-2",
      tone: "damage",
      damageAmount: 2,
      damageType: "true",
    });
    assert(
      trueDamageTemplate.content.querySelector(".battle-number-true-damage") &&
        trueDamageTemplate.content.querySelector(".true-damage") &&
        !trueDamageTemplate.content.querySelector(".floating-stat-icon"),
      "真实伤害没有显示为白色BattleNum无图标",
    );
    assert(
      trueDamageTemplate.content
        .querySelector(".battle-number-true-damage .battle-number-glyph")
        ?.getAttribute("style")
        ?.includes("66.66667%"),
      "真实伤害没有读取BattleNum白色字形行",
    );
  });

  test("新版装备价格与特殊生成装备保持权威数据", () => {
    const getItem = (name) => CARD_POOLS.stratagem.find((item) => item.name === name);
    assert(getItem("令箭")?.cost === 1, "令箭价格不是1金币");
    ["兵符", "绝影", "铁盾", "神农秘典", "蚩尤古盾", "修罗刀"].forEach(
      (name) => assert(getItem(name)?.cost === 3, `${name}价格不是3金币`),
    );
    assert(getItem("传国玉玺")?.generatedOnly && getItem("传国玉玺")?.cost == null, "传国玉玺不应有价格");
    assert(getItem("诏书")?.generatedOnly && getItem("诏书")?.cost == null, "诏书不应进入普通商店");
  });

  test("新版计策价格、前方目标与属性成长保持权威数据", () => {
    const getItem = (name) => CARD_POOLS.stratagem.find((item) => item.name === name);
    assert(getItem("演练")?.cost === 3, "演练价格不是3金币");
    assert(getItem("口才")?.cost === 2, "口才价格不是2金币");
    assert(!getItem("歃血盟书"), "旧计策歃血盟书仍存在于卡池");
    assert(getItem("鼓舞")?.cost === 3, "鼓舞没有替换原4阶计策或价格错误");

    const previousLineup = state.lineup;
    const previousCounts = state.stratagemUseCounts;
    const previousEventCount = state.effectEvents.length;
    const previousBonusAnimationCount = queuedShopBonusAnimations.length;
    try {
      const weiBack = createShopSkillTestUnit({
        id: "stratagem-wei-back",
        name: "计策魏后排",
        faction: "魏",
      });
      const weiMiddle = createShopSkillTestUnit({
        id: "stratagem-wei-middle",
        name: "计策魏中排",
        faction: "魏",
      });
      const wuInactive = createShopSkillTestUnit({
        id: "stratagem-wu-inactive",
        name: "计策吴单将",
        faction: "吴",
      });
      const weiFront = createShopSkillTestUnit({
        id: "stratagem-wei-front",
        name: "计策魏前排",
        faction: "魏",
      });
      const weiFrontmost = createShopSkillTestUnit({
        id: "stratagem-wei-frontmost",
        name: "计策魏最前排",
        faction: "魏",
      });
      const weiUnits = [weiBack, weiMiddle, weiFront, weiFrontmost];
      state.lineup = [weiBack, weiMiddle, wuInactive, weiFront, weiFrontmost];
      state.stratagemUseCounts = {};

      const recommendBefore = weiUnits.reduce(
        (total, unit) => ({ attack: total.attack + unit.attack, health: total.health + unit.health }),
        { attack: 0, health: 0 },
      );
      const recommendOutcome = resolveShopEffect(getItem("举贤").effectId, {
        card: getItem("举贤"),
        targetUnit: null,
        targetIndex: 0,
        selectedFaction: "魏",
      });
      const recommendAfter = weiUnits.reduce(
        (total, unit) => ({ attack: total.attack + unit.attack, health: total.health + unit.health }),
        { attack: 0, health: 0 },
      );
      assert(recommendOutcome.applied, "举贤没有成功结算");
      assert(
        recommendAfter.attack === recommendBefore.attack + 2 &&
          recommendAfter.health === recommendBefore.health + 2,
        "举贤没有使随机1名目标获得+2/+2",
      );

      const advanceBefore = new Map(weiUnits.map((unit) => [unit.id, unit.attack]));
      const advanceOutcome = resolveShopEffect(getItem("同袍共进").effectId, {
        card: getItem("同袍共进"),
        targetUnit: null,
        targetIndex: 0,
        selectedFaction: "魏",
      });
      assert(advanceOutcome.applied, "同袍共进没有成功结算");
      assert(
        weiBack.attack === advanceBefore.get(weiBack.id) &&
          weiMiddle.attack === advanceBefore.get(weiMiddle.id) &&
          weiFront.attack === advanceBefore.get(weiFront.id) + 1 &&
          weiFrontmost.attack === advanceBefore.get(weiFrontmost.id) + 1,
        "同袍共进没有固定强化所选羁绊中最前方2名武将",
      );

      const inactiveBefore = { attack: wuInactive.attack, health: wuInactive.health };
      const hiddenOutcome = resolveShopEffect(getItem("潜龙蓄势").effectId, {
        card: getItem("潜龙蓄势"),
        targetUnit: null,
        targetIndex: 0,
        selectedFaction: null,
      });
      assert(hiddenOutcome.applied, "潜龙蓄势没有成功结算");
      assert(
        wuInactive.attack === inactiveBefore.attack + 2 &&
          wuInactive.health === inactiveBefore.health + 2,
        "潜龙蓄势没有给未激活羁绊武将+2/+2",
      );

      const inspire = getItem("鼓舞");
      const inspireBefore = { attack: weiBack.attack, health: weiBack.health };
      const bondsBefore = [...getBaseUnitBonds(weiBack)];
      const validation = getStratagemUseValidation(inspire, weiBack);
      const inspireOutcome = resolveShopEffect(inspire.effectId, {
        card: inspire,
        targetUnit: weiBack,
        targetIndex: 0,
        selectedFaction: null,
      });
      assert(validation.valid && !validation.requiresBondChoice, "鼓舞错误要求选择羁绊");
      assert(inspireOutcome.applied, "鼓舞没有成功结算");
      assert(
        weiBack.attack === inspireBefore.attack + 3 && weiBack.health === inspireBefore.health + 3,
        "鼓舞没有使所选武将+3/+3",
      );
      assert(
        JSON.stringify(getBaseUnitBonds(weiBack)) === JSON.stringify(bondsBefore),
        "鼓舞错误添加了额外羁绊",
      );
    } finally {
      state.lineup = previousLineup;
      state.stratagemUseCounts = previousCounts;
      state.effectEvents.splice(previousEventCount);
      queuedShopBonusAnimations.splice(previousBonusAnimationCount);
    }
  });

  test("华雄固定造成1点开场伤害且黄忠攻击后给自身经验", () => {
    const huaxiongBattle = simulateBattleTestScenario({
      player: [{ name: "华雄", health: 20 }],
      enemy: [{ name: "华雄木桩", attack: 1, health: 10, skillEffectIds: [] }],
      seed: 101,
      maxExchanges: 0,
    });
    assert(huaxiongBattle.enemyEnd[0]?.health === 9, "华雄开场伤害不是固定1点");

    const huangzhongBattle = simulateBattleTestScenario({
      player: [{ name: "黄忠", health: 50 }],
      enemy: [{ name: "黄忠木桩", attack: 1, health: 50, skillEffectIds: [] }],
      seed: 102,
      maxExchanges: 1,
    });
    const huangzhong = huangzhongBattle.playerEnd.find((unit) => unit.name === "黄忠");
    assert(
      huangzhong?.bonusExperience === 1,
      `黄忠攻击后应获得1经验，实际为${huangzhong?.bonusExperience ?? 0}`,
    );
  });

  test("汉献帝诏书占用装备槽并分别拦截伤害与负面状态", () => {
    const createEdictRuntime = () => {
      const ally = createBattleTestUnit({
        name: "诏书木桩",
        side: "player",
        index: 0,
        attack: 1,
        health: 20,
        skillEffectIds: [],
        statuses: { rest: { amount: 2 } },
      });
      const emperor = createBattleTestUnit({
        name: "汉献帝",
        side: "player",
        index: 1,
        health: 1,
      });
      const enemy = createBattleTestUnit({
        name: "诏书伤害源",
        side: "enemy",
        index: 0,
        attack: 15,
        health: 20,
        skillEffectIds: [],
      });
      const runtime = createBattleRuntime([ally, emperor], [enemy], {
        seed: 103,
        lockedBonds: { player: {}, enemy: {} },
      });
      emperor.health = 0;
      resolveBattleUnitDeath(runtime, emperor, 0);
      assert(ally.equipment?.effectId === "equipment.imperial-edict", "汉献帝没有生成诏书");
      return { runtime, ally, enemy };
    };

    const damageCase = createEdictRuntime();
    dealBattleDamage(damageCase.runtime, {
      source: damageCase.enemy,
      target: damageCase.ally,
      amount: 15,
      type: "true",
      sourceEffectId: "test.edict-damage",
      resolveDeaths: false,
    });
    assert(damageCase.ally.health === 15, "诏书没有把15点伤害减少为5点");
    assert(!damageCase.ally.equipment, "诏书抵挡伤害后没有移除");

    const statusCase = createEdictRuntime();
    applyNegativeStatus(statusCase.runtime, statusCase.ally, "burn", {
      ownerSide: "enemy",
      sourceEffectId: "test.edict-status",
      sourceName: "测试灼烧",
    });
    assert(!statusCase.ally.equipment, "诏书阻止负面状态后没有移除");
    assert(Object.keys(statusCase.ally.statuses).length === 0, "诏书没有同时清空状态槽");
  });

  test("休整阻止负面状态且张辽按等级修改敌军全体当前生命", () => {
    const restTarget = createBattleTestUnit({
      name: "休整测试木桩",
      side: "player",
      index: 0,
      health: 20,
      skillEffectIds: [],
      statuses: { rest: { amount: 4 } },
    });
    const source = createBattleTestUnit({
      name: "休整状态源",
      side: "enemy",
      index: 0,
      health: 20,
      skillEffectIds: [],
    });
    const runtime = createBattleRuntime([restTarget], [source], {
      seed: 104,
      lockedBonds: { player: {}, enemy: {} },
    });
    applyNegativeStatus(runtime, restTarget, "burn", {
      ownerSide: "enemy",
      sourceEffectId: "test.rest-intercept",
      sourceName: "测试灼烧",
    });
    assert(Object.keys(restTarget.statuses).length === 0, "休整没有与传入负面状态一起清除");

    const zhangliaoBattle = simulateBattleTestScenario({
      player: [{ name: "张辽", level: 2, copies: UNIT_LEVEL_COPY_THRESHOLDS[2], health: 50 }],
      enemy: [
        { name: "张辽木桩甲", attack: 1, health: 10, skillEffectIds: [] },
        { name: "张辽木桩乙", attack: 1, health: 11, skillEffectIds: [] },
      ],
      seed: 105,
      maxExchanges: 0,
    });
    assert(
      zhangliaoBattle.enemyEnd.map((unit) => unit.health).join(",") === "6,6",
      `2级张辽没有使敌军全体保留60%当前生命：${zhangliaoBattle.enemyEnd.map((unit) => unit.health).join(",")}`,
    );
  });

  test("甘宁逐次施加灼烧并在击杀后转向新的最后方敌军", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "甘宁", level: 2, copies: UNIT_LEVEL_COPY_THRESHOLDS[2], health: 50 }],
      enemy: [
        { name: "甘宁目标甲", attack: 1, health: 5, skillEffectIds: [] },
        { name: "甘宁目标乙", attack: 1, health: 5, skillEffectIds: [] },
      ],
      seed: 106,
      maxExchanges: 0,
    });
    const igniteKills = battle.structuredLog.filter(
      (entry) => entry.type === "damage" && entry.sourceEffectId === "status.burn-ignite",
    );
    assert(battle.enemyEnd.length === 0, "甘宁剩余施加次数没有转向新的最后方敌军");
    assert(igniteKills.length === 2, `甘宁应触发2次引燃击杀，实际为${igniteKills.length}`);
  });

  test("召唤物继承召唤者全部羁绊且刘备对同羁绊召唤物加经验", () => {
    const battle = simulateBattleTestScenario({
      player: [
        { name: "刘备", health: 50 },
        { name: "马云禄", health: 1, extraFactions: ["魏"] },
      ],
      enemy: [{ name: "召唤测试木桩", attack: 10, health: 50, skillEffectIds: [] }],
      seed: 107,
      maxExchanges: 1,
    });
    const cavalry = battle.playerEnd.find((unit) => unit.name === "骑兵");
    assert(cavalry, "马云禄没有召唤骑兵");
    assert(
      JSON.stringify(getBattleUnitBonds(cavalry)) === JSON.stringify(["蜀", "魏"]),
      `骑兵没有继承马云禄全部羁绊：${getBattleUnitBonds(cavalry).join("、")}`,
    );
    assert(cavalry.bonusExperience === 1, "刘备没有使同羁绊召唤骑兵获得1经验");
  });

  test("颜良获得状态与装备媒介伤害的击杀归属", () => {
    const yanliang = createBattleTestUnit({
      name: "颜良",
      side: "player",
      index: 0,
      health: 20,
    });
    const target = createBattleTestUnit({
      name: "颜良击杀木桩",
      side: "enemy",
      index: 0,
      health: 5,
      skillEffectIds: [],
    });
    const runtime = createBattleRuntime([yanliang], [target], {
      seed: 108,
      lockedBonds: { player: {}, enemy: {} },
    });
    applyNegativeStatus(runtime, target, "burn", {
      ownerSide: "player",
      sourceUnit: yanliang,
      sourceEffectId: "equipment.future-status-damage",
      sourceName: "测试伤害装备",
    });
    applyNegativeStatus(runtime, target, "burn", {
      ownerSide: "player",
      sourceUnit: yanliang,
      sourceEffectId: "equipment.future-status-damage",
      sourceName: "测试伤害装备",
    });
    assert(yanliang.attack === 5 && yanliang.maxHealth === 22, "颜良没有获得+2/+2击杀成长");
  });

  test("魏延文丑周泰按新版阵亡、相邻攻击与交锋减伤触发", () => {
    const weiyanBattle = simulateBattleTestScenario({
      player: [
        { name: "魏延", health: 20 },
        { name: "魏延友军", attack: 1, health: 1, skillEffectIds: [] },
      ],
      enemy: [{ name: "魏延敌军", attack: 10, health: 30, skillEffectIds: [] }],
      seed: 109,
      maxExchanges: 1,
    });
    const weiyan = weiyanBattle.playerEnd.find((unit) => unit.name === "魏延");
    assert(weiyan?.attack === 3 && weiyan?.maxHealth === 21, "魏延没有因其他友军阵亡获得+1/+1");

    const wenchouBattle = simulateBattleTestScenario({
      player: [
        { name: "文丑", health: 20 },
        { name: "文丑前方友军", attack: 1, health: 20, skillEffectIds: [] },
      ],
      enemy: [{ name: "文丑敌军", attack: 1, health: 30, skillEffectIds: [] }],
      seed: 110,
      maxExchanges: 1,
    });
    const wenchou = wenchouBattle.playerEnd.find((unit) => unit.name === "文丑");
    assert(wenchou?.attack === 4 && wenchou?.maxHealth === 21, "文丑没有因最近前方友军攻击获得+1/+1");

    const zhoutaiBattle = simulateBattleTestScenario({
      player: [{ name: "周泰", level: 2, copies: UNIT_LEVEL_COPY_THRESHOLDS[2], health: 20 }],
      enemy: [{ name: "周泰敌军", attack: 10, health: 30, skillEffectIds: [] }],
      seed: 111,
      maxExchanges: 1,
    });
    const zhoutai = zhoutaiBattle.playerEnd.find((unit) => unit.name === "周泰");
    assert(zhoutai?.health === 16, `2级周泰应把10点伤害减为4点，实际剩余生命${zhoutai?.health}`);
  });

  test("马岱按等级造成伤害且荀攸在成功使用计策后强化前后友军", () => {
    const previousLineup = state.lineup;
    const previousCounts = { ...state.stratagemUseCounts };
    const previousEventCount = state.effectEvents.length;
    const previousBonusAnimationCount = queuedShopBonusAnimations.length;
    try {
      const madai = createShopSkillTestUnit({
        id: "madai-owner",
        name: "马岱",
        faction: "蜀",
        level: 2,
        health: 20,
      });
      const madaiTarget = createShopSkillTestUnit({
        id: "madai-target",
        name: "马岱前方友军",
        faction: "蜀",
        health: 10,
      });
      state.lineup = [madai, madaiTarget, null, null, null];
      resolveShopHeroSkill(
        { owner: madai, effectId: "hero.madai.fuzhan" },
        { type: "round:end", payload: {} },
      );
      assert(madaiTarget.health === 6, "2级马岱没有造成4点伤害");

      const behind = createShopSkillTestUnit({
        id: "xunyou-behind",
        name: "荀攸后方友军",
        faction: "魏",
      });
      const xunyou = createShopSkillTestUnit({
        id: "xunyou-owner",
        name: "荀攸",
        faction: "魏",
        level: 2,
      });
      xunyou.skillEffectIds = ["hero.xunyou.qice"];
      const ahead = createShopSkillTestUnit({
        id: "xunyou-ahead",
        name: "荀攸前方友军",
        faction: "魏",
      });
      const behindAttackBefore = behind.attack;
      const aheadAttackBefore = ahead.attack;
      state.lineup = [behind, xunyou, ahead, null, null];
      const card = CARD_POOLS.stratagem.find((item) => item.effectId === "stratagem.encourage");
      const outcome = resolveShopEffect(card.effectId, {
        card,
        targetUnit: ahead,
        targetIndex: 2,
        selectedFaction: null,
      });
      assert(outcome.applied, "测试计策没有成功使用");
      assert(behind.attack === behindAttackBefore + 2, "荀攸没有强化最近后方友军");
      assert(ahead.attack === aheadAttackBefore + 3, "荀攸没有在计策自身+1之外再强化前方友军+2");
    } finally {
      state.lineup = previousLineup;
      state.stratagemUseCounts = previousCounts;
      state.effectEvents.splice(previousEventCount);
      queuedShopBonusAnimations.splice(previousBonusAnimationCount);
    }
  });

  test("于吉在原位置召唤继承全部羁绊的方士且公孙瓒召唤4/4白马", () => {
    const rear = createBattleTestUnit({
      name: "于吉后排",
      side: "player",
      index: 0,
      health: 20,
      skillEffectIds: [],
    });
    const yuji = createBattleTestUnit({
      name: "于吉",
      side: "player",
      index: 1,
      health: 1,
      extraFactions: ["魏", "吴"],
    });
    const front = createBattleTestUnit({
      name: "于吉前排",
      side: "player",
      index: 2,
      health: 20,
      skillEffectIds: [],
    });
    const enemy = createBattleTestUnit({
      name: "于吉测试敌军",
      side: "enemy",
      index: 0,
      health: 20,
      skillEffectIds: [],
    });
    const runtime = createBattleRuntime([rear, yuji, front], [enemy], {
      seed: 112,
      lockedBonds: { player: {}, enemy: {} },
    });
    yuji.health = 0;
    resolveBattleUnitDeath(runtime, yuji, 0);
    const fangshi = runtime.teams.player[1];
    assert(fangshi?.name === "方士", "方士没有回到于吉原来的中间位置");
    assert(
      JSON.stringify(getBattleUnitBonds(fangshi)) === JSON.stringify(["魏", "吴"]),
      `方士没有继承于吉全部羁绊：${getBattleUnitBonds(fangshi).join("、")}`,
    );

    const gongsunBattle = simulateBattleTestScenario({
      player: [{ name: "公孙瓒", health: 1 }],
      enemy: [{ name: "白马测试敌军", attack: 10, health: 30, skillEffectIds: [] }],
      seed: 113,
      maxExchanges: 1,
    });
    const whiteHorse = gongsunBattle.playerEnd.find((unit) => unit.name === "白马义从");
    assert(whiteHorse?.attack === 4 && whiteHorse?.maxHealth === 4, "白马义从基础攻血不是4/4");
  });

  test("铁盾抵挡10点伤害且只生效1次", () => {
    const battle = simulateBattleTestScenario({
      player: [{
        name: "铁盾测试武将",
        attack: 0,
        health: 100,
        skillEffectIds: [],
        equipment: { name: "铁盾", effectId: "equipment.iron-shield" },
      }],
      enemy: [{ name: "铁盾测试敌军", attack: 20, health: 100, skillEffectIds: [] }],
      seed: 201,
      maxExchanges: 2,
    });
    const steps = battle.presentationTimeline.filter(
      (step) => step.effectId === "equipment.iron-shield",
    );
    assert(steps.length === 1, `铁盾应只生效1次，实际生效${steps.length}次`);
    assert(steps[0]?.entries?.[0]?.blocked === 10, "铁盾没有抵挡10点伤害");
    assert(!steps[0]?.snapshot?.player?.[0]?.equipment, "铁盾生效后没有从装备槽移除");
  });

  test("帅印在商店阶段强化新召唤武将且不响应复活", () => {
    const previousLineup = state.lineup;
    const previousLogLength = state.logs.length;
    const previousSkillAnimationCount = queuedShopSkillAnimations.length;
    const previousBonusAnimationCount = queuedShopBonusAnimations.length;
    const previousSequence = shopPresentationSequence;
    try {
      const owner = createShopSkillTestUnit({
        id: "shop-commander-seal-owner",
        name: "帅印携带者",
        faction: "魏",
      });
      owner.directModifiers.equipment = {
        name: "帅印",
        effectId: "equipment.commander-seal",
      };
      const summoned = createShopSkillTestUnit({
        id: "shop-commander-seal-summon",
        name: "新召唤武将",
        faction: "蜀",
        attack: 3,
        health: 4,
      });
      state.lineup = [owner, summoned, null, null, null];

      dispatchShopEvent("unit:summon", { unit: summoned, source: "test" });
      assert(
        summoned.bodyAttack === 4 && summoned.bodyHealth === 5,
        `帅印没有在商店阶段使新召唤武将从3/4变为4/5：${summoned.bodyAttack}/${summoned.bodyHealth}`,
      );
      const skillAnimations = queuedShopSkillAnimations.slice(previousSkillAnimationCount);
      const bonusAnimations = queuedShopBonusAnimations.slice(previousBonusAnimationCount);
      assert(
        skillAnimations.length === 1 && skillAnimations[0].skillName === "帅印",
        "帅印提供商店加成前没有播放帅印技能标签",
      );
      assert(
        bonusAnimations.length === 1 &&
          skillAnimations[0].sequence < bonusAnimations[0].sequence,
        "帅印技能标签没有先于+1/+1属性飘字播放",
      );

      dispatchShopEvent("unit:summon", { unit: summoned, source: "test", revived: true });
      assert(
        summoned.bodyAttack === 4 && summoned.bodyHealth === 5,
        "帅印错误地响应了复活事件",
      );
    } finally {
      state.lineup = previousLineup;
      state.logs.splice(previousLogLength);
      queuedShopSkillAnimations.splice(previousSkillAnimationCount);
      queuedShopBonusAnimations.splice(previousBonusAnimationCount);
      shopPresentationSequence = previousSequence;
    }
  });

  test("甄姬在商店和战斗中都不把复活视为召唤", () => {
    const shopOwner = createShopSkillTestUnit({
      id: "shop-zhenji-revive-owner",
      name: "甄姬",
      faction: "魏",
    });
    const shopTarget = createShopSkillTestUnit({
      id: "shop-zhenji-revive-target",
      name: "复活友军",
      faction: "魏",
    });
    const shopCandidate = {
      owner: shopOwner,
      effectId: "hero.zhenji.luoshen",
    };
    assert(
      !isShopHeroEventApplicable(shopCandidate, "unit:summon", {
        unit: shopTarget,
        revived: true,
      }),
      "甄姬在商店阶段错误地把复活视为召唤",
    );

    const battleOwner = createBattleTestUnit({
      name: "甄姬",
      side: "player",
      index: 0,
    });
    const battleTarget = createBattleTestUnit({
      name: "复活友军",
      side: "player",
      index: 1,
      skillEffectIds: [],
    });
    const runtime = createBattleRuntime([battleOwner, battleTarget], [], {
      seed: 202,
      lockedBonds: { player: {}, enemy: {} },
    });
    assert(
      !isBattleHeroSkillApplicable(
        runtime,
        {
          owner: battleOwner,
          effectId: "hero.zhenji.luoshen",
          definition: EFFECT_DEFINITIONS["hero.zhenji.luoshen"],
        },
        { type: "unit:summon", payload: { unit: battleTarget, revived: true } },
      ),
      "甄姬在战斗阶段错误地把复活视为召唤",
    );
  });

  test("帅印会强化骑兵等己方衍生武将", () => {
    const battle = simulateBattleTestScenario({
      player: [
        {
          name: "帅印携带者",
          attack: 1,
          health: 20,
          skillEffectIds: [],
          equipment: { name: "帅印", effectId: "equipment.commander-seal" },
        },
        {
          name: "马云禄",
          attack: 0,
          health: 1,
          skillEffectIds: ["hero.mayunlu.xiliang-lienv"],
        },
      ],
      enemy: [{ name: "帅印测试敌军", attack: 5, health: 50, skillEffectIds: [] }],
      seed: 202,
      maxExchanges: 1,
    });
    const cavalry = battle.playerEnd.find((unit) => unit.name.includes("骑兵"));
    assert(cavalry?.attack === 3 && cavalry?.health === 2, "帅印没有使衍生骑兵从2/1变为3/2");
    const bonusCueCount = battle.presentationTimeline
      .flatMap((step) => step.cues ?? [])
      .filter((cue) => cue.unitId === cavalry?.id && cue.text === "+1/+1").length;
    assert(bonusCueCount === 1, `帅印的+1/+1应只飘字1次，实际为${bonusCueCount}次`);
    const sealOwner = battle.playerEnd.find((unit) => unit.name === "帅印携带者");
    const sealLabelStepIndex = battle.presentationTimeline.findIndex((step) =>
      (step.cues ?? []).some(
        (cue) => cue.unitId === sealOwner?.id && cue.text === "【帅印】",
      ),
    );
    const bonusStepIndex = battle.presentationTimeline.findIndex((step) =>
      (step.cues ?? []).some(
        (cue) => cue.unitId === cavalry?.id && cue.text === "+1/+1",
      ),
    );
    assert(sealLabelStepIndex >= 0, "帅印提供战斗加成前没有播放帅印技能标签");
    assert(
      sealLabelStepIndex < bonusStepIndex,
      "帅印技能标签没有先于+1/+1属性飘字播放",
    );
  });

  test("虎符结算+3/+3与1经验且经验成长同步生效", () => {
    const battle = simulateBattleTestScenario({
      player: [{
        name: "虎符测试武将",
        attack: 4,
        health: 6,
        skillEffectIds: [],
        equipment: { name: "虎符", effectId: "equipment.tiger-tally" },
      }],
      enemy: [{ name: "虎符木桩", attack: 0, health: 20, skillEffectIds: [] }],
      seed: 203,
      maxExchanges: 0,
    });
    const owner = battle.playerEnd[0];
    assert(owner.attack === 8 && owner.health === 10, "虎符属性与1经验带来的卡牌成长没有完整结算");
    assert(owner.experience === 1, "虎符没有给予1经验");
  });

  test("白玉龟清除负面状态并使携带者+2/+2", () => {
    const battle = simulateBattleTestScenario({
      player: [{
        name: "白玉龟测试武将",
        attack: 4,
        health: 6,
        skillEffectIds: [],
        equipment: { name: "白玉龟", effectId: "equipment.white-jade-turtle" },
      }],
      enemy: [{ name: "贾诩", attack: 0, health: 20, skillEffectIds: ["hero.jiaxu.fanjian"] }],
      seed: 204,
      maxExchanges: 0,
    });
    const owner = battle.playerEnd[0];
    assert(owner.attack === 6 && owner.health === 8 && !getNegativeStatusId(owner), "白玉龟清除或成长效果错误");
  });

  test("阎魔帆以同等级5/5复活且不继承装备与状态", () => {
    const battle = simulateBattleTestScenario({
      player: [{
        name: "阎魔帆测试武将",
        attack: 1,
        health: 1,
        level: 2,
        statuses: { burn: { stacks: 1 } },
        skillEffectIds: [],
        equipment: { name: "阎魔帆", effectId: "equipment.yanmo-sail" },
      }],
      enemy: [{ name: "阎魔帆测试敌军", attack: 5, health: 20, skillEffectIds: [] }],
      seed: 205,
      maxExchanges: 1,
    });
    const revived = battle.playerEnd.find((unit) => unit.name === "阎魔帆测试武将");
    assert(revived?.attack === 5 && revived?.health === 5 && revived?.level === 2, "阎魔帆复活面板或等级错误");
    assert(!revived?.equipment && !getNegativeStatusId(revived), "阎魔帆复活后仍有装备或状态");
  });

  test("方天画戟同时攻击阶段按30%向下取整增伤与减伤", () => {
    const battle = simulateBattleTestScenario({
      player: [{
        name: "方天画戟测试武将",
        attack: 11,
        health: 50,
        skillEffectIds: [],
        equipment: { name: "方天画戟", effectId: "equipment.fangtian-halberd" },
      }],
      enemy: [{ name: "方天画戟测试敌军", attack: 11, health: 50, skillEffectIds: [] }],
      seed: 206,
      maxExchanges: 1,
    });
    const changes = battle.presentationTimeline
      .filter((step) => step.effectId === "equipment.fangtian-halberd")
      .flatMap((step) => step.entries ?? [])
      .map((entry) => entry.damageChange);
    assert(changes.includes(3) && changes.includes(-3), `方天画戟没有按11攻结算+3/-3：${changes.join("、")}`);
  });

  test("黄天令旗按自身攻击力20%向下取整附加每次技能伤害", () => {
    const battle = simulateBattleTestScenario({
      player: [{
        name: "华雄",
        attack: 11,
        health: 20,
        skillEffectIds: ["hero.huaxiong.xiaoyong"],
        equipment: { name: "黄天令旗", effectId: "equipment.yellow-heaven-banner" },
      }],
      enemy: [{ name: "黄天令旗木桩", attack: 0, health: 20, skillEffectIds: [] }],
      seed: 207,
      maxExchanges: 0,
    });
    const bannerEntry = battle.presentationTimeline
      .find((step) => step.effectId === "equipment.yellow-heaven-banner")
      ?.entries?.[0];
    assert(bannerEntry?.damageChange === 2, "黄天令旗11攻没有附加向下取整后的2点技能伤害");
  });

  test("战斗场内隐藏过程说明与交锋标识且只保留结果印章", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "甲", attack: 10, health: 10 }],
      enemy: [{ name: "乙", attack: 1, health: 1 }],
      maxExchanges: 1,
    });
    const processSteps = battle.presentationTimeline.filter(
      (step) => step.kind !== "result",
    );
    assert(
      processSteps.some((step) => step.kind === "clash"),
      "测试场景没有生成交锋节点",
    );
    assert(
      processSteps.every(
        (step) =>
          !renderBattleAnimationBattlefield(battle, step).includes(
            "battle-field-center",
          ),
      ),
      "战斗过程仍渲染中央说明或交锋标识",
    );
    const resultStep = battle.presentationTimeline.find(
      (step) => step.kind === "result",
    );
    const resultMarkup = renderBattleAnimationBattlefield(battle, resultStep);
    assert(
      resultMarkup.includes("battle-field-result-mark"),
      "战斗结果印章被错误隐藏",
    );
  });

  test("对手数据第11回合起的5人羁绊使用5人效果", () => {
    const pool = getOpponentDataPool();
    let verifiedFivePersonBonds = 0;
    pool.forEach((entry) => {
      entry.session.rounds
        .filter((round) => round.round >= 11)
        .forEach((round) => {
          const unlockedFactions = round.unlockedFivePersonBonds ?? [];
          (round.bonds ?? [])
            .filter((bond) => bond.count >= 5)
            .forEach((bond) => {
              assert(
                unlockedFactions.includes(bond.faction),
                `${entry.label} 第${round.round}回合没有解锁${bond.faction}5人效果`,
              );
              assert(
                bond.level === 5,
                `${entry.label} 第${round.round}回合${bond.faction}旧兼容档位不是5`,
              );
              assert(
                getBondEffectCount(bond.count, bond.faction, unlockedFactions) === 5,
                `${entry.label} 第${round.round}回合${bond.faction}没有按5人效果结算`,
              );
              verifiedFivePersonBonds += 1;
            });
        });
    });
    assert(verifiedFivePersonBonds > 0, "第11回合后的对手数据没有可验证的5人羁绊");
  });

  return {
    passed: tests.every((entry) => entry.passed),
    tests,
  };

  test("3级刘备仁泽只影响最近目标且经验固定减少1点", () => {
    const previousLineup = state.lineup;
    const previousBonusAnimationCount = queuedShopBonusAnimations.length;
    try {
      const liubei = createShopSkillTestUnit({
        id: "liubei-renze-owner",
        name: "刘备",
        faction: "蜀",
        level: 3,
        copies: UNIT_LEVEL_COPY_THRESHOLDS[3],
        attack: 7,
        health: 7,
      });
      const nearestTarget = createShopSkillTestUnit({
        id: "liubei-renze-nearest",
        name: "赵云",
        faction: "蜀",
        copies: 1,
        bonusExperience: 2,
      });
      const fartherTarget = createShopSkillTestUnit({
        id: "liubei-renze-farther",
        name: "马超",
        faction: "蜀",
        copies: 1,
        bonusExperience: 2,
      });
      state.lineup = [liubei, nearestTarget, fartherTarget, null, null];
      const nearestProgressBefore = getUnitProgressValue(nearestTarget);
      const fartherProgressBefore = getUnitProgressValue(fartherTarget);
      const nearestBodyAttackBefore = nearestTarget.bodyAttack;
      const nearestBodyHealthBefore = nearestTarget.bodyHealth;
      const fartherBodyAttackBefore = fartherTarget.bodyAttack;
      const fartherBodyHealthBefore = fartherTarget.bodyHealth;

      resolveShopHeroSkill(
        { owner: liubei, effectId: "hero.liubei.renze" },
        { type: "round:end", payload: {} },
      );

      assert(
        getUnitProgressValue(nearestTarget) === nearestProgressBefore - 1,
        "3级刘备使最近目标减少的经验不是固定1点",
      );
      assert(
        nearestTarget.bodyAttack === nearestBodyAttackBefore + 15 &&
          nearestTarget.bodyHealth === nearestBodyHealthBefore + 15,
        "3级刘备没有使最近目标获得 +15/+15",
      );
      assert(
        getUnitProgressValue(fartherTarget) === fartherProgressBefore &&
          fartherTarget.bodyAttack === fartherBodyAttackBefore &&
          fartherTarget.bodyHealth === fartherBodyHealthBefore,
        "3级刘备错误影响了第二名同羁绊目标",
      );
    } finally {
      state.lineup = previousLineup;
      queuedShopBonusAnimations.splice(previousBonusAnimationCount);
    }
  });

  test("3级孙权权衡使前方加15攻击且后方加15生命", () => {
    const previousLineup = state.lineup;
    const previousBonusAnimationCount = queuedShopBonusAnimations.length;
    try {
      const behindTarget = createShopSkillTestUnit({
        id: "sunquan-quanheng-behind",
        name: "韩当",
        faction: "吴",
      });
      const sunquan = createShopSkillTestUnit({
        id: "sunquan-quanheng-owner",
        name: "孙权",
        faction: "吴",
        level: 3,
        copies: UNIT_LEVEL_COPY_THRESHOLDS[3],
      });
      const aheadTarget = createShopSkillTestUnit({
        id: "sunquan-quanheng-ahead",
        name: "太史慈",
        faction: "吴",
      });
      state.lineup = [behindTarget, sunquan, aheadTarget, null, null];
      const behindBodyAttackBefore = behindTarget.bodyAttack;
      const behindBodyHealthBefore = behindTarget.bodyHealth;
      const aheadBodyAttackBefore = aheadTarget.bodyAttack;
      const aheadBodyHealthBefore = aheadTarget.bodyHealth;

      resolveShopHeroSkill(
        { owner: sunquan, effectId: "hero.sunquan.quanheng" },
        { type: "round:end", payload: {} },
      );

      assert(
        aheadTarget.bodyAttack === aheadBodyAttackBefore + 15 &&
          aheadTarget.bodyHealth === aheadBodyHealthBefore,
        "3级孙权没有使前方最近目标获得 +15 攻击",
      );
      assert(
        behindTarget.bodyAttack === behindBodyAttackBefore &&
          behindTarget.bodyHealth === behindBodyHealthBefore + 15,
        "3级孙权没有使后方最近目标获得 +15 生命",
      );
    } finally {
      state.lineup = previousLineup;
      queuedShopBonusAnimations.splice(previousBonusAnimationCount);
    }
  });

  test("对手数据池包含至少4份完整的20回合数据", () => {
    const pool = getOpponentDataPool();
    assert(pool.length >= OPPONENT_POOL_MIN_SIZE, `有效对手数据只有 ${pool.length} 份`);
    pool.forEach((entry) => {
      assert(
        hasCompleteOpponentRounds(entry.session),
        `${entry.label} 不是完整的20回合对手数据`,
      );
    });
  });

  test("对手抽取表禁止连续重复且任意10回合单份最多3次", () => {
    const schedule = createOpponentPoolSchedule(getOpponentDataPool(), {
      random: () => 0,
    });
    assert(
      schedule.length === PLAYER_DATA_TEST_MAX_ROUND,
      `抽取表应有${PLAYER_DATA_TEST_MAX_ROUND}回合，实际为${schedule.length}`,
    );
    schedule.forEach((entry, index) => {
      if (index === 0) return;
      assert(entry.key !== schedule[index - 1].key, `第${entry.round}回合连续抽到重复数据`);
    });
    for (
      let start = 0;
      start <= schedule.length - OPPONENT_POOL_WINDOW_SIZE;
      start += 1
    ) {
      const windowEntries = schedule.slice(start, start + OPPONENT_POOL_WINDOW_SIZE);
      const counts = windowEntries.reduce((result, entry) => {
        result.set(entry.key, (result.get(entry.key) ?? 0) + 1);
        return result;
      }, new Map());
      counts.forEach((count, key) => {
        assert(
          count <= OPPONENT_POOL_MAX_PER_WINDOW,
          `第${start + 1}～${start + OPPONENT_POOL_WINDOW_SIZE}回合中 ${key} 出现${count}次`,
        );
      });
    }
  });

  test("马云禄开场经验立即更新卡面", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "马云禄" }],
      enemy: [{ name: "木桩", attack: 1, health: 20, skillEffectIds: [] }],
      seed: 17,
      maxExchanges: 0,
    });
    const skillIndex = battle.presentationTimeline.findIndex(
      (step) =>
        step.kind === "skill" &&
        step.effectId === "hero.mayunlu.xiliang-lienv",
    );
    const experienceIndex = battle.presentationTimeline.findIndex(
      (step) =>
        step.kind === "experience" &&
        step.effectId === "hero.mayunlu.xiliang-lienv",
    );
    const experienceStep = battle.presentationTimeline[experienceIndex];
    const mayunlu = getUnit(experienceStep, "player", "马云禄");
    assert(skillIndex >= 0, "缺少马云禄技能宣布步骤");
    assert(experienceIndex > skillIndex, "经验变化没有排在技能宣布之后");
    assert(
      mayunlu?.attack === 3 &&
        mayunlu?.health === 3 &&
        mayunlu?.experience === 1,
      "马云禄经验步骤后的攻血或经验不正确",
    );
    assert(
      experienceStep.changes.some(
        (change) => change.unitName === "马云禄" && change.field === "experience",
      ),
      "经验变化未写入步骤差异",
    );
    assertContinuous(battle);
  });

  test("华雄开场伤害逐段扣血", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "华雄", health: 20 }],
      enemy: [{ name: "木桩", attack: 1, health: 10, skillEffectIds: [] }],
      seed: 23,
      maxExchanges: 0,
    });
    const skillIndex = battle.presentationTimeline.findIndex(
      (step) =>
        step.kind === "skill" && step.effectId === "hero.huaxiong.xiaoyong",
    );
    const damageIndex = battle.presentationTimeline.findIndex(
      (step) =>
        step.kind === "damage" && step.effectId === "hero.huaxiong.xiaoyong",
    );
    const target = getUnit(battle.presentationTimeline[damageIndex], "enemy", "木桩");
    assert(skillIndex >= 0 && damageIndex > skillIndex, "华雄技能与伤害步骤顺序错误");
    assert(target?.health === 8, `华雄伤害后生命应为8，实际为${target?.health}`);
    assertContinuous(battle);
  });

  test("基础交锋在单一步骤同时扣除双方生命", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "甲", attack: 3, health: 10, skillEffectIds: [] }],
      enemy: [{ name: "乙", attack: 4, health: 10, skillEffectIds: [] }],
      seed: 31,
      maxExchanges: 1,
    });
    const clashes = battle.presentationTimeline.filter(
      (step) => step.kind === "clash",
    );
    assert(clashes.length === 1, "基础交锋应只有一个同步扣血步骤");
    const clash = clashes[0];
    assert(clash.simultaneous, "基础交锋没有标记为同时结算");
    assert(
      getUnit(clash, "player", "甲")?.health === 6 &&
        getUnit(clash, "enemy", "乙")?.health === 7,
      "同步交锋后的双方生命不正确",
    );
    const healthChanges = clash.changes.filter(
      (change) => change.field === "health",
    );
    assert(healthChanges.length === 2, "同步交锋未在同一步记录两份生命变化");
    assertContinuous(battle);
  });

  test("攻击后技能按当前攻击力逐个播放", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "韩当", attack: 5, health: 20 }],
      enemy: [{ name: "夏侯渊", attack: 3, health: 20 }],
      seed: 41,
      maxExchanges: 1,
    });
    const attackAfterSkills = battle.presentationTimeline.filter(
      (step) => step.kind === "skill" && step.timingWindow === "attack:after",
    );
    assert(attackAfterSkills.length >= 2, "缺少双方攻击后技能步骤");
    assert(
      attackAfterSkills[0].effectId === "hero.handang.zuoyou-kaigong" &&
        attackAfterSkills[1].effectId === "hero.xiahouyuan.qianli-benxi",
      "攻击后技能没有按当前攻击力从高到低结算",
    );
    assert(
      attackAfterSkills[0].resolvedAttack === 5 &&
        attackAfterSkills[1].resolvedAttack === 3,
      "技能步骤没有记录实际排序攻击力",
    );
    assertContinuous(battle);
  });

  test("装备效果不会打乱攻击后武将技能排序", () => {
    const battle = simulateBattleTestScenario({
      player: [
        {
          name: "夏侯渊",
          attack: 3,
          health: 30,
          equipment: {
            name: "灾厄之刃",
            effectId: "equipment.calamity-blade",
          },
        },
      ],
      enemy: [{ name: "韩当", attack: 5, health: 30 }],
      seed: 43,
      maxExchanges: 1,
    });
    const attackAfterSkills = battle.presentationTimeline.filter(
      (step) => step.kind === "skill" && step.timingWindow === "attack:after",
    );
    assert(
      attackAfterSkills[0]?.effectId === "hero.handang.zuoyou-kaigong" &&
        attackAfterSkills[1]?.effectId === "hero.xiahouyuan.qianli-benxi",
      "同优先级装备效果打乱了武将技能的动态攻击力排序",
    );
    assertContinuous(battle);
  });

  test("百厄角可随机施加全部当前负面状态", () => {
    assert(
      JSON.stringify(NEGATIVE_STATUS_POOL) ===
        JSON.stringify(["burn", "broken-morale", "fear", "chain", "intimidated", "counterplot"]),
      `百厄角负面状态池不完整：${NEGATIVE_STATUS_POOL.join("、")}`,
    );
    const appliedStatuses = new Set();
    for (let seed = 1; seed <= 30 && appliedStatuses.size < NEGATIVE_STATUS_POOL.length; seed += 1) {
      const battle = simulateBattleTestScenario({
        player: [
          {
            name: "百厄角测试武将",
            faction: "魏",
            attack: 1,
            health: 100,
            skillEffectIds: [],
            equipment: {
              name: "百厄角",
              effectId: "equipment.calamity-blade",
            },
          },
        ],
        enemy: [
          { name: "百厄角原前排", attack: 1, health: 1, skillEffectIds: [] },
          { name: "百厄角后续前排", attack: 1, health: 100, skillEffectIds: [] },
        ],
        seed,
        maxExchanges: 1,
      });
      battle.presentationTimeline
        .filter(
          (step) =>
            step.kind === "status" &&
            step.effectId === "equipment.calamity-blade",
        )
        .forEach((step) => {
          assert(
            step.entries?.[0]?.targetName === "百厄角后续前排",
            `百厄角应作用于触发时的敌方最前排，实际为${step.entries?.[0]?.targetName}`,
          );
          appliedStatuses.add(step.entries?.[0]?.statusId);
        });
      assertContinuous(battle);
    }
    NEGATIVE_STATUS_POOL.forEach((statusId) => {
      assert(
        appliedStatuses.has(statusId),
        `百厄角回归场景未能施加${STATUS_LABELS[statusId] ?? statusId}`,
      );
    });
  });

  test("蚩尤古盾抵挡与剩余次数形成独立动画步骤", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "木桩甲", attack: 20, health: 30, skillEffectIds: [] }],
      enemy: [
        {
          name: "木桩乙",
          attack: 1,
          health: 30,
          skillEffectIds: [],
          equipment: {
            name: "蚩尤古盾",
            effectId: "equipment.black-tortoise-shield",
          },
        },
      ],
      seed: 45,
      maxExchanges: 1,
    });
    const shieldStep = battle.presentationTimeline.find(
      (step) =>
        step.kind === "equipment" &&
        step.effectId === "equipment.black-tortoise-shield",
    );
    const shieldOwner = getUnit(shieldStep, "enemy", "木桩乙");
    assert(shieldStep, "蚩尤古盾没有生成独立动画步骤");
    assert(
      shieldOwner?.equipment?.runtime?.remainingCharges === 1,
      "蚩尤古盾动画快照没有显示扣除后的剩余次数",
    );
    assertContinuous(battle);
  });

  test("限次装备用尽后立即移除且不显示0次", () => {
    const shieldBattle = simulateBattleTestScenario({
      player: [{ name: "木桩甲", attack: 20, health: 30, skillEffectIds: [] }],
      enemy: [
        {
          name: "木桩乙",
          attack: 1,
          health: 30,
          skillEffectIds: [],
          equipment: {
            name: "蚩尤古盾",
            effectId: "equipment.black-tortoise-shield",
          },
        },
      ],
      seed: 46,
      maxExchanges: 2,
    });
    const shieldSteps = shieldBattle.presentationTimeline.filter(
      (step) =>
        step.kind === "equipment" &&
        step.effectId === "equipment.black-tortoise-shield",
    );
    assert(shieldSteps.length === 2, "蚩尤古盾没有正确消耗两次");
    const spentShieldStep = shieldSteps[1];
    const shieldOwner = getUnit(spentShieldStep, "enemy", "木桩乙");
    const spentShieldMarkup = createHeroCardMarkup(shieldOwner, {
      battleSnapshot: true,
    });
    assert(!shieldOwner?.equipment, "蚩尤古盾次数耗尽后仍保留在战斗装备槽");
    assert(
      spentShieldMarkup.includes("hero-equipment-slot empty") &&
        !spentShieldMarkup.includes("battle-equipment-charges"),
      "蚩尤古盾耗尽后的战斗卡面仍显示装备或0次角标",
    );
    assert(
      spentShieldStep.entries?.[0]?.message.includes("装备已移除") &&
        !spentShieldStep.entries?.[0]?.message.includes("剩余 0 次"),
      "蚩尤古盾耗尽日志没有改为装备移除说明",
    );
    assertContinuous(shieldBattle);

    const bladeBattle = simulateBattleTestScenario({
      player: [
        {
          name: "修罗刀测试武将",
          attack: 1,
          health: 30,
          skillEffectIds: [],
          equipment: {
            name: "修罗刀",
            effectId: "equipment.siege-crossbow",
          },
        },
      ],
      enemy: [{ name: "修罗刀测试木桩", attack: 1, health: 100, skillEffectIds: [] }],
      seed: 47,
      maxExchanges: 1,
    });
    const bladeStep = bladeBattle.presentationTimeline.find(
      (step) =>
        step.kind === "equipment" && step.effectId === "equipment.siege-crossbow",
    );
    assert(bladeStep, "修罗刀没有生成限次装备步骤");
    const bladeOwner = getUnit(bladeStep, "player", "修罗刀测试武将");
    assert(!bladeOwner?.equipment, "修罗刀生效一次后仍保留在战斗装备槽");
    assertContinuous(bladeBattle);
  });

  test("传国玉玺的跨阶段强化进入独立动画步骤", () => {
    const previousShop = state.shop;
    const previousShopBondBonuses = state.shopBondBonuses;
    state.shop = [];
    state.shopBondBonuses = {};
    try {
      const battle = simulateBattleTestScenario({
        player: [
          {
            name: "玉玺测试武将",
            faction: "魏",
            attack: 1,
            health: 1,
            skillEffectIds: [],
            equipment: {
              name: "传国玉玺",
              effectId: "equipment.imperial-jade-seal",
            },
          },
        ],
        enemy: [{ name: "玉玺测试木桩", attack: 10, health: 30, skillEffectIds: [] }],
        seed: 46,
        maxExchanges: 1,
      });
      const jadeSealStep = battle.presentationTimeline.find(
        (step) =>
          step.kind === "equipment" &&
          step.effectId === "equipment.imperial-jade-seal",
      );
      assert(jadeSealStep, "传国玉玺没有生成独立动画步骤");
      assert(
        state.shopBondBonuses.魏?.attack === 1 &&
          state.shopBondBonuses.魏?.health === 1,
        "传国玉玺的商店永久加成没有实际写入",
      );
      assertContinuous(battle);
    } finally {
      state.shop = previousShop;
      state.shopBondBonuses = previousShopBondBonuses;
    }
  });

  test("交锋中先统一阵亡再结算已锁定的攻击后技能", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "夏侯渊", attack: 5, health: 5 }],
      enemy: [{ name: "夏侯渊", attack: 5, health: 5 }],
      seed: 47,
      maxExchanges: 1,
    });
    const skillIndices = battle.presentationTimeline
      .map((step, index) => ({ step, index }))
      .filter(
        ({ step }) =>
          step.kind === "skill" && step.timingWindow === "attack:after",
      )
      .map(({ index }) => index);
    const deathIndices = battle.presentationTimeline
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => step.kind === "death")
      .map(({ index }) => index);
    assert(skillIndices.length === 2, "阵亡攻击者的攻击后技能没有全部锁定");
    const deathStep = battle.presentationTimeline[deathIndices[0]];
    assert(
      deathIndices.length === 1 &&
        deathStep.simultaneous &&
        deathStep.deathIds.length === 2,
      "交锋后的双方阵亡没有合并为一个同步步骤",
    );
    assert(
      Math.max(...deathIndices) < Math.min(...skillIndices),
      "攻击后技能没有在统一阵亡完成后结算",
    );
    const eventTypes = battle.structuredLog
      .filter((entry) => entry.type === "event")
      .map((entry) => entry.eventType);
    const damageAfterIndices = eventTypes
      .map((eventType, index) => ({ eventType, index }))
      .filter(({ eventType }) => eventType === "damage:after")
      .map(({ index }) => index);
    const deathEventIndex = eventTypes.indexOf("unit:death");
    const attackAfterIndex = eventTypes.indexOf("attack:after");
    assert(
      Math.max(...damageAfterIndices) < deathEventIndex &&
        deathEventIndex < attackAfterIndex,
      "事件队列没有遵循伤害后、统一阵亡、攻击后的权威顺序",
    );
    assertContinuous(battle);
  });

  test("满5人时阵亡释放的空位可供已锁定攻击后效果召唤", () => {
    const battle = simulateBattleTestScenario({
      player: [
        { name: "后排甲", health: 20, skillEffectIds: [] },
        { name: "后排乙", health: 20, skillEffectIds: [] },
        { name: "后排丙", health: 20, skillEffectIds: [] },
        { name: "后排丁", health: 20, skillEffectIds: [] },
        { name: "夏侯渊", health: 1 },
      ],
      enemy: [
        {
          name: "召唤容量测试木桩",
          attack: 10,
          health: 100,
          skillEffectIds: [],
        },
      ],
      seed: 49,
      maxExchanges: 1,
    });
    const summonStep = battle.presentationTimeline.find(
      (step) =>
        step.kind === "summon" &&
        step.effectId === "hero.xiahouyuan.qianli-benxi",
    );
    assert(summonStep, "夏侯渊阵亡释放空位后没有完成已锁定的召唤");
    assert(
      battle.playerEnd.some((unit) => unit.name === "骑兵"),
      "召唤骑兵没有进入阵亡释放出的空位",
    );
    assert(
      battle.playerEnd.length === LINEUP_SLOT_COUNT,
      `夏侯渊离场并召唤后应保持5名武将，实际为${battle.playerEnd.length}名`,
    );
    battle.presentationTimeline.forEach((step, index) => {
      assert(
        step.snapshot.player.length <= LINEUP_SLOT_COUNT,
        `步骤${index}的我方阵容超过5格`,
      );
    });
    assertContinuous(battle);
  });

  test("多段技能每段伤害都是独立步骤", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "张角", health: 20 }],
      enemy: [{ name: "木桩", attack: 1, health: 100, skillEffectIds: [] }],
      seed: 53,
      maxExchanges: 0,
    });
    const damageSteps = battle.presentationTimeline.filter(
      (step) =>
        step.kind === "damage" &&
        step.effectId === "hero.zhangjiao.wulei-hongding",
    );
    assert(damageSteps.length === 5, `张角应有5段伤害，实际为${damageSteps.length}`);
    damageSteps.forEach((step, index) => {
      assert(
        step.cues.length === 1,
        `张角第${index + 1}段伤害没有独立浮字`,
      );
    });
    assertContinuous(battle);
  });

  test("2级荀攸单次触发只使1级召唤物升至2级2经验", () => {
    const battle = simulateBattleTestScenario({
      player: [
        {
          name: "荀攸",
          level: 2,
          copies: UNIT_LEVEL_COPY_THRESHOLDS[2],
          health: 100,
        },
        {
          name: "夏侯渊",
          level: 1,
          copies: UNIT_LEVEL_COPY_THRESHOLDS[1],
          health: 100,
        },
      ],
      enemy: [
        {
          name: "荀攸经验测试木桩",
          attack: 1,
          health: 100,
          skillEffectIds: [],
        },
      ],
      seed: 59,
      maxExchanges: 1,
    });
    const cavalry = battle.playerEnd.find((unit) => unit.name === "骑兵");
    assert(cavalry, "夏侯渊没有召唤出用于验证荀攸经验的骑兵");
    assert(
      cavalry.level === 2 &&
        cavalry.experience === 2 &&
        cavalry.bonusExperience === 4,
      `2级荀攸单次应给予4点经验，使LV1召唤物停在LV2 2/3；实际为LV${
        cavalry.level
      }、经验${cavalry.experience}、直接经验${cavalry.bonusExperience}`,
    );
    assertContinuous(battle);
  });

  test("全部60名武将可生成连续的一轮动画时间线", () => {
    CARD_POOLS.hero.forEach((hero, heroIndex) => {
      const battle = simulateBattleTestScenario({
        player: [{ name: hero.name, health: 200 }],
        enemy: [
          {
            name: `木桩${heroIndex + 1}`,
            attack: 1,
            health: 200,
            skillEffectIds: [],
          },
        ],
        seed: 1000 + heroIndex,
        maxExchanges: 1,
      });
      assert(
        battle.presentationTimeline.length >= 4,
        `${hero.name}没有生成完整动画时间线`,
      );
      battle.presentationTimeline.forEach((step) => {
        ["player", "enemy"].forEach((side) => {
          step.snapshot[side].forEach((unit) => {
            assert(
              Number.isFinite(unit.attack) && Number.isFinite(unit.health),
              `${hero.name}时间线出现非法攻血`,
            );
          });
        });
      });
      assertContinuous(battle);
    });
  });

  test("敌我双方东吴业火均锁定对方最后方武将", () => {
    const assertBurnedUnits = (battle, side, expectedNames) => {
      const actualNames = battle[`${side}End`]
        .filter((unit) => unit.statuses?.burn)
        .map((unit) => unit.name)
        .sort();
      const sortedExpectedNames = [...expectedNames].sort();
      assert(
        JSON.stringify(actualNames) === JSON.stringify(sortedExpectedNames),
        `${side === "player" ? "我方" : "敌方"}灼烧目标应为${sortedExpectedNames.join(
          "、",
        )}，实际为${actualNames.join("、")}`,
      );
    };

    const enemyWuBattle = simulateBattleTestScenario({
      player: [
        { name: "我方最后方", health: 20, skillEffectIds: [] },
        { name: "我方后方第二", health: 20, skillEffectIds: [] },
        { name: "我方中间", health: 20, skillEffectIds: [] },
        { name: "我方前方第二", health: 20, skillEffectIds: [] },
        { name: "我方最前方", health: 20, skillEffectIds: [] },
      ],
      enemy: [
        {
          name: "敌方吴羁绊载体",
          faction: "吴",
          health: 20,
          skillEffectIds: [],
        },
      ],
      lockedBonds: { enemy: { 吴: 2 } },
      seed: 77,
      maxExchanges: 0,
    });
    assertBurnedUnits(enemyWuBattle, "player", [
      "我方最后方",
      "我方后方第二",
      "我方中间",
    ]);

    const playerWuBattle = simulateBattleTestScenario({
      player: [
        {
          name: "我方吴羁绊载体",
          faction: "吴",
          health: 20,
          skillEffectIds: [],
        },
      ],
      enemy: [
        { name: "敌方最前方", health: 20, skillEffectIds: [] },
        { name: "敌方前方第二", health: 20, skillEffectIds: [] },
        { name: "敌方中间", health: 20, skillEffectIds: [] },
        { name: "敌方后方第二", health: 20, skillEffectIds: [] },
        { name: "敌方最后方", health: 20, skillEffectIds: [] },
      ],
      lockedBonds: { player: { 吴: 2 } },
      seed: 79,
      maxExchanges: 0,
    });
    assertBurnedUnits(playerWuBattle, "enemy", [
      "敌方中间",
      "敌方后方第二",
      "敌方最后方",
    ]);
  });

  test("四类羁绊变化均进入可见时间线", () => {
    const weiBattle = simulateBattleTestScenario({
      player: Array.from({ length: 4 }, (_, index) => ({
        name: `魏兵${index + 1}`,
        faction: "魏",
        attack: 1,
        health: 1,
        skillEffectIds: [],
      })),
      enemy: [{ name: "魏测试木桩", attack: 10, health: 100, skillEffectIds: [] }],
      lockedBonds: { player: { 魏: 1 } },
      seed: 71,
      maxExchanges: 4,
    });
    const counterSteps = weiBattle.presentationTimeline.filter(
      (step) => step.kind === "counter" && step.effectId === "bond.wei-death",
    );
    assert(counterSteps.length === 4, "魏羁绊的4次阵亡计数没有逐次展示");
    assert(
      counterSteps[0].snapshot.bondCounters.player.魏阵亡 === 1 &&
        counterSteps[3].snapshot.bondCounters.player.魏阵亡 === 4,
      "魏羁绊计数快照被后续变化污染",
    );
    assert(
      weiBattle.presentationTimeline.some(
        (step) => step.kind === "summon" && step.effectId === "bond.wei-death",
      ),
      "魏羁绊达到4次后没有召唤表现",
    );
    const firstWeiCounterState = getBattleAnimationFieldState(
      weiBattle,
      counterSteps[0],
      counterSteps[0].snapshot,
    );
    const firstWeiBondMarkup = renderBattleAnimationFieldBonds(
      weiBattle,
      "player",
      counterSteps[0],
      counterSteps[0].snapshot,
      firstWeiCounterState,
    );
    assert(
      firstWeiBondMarkup.includes("魏武遗风") &&
        firstWeiBondMarkup.includes("每阵亡4名魏武将") &&
        firstWeiBondMarkup.includes("召唤 1/4"),
      "魏羁绊名称、效果或召唤进度没有显示在阵容上方",
    );
    assert(
      firstWeiBondMarkup.includes("is-triggered"),
      "魏羁绊计数增加时没有高亮",
    );

    const shuBattle = simulateBattleTestScenario({
      player: [
        {
          name: "马云禄",
          experience: 1,
          bonusExperience: 1,
          health: 20,
        },
      ],
      enemy: [{ name: "蜀测试木桩", attack: 1, health: 30, skillEffectIds: [] }],
      lockedBonds: { player: { 蜀: 1 } },
      seed: 73,
      maxExchanges: 0,
    });
    assert(
      shuBattle.presentationTimeline.some(
        (step) =>
          step.kind === "stat" &&
          step.effectId === "bond.shu-upgrade" &&
          getUnit(step, "player", "马云禄")?.level === 2,
      ),
      "战斗内升级后的蜀羁绊属性变化没有展示",
    );

    const wuBattle = simulateBattleTestScenario({
      player: [{ name: "吴测试兵", faction: "吴", health: 20, skillEffectIds: [] }],
      enemy: [
        { name: "吴木桩甲", attack: 1, health: 20, skillEffectIds: [] },
        { name: "吴木桩乙", attack: 1, health: 20, skillEffectIds: [] },
      ],
      lockedBonds: { player: { 吴: 1 } },
      seed: 79,
      maxExchanges: 0,
    });
    assert(
      wuBattle.presentationTimeline.filter(
        (step) => step.kind === "status" && step.effectId === "bond.wu-battle-start",
      ).length === 2,
      "吴羁绊施加的两个灼烧没有逐个展示",
    );

    const groupBattle = simulateBattleTestScenario({
      player: [{ name: "华雄", health: 20 }],
      enemy: [{ name: "群测试木桩", attack: 1, health: 20, skillEffectIds: [] }],
      lockedBonds: { player: { 群: 1 } },
      seed: 83,
      maxExchanges: 0,
    });
    const groupDamage = groupBattle.presentationTimeline.find(
      (step) =>
        step.kind === "damage" && step.effectId === "hero.huaxiong.xiaoyong",
    );
    assert(
      groupDamage?.entries?.[0]?.damage === 3,
      "群羁绊的开场伤害加成没有进入华雄伤害步骤",
    );
    const groupFieldState = getBattleAnimationFieldState(
      groupBattle,
      groupDamage,
      groupDamage.snapshot,
    );
    assert(
      groupFieldState.triggeredBonds.player.includes("群"),
      "群羁绊修改开场伤害时没有标记为触发",
    );
    [weiBattle, shuBattle, wuBattle, groupBattle].forEach(assertContinuous);
  });

  test("赵云无双固定攻击后方1人且显示无双", () => {
    const battle = simulateBattleTestScenario({
      player: [
        { name: "诸葛亮", attack: 10, health: 100 },
        {
          name: "赵云",
          level: 2,
          copies: UNIT_LEVEL_COPY_THRESHOLDS[2],
          bonusExperience: 2,
          health: 100,
        },
      ],
      enemy: [
        { name: "前排木桩", attack: 1, health: 100, skillEffectIds: [] },
        { name: "后排木桩甲", attack: 1, health: 100, skillEffectIds: [] },
        { name: "后排木桩乙", attack: 1, health: 100, skillEffectIds: [] },
      ],
      seed: 89,
      maxExchanges: 1,
    });
    const cleaveSteps = battle.presentationTimeline.filter(
      (step) => step.kind === "damage" && step.effectId === "status.unparalleled-cleave",
    );
    assert(cleaveSteps.length === 1, `赵云无双应只命中1名后方单位，实际为${cleaveSteps.length}`);
    assert(cleaveSteps[0].effectName === "无双", "赵云无双生效时错误显示为其他状态");
    assert(
      cleaveSteps[0].entries?.[0]?.targetName === "后排木桩甲",
      "赵云无双没有命中目标后方最近的单位",
    );
    assertContinuous(battle);
  });

  test("吕布无双可随技能强化至最多攻击后方3人", () => {
    const battle = simulateBattleTestScenario({
      player: [{ name: "吕布", level: 3, attack: 12, health: 100 }],
      enemy: [
        { name: "前排木桩", attack: 1, health: 100, skillEffectIds: [] },
        { name: "后排木桩甲", attack: 1, health: 100, skillEffectIds: [] },
        { name: "后排木桩乙", attack: 1, health: 100, skillEffectIds: [] },
        { name: "后排木桩丙", attack: 1, health: 100, skillEffectIds: [] },
      ],
      seed: 97,
      maxExchanges: 1,
    });
    const cleaveSteps = battle.presentationTimeline.filter(
      (step) => step.kind === "damage" && step.effectId === "status.unparalleled-cleave",
    );
    assert(cleaveSteps.length === 3, `3级吕布无双应命中3名后方单位，实际为${cleaveSteps.length}`);
    assert(
      cleaveSteps.every((step) => step.effectName === "无双"),
      "吕布无双生效时错误显示为其他状态",
    );
    assertContinuous(battle);
  });

  test("同名武将的浮字与高亮只匹配唯一单位", () => {
    const first = { id: "same-name-1", name: "骑兵" };
    const second = { id: "same-name-2", name: "骑兵" };
    assert(
      battleAnimationIdentityMatches(first, [{ id: first.id, name: first.name }]),
      "目标单位没有按唯一ID匹配",
    );
    assert(
      !battleAnimationIdentityMatches(second, [{ id: first.id, name: first.name }]),
      "同名但不同ID的单位被错误高亮",
    );
  });

  test("战斗动画倍速只使用1、2、3、5四档", () => {
    assert(
      BATTLE_ANIMATION_SPEEDS.every(
        (speed) => getBattleAnimationSpeed(speed) === speed,
      ),
      "合法倍速档位没有被保留",
    );
    assert(getBattleAnimationSpeed(4) === 1, "非法倍速没有回退到1倍速");
  });

  test("战斗详情固定显示上一条、当前、下一条且当前操作不重复", () => {
    const markup = renderBattleAnimationContextList(
      [
        { kind: "ready", title: "准备战斗" },
        { kind: "opening", phase: "battle:start", title: "东吴业火 2人效果触发" },
        { kind: "result", title: "战斗结束" },
      ],
      1,
    );
    assert(
      (markup.match(/battle-animation-context-row/g) ?? []).length === 3,
      "战斗详情没有固定显示三行",
    );
    ["上一条操作", "当前操作", "下一条操作"].forEach((label) => {
      assert(markup.includes(label), `战斗详情缺少“${label}”`);
    });
    assert(
      markup.split("东吴业火 2人效果触发").length - 1 === 1,
      "当前操作在战斗详情中被重复显示",
    );
  });

  test("阵容上方只显示已激活羁绊及其当前效果", () => {
    const battle = {
      lockedBonds: {
        player: { 魏: 1, 蜀: 2, 吴: 3, 群: 0 },
        enemy: { 魏: 0, 蜀: 0, 吴: 0, 群: 0 },
      },
    };
    const markup = renderBattleAnimationFieldBonds(
      battle,
      "player",
      { entries: [] },
      { bondCounters: { player: { 魏阵亡: 0 } } },
      { triggeredBonds: { player: [], enemy: [] } },
    );
    assert(
      ["魏武遗风", "蜀汉再兴", "东吴业火"].every((label) =>
        markup.includes(label),
      ),
      "已激活羁绊没有完整显示",
    );
    assert(!markup.includes("群雄并起"), "未激活羁绊被错误显示");
    assert(
      markup.includes(BOND_RULES.魏.effects[1]) &&
        markup.includes(BOND_RULES.蜀.effects[2]) &&
        markup.includes(BOND_RULES.吴.effects[3]),
      "羁绊没有显示当前等级对应效果",
    );
  });

  test("战斗动画不渲染卡牌外的重复名字和属性条", () => {
    const unit = {
      id: "health-display-unit",
      name: "韩当",
      level: 1,
      experience: 0,
      attack: 3,
      health: 2,
      maxHealth: 7,
      statuses: {},
      extraFactions: [],
      tempExtraFactions: [],
    };
    const markup = renderBattleAnimationFieldCard(
      unit,
      "player",
      1,
      {
        sources: [{ id: unit.id, name: unit.name }],
        targets: [],
        deaths: [],
        changedUnitIds: [],
        ally: null,
        foe: null,
        popups: [],
      },
      0,
    );
    assert(markup.includes("hero-nameplate"), "完整卡牌内的名字信息丢失");
    assert(markup.includes("hero-level-text"), "完整卡牌内的等级信息丢失");
    assert(!markup.includes("battle-field-name"), "卡牌外仍显示重复武将名");
    assert(!markup.includes("battle-field-live-state"), "卡牌下方仍显示重复属性条");
  });

  test("武将技能名从方括号中拆分为独立标签", () => {
    const hero = CARD_POOLS.hero.find((entry) => /^\[[^\]]+\]/.test(entry.skill));
    assert(Boolean(hero), "缺少可验证的方括号技能数据");
    const expectedSkillName = hero.skill.match(/^\[([^\]]+)\]/)?.[1];
    const template = document.createElement("template");
    template.innerHTML = createHeroCardMarkup(hero, { showCost: true }).trim();
    const tooltip = template.content.querySelector(".hero-skill-tooltip");
    const skillTag = tooltip?.querySelector(".hero-skill-name-tag");
    const skillDescription = tooltip?.querySelector(".hero-skill-description");
    assert(skillTag?.textContent.trim() === expectedSkillName, "技能名标签没有使用方括号内容");
    assert(!tooltip?.textContent.includes(`[${expectedSkillName}]`), "技能详情仍显示方括号技能名");
    assert(Boolean(skillDescription?.textContent.trim()), "技能正文被错误移除");
  });

  test("全部状态在商店阵容、战斗动画和战报快照共用无文字边框特效", () => {
    const unit = {
      id: "status-visual-unit",
      name: "韩当",
      faction: "吴",
      tier: 1,
      level: 1,
      experience: 0,
      attack: 3,
      health: 7,
      skill: "",
      statuses: {},
      skillDisabled: false,
      directModifiers: { equipment: null },
      extraFactions: [],
      tempExtraFactions: [],
    };
    const expectedStatusIds = [
      "burn",
      "intimidated",
      "counterplot",
      "unparalleled",
      "rest",
      "skill-disabled",
    ];
    const assertStatusEffect = (markup, surfaceName, statusId) => {
      const template = document.createElement("template");
      template.innerHTML = markup.trim();
      const card = template.content.querySelector(".hero-card");
      const effectRoot = card?.querySelector(".hero-card-status-effects");
      assert(Boolean(effectRoot), `${surfaceName}没有状态边框特效容器`);
      assert(
        !card?.querySelector(".hero-card-statuses"),
        `${surfaceName}仍在渲染旧状态标签`,
      );
      assert(
        card?.classList.contains(`has-status-${statusId}`) &&
          Boolean(effectRoot?.querySelector(`.status-effect-${statusId}`)),
        `${surfaceName}缺少${STATUS_LABELS[statusId]}边框特效`,
      );
      assert(
        effectRoot?.textContent.trim() === "",
        `${surfaceName}的状态边框内仍包含可见文字`,
      );
      const statusTooltip = card?.querySelector(".hero-status-tooltip");
      assert(Boolean(statusTooltip), `${surfaceName}没有状态描述面板`);
      assert(
        statusTooltip?.textContent.includes(STATUS_LABELS[statusId]) &&
          statusTooltip?.textContent.includes(STATUS_DESCRIPTIONS[statusId].slice(0, 4)),
        `${surfaceName}的${STATUS_LABELS[statusId]}状态说明不完整`,
      );
    };

    expectedStatusIds.forEach((statusId) => {
      const statusUnit = {
        ...unit,
        statuses: statusId === "skill-disabled" ? {} : { [statusId]: {} },
        skillDisabled: statusId === "skill-disabled",
      };
      assertStatusEffect(
        createHeroCardMarkup(statusUnit, { lineupIndex: 0 }),
        "商店阵容",
        statusId,
      );
      const battleCardMarkup = renderBattleAnimationFieldCard(
        statusUnit,
        "player",
        1,
        {
          sources: [],
          targets: [],
          deaths: [],
          changedUnitIds: [],
          ally: null,
          foe: null,
          popups: [],
        },
        0,
      );
      assertStatusEffect(battleCardMarkup, "战斗动画", statusId);
      assertStatusEffect(
        createHeroCardMarkup(getBattleSnapshotCardUnit(statusUnit, 1), {
          battleSnapshot: true,
        }),
        "战报快照",
        statusId,
      );
    });
  });

  return {
    passed: tests.every((entry) => entry.passed),
    tests,
  };
}

function mountBattleAnimationRegressionResults() {
  const results = runBattleAnimationRegressionTests();
  const output = document.createElement("pre");
  output.id = "battleAnimationTestResults";
  output.dataset.passed = String(results.passed);
  output.textContent = JSON.stringify(results, null, 2);
  output.style.cssText =
    "position:fixed;inset:12px;z-index:99999;overflow:auto;margin:0;padding:16px;background:#111;color:#eee;font:14px/1.5 monospace;";
  document.body.append(output);
}

function mountBattleAnimationPreview() {
  state.battle = simulateBattleTestScenario({
    player: [
      { name: "马云禄", health: 20 },
      { name: "韩当", attack: 5, health: 20 },
    ],
    enemy: [
      { name: "夏侯渊", attack: 3, health: 4 },
      { name: "华雄", health: 20 },
    ],
    lockedBonds: {
      player: { 蜀: 1, 吴: 1 },
      enemy: { 魏: 1, 群: 1 },
    },
    seed: 20260731,
    maxExchanges: 1,
  });
  state.phase = "battle";
  state.battle.view = "animation";
  state.battle.animationIndex = 0;
  state.battle.animationPlaying = false;
  render();
}

function mountGameResultPreview(outcome) {
  const isVictory = outcome === "victory";
  const heroNames = isVictory
    ? ["刘备", "马云禄", "赵云", "诸葛亮", "孙权"]
    : ["华雄", "袁绍", "张角", "贾诩", "吕布"];
  const previewCopies = [6, 3, 3, 1, 1];
  state.lineup = heroNames.map((name, index) => {
    const base = CARD_POOLS.hero.find((hero) => hero.name === name);
    if (!base) return null;
    const unit = createUnitFromCard(createCardFromBase(base, "hero"));
    const copies = previewCopies[index];
    const progress = getUnitProgress(copies);
    unit.copies = copies;
    unit.level = progress.level;
    unit.experience = progress.experience;
    if (copies > 1) addUnitBodyStats(unit, copies - 1, copies - 1);
    syncUnitStats(unit);
    return unit;
  });
  state.round = isVictory ? 12 : 9;
  state.phase = "battle";
  state.gold = 0;
  state.life = isVictory ? 4 : 0;
  state.flags = isVictory ? FLAG_VICTORY_TARGET : 3;
  state.battleRecord = isVictory
    ? { wins: 10, losses: 2, draws: 0 }
    : { wins: 3, losses: 5, draws: 1 };
  state.battle = null;
  state.gameOutcome = isVictory ? "victory" : "defeat";
  state.gameOver = true;
  render();
}

function mountGameRuleRegressionResults() {
  const testCases = [];
  const test = (name, run) => {
    try {
      run();
      testCases.push({ name, passed: true });
    } catch (error) {
      testCases.push({ name, passed: false, message: error.message });
    }
  };
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  test("商店武将挤位时连续武将向最近空位顺移", () => {
    const previousLineup = state.lineup;
    try {
      const first = { id: "shop-insert-first", name: "甲" };
      const target = { id: "shop-insert-target", name: "乙" };
      const next = { id: "shop-insert-next", name: "丙" };
      const inserted = { id: "shop-insert-new", name: "新武将" };
      state.lineup = [first, target, next, null, null];
      const emptyIndex = findLineupInsertionGap(1, null, 1);
      assert(emptyIndex === 3, "没有找到目标右侧最近空位");
      shiftLineupForInsertion(inserted, 1, 1, emptyIndex);
      assert(
        state.lineup[0] === first &&
          state.lineup[1] === inserted &&
          state.lineup[2] === target &&
          state.lineup[3] === next &&
          state.lineup[4] === null,
        "商店武将插入后阵容没有按顺序向右挤位",
      );
    } finally {
      state.lineup = previousLineup;
    }
  });

  test("武将技能始终优先贴近卡牌上方且不会越出视口", () => {
    const bounds = { left: 8, top: 8, right: 792, bottom: 592 };
    const cardRect = { left: 650, top: 300, width: 120, height: 180 };
    const skillSize = { width: 210, height: 90 };
    const position = getPrioritizedHeroSkillPosition(cardRect, skillSize, bounds);
    assert(position.placement === "above", "武将技能没有保持上方最高优先级");
    assert(
      position.top + skillSize.height === cardRect.top - CARD_DETAIL_GAP,
      "武将技能没有贴近卡牌上边缘",
    );
    assert(
      position.left >= bounds.left && position.left + skillSize.width <= bounds.right,
      "武将技能横向越出了视口",
    );
  });
  test("右侧空间不足时装备、状态与衍生详情移到武将技能左侧", () => {
    const bounds = { left: 8, top: 8, right: 792, bottom: 592 };
    const cardRect = { left: 650, top: 300, width: 120, height: 180 };
    const primaryRect = { left: 582, top: 200, width: 210, height: 90 };
    const layout = getAuxiliaryCardDetailLayout(
      [
        { width: 210, height: 80 },
        { width: 210, height: 70 },
      ],
      cardRect,
      primaryRect,
      bounds,
    );
    assert(layout.placement === "left", "右边缘的辅助详情没有向左侧空位避让");
    assert(
      layout.positions.every((position, index) =>
        position.left >= bounds.left &&
        position.left + 210 <= bounds.right &&
        position.top >= bounds.top &&
        position.top + [80, 70][index] <= bounds.bottom,
      ),
      "辅助详情越出了视口",
    );
  });
  test("道具详情在顶部空间不足时自动移到卡牌下方", () => {
    const bounds = { left: 8, top: 8, right: 792, bottom: 592 };
    const cardRect = { left: 330, top: 12, width: 120, height: 180 };
    const position = getAdaptiveSingleDetailPosition(
      cardRect,
      { width: 210, height: 90 },
      bounds,
    );
    assert(position.placement === "below", "顶部边缘的道具详情没有向下方空位避让");
  });

  test("玩家模式新局初始为5生命、0旗帜", () => {
    const initial = createInitialState();
    assert(initial.life === 5, `初始生命应为5，实际为${initial.life}`);
    assert(initial.flags === 0, `初始旗帜应为0，实际为${initial.flags}`);
  });
  test("第3回合恢复1生命且不超过5", () => {
    assert(getLifeAfterRoundStart(3, 3) === 4, "第3回合未正确恢复1生命");
    assert(getLifeAfterRoundStart(5, 3) === 5, "第3回合生命超过5点上限");
    assert(getLifeAfterRoundStart(3, 2) === 3, "非第3回合错误恢复生命");
  });
  test("胜利加1旗帜并在10旗帜时获胜", () => {
    const progress = { life: 2, flags: 9, battleRecord: { wins: 9, losses: 3, draws: 0 } };
    applyBattleResultToGameState(progress, "win");
    assert(progress.flags === 10, `旗帜应为10，实际为${progress.flags}`);
    assert(progress.life === 2, "胜利不应扣除生命");
    assert(progress.battleRecord.wins === 10, "胜场统计未增加");
    assert(getGameOutcome(progress.life, progress.flags) === "victory", "10旗帜未判定胜利");
  });
  test("失败减1生命并在归零时失败", () => {
    const progress = { life: 1, flags: 4, battleRecord: { wins: 4, losses: 4, draws: 0 } };
    applyBattleResultToGameState(progress, "loss");
    assert(progress.life === 0, `生命应为0，实际为${progress.life}`);
    assert(progress.flags === 4, "失败不应减少旗帜");
    assert(progress.battleRecord.losses === 5, "负场统计未增加");
    assert(getGameOutcome(progress.life, progress.flags) === "defeat", "生命归零未判定失败");
  });
  test("平局不改变生命与旗帜", () => {
    const progress = { life: 4, flags: 6, battleRecord: { wins: 6, losses: 1, draws: 0 } };
    applyBattleResultToGameState(progress, "draw");
    assert(progress.life === 4 && progress.flags === 6, "平局改变了生命或旗帜");
    assert(progress.battleRecord.draws === 1, "平局统计未增加");
    assert(getGameOutcome(progress.life, progress.flags) === null, "普通进度被错误判定为终局");
  });
  test("第20回合数据完成不强制结束玩家对局", () => {
    assert(
      getGameOutcome(5, 9, PLAYER_DATA_TEST_MAX_ROUND) === null,
      "第20回合被错误判定为玩家对局结束",
    );
  });
  test("第3、7、11回合均从对应4张奖励卡中随机展示3张且必须三选一", () => {
    const previousRound = state.round;
    const previousShop = state.shop;
    const previousPendingReward = state.pendingRoundReward;
    const previousRoundRewardCollapsed = state.roundRewardCollapsed;
    const previousSerial = state.serial;
    const previousLogLength = state.logs.length;
    try {
      ROUND_REWARD_ROUNDS.forEach((round) => {
        state.round = round;
        state.shop = Array.from({ length: SHOP_POSITION_COUNT }, () => null);
        state.pendingRoundReward = null;
        queueRoundReward(round);
        const names = state.pendingRoundReward?.candidates?.map((card) => card.name) ?? [];
        assert(names.length === 3, `第${round}回合没有展示3张奖励卡`);
        assert(new Set(names).size === 3, `第${round}回合出现重复奖励卡`);
        assert(
          names.every((name) => ROUND_REWARD_CARD_NAMES[round].includes(name)),
          `第${round}回合混入错误奖励卡：${names.join("、")}`,
        );
        assert(isRoundRewardBlockingShop(), `第${round}回合奖励没有阻塞商店操作`);
        renderRoundReward();
        assert(
          elements.roundRewardTitle?.textContent === ROUND_REWARD_TITLES[round],
          `第${round}回合奖励标题错误`,
        );
        assert(
          elements.roundRewardOptions?.querySelectorAll(".reward-option").length === 3,
          `第${round}回合奖励没有复用升级奖励卡牌样式`,
        );
        const renderedRewardCards = [
          ...(elements.roundRewardOptions?.querySelectorAll(".item-card") ?? []),
        ];
        assert(
          renderedRewardCards.every((card) => {
            const stars = [...card.querySelectorAll(".item-stars img")];
            return stars.length > 0 && stars.every((star) => star.classList.contains("purple-star"));
          }),
          `第${round}回合奖励存在未显示为紫色的星星`,
        );
        assert(
          !elements.roundRewardOverlay?.querySelector(".reward-dialog > p"),
          `第${round}回合奖励仍显示额外说明文字`,
        );
        state.roundRewardCollapsed = true;
        renderRoundReward();
        assert(elements.roundRewardOverlay?.hidden, `第${round}回合奖励无法收起`);
        assert(!elements.roundRewardCollapsedBar?.hidden, `第${round}回合收起后没有展开按钮`);
        assert(elements.shopStage?.hasAttribute("inert"), `第${round}回合收起后商店仍可操作`);
        state.roundRewardCollapsed = false;
        renderRoundReward();
        assert(!elements.roundRewardOverlay?.hidden, `第${round}回合奖励无法重新展开`);
        assert(!elements.shopStage?.hasAttribute("inert"), `第${round}回合重新展开后商店仍被额外锁定`);
        const selectedName = names[0];
        chooseRoundRewardCard(0);
        const rewardCard = state.shop[8];
        assert(!state.pendingRoundReward, `第${round}回合选择后仍在阻塞`);
        assert(rewardCard?.name === selectedName, `第${round}回合奖励没有进入商店最右侧道具位`);
        assert(rewardCard?.cost === 0, `第${round}回合奖励不是0金币`);
      });
    } finally {
      state.round = previousRound;
      state.shop = previousShop;
      state.pendingRoundReward = previousPendingReward;
      state.roundRewardCollapsed = previousRoundRewardCollapsed;
      state.serial = previousSerial;
      state.logs.splice(previousLogLength);
    }
  });
  test("合纵连横消耗后在商店8、7、6号位生成3份盟书并把原8号道具挤到9号", () => {
    const previousShop = state.shop;
    const previousSerial = state.serial;
    const previousPending = state.pendingStratagemUse;
    const previousLogLength = state.logs.length;
    try {
      state.shop = Array.from({ length: SHOP_POSITION_COUNT }, () => null);
      ["甄姬", "庞德", "黄忠", "廖化", "马云禄"].forEach((name, index) => {
        const base = CARD_POOLS.hero.find((hero) => hero.name === name);
        state.shop[index] = createCardFromBase(base, "hero");
      });
      const oldItem = createFreeShopItemFromBase(
        CARD_POOLS.stratagem.find((card) => card.name === "帅印"),
      );
      const alliancePacts = createFreeShopItemFromBase(
        CARD_POOLS.stratagem.find((card) => card.name === "合纵连横"),
      );
      state.shop[7] = oldItem;
      state.shop[8] = alliancePacts;
      assert(completeStratagemUse(8, 0), "合纵连横没有成功使用");
      assert(state.shop[8]?.id === oldItem.id, "原8号道具没有被挤到9号位");
      [5, 6, 7].forEach((index) => {
        assert(state.shop[index]?.name === "盟书", `${index + 1}号商店位没有生成盟书`);
      });
      assert(
        state.shop.filter((card) => card?.name === "盟书").length === 3,
        "合纵连横没有生成3张独立盟书",
      );
    } finally {
      state.shop = previousShop;
      state.serial = previousSerial;
      state.pendingStratagemUse = previousPending;
      state.logs.splice(previousLogLength);
    }
  });
  test("商店满格时新增道具移除最左武将，新增武将移除最右道具", () => {
    const previousShop = state.shop;
    const previousSerial = state.serial;
    const previousLogLength = state.logs.length;
    try {
      state.shop = Array.from({ length: SHOP_POSITION_COUNT }, () => null);
      ["甄姬", "庞德", "黄忠", "廖化", "马云禄"].forEach((name, index) => {
        state.shop[index] = createCardFromBase(
          CARD_POOLS.hero.find((hero) => hero.name === name),
          "hero",
        );
      });
      ["帅印", "虎符", "百厄角", "龙方壶"].forEach((name, offset) => {
        state.shop[5 + offset] = createFreeShopItemFromBase(
          CARD_POOLS.stratagem.find((card) => card.name === name),
        );
      });
      const newItem = createFreeShopItemFromBase(
        CARD_POOLS.stratagem.find((card) => card.name === "白玉龟"),
      );
      addCardsToSharedShop([newItem], "测试道具");
      assert(!state.shop.some((card) => card?.name === "甄姬"), "新增道具没有移除最左武将");
      assert(state.shop[4]?.id === newItem.id, "新增道具没有生成在现有道具左侧");

      const newHero = createCardFromBase(
        CARD_POOLS.hero.find((hero) => hero.name === "诸葛瑾"),
        "hero",
      );
      addCardsToSharedShop([newHero], "测试武将");
      assert(!state.shop.some((card) => card?.name === "龙方壶"), "新增武将没有移除最右道具");
      assert(state.shop[4]?.id === newHero.id, "新增武将没有生成在现有武将右侧");
    } finally {
      state.shop = previousShop;
      state.serial = previousSerial;
      state.logs.splice(previousLogLength);
    }
  });
  test("众志成城在人数最多羁绊并列时要求选择且只解锁所选羁绊", () => {
    const previousLineup = state.lineup;
    const previousShop = state.shop;
    const previousUnlocked = state.unlockedFivePersonBonds;
    const previousPending = state.pendingStratagemUse;
    const previousSerial = state.serial;
    const previousLogLength = state.logs.length;
    try {
      state.lineup = Array.from({ length: LINEUP_SLOT_COUNT }, () => null);
      ["甄姬", "庞德", "黄忠", "廖化"].forEach((name, index) => {
        const base = CARD_POOLS.hero.find((hero) => hero.name === name);
        state.lineup[index] = createUnitFromCard(createCardFromBase(base, "hero"));
      });
      state.shop = Array.from({ length: SHOP_POSITION_COUNT }, () => null);
      state.shop[8] = createFreeShopItemFromBase(
        CARD_POOLS.stratagem.find((card) => card.name === "众志成城"),
      );
      state.unlockedFivePersonBonds = [];
      useStratagemOnLineup(8, 0);
      assert(
        JSON.stringify(state.pendingStratagemUse?.availableFactions) === JSON.stringify(["魏", "蜀"]),
        `并列时没有提供魏、蜀二选一：${state.pendingStratagemUse?.availableFactions?.join("、")}`,
      );
      selectStratagemBondChoice("魏");
      assert(state.unlockedFivePersonBonds.includes("魏"), "众志成城没有解锁所选魏羁绊");
      assert(!state.unlockedFivePersonBonds.includes("蜀"), "众志成城错误地同时解锁蜀羁绊");
      assert(getBondEffectCount(4, "魏") === 4 && getBondEffectCount(5, "魏") === 5, "5人效果资格结算错误");
    } finally {
      state.lineup = previousLineup;
      state.shop = previousShop;
      state.unlockedFivePersonBonds = previousUnlocked;
      state.pendingStratagemUse = previousPending;
      state.serial = previousSerial;
      state.logs.splice(previousLogLength);
    }
  });
  test("筹措军资获得12金币且厉兵秣马生成2张独立免费聚势强军", () => {
    const previousShop = state.shop;
    const previousGold = state.gold;
    const previousSerial = state.serial;
    const previousLogLength = state.logs.length;
    try {
      state.shop = Array.from({ length: SHOP_POSITION_COUNT }, () => null);
      state.gold = 10;
      state.shop[8] = createFreeShopItemFromBase(
        CARD_POOLS.stratagem.find((card) => card.name === "筹措军资"),
      );
      assert(completeStratagemUse(8, 0), "筹措军资没有成功使用");
      assert(state.gold === 22, `筹措军资应使金币变为22，实际为${state.gold}`);

      state.shop[8] = createFreeShopItemFromBase(
        CARD_POOLS.stratagem.find((card) => card.name === "厉兵秣马"),
      );
      assert(completeStratagemUse(8, 0), "厉兵秣马没有成功使用");
      const generated = state.shop.filter((card) => card?.name === "聚势强军");
      assert(generated.length === 2, `厉兵秣马应生成2张聚势强军，实际为${generated.length}张`);
      assert(generated.every((card) => card.cost === 0), "厉兵秣马生成的聚势强军不是免费卡");
      assert(new Set(generated.map((card) => card.id)).size === 2, "2张聚势强军没有作为独立卡牌生成");
    } finally {
      state.shop = previousShop;
      state.gold = previousGold;
      state.serial = previousSerial;
      state.logs.splice(previousLogLength);
    }
  });
  test("龙方壶仅在阵容无激活羁绊时于回合结束永久+2/+2", () => {
    const previousLineup = state.lineup;
    const previousSerial = state.serial;
    const previousLogLength = state.logs.length;
    try {
      const base = CARD_POOLS.hero.find((hero) => hero.name === "甄姬");
      const owner = createUnitFromCard(createCardFromBase(base, "hero"));
      owner.directModifiers.equipment = createEquipmentFromCard(
        createFreeShopItemFromBase(
          CARD_POOLS.stratagem.find((card) => card.name === "龙方壶"),
        ),
      );
      state.lineup = [owner, null, null, null, null];
      const before = owner.bodyAttack;
      dispatchShopEvent("round:end", { round: state.round });
      assert(owner.bodyAttack === before + 2, "无激活羁绊时龙方壶没有永久+2/+2");

      state.lineup[1] = createUnitFromCard(
        createCardFromBase(CARD_POOLS.hero.find((hero) => hero.name === "庞德"), "hero"),
      );
      dispatchShopEvent("round:end", { round: state.round });
      assert(owner.bodyAttack === before + 2, "存在激活羁绊时龙方壶仍然触发");
    } finally {
      state.lineup = previousLineup;
      state.serial = previousSerial;
      state.logs.splice(previousLogLength);
    }
  });

  const results = {
    passed: testCases.every((entry) => entry.passed),
    tests: testCases,
  };
  const output = document.createElement("pre");
  output.id = "gameRuleTestResults";
  output.dataset.passed = String(results.passed);
  output.textContent = JSON.stringify(results, null, 2);
  output.style.cssText =
    "position:fixed;inset:12px;z-index:99999;overflow:auto;margin:0;padding:16px;background:#111;color:#eee;font:14px/1.5 monospace;";
  document.body.append(output);
}

const runtimeSearchParams = new URLSearchParams(window.location.search);
const skipAssetPreload =
  runtimeSearchParams.has("battle-animation-test") || runtimeSearchParams.has("game-rules-test");
if (skipAssetPreload) {
  revealApplication();
} else {
  startAssetPreload();
}
