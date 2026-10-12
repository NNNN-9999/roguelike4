// ======================
// SkillManager.js v23
// 段階式・独立二択スキルツリー
// ======================

const SKILL_SAVE_KEY = "cardRoguelike_skillTree";
const SKILL_CHARACTERS = ["warrior", "wizard", "machinist", "gravekeeper", "common"];

let skillTreeCharacter = "warrior";
let skillState = loadSkillState();

let skillProfessionRoute = null;

const PROFESSION_ROUTES = {
    warrior: {
        berserk: {
            entry: "warrior_berserk_1",
            name: "バーサーカー",
            icon: "🔥",
            tagline: "闘志を燃やして攻撃へ変える",
            summary: "闘志を溜め込むより、獲得→消費→再加速を繰り返す攻撃職。",
            strengths: "瞬間火力 / 闘志消費 / 攻撃継続",
            difficulty: "★★☆",
            finalClasses: ["血戦鬼", "破壊王"],
            nodeIds: [
                "warrior_berserk_1",
                "warrior_unlock_1",
                "warrior_berserk_alt",
                "warrior_unlock_2",
                "warrior_berserk_cap",
                "warrior_rule_rage",
                "warrior_berserk_step_7",
                "warrior_berserk_step_8",
                "warrior_berserk_step_9",
                "warrior_berserk_step_10"
            ]
        },
        fortress: {
            entry: "warrior_fortress_1",
            name: "バスティオン",
            icon: "🛡️",
            tagline: "守りを次のターンへ繋ぐ",
            summary: "ブロックを使い捨てず、維持・変換しながら戦線を崩さない防御職。",
            strengths: "防御 / 長期戦 / 反撃準備",
            difficulty: "★☆☆",
            finalClasses: ["聖壁騎士", "反攻騎士"],
            nodeIds: [
                "warrior_fortress_1",
                "warrior_mastery",
                "warrior_fortress_alt",
                "warrior_unlock_3",
                "warrior_fortress_cap",
                "warrior_rule_guard",
                "warrior_fortress_step_7",
                "warrior_fortress_step_8",
                "warrior_fortress_step_9",
                "warrior_fortress_step_10"
            ]
        },
        combo: {
            entry: "warrior_combo_1",
            name: "スレイヤー",
            icon: "⚔️",
            tagline: "手数を重ねて加速する",
            summary: "低～中コストのカードを連続使用し、1ターンの行動数を火力へ変える連撃職。",
            strengths: "連撃 / 手札回転 / コンボ",
            difficulty: "★★★",
            finalClasses: ["剣聖", "連舞士"],
            nodeIds: [
                "warrior_combo_1",
                "warrior_combo_2",
                "warrior_combo_alt",
                "warrior_combo_bridge",
                "warrior_legend",
                "warrior_rule_combo",
                "warrior_combo_step_7",
                "warrior_combo_step_8",
                "warrior_combo_step_9",
                "warrior_combo_step_10"
            ]
        }
    },

    wizard: {
        chain: {
            entry: "wizard_chain_1",
            name: "元素術師",
            icon: "🔺",
            tagline: "三属性を連鎖させる",
            summary: "炎→雷→氷の属性連鎖を高頻度で起こし、複数の追加効果を連続で得る職業。",
            strengths: "属性連鎖 / エナジー / 柔軟性",
            difficulty: "★★☆",
            finalClasses: ["三相賢者", "元素破壊師"],
            nodeIds: [
                "wizard_chain_1","wizard_unlock_1","wizard_chain_alt",
                "wizard_unlock_3","wizard_chain_cap","wizard_rule_chain",
                "wizard_chain_step_7","wizard_chain_step_8",
                "wizard_chain_step_9","wizard_chain_step_10"
            ]
        },
        focus: {
            entry: "wizard_focus_1",
            name: "氷晶術師",
            icon: "❄️",
            tagline: "属性を揃えて盤面を固める",
            summary: "属性を安定して揃え、防御・ドローを積み重ねながら崩れにくい盤面を作る職業。",
            strengths: "安定 / 防御 / 同属性",
            difficulty: "★☆☆",
            finalClasses: ["永久氷冠", "雷氷導師"],
            nodeIds: [
                "wizard_focus_1","wizard_unlock_2","wizard_focus_alt",
                "wizard_focus_bridge","wizard_focus_cap","wizard_rule_repeat",
                "wizard_focus_step_7","wizard_focus_step_8",
                "wizard_focus_step_9","wizard_focus_step_10"
            ]
        },
        overflow: {
            entry: "wizard_overflow_1",
            name: "大魔導士",
            icon: "🌌",
            tagline: "重い魔法を圧倒的出力へ",
            summary: "高コスト魔法を中心に構築し、少ない行動で大きな成果を狙う高出力職。",
            strengths: "高コスト / 爆発力 / 魔法火力",
            difficulty: "★★★",
            finalClasses: ["星界魔導師", "禁呪王"],
            nodeIds: [
                "wizard_overflow_1","wizard_mastery","wizard_overflow_alt",
                "wizard_overflow_3","wizard_legend","wizard_rule_highcost",
                "wizard_overflow_step_7","wizard_overflow_step_8",
                "wizard_overflow_step_9","wizard_overflow_step_10"
            ]
        }
    },

    machinist: {
        generator: {
            entry: "machinist_generator_1",
            name: "動力技師",
            icon: "⚡",
            tagline: "エナジーを循環させる",
            summary: "発電と消費を繰り返し、エナジーの余剰を手数へ変える循環型の職業。",
            strengths: "発電 / 手数 / 循環",
            difficulty: "★★☆",
            finalClasses: ["永久機関士", "電装統括官"],
            nodeIds: [
                "machinist_generator_1","machinist_mastery","machinist_generator_alt",
                "machinist_generator_bridge","machinist_generator_cap","machinist_rule_generator",
                "machinist_generator_step_7","machinist_generator_step_8",
                "machinist_generator_step_9","machinist_generator_step_10"
            ]
        },
        artillery: {
            entry: "machinist_artillery_1",
            name: "砲撃士",
            icon: "💥",
            tagline: "重兵装を主砲にする",
            summary: "高コスト兵装を中心に据え、反動込みで一撃の価値を最大化する火力職。",
            strengths: "高火力 / 重兵装 / ボス戦",
            difficulty: "★★☆",
            finalClasses: ["要塞砲兵", "殲滅機関士"],
            nodeIds: [
                "machinist_artillery_1","machinist_unlock_1","machinist_artillery_alt",
                "machinist_artillery_4","machinist_legend","machinist_rule_artillery",
                "machinist_artillery_step_7","machinist_artillery_step_8",
                "machinist_artillery_step_9","machinist_artillery_step_10"
            ]
        },
        stable: {
            entry: "machinist_stable_1",
            name: "制御技師",
            icon: "⚙️",
            tagline: "反動を制御して出力を保つ",
            summary: "自傷・エナジー減少などの代償を抑え、危険なカードを安定して運用する職業。",
            strengths: "制御 / 安定 / 反動軽減",
            difficulty: "★☆☆",
            finalClasses: ["装甲技師", "限界制御官"],
            nodeIds: [
                "machinist_stable_1","machinist_unlock_2","machinist_stable_alt",
                "machinist_unlock_3","machinist_stable_cap","machinist_rule_stable",
                "machinist_stable_step_7","machinist_stable_step_8",
                "machinist_stable_step_9","machinist_stable_step_10"
            ]
        }
    },

    gravekeeper: {
        discard: {
            entry: "gravekeeper_discard_1",
            name: "墓術師",
            icon: "🪦",
            tagline: "墓地を肥やして力にする",
            summary: "捨て札の枚数そのものを資源にし、墓地が厚くなるほどカードを強くする職業。",
            strengths: "捨て札 / 成長 / 火力",
            difficulty: "★★☆",
            finalClasses: ["墓王", "灰術師"],
            nodeIds: [
                "gravekeeper_discard_1","gravekeeper_unlock_1","gravekeeper_discard_alt",
                "gravekeeper_unlock_3","gravekeeper_discard_cap","gravekeeper_rule_discard",
                "gravekeeper_discard_step_7","gravekeeper_discard_step_8",
                "gravekeeper_discard_step_9","gravekeeper_discard_step_10"
            ]
        },
        recovery: {
            entry: "gravekeeper_recovery_1",
            name: "魂還師",
            icon: "🕯️",
            tagline: "墓地からカードを呼び戻す",
            summary: "捨て札からカードを回収し、同じカードを再利用して循環を作る職業。",
            strengths: "回収 / 再利用 / 防御",
            difficulty: "★★★",
            finalClasses: ["還魂導師", "死霊司祭"],
            nodeIds: [
                "gravekeeper_recovery_1","gravekeeper_unlock_2","gravekeeper_recovery_alt",
                "gravekeeper_recovery_bridge","gravekeeper_recovery_cap","gravekeeper_rule_recovery",
                "gravekeeper_recovery_step_7","gravekeeper_recovery_step_8",
                "gravekeeper_recovery_step_9","gravekeeper_recovery_step_10"
            ]
        },
        funeral: {
            entry: "gravekeeper_funeral_1",
            name: "葬送師",
            icon: "🔔",
            tagline: "消滅と葬送で墓地を整える",
            summary: "カードを墓地へ送り、必要なものだけを残して大技へ繋ぐ計画型の職業。",
            strengths: "消滅 / 墓地操作 / 大技",
            difficulty: "★★☆",
            finalClasses: ["終葬官", "骨堂司祭"],
            nodeIds: [
                "gravekeeper_funeral_1","gravekeeper_mastery","gravekeeper_funeral_alt",
                "gravekeeper_funeral_4","gravekeeper_legend","gravekeeper_rule_funeral",
                "gravekeeper_funeral_step_7","gravekeeper_funeral_step_8",
                "gravekeeper_funeral_step_9","gravekeeper_funeral_step_10"
            ]
        }
    }
};


