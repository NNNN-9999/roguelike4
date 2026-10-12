const cards = {

    // ======================
    // 共通カード
    // ======================

    strike: {
        id: "strike",
        name: "スラッシュ",
        type: "attack",
        rarity: "rare",
        cost: 1,
        description: "敵単体に6ダメージを与える。",
        damage: 6
    },

    defend: {
        id: "defend",
        name: "ガード",
        type: "skill",
        rarity: "rare",
        cost: 1,
        description: "6ブロックを得る。",
        block: 6
    },

    // v158: フォーカスは共通カードプールから削除。

    warriorIronGuard: {
        id: "warriorIronGuard",
        name: "堅守",
        character: "warrior",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 10,
        rageGain: 2,
        description: "10ブロックを得る。闘志を2得る。"
    },

    // v167: ヒールカード廃止。旧セーブはガードへ移行。


    // v143 魔力選択式の大魔法。魔力なしでも基本効果は発動する。
    wizardManaBolt: {
        id: "wizardManaBolt", name: "魔力弾", character: "wizard",
        type: "attack", rarity: "rare", cost: 2,
        damage: 12, magic: true, manaSpell: true, manaCost: 3,
        spellReading: "アルカナ・ボルト",
        spellChants: {
            none: "―― 揺らぐ理を、一条の矢へ ――",
            fire: "―― 紅蓮よ穿て、灼熱の矢となれ ――",
            lightning: "―― 轟雷よ裂け、閃光の矢となれ ――",
            ice: "―― 氷晶よ結べ、静謐の矢となれ ――"
        },
        description: "12ダメージ。魔力3を選んで消費：🔥24ダメージ / ⚡12ダメージ×2 / ❄️12ダメージ＋12ブロック。"
    },
    wizardAstralRuin: {
        id: "wizardAstralRuin", name: "天象崩壊", character: "wizard",
        type: "attack", rarity: "legendary", cost: 3,
        damage: 18, magic: true, manaSpell: true, manaCost: 7, aoe: true,
        spellReading: "アストラル・カタストロフィ",
        description: "敵全体に18ダメージ。魔力7を選んで消費：🔥全体+14ダメージ / ⚡全体+6ダメージ・1ドロー / ❄️12ブロック。"
    },

    // v146: 4クラス共通の追加シリーズ。通常のカード報酬/ショップから入手可能。
    warriorWideSlash: {
        id: "warriorWideSlash", name: "横薙ぎ", character: "warrior",
        type: "attack", rarity: "rare", cost: 1, damage: 7, aoe: true,
        rageCost: 1, rageBonusDamage: 4,
        description: "敵全体に7ダメージ。闘志1消費で敵全体にさらに4ダメージ。"
    },
    warriorRampage: {
        id: "warriorRampage", name: "破城の大斧", character: "warrior",
        type: "attack", rarity: "epic", cost: 2, damage: 18,
        rageCost: 10, rageBonusDamage: 34,
        description: "18ダメージ。闘志10以上なら10消費し、さらに34ダメージ。"
    },
    warriorBattlefieldBreak: {
        id: "warriorBattlefieldBreak", name: "戦場蹂躙", character: "warrior",
        type: "attack", rarity: "legendary", cost: 3, damage: 14, aoe: true,
        rageCost: 15, rageBonusDamage: 36,
        description: "敵全体に14ダメージ。闘志15以上なら15消費し、敵全体に追加36ダメージ。"
    },
    wizardPrismaticLance: {
        id: "wizardPrismaticLance", name: "虹彩穿槍", character: "wizard",
        type: "attack", rarity: "epic", cost: 2, damage: 18, magic: true,
        manaSpell: true, manaCost: 5,
        spellReading: "プリズマ・ランサー",
        spellChants: {
            none: "―― 七の彩よ貫け、虚空を裂く槍となれ ――",
            fire: "―― 赫灼の輝きよ、貫く炎槍となれ ――",
            lightning: "―― 天裂く雷光よ、極光の槍となれ ――",
            ice: "―― 蒼穹の氷華よ、凍てつく槍となれ ――"
        },
        description: "18ダメージ。属性魔力5消費：炎+12ダメージ / 雷2連撃 / 氷12ブロック。発動時に詠唱。"
    },
    wizardSkyfall: {
        id: "wizardSkyfall", name: "天界の奔流", character: "wizard",
        type: "attack", rarity: "legendary", cost: 3, damage: 24, aoe: true, magic: true,
        manaSpell: true, manaCost: 9,
        spellReading: "セレスティアル・フラッド",
        spellChants: {
            none: "―― 天蓋を開け、星河の濁流をここへ ――",
            fire: "―― 焦天の奔流よ、万象を焼き尽くせ ――",
            lightning: "―― 雷霆の濁流よ、天より奔れ ――",
            ice: "―― 氷天の奔流よ、世界を凍てつかせよ ――"
        },
        description: "敵全体に24ダメージ。属性魔力9消費：炎+14 / 雷+6・1ドロー / 氷12ブロック。発動時に詠唱。"
    },
    wizardThreefoldStorm: {
        id: "wizardThreefoldStorm", name: "秘奥・三相雷鳴", character: "wizard",
        type: "attack", rarity: "legendary", cost: 3, damage: 32, aoe: true, magic: true,
        manaSpell: true, manaCost: 12,
        spellReading: "トリニティ・テンペスト",
        spellChants: {
            none: "―― 三つの理よ、今ひとつの崩雷となれ ――",
            fire: "―― 炎よ吼えよ、雷へと転じて天を裂け ――",
            lightning: "―― 轟きは三度、終焉の雷鳴となれ ――",
            ice: "―― 氷よ鳴れ、静寂を砕く蒼雷となれ ――"
        }, exhaust: true,
        description: "敵全体に32ダメージ。属性魔力12消費で追加効果。詠唱付き。消滅。"
    },
    machinistRecoilCannon: {
        id: "machinistRecoilCannon", name: "反動砲", character: "machinist",
        type: "attack", rarity: "rare", cost: 1, damage: 17, selfDamage: 4,
        description: "17ダメージ。自傷4（ブロックで防げる）。"
    },
    machinistCarpetFire: {
        id: "machinistCarpetFire", name: "掃討砲撃", character: "machinist",
        type: "attack", rarity: "epic", cost: 2, damage: 17, aoe: true, selfDamage: 6,
        description: "敵全体に17ダメージ。自傷6（ブロックで防げる）。"
    },
    machinistOverlimitRay: {
        id: "machinistOverlimitRay", name: "限界超過光線", character: "machinist",
        type: "attack", rarity: "legendary", cost: 3, damage: 52, selfDamage: 12,
        description: "52ダメージ。自傷12（ブロックで防げる）。"
    },
    gravekeeperGraveRain: {
        id: "gravekeeperGraveRain", name: "墓雨", character: "gravekeeper",
        type: "attack", rarity: "rare", cost: 1, damage: 5, aoe: true,
        damagePerDiscard: 1, discardScalingCap: 8,
        description: "敵全体に5ダメージ。捨て札1枚につき+1ダメージ（最大+8）。"
    },
    gravekeeperSoulReturn: {
        id: "gravekeeperSoulReturn", name: "魂還の手", character: "gravekeeper",
        type: "skill", rarity: "epic", cost: 1, block: 8, returnDiscard: 2,
        description: "8ブロック。捨て札からランダムに2枚回収（このターン0コスト）。"
    },
    gravekeeperDirge: {
        id: "gravekeeperDirge", name: "弔鐘の終幕", character: "gravekeeper",
        type: "attack", rarity: "legendary", cost: 3, damage: 11, aoe: true,
        damagePerDiscard: 3, discardScalingCap: 12,
        description: "敵全体に11ダメージ。捨て札1枚につき+3ダメージ（最大+36）。"
    },

    // ======================
    // 戦士専用カード
    // 闘志：上限なし。攻撃カードで基本+1。
    // 一部カードは闘志を消費して強化される。
    // ======================

    heavyStrike: {
        id: "heavyStrike",
        name: "バッシュ",
        character: "warrior",
        type: "attack",
        rarity: "rare",
        cost: 2,
        damage: 14,
        rageCost: 2,
        rageBonusDamage: 10,
        description: "14ダメージ。闘志が2以上なら2消費し、さらに10ダメージ。"
    },

    battleCry: {
        id: "battleCry",
        name: "雄叫び",
        character: "warrior",
        type: "skill",
        rarity: "rare",
        cost: 0,
        rageGain: 2,
        description: "闘志を2得る。"
    },

    ironGuard: {
        id: "ironGuard",
        name: "鉄壁",
        character: "warrior",
        unlockSkill: "warrior_fortress_step_7",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 9,
        rageCost: 2,
        rageBonusBlock: 9,
        description: "9ブロック。闘志が2以上なら2消費し、さらに9ブロック。"
    },

    relentlessSlash: {
        id: "relentlessSlash",
        name: "猛連斬",
        character: "warrior",
        unlockSkill: "warrior_combo_step_7",
        type: "attack",
        rarity: "rare",
        cost: 1,
        damage: 8,
        rageCost: 2,
        rageBonusDraw: 2,
        description: "8ダメージ。闘志が2以上なら2消費し、カードを2枚引く。"
    },

    berserk: {
        id: "berserk",
        name: "血気",
        character: "warrior",
        unlockSkill: "warrior_berserk_step_8",
        type: "skill",
        rarity: "rare",
        cost: 1,
        rageGain: 3,
        selfDamage: 3,
        description: "闘志を3得る。自分に3ダメージ。"
    },

    battleMend: {
        id: "battleMend",
        name: "戦意回復",
        character: "warrior",
        unlockSkill: "warrior_fortress_step_8",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 9,
        rageCost: 3,
        rageBonusBlock: 5,
        description: "9ブロックを得る。闘志3を消費すると追加で5ブロックを得る。"
    },

    shieldBreak: {
        id: "shieldBreak",
        name: "盾砕き",
        character: "warrior",
        unlockSkill: "warrior_combo_step_8",
        type: "attack",
        rarity: "rare",
        cost: 2,
        damage: 12,
        rageCost: 3,
        rageBonusDamage: 18,
        description: "12ダメージ。闘志が3以上なら3消費し、さらに18ダメージ。"
    },

    execution: {
        id: "execution",
        name: "処刑撃",
        character: "warrior",
        unlockSkill: "warrior_combo_step_9",
        type: "attack",
        rarity: "epic",
        cost: 3,
        damage: 24,
        rageCost: 5,
        rageBonusDamage: 30,
        description: "24ダメージ。闘志が5なら全て消費し、さらに30ダメージ。"
    },

    unyielding: {
        id: "unyielding",
        name: "不屈",
        character: "warrior",
        unlockSkill: "warrior_fortress_step_9",
        type: "skill",
        rarity: "epic",
        cost: 1,
        block: 12,
        rageCost: 3,
        rageBonusBlock: 18,
        description: "12ブロック。闘志が3以上なら3消費し、さらに18ブロック。"
    },


    // ======================
    // 魔法使い専用カード
    // 属性連鎖：火 → 雷 → 氷 → 火 の順で追加効果。
    // 火→雷：+6ダメージ
    // 雷→氷：+8ブロック
    // 氷→火：1ドロー
    // ======================

    fire: {
        id: "fire",
        name: "フレイム",
        character: "wizard",
        type: "attack",
        rarity: "rare",
        cost: 1,
        description: "🔥 火属性。8ダメージ。氷の次に使うと1枚引く。",
        damage: 8,
        magic: true,
        element: "fire"
    },

    tripleStrike: {
        id: "tripleStrike",
        name: "雷連弾",
        character: "wizard",
        type: "attack",
        rarity: "rare",
        cost: 1,
        damage: 4,
        hits: 3,
        description: "⚡ 雷属性。4ダメージを3回。火の次に使うと各連撃前の合計ダメージに+6。",
        magic: true,
        element: "lightning"
    },

    iceShield: {
        id: "iceShield",
        name: "氷壁",
        character: "wizard",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 9,
        description: "❄️ 氷属性。9ブロック。雷の次に使うとさらに8ブロック。",
        magic: true,
        element: "ice"
    },

    spark: {
        id: "spark",
        name: "スパーク",
        character: "wizard",
        unlockSkill: "wizard_chain_step_8",
        type: "attack",
        rarity: "rare",
        cost: 1,
        damage: 7,
        draw: 1,
        description: "⚡ 雷属性。7ダメージ。カードを1枚引く。",
        magic: true,
        element: "lightning"
    },

    frostLance: {
        id: "frostLance",
        name: "フロストランス",
        character: "wizard",
        unlockSkill: "wizard_focus_step_7",
        type: "attack",
        rarity: "rare",
        cost: 1,
        damage: 11,
        description: "❄️ 氷属性。11ダメージ。雷の次なら追加で8ブロック。",
        magic: true,
        element: "ice"
    },

    flameWave: {
        id: "flameWave",
        name: "炎波",
        character: "wizard",
        unlockSkill: "wizard_overflow_step_7",
        type: "attack",
        rarity: "rare",
        cost: 2,
        damage: 16,
        description: "🔥 火属性。16ダメージ。氷の次ならカードを1枚引く。",
        magic: true,
        element: "fire"
    },

    thunderSpear: {
        id: "thunderSpear",
        name: "雷槍",
        character: "wizard",
        unlockSkill: "wizard_overflow_step_8",
        type: "attack",
        rarity: "rare",
        cost: 2,
        damage: 17,
        description: "⚡ 雷属性。17ダメージ。火の次ならさらに6ダメージ。",
        magic: true,
        element: "lightning"
    },

    frozenStudy: {
        id: "frozenStudy",
        name: "凍結思考",
        character: "wizard",
        unlockSkill: "wizard_focus_step_8",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 6,
        draw: 1,
        description: "❄️ 氷属性。6ブロック。カードを1枚引く。",
        magic: true,
        element: "ice"
    },

    elementalBurst: {
        id: "elementalBurst",
        name: "元素爆発",
        character: "wizard",
        unlockSkill: "wizard_chain_step_9",
        type: "attack",
        rarity: "epic",
        cost: 2,
        damage: 23,
        description: "🔥 火属性。23ダメージ。氷の次ならさらに1枚引く。",
        magic: true,
        element: "fire"
    },

    stormArchive: {
        id: "stormArchive",
        name: "雷霆の書庫",
        character: "wizard",
        unlockSkill: "wizard_focus_step_10",
        type: "attack",
        rarity: "legendary",
        cost: 2,
        damage: 32,
        draw: 2,
        description: "⚡ 雷属性。32ダメージ。カードを2枚引く。火の次なら属性連鎖も発生する。",
        magic: true,
        element: "lightning"
    },


    // ======================
    // 機工士専用カード
    // 高コスト / エナジー操作 / 反動がテーマ
    // ======================

    overdriveShot: {
        id: "overdriveShot",
        name: "過充電射撃",
        character: "machinist",
        type: "attack",
        rarity: "rare",
        cost: 2,
        damage: 18,
        nextTurnEnergyPenalty: 1,
        description: "18ダメージ。次のターンのエナジー-1。"
    },

    chargeCell: {
        id: "chargeCell",
        name: "チャージ",
        character: "machinist",
        type: "skill",
        rarity: "rare",
        cost: 0,
        nextTurnEnergyBonus: 2,
        description: "次のターンのエナジー+2。"
    },

    ventHeat: {
        id: "ventHeat",
        name: "ベント",
        character: "machinist",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 9,
        clearEnergyPenalty: true,
        description: "9ブロック。次ターンのエナジー減少をすべて解除する。"
    },

    scrapBurst: {
        id: "scrapBurst",
        name: "スクラップ弾",
        character: "machinist",
        type: "attack",
        rarity: "rare",
        cost: 1,
        damage: 7,
        draw: 1,
        description: "7ダメージ。カードを1枚引く。"
    },

    overclock: {
        id: "overclock",
        name: "オーバークロック",
        character: "machinist",
        unlockSkill: "machinist_generator_step_7",
        type: "skill",
        rarity: "rare",
        cost: 1,
        energy: 2,
        selfDamage: 4,
        description: "エナジー+2。自分に4ダメージ。"
    },

    pulseCannon: {
        id: "pulseCannon",
        name: "パルスキャノン",
        character: "machinist",
        unlockSkill: "machinist_artillery_step_7",
        type: "attack",
        rarity: "rare",
        cost: 3,
        damage: 27,
        description: "27ダメージ。"
    },

    emergencyBarrier: {
        id: "emergencyBarrier",
        name: "緊急障壁",
        character: "machinist",
        unlockSkill: "machinist_stable_step_7",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 14,
        nextTurnEnergyPenalty: 1,
        description: "14ブロック。次のターンのエナジー-1。"
    },

    railgun: {
        id: "railgun",
        name: "試作レールガン",
        character: "machinist",
        unlockSkill: "machinist_artillery_step_8",
        type: "attack",
        rarity: "epic",
        cost: 3,
        damage: 36,
        selfDamage: 5,
        description: "36ダメージ。自分に5ダメージ。"
    },

    reactorBurst: {
        id: "reactorBurst",
        name: "炉心解放",
        character: "machinist",
        unlockSkill: "machinist_stable_step_8",
        type: "skill",
        rarity: "epic",
        cost: 0,
        energy: 3,
        selfDamage: 7,
        description: "エナジー+3。自分に7ダメージ。"
    },


    // ======================
    // 墓守専用カード
    // 捨て札を資源として使い、掘り返して再利用する。
    // ======================

    graveSlash: {
        id: "graveSlash",
        name: "墓所の一閃",
        character: "gravekeeper",
        type: "attack",
        rarity: "rare",
        cost: 1,
        damage: 7,
        damagePerDiscard: 1,
        discardScalingCap: 8,
        description: "7ダメージ。捨て札1枚につき+1ダメージ（最大+8）。"
    },

    burial: {
        id: "burial",
        name: "埋葬",
        character: "gravekeeper",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 10,
        discardRandom: 1,
        discardBonusBlock: 6,
        description: "10ブロック。手札をランダムに1枚捨てられたなら、さらに6ブロック。"
    },

    exhume: {
        id: "exhume",
        name: "リコール",
        character: "gravekeeper",
        type: "skill",
        rarity: "rare",
        cost: 1,
        returnDiscard: 1,
        description: "捨て札からランダムなカードを1枚、手札に戻す。戻したカードはこのターン0コスト。"
    },

    boneWall: {
        id: "boneWall",
        name: "骸の壁",
        character: "gravekeeper",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 6,
        blockPerDiscard: 1,
        discardScalingCap: 10,
        description: "6ブロック。捨て札1枚につき+1ブロック（最大+10）。"
    },

    funeralBell: {
        id: "funeralBell",
        name: "葬送の鐘",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_funeral_step_7",
        type: "attack",
        rarity: "rare",
        cost: 2,
        damage: 10,
        damagePerDiscard: 2,
        discardScalingCap: 8,
        description: "10ダメージ。捨て札1枚につき+2ダメージ（最大+16）。"
    },

    ashOffering: {
        id: "ashOffering",
        name: "灰の供物",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_discard_step_7",
        type: "skill",
        rarity: "rare",
        cost: 0,
        discardRandom: 2,
        energyPerDiscarded: 1,
        description: "他の手札を最大2枚ランダムに捨てる。捨てた枚数だけエナジーを得る。"
    },

    soulRecall: {
        id: "soulRecall",
        name: "魂還り",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_recovery_step_7",
        type: "skill",
        rarity: "rare",
        cost: 1,
        returnDiscard: 2,
        description: "捨て札からランダムなカードを2枚まで手札に戻す。"
    },

    graveHarvest: {
        id: "graveHarvest",
        name: "墓標収穫",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_discard_step_8",
        type: "attack",
        rarity: "epic",
        cost: 2,
        damage: 8,
        damagePerDiscard: 3,
        discardScalingCap: 8,
        description: "8ダメージ。捨て札1枚につき+3ダメージ（最大+24）。"
    },

    lastRites: {
        id: "lastRites",
        name: "終祷",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_funeral_step_8",
        type: "skill",
        rarity: "epic",
        cost: 1,
        consumeDiscard: 3,
        block: 8,
        drawPerConsumed: 1,
        description: "8ブロックを得る。捨て札を最大3枚消滅させ、消滅1枚につき1枚ドロー。"
    },



    // ======================
    // v13 初期解放の高レアリティカード
    // 強いカードが最初から存在するようにしつつ、
    // スキルツリー解放カードは別枠の「追加カード」にする。
    // ======================

    warriorMeteorSlash: {
        id: "warriorMeteorSlash",
        name: "隕鉄斬",
        character: "warrior",
        unlockSkill: "warrior_combo_step_10",
        type: "attack",
        rarity: "legendary",
        cost: 2,
        damage: 42,
        rageGain: 2,
        description: "42ダメージ。闘志を2得る。"
    },

    warriorFortressBreaker: {
        id: "warriorFortressBreaker",
        name: "城砕き",
        character: "warrior",
        type: "attack",
        rarity: "legendary",
        cost: 3,
        damage: 20,
        rageCost: 3,
        rageBonusDamage: 15,
        description: "20ダメージ。闘志3以上なら3消費し、さらに15ダメージ（合計35）。"
    },

    warriorFinalBanner: {
        id: "warriorFinalBanner",
        name: "不落の軍旗",
        character: "warrior",
        type: "skill",
        rarity: "legendary",
        cost: 2,
        block: 28,
        draw: 2,
        rageGain: 2,
        description: "28ブロック。カードを2枚引き、闘志を2得る。"
    },

    wizardCometFlare: {
        id: "wizardCometFlare",
        name: "彗星火",
        character: "wizard",
        unlockSkill: "wizard_overflow_step_9",
        type: "attack",
        rarity: "legendary",
        cost: 2,
        damage: 28,
        magic: true,
        element: "fire",
        description: "🔥 火属性。28ダメージ。氷の次なら属性連鎖も発動。"
    },

    wizardGlacialArchive: {
        id: "wizardGlacialArchive",
        name: "氷晶書庫",
        character: "wizard",
        type: "skill",
        rarity: "legendary",
        cost: 1,
        block: 10,
        draw: 2,
        magic: true,
        element: "ice",
        description: "❄️ 氷属性。10ブロック。カードを2枚引く。"
    },

    wizardStormCrown: {
        id: "wizardStormCrown",
        name: "雷帝の戴冠",
        character: "wizard",
        type: "attack",
        rarity: "legendary",
        cost: 3,
        damage: 36,
        hits: 2,
        magic: true,
        element: "lightning",
        description: "⚡ 雷属性。36ダメージを2回。火の次なら属性連鎖も発動。"
    },

    machinistSiegeCannon: {
        id: "machinistSiegeCannon",
        name: "攻城砲",
        character: "machinist",
        unlockSkill: "machinist_artillery_step_9",
        type: "attack",
        rarity: "legendary",
        cost: 3,
        damage: 42,
        nextTurnEnergyPenalty: 1,
        description: "42ダメージ。次のターンのエナジー-1。"
    },

    machinistReserveReactor: {
        id: "machinistReserveReactor",
        name: "予備炉心",
        character: "machinist",
        unlockSkill: "machinist_generator_step_9",
        type: "skill",
        rarity: "legendary",
        cost: 1,
        energy: 2,
        block: 12,
        nextTurnEnergyPenalty: 1,
        description: "エナジー+2、12ブロック。次のターンのエナジー-1。"
    },

    machinistCatastropheEngine: {
        id: "machinistCatastropheEngine",
        name: "災厄機関",
        character: "machinist",
        unlockSkill: "machinist_artillery_step_10",
        type: "attack",
        rarity: "legendary",
        cost: 3,
        damage: 72,
        selfDamage: 6,
        nextTurnEnergyPenalty: 2,
        description: "72ダメージ。自分に6ダメージ。次のターンのエナジー-2。"
    },

    gravekeeperBoneCathedral: {
        id: "gravekeeperBoneCathedral",
        name: "骨の大聖堂",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_funeral_step_9",
        type: "skill",
        rarity: "legendary",
        cost: 2,
        block: 18,
        blockPerDiscard: 3,
        discardScalingCap: 6,
        description: "18ブロック。捨て札1枚につき+3ブロック（最大+18）。"
    },

    gravekeeperPaleProcession: {
        id: "gravekeeperPaleProcession",
        name: "蒼白の葬列",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_recovery_step_10",
        type: "attack",
        rarity: "legendary",
        cost: 2,
        damage: 20,
        damagePerDiscard: 6,
        discardScalingCap: 8,
        description: "20ダメージ。捨て札1枚につき+6ダメージ（最大+48）。"
    },

    gravekeeperLastFuneral: {
        id: "gravekeeperLastFuneral",
        name: "最後の葬儀",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_funeral_step_10",
        type: "attack",
        rarity: "legendary",
        cost: 3,
        damage: 26,
        damagePerDiscard: 7,
        discardScalingCap: 8,
        draw: 2,
        description: "26ダメージ。捨て札1枚につき+7ダメージ（最大+56）。カードを2枚引く。"
    },

    // ======================
    // v11 高レアリティ解放カード
    // スキルツリーで解放後、報酬・ショップに出現。
    // ======================

    warriorOverlordCombo: {
        id: "warriorOverlordCombo",
        name: "覇王の連撃",
        character: "warrior",
        unlockSkill: "warrior_unlock_1",
        type: "attack",
        rarity: "legendary",
        cost: 2,
        damage: 4,
        hits: 3,
        rageCost: 3,
        rageBonusDamage: 4,
        description: "4ダメージを3回。闘志3以上なら3消費し、追加で4ダメージ。"
    },

    warriorBloodOath: {
        id: "warriorBloodOath",
        name: "血戦の誓い",
        character: "warrior",
        unlockSkill: "warrior_unlock_2",
        type: "skill",
        rarity: "legendary",
        cost: 1,
        block: 14,
        rageGain: 5,
        selfDamage: 5,
        description: "14ブロック。闘志を5まで得る。自分に5ダメージ。"
    },

    warriorKingsStance: {
        id: "warriorKingsStance",
        name: "王者の構え",
        character: "warrior",
        unlockSkill: "warrior_unlock_3",
        type: "skill",
        rarity: "epic",
        cost: 1,
        block: 16,
        draw: 2,
        rageGain: 1,
        description: "16ブロック。カードを2枚引き、闘志+1。"
    },

    warriorWarGod: {
        id: "warriorWarGod",
        name: "戦神降臨",
        character: "warrior",
        unlockSkill: "warrior_legend",
        type: "attack",
        rarity: "legendary",
        cost: 3,
        damage: 36,
        rageCost: 5,
        rageBonusDamage: 54,
        rageBonusDraw: 2,
        description: "36ダメージ。闘志5なら全消費し、さらに54ダメージして2枚引く。"
    },

    wizardTriadNova: {
        id: "wizardTriadNova",
        name: "三相崩壊",
        character: "wizard",
        unlockSkill: "wizard_unlock_1",
        type: "attack",
        rarity: "legendary",
        cost: 2,
        damage: 26,
        draw: 1,
        magic: true,
        element: "fire",
        description: "🔥 火属性。26ダメージ、1枚引く。氷の次なら属性連鎖も発動。"
    },

    wizardAbsoluteZero: {
        id: "wizardAbsoluteZero",
        name: "絶対零度",
        character: "wizard",
        unlockSkill: "wizard_unlock_2",
        type: "skill",
        rarity: "legendary",
        cost: 1,
        block: 24,
        draw: 2,
        magic: true,
        element: "ice",
        description: "❄️ 氷属性。24ブロック、カードを2枚引く。"
    },

    wizardManaTorrent: {
        id: "wizardManaTorrent",
        name: "魔力奔流",
        character: "wizard",
        unlockSkill: "wizard_unlock_3",
        type: "skill",
        rarity: "epic",
        cost: 1,
        energy: 2,
        draw: 1,
        magic: true,
        element: "lightning",
        description: "⚡ 雷属性。エナジー+2、カードを1枚引く。"
    },

    wizardAstralConvergence: {
        id: "wizardAstralConvergence",
        name: "星界収束",
        character: "wizard",
        unlockSkill: "wizard_legend",
        type: "attack",
        rarity: "legendary",
        cost: 3,
        damage: 42,
        draw: 2,
        magic: true,
        element: "lightning",
        description: "⚡ 雷属性。42ダメージ、カードを2枚引く。火の次なら属性連鎖も発動。"
    },

    machinistRailgun: {
        id: "machinistRailgun",
        name: "超電磁砲",
        character: "machinist",
        unlockSkill: "machinist_unlock_1",
        type: "attack",
        rarity: "legendary",
        cost: 3,
        damage: 38,
        nextTurnEnergyPenalty: 1,
        description: "38ダメージ。次のターンのエナジー-1。"
    },

    machinistEmergencyGrid: {
        id: "machinistEmergencyGrid",
        name: "緊急電力網",
        character: "machinist",
        unlockSkill: "machinist_unlock_2",
        type: "skill",
        rarity: "legendary",
        cost: 1,
        block: 22,
        nextTurnEnergyBonus: 2,
        selfDamage: 4,
        description: "22ブロック。次ターンのエナジー+2。自分に4ダメージ。"
    },

    machinistOverloadConverter: {
        id: "machinistOverloadConverter",
        name: "過負荷変換",
        character: "machinist",
        unlockSkill: "machinist_unlock_3",
        type: "skill",
        rarity: "epic",
        cost: 1,
        energy: 3,
        nextTurnEnergyPenalty: 2,
        description: "エナジー+3。次のターンのエナジー-2。"
    },

    machinistFinalArmament: {
        id: "machinistFinalArmament",
        name: "終端兵装",
        character: "machinist",
        unlockSkill: "machinist_legend",
        type: "attack",
        rarity: "legendary",
        cost: 3,
        damage: 58,
        nextTurnEnergyPenalty: 2,
        selfDamage: 4,
        description: "58ダメージ。次のターンのエナジー-2。自分に4ダメージ。"
    },

    gravekeeperOssuary: {
        id: "gravekeeperOssuary",
        name: "納骨堂",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_unlock_1",
        type: "attack",
        rarity: "legendary",
        cost: 2,
        damage: 12,
        damagePerDiscard: 4,
        discardScalingCap: 8,
        description: "12ダメージ。捨て札1枚につき+4ダメージ（最大+32）。"
    },

    gravekeeperRequiem: {
        id: "gravekeeperRequiem",
        name: "鎮魂歌",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_unlock_2",
        type: "skill",
        rarity: "legendary",
        cost: 1,
        block: 14,
        returnDiscard: 2,
        description: "14ブロック。捨て札からカードを2枚手札に戻す。"
    },

    gravekeeperMarch: {
        id: "gravekeeperMarch",
        name: "死者の行進",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_unlock_3",
        type: "attack",
        rarity: "epic",
        cost: 2,
        damage: 10,
        damagePerDiscard: 3,
        discardScalingCap: 10,
        draw: 1,
        description: "10ダメージ。捨て札1枚につき+3ダメージ（最大+30）。1枚引く。"
    },

    gravekeeperUnderworldGate: {
        id: "gravekeeperUnderworldGate",
        name: "冥府の門",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_legend",
        type: "attack",
        rarity: "legendary",
        cost: 3,
        damage: 18,
        damagePerDiscard: 5,
        discardScalingCap: 10,
        description: "18ダメージ。捨て札1枚につき+5ダメージ（最大+50）。"
    }

,
    // v21 消滅カード
    warriorLastCharge:{id:"warriorLastCharge",name:"決死の一閃",character:"warrior",unlockSkill:"warrior_berserk_1",type:"attack",rarity:"epic",cost:2,damage:24,rageCost:3,rageBonusDamage:16,exhaust:true,description:"24ダメージ。闘志が3以上なら3消費し、さらに16ダメージ。🔥 消滅：使用後、この戦闘中は再使用できない。"},
    wizardForbiddenFlash:{id:"wizardForbiddenFlash",name:"禁呪・瞬光",character:"wizard",unlockSkill:"wizard_chain_1",type:"attack",rarity:"epic",cost:2,damage:22,draw:2,magic:true,element:"lightning",exhaust:true,description:"⚡ 雷属性。22ダメージ。カードを2枚引く。🔥 消滅：使用後、この戦闘中は再使用できない。"},
    machinistCoreRelease:{id:"machinistCoreRelease",name:"緊急炉心解放",character:"machinist",unlockSkill:"machinist_generator_1",type:"skill",rarity:"epic",cost:0,energy:3,nextTurnEnergyPenalty:2,exhaust:true,description:"エナジーを3得る。次ターンのエナジー-2。🔥 消滅：使用後、この戦闘中は再使用できない。"},
    gravekeeperOffering:{id:"gravekeeperOffering",name:"死者への手向け",character:"gravekeeper",unlockSkill:"gravekeeper_discard_1",type:"skill",rarity:"epic",cost:1,block:4,blockPerDiscard:2,discardScalingCap:10,draw:1,exhaust:true,description:"4ブロック。捨て札1枚につき+2ブロック（最大+20）。カードを1枚引く。🔥 消滅：使用後、この戦闘中は再使用できない。"}

,
    // ======================
    // v22 スキルツリー追加カード
    // ======================

    warriorIronTempo: {
        id: "warriorIronTempo",
        name: "鋼のテンポ",
        character: "warrior",
        unlockSkill: "warrior_combo_1",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 8,
        draw: 1,
        rageGain: 1,
        description: "8ブロック。カードを1枚引き、闘志+1。"
    },

    wizardElementVault: {
        id: "wizardElementVault",
        name: "元素保管庫",
        character: "wizard",
        unlockSkill: "wizard_overflow_1",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 8,
        draw: 1,
        magic: true,
        element: "ice",
        description: "❄️ 氷属性。8ブロック。カードを1枚引く。"
    },

    machinistMagneticBrake: {
        id: "machinistMagneticBrake",
        name: "磁気制動",
        character: "machinist",
        unlockSkill: "machinist_stable_1",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 12,
        nextTurnEnergyBonus: 1,
        description: "12ブロック。次ターンのエナジー+1。"
    },

    gravekeeperLastRites: {
        id: "gravekeeperLastRites",
        name: "最後の祈り",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_funeral_1",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 8,
        returnDiscard: 1,
        description: "8ブロック。捨て札からカードを1枚手札に戻す。"
    }

,
    // ======================================================
    // v23 - Choice branch cards
    // ======================================================

    warriorBattleCry: {
        id: "warriorBattleCry",
        name: "鬨の声",
        character: "warrior",
        unlockSkill: "warrior_berserk_alt",
        type: "skill",
        rarity: "epic",
        cost: 1,
        block: 5,
        rageGain: 2,
        description: "5ブロック。闘志+2。"
    },

    warriorCounterGuard: {
        id: "warriorCounterGuard",
        name: "迎撃防御",
        character: "warrior",
        unlockSkill: "warrior_fortress_alt",
        type: "skill",
        rarity: "epic",
        cost: 1,
        block: 14,
        reflectThisTurn: 6,
        description: "14ブロック。このターン、敵の攻撃を受けるたび6ダメージを返す。"
    },

    warriorFeint: {
        id: "warriorFeint",
        name: "フェイント",
        character: "warrior",
        unlockSkill: "warrior_combo_alt",
        type: "attack",
        rarity: "epic",
        cost: 0,
        damage: 5,
        draw: 1,
        description: "5ダメージ。カードを1枚引く。"
    },

    wizardQuickSpark: {
        id: "wizardQuickSpark",
        name: "瞬雷",
        character: "wizard",
        unlockSkill: "wizard_chain_alt",
        type: "attack",
        rarity: "epic",
        cost: 1,
        damage: 9,
        draw: 1,
        magic: true,
        element: "lightning",
        description: "⚡ 雷属性。9ダメージ。カードを1枚引く。"
    },

    wizardFrostMirror: {
        id: "wizardFrostMirror",
        name: "氷鏡",
        character: "wizard",
        unlockSkill: "wizard_focus_alt",
        type: "skill",
        rarity: "epic",
        cost: 1,
        block: 14,
        magic: true,
        element: "ice",
        description: "❄️ 氷属性。14ブロック。"
    },

    wizardEmberReserve: {
        id: "wizardEmberReserve",
        name: "余炎蓄積",
        character: "wizard",
        unlockSkill: "wizard_overflow_alt",
        type: "skill",
        rarity: "epic",
        cost: 1,
        block: 5,
        energy: 1,
        magic: true,
        element: "fire",
        description: "🔥 火属性。5ブロック。エナジー+1。"
    },

    machinistReserveCell: {
        id: "machinistReserveCell",
        name: "予備セル放出",
        character: "machinist",
        unlockSkill: "machinist_generator_alt",
        type: "skill",
        rarity: "epic",
        cost: 0,
        energy: 1,
        draw: 1,
        exhaust: true,
        description: "エナジー+1。カードを1枚引く。🔥 消滅：使用後、この戦闘中は再使用できない。"
    },

    machinistBurstCannon: {
        id: "machinistBurstCannon",
        name: "突発砲撃",
        character: "machinist",
        unlockSkill: "machinist_artillery_alt",
        type: "attack",
        rarity: "epic",
        cost: 2,
        damage: 23,
        nextTurnEnergyPenalty: 1,
        description: "23ダメージ。次ターンのエナジー-1。"
    },

    machinistShockAbsorber: {
        id: "machinistShockAbsorber",
        name: "衝撃吸収",
        character: "machinist",
        unlockSkill: "machinist_stable_alt",
        type: "skill",
        rarity: "epic",
        cost: 1,
        block: 11,
        clearEnergyPenalty: true,
        description: "11ブロック。次ターンのエナジー減少を解除する。"
    },

    gravekeeperGraveDig: {
        id: "gravekeeperGraveDig",
        name: "墓掘り",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_discard_alt",
        type: "skill",
        rarity: "epic",
        cost: 1,
        block: 6,
        discardRandom: 1,
        energyPerDiscarded: 1,
        description: "6ブロック。手札をランダムに1枚捨て、捨てたならエナジー+1。"
    },

    gravekeeperBoneRecall: {
        id: "gravekeeperBoneRecall",
        name: "骨の呼び戻し",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_recovery_alt",
        type: "skill",
        rarity: "epic",
        cost: 1,
        block: 5,
        returnDiscard: 1,
        draw: 1,
        description: "5ブロック。捨て札からカードを1枚手札に戻し、カードを1枚引く。"
    },

    gravekeeperGraveShield: {
        id: "gravekeeperGraveShield",
        name: "墓標の盾",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_funeral_alt",
        type: "skill",
        rarity: "epic",
        cost: 1,
        block: 5,
        blockPerDiscard: 1,
        discardScalingCap: 9,
        description: "5ブロック。捨て札1枚につき+1ブロック（最大+9）。"
    },

    // ======================
    // v32 通常報酬カード追加
    // 各キャラクター3枚ずつ。報酬の重複感を減らしつつ、既存ビルドを補助する。
    // ======================

    warriorSpiritSlash: {
        id: "warriorSpiritSlash",
        name: "気迫斬り",
        character: "warrior",
        unlockSkill: "warrior_berserk_step_7",
        type: "attack",
        rarity: "rare",
        cost: 1,
        damage: 8,
        rageGain: 2,
        description: "8ダメージ。闘志を2得る。"
    },

    warriorResetGuard: {
        id: "warriorResetGuard",
        name: "守勢転換",
        character: "warrior",
        unlockSkill: "warrior_fortress_step_10",
        type: "skill",
        rarity: "legendary",
        cost: 1,
        block: 24,
        draw: 2,
        description: "24ブロック。カードを2枚引く。"
    },

    warriorRageCycle: {
        id: "warriorRageCycle",
        name: "闘気循環",
        character: "warrior",
        unlockSkill: "warrior_berserk_step_9",
        type: "skill",
        rarity: "epic",
        cost: 1,
        energy: 1,
        rageGain: 2,
        description: "エナジーを1得る。闘志を2得る。"
    },

    wizardEmber: {
        id: "wizardEmber",
        name: "エンバー",
        character: "wizard",
        unlockSkill: "wizard_chain_step_7",
        type: "attack",
        rarity: "rare",
        cost: 0,
        damage: 4,
        magic: true,
        element: "fire",
        description: "🔥 火属性。4ダメージ。属性連鎖の起点に使いやすい。"
    },

    wizardCoolingCircle: {
        id: "wizardCoolingCircle",
        name: "冷却陣",
        character: "wizard",
        unlockSkill: "wizard_focus_step_9",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 7,
        draw: 1,
        magic: true,
        element: "ice",
        description: "❄️ 氷属性。7ブロック。カードを1枚引く。雷の次なら属性連鎖でさらにブロックを得る。"
    },

    wizardElementFlow: {
        id: "wizardElementFlow",
        name: "エレメントフロー",
        character: "wizard",
        unlockSkill: "wizard_overflow_step_10",
        type: "skill",
        rarity: "legendary",
        cost: 1,
        block: 14,
        energy: 2,
        magic: true,
        element: "fire",
        description: "🔥 火属性。14ブロック。エナジーを2得る。氷の次なら属性連鎖でカードを1枚引く。"
    },

    machinistAuxCell: {
        id: "machinistAuxCell",
        name: "補助セル",
        character: "machinist",
        unlockSkill: "machinist_generator_step_8",
        type: "skill",
        rarity: "rare",
        cost: 1,
        energy: 2,
        nextTurnEnergyPenalty: 1,
        description: "エナジーを2得る。次ターンのエナジー-1。"
    },

    machinistArmorPlate: {
        id: "machinistArmorPlate",
        name: "装甲板",
        character: "machinist",
        unlockSkill: "machinist_stable_step_9",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 10,
        description: "10ブロックを得る。"
    },

    machinistTwinBarrel: {
        id: "machinistTwinBarrel",
        name: "ツインバレル",
        character: "machinist",
        unlockSkill: "machinist_generator_step_10",
        type: "attack",
        rarity: "legendary",
        cost: 2,
        damage: 18,
        hits: 2,
        nextTurnEnergyPenalty: 1,
        description: "18ダメージを2回。次ターンのエナジー-1。"
    },

    gravekeeperGraveSoil: {
        id: "gravekeeperGraveSoil",
        name: "墓土払い",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_discard_step_9",
        type: "skill",
        rarity: "rare",
        cost: 1,
        block: 7,
        discardRandom: 1,
        energyPerDiscarded: 1,
        description: "7ブロック。手札をランダムに1枚捨て、そのカード1枚につきエナジーを1得る。"
    },

    gravekeeperDeadFinger: {
        id: "gravekeeperDeadFinger",
        name: "亡者の指",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_recovery_step_8",
        type: "attack",
        rarity: "rare",
        cost: 1,
        damage: 7,
        damagePerDiscard: 1,
        discardScalingCap: 6,
        description: "7ダメージ。捨て札1枚につき+1ダメージ（最大+6）。"
    },

    gravekeeperReburial: {
        id: "gravekeeperReburial",
        name: "再埋葬",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_recovery_step_9",
        type: "skill",
        rarity: "epic",
        cost: 1,
        consumeDiscard: 2,
        block: 7,
        drawPerConsumed: 1,
        description: "7ブロックを得る。捨て札を最大2枚消費し、1枚につきカードを1枚引く。"
    },

    // ======================
    // v33 固有リソース・フィニッシャー
    // ======================

    warriorRageFinisher: {
        id: "warriorRageFinisher",
        name: "ブレイブエッジ",
        character: "warrior",
        unlockSkill: "warrior_berserk_step_10",
        type: "attack",
        rarity: "legendary",
        cost: 2,
        damage: 16,
        rageScaling: 5,
        rageScalingCap: 40,
        description: "16ダメージ。現在の闘志1につき+5ダメージ（最大+40）。闘志は消費しない。"
    },

    wizardChainFinisher: {
        id: "wizardChainFinisher",
        name: "コンバージェンス",
        character: "wizard",
        unlockSkill: "wizard_chain_step_10",
        type: "attack",
        rarity: "legendary",
        cost: 2,
        damage: 16,
        chainScaling: 8,
        chainScalingCap: 48,
        magic: true,
        description: "16ダメージ。この戦闘で成功した属性連鎖1回につき+8ダメージ（最大+48）。"
    },

    machinistRecoilFinisher: {
        id: "machinistRecoilFinisher",
        name: "リアクターショット",
        character: "machinist",
        unlockSkill: "machinist_stable_step_10",
        type: "attack",
        rarity: "legendary",
        cost: 2,
        damage: 18,
        recoilScaling: 10,
        recoilScalingCap: 50,
        description: "18ダメージ。抱えている次ターンのエナジー増減・過充電・漏電の合計1につき+10ダメージ（最大+50）。"
    },

    gravekeeperDiscardFinisher: {
        id: "gravekeeperDiscardFinisher",
        name: "グレイヴタイド",
        character: "gravekeeper",
        unlockSkill: "gravekeeper_discard_step_10",
        type: "attack",
        rarity: "legendary",
        cost: 2,
        damage: 14,
        discardFinisherScaling: 4,
        discardFinisherCap: 48,
        description: "14ダメージ。捨て札1枚につき+4ダメージ（最大+48）。"
    },

    // ======================
    // v31 特殊カード
    // 報酬プールには出ず、レリックなどからのみ追加される。
    // ======================

    burningShardCurse: {
        id: "burningShardCurse",
        name: "灼けた欠片",
        type: "curse",
        rarity: "curse",
        cost: 0,
        special: true,
        unplayable: true,
        endTurnSelfDamage: 1,
        description: "呪い。使用できない。ターン終了時、手札にあるならHPを1失う。山札・捨て札にある間は何も起きない。"
    },

    woundStatus: {
        id: "woundStatus",
        name: "負傷",
        type: "curse",
        rarity: "curse",
        cost: 0,
        special: true,
        unplayable: true,
        description: "一時呪い。使用できない。戦闘中に捨て札へ混入し、戦闘後に消える。"
    },

    overheatStatus: {
        id: "overheatStatus",
        name: "過熱",
        type: "curse",
        rarity: "curse",
        cost: 0,
        special: true,
        unplayable: true,
        ethereal: true,
        endTurnSelfDamage: 2,
        description: "一時呪い。使用できない。ターン終了時、手札にあるならHPを2失い、その後消滅する。"
    }


};