function createEmptyUnlockedState() {
    const state = {};

    SKILL_CHARACTERS.forEach(characterId => {
        state[characterId] = [
            skillTrees[characterId].startNode
        ];
    });

    return state;
}


function createEmptyPointState() {
    return {
        warrior: 0,
        wizard: 0,
        machinist: 0,
        gravekeeper: 0,
        common: 0
    };
}


function getChoiceGroupMembers(groupId) {
    if (!groupId) {
        return [];
    }

    return Object.values(skillTree)
        .filter(node => node.choiceGroup === groupId);
}


function normalizeChoiceConflicts(characterId, nodeIds) {
    const valid = [...new Set(nodeIds)];
    const groups = new Map();

    valid.forEach(nodeId => {
        const node = skillTree[nodeId];

        if (
            !node ||
            node.character !== characterId ||
            !node.choiceGroup
        ) {
            return;
        }

        if (!groups.has(node.choiceGroup)) {
            groups.set(node.choiceGroup, []);
        }

        groups.get(node.choiceGroup).push(nodeId);
    });

    const remove = new Set();

    groups.forEach(ids => {
        if (ids.length <= 1) {
            return;
        }

        // v22.1以前の一本道セーブでは、v23で二択になる
        // 両ノードが取得済みのことがある。
        // よりコストの高い（旧ツリーで深い）側を残す。
        const keep = [...ids].sort((a, b) => {
            const costDiff =
                (skillTree[b]?.cost || 0) -
                (skillTree[a]?.cost || 0);

            if (costDiff !== 0) {
                return costDiff;
            }

            return ids.indexOf(b) - ids.indexOf(a);
        })[0];

        ids.forEach(id => {
            if (id !== keep) {
                remove.add(id);
            }
        });
    });

    return valid.filter(id => !remove.has(id));
}


function loadSkillState() {
    try {
        const raw = localStorage.getItem(SKILL_SAVE_KEY);

        if (!raw) {
            return {
                pointsByCharacter: createEmptyPointState(),
                unlockedByCharacter: createEmptyUnlockedState()
            };
        }

        const parsed = JSON.parse(raw);
        const pointsByCharacter = createEmptyPointState();
        const unlockedByCharacter = createEmptyUnlockedState();

        SKILL_CHARACTERS.forEach(characterId => {
            if (
                parsed.pointsByCharacter &&
                Number.isFinite(
                    Number(parsed.pointsByCharacter[characterId])
                )
            ) {
                pointsByCharacter[characterId] =
                    Math.max(
                        0,
                        Number(parsed.pointsByCharacter[characterId])
                    );
            } else if (
                Number.isFinite(
                    Number(parsed.totalPoints)
                )
            ) {
                pointsByCharacter[characterId] =
                    Math.max(
                        0,
                        Number(parsed.totalPoints)
                    );
            }

            const oldUnlocked =
                Array.isArray(
                    parsed.unlockedByCharacter?.[characterId]
                )
                    ? parsed.unlockedByCharacter[characterId]
                    : [];

            const validUnlocked =
                oldUnlocked.filter(nodeId =>
                    Boolean(skillTree[nodeId]) &&
                    skillTree[nodeId].character === characterId
                );

            const startId =
                skillTrees[characterId].startNode;

            unlockedByCharacter[characterId] =
                normalizeChoiceConflicts(
                    characterId,
                    [
                        startId,
                        ...validUnlocked.filter(
                            nodeId => nodeId !== startId
                        )
                    ]
                );
        });

        return {
            pointsByCharacter,
            unlockedByCharacter
        };

    } catch (error) {
        console.error(
            "スキルツリーのロードに失敗しました",
            error
        );

        return {
            pointsByCharacter: createEmptyPointState(),
            unlockedByCharacter: createEmptyUnlockedState()
        };
    }
}


function saveSkillState() {
    localStorage.setItem(
        SKILL_SAVE_KEY,
        JSON.stringify(skillState)
    );
}


// ======================
// SP
// ======================

function awardSkillPoint(
    amount = 1,
    characterId = selectedCharacter || skillTreeCharacter
) {
    if (!SKILL_CHARACTERS.includes(characterId) || characterId === "common") {
        return;
    }

    const earned = Math.max(0, amount);

    skillState.pointsByCharacter[characterId] =
        (skillState.pointsByCharacter[characterId] || 0) + earned;

    // v131: 共通ツリーを廃止し、SPは使用キャラクターだけに蓄積。
    saveSkillState();
}


function getEarnedSkillPoints(
    characterId = skillTreeCharacter
) {
    return Math.max(
        0,
        skillState.pointsByCharacter[characterId] || 0
    );
}


function getUnlockedForCharacter(characterId) {
    return (
        skillState.unlockedByCharacter[characterId] ||
        []
    );
}


function isSkillUnlockedForCharacter(
    nodeId,
    characterId
) {
    return getUnlockedForCharacter(characterId)
        .includes(nodeId);
}


function getUsedSkillPoints(
    characterId = skillTreeCharacter
) {
    return getUnlockedForCharacter(characterId)
        .reduce((total, nodeId) => {
            return total + (skillTree[nodeId]?.cost || 0);
        }, 0);
}


function getAvailableSkillPoints(
    characterId = skillTreeCharacter
) {
    return Math.max(
        0,
        getEarnedSkillPoints(characterId) -
        getUsedSkillPoints(characterId)
    );
}


// v23も恒久ステータス強化はなし。
function getSkillBonusTotals() {
    const bonuses = {
        maxHp: 0, startGold: 0, battleGoldBonus: 0, extraRewardChoice: 0,
        startEnergy: 0, startBlock: 0, extraDraw: 0, victoryHeal: 0, maxRage: 0,
        chainDamageBonus: 0, chainBlockBonus: 0, recoveredCardBlock: 0,
        firstRecoveryEnergy: 0, secondRecoveryDraw: 0, startDiscard: 0,
        fifthCardDiscount: 0, firstHighMagicDiscount: 0, lowHpAttackBonus: 0,
        thirdCardAttackBonus: 0, lateComboAttackBonus: 0, attackCardBlock: 0,
        sameElementBlock: 0, sameElementAttackBonus: 0, sameElementFirstDraw: 0,
        highCostMagicAttackBonus: 0, highCostAttackBonus: 0, veryHighCostAttackBonus: 0,
        firstHeavyAttackBonus: 0, heavyAttackBlock: 0, discardScalingBonus: 0,
        discardThresholdAttackBonus: 0, deepDiscardAttackBonus: 0,
        discardThresholdSkillBlock: 0, rageSpendAttackBonus: 0, firstChainEnergy: 0,
        skillBlockBonus: 0, energySkillBlock: 0, thirdSameElementPower: 0,
        firstHighMagicDraw: 0, firstEnergyGainBonus: 0, fourthCardDraw: 0,
        selfDamageReduction: 0, retainBlockFraction: 0, energyPenaltyReduction: 0,
        penaltyToBlock: 0, zeroEnergyNextTurn: 0, discardTurnEnergy: 0
    };

    const characterId = selectedCharacter;
    if (!characterId || !SKILL_CHARACTERS.includes(characterId)) {
        return bonuses;
    }

    getUnlockedForCharacter(characterId).forEach(nodeId => {
        const effect = skillTree[nodeId]?.effect || {};
        Object.keys(bonuses).forEach(key => {
            if (typeof effect[key] === "number") {
                bonuses[key] += effect[key];
            }
        });
    });

    return bonuses;
}


// ======================
// Relic unlock compatibility
// ======================

function isRelicUnlockedForCharacter(
    relic,
    characterId
) {
    // v131: レリックはスキルツリー解放から切り離し、最初から全開放。
    return Boolean(relic);
}


// ======================
// Node state
// ======================

function isNodeUnlocked(
    nodeId,
    characterId = skillTreeCharacter
) {
    return isSkillUnlockedForCharacter(
        nodeId,
        characterId
    );
}


function isChoiceLocked(
    nodeId,
    characterId = skillTreeCharacter
) {
    const node = skillTree[nodeId];

    if (!node?.choiceGroup) {
        return false;
    }

    return getChoiceGroupMembers(node.choiceGroup)
        .some(other =>
            other.id !== nodeId &&
            isNodeUnlocked(other.id, characterId)
        );
}


function areRequirementsMet(
    nodeId,
    characterId = skillTreeCharacter
) {
    const node = skillTree[nodeId];

    if (
        !node ||
        node.character !== characterId
    ) {
        return false;
    }

    const allRequirementsMet =
        (node.requires || [])
            .every(requiredId =>
                isNodeUnlocked(
                    requiredId,
                    characterId
                )
            );

    const anyRequirements =
        node.requiresAny || [];

    const anyRequirementMet =
        anyRequirements.length === 0 ||
        anyRequirements.some(requiredId =>
            isNodeUnlocked(
                requiredId,
                characterId
            )
        );

    return (
        allRequirementsMet &&
        anyRequirementMet
    );
}


function isNodeAvailable(
    nodeId,
    characterId = skillTreeCharacter
) {
    const node = skillTree[nodeId];

    if (
        !node ||
        node.character !== characterId ||
        isNodeUnlocked(nodeId, characterId) ||
        isChoiceLocked(nodeId, characterId)
    ) {
        return false;
    }

    return (
        areRequirementsMet(
            nodeId,
            characterId
        ) &&
        getAvailableSkillPoints(characterId) >= node.cost
    );
}


function unlockNode(nodeId) {
    if (
        !isNodeAvailable(
            nodeId,
            skillTreeCharacter
        )
    ) {
        return;
    }

    skillState
        .unlockedByCharacter[skillTreeCharacter]
        .push(nodeId);

    saveSkillState();
    closeSkillNodeModal();
    renderSkillTree();
}



// ======================
// v58: まとめて解放
// 一本道は一括取得し、requiresAny の未選択分岐に来たらそこで選択を求める。
// ======================

function getNodeCostForBatch(nodeId) {
    return Math.max(0, Number(skillTree[nodeId]?.cost || 0));
}



// ======================
// v62: 戦士のまとめて取得は、ツリーの見た目どおり
// 3ルート選択 → 1回目の二択 → 2回目の二択
// の順で固定して処理する。
// ======================
function getWarriorBatchRouteInfo(targetId) {
    const routes = {
        berserk: {
            entry: "warrior_berserk_1",
            first: [
                "warrior_unlock_1",
                "warrior_berserk_alt"
            ],
            second: [
                "warrior_unlock_2",
                "warrior_berserk_cap"
            ],
            deep: [
                "warrior_rule_rage",
                "warrior_berserk_step_7",
                "warrior_berserk_step_8",
                "warrior_berserk_step_9",
                "warrior_berserk_step_10"
            ]
        },
        fortress: {
            entry: "warrior_fortress_1",
            first: [
                "warrior_mastery",
                "warrior_fortress_alt"
            ],
            second: [
                "warrior_unlock_3",
                "warrior_fortress_cap"
            ],
            deep: [
                "warrior_rule_guard",
                "warrior_fortress_step_7",
                "warrior_fortress_step_8",
                "warrior_fortress_step_9",
                "warrior_fortress_step_10"
            ]
        },
        combo: {
            entry: "warrior_combo_1",
            first: [
                "warrior_combo_2",
                "warrior_combo_alt"
            ],
            second: [
                "warrior_combo_bridge",
                "warrior_legend"
            ],
            deep: [
                "warrior_rule_combo",
                "warrior_combo_step_7",
                "warrior_combo_step_8",
                "warrior_combo_step_9",
                "warrior_combo_step_10"
            ]
        }
    };

    for (const [routeId, route] of Object.entries(routes)) {
        const allIds = [
            route.entry,
            ...route.first,
            ...route.second,
            ...route.deep
        ];

        if (allIds.includes(targetId)) {
            return {
                routeId,
                ...route
            };
        }
    }

    return null;
}


function getWarriorBatchChoice(
    targetId,
    characterId = skillTreeCharacter
) {
    if (characterId !== "warrior") {
        return null;
    }

    const route =
        getWarriorBatchRouteInfo(targetId);

    if (!route) {
        return null;
    }

    const mainEntries = [
        "warrior_berserk_1",
        "warrior_fortress_1",
        "warrior_combo_1"
    ];

    const selectedMain =
        mainEntries.find(id =>
            isNodeUnlocked(id, characterId)
        );

    // v63:
    // まとめて取得先が特定ルートの中にあるなら、
    // 最初の3択を改めて出さず、そのルート入口を自動取得する。
    // 入口そのものをクリックした時だけ通常の取得処理に任せる。
    if (!selectedMain && targetId === route.entry) {
        return null;
    }

    if (!selectedMain) {
        return {
            targetId,
            autoEntry: route.entry
        };
    }

    // すでに別ルートを選択済みなら、その先は取得不可。
    if (selectedMain !== route.entry) {
        return {
            blocked: true,
            reason:
                "別のメインルートを選択済みです。リセットすると選び直せます。"
        };
    }

    const firstChosen =
        route.first.some(id =>
            isNodeUnlocked(id, characterId)
        );

    const targetNeedsFirst =
        route.second.includes(targetId) ||
        route.deep.includes(targetId);

    if (
        targetNeedsFirst &&
        !firstChosen
    ) {
        return {
            targetId,
            title: "1回目の分岐",
            description:
                "このルート内の二択です。どちらか1つを選ぶと、もう片方は取得できなくなります。",
            candidates: route.first
        };
    }

    const secondChosen =
        route.second.some(id =>
            isNodeUnlocked(id, characterId)
        );

    const targetNeedsSecond =
        route.deep.includes(targetId);

    if (
        targetNeedsSecond &&
        !secondChosen
    ) {
        return {
            targetId,
            title: "2回目の分岐",
            description:
                "さらに進むための二択です。ここでもどちらか1つを選択します。",
            candidates: route.second
        };
    }

    return null;
}