// ======================
// v28 カード強化
// ======================

function createUpgradedCard(baseCard) {

    const upgraded = {
        ...baseCard,
        id: `${baseCard.id}__up`,
        baseCardId: baseCard.id,
        upgraded: true,
        name: `${baseCard.name}+`
    };

    const notes = [];

    const addNumber = (key, amount, label) => {
        if (typeof baseCard[key] !== "number") return false;
        upgraded[key] = baseCard[key] + amount;
        notes.push(`${label}+${amount}`);
        return true;
    };

    const improveDamage = () => {
        if (typeof baseCard.damage !== "number") return false;
        const amount = Math.max(2, Math.ceil(baseCard.damage * 0.25));
        upgraded.damage = baseCard.damage + amount;
        notes.push(`ダメージ+${amount}`);
        return true;
    };

    const improveBlock = () => {
        if (typeof baseCard.block !== "number") return false;
        const amount = baseCard.id === "warriorIronGuard" ? 4 : Math.max(2, Math.ceil(baseCard.block * 0.25));
        upgraded.block = baseCard.block + amount;
        notes.push(`ブロック+${amount}`);
        return true;
    };

    // 基本方針：そのカードの主役となる効果を1〜2個強化する。
    // 数値を全部まとめて上げないことで、強化後もカードの役割を保つ。
    const hasDamage = typeof baseCard.damage === "number";
    const hasBlock = typeof baseCard.block === "number";

    if (hasDamage) {
        improveDamage();
    }

    if (hasBlock && !hasDamage) {
        improveBlock();
    }

    if (hasDamage && hasBlock && baseCard.type === "skill") {
        improveBlock();
    }


    if (typeof baseCard.rageGain === "number" && baseCard.id !== "warriorIronGuard") {
        addNumber("rageGain", 1, "闘志獲得");
    }

    if (typeof baseCard.rageBonusDamage === "number") {
        addNumber("rageBonusDamage", 4, "闘志追加ダメージ");
    }

    if (typeof baseCard.rageBonusBlock === "number") {
        addNumber("rageBonusBlock", 4, "闘志追加ブロック");
    }

    if (
        typeof baseCard.rageBonusDraw === "number" &&
        baseCard.rageBonusDraw < 3
    ) {
        addNumber("rageBonusDraw", 1, "闘志追加ドロー");
    }

    // ドロー主体のカードだけドロー枚数を増やす。
    if (
        typeof baseCard.draw === "number" &&
        !hasDamage &&
        !hasBlock &&
        typeof baseCard.energy !== "number"
    ) {
        addNumber("draw", 1, "ドロー");
    }

    // エナジー主体のカードはエナジーを伸ばす。
    if (
        typeof baseCard.energy === "number" &&
        !hasDamage &&
        !hasBlock
    ) {
        addNumber("energy", 1, "エナジー");
    }

    // 回収主体のカードは回収枚数を増やす。
    if (
        typeof baseCard.returnDiscard === "number" &&
        !hasDamage &&
        !hasBlock
    ) {
        addNumber("returnDiscard", 1, "回収");
    }

    if (typeof baseCard.damagePerDiscard === "number") {
        addNumber("damagePerDiscard", 1, "捨て札倍率");
    }

    if (typeof baseCard.blockPerDiscard === "number") {
        addNumber("blockPerDiscard", 1, "捨て札ブロック");
    }

    if (typeof baseCard.discardScalingCap === "number") {
        addNumber("discardScalingCap", 3, "上限");
    }

    if (typeof baseCard.nextTurnEnergyBonus === "number") {
        addNumber("nextTurnEnergyBonus", 1, "次ターンエナジー");
    }

    if (typeof baseCard.selfDamage === "number" && baseCard.selfDamage > 0) {
        upgraded.selfDamage = Math.max(0, baseCard.selfDamage - 1);
        notes.push("自傷-1");
    }

    // 主効果を拾えなかったカードはコスト軽減で必ず強化感を出す。
    if (notes.length === 0 && baseCard.cost > 0) {
        upgraded.cost = Math.max(0, baseCard.cost - 1);
        notes.push("コスト-1");
    }

    // 0コストかつ特殊効果のみのカードにも最低限の強化を用意。
    if (notes.length === 0 && baseCard.exhaust) {
        upgraded.exhaust = false;
        notes.push("消滅しない");
    }

    if (notes.length === 0) {
        notes.push("効果を強化");
    }

    upgraded.upgradeSummary = notes.join(" / ");
    upgraded.description = `${baseCard.description} 【強化：${upgraded.upgradeSummary}】`;

    return upgraded;
}