function buildBatchUnlockPlan(
    targetId,
    characterId = skillTreeCharacter,
    visiting = new Set()
) {
    if (isNodeUnlocked(targetId, characterId)) {
        return { nodes: [], choice: null, blocked: false };
    }

    if (visiting.has(targetId)) {
        return { nodes: [], choice: null, blocked: true };
    }

    const node = skillTree[targetId];

    if (
        !node ||
        node.character !== characterId ||
        isChoiceLocked(targetId, characterId)
    ) {
        return { nodes: [], choice: null, blocked: true };
    }

    const nextVisiting = new Set(visiting);
    nextVisiting.add(targetId);

    const nodes = [];

    for (const requiredId of (node.requires || [])) {
        const result =
            buildBatchUnlockPlan(
                requiredId,
                characterId,
                nextVisiting
            );

        if (result.blocked || result.choice) {
            return {
                nodes: [...nodes, ...(result.nodes || [])],
                choice: result.choice || null,
                blocked: result.blocked
            };
        }

        nodes.push(...result.nodes);
    }

    const anyRequirements = node.requiresAny || [];

    if (anyRequirements.length > 0) {
        const alreadyChosen =
            anyRequirements.find(requiredId =>
                isNodeUnlocked(requiredId, characterId)
            );

        if (!alreadyChosen) {
            const candidates =
                anyRequirements
                    .filter(requiredId => {
                        const candidate = skillTree[requiredId];

                        return (
                            candidate &&
                            candidate.character === characterId &&
                            !isChoiceLocked(requiredId, characterId)
                        );
                    });

            if (candidates.length === 0) {
                return { nodes, choice: null, blocked: true };
            }

            if (candidates.length > 1) {
                return {
                    nodes,
                    choice: {
                        targetId,
                        candidates
                    },
                    blocked: false
                };
            }

            const result =
                buildBatchUnlockPlan(
                    candidates[0],
                    characterId,
                    nextVisiting
                );

            if (result.blocked || result.choice) {
                return {
                    nodes: [...nodes, ...(result.nodes || [])],
                    choice: result.choice || null,
                    blocked: result.blocked
                };
            }

            nodes.push(...result.nodes);
        }
    }

    if (!nodes.includes(targetId)) {
        nodes.push(targetId);
    }

    return {
        nodes: [...new Set(nodes)],
        choice: null,
        blocked: false
    };
}


function getBatchUnlockCost(nodeIds) {
    return (nodeIds || [])
        .filter(nodeId => !isNodeUnlocked(nodeId))
        .reduce(
            (total, nodeId) =>
                total + getNodeCostForBatch(nodeId),
            0
        );
}


function unlockBatchNodesSilently(nodeIds) {
    for (const nodeId of (nodeIds || [])) {
        if (isNodeUnlocked(nodeId)) {
            continue;
        }

        if (!isNodeAvailable(nodeId)) {
            return false;
        }

        skillState
            .unlockedByCharacter[skillTreeCharacter]
            .push(nodeId);
    }

    saveSkillState();
    return true;
}


function showBatchChoiceStep(
    targetId,
    choice
) {
    const modal =
        ensureSkillNodeModal();

    const content =
        modal.querySelector(
            "#skill-node-modal-content"
        );

    const candidateButtons =
        (choice?.candidates || [])
            .map(candidateId => {
                const candidate =
                    skillTree[candidateId];

                if (!candidate) {
                    return "";
                }

                return `
                    <button
                        type="button"
                        class="skill-batch-choice-button"
                        data-choice-node="${candidateId}"
                    >
                        <strong>
                            ${candidate.icon || "◆"} ${candidate.name}
                        </strong>
                        <span class="skill-batch-node-summary">
                            ${candidate.description || ""}
                        </span>
                        <div class="skill-batch-unlock-preview">
                            ${getSkillUnlockPreview(candidate)}
                        </div>
                        <small>
                            ${candidate.cost || 0} SP
                        </small>
                    </button>
                `;
            })
            .join("");

    content.innerHTML = `
        <div class="skill-modal-kicker">
            ROUTE CHOICE
        </div>

        <div class="skill-modal-icon">
            ◇
        </div>

        <h3>${choice?.title || "途中のルートを選択"}</h3>

        <div class="skill-modal-choice">
            ${
                choice?.description ||
                "ここから先へまとめて進むには、どちらか1つを選択してください。"
            }
        </div>

        <div class="skill-batch-help">
            <strong>まとめて取得について</strong>
            <span>
                目的のノードまでの一本道を自動で取得します。
                途中に分岐がある場合は、ここで選択してから先へ進みます。
                選択した側だけが取得されます。
            </span>
        </div>

        <div class="skill-batch-choice-list">
            ${candidateButtons}
        </div>
    `;

    content
        .querySelectorAll(
            "[data-choice-node]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const candidateId =
                        button.dataset.choiceNode;

                    const candidatePlan =
                        buildBatchUnlockPlan(
                            candidateId
                        );

                    if (candidatePlan.blocked) {
                        return;
                    }

                    // v59: さらに手前に未選択分岐がある場合も
                    // その分岐を続けて表示する。
                    if (candidatePlan.choice) {
                        const prefixCost =
                            getBatchUnlockCost(
                                candidatePlan.nodes
                            );

                        if (
                            prefixCost > 0 &&
                            getAvailableSkillPoints() <
                            prefixCost
                        ) {
                            button.classList.add(
                                "need-points"
                            );
                            return;
                        }

                        if (
                            prefixCost > 0 &&
                            !unlockBatchNodesSilently(
                                candidatePlan.nodes
                            )
                        ) {
                            return;
                        }

                        showBatchChoiceStep(
                            targetId,
                            candidatePlan.choice
                        );
                        return;
                    }

                    const candidateCost =
                        getBatchUnlockCost(
                            candidatePlan.nodes
                        );

                    if (
                        getAvailableSkillPoints() <
                        candidateCost
                    ) {
                        button.classList.add(
                            "need-points"
                        );
                        return;
                    }

                    if (
                        !unlockBatchNodesSilently(
                            candidatePlan.nodes
                        )
                    ) {
                        return;
                    }

                    continueBatchUnlock(
                        targetId
                    );
                }
            );
        });

    modal.classList.remove("hidden");
}


function continueBatchUnlock(targetId) {
    let warriorChoice =
        getWarriorBatchChoice(
            targetId
        );

    if (warriorChoice?.blocked) {
        return;
    }

    if (warriorChoice?.autoEntry) {
        const entryId =
            warriorChoice.autoEntry;

        if (!isNodeUnlocked(entryId)) {
            const entryCost =
                getNodeCostForBatch(entryId);

            if (
                getAvailableSkillPoints() <
                entryCost
            ) {
                return;
            }

            if (
                !unlockBatchNodesSilently(
                    [entryId]
                )
            ) {
                return;
            }
        }

        warriorChoice =
            getWarriorBatchChoice(
                targetId
            );
    }

    if (
        warriorChoice &&
        warriorChoice.candidates?.length
    ) {
        showBatchChoiceStep(
            targetId,
            warriorChoice
        );
        return;
    }

    const plan =
        buildBatchUnlockPlan(targetId);

    if (plan.blocked) {
        return;
    }

    const prefixNodes =
        plan.choice
            ? plan.nodes
            : plan.nodes;

    const prefixCost =
        getBatchUnlockCost(
            prefixNodes
        );

    if (prefixCost > 0) {
        if (
            getAvailableSkillPoints() <
            prefixCost
        ) {
            return;
        }

        if (
            !unlockBatchNodesSilently(
                prefixNodes
            )
        ) {
            return;
        }
    }

    if (plan.choice) {
        showBatchChoiceStep(
            targetId,
            plan.choice
        );
        return;
    }

    saveSkillState();
    closeSkillNodeModal();
    renderSkillTree();
}


function startBatchUnlock(targetId) {
    const plan =
        buildBatchUnlockPlan(targetId);

    if (plan.blocked) {
        return;
    }

    const totalCost =
        getBatchUnlockCost(
            plan.nodes
        );

    // 分岐までの一本道すらSP不足なら何もしない。
    if (
        totalCost > 0 &&
        getAvailableSkillPoints() < totalCost &&
        !plan.choice
    ) {
        return;
    }

    continueBatchUnlock(targetId);
}


function resetSkillTree() {
    const startId =
        skillTrees[skillTreeCharacter].startNode;

    const unlocked =
        getUnlockedForCharacter(
            skillTreeCharacter
        );

    if (
        unlocked.length <= 1 &&
        unlocked.includes(startId)
    ) {
        return;
    }

    const name =
        skillTrees[skillTreeCharacter]?.name ||
        "このキャラクター";

    if (
        !confirm(
            `${name}の転職・職業ツリーをリセットしますか？\n使用したSPはこのキャラへ返還され、別の職業を選び直せます。`
        )
    ) {
        return;
    }

    skillState.unlockedByCharacter[
        skillTreeCharacter
    ] = [startId];

    saveSkillState();
    closeSkillNodeModal();
    hideSkillHoverPreview();
    renderSkillTree();
}


// ======================
// Preview
// ======================

function getNodeTypeLabel(node) {
    if (node?.type === "start") {
        return "START";
    }

    if (node?.type === "relic") {
        return "RELIC UNLOCK";
    }

    if (node?.type === "milestone") {
        return "MILESTONE UNLOCK";
    }

    if (node?.type === "rule") {
        return "RULE CHANGE";
    }

    if (node?.type === "system") {
        if (
            node?.effect?.unlockEvent ||
            node?.effect?.eventSense ||
            node?.effect?.rareEvents
        ) {
            return "EVENT UNLOCK";
        }
        return "SYSTEM UNLOCK";
    }

    if (node?.type === "potion") {
        return "POTION UNLOCK";
    }

    return "CARD UNLOCK";
}


function getSkillUnlockPreview(node) {
    if (!node) {
        return "";
    }

    const parts = [];

    // v29.2: 何を解禁するノードなのか、カード/レリックの詳細とは別に必ず表示する。
    // システム・イベント系ノードで「効果はあるのに説明が見えない」状態を防ぐ。
    if (node.description) {
        parts.push(`
            <div class="skill-preview-entry skill-node-description">
                <strong>📖 解禁内容</strong>
                <span>${node.description}</span>
            </div>
        `);
    }

    (node.unlockCards || [])
        .map(cardId => cards[cardId])
        .filter(Boolean)
        .forEach(card => {
            parts.push(`
                <div class="skill-preview-entry card-preview">
                    <div class="skill-preview-category">🃏 カード追加</div>
                    <strong>🃏 ${card.name}</strong>
                    <span>${card.description || ""}</span>
                </div>
            `);
        });

    (node.unlockRelics || [])
        .map(relicId => relics[relicId])
        .filter(Boolean)
        .forEach(relic => {
            parts.push(`
                <div class="skill-preview-entry relic-preview">
                    <div class="skill-preview-category">💎 レリック追加</div>
                    <strong>${relic.icon || "💎"} ${relic.name}</strong>
                    <span>${relic.description || ""}</span>
                </div>
            `);
        });

    (node.unlockPotions || [])
        .map(potionId => typeof potions !== "undefined" ? potions[potionId] : null)
        .filter(Boolean)
        .forEach(potion => {
            parts.push(`
                <div class="skill-preview-entry potion-preview">
                    <div class="skill-preview-category">🧪 ポーション追加</div>
                    <strong>${potion.icon || "🧪"} ${potion.name}</strong>
                    <span>${potion.description || ""}</span>
                </div>
            `);
        });

    const eventNames = {
        sleepingForge: ["⚒️", "眠れる鍛冶場", "スラッシュとガードをまとめて強化できるイベント。"],
        markedSupply: ["📦", "印のついた補給箱", "35G獲得かHP12回復を選べるイベント。"],
        ancientBench: ["🗿", "古代の整備台", "深層で出現するレアイベント。"]
    };
    if (node.effect?.unlockEvent && eventNames[node.effect.unlockEvent]) {
        const [icon, name, desc] = eventNames[node.effect.unlockEvent];
        parts.push(`<div class="skill-preview-entry event-preview"><div class="skill-preview-category">❓ イベント追加</div><strong>${icon} ${name}</strong><span>${desc}</span></div>`);
    }
    if (node.effect?.eventSense) {
        parts.push(`<div class="skill-preview-entry event-preview"><div class="skill-preview-category">❓ イベント追加</div><strong>📦 印のついた補給箱</strong><span>35Gを獲得するか、HPを12回復するかを選べます。</span></div>`);
    }
    if (node.effect?.rareEvents) {
        parts.push(`<div class="skill-preview-entry event-preview"><div class="skill-preview-category">❓ イベント追加</div><strong>🗿 古代の整備台</strong><span>深層で出現するレアイベントがイベントプールに追加されます。</span></div>`);
    }

    if (parts.length === 0) {
        return `
            <div class="skill-preview-entry">
                <strong>${node.icon || "◆"} ${node.name}</strong>
                <span>このノードの詳細は今後追加予定です。</span>
            </div>
        `;
    }

    return parts.join("");
}


function ensureSkillHoverPreview() {
    let preview =
        document.getElementById(
            "skill-hover-preview"
        );

    if (preview) {
        return preview;
    }

    preview = document.createElement("div");
    preview.id = "skill-hover-preview";
    preview.className =
        "skill-hover-preview hidden";

    document.body.appendChild(preview);

    return preview;
}


function showSkillHoverPreview(
    nodeId,
    anchor
) {
    const node = skillTree[nodeId];

    if (!node || !anchor) {
        return;
    }

    const preview =
        ensureSkillHoverPreview();

    const choiceNote =
        node.choiceGroup
            ? (
                isChoiceLocked(nodeId)
                    ? `<div class="skill-preview-choice locked">🔒 同じ二択のもう片方を取得済み</div>`
                    : `<div class="skill-preview-choice">◇ この段階ではどちらか1つだけ選択</div>`
            )
            : "";

    preview.innerHTML = `
        <div class="skill-hover-preview-type">
            ${getNodeTypeLabel(node)}
        </div>

        <div class="skill-hover-preview-name">
            ${node.icon || "◆"} ${node.name}
        </div>

        ${choiceNote}
        ${getSkillUnlockPreview(node)}
    `;

    preview.classList.remove("hidden");

    const rect =
        anchor.getBoundingClientRect();

    const previewWidth = 310;
    const viewportWidth =
        window.innerWidth;

    let left =
        rect.right + 12;

    if (
        left + previewWidth >
        viewportWidth - 12
    ) {
        left =
            Math.max(
                12,
                rect.left -
                previewWidth -
                12
            );
    }

    const top =
        Math.max(
            12,
            Math.min(
                rect.top - 8,
                window.innerHeight - 230
            )
        );

    preview.style.left =
        `${left}px`;

    preview.style.top =
        `${top}px`;
}