function isUpgradedCardId(cardId) {
    return typeof cardId === "string" && cardId.endsWith("__up");
}

function getBaseCardId(cardId) {
    if (!isUpgradedCardId(cardId)) return cardId;
    return cardId.slice(0, -4);
}

function getUpgradedCardId(cardId) {
    const baseId = getBaseCardId(cardId);
    const upgradedId = `${baseId}__up`;
    return cards[upgradedId] ? upgradedId : null;
}

// v157: カード単体の威力基準。装備・敵の状態異常など外部補正は別扱い。
// 強化前後、連撃合計、闘志、魔力消費、捨て札等の固有追加効果を合算する。
function getCardIntrinsicDamageLimit(card) {
    const hits = Math.max(1, card.hits || 1);
    const manaBonus = card.manaSpell ? (card.aoe ? 14 : Math.max(12, card.damage || 0)) : 0;
    const chainBonus = card.element === "lightning" ? 6 : 0;
    return (card.damage || 0) * hits + (card.rageBonusDamage || 0) +
        (card.damagePerDiscard || 0) * (card.discardScalingCap || 0) +
        (card.rageScalingCap || 0) + (card.chainScalingCap || 0) +
        (card.recoilScalingCap || 0) + (card.discardFinisherCap || 0) +
        manaBonus + chainBonus;
}
function getCardIntrinsicBlockLimit(card) {
    return (card.block || 0) + (card.rageBonusBlock || 0) +
        (card.blockPerDiscard || 0) * (card.discardScalingCap || 0) +
        (card.discardBonusBlock || 0) +
        (card.element === "ice" ? 8 : 0) +
        (card.manaSpell ? 12 : 0);
}
function balanceCardNumbers(card) {
    if (!card || card.special) return;
    const original = getCardIntrinsicDamageLimit(card);
    const blockOriginal = getCardIntrinsicBlockLimit(card);
    const hasDraw = (card.draw || 0) > 0 || (card.rageBonusDraw || 0) > 0 ||
        (card.drawPerConsumed || 0) > 0;
    const blockLimit = hasDraw ? 10 : 20;
    let maxDamage = 40;
    // 倍率系の追加ダメージから調整。基本効果をなるべく維持する。
    const damageExtras = ["rageBonusDamage", "rageScalingCap", "chainScalingCap",
        "recoilScalingCap", "discardFinisherCap"];
    for (const key of damageExtras) {
        const excess = getCardIntrinsicDamageLimit(card) - maxDamage;
        if (excess > 0 && (card[key] || 0) > 0) card[key] = Math.max(0, card[key] - excess);
    }
    if (getCardIntrinsicDamageLimit(card) > maxDamage && card.damagePerDiscard) {
        const cap = card.discardScalingCap || 0;
        if (cap > 0) card.damagePerDiscard = Math.max(0,
            Math.floor((card.damagePerDiscard * cap - (getCardIntrinsicDamageLimit(card) - maxDamage)) / cap));
    }
    if (getCardIntrinsicDamageLimit(card) > maxDamage && card.damage) {
        const hits = Math.max(1, card.hits || 1);
        if (card.manaSpell && !card.aoe) {
            // 雷で基礎ダメージが2回入るので基礎値20以下。
            card.damage = Math.min(card.damage, 20);
        } else {
            const remainder = getCardIntrinsicDamageLimit(card) - card.damage * hits;
            card.damage = Math.max(0, Math.floor((maxDamage - remainder) / hits));
        }
    }
    if (getCardIntrinsicDamageLimit(card) > maxDamage && card.damage) {
        card.damage = Math.max(0, card.damage - Math.ceil((getCardIntrinsicDamageLimit(card) - maxDamage) / Math.max(1, card.hits || 1)));
    }
    for (const key of ["rageBonusBlock", "discardBonusBlock"]) {
        const excess = getCardIntrinsicBlockLimit(card) - blockLimit;
        if (excess > 0 && (card[key] || 0) > 0) card[key] = Math.max(0, card[key] - excess);
    }
    if (getCardIntrinsicBlockLimit(card) > blockLimit && card.blockPerDiscard) {
        const cap = card.discardScalingCap || 0;
        if (cap > 0) card.blockPerDiscard = Math.max(0, Math.floor(
            (card.blockPerDiscard * cap - (getCardIntrinsicBlockLimit(card) - blockLimit)) / cap));
    }
    if (getCardIntrinsicBlockLimit(card) > blockLimit && card.block) {
        card.block = Math.max(0, card.block - (getCardIntrinsicBlockLimit(card) - blockLimit));
    }
    // 調整したカードは説明欄の旧数値を残さない。
    if (getCardIntrinsicDamageLimit(card) !== original || getCardIntrinsicBlockLimit(card) !== blockOriginal) {
        const parts = [];
        if (card.damage != null) parts.push(`${card.aoe ? "敵全体に" : ""}${card.damage}ダメージ${card.hits > 1 ? `×${card.hits}` : ""}`);
        if (card.rageBonusDamage) parts.push(`闘志${card.rageCost}消費で追加${card.rageBonusDamage}ダメージ`);
        if (card.damagePerDiscard) parts.push(`捨て札1枚につき+${card.damagePerDiscard}ダメージ（最大${(card.discardScalingCap || 0) * card.damagePerDiscard}）`);
        for (const [key, title] of [["rageScalingCap", "闘志"], ["chainScalingCap", "連鎖"],
            ["recoilScalingCap", "反動"], ["discardFinisherCap", "捨て札"]]) {
            if (card[key]) parts.push(`${title}による追加ダメージ上限+${card[key]}`);
        }
        if (card.block != null) parts.push(`${card.block}ブロック`);
        if (card.rageBonusBlock) parts.push(`闘志${card.rageCost}消費で追加${card.rageBonusBlock}ブロック`);
        if (card.discardBonusBlock) parts.push(`手札を捨てた場合+${card.discardBonusBlock}ブロック`);
        if (card.blockPerDiscard) parts.push(`捨て札1枚につき+${card.blockPerDiscard}ブロック（最大${(card.discardScalingCap || 0) * card.blockPerDiscard}）`);
        if (card.manaSpell) parts.push(`魔力${card.manaCost}消費で属性効果（炎+${card.aoe ? 14 : 12} / 雷${card.aoe ? "+6・1ドロー" : "2連撃"} / 氷+12ブロック）`);
        if (card.draw) parts.push(`${card.draw}枚ドロー`);
        if (card.rageBonusDraw) parts.push(`闘志条件で${card.rageBonusDraw}枚ドロー`);
        if (card.rageGain) parts.push(`闘志+${card.rageGain}`);
        if (card.energy) parts.push(`エナジー+${card.energy}`);
        if (card.nextTurnEnergyPenalty) parts.push(`次ターンエナジー-${card.nextTurnEnergyPenalty}`);
        if (card.selfDamage) parts.push(`自傷${card.selfDamage}`);
        if (card.returnDiscard) parts.push(`捨て札を${card.returnDiscard}枚回収`);
        if (card.exhaust) parts.push("消滅");
        card.description = parts.join("。") + "。";
    }
}
// v167: 新火力曲線。レアリティだけでなくコスト・多段・全体・追加効果を考慮。
// 基本カードを先に調整し、その後、強化版にも同じ40上限判定を適用する。
function rebalanceCardV167(card) {
    if (!card || card.special) return;
    const was = {damage: card.damage, rageCost: card.rageCost, rageBonusDamage: card.rageBonusDamage};
    if (typeof card.rageCost === "number" && card.rageCost > 7) {
        card.rageCost = Math.min(7, Math.round(card.rageCost * 0.47));
    }
    // 威力予算: 通常戦の短期決着を妨げず、上位カードに伸び代を残す。
    if (typeof card.damage === "number") {
        const budget = card.rarity === "legendary" ? 38 : card.rarity === "epic" ? 25 : 16;
        const costBudget = card.cost <= 0 ? 6 : card.cost === 1 ?
            (card.rarity === "legendary" ? 18 : card.rarity === "epic" ? 13 : 9) :
            card.cost === 2 ? (card.rarity === "legendary" ? 29 : card.rarity === "epic" ? 21 : 14) : budget;
        let allowed = Math.min(budget, costBudget);
        if (card.aoe) allowed = Math.max(5, Math.floor(allowed * .82));
        if ((card.draw || 0) > 0 || (card.block || 0) > 0 || (card.energy || 0) > 0) allowed = Math.max(4, allowed - 3);
        if (card.selfDamage || card.nextTurnEnergyPenalty) allowed = Math.min(budget, allowed + 3);
        const hits = Math.max(1,card.hits || 1);
        // Total hits and conditional bonuses count against the same budget.
        const extras = (card.rageBonusDamage || 0) +
            (card.damagePerDiscard || 0) * (card.discardScalingCap || 0) +
            (card.rageScalingCap || 0) + (card.chainScalingCap || 0) +
            (card.recoilScalingCap || 0) + (card.discardFinisherCap || 0);
        const mandatory = Math.max(card.aoe ? 5 : 3, Math.floor(allowed * .48));
        const baseAllowed = Math.max(mandatory, Math.floor((allowed - extras) / hits));
        card.damage = Math.max(1, Math.min(card.damage, Math.max(card.aoe ? 5 : 3,baseAllowed)));
        // Reduce outsized conditional attack bonuses only after preserving a useful base hit.
        const remaining = Math.max(0, allowed - card.damage * hits);
        for (const key of ["rageBonusDamage", "rageScalingCap", "chainScalingCap", "recoilScalingCap", "discardFinisherCap"]) {
            if (typeof card[key] === "number") {
                const cut = Math.max(0, extras - remaining);
                if (cut > 0) card[key] = Math.max(0, card[key] - cut);
            }
        }
    }
    // Sync numeric labels on legacy card text; retain instructions for complex effects.
    if (was.damage !== card.damage || was.rageCost !== card.rageCost || was.rageBonusDamage !== card.rageBonusDamage) {
        let desc = card.description || "";
        if (typeof was.damage === "number" && was.damage !== card.damage) {
            desc = desc.replace(new RegExp("(?<![0-9])" + was.damage + "(?=ダメージ)", "g"), String(card.damage));
        }
        if (typeof was.rageCost === "number" && was.rageCost !== card.rageCost) {
            desc = desc.replace(new RegExp("闘志" + was.rageCost + "(?=以上|を消費|消費|が)", "g"), "闘志" + card.rageCost);
            desc = desc.replace(new RegExp("(?<![0-9])" + was.rageCost + "(?=消費)", "g"), String(card.rageCost));
        }
        if (typeof was.rageBonusDamage === "number" && was.rageBonusDamage !== card.rageBonusDamage) {
            desc = desc.replace(new RegExp("(?<![0-9])" + was.rageBonusDamage + "(?=ダメージ)", "g"), String(card.rageBonusDamage));
        }
        card.description = desc;
    }
}
Object.values(cards).forEach(rebalanceCardV167);
Object.values(cards).forEach(balanceCardNumbers);

// 既存システムが cards[cardId] を参照したまま使えるよう、
// 強化版も同じcards辞書へ追加する。
Object.values({ ...cards }).forEach(card => {
    if (!card || card.upgraded || card.special) return;
    const upgraded = createUpgradedCard(card);
    balanceCardNumbers(upgraded);
    cards[upgraded.id] = upgraded;
});


// v167: 古い保存デッキに残る heal / heal__up を非列挙エイリアスで安全に移行。
Object.defineProperty(cards, "heal", {configurable:true, enumerable:false, get:()=>cards.defend});
Object.defineProperty(cards, "heal__up", {configurable:true, enumerable:false, get:()=>cards.defend__up});

// ======================
// キャラクター別カードプール
// character未指定のカードは全キャラ共通。
// ======================

function getCardPoolForCharacter(characterId) {

    return Object.values(cards)
        .filter(card => !card.upgraded)
        .filter(card => !card.special)
        .filter(card =>
            !card.character ||
            card.character === characterId
        )
        .filter(card => {
            if (!card.unlockSkill) {
                return true;
            }

            return (
                typeof isSkillUnlockedForCharacter === "function" &&
                isSkillUnlockedForCharacter(
                    card.unlockSkill,
                    card.character || characterId
                )
            );
        });
}