function hideSkillHoverPreview() {
    document
        .getElementById(
            "skill-hover-preview"
        )
        ?.classList.add("hidden");
}


// ======================
// Modal
// ======================

function ensureSkillNodeModal() {
    let modal =
        document.getElementById(
            "skill-node-modal"
        );

    if (modal) {
        return modal;
    }

    modal = document.createElement("div");
    modal.id = "skill-node-modal";
    modal.className =
        "skill-node-modal hidden";

    modal.innerHTML = `
        <div class="skill-node-modal-backdrop"></div>

        <div class="skill-node-modal-card">
            <button
                id="skill-node-modal-close"
                class="skill-node-modal-close"
                type="button"
                aria-label="閉じる"
            >
                ×
            </button>

            <div id="skill-node-modal-content"></div>
        </div>
    `;

    document.body.appendChild(modal);

    modal
        .querySelector(
            ".skill-node-modal-backdrop"
        )
        .addEventListener(
            "click",
            closeSkillNodeModal
        );

    modal
        .querySelector(
            "#skill-node-modal-close"
        )
        .addEventListener(
            "click",
            closeSkillNodeModal
        );

    return modal;
}


function closeSkillNodeModal() {
    document
        .getElementById(
            "skill-node-modal"
        )
        ?.classList.add("hidden");
}


function showSkillNodeModal(nodeId) {
    hideSkillHoverPreview();

    const node = skillTree[nodeId];

    if (!node) {
        return;
    }

    const modal =
        ensureSkillNodeModal();

    const content =
        modal.querySelector(
            "#skill-node-modal-content"
        );

    const unlocked =
        isNodeUnlocked(nodeId);

    const available =
        isNodeAvailable(nodeId);

    const choiceLocked =
        isChoiceLocked(nodeId);

    const isStart =
        node.type === "start";

    const isMainRouteChoice =
        node.choiceGroup ===
        `${skillTreeCharacter}_main_route_choice`;

    const choiceNote =
        node.choiceGroup
            ? (
                choiceLocked
                    ? `<div class="skill-modal-choice locked">🔒 ${
                        isMainRouteChoice
                            ? "別のメインルートを選択済み。リセットすると選び直せます。"
                            : "この二択では別のスキルを選択済み"
                    }</div>`
                    : `<div class="skill-modal-choice">◇ ${
                        isMainRouteChoice
                            ? "3つのメインルートから1つだけ選択。リセットで選び直せます。"
                            : "この段階ではどちらか1つだけ選択"
                    }</div>`
            )
            : "";

    let buttonText = "";

    if (unlocked) {
        buttonText = "解放済み";
    } else if (choiceLocked) {
        buttonText = "別の選択を取得済み";
    } else if (available) {
        buttonText = `${node.cost} SPで解放`;
    } else if (areRequirementsMet(nodeId)) {
        buttonText = `SPが${node.cost}必要`;
    } else {
        buttonText = "まだ解放できない";
    }

    content.innerHTML = `
        <div class="skill-modal-kicker">
            ${getNodeTypeLabel(node)}
        </div>

        <div class="skill-modal-icon">
            ${node.icon || "◆"}
        </div>

        <h3>${node.name}</h3>

        ${choiceNote}

        <div class="skill-modal-effect-preview">
            ${getSkillUnlockPreview(node)}
        </div>

        ${
            isStart
                ? ""
                : `
                    <div class="skill-modal-actions">
                        <button
                            id="skill-modal-unlock"
                            class="skill-modal-unlock"
                            ${available ? "" : "disabled"}
                        >
                            ${buttonText}
                        </button>

                        ${
                            !unlocked &&
                            !choiceLocked &&
                            !isMainRouteChoice
                                ? `
                                    <div class="skill-batch-entry">
                                        <button
                                            id="skill-modal-batch-unlock"
                                            class="skill-modal-batch-unlock"
                                            type="button"
                                        >
                                            ここまでまとめて解放
                                        </button>
                                        <small>
                                            一本道は自動取得。途中に分岐があれば、その場で選択します。
                                        </small>
                                    </div>
                                `
                                : ""
                        }
                    </div>
                `
        }
    `;

    const button =
        content.querySelector(
            "#skill-modal-unlock"
        );

    if (
        button &&
        available
    ) {
        button.addEventListener(
            "click",
            () => unlockNode(nodeId)
        );
    }

    const batchButton =
        content.querySelector(
            "#skill-modal-batch-unlock"
        );

    if (batchButton) {
        const batchPlan =
            buildBatchUnlockPlan(nodeId);

        if (batchPlan.blocked) {
            batchButton.disabled = true;
            batchButton.textContent =
                "まとめて解放できません";
        } else if (!batchPlan.choice) {
            const batchCost =
                getBatchUnlockCost(
                    batchPlan.nodes
                );

            batchButton.textContent =
                batchCost > 0
                    ? `ここまでまとめて解放（${batchCost} SP）`
                    : "ここまで解放済み";

            if (
                batchCost <= 0 ||
                getAvailableSkillPoints() < batchCost
            ) {
                batchButton.disabled = true;
            }
        } else {
            batchButton.textContent =
                "ここまでまとめて解放（途中で選択）";
        }

        if (!batchButton.disabled) {
            batchButton.addEventListener(
                "click",
                () =>
                    startBatchUnlock(nodeId)
            );
        }
    }

    modal.classList.remove("hidden");
}


// ======================
// Graph
// ======================

function getGraphPoint(tree, pointId) {
    return (
        tree.layout?.[pointId] ||
        tree.junctions?.[pointId] ||
        null
    );
}


function getJunctionConnectedSkillIds(
    tree,
    junctionId,
    direction
) {
    if (direction === "incoming") {
        return (tree.edges || [])
            .filter(([, to]) => to === junctionId)
            .map(([from]) => from)
            .filter(id => Boolean(skillTree[id]));
    }

    return (tree.edges || [])
        .filter(([from]) => from === junctionId)
        .map(([, to]) => to)
        .filter(id => Boolean(skillTree[id]));
}


function getEdgeState(
    tree,
    fromId,
    toId,
    characterId
) {
    const fromIsJunction =
        Boolean(tree.junctions?.[fromId]);

    const toIsJunction =
        Boolean(tree.junctions?.[toId]);

    if (toIsJunction) {
        const fromUnlocked =
            isNodeUnlocked(
                fromId,
                characterId
            );

        return fromUnlocked
            ? "unlocked"
            : "locked";
    }

    if (fromIsJunction) {
        if (
            isNodeUnlocked(
                toId,
                characterId
            )
        ) {
            return "unlocked";
        }

        if (
            isChoiceLocked(
                toId,
                characterId
            )
        ) {
            return "choice-locked";
        }

        if (
            isNodeAvailable(
                toId,
                characterId
            )
        ) {
            return "ready";
        }

        if (
            areRequirementsMet(
                toId,
                characterId
            )
        ) {
            return "reachable";
        }

        return "locked";
    }

    const fromUnlocked =
        isNodeUnlocked(
            fromId,
            characterId
        );

    const toUnlocked =
        isNodeUnlocked(
            toId,
            characterId
        );

    if (
        fromUnlocked &&
        toUnlocked
    ) {
        return "unlocked";
    }

    if (
        isChoiceLocked(
            toId,
            characterId
        )
    ) {
        return "choice-locked";
    }

    if (
        fromUnlocked &&
        isNodeAvailable(
            toId,
            characterId
        )
    ) {
        return "ready";
    }

    if (fromUnlocked) {
        return "reachable";
    }

    return "locked";
}


function renderSkillGraphEdges(
    svg,
    tree,
    characterId
) {
    const ns =
        "http://www.w3.org/2000/svg";

    const defs =
        document.createElementNS(
            ns,
            "defs"
        );

    defs.innerHTML = `
        <marker
            id="skill-arrow-locked"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
        >
            <path
                d="M0 0 L10 5 L0 10 z"
                class="skill-arrow locked"
            ></path>
        </marker>

        <marker
            id="skill-arrow-ready"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
        >
            <path
                d="M0 0 L10 5 L0 10 z"
                class="skill-arrow ready"
            ></path>
        </marker>

        <marker
            id="skill-arrow-unlocked"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
        >
            <path
                d="M0 0 L10 5 L0 10 z"
                class="skill-arrow unlocked"
            ></path>
        </marker>
    `;

    svg.appendChild(defs);

    (tree.edges || [])
        .forEach(([fromId, toId]) => {
            const from =
                getGraphPoint(
                    tree,
                    fromId
                );

            const to =
                getGraphPoint(
                    tree,
                    toId
                );

            if (!from || !to) {
                return;
            }

            const line =
                document.createElementNS(
                    ns,
                    "line"
                );

            line.setAttribute(
                "x1",
                `${from.x}%`
            );

            line.setAttribute(
                "y1",
                `${from.y}%`
            );

            line.setAttribute(
                "x2",
                `${to.x}%`
            );

            line.setAttribute(
                "y2",
                `${to.y}%`
            );

            line.classList.add(
                "skill-graph-edge"
            );

            const state =
                getEdgeState(
                    tree,
                    fromId,
                    toId,
                    characterId
                );

            line.classList.add(state);

            if (state === "unlocked") {
                line.setAttribute(
                    "marker-end",
                    "url(#skill-arrow-unlocked)"
                );
            } else if (
                state === "ready" ||
                state === "reachable"
            ) {
                line.setAttribute(
                    "marker-end",
                    "url(#skill-arrow-ready)"
                );
            } else {
                line.setAttribute(
                    "marker-end",
                    "url(#skill-arrow-locked)"
                );
            }

            svg.appendChild(line);
        });
}


function renderSkillJunctions(
    graph,
    tree
) {
    Object.entries(
        tree.junctions || {}
    ).forEach(([, pos]) => {
        const junction =
            document.createElement(
                "div"
            );

        junction.className =
            "skill-graph-junction";

        junction.style.left =
            `${pos.x}%`;

        junction.style.top =
            `${pos.y}%`;

        graph.appendChild(junction);
    });
}


// ======================
// UI
// ======================

function showSkillTreeScreen() {
    skillTreeCharacter =
        (
            selectedCharacter &&
            ["warrior", "wizard", "machinist", "gravekeeper"]
                .includes(selectedCharacter)
        )
            ? selectedCharacter
            : (
                ["warrior", "wizard", "machinist", "gravekeeper"]
                    .includes(skillTreeCharacter)
                    ? skillTreeCharacter
                    : "warrior"
            );

    skillProfessionRoute = null;

    closeSkillNodeModal();
    hideSkillHoverPreview();

    changeScene("skill-tree");
    renderSkillTree();
}


function renderCharacterTabs(container) {
    const tabs =
        document.createElement("div");

    tabs.className =
        "skill-character-tabs skill-character-tabs-compact";

    ["warrior", "wizard", "machinist", "gravekeeper"].forEach(
        characterId => {
            const tree =
                skillTrees[characterId];

            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "skill-character-tab" +
                (
                    characterId === skillTreeCharacter
                        ? " active"
                        : ""
                );

            button.innerHTML = `
                <img class="skill-tab-character-icon"
                    src="assets/characters/${characterId}.webp"
                    alt=""
                    draggable="false">
                <small>${tree.name}</small>
            `;

            button.addEventListener(
                "click",
                () => {
                    skillTreeCharacter =
                        characterId;
                    skillProfessionRoute = null;

                    closeSkillNodeModal();
                    hideSkillHoverPreview();
                    renderSkillTree();
                }
            );

            tabs.appendChild(button);
        }
    );

    container.appendChild(tabs);
}


function getProfessionEntries(characterId = skillTreeCharacter) {
    return Object.entries(
        PROFESSION_ROUTES[characterId] || {}
    );
}


function getActiveProfessionRoute(characterId = skillTreeCharacter) {
    return getProfessionEntries(characterId)
        .find(([, job]) =>
            isNodeUnlocked(
                job.entry,
                characterId
            )
        )?.[0] || null;
}


function renderProfessionDetail(detail, routeId, job, activeRoute) {
    if (!detail || !job) return;

    const entryUnlocked =
        isNodeUnlocked(
            job.entry,
            skillTreeCharacter
        );

    detail.innerHTML = `
        <div class="profession-detail-kicker">
            ${entryUnlocked ? "CURRENT / UNLOCKED" : "CLASS PREVIEW"}
        </div>

        <div class="profession-detail-title">
            <span>${job.icon}</span>
            <div>
                <h2>${job.name}</h2>
                <p>${job.tagline}</p>
            </div>
        </div>

        <p class="profession-detail-summary">
            ${job.summary}
        </p>

        <div class="profession-detail-grid">
            <div>
                <span>得意</span>
                <strong>${job.strengths}</strong>
            </div>
            <div>
                <span>難易度</span>
                <strong>${job.difficulty}</strong>
            </div>
        </div>

        <div class="profession-final-preview">
            <span>最終派生</span>
            <div>
                <strong>${job.finalClasses[0]}</strong>
                <i>or</i>
                <strong>${job.finalClasses[1]}</strong>
            </div>
        </div>

        <div class="profession-detail-note">
            ${
                activeRoute && activeRoute !== routeId
                    ? "別職へ転職済み。リセットすると選び直せます。"
                    : entryUnlocked
                        ? "この職業のルートを進行中。"
                        : "この職業カードを選ぶと、下に専用ツリーを表示します。最初の職業ノードを解放すると転職が確定します。"
            }
        </div>
    `;
}


function buildFocusedProfessionTree(tree, job) {
    const ids =
        (job?.nodeIds || [])
            .filter(nodeId =>
                Boolean(
                    skillTree[nodeId] &&
                    tree.layout?.[nodeId]
                )
            );

    const idSet =
        new Set(ids);

    const originalPositions =
        ids.map(nodeId =>
            tree.layout[nodeId]
        );

    const centerX =
        originalPositions.length > 0
            ? originalPositions[0].x
            : 50;

    const layout = {};

    ids.forEach(nodeId => {
        const pos =
            tree.layout[nodeId];

        layout[nodeId] = {
            x: Math.max(
                18,
                Math.min(
                    82,
                    50 + (pos.x - centerX) * 2.15
                )
            ),
            y: pos.y
        };
    });

    return {
        startNode: job.entry,
        layout,
        junctions: {},
        edges:
            (tree.edges || [])
                .filter(([fromId, toId]) =>
                    idSet.has(fromId) &&
                    idSet.has(toId)
                )
    };
}


function getProfessionLaneLayout(job) {
    const ids = (job?.nodeIds || []).filter(id => Boolean(skillTree[id]));
    const layout = {};
    const edges = [];

    if (ids.length === 0) {
        return { layout, edges };
    }

    const positions = [
        { x: 50, y: 7 },
        { x: 34, y: 20 },
        { x: 66, y: 20 },
        { x: 34, y: 34 },
        { x: 66, y: 34 },
        { x: 50, y: 48 },
        { x: 50, y: 61 },
        { x: 50, y: 74 },
        { x: 50, y: 87 },
        { x: 50, y: 97 }
    ];

    ids.forEach((id, index) => {
        layout[id] = positions[index] || {
            x: 50,
            y: Math.min(97, 61 + (index - 6) * 13)
        };
    });

    // 入口 → 1回目の二択
    if (ids[1]) edges.push([ids[0], ids[1]]);
    if (ids[2]) edges.push([ids[0], ids[2]]);

    // 1回目の二択 → 2回目の二択。
    // 既存仕様では2段目はどちらの1段目からでも選べるため、
    // クロス線は出さず左右を対応させ、視認性を優先する。
    if (ids[3] && ids[1]) edges.push([ids[1], ids[3]]);
    if (ids[4] && ids[2]) edges.push([ids[2], ids[4]]);

    // 2回目の二択 → 合流
    if (ids[5] && ids[3]) edges.push([ids[3], ids[5]]);
    if (ids[5] && ids[4]) edges.push([ids[4], ids[5]]);

    // 以降は一直線
    for (let i = 6; i < ids.length; i++) {
        edges.push([ids[i - 1], ids[i]]);
    }

    return { layout, edges };
}

function renderProfessionLane(routeId, job, activeRoute) {
    const lane = document.createElement("section");
    const entryUnlocked = isNodeUnlocked(job.entry, skillTreeCharacter);
    const routeLocked = isChoiceLocked(job.entry, skillTreeCharacter);

    lane.className =
        "profession-lane" +
        (entryUnlocked ? " current" : "") +
        (routeLocked ? " unavailable" : "");

    lane.innerHTML = `
        <header class="profession-lane-head">
            <div class="profession-lane-emblem">${job.icon}</div>
            <div class="profession-lane-title-copy">
                <span class="profession-lane-state">
                    ${
                        entryUnlocked
                            ? "転職済み"
                            : routeLocked
                                ? "別職を選択済み"
                                : "転職候補"
                    }
                </span>
                <h2>${job.name}</h2>
                <p>${job.tagline}</p>
            </div>
            <div class="profession-lane-hover-info">
                <p>${job.summary}</p>
                <div><span>得意</span><strong>${job.strengths}</strong></div>
                <div><span>難易度</span><strong>${job.difficulty}</strong></div>
                <div><span>最終派生</span><strong>${job.finalClasses[0]} / ${job.finalClasses[1]}</strong></div>
            </div>
        </header>
    `;

    const body = document.createElement("div");
    body.className = "profession-lane-tree";

    const graph = document.createElement("div");
    graph.className = "profession-lane-graph";

    const laneTree = getProfessionLaneLayout(job);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("profession-lane-lines");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");

    laneTree.edges.forEach(([fromId, toId]) => {
        const from = laneTree.layout[fromId];
        const to = laneTree.layout[toId];
        if (!from || !to) return;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", from.x);
        line.setAttribute("y1", from.y);
        line.setAttribute("x2", to.x);
        line.setAttribute("y2", to.y);
        line.classList.add("profession-lane-edge");

        const toUnlocked = isNodeUnlocked(toId, skillTreeCharacter);
        const toAvailable = isNodeAvailable(toId, skillTreeCharacter);
        const fromUnlocked = isNodeUnlocked(fromId, skillTreeCharacter);

        if (toUnlocked && fromUnlocked) {
            line.classList.add("unlocked");
        } else if (toAvailable || (fromUnlocked && areRequirementsMet(toId, skillTreeCharacter))) {
            line.classList.add("ready");
        } else {
            line.classList.add("locked");
        }

        svg.appendChild(line);
    });

    graph.appendChild(svg);

    Object.entries(laneTree.layout).forEach(([nodeId, pos]) => {
        const node = skillTree[nodeId];
        if (!node) return;

        const unlocked = isNodeUnlocked(nodeId, skillTreeCharacter);
        const choiceLocked = isChoiceLocked(nodeId, skillTreeCharacter);
        const available = isNodeAvailable(nodeId, skillTreeCharacter);
        const requirementsMet = areRequirementsMet(nodeId, skillTreeCharacter);

        let stateClass = "locked";
        if (unlocked) stateClass = "unlocked";
        else if (choiceLocked) stateClass = "choice-locked";
        else if (available) stateClass = "available";
        else if (requirementsMet) stateClass = "need-points";

        const button = document.createElement("button");
        button.type = "button";
        button.className = `profession-lane-node ${node.type || "card"} ${stateClass}`;
        if (node.choiceGroup) button.classList.add("choice-node");
        if (nodeId === job.entry) button.classList.add("profession-entry-node");

        button.style.left = `${pos.x}%`;
        button.style.top = `${pos.y}%`;

        button.innerHTML = `
            <span class="profession-lane-node-icon">${node.icon || "◆"}</span>
            <span class="profession-lane-node-cost">
                ${unlocked ? "✓" : choiceLocked ? "🔒" : node.cost}
            </span>
            ${nodeId === job.entry ? `<span class="profession-lane-node-name">${job.name}</span>` : ""}
        `;

        button.title = node.name;
        button.addEventListener("click", () => showSkillNodeModal(nodeId));
        button.addEventListener("mouseenter", () => showSkillHoverPreview(nodeId, button));
        button.addEventListener("mouseleave", hideSkillHoverPreview);
        button.addEventListener("focus", () => showSkillHoverPreview(nodeId, button));
        button.addEventListener("blur", hideSkillHoverPreview);

        graph.appendChild(button);
    });

    body.appendChild(graph);
    lane.appendChild(body);
    return lane;
}

function renderSkillTree() {
    const pointsDisplay = document.getElementById("skill-points-display");
    const container = document.getElementById("skill-tree-area");

    if (!pointsDisplay || !container) return;

    if (!["warrior", "wizard", "machinist", "gravekeeper"].includes(skillTreeCharacter)) {
        skillTreeCharacter =
            selectedCharacter && ["warrior", "wizard", "machinist", "gravekeeper"].includes(selectedCharacter)
                ? selectedCharacter
                : "warrior";
    }

    const tree = skillTrees[skillTreeCharacter];
    const routes = PROFESSION_ROUTES[skillTreeCharacter] || {};
    const activeRoute = getActiveProfessionRoute(skillTreeCharacter);

    pointsDisplay.innerHTML = `
        <span class="skill-screen-character">${tree.icon} ${tree.name}</span>
        <span class="skill-screen-rule">3つの職業ルートから1つを選択</span>
        <span class="skill-points-emphasis">使用可能SP <strong>${getAvailableSkillPoints(skillTreeCharacter)}</strong></span>
    `;

    container.innerHTML = "";
    renderCharacterTabs(container);

    const toolbar = document.createElement("div");
    toolbar.className = "profession-board-toolbar";
    toolbar.innerHTML = `
        <div>
            <span>CLASS PATH</span>
            <strong>${tree.name} 職業ツリー</strong>
        </div>
        <button id="skill-graph-reset" class="skill-graph-reset" type="button">転職をリセット</button>
    `;
    container.appendChild(toolbar);

    const board = document.createElement("div");
    board.className = "profession-board";

    Object.entries(routes).forEach(([routeId, job]) => {
        board.appendChild(renderProfessionLane(routeId, job, activeRoute));
    });

    container.appendChild(board);

    toolbar.querySelector("#skill-graph-reset")?.addEventListener("click", resetSkillTree);
}


const skillTreeButton =
    document.getElementById(
        "skill-tree-button"
    );

if (skillTreeButton) {
    skillTreeButton.addEventListener(
        "click",
        showSkillTreeScreen
    );
}


const skillResetButton =
    document.getElementById(
        "skill-reset-button"
    );

if (skillResetButton) {
    skillResetButton.classList.add(
        "hidden"
    );
}


const skillBackButton =
    document.getElementById(
        "skill-back-button"
    );

if (skillBackButton) {
    skillBackButton.addEventListener(
        "click",
        () => {
            closeSkillNodeModal();
            hideSkillHoverPreview();
            changeScene("title");
        }
    );
}


document.addEventListener(
    "keydown",
    event => {
        if (event.key === "Escape") {
            closeSkillNodeModal();
            hideSkillHoverPreview();
        }
    }
);
