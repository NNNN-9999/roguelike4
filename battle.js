console.log("★★★ battle.js 読み込み成功");

let battleEnded = false;
let enemy = null;
let battleEnemies = [];
let selectedEnemyIndex = 0;
let currentBattleType = "normal";
let enemyTurnAnimating = false;

function ensureRunStats() {
    if (!player) return null;

    if (!player.runStats || typeof player.runStats !== "object") {
        player.runStats = {
            enemiesDefeated: 0,
            battlesWon: 0,
            skillPointsEarned: 0,
            goldEarned: 0
        };
    }

    player.runStats.enemiesDefeated =
        Number(player.runStats.enemiesDefeated || 0);

    player.runStats.battlesWon =
        Number(player.runStats.battlesWon || 0);

    player.runStats.skillPointsEarned =
        Number(player.runStats.skillPointsEarned || 0);

    player.runStats.goldEarned =
        Number(player.runStats.goldEarned || 0);

    return player.runStats;
}

function sleepBattle(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
}

function getEnemyUnitElement(unit) {
    const index = battleEnemies.indexOf(unit);
    if (index < 0) return null;

    return document.querySelector(
        `#enemy-field .enemy-unit[data-enemy-index="${index}"]`
    );
}

async function presentEnemyAction(unit, move) {
    const element = getEnemyUnitElement(unit);
    const battleScreen = document.getElementById("battle-screen");

    if (!element || !move) {
        await sleepBattle(90);
        return;
    }

    const actionType =
        move.type === "attack"
            ? "attack"
            : (move.type === "block" || move.type === "guardAlly")
                ? "block"
                : "skill";

    element.classList.remove(
        "enemy-action-active",
        "enemy-action-attack",
        "enemy-action-block",
        "enemy-action-skill"
    );

    void element.offsetWidth;

    element.classList.add(
        "enemy-action-active",
        `enemy-action-${actionType}`
    );

    if (actionType === "attack") {
        if (battleScreen) {
            battleScreen.classList.add("enemy-attack-warning");
        }
        await sleepBattle(155);

        if (typeof playSe === "function") {
            playSe("attackHit", 0.54);
        }
    } else {
        await sleepBattle(130);
    }
}

async function finishEnemyAction(unit, move) {
    const element = getEnemyUnitElement(unit);
    const battleScreen = document.getElementById("battle-screen");

    if (move?.type === "attack") {
        await sleepBattle(155);
    } else {
        await sleepBattle(115);
    }

    if (element) {
        element.classList.remove(
            "enemy-action-active",
            "enemy-action-attack",
            "enemy-action-block",
            "enemy-action-skill"
        );
    }

    if (battleScreen) {
        battleScreen.classList.remove("enemy-attack-warning");
    }
}


function getLivingBattleEnemies() {
    return (battleEnemies || []).filter(unit => unit && unit.hp > 0);
}

function syncSelectedEnemy() {
    if (!battleEnemies.length) {
        enemy = null;
        selectedEnemyIndex = 0;
        return null;
    }

    if (!battleEnemies[selectedEnemyIndex] || battleEnemies[selectedEnemyIndex].hp <= 0) {
        const nextIndex = battleEnemies.findIndex(unit => unit && unit.hp > 0);
        selectedEnemyIndex = nextIndex >= 0 ? nextIndex : 0;
    }

    enemy = battleEnemies[selectedEnemyIndex] || null;
    return enemy;
}

function selectEnemyTarget(index) {
    if (battleEnded || !battleEnemies[index] || battleEnemies[index].hp <= 0) return;
    selectedEnemyIndex = index;
    enemy = battleEnemies[index];
    if (typeof updateEnemyUI === "function") updateEnemyUI();
    if (typeof renderHand === "function") renderHand();
}


// ======================
// レリック所持判定
// ======================

function hasRelic(relicId) {

    return Array.isArray(player?.relics) &&
        player.relics.includes(relicId);
}


// ======================
// 戦士：闘志
// ======================

function getMaxRage() {
    return Infinity;
}

function gainRage(amount) {

    if (selectedCharacter !== "warrior") {
        return;
    }

    player.rage = Math.max(
        0,
        (player.rage || 0) + amount
    );
}

function spendRage(amount) {

    if (selectedCharacter !== "warrior") {
        return false;
    }

    if ((player.rage || 0) < amount) {
        return false;
    }

    player.rage -= amount;
    if (hasRelic('battleBanner') && !player._v164BannerUsed) {
        player._v164BannerSpent = (player._v164BannerSpent || 0) + amount;
        if (player._v164BannerSpent >= 8) {
            player._v164BannerUsed = true;
            player.energy += 1;
            drawCards(2);
        }
    }

    // 闘志の留め金：闘志を消費したとき4ブロック。
    if (hasRelic("rageClasp")) {
        player.block += 4;

        if (typeof showRelicTrigger === "function") {
            showRelicTrigger("rageClasp", "+4ブロック");
        }
    }

    return true;
}


// ======================
// 魔法使い：属性連鎖
// 火→雷：+6ダメージ
// 雷→氷：+8ブロック
// 氷→火：+1ドロー
// ======================

function getElementalChainEffect(card) {

    const effect = {
        triggered: false,
        damage: 0,
        block: 0,
        draw: 0,
        label: ""
    };

    if (
        selectedCharacter !== "wizard" ||
        !card?.element ||
        !player.lastElement
    ) {
        return effect;
    }

    const previous = player.lastElement;
    const current = card.element;

    if (previous === "fire" && current === "lightning") {
        effect.triggered = true;
        effect.damage =
            6 + (player?.skillBonus?.chainDamageBonus || 0);

        effect.label =
            `🔥→⚡ +${effect.damage}ダメージ`;
    }

    if (previous === "lightning" && current === "ice") {
        effect.triggered = true;
        effect.block =
            8 + (player?.skillBonus?.chainBlockBonus || 0);

        effect.label =
            `⚡→❄️ +${effect.block}ブロック`;
    }

    if (previous === "ice" && current === "fire") {
        effect.triggered = true;
        effect.draw = 1;
        effect.label = "❄️→🔥 +1ドロー";
    }

    return effect;
}


// ======================
// 墓守：捨て札操作
// ======================

function returnCardsFromDiscard(amount) {

    if (selectedCharacter !== "gravekeeper") {
        return 0;
    }

    let returned = 0;

    for (let i = 0; i < amount; i++) {

        if (player.discardPile.length === 0) {
            break;
        }

        const index = Math.floor(
            Math.random() * player.discardPile.length
        );

        const [cardId] = player.discardPile.splice(index, 1);
        player.hand.push(cardId);
        if (hasRelic('curseBell') && (cards[cardId]?.type === 'curse' || cards[cardId]?.unplayable)) {
            player.block += modifyBlockGain(player,6);
        }

        // v51: 捨て札から戻ったカードは、このターン中だけ0コスト。
        player.freeRecoveredCardCounts =
            player.freeRecoveredCardCounts || {};
        player.freeRecoveredCardCounts[cardId] =
            (player.freeRecoveredCardCounts[cardId] || 0) + 1;

        returned += 1;

        // 煤けた灯籠：各戦闘で最初の回収時だけエナジー+1
        if (
            hasRelic("sootLantern") &&
            !player.graveLanternUsed
        ) {
            player.energy += 1;
            player.graveLanternUsed = true;

            if (typeof showRelicTrigger === "function") {
                showRelicTrigger("sootLantern", "エナジー+1");
            }
        }

        // 骨の数珠：回収するたび3ブロック
        if (hasRelic("boneRosary")) {
            player.block += 3;

            if (typeof showRelicTrigger === "function") {
                showRelicTrigger("boneRosary", "+3ブロック");
            }
        }

        const recoveryBlock =
            player?.skillBonus?.recoveredCardBlock || 0;

        if (recoveryBlock > 0) {
            player.block += recoveryBlock;
        }

        player.recoveredCardsThisTurn =
            (player.recoveredCardsThisTurn || 0) + 1;
        if (hasRelic('underworldBell') && player.recoveredCardsThisTurn === 1) {
            player.freeRecoveredCardCounts ||= {};
            player.freeRecoveredCardCounts[cardId] = (player.freeRecoveredCardCounts[cardId] || 0) + 1;
        }

        if (
            player.recoveredCardsThisTurn === 1 &&
            hasRelic("ferrymanCoin")
        ) {
            if (typeof showRelicTrigger === "function") {
                showRelicTrigger(
                    "ferrymanCoin",
                    "+1ドロー"
                );
            }

            drawCards(1);
        }

        if (
            player.recoveredCardsThisTurn === 1 &&
            (player?.skillBonus?.firstRecoveryEnergy || 0) > 0
        ) {
            player.energy +=
                player.skillBonus.firstRecoveryEnergy;
        }

        if (
            player.recoveredCardsThisTurn === 2 &&
            (player?.skillBonus?.secondRecoveryDraw || 0) > 0
        ) {
            drawCards(
                player.skillBonus.secondRecoveryDraw
            );
        }
    }

    return returned;
}

function discardRandomCardsFromHand(amount) {

    let discarded = 0;

    for (let i = 0; i < amount; i++) {

        if (player.hand.length === 0) {
            break;
        }

        const index = Math.floor(
            Math.random() * player.hand.length
        );

        const [cardId] = player.hand.splice(index, 1);
        player.discardPile.push(cardId);
        discarded += 1;
    }

    return discarded;
}

function consumeDiscardCards(amount) {

    let consumed = 0;

    while (
        consumed < amount &&
        player.discardPile.length > 0
    ) {
        const index = Math.floor(
            Math.random() * player.discardPile.length
        );

        const [consumedCardId] = player.discardPile.splice(index, 1);
        if (!Array.isArray(player.exhaustPile)) player.exhaustPile = [];
        if (consumedCardId) player.exhaustPile.push(consumedCardId);
        consumed += 1;
    }

    return consumed;
}


// ======================
// ボス：HP条件の特殊フェーズ
// ======================

function checkEnemySpecialPhase() {

    if (
        !enemy ||
        enemy.hp <= 0 ||
        !enemy.special ||
        enemy.specialTriggered
    ) {
        return false;
    }

    const special = enemy.special;
    const threshold = special.threshold ?? 0.5;

    if (enemy.hp > enemy.maxHp * threshold) {
        return false;
    }

    enemy.specialTriggered = true;
    enemy.phaseLabel = special.label || "特殊形態";
    enemy.specialNotice = special.message || "敵が形態変化した！";

    if (special.nameAfter) {
        enemy.name = special.nameAfter;
    }

    if (special.block) {
        enemy.block += special.block;
    }

    if (special.heal) {
        enemy.hp = Math.min(
            enemy.maxHp,
            enemy.hp + special.heal
        );
    }

    if (special.attackBonus) {
        enemy.moves = enemy.moves.map(move => ({
            ...move,
            value:
                move.type === "attack"
                    ? move.value + special.attackBonus
                    : move.value
        }));
    }

    if (special.moves?.length) {
        enemy.moves = structuredClone(special.moves);
        enemy.moveIndex = 0;
    }

    if (special.energyPenalty) {
        player.nextTurnEnergyPenalty += special.energyPenalty;
    }

    if (special.stealEnergy) {
        player.energy = Math.max(
            0,
            player.energy - special.stealEnergy
        );
    }

    enemy.nextMove = enemy.moves[enemy.moveIndex] || enemy.moves[0];

    updatePlayerUI();
    updateEnemyUI();

    return true;
}




// ======================
// v16 敵の小さな固有能力
// ======================

function triggerEnemyPassiveAfterHit(unit = enemy) {

    if (
        !unit ||
        unit.hp <= 0 ||
        !unit.passive
    ) {
        return;
    }

    const passive = unit.passive;

    if (passive.type === "oozeArmor") {

        if (Math.random() < (passive.chance || 0)) {
            unit.block += passive.block || 0;

            if (typeof showFloatingCombatText === "function") {
                showFloatingCombatText(
                    "enemy",
                    `+${passive.block || 0} BLOCK`,
                    "block"
                );
            }

            if (typeof triggerBattleTargetEffect === "function") {
                triggerBattleTargetEffect("enemy", "block");
            }
        }

        return;
    }

    if (unit.passiveTriggered) {
        return;
    }

    const threshold =
        passive.threshold ?? 0.5;

    if (
        unit.hp >
        unit.maxHp * threshold
    ) {
        return;
    }

    unit.passiveTriggered = true;

    if (passive.block) {
        unit.block += passive.block;

        if (typeof showFloatingCombatText === "function") {
            showFloatingCombatText(
                "enemy",
                `+${passive.block} BLOCK`,
                "block"
            );
        }
    }

    if (passive.nextAttackBonus) {
        unit._nextAttackBonus = passive.nextAttackBonus;
    }

    if (passive.attackBonus) {
        unit.moves = unit.moves.map(move => ({
            ...move,
            value:
                move.type === "attack"
                    ? move.value + passive.attackBonus
                    : move.value
        }));
    }

    if (passive.attackPenalty) {
        unit.moves = unit.moves.map(move => ({
            ...move,
            value:
                move.type === "attack"
                    ? Math.max(1, move.value - passive.attackPenalty)
                    : move.value
        }));
    }

    unit.nextMove =
        unit.moves[unit.moveIndex] ||
        unit.moves[0];

    unit.specialNotice =
        `${passive.label} 発動！`;
}


// ======================
// v81 ボス専用能力
// ======================

function getDepthScale() {
    // v162: 深度による一律HP・行動数値倍率を廃止。
    return { hp: 1, move: 1 };
}

function initializeBattleUnit(baseData, options = {}) {
    const unit = structuredClone(baseData);
    const scale = getDepthScale();

    if (!options.keepMaxHp) {
        unit.maxHp = Math.round(unit.maxHp * scale.hp);
    }

    unit.moves = (unit.moves || []).map(move => ({
        ...move,
        value:
            typeof move.value === "number"
                ? Math.max(1, Math.round(move.value * scale.move))
                : move.value
    }));

    unit.hp =
        typeof options.hp === "number"
            ? options.hp
            : unit.maxHp;

    if (typeof options.maxHp === "number") {
        unit.maxHp = options.maxHp;
    }

    unit.block = 0;
    unit.moveIndex = 0;
    unit.statuses = { ...(unit.initialStatuses || {}) };
    unit.nextMove = unit.moves[0] || null;
    unit.specialNotice = "";
    unit.passiveTriggered = false;
    unit.displayScale = options.displayScale ?? unit.displayScale ?? 1;

    return unit;
}

function countLivingSummonedMinions() {
    return getLivingBattleEnemies()
        .filter(unit => unit.isSummonedMinion)
        .length;
}

function getSummonedMinionBase(role) {
    if (role === "defense") {
        return enemies.fairyDefenseMinion;
    }

    if (role === "support") {
        return enemies.fairySupportMinion;
    }

    return enemies.fairyAttackMinion;
}


function chooseSummonedMinionRole() {
    const roles = [
        "attack",
        "defense",
        "support"
    ];

    const livingRoles =
        new Set(
            getLivingBattleEnemies()
                .filter(unit =>
                    unit?.isSummonedMinion
                )
                .map(unit =>
                    unit.minionRole
                )
                .filter(Boolean)
        );

    // まず場にいない役割を優先。
    const missing =
        roles.filter(role =>
            !livingRoles.has(role)
        );

    const pool =
        missing.length > 0
            ? missing
            : roles;

    return pool[
        Math.floor(
            Math.random() * pool.length
        )
    ];
}


function createSummonedMinion(
    owner,
    forcedRole = null
) {
    const ability = owner?.bossAbility;
    const minHp =
        ability?.minionHpMin ?? 20;
    const maxHp =
        ability?.minionHpMax ?? 30;

    const baseHp =
        minHp +
        Math.floor(
            Math.random() *
            (maxHp - minHp + 1)
        );

    const scale = getDepthScale();

    const scaledHp =
        Math.max(
            1,
            Math.round(
                baseHp * scale.hp
            )
        );

    const role =
        forcedRole ||
        chooseSummonedMinionRole();

    const base =
        getSummonedMinionBase(role);

    const minion =
        initializeBattleUnit(
            base,
            {
                hp: scaledHp,
                maxHp: scaledHp,
                displayScale: 0.68
            }
        );

    minion.isSummonedMinion = true;
    minion.summonerBoss = true;
    minion.minionRole = role;

    return minion;
}

function setupBossEncounter() {
    if (
        currentBattleType !== "boss" ||
        !enemy ||
        !enemy.bossAbility
    ) {
        return;
    }

    const ability = enemy.bossAbility;

    if (ability.type === "splitChain") {
        enemy.splitStage = 0;
        enemy.splitPending = false;
        enemy.displayScale = 1;
        battleEnemies = [enemy];
        selectedEnemyIndex = 0;
        return;
    }

    if (ability.type === "summonMinions") {
        enemy.isSummonerBoss = true;
        enemy.summonPending = false;
        enemy.summonDelay = 0;

        const units = [];

        // 開始時は3役から重複なしで2体。
        // 子分を前、本体を一番後ろへ配置する。
        const startRoles = [
            "attack",
            "defense",
            "support"
        ].sort(
            () => Math.random() - 0.5
        );

        for (
            let i = 0;
            i < (ability.startMinions ?? 2);
            i++
        ) {
            units.push(
                createSummonedMinion(
                    enemy,
                    startRoles[i]
                )
            );
        }

        units.push(enemy);

        battleEnemies = units;
        selectedEnemyIndex = 0;
        syncSelectedEnemy();
        return;
    }

    if (ability.type === "chargeCycle") {
        enemy.chargeStage = 0;
        enemy.displayScale = 1;
        refreshBossIntent(enemy);
        return;
    }

    if (ability.type === "thornCycle") {
        enemy.thornDamageBank = 0;
        enemy.thornPending = false;
        enemy.thornActive = false;
        enemy.thorns = 0;
        enemy.thornVisualActive = false;
        return;
    }

    if (ability.type === "twinPair") {
        const assault = initializeBattleUnit(
            enemies.twinAssault
        );

        const support = initializeBattleUnit(
            enemies.twinSupport
        );

        assault.isTwinBoss = true;
        support.isTwinBoss = true;
        assault.twinGroup = "bossTwin";
        support.twinGroup = "bossTwin";
        assault.twinReviveTurns = ability.reviveTurns ?? 3;
        support.twinReviveTurns = ability.reviveTurns ?? 3;
        assault.twinReviveHpRate = ability.reviveHpRate ?? 0.5;
        support.twinReviveHpRate = ability.reviveHpRate ?? 0.5;

        battleEnemies = [assault, support];
        selectedEnemyIndex = 0;
        syncSelectedEnemy();
    }
}

function markSplitPending(unit) {
    if (
        !unit ||
        unit.hp <= 0 ||
        unit.splitStage >= 2 ||
        unit.splitPending
    ) {
        return;
    }

    unit.splitPending = true;
    unit.nextMove = {
        type: "split",
        label: "分裂"
    };

    if (typeof updateEnemyUI === "function") {
        updateEnemyUI();
    }
}

function performSplit(unit) {
    const index =
        battleEnemies.indexOf(unit);

    if (index < 0) return;

    const nextStage =
        (unit.splitStage || 0) + 1;

    const displayScale =
        nextStage === 1
            ? 0.80
            : 0.58;

    let childBases;

    if (nextStage === 1) {
        // キングは色違いの2体へ分裂。
        childBases = [
            enemies.splitMediumBlue,
            enemies.splitMediumGreen
        ];
    } else {
        // 中型は自分と同じ色の小型2体へ分裂。
        const color =
            unit.splitColor || "blue";

        const smallBase =
            color === "green"
                ? enemies.splitSmallGreen
                : enemies.splitSmallBlue;

        childBases = [
            smallBase,
            smallBase
        ];
    }

    const children = childBases.map(
        childBase => {
            // v116:
            // 分裂後の個体は「分裂した瞬間の残りHP」を
            // 新しい最大HPとして扱う。
            // 例: キングスライム 60/130 で分裂
            //     -> スライムL 60/60
            // これで親の最大HP130を母数にしたまま
            // 50%判定され、即座に再分裂するのを防ぐ。
            const splitHp =
                Math.max(1, unit.hp);

            const child =
                initializeBattleUnit(
                    childBase,
                    {
                        hp: splitHp,
                        maxHp: splitHp,
                        displayScale
                    }
                );

            child.splitStage =
                nextStage;

            child.splitColor =
                childBase.splitColor ||
                unit.splitColor;

            child.splitPending = false;

            child.bossAbility = {
                type: "splitChain",
                threshold: 0.5,
                maxStage: 2
            };

            if (
                nextStage < 2 &&
                child.hp <=
                    child.maxHp * 0.5
            ) {
                markSplitPending(child);
            }

            return child;
        }
    );

    battleEnemies.splice(
        index,
        1,
        ...children
    );

    selectedEnemyIndex = Math.min(
        index,
        battleEnemies.length - 1
    );

    syncSelectedEnemy();
}

function performSummon(unit) {
    const ability = unit.bossAbility;
    const maxMinions =
        ability.maxMinions ?? 3;

    const current =
        countLivingSummonedMinions();

    const capacity =
        Math.max(0, maxMinions - current);

    const addCount =
        Math.min(
            ability.summonCount ?? 2,
            capacity
        );

    const bossIndex =
        battleEnemies.indexOf(unit);

    for (
        let i = 0;
        i < addCount;
        i++
    ) {
        const minion =
            createSummonedMinion(unit);

        if (bossIndex >= 0) {
            battleEnemies.splice(
                battleEnemies.indexOf(unit),
                0,
                minion
            );
        } else {
            battleEnemies.push(minion);
        }
    }

    unit.summonPending = false;
    unit.summonDelay = 0;
    unit.specialNotice =
        addCount > 0
            ? `子分を${addCount}体呼び出した！`
            : "子分が上限までいるため召喚を見送った。";
}

function refreshBossIntent(unit) {
    if (!unit) return;

    if (unit.splitPending) {
        unit.nextMove = {
            type: "split",
            label: "分裂"
        };
        return;
    }

    if (
        unit.bossAbility?.type === "chargeCycle"
    ) {
        const ability = unit.bossAbility;
        const maxStage =
            ability.maxStage ?? 6;

        if (
            (unit.chargeStage ?? 0) >= maxStage
        ) {
            const scale = getDepthScale();

            unit.nextMove = {
                type: "attack",
                value: Math.round(
                    (ability.finisherDamage ?? 36) *
                    scale.move
                ),
                bossLabel: `灯火 ${maxStage}/${maxStage}`
            };

            return;
        }

        const baseMove =
            unit.moves[unit.moveIndex] ||
            unit.moves[0];

        if (baseMove?.type === "attack") {
            const bonus =
                (unit.chargeStage ?? 0) *
                (ability.attackBonusPerStage ?? 2);

            unit.nextMove = {
                ...baseMove,
                value:
                    (baseMove.value || 0) +
                    bonus,
                bossLabel:
                    `灯火 ${unit.chargeStage ?? 0}/${maxStage}`
            };
        } else {
            unit.nextMove = {
                ...baseMove,
                bossLabel:
                    `灯火 ${unit.chargeStage ?? 0}/${maxStage}`
            };
        }

        return;
    }

    unit.nextMove =
        unit.moves?.[unit.moveIndex] ||
        unit.moves?.[0] ||
        null;
}

function handleBossDamageEvent(
    target,
    hpDamage,
    beforeHp
) {
    if (
        hpDamage <= 0 ||
        !battleEnemies.includes(target)
    ) {
        return;
    }

    if (
        target.bossAbility?.type ===
        "splitChain"
    ) {
        const threshold =
            target.bossAbility.threshold ??
            0.5;

        if (
            target.hp > 0 &&
            target.hp <=
                target.maxHp * threshold
        ) {
            markSplitPending(target);
        }
    }

    if (
        target.bossAbility?.type ===
        "thornCycle" &&
        target.hp > 0 &&
        !target.thornActive
    ) {
        target.thornDamageBank =
            (target.thornDamageBank || 0) +
            hpDamage;

        const threshold =
            target.bossAbility
                .damageThreshold ?? 40;

        if (
            !target.thornPending &&
            target.thornDamageBank >=
                threshold
        ) {
            target.thornDamageBank -=
                threshold;

            target.thornPending = true;

            target.nextMove = {
                type: "thorn",
                label: "トゲ展開"
            };
        }
    }

    if (
        beforeHp > 0 &&
        target.hp <= 0 &&
        target.isSummonedMinion
    ) {
        const owner =
            battleEnemies.find(unit =>
                unit?.isSummonerBoss &&
                unit.hp > 0
            );

        if (
            owner &&
            !owner.summonPending
        ) {
            owner.summonPending = true;
            owner.summonDelay = 1;
        }
    }

    if (
        beforeHp > 0 &&
        target.hp <= 0 &&
        target.isTwinBoss
    ) {
        const deadIndex =
            battleEnemies.indexOf(target);

        const partner =
            battleEnemies.find(unit =>
                unit &&
                unit !== target &&
                unit.isTwinBoss &&
                unit.hp > 0
            );

        if (partner) {
            partner.twinReviveTargetIndex =
                deadIndex;

            partner.twinReviveCountdown =
                partner.twinReviveTurns ?? 3;

            partner.specialNotice =
                `相方復活まで${partner.twinReviveCountdown}ターン`;
        }
    }
}

function reviveTwinIfReady(unit) {
    if (
        !unit?.isTwinBoss ||
        !Number.isInteger(
            unit.twinReviveTargetIndex
        ) ||
        !Number.isFinite(
            unit.twinReviveCountdown
        )
    ) {
        return;
    }

    unit.twinReviveCountdown -= 1;

    if (
        unit.twinReviveCountdown > 0
    ) {
        unit.specialNotice =
            `相方復活まで${unit.twinReviveCountdown}ターン`;

        return;
    }

    const target =
        battleEnemies[
            unit.twinReviveTargetIndex
        ];

    if (
        !target ||
        target.hp > 0
    ) {
        delete unit.twinReviveTargetIndex;
        delete unit.twinReviveCountdown;
        return;
    }

    target.hp = Math.max(
        1,
        Math.round(
            target.maxHp *
            (unit.twinReviveHpRate ?? 0.5)
        )
    );

    target.block = 0;
    target.moveIndex = 0;
    target.nextMove =
        target.moves[0] || null;

    target.statuses = {
        ...(target.initialStatuses || {})
    };

    delete unit.twinReviveTargetIndex;
    delete unit.twinReviveCountdown;

    target.specialNotice =
        "双生体が復活した！";

    syncSelectedEnemy();
}

function performStandardEnemyMove(
    actingEnemy,
    move
) {
    if (!move) return;

    switch (move.type) {
        case "attack": {
            const hits =
                move.hits || 1;

            for (
                let i = 0;
                i < hits;
                i++
            ) {
                if (
                    player.hp <= 0 ||
                    actingEnemy.hp <= 0
                ) {
                    break;
                }

                dealDamage(
                    player,
                    modifyAttackDamage(
                        actingEnemy,
                        player,
                        move.value + (actingEnemy._nextAttackBonus || 0)
                    )
                );
                if (player.hp > 0 && getStatus(player,"thorns") > 0 && actingEnemy.hp > 0) {
                    dealDamage(actingEnemy,getStatus(player,"thorns"));
                }

                if (
                    (player.reflectDamageThisTurn ||
                        0) > 0 &&
                    actingEnemy.hp > 0
                ) {
                    dealDamage(
                        actingEnemy,
                        player.reflectDamageThisTurn
                    );
                }
            }

            // 次の攻撃への一時強化は、多段攻撃を含めこの行動で消費する。
            actingEnemy._nextAttackBonus = 0;
            if (move.addWound && player.hp > 0) {
                for (let n = 0; n < move.addWound; n++) {
                    player.discardPile.push("woundStatus");
                }
            }

            if (
                move.applyStatus &&
                player.hp > 0 &&
                actingEnemy.hp > 0
            ) {
                addStatus(
                    player,
                    move.applyStatus.id,
                    move.applyStatus.amount || 1
                );
            }

            break;
        }

        case "block":
            actingEnemy.block +=
                modifyBlockGain(
                    actingEnemy,
                    move.value
                );

            if (move.selfBuff) {
                addStatus(actingEnemy, move.selfBuff.status, move.selfBuff.amount || 1);
            }
            if (move.applyStatus) {
                addStatus(
                    player,
                    move.applyStatus.id,
                    move.applyStatus.amount || 1
                );
            }
            break;

        case "guardAlly": {
            const allies =
                getLivingBattleEnemies()
                    .filter(unit =>
                        unit !== actingEnemy
                    );

            // 防御役は本体を最優先で守る。
            const ally =
                allies.find(unit =>
                    unit.isSummonerBoss
                ) ||
                allies.sort(
                    (a, b) =>
                        (a.block || 0) -
                        (b.block || 0)
                )[0];

            if (ally) {
                ally.block +=
                    modifyBlockGain(
                        ally,
                        move.value
                    );
            } else {
                actingEnemy.block +=
                    modifyBlockGain(
                        actingEnemy,
                        move.value
                    );
            }
            break;
        }

        case "healAlly": {
            const allies =
                getLivingBattleEnemies()
                    .filter(unit =>
                        unit !== actingEnemy
                    )
                    .filter(unit =>
                        unit.hp < unit.maxHp
                    )
                    .sort(
                        (a, b) =>
                            (a.hp / a.maxHp) -
                            (b.hp / b.maxHp)
                    );

            const ally =
                allies.find(unit =>
                    unit.isSummonerBoss
                ) ||
                allies[0];

            if (ally) {
                ally.hp = Math.min(
                    ally.maxHp,
                    ally.hp + move.value
                );
            }
            break;
        }

        case "buffAlly": {
            const allies =
                getLivingBattleEnemies()
                    .filter(unit =>
                        unit !== actingEnemy
                    );

            const ally =
                allies.find(unit =>
                    unit.isSummonerBoss
                ) ||
                allies[0];

            if (ally) {
                addStatus(
                    ally,
                    move.status || "strength",
                    move.value || 1
                );
            }
            break;
        }

        case "buffSelf":
            addStatus(
                actingEnemy,
                move.status || "strength",
                move.value || 1
            );
            break;

        case "debuffPlayer":
            addStatus(
                player,
                move.status || "vulnerable",
                move.value || 1
            );
            break;

        default:
            console.warn(
                "未対応の敵行動:",
                move.type
            );
            break;
    }
}


// ======================
// 戦闘開始
// ======================

function startBattle(type = "normal") {

    console.log("★★★ startBattle:", type);

    if (!player) {
        console.error("player が初期化されていません");
        return;
    }

    battleEnded = false;
    currentBattleType = type;

    createEnemy(type);

    if (!enemy) {
        return;
    }

    setupBossEncounter();

    player.energy = player.maxEnergy;
    player.block = 0;
    player.statuses = {};
    player.thorns = 0;
    player._intangibleDamageTaken = 0;
    player._potionTemporaryStrength = 0;
    player._potionTemporaryDexterity = 0;
    player._potionFreeCardId = null;
    player._potionFreeCardUses = 0;
    player._potionDoubleNext = 0;
    player._potionEchoReplaying = false;
    player._potionChaosCosts = {};
    player.confusionCosts = {};
    player.chainCount = 0;
    player.reflectDamageThisTurn = 0;
    player.magicDiscountUsed = false;
    player.highCostDiscountUsed = false;
    player.forbiddenTomeUsedThisTurn = false;
    player.nextTurnEnergyBonus = 0;
    player.nextTurnEnergyPenalty = 0;

    applyStartTurnStatuses(player);

    // キャラクター固有の戦闘状態
    player.rage = 0;
    player.lastElement = null;
    player._v164TwinMoonUsed = false;
    player._v164AttackSkillUsed = {attack:false,skill:false};
    player._v164BannerSpent = 0;
    player._v164BannerUsed = false;
    player._v164ThreeElements = [];
    player._v164ThreefoldUsed = false;
    player._v164EnergyKillBonus = 0;
    if (hasRelic('sixTurnIntangible')) {
        player._v164IntangibleTurns = (player._v164IntangibleTurns || 0) + 1;
    }
    player._v164TenthAttack = player._v164TenthAttack || 0;
    player._v164NextAttackBonus = 0;
    player.wizardMana = { fire: 0, lightning: 0, ice: 0 };
    closeWizardManaChoice();
    document.getElementById("wizard-spell-chant")?.remove();
    wizardSpellCasting = false;
    player.lastElementalChain = "";
    player.elementalPrismUsed = false;
    player.arcaneCompassUsedThisTurn = false;

    // 墓守：戦闘ごとの回収レリック状態
    player.graveLanternUsed = false;
    // v51: リコール等で回収したカードを、そのターンだけ0コストにする管理。
    player.freeRecoveredCardCounts = {};

    // v16：ターン/戦闘中レリック状態
    player.cardsPlayedThisTurn = 0;
    player.zeroCostDrawUsedThisTurn = false;
    player.firstAttackGuardUsed = false;
    player.glassBeadTriggered = false;
    player.lastCardType = null;

    // v19 スキルツリー戦闘状態
    player.firstChainSkillEnergyUsed = false;
    player.sameElementDrawUsedThisTurn = false;
    player.sameElementStreak = 0;
    player.highMagicDiscountUsedThisTurn = false;
    player.highMagicDrawUsedThisTurn = false;
    player.firstEnergyGainBonusUsedThisTurn = false;
    player.firstHeavyAttackUsed = false;
    player.recoveredCardsThisTurn = 0;

    player.hand = [];
    player.discardPile = [];
    player.exhaustPile = [];
    player.drawPile = shuffle([
        ...player.starterDeck
    ]);

    // 葬送の鐘：戦闘開始時、山札から2枚を捨て札へ。
    if (hasRelic("funeralBell")) {
        for (let i = 0; i < 2 && player.drawPile.length > 0; i++) {
            const index = Math.floor(Math.random() * player.drawPile.length);
            const [cardId] = player.drawPile.splice(index, 1);
            player.discardPile.push(cardId);
        }
    }

    // 墓土の小瓶：最初から捨て札を2枚用意する。
    if (hasRelic("graveDust")) {
        player.discardPile.push("strike", "strike");
    }

    const skillStartDiscard =
        player?.skillBonus?.startDiscard || 0;

    for (
        let i = 0;
        i < skillStartDiscard &&
        player.drawPile.length > 0;
        i++
    ) {
        const index =
            Math.floor(
                Math.random() *
                player.drawPile.length
            );

        const [cardId] =
            player.drawPile.splice(index, 1);

        player.discardPile.push(cardId);
    }

    let drawAmount = 5;

    // 勇者の紋章：初期ドロー +1、闘志 +1
    if (hasRelic("hero")) {
        drawAmount += 1;
        gainRage(1);
    }

    // 戦太鼓：闘志 +1
    if (hasRelic("warDrum")) {
        gainRage(3);
    }

    if (hasRelic("rageReservoir")) {
        gainRage(1);
    }

    // 狩人の羽根：戦闘開始時エナジー +1
    if (hasRelic("hunterFeather")) {
        player.energy += 1;
    }

    // 通常レリック
    if (hasRelic('metalBoots')) addStatus(player, 'metallicize', 3, {ignoreResistance:true});
    if (hasRelic('bossHealing') && currentBattleType === 'boss') healPlayer(25);
    if (hasRelic('woodMask') || hasRelic('frailEye')) {
        battleEnemies.forEach(unit => {
            if (hasRelic('woodMask')) addStatus(unit, 'weak', 2);
            if (hasRelic('frailEye')) addStatus(unit, 'vulnerable', 1);
        });
    }
    if (hasRelic("sharpenedWhetstone")) addStatus(player,"strength",1,{ignoreResistance:true});
    if (hasRelic("thornMail")) { addStatus(player,"thorns",2,{ignoreResistance:true}); player.thorns = getStatus(player,"thorns"); }
    if (hasRelic('sixTurnIntangible') && (player._v164IntangibleTurns || 0) % 6 === 0) {
        addStatus(player, 'intangible', 1, {ignoreResistance:true});
        player._intangibleDamageTaken = 0;
    }
    if (hasRelic("stoneCharm")) {
        player.block += 10;
    }

    if (hasRelic("scoutLens")) {
        drawAmount += 1;
    }



    // v33 状態系レリック
    if (hasRelic("warSigil")) addStatus(player, "strength", 2, { ignoreResistance:true });
    if (hasRelic("fortressHeart")) addStatus(player, "fortress", 4, { ignoreResistance:true });
    if (hasRelic("wardCharm")) addStatus(player, "artifact", 1, { ignoreResistance:true });
    if (hasRelic("livingMoss")) addStatus(player, "regeneration", 3, { ignoreResistance:true });

    applyStartTurnStatuses(player);
    battleEnemies.forEach(unit => applyStartTurnStatuses(unit));

    // v31 通常レリック
    if (hasRelic("echoCrystal")) {
        drawAmount += 1;
    }

    if (hasRelic("cursedHourglass")) {
        drawAmount += 1;
    }

    if (hasRelic("guardianShell")) {
        player.block += 8;
    }

    // スキルツリー効果
    const skillBonus = player.skillBonus || {};

    player.energy += skillBonus.startEnergy || 0;
    player.block += skillBonus.startBlock || 0;
    drawAmount += skillBonus.extraDraw || 0;

    updatePlayerUI();
    updateEnemyUI();
    drawCards(drawAmount);

    // 尽きない火花：毎戦闘の最初の手札に一時デバフを1枚だけ追加。
    if (hasRelic("endlessSpark")) {
        player.hand.push("overheatStatus");
        renderHand();
    }

    if (typeof saveRunState === "function") {
        saveRunState();
    }
}


// ======================
// 敵生成
// ======================

function createEnemy(type = "normal") {

    console.log("★★★ createEnemy:", type);

    let enemyList = Object.values(enemies)
        .filter(enemyData => enemyData.type === type);

    // v81：ボスは固定階層制にしない。
    // type === "boss" の5体すべてが候補。
    // 深度差は共通のHP / 行動値補正で吸収する。

    if (enemyList.length === 0) {

        console.error(
            "指定された種類の敵が存在しません:",
            type
        );

        enemy = null;
        return;
    }

    let baseEnemy;

    // v86 DEBUG MODE: デバッグパネルから敵IDを指定した時だけ直接生成。
    const forcedEnemyId =
        window.__debugForcedEnemyId || null;

    if (
        forcedEnemyId &&
        enemies[forcedEnemyId] &&
        enemies[forcedEnemyId].type === type
    ) {
        baseEnemy = enemies[forcedEnemyId];
        window.__debugForcedEnemyId = null;
        console.log("🧪 DEBUG forced enemy:", forcedEnemyId);
    } else {
        baseEnemy = enemyList[
            Math.floor(
                Math.random() * enemyList.length
            )
        ];
    }

    // v112: encounterGroup を持つ通常敵は複数体編成で開始する。
    if (
        Array.isArray(baseEnemy.encounterGroup) &&
        baseEnemy.encounterGroup.length > 0
    ) {
        const moveOffsets =
            Array.isArray(baseEnemy.encounterMoveOffsets)
                ? baseEnemy.encounterMoveOffsets
                : [];

        battleEnemies =
            baseEnemy.encounterGroup
                .map(enemyId => enemies[enemyId])
                .filter(Boolean)
                .map((enemyData, index) => {
                    const unit = initializeBattleUnit(
                        enemyData,
                        {
                            displayScale:
                                enemyData.displayScale ?? 0.82
                        }
                    );

                    if (unit.moves.length > 0) {
                        unit.moveIndex =
                            Math.max(
                                0,
                                Number(moveOffsets[index] || 0)
                            ) % unit.moves.length;

                        unit.nextMove =
                            unit.moves[unit.moveIndex] || unit.moves[0];
                    }

                    return unit;
                });

        selectedEnemyIndex = 0;
        syncSelectedEnemy();
        return;
    }

    enemy = structuredClone(baseEnemy);

    // v162: 単体戦も基本データをそのまま使用する。
    enemy.hp = enemy.maxHp;
    enemy.block = 0;
    enemy.moveIndex = 0;
    enemy.openingMoveUsed = false;
    enemy.specialTriggered = false;
    enemy.passiveTriggered = false;
    enemy.phaseLabel = "";
    enemy.specialNotice = "";
    enemy.statuses = { ...(enemy.initialStatuses || {}) };
    enemy.nextMove = enemy.openingMove || enemy.moves[0];
    battleEnemies = [enemy];
    selectedEnemyIndex = 0;
}

// 将来の複数敵編成用。敵データの配列を渡せば同じ戦闘UIで扱える。
function setBattleEnemyGroup(enemyUnits) {
    battleEnemies = (enemyUnits || []).filter(Boolean);
    selectedEnemyIndex = 0;
    syncSelectedEnemy();
    if (typeof updateEnemyUI === "function") updateEnemyUI();
    if (typeof renderHand === "function") renderHand();
}


// ======================
// シャッフル
// ======================

function shuffle(array) {

    for (let i = array.length - 1; i > 0; i--) {

        const j = Math.floor(
            Math.random() * (i + 1)
        );

        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}


// ======================
// ドロー
// ======================

function drawCards(amount) {

    for (let i = 0; i < amount; i++) {

        if (player.drawPile.length === 0) {

            player.drawPile = shuffle([
                ...player.discardPile
            ]);

            player.discardPile = [];
        }

        if (player.drawPile.length === 0) {
            break;
        }

        const cardId = player.drawPile.pop();
        player.hand.push(cardId);
    }

    renderHand();

    if (amount > 0 && typeof playSe === "function") {
        playSe("draw", 0.24);
    }
}



function clearDefeatedEnemyEffects(unit) {
    if (!unit || unit === player) return;

    if (!unit._runDefeatCounted && hasRelic('victoryCrown') && (player._v164EnergyKillBonus || 0) < 2) {
        player._v164EnergyKillBonus = (player._v164EnergyKillBonus || 0) + 1;
        player.energy += 1;
    }
    if (!unit._runDefeatCounted) {
        unit._runDefeatCounted = true;
        const stats = ensureRunStats();
        if (stats) {
            stats.enemiesDefeated += 1;
        }
    }

    unit.block = 0;
    unit.statuses = {};

    // 戦闘中だけ有効な一時状態
    unit.thorns = 0;
    unit.thornActive = false;
    unit.thornPending = false;
    unit.thornVisualActive = false;

    unit.summonPending = false;
    unit.summonDelay = 0;

    unit.splitPending = false;

    unit.specialNotice = "";
    unit.nextMove = null;
}

// ======================
// ダメージ
// ======================

function flushReactiveArmor(unit) {
    if (!unit || !(unit._reactivePending > 0)) return;
    const gained = modifyBlockGain(unit, unit._reactivePending);
    unit.block = (unit.block || 0) + gained;
    unit._reactivePending = 0;
    if (typeof showFloatingCombatText === "function") showFloatingCombatText("enemy", `+${gained} BLOCK`, "block");
}

function dealDamage(target, damage) {

    if (!target || damage <= 0) {
        return;
    }

    const blocked = Math.min(
        target.block || 0,
        damage
    );

    target.block =
        Math.max(0, (target.block || 0) - blocked);

    let hpDamage = damage - blocked;
    if (target === player && hpDamage > 0 && hpDamage <= 5 && hasRelic('lowDamageShield')) hpDamage = 1;
    // A single attack card cannot deal less than 5 HP damage when the seal is held.
    if (target !== player && hpDamage > 0 && hpDamage <= 4 && hasRelic('smallHitSeal') && player._v164ActiveAttackCard) hpDamage = 5;
    if (target === player && getStatus(player, "intangible") > 0) {
        hpDamage = Math.min(hpDamage, Math.max(0, 1 - (player._intangibleDamageTaken || 0)));
        player._intangibleDamageTaken = (player._intangibleDamageTaken || 0) + hpDamage;
    }
    const beforeHp = target.hp;

    if (hpDamage > 0) {

        target.hp = Math.max(
            0,
            target.hp - hpDamage
        );
    }

    const actualHpDamage =
        Math.max(0, beforeHp - target.hp);

    const targetName = target === player ? "player" : "enemy";

    if (typeof playSe === "function") {
        // v34.13: HP減少時の追加SEは鳴らさない。
        // 攻撃カード側の斬撃SEなどと二重に聞こえるのを防ぐ。
        if (actualHpDamage <= 0 && blocked > 0) {
            playSe("block", 0.78);
        }
    }

    if (blocked > 0 && typeof showFloatingCombatText === "function") {
        showFloatingCombatText(
            targetName,
            `🛡 ${blocked}`,
            "block"
        );
    }

    if (actualHpDamage > 0) {

        if (typeof showFloatingCombatText === "function") {
            showFloatingCombatText(
                targetName,
                `-${actualHpDamage}`,
                "damage"
            );
        }

        if (typeof triggerBattleTargetEffect === "function") {
            triggerBattleTargetEffect(targetName, "hit");
        }
    } else if (
        blocked > 0 &&
        typeof triggerBattleTargetEffect === "function"
    ) {
        triggerBattleTargetEffect(targetName, "block");
    }

    // v33 鉄壁：HPまで攻撃が通ったヒット1回につき1減少。
    if (actualHpDamage > 0 && getStatus(target, "fortress") > 0) {
        setStatus(target, "fortress", getStatus(target, "fortress") - 1);
    }

    if (actualHpDamage > 0) {
        handleBossDamageEvent(
            target,
            actualHpDamage,
            beforeHp
        );
    }

    if (
        target !== player &&
        target.hp <= 0
    ) {
        clearDefeatedEnemyEffects(target);
    }

    // 不死鳥の羽根：1ランに1回だけ50%で復活。
    if (target === player && player.hp <= 0 && hasRelic("phoenixPlume") && !player.phoenixPlumeUsed) {
        player.phoenixPlumeUsed = true;
        player.hp = Math.max(1, Math.floor(player.maxHp * 0.5));
        if (typeof showRelicTrigger === "function") showRelicTrigger("phoenixPlume", `HP ${player.hp}で復活`);
    }

    // ひび割れた玻璃玉：初めて50%以下になった瞬間に2ドロー。
    if (
        target === player &&
        !player.glassBeadTriggered &&
        hasRelic("glassBead") &&
        player.hp > 0 &&
        beforeHp > player.maxHp * 0.5 &&
        player.hp <= player.maxHp * 0.5
    ) {
        player.glassBeadTriggered = true;

        if (typeof showRelicTrigger === "function") {
            showRelicTrigger("glassBead", "カードを2枚引く");
        }

        drawCards(2);
    }
}


// ======================
// カードコスト
// ======================

function getCardCost(card) {

    if (!card) {
        return Infinity;
    }

    let cost = card.cost;
    if (player?._potionFreeCardId === card.id && (player?._potionFreeCardUses || 0) > 0) return 0;

    // v51: リコール等で捨て札から回収したカードは、そのターンだけ0コスト。
    if (
        selectedCharacter === "gravekeeper" &&
        (player?.freeRecoveredCardCounts?.[card.id] || 0) > 0
    ) {
        return 0;
    }

    // v31 禁忌の書：各ターン最初のスキルだけ-1コスト。
    if (
        hasRelic("forbiddenTome") &&
        card.cost > 0 &&
        !player.forbiddenTomeUsedThisTurn
    ) {
        cost = Math.max(0, cost - 1);
    }

    // 壊れかけの蓄電器
    if (
        hasRelic("crackedCapacitor") &&
        card.cost >= 2 &&
        !player.highCostDiscountUsed
    ) {
        cost = Math.max(0, cost - 1);
    }

    // 魔導書
    if (
        hasRelic("magicBook") &&
        card.magic &&
        !player.magicDiscountUsed
    ) {
        cost = Math.max(0, cost - 1);
    }

    // 三拍子の指輪：各ターン3枚目のカードを-1コスト。
    if (
        hasRelic("echoRing") &&
        (player.cardsPlayedThisTurn || 0) === 2
    ) {
        cost = Math.max(0, cost - 1);
    }

    // v19 戦士：5枚目のカードを軽減。
    if (
        selectedCharacter === "warrior" &&
        (player.cardsPlayedThisTurn || 0) === 4 &&
        (player?.skillBonus?.fifthCardDiscount || 0) > 0
    ) {
        cost = Math.max(
            0,
            cost -
            player.skillBonus.fifthCardDiscount
        );
    }

    // v19 魔法使い：各ターン最初の高コスト魔法を軽減。
    if (
        selectedCharacter === "wizard" &&
        card.magic &&
        card.cost >= 2 &&
        !player.highMagicDiscountUsedThisTurn &&
        (player?.skillBonus?.firstHighMagicDiscount || 0) > 0
    ) {
        cost = Math.max(
            0,
            cost -
            player.skillBonus.firstHighMagicDiscount
        );
    }

    if (getStatus(player, "confusion") > 0) {
        if (!player.confusionCosts) player.confusionCosts = {};
        if (typeof player.confusionCosts[card.id] !== "number") {
            player.confusionCosts[card.id] = Math.floor(Math.random() * 5);
        }
        cost = player.confusionCosts[card.id];
    }

    if (typeof player?._potionChaosCosts?.[card.id] === "number") cost = player._potionChaosCosts[card.id];
    return cost;
}


// ======================
// カード使用
// ======================

// v143 - 魔法使い：属性魔力と選択式大魔法
const WIZARD_MANA_TYPES = ["fire", "lightning", "ice"];
const WIZARD_MANA_LABEL_MAP = {
    none: "無属性",
    fire: "炎魔力",
    lightning: "雷魔力",
    ice: "氷魔力"
};

function getWizardSpellChant(card, selected) {
    if (!card || typeof card !== "object") {
        return "―― 理よ、我が意志に応えよ ――";
    }

    const chants = card.spellChants || {};
    return (
        chants[selected] ||
        chants.none ||
        "―― 理よ、我が意志に応えよ ――"
    );
}

function buildWizardSpellOverlay(card, selected) {
    const chant = getWizardSpellChant(card, selected);
    const subtitle =
        selected === "none"
            ? "基本発動"
            : `${WIZARD_MANA_LABEL_MAP[selected]}を解放`;
    const spellName = card?.name || "大魔法";
    const spellReading = card?.spellReading || "";

    return `
        <div class="wizard-spell-glow"></div>
        <div class="wizard-spell-panel">
            <div class="wizard-spell-chantline">${chant}</div>
            ${spellReading ? `<div class="wizard-spell-reading">${spellReading}</div>` : ""}
            <div class="wizard-spell-name">${spellName}</div>
            <div class="wizard-spell-subtitle">${subtitle}</div>
        </div>
        <div class="wizard-spell-burst"></div>
    `;
}

const WIZARD_MANA_LABELS = {
    fire: "🔥 炎", lightning: "⚡ 雷", ice: "❄️ 氷"
};
let wizardSpellCasting = false;

function ensureWizardMana() {
    if (!player) return { fire: 0, lightning: 0, ice: 0 };
    if (!player.wizardMana || typeof player.wizardMana !== "object") {
        player.wizardMana = {};
    }
    for (const kind of WIZARD_MANA_TYPES) {
        player.wizardMana[kind] = Math.max(0, Number(player.wizardMana[kind]) || 0);
    }
    return player.wizardMana;
}

function closeWizardManaChoice() {
    document.getElementById("wizard-mana-choice")?.remove();
}

function openWizardManaChoice(index, card) {
    if (wizardSpellCasting || battleEnded) return;
    closeWizardManaChoice();
    const mana = ensureWizardMana();
    const cost = card.manaCost;
    const overlay = document.createElement("div");
    overlay.id = "wizard-mana-choice";
    overlay.className = "wizard-mana-modal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "魔力の選択");
    const options = [
        `<button type="button" data-mana="none" class="wizard-mana-option">魔力なし<span>基本効果のみ</span></button>`,
        ...WIZARD_MANA_TYPES.map(kind => {
            const available = mana[kind] >= cost;
            return `<button type="button" data-mana="${kind}" class="wizard-mana-option" ${available ? "" : "disabled"}>${WIZARD_MANA_LABELS[kind]}<span>${mana[kind]} / 必要${cost}${available ? " 消費" : "（不足）"}</span></button>`;
        })
    ];
    overlay.innerHTML = `<div class="wizard-mana-dialog"><div class="wizard-mana-eyebrow">ARCANE SELECTION</div><h2>${card.name}</h2><p>消費する属性魔力を選択</p><div class="wizard-mana-grid">${options.join("")}</div><button class="wizard-mana-cancel" type="button">キャンセル</button></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector(".wizard-mana-cancel").addEventListener("click", closeWizardManaChoice);
    overlay.addEventListener("click", ev => { if (ev.target === overlay) closeWizardManaChoice(); });
    overlay.querySelectorAll("[data-mana]").forEach(button => button.addEventListener("click", () => {
        const selected = button.dataset.mana;
        closeWizardManaChoice();
        castWizardGreatSpell(index, card, selected);
    }));
}

function castWizardGreatSpell(index, card, selected) {
    if (wizardSpellCasting || battleEnded || !player || player.hand[index] !== card.id) return;
    if (selected !== "none" && !WIZARD_MANA_TYPES.includes(selected)) return;
    if (selected !== "none" && ensureWizardMana()[selected] < card.manaCost) return;
    if (player.energy < getCardCost(card)) return;
    wizardSpellCasting = true;
    const overlay = document.createElement("div");
    overlay.id = "wizard-spell-chant";
    overlay.className = `wizard-spell-chant fx-${selected}`;
    overlay.innerHTML = buildWizardSpellOverlay(card, selected);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add("is-casting"));

    // 基本テンポは従来のまま。将来 voiceDuration をカード側に設定すれば
    // 長いボイスだけ演出時間を伸ばせる。
    const castDuration = Math.max(
        1250,
        Number(card.voiceDuration) || 0
    );
    const burstAt = Math.max(
        800,
        castDuration - 450
    );

    window.setTimeout(() => {
        if (overlay.isConnected) overlay.classList.add("is-burst");
    }, burstAt);

    window.setTimeout(() => {
        overlay.remove();
        wizardSpellCasting = false;
        if (!battleEnded && player?.hand[index] === card.id) {
            playCard(index, selected);
        }
    }, castDuration);
}

function playCard(index, selectedMana = null) {

    if (battleEnded || !enemy) {
        return;
    }

    const cardId = player.hand[index];
    const card = cards[cardId];

    if (!card) {
        console.error("カードが存在しません:", cardId);
        return;
    }

    if (card.unplayable || wizardSpellCasting) {
        return;
    }

    if (card.manaSpell && selectedCharacter === "wizard" && selectedMana === null) {
        if (player.energy >= getCardCost(card)) openWizardManaChoice(index, card);
        return;
    }
    if (card.manaSpell && selectedCharacter === "wizard") {
        if (selectedMana !== "none" && !WIZARD_MANA_TYPES.includes(selectedMana)) return;
        if (selectedMana !== "none" && ensureWizardMana()[selectedMana] < card.manaCost) return;
    }

    const cost = getCardCost(card);

    if (player.energy < cost) {
        return;
    }

    // v109: 全てのプレイ可能カードに使用SEを割り当てる。
    // 以前は通常の「スラッシュ」以外の攻撃カードが無音だった。
    if (typeof playSe === "function") {
        if ((card.heal || 0) > 0) {
            playSe("heal", 0.88);
        } else if (card.type === "attack") {
            playSe("slash", 0.96);
        } else if ((card.block || 0) > 0) {
            playSe("guardReady", 0.92);
        } else {
            playSe("cardPlay", 0.58);
        }
    }

    const blockBeforeCard =
        player.block || 0;

    const previousElement =
        player.lastElement;

    const sameElementBeforePlay =
        Boolean(
            selectedCharacter === "wizard" &&
            card.element &&
            previousElement === card.element
        );

    if (typeof triggerCardCastEffect === "function") {
        triggerCardCastEffect(card);
    }

    if (
        hasRelic("crackedCapacitor") &&
        card.cost >= 2 &&
        !player.highCostDiscountUsed
    ) {
        player.highCostDiscountUsed = true;
    }

    if (
        hasRelic("magicBook") &&
        card.magic &&
        !player.magicDiscountUsed
    ) {
        player.magicDiscountUsed = true;
    }

    if (
        selectedCharacter === "wizard" &&
        card.magic &&
        card.cost >= 2 &&
        !player.highMagicDiscountUsedThisTurn &&
        (player?.skillBonus?.firstHighMagicDiscount || 0) > 0
    ) {
        player.highMagicDiscountUsedThisTurn = true;
    }

    const tomeDiscountApplied =
        hasRelic("forbiddenTome") &&
        card.cost > 0 &&
        !player.forbiddenTomeUsedThisTurn;

    player.energy -= cost;
    if (player._potionFreeCardId === cardId && (player._potionFreeCardUses||0)>0) {
        player._potionFreeCardUses -= 1;
        if (!player._potionFreeCardUses) player._potionFreeCardId = null;
    }

    // 実際に支払ったエナジー分だけ、そのカードの属性魔力を加算。
    // 魔力消費は加算より先に処理し、同一カードでの自給を防ぐ。
    if (selectedCharacter === "wizard") {
        const mana = ensureWizardMana();
        if (card.manaSpell && selectedMana !== "none") {
            mana[selectedMana] -= card.manaCost;
        }
        if (WIZARD_MANA_TYPES.includes(card.element)) {
            mana[card.element] += Math.max(1, (Number(card.cost) || 0) + 1);
        }
    }

    // v51: 0コスト回収枠を1枚分だけ消費。
    if (
        selectedCharacter === "gravekeeper" &&
        (player?.freeRecoveredCardCounts?.[cardId] || 0) > 0
    ) {
        player.freeRecoveredCardCounts[cardId] -= 1;

        if (player.freeRecoveredCardCounts[cardId] <= 0) {
            delete player.freeRecoveredCardCounts[cardId];
        }
    }

    if (tomeDiscountApplied) {
        player.forbiddenTomeUsedThisTurn = true;
    }

    if (
        hasRelic("echoRing") &&
        (player.cardsPlayedThisTurn || 0) === 2 &&
        card.cost > cost &&
        typeof showRelicTrigger === "function"
    ) {
        showRelicTrigger("echoRing", "3枚目のカード -1コスト");
    }

    // 戦士：闘志条件を満たす場合だけ消費して強化。
    let rageTriggered = false;
    player._v164TenthAttackDoubleActive = hasRelic('tenthSlash') &&
        card.type === 'attack' && ((player._v164TenthAttack || 0) + 1) % 10 === 0;

    if (
        selectedCharacter === "warrior" &&
        card.rageCost &&
        (player.rage || 0) >= card.rageCost
    ) {
        rageTriggered = spendRage(card.rageCost);
    }

    // 魔法使い：属性連鎖をカード解決前に確定。
    const elementalChain =
        getElementalChainEffect(card);

    let extraDamage = 0;
    let extraBlock = 0;
    let extraDraw = 0;

    const skillBonus =
        player?.skillBonus || {};

    // ===== v22 アンロックレリック =====

    if (
        card.type === "attack" &&
        hasRelic("duelistRibbon") &&
        (player.attacksPlayedThisTurn || 0) === 0
    ) {
        extraDamage += 3;
    }

    if (
        card.type === "attack" &&
        hasRelic("guardedPommel") &&
        (player.attacksPlayedThisTurn || 0) === 0
    ) {
        player.block += 4;

        if (typeof showRelicTrigger === "function") {
            showRelicTrigger(
                "guardedPommel",
                "+4ブロック"
            );
        }
    }

    if (
        card.type === "attack" &&
        card.element === "fire" &&
        hasRelic("emberLens")
    ) {
        extraDamage += 3;
    }

    if (
        card.type === "skill" &&
        card.element === "ice" &&
        hasRelic("frostBead")
    ) {
        extraBlock += 4;
    }

    if (
        card.type === "attack" &&
        card.cost >= 2 &&
        hasRelic("heavySpring")
    ) {
        extraDamage += 4;
    }

    if (
        card.type === "attack" &&
        selectedCharacter === "gravekeeper" &&
        (player.discardPile?.length || 0) >= 6 &&
        hasRelic("graveMarker")
    ) {
        extraDamage += 4;
    }

    // ===== v19 戦士 =====
    if (
        selectedCharacter === "warrior" &&
        card.type === "attack"
    ) {
        if (
            player.hp <= player.maxHp * 0.5
        ) {
            extraDamage +=
                skillBonus.lowHpAttackBonus || 0;
        }

        if (
            (player.cardsPlayedThisTurn || 0) === 2
        ) {
            extraDamage +=
                skillBonus.thirdCardAttackBonus || 0;
        }

        if (
            (player.cardsPlayedThisTurn || 0) >= 4
        ) {
            extraDamage +=
                skillBonus.lateComboAttackBonus || 0;
        }

        player.block +=
            skillBonus.attackCardBlock || 0;
    }

    // ===== v19 魔法使い =====
    if (
        selectedCharacter === "wizard" &&
        card.element &&
        sameElementBeforePlay
    ) {
        extraBlock +=
            skillBonus.sameElementBlock || 0;

        if (card.type === "attack") {
            extraDamage +=
                skillBonus.sameElementAttackBonus || 0;
        }

        if (
            !player.sameElementDrawUsedThisTurn &&
            (skillBonus.sameElementFirstDraw || 0) > 0
        ) {
            extraDraw +=
                skillBonus.sameElementFirstDraw;

            player.sameElementDrawUsedThisTurn = true;
        }
    }

    if (
        selectedCharacter === "wizard" &&
        card.magic &&
        card.cost >= 2 &&
        card.type === "attack"
    ) {
        extraDamage +=
            skillBonus.highCostMagicAttackBonus || 0;
    }

    // ===== v19 機工士 =====
    if (
        selectedCharacter === "machinist" &&
        card.type === "attack" &&
        card.cost >= 2
    ) {
        extraDamage +=
            skillBonus.highCostAttackBonus || 0;

        if (card.cost >= 3) {
            extraDamage +=
                skillBonus.veryHighCostAttackBonus || 0;

            if (
                !player.firstHeavyAttackUsed
            ) {
                extraDamage +=
                    skillBonus.firstHeavyAttackBonus || 0;

                player.firstHeavyAttackUsed = true;
            }

            player.block +=
                skillBonus.heavyAttackBlock || 0;
        }
    }

    // 連撃の護符：スキル→攻撃で追加ダメージ。
    if (
        card.type === "attack" &&
        hasRelic("comboCharm") &&
        player.lastCardType === "skill"
    ) {
        extraDamage += 4;

        if (typeof showRelicTrigger === "function") {
            showRelicTrigger("comboCharm", "+4ダメージ");
        }
    }

    if (card.type === 'attack' && hasRelic('overloadHeart') && player._v164NextAttackBonus > 0) {
        extraDamage += player._v164NextAttackBonus;
        player._v164NextAttackBonus = 0;
    }
    if (card.type === 'attack' && hasRelic('tenthSlash') && ((player._v164TenthAttack || 0) + 1) % 10 === 0) {
        // Multiplication is applied later, once to the whole card (not once per hit).
        player._v164TenthAttackDoubleActive = true;
    } else player._v164TenthAttackDoubleActive = false;
    // 血珀：HP50%以下で攻撃強化。
    if (
        card.type === "attack" &&
        hasRelic("bloodAmber") &&
        player.hp <= player.maxHp * 0.5
    ) {
        extraDamage += 3;
    }

    // 双生の魔印：同じ属性を連続使用で防御。
    if (
        selectedCharacter === "wizard" &&
        card.element &&
        player.lastElement === card.element &&
        hasRelic("twinSigil")
    ) {
        extraBlock += 4;

        if (typeof showRelicTrigger === "function") {
            showRelicTrigger("twinSigil", "+4ブロック");
        }
    }

    // 墓守：現在の捨て札枚数を攻撃・防御へ変換する。
    const discardCount = player.discardPile.length;
    const discardScale = Math.min(
        discardCount,
        card.discardScalingCap ?? discardCount
    );

    if (card.damagePerDiscard) {
        extraDamage +=
            discardScale *
            (
                card.damagePerDiscard +
                (
                    selectedCharacter === "gravekeeper"
                        ? (skillBonus.discardScalingBonus || 0)
                        : 0
                )
            );
    }

    if (card.blockPerDiscard) {
        extraBlock +=
            discardScale *
            (
                card.blockPerDiscard +
                (
                    selectedCharacter === "gravekeeper"
                        ? (skillBonus.discardScalingBonus || 0)
                        : 0
                )
            );
    }

    if (
        selectedCharacter === "gravekeeper" &&
        card.type === "attack" &&
        discardCount >= 8
    ) {
        extraDamage +=
            skillBonus.discardThresholdAttackBonus || 0;
    }

    if (
        selectedCharacter === "gravekeeper" &&
        card.type === "attack" &&
        discardCount >= 10
    ) {
        extraDamage +=
            skillBonus.deepDiscardAttackBonus || 0;
    }

    if (
        selectedCharacter === "gravekeeper" &&
        card.type === "skill" &&
        discardCount >= 6
    ) {
        extraBlock +=
            skillBonus.discardThresholdSkillBlock || 0;
    }

    // v33 各キャラの固有リソース・フィニッシャー
    if (card.rageScaling) {
        extraDamage += Math.min((player.rage || 0) * card.rageScaling, card.rageScalingCap || Infinity);
    }
    if (card.chainScaling) {
        extraDamage += Math.min((player.chainCount || 0) * card.chainScaling, card.chainScalingCap || Infinity);
    }
    if (card.recoilScaling) {
        const pressure = (player.nextTurnEnergyBonus || 0) + (player.nextTurnEnergyPenalty || 0) + getStatus(player, "overcharge") + getStatus(player, "leakage");
        extraDamage += Math.min(pressure * card.recoilScaling, card.recoilScalingCap || Infinity);
    }
    if (card.discardFinisherScaling) {
        extraDamage += Math.min(discardCount * card.discardFinisherScaling, card.discardFinisherCap || Infinity);
    }

    if (rageTriggered) {
        extraDamage +=
            (card.rageBonusDamage || 0) +
            (
                card.type === "attack"
                    ? (skillBonus.rageSpendAttackBonus || 0)
                    : 0
            );

        extraBlock += card.rageBonusBlock || 0;
        extraDraw += card.rageBonusDraw || 0;
    }

    if (elementalChain.triggered) {
        extraDamage += elementalChain.damage;
        extraBlock += elementalChain.block;
        extraDraw += elementalChain.draw;

        player.lastElementalChain = elementalChain.label;
        player.chainCount = (player.chainCount || 0) + 1;

        // v19：各ターン最初の属性連鎖でエナジー。
        if (
            !player.firstChainSkillEnergyUsed &&
            (skillBonus.firstChainEnergy || 0) > 0
        ) {
            player.energy +=
                skillBonus.firstChainEnergy;

            player.firstChainSkillEnergyUsed = true;
        }

        // 三色の欠片：各戦闘で最初の属性連鎖時に+1エナジー
        if (
            hasRelic("prismShard") &&
            !player.elementalPrismUsed
        ) {
            player.energy += 1;
            player.elementalPrismUsed = true;

            if (typeof showRelicTrigger === "function") {
                showRelicTrigger("prismShard", "エナジー+1");
            }
        }

        // 秘術の羅針盤：各ターン最初の属性連鎖で1ドロー。
        if (
            hasRelic("arcaneCompass") &&
            !player.arcaneCompassUsedThisTurn
        ) {
            extraDraw += 1;
            player.arcaneCompassUsedThisTurn = true;

            if (typeof showRelicTrigger === "function") {
                showRelicTrigger("arcaneCompass", "+1ドロー");
            }
        }
    } else {
        player.lastElementalChain = "";
    }

    player._v164ActiveAttackCard = card.type === 'attack';
    switch (card.type) {

        case "attack": {

            // v143: 魔力選択式。属性なしでも基本威力で攻撃可能。
            // 範囲魔法は全ての生存敵にヒットする。
            if (card.manaSpell) {
                let bonus = 0;
                let repeat = 1;
                if (selectedMana === "fire") bonus = card.aoe ? 14 : 12;
                if (selectedMana === "lightning") {
                    if (card.aoe) bonus = 6;
                    else repeat = 2;
                }
                if (selectedMana === "ice") player.block += 12;
                if (selectedMana === "lightning" && card.aoe) extraDraw += 1;
                const targets = card.aoe
                    ? getLivingBattleEnemies().slice()
                    : [enemy];
                for (const target of targets) {
                    for (let hit = 0; hit < repeat && target.hp > 0; hit++) {
                        const raw = (card.damage || 0) + bonus +
                            (hit === 0 ? extraDamage : 0);
                        dealDamage(target, modifyAttackDamage(player, target, raw) * (player._v164TenthAttackDoubleActive ? 2 : 1));
                        if (target.hp > 0 && (target.thorns || 0) > 0) {
                            dealDamage(player, target.thorns);
                        }
                        if (target.hp > 0 && getStatus(target, "reactiveArmor") > 0) {
                            target._reactivePending = (target._reactivePending || 0) + getStatus(target, "reactiveArmor");
                            setStatus(target, "reactiveArmor", getStatus(target, "reactiveArmor") + 1);
                        }
                        triggerEnemyPassiveAfterHit(target);
                    }
                }
                break;
            }

            if (
                hasRelic("guardianCoin") &&
                !player.firstAttackGuardUsed
            ) {
                player.block += 5;
                player.firstAttackGuardUsed = true;

                if (typeof showRelicTrigger === "function") {
                    showRelicTrigger("guardianCoin", "+5ブロック");
                }
            }

            // v146: 汎用範囲攻撃（魔力式の大魔法は上の専用処理）。
            // 闘志消費・捨て札補正・筋力などを敵ごとに適用する。
            if (card.aoe) {
                const targets = getLivingBattleEnemies().slice();
                const bonus = (hasRelic("crimsonCrown") ? 4 : 0) +
                    0;
                const hits = card.hits || 1;
                for (const target of targets) {
                    for (let hit = 0; hit < hits && target.hp > 0; hit++) {
                        const raw = (card.damage || 0) + bonus +
                            (hit === 0 ? extraDamage : 0);
                        dealDamage(target, modifyAttackDamage(player, target, raw) * (player._v164TenthAttackDoubleActive ? 2 : 1));
                        if (target.hp > 0 && (target.thorns || 0) > 0) {
                            dealDamage(player, target.thorns);
                        }
                        if (target.hp > 0 && getStatus(target, "reactiveArmor") > 0) {
                            target._reactivePending = (target._reactivePending || 0) + getStatus(target, "reactiveArmor");
                            setStatus(target, "reactiveArmor", getStatus(target, "reactiveArmor") + 1);
                        }
                        triggerEnemyPassiveAfterHit(target);
                    }
                }
                targets.forEach(flushReactiveArmor);
                break;
            }

            const hits = card.hits || 1;

            for (let i = 0; i < hits; i++) {

                if (enemy.hp <= 0) {
                    break;
                }

                // 追加ダメージは多段攻撃でも合計1回分だけ。
                const bossRelicDamage =
                    hasRelic("crimsonCrown")
                        ? 4
                        : 0;

                const whetstoneDamage = 0;

                const rawDamage =
                    (card.damage || 0) +
                    bossRelicDamage +
                    whetstoneDamage +
                    (i === 0 ? extraDamage : 0);

                const damage = modifyAttackDamage(player, enemy, rawDamage) * (player._v164TenthAttackDoubleActive ? 2 : 1);
                dealDamage(enemy, damage);

                if (
                    enemy &&
                    enemy.hp > 0 &&
                    (enemy.thorns || 0) > 0
                ) {
                    dealDamage(
                        player,
                        enemy.thorns
                    );
                }

                if (
                    enemy &&
                    enemy.hp > 0 &&
                    getStatus(enemy, "reactiveArmor") > 0
                ) {
                    const reactiveBlock = getStatus(enemy, "reactiveArmor");
                    enemy._reactivePending = (enemy._reactivePending || 0) + reactiveBlock;
                    setStatus(enemy, "reactiveArmor", reactiveBlock + 1);

                    if (
                        typeof showFloatingCombatText ===
                        "function"
                    ) {
                        showFloatingCombatText(
                            "enemy",
                            `装甲蓄積 +${reactiveBlock}`,
                            "block"
                        );
                    }

                    if (
                        typeof triggerBattleTargetEffect ===
                        "function"
                    ) {
                        triggerBattleTargetEffect(
                            "enemy",
                            "block"
                        );
                    }
                }

                triggerEnemyPassiveAfterHit();
            }
            flushReactiveArmor(enemy);

            break;
        }

        case "skill": {

            player.energy += card.energy || 0;

            const buckleBlock =
                hasRelic("ironBuckle") && (card.block || 0) > 0
                    ? 3
                    : 0;

            const treeSkillBlock =
                (card.block || 0) > 0
                    ? (skillBonus.skillBlockBonus || 0)
                    : 0;

            const energySkillBlock =
                (card.energy || 0) > 0
                    ? (skillBonus.energySkillBlock || 0)
                    : 0;

            player.block += modifyBlockGain(
                player,
                (card.block || 0) +
                extraBlock +
                buckleBlock +
                treeSkillBlock +
                energySkillBlock
            );

            if (card.reflectThisTurn) {
                player.reflectDamageThisTurn = Math.max(player.reflectDamageThisTurn || 0, card.reflectThisTurn);
            }

            if (card.heal) {
                let healAmount = card.heal;

                if (
                    selectedCharacter === "warrior" &&
                    typeof card.rageHealThreshold === "number" &&
                    (player.rage || 0) >= card.rageHealThreshold
                ) {
                    healAmount += card.rageBonusHeal || 0;
                }

                healPlayer(healAmount);
            }

            break;
        }

        default:
            console.warn(
                "未対応のカードタイプ:",
                card.type
            );
            break;
    }

    // 紅蓮の王冠：攻撃カードの代償としてHPを2失う。
    if (
        card.type === "attack" &&
        hasRelic("crimsonCrown")
    ) {
        dealSelfDamage(2);
    }

    // 攻撃カードでも属性連鎖のブロックが発生する可能性に対応。
    if (card.type !== "skill" && extraBlock > 0) {
        player.block += modifyBlockGain(player, extraBlock);
    }

    // 戦士：闘志獲得。
    if (selectedCharacter === "warrior") {

        if (card.rageGain) {
            gainRage(card.rageGain);

        } else if (
            card.type === "attack" &&
            !rageTriggered
        ) {
            gainRage(
                hasRelic("bloodBanner") &&
                player.hp <= player.maxHp * 0.5
                    ? 2
                    : 1
            );

            if (
                hasRelic("bloodBanner") &&
                player.hp <= player.maxHp * 0.5 &&
                typeof showRelicTrigger === "function"
            ) {
                showRelicTrigger("bloodBanner", "追加の闘志+1");
            }
        }
    }

    if (
        selectedCharacter === "wizard" &&
        card.element === "lightning" &&
        hasRelic("stormCoil") &&
        !player.stormCoilUsedThisTurn
    ) {
        player.stormCoilUsedThisTurn = true;
        extraDraw += 1;

        if (typeof showRelicTrigger === "function") {
            showRelicTrigger(
                "stormCoil",
                "+1ドロー"
            );
        }
    }

    // 魔法使い：同属性連続回数と最後の属性を更新。
    if (
        selectedCharacter === "wizard" &&
        card.element
    ) {
        player.sameElementStreak =
            sameElementBeforePlay
                ? (player.sameElementStreak || 1) + 1
                : 1;

        if (
            player.sameElementStreak >= 3 &&
            (skillBonus.thirdSameElementPower || 0) > 0
        ) {
            if (card.type === "attack" && enemy.hp > 0) {
                dealDamage(
                    enemy,
                    skillBonus.thirdSameElementPower
                );
            }

            if (card.type === "skill") {
                player.block +=
                    skillBonus.thirdSameElementPower;
            }
        }

        if (
            card.magic &&
            card.cost >= 2 &&
            !player.highMagicDrawUsedThisTurn &&
            (skillBonus.firstHighMagicDraw || 0) > 0
        ) {
            extraDraw +=
                skillBonus.firstHighMagicDraw;

            player.highMagicDrawUsedThisTurn = true;
        }

        player.lastElement = card.element;
    }

    // 機工士：カード効果でエナジーを得る最初の1回を増幅。
    if (
        selectedCharacter === "machinist" &&
        (card.energy || 0) > 0 &&
        !player.firstEnergyGainBonusUsedThisTurn &&
        (skillBonus.firstEnergyGainBonus || 0) > 0
    ) {
        player.energy +=
            skillBonus.firstEnergyGainBonus;

        player.firstEnergyGainBonusUsedThisTurn = true;
    }

    // 機工士系の共通追加効果
    if (card.nextTurnEnergyBonus) {
        player.nextTurnEnergyBonus += card.nextTurnEnergyBonus;
    }

    if (card.nextTurnEnergyPenalty) {
        player.nextTurnEnergyPenalty += card.nextTurnEnergyPenalty;
    }

    if (card.clearEnergyPenalty) {

        const hadPenalty =
            (player.nextTurnEnergyPenalty || 0) > 0;

        player.nextTurnEnergyPenalty = 0;

        if (
            hadPenalty &&
            hasRelic("recyclerCore")
        ) {
            extraDraw += 1;

            if (typeof showRelicTrigger === "function") {
                showRelicTrigger("recyclerCore", "+1ドロー");
            }
        }
    }

    if (card.selfDamage) {
        dealSelfDamage(card.selfDamage);
    }

    // 墓守：カードを捨て札へ送る前に、以前の捨て札を回収・消費する。
    if (card.returnDiscard) {
        returnCardsFromDiscard(card.returnDiscard);
    }

    const consumed = card.consumeDiscard
        ? consumeDiscardCards(card.consumeDiscard)
        : 0;

    if (consumed > 0 && card.healPerConsumed) {
        healPlayer(consumed * card.healPerConsumed);
    }

    if (
        selectedCharacter === "warrior" &&
        (player.cardsPlayedThisTurn || 0) === 3 &&
        (skillBonus.fourthCardDraw || 0) > 0
    ) {
        extraDraw +=
            skillBonus.fourthCardDraw;
    }

    if (
        cost === 0 &&
        hasRelic("quickQuill") &&
        !player.zeroCostDrawUsedThisTurn
    ) {
        extraDraw += 1;
        player.zeroCostDrawUsedThisTurn = true;

        if (typeof showRelicTrigger === "function") {
            showRelicTrigger("quickQuill", "+1ドロー");
        }
    }

    let drawAmount =
        (card.draw || 0) +
        extraDraw +
        consumed * (card.drawPerConsumed || 0);

    player.hand.splice(index, 1);
    if (!Array.isArray(player.exhaustPile)) player.exhaustPile = [];
    if (card.exhaust) {
        player.exhaustPile.push(cardId);
        if (typeof showFloatingCombatText === "function") showFloatingCombatText("player","🔥 消滅","relic");
    } else {
        player.discardPile.push(cardId);
    }

    if (card.discardRandom) {
        const discarded = discardRandomCardsFromHand(
            card.discardRandom
        );

        if (discarded > 0) {
            player.block +=
                discarded * (card.discardBonusBlock || 0);
            player.energy +=
                discarded * (card.energyPerDiscarded || 0);
        }
    }

    if (drawAmount > 0) {
        drawCards(drawAmount);
    }

    const blockGained =
        Math.max(
            0,
            (player.block || 0) - blockBeforeCard
        );

    if (
        blockGained > 0 &&
        typeof showFloatingCombatText === "function"
    ) {
        showFloatingCombatText(
            "player",
            `+${blockGained} BLOCK`,
            "block"
        );
    }

    if (card.type === "attack") {
        player.attacksPlayedThisTurn =
            (player.attacksPlayedThisTurn || 0) + 1;
    }

    player.cardsPlayedThisTurn =
        (player.cardsPlayedThisTurn || 0) + 1;

    player._v164ActiveAttackCard = false;
    player.lastCardType = card.type;
    // v164: trigger only after a successfully played card.
    if (card.type === 'attack') {
        player._v164TenthAttack = (player._v164TenthAttack || 0) + 1;
    }
    if (card.type === 'attack' || card.type === 'skill') {
        player._v164AttackSkillUsed ||= {attack:false,skill:false};
        player._v164AttackSkillUsed[card.type] = true;
        if (hasRelic('twinMoonRing') && !player._v164TwinMoonUsed &&
            player._v164AttackSkillUsed.attack && player._v164AttackSkillUsed.skill) {
            player.block += modifyBlockGain(player,5);
            player._v164TwinMoonUsed = true;
        }
    }
    if (selectedCharacter === 'wizard' && card.element && hasRelic('threefoldOrb')) {
        player._v164ThreeElements ||= [];
        if (!player._v164ThreeElements.includes(card.element)) player._v164ThreeElements.push(card.element);
        if (!player._v164ThreefoldUsed && ['fire','lightning','ice'].every(el => player._v164ThreeElements.includes(el))) {
            const mana = ensureWizardMana();
            for (const el of ['fire','lightning','ice']) mana[el] += 2;
            player._v164ThreefoldUsed = true;
        }
    }

    checkEnemySpecialPhase();
    if (typeof updateOwnedRelicUI === 'function' && (hasRelic('tenthSlash') || hasRelic('sixTurnIntangible'))) updateOwnedRelicUI();

    updatePlayerUI();
    updateEnemyUI();
    renderHand();

    checkBattleEnd();

    if (!battleEnded && player._potionDoubleNext > 0 && !player._potionEchoReplaying) {
        player._potionDoubleNext -= 1;
        player._potionEchoReplaying = true;
        player.hand.push(cardId);
        player._potionFreeCardId = cardId;
        player._potionFreeCardUses = (player._potionFreeCardUses||0)+1;
        playCard(player.hand.length-1, card.manaSpell ? "none" : null);
        // 追加発動分は実体カードを生成しない。
        const duplicateDiscardIndex=player.discardPile.lastIndexOf(cardId);
        if (duplicateDiscardIndex>=0) player.discardPile.splice(duplicateDiscardIndex,1);
        else {
            const duplicateExhaustIndex=player.exhaustPile?.lastIndexOf(cardId) ?? -1;
            if (duplicateExhaustIndex>=0) player.exhaustPile.splice(duplicateExhaustIndex,1);
        }
        player._potionEchoReplaying = false;
    }

    if (!battleEnded && typeof saveRunState === "function") {
        saveRunState();
    }
}


// ======================
// 自傷ダメージ
// ======================

function dealSelfDamage(amount) {

    if (!player || amount <= 0) {
        return;
    }

    let finalDamage = amount;

    if (hasRelic("heatSink")) {
        finalDamage =
            Math.max(0, finalDamage - 2);
    }

    finalDamage =
        Math.max(
            0,
            finalDamage -
            (player?.skillBonus?.selfDamageReduction || 0)
        );

    // v47: 自傷ダメージもブロックで防げるようにする。
    const blocked =
        Math.min(player.block || 0, finalDamage);

    player.block =
        Math.max(
            0,
            (player.block || 0) - blocked
        );

    let hpDamage = Math.max(0, finalDamage - blocked);
    if (hasRelic("overloadHeart") && hpDamage > 0) player._v164NextAttackBonus = (player._v164NextAttackBonus || 0) + 8;

    if (getStatus(player, "intangible") > 0) {
        hpDamage = Math.min(hpDamage, Math.max(0, 1 - (player._intangibleDamageTaken || 0)));
        player._intangibleDamageTaken = (player._intangibleDamageTaken || 0) + hpDamage;
    }

    if (hpDamage > 0) {
        player.hp =
            Math.max(0, player.hp - hpDamage);
    }

    if (
        blocked > 0 &&
        typeof showFloatingCombatText === "function"
    ) {
        showFloatingCombatText(
            "player",
            `🛡 ${blocked}`,
            "block"
        );
    }

    if (
        hpDamage > 0 &&
        typeof showFloatingCombatText === "function"
    ) {
        showFloatingCombatText(
            "player",
            `-${hpDamage}`,
            "damage"
        );
    }
}


// ======================
// 敵ターン
// ======================

async function enemyTurn() {

    if (
        battleEnded ||
        enemyTurnAnimating ||
        getLivingBattleEnemies().length === 0
    ) {
        return;
    }

    enemyTurnAnimating = true;

    const endTurnButton = document.getElementById("end-turn");
    if (endTurnButton) endTurnButton.disabled = true;

    const originalSelectedIndex =
        selectedEnemyIndex;

    // 分裂・召喚で配列が途中変更されても、
    // 新しく出た敵は同じターンには行動しない。
    const turnOrder = [...battleEnemies];

    for (const actingEnemy of turnOrder) {
        if (
            !actingEnemy ||
            actingEnemy.hp <= 0 ||
            player.hp <= 0 ||
            !battleEnemies.includes(actingEnemy)
        ) {
            continue;
        }

        enemy = actingEnemy;

        if (getStatus(actingEnemy, "blockRetain") <= 0) {
            actingEnemy.block = 0;
        }

        applyStartTurnStatuses(actingEnemy);

        // トゲは「展開後の次のプレイヤーターン」だけ有効。
        // その次の敵ターン開始時に解除して通常行動へ戻る。
        if (actingEnemy.thornActive) {
            actingEnemy.thornActive = false;
            actingEnemy.thorns = 0;
            actingEnemy.thornVisualActive = false;
        }

        // 分裂はその個体の1ターンを丸ごと使う。
        if (actingEnemy.splitPending) {
            performSplit(actingEnemy);
            continue;
        }

        // 召喚予約は現在の行動をキャンセルしない。
        // 1回通常行動したあと、次回行動を召喚へ変更。
        if (
            actingEnemy.isSummonerBoss &&
            actingEnemy.summonPending &&
            actingEnemy.summonDelay <= 0
        ) {
            performSummon(actingEnemy);

            actingEnemy.nextMove =
                actingEnemy.moves[
                    actingEnemy.moveIndex
                ] ||
                actingEnemy.moves[0];

            applyEndTurnStatuses(actingEnemy);
            decayTimedStatuses(actingEnemy);
            continue;
        }

        // トゲ展開も1ターンを消費。
        if (
            actingEnemy.bossAbility?.type ===
                "thornCycle" &&
            actingEnemy.thornPending
        ) {
            actingEnemy.thornPending = false;
            actingEnemy.thornActive = true;
            actingEnemy.thorns =
                actingEnemy.bossAbility.thorns ??
                3;
            actingEnemy.thornVisualActive = true;

            const thornBlock =
                actingEnemy.bossAbility.thornBlock ??
                20;
            actingEnemy.block += thornBlock;

            actingEnemy.specialNotice =
                `${thornBlock}ブロックを得て、トゲ${actingEnemy.thorns}を展開した！`;

            actingEnemy.nextMove =
                actingEnemy.moves[
                    actingEnemy.moveIndex
                ] ||
                actingEnemy.moves[0];

            applyEndTurnStatuses(actingEnemy);
            decayTimedStatuses(actingEnemy);
            continue;
        }

        let move;
        const usingOpeningMove = Boolean(
            actingEnemy.openingMove &&
            !actingEnemy.openingMoveUsed
        );

        // openingMove は1戦につき最初の行動でだけ使用する。
        // 「1ターン目だけ儀式」などの敵に使える。
        if (usingOpeningMove) {
            move = actingEnemy.openingMove;
        } else if (
            actingEnemy.bossAbility?.type ===
            "chargeCycle"
        ) {
            // 6段階蓄積。6段階目だけ専用大技。
            refreshBossIntent(actingEnemy);
            move = actingEnemy.nextMove;
        } else {
            move =
                actingEnemy.moves[
                    actingEnemy.moveIndex
                ];
        }

        if (!move) {
            console.error(
                "敵の行動が存在しません"
            );
            continue;
        }

        await presentEnemyAction(
            actingEnemy,
            move
        );

        performStandardEnemyMove(
            actingEnemy,
            move
        );

        updatePlayerUI();
        updateEnemyUI();

        await finishEnemyAction(
            actingEnemy,
            move
        );

        if (
            actingEnemy.bossAbility?.type ===
            "chargeCycle"
        ) {
            const ability =
                actingEnemy.bossAbility;

            const maxStage =
                ability.maxStage ?? 6;

            if (
                (actingEnemy.chargeStage ?? 0) >=
                maxStage
            ) {
                actingEnemy.chargeStage = 0;
            } else {
                actingEnemy.chargeStage =
                    (actingEnemy.chargeStage ?? 0) +
                    1;

                actingEnemy.moveIndex =
                    (
                        actingEnemy.moveIndex + 1
                    ) %
                    actingEnemy.moves.length;
            }

            refreshBossIntent(actingEnemy);

        } else if (usingOpeningMove) {
            actingEnemy.openingMoveUsed = true;
            actingEnemy.moveIndex = 0;
            actingEnemy.nextMove =
                actingEnemy.moves[0] || null;
        } else {
            actingEnemy.moveIndex =
                (
                    actingEnemy.moveIndex + 1
                ) %
                actingEnemy.moves.length;

            actingEnemy.nextMove =
                actingEnemy.moves[
                    actingEnemy.moveIndex
                ];
        }

        // 子分が倒されたターンでも今の行動は通常通り。
        // この処理で「次の次」の行動が召喚になる。
        if (
            actingEnemy.isSummonerBoss &&
            actingEnemy.summonPending &&
            actingEnemy.summonDelay > 0
        ) {
            actingEnemy.summonDelay -= 1;

            if (
                actingEnemy.summonDelay <= 0
            ) {
                actingEnemy.nextMove = {
                    type: "summon",
                    label: "子分召喚"
                };
            }
        }

        applyEndTurnStatuses(actingEnemy);
        decayTimedStatuses(actingEnemy);

        // 双生体は残った側が3回行動するまでに倒せなければ復活。
        reviveTwinIfReady(actingEnemy);

        actingEnemy.specialNotice = "";

        if (player.hp <= 0) {
            break;
        }
    }

    player.reflectDamageThisTurn = 0;

    selectedEnemyIndex =
        originalSelectedIndex;

    syncSelectedEnemy();

    updatePlayerUI();
    updateEnemyUI();

    enemyTurnAnimating = false;

    if (endTurnButton) {
        endTurnButton.disabled = false;
    }

    checkBattleEnd();
}


// ======================
// ターン終了
// ======================

// v169: リアクティブアーマーは攻撃を受けたターン内だけ成長する。
// 装甲の強化値を、攻撃終了後のブロック獲得が済んだターン境界で初期値3に戻す。
function resetReactiveArmorAtTurnEnd(unit) {
    if (!unit || getStatus(unit, 'reactiveArmor') <= 0) return;
    flushReactiveArmor(unit);
    setStatus(unit, 'reactiveArmor', 3);
}

async function endTurn() {

    if (battleEnded || !enemy) {
        return;
    }

    if (typeof playSe === "function") {
        playSe("uiClick", 0.72);
    }

    // v164: end-of-turn relics resolve before the enemy acts.
    if (hasRelic('zeroBlockGuard') && (player.block || 0) === 0) player.block += modifyBlockGain(player,6);
    if (hasRelic('emptyHandScale') && player.hand.length === 0) player._v164BonusDrawNext = 2;
    if (hasRelic('energyCarry')) player._v164SavedEnergy = Math.max(0,player.energy || 0);
    // v33 出血など、プレイヤー側ターン終了状態。
    applyEndTurnStatuses(player);
    decayTimedStatuses(player);
    if (player.hp <= 0) { checkBattleEnd(); if (battleEnded) return; }

    // プレイヤーの攻撃を受けて成長した敵の装甲をターン終了時に初期化。
    if (typeof battleEnemies !== 'undefined') battleEnemies.forEach(resetReactiveArmorAtTurnEnd);

    // v31 呪い / デバフは「手札にあるときだけ」ターン終了効果を発生。
    const endingHand = [...player.hand];

    endingHand.forEach(cardId => {
        const handCard = cards[cardId];
        if (handCard?.endTurnSelfDamage) {
            dealSelfDamage(handCard.endTurnSelfDamage);
        }
    });

    endingHand.forEach(cardId => {
        const handCard = cards[cardId];
        if (handCard?.ethereal) {
            player.exhaustPile.push(cardId);
        } else {
            player.discardPile.push(cardId);
        }
    });

    player.hand = [];
    renderHand();

    checkBattleEnd();
    if (battleEnded) {
        return;
    }

    const endedWithZeroEnergy =
        player.energy === 0;

    await enemyTurn();
    // 敵からの多段攻撃に反応したプレイヤーの装甲も初期値へ。
    resetReactiveArmorAtTurnEnd(player);
    // 無形は使用したターンとその敵ターンが終わったら消える。
    removeStatus(player, "intangible");
    player._intangibleDamageTaken = 0;
    if (player._potionTemporaryStrength) {
        setStatus(player, "strength", Math.max(0, getStatus(player, "strength") - player._potionTemporaryStrength));
        player._potionTemporaryStrength = 0;
    }
    if (player._potionTemporaryDexterity) {
        setStatus(player, "dexterity", Math.max(0, getStatus(player, "dexterity") - player._potionTemporaryDexterity));
        player._potionTemporaryDexterity = 0;
    }
    if (battleEnded) {
        return;
    }

    const retainedBlock =
        getStatus(player, "blockRetain") > 0
            ? (player.block || 0)
            : Math.floor(
                (player.block || 0) *
                (player?.skillBonus?.retainBlockFraction || 0)
            );

    player.block = retainedBlock;

    const nextTurnBonus =
        player.nextTurnEnergyBonus || 0;

    const rawNextTurnPenalty =
        player.nextTurnEnergyPenalty || 0;

    const relicPenaltyReduction =
        hasRelic("stabilizer")
            ? 1
            : 0;

    const treePenaltyReduction =
        player?.skillBonus?.energyPenaltyReduction || 0;

    const nextTurnPenalty =
        Math.max(
            0,
            rawNextTurnPenalty -
            relicPenaltyReduction -
            treePenaltyReduction
        );

    if (
        rawNextTurnPenalty > 0 &&
        hasRelic("recoilPlate")
    ) {
        player.block += 5;

        if (typeof showRelicTrigger === "function") {
            showRelicTrigger(
                "recoilPlate",
                "+5ブロック"
            );
        }
    }

    player.energy = consumeEnergyStatuses(
        player,
        Math.max(0, player.maxEnergy + (player._v164EnergyKillBonus || 0) + nextTurnBonus - nextTurnPenalty)
    );
    if (hasRelic('energyCarry')) player.energy += (player._v164SavedEnergy || 0);
    player._v164SavedEnergy = 0;

    if (hasRelic("spareCell")) {
        player.energy += 1;
    }

    if (
        rawNextTurnPenalty > 0 &&
        (player?.skillBonus?.penaltyToBlock || 0) > 0
    ) {
        player.block +=
            rawNextTurnPenalty *
            player.skillBonus.penaltyToBlock;
    }

    if (
        endedWithZeroEnergy &&
        (player?.skillBonus?.zeroEnergyNextTurn || 0) > 0
    ) {
        player.energy +=
            player.skillBonus.zeroEnergyNextTurn;
    }

    if (
        endedWithZeroEnergy &&
        hasRelic("lastEmber")
    ) {
        player.energy += 1;

        if (typeof showRelicTrigger === "function") {
            showRelicTrigger("lastEmber", "エナジー+1");
        }
    }

    if (
        selectedCharacter === "gravekeeper" &&
        player.discardPile.length >= 10 &&
        (player?.skillBonus?.discardTurnEnergy || 0) > 0
    ) {
        player.energy +=
            player.skillBonus.discardTurnEnergy;
    }

    if (
        selectedCharacter === "gravekeeper" &&
        hasRelic("ossuaryKey") &&
        player.discardPile.length >= 8
    ) {
        player.energy += 1;

        if (typeof showRelicTrigger === "function") {
            showRelicTrigger("ossuaryKey", "エナジー+1");
        }
    }

    player.nextTurnEnergyBonus = 0;
    player.nextTurnEnergyPenalty = 0;
    player.lastElementalChain = "";
    player.arcaneCompassUsedThisTurn = false;
    player.cardsPlayedThisTurn = 0;
    player.zeroCostDrawUsedThisTurn = false;
    player.lastCardType = null;

    player.attacksPlayedThisTurn = 0;
    player.stormCoilUsedThisTurn = false;

    player.attacksPlayedThisTurn = 0;
    player.stormCoilUsedThisTurn = false;

    // v19 ターン状態をリセット
    player.firstChainSkillEnergyUsed = false;
    player.sameElementDrawUsedThisTurn = false;
    player.highMagicDiscountUsedThisTurn = false;
    player.highMagicDrawUsedThisTurn = false;
    player.firstEnergyGainBonusUsedThisTurn = false;
    player.recoveredCardsThisTurn = 0;
    player.forbiddenTomeUsedThisTurn = false;

    player._v164TwinMoonUsed = false;
    player._v164AttackSkillUsed = {attack:false,skill:false};
    player._v164BannerSpent = 0;
    player._v164BannerUsed = false;
    player._v164ThreeElements = [];
    player._v164ThreefoldUsed = false;
    let turnDrawAmount = 5 + (player._v164BonusDrawNext || 0);
    player._v164BonusDrawNext = 0;
    if (hasRelic('sixTurnIntangible')) {
        player._v164IntangibleTurns = (player._v164IntangibleTurns || 0) + 1;
        if (player._v164IntangibleTurns % 6 === 0) addStatus(player, 'intangible', 1, {ignoreResistance:true});
    }

    if (hasRelic("cursedHourglass")) {
        turnDrawAmount += 1;
    }

    drawCards(turnDrawAmount);
    if (typeof updateOwnedRelicUI === 'function' && hasRelic('sixTurnIntangible')) updateOwnedRelicUI();

    updatePlayerUI();
    updateEnemyUI();

    if (!battleEnded && typeof saveRunState === "function") {
        saveRunState();
    }
}


// ======================
// 戦闘終了判定
// ======================

// B5のボス撃破後に表示するランクリア画面。
function showClearRunSummary() {
    const popup = document.getElementById("popup");
    const title = document.getElementById("popup-title");
    const statsBox = document.getElementById("popup-stats");
    const button = document.getElementById("popup-button");
    if (!popup || !title || !statsBox || !button) return;

    const stats = ensureRunStats() || {};
    const deckCount = [
        ...(player?.drawPile || []),
        ...(player?.hand || []),
        ...(player?.discardPile || []),
        ...(player?.exhaustPile || [])
    ].length;
    const relicCount = Array.isArray(player?.relics) ? player.relics.length : 0;

    title.textContent = "RUN CLEAR!";
    statsBox.innerHTML = `
        <div class="run-result-location">B5 COMPLETE — 全5層踏破！</div>
        <div class="run-result-grid">
            <div><span>戦闘勝利</span><strong>${stats.battlesWon || 0}</strong></div>
            <div><span>撃破した敵</span><strong>${stats.enemiesDefeated || 0}</strong></div>
            <div><span>獲得累計ゴールド</span><strong>${stats.goldEarned || 0}G</strong></div>
            <div><span>デッキ枚数</span><strong>${deckCount}</strong></div>
            <div><span>レリック</span><strong>${relicCount}</strong></div>
            <div><span>獲得スキルポイント</span><strong>${stats.skillPointsEarned || 0} SP</strong></div>
        </div>
    `;
    statsBox.classList.remove("hidden");
    button.textContent = "タイトルへ";
    popup.classList.add("run-result-popup");
    popup.classList.remove("hidden");
    if (typeof clearRunSave === "function") clearRunSave();
    button.onclick = () => {
        popup.classList.add("hidden");
        popup.classList.remove("run-result-popup");
        changeScene("title");
    };
}

function showDefeatRunSummary() {
    const popup = document.getElementById("popup");
    const title = document.getElementById("popup-title");
    const statsBox = document.getElementById("popup-stats");
    const button = document.getElementById("popup-button");

    if (!popup || !title || !statsBox || !button) {
        showPopup("Game Over", "タイトルへ");
        return;
    }

    const stats = ensureRunStats() || {
        enemiesDefeated: 0,
        battlesWon: 0
    };

    const depth =
        typeof currentDepth === "number"
            ? currentDepth
            : 1;

    const currentFloor =
        typeof floor === "number"
            ? floor
            : 1;

    const deckCount =
        [
            ...(player?.drawPile || []),
            ...(player?.hand || []),
            ...(player?.discardPile || []),
            ...(player?.exhaustPile || [])
        ].length;

    const relicCount =
        Array.isArray(player?.relics)
            ? player.relics.length
            : 0;

    title.textContent = "RUN RESULT";

    statsBox.innerHTML = `
        <div class="run-result-location">
            B${depth} / FLOOR ${currentFloor}
        </div>
        <div class="run-result-grid">
            <div><span>戦闘勝利</span><strong>${stats.battlesWon}</strong></div>
            <div><span>撃破した敵</span><strong>${stats.enemiesDefeated}</strong></div>
            <div><span>獲得累計ゴールド</span><strong>${stats.goldEarned || 0}G</strong></div>
            <div><span>デッキ枚数</span><strong>${deckCount}</strong></div>
            <div><span>レリック</span><strong>${relicCount}</strong></div>
            <div><span>獲得スキルポイント</span><strong>${stats.skillPointsEarned} SP</strong></div>
        </div>
    `;

    statsBox.classList.remove("hidden");
    button.textContent = "タイトルへ";

    // v141: RUN RESULT中は戦闘UIより必ず手前に出し、
    // 背面のカード操作を完全に無効化するための専用クラス。
    popup.classList.add("run-result-popup");
    popup.classList.remove("hidden");
}

function showBattleResultAnimation(type, onFinished) {
    const overlay = document.getElementById("battle-result-overlay");
    const title = document.getElementById("battle-result-title");
    const subtitle = document.getElementById("battle-result-subtitle");
    const battleScreen = document.getElementById("battle-screen");

    if (!overlay || !title || !subtitle) {
        if (typeof onFinished === "function") onFinished();
        return;
    }

    const victory = type === "victory";
    const duration = victory ? 1750 : 1250;

    overlay.classList.remove("hidden", "victory", "defeat", "is-visible");
    overlay.classList.add(type);
    overlay.setAttribute("aria-hidden", "false");

    title.textContent = victory ? "VICTORY" : "DEFEAT";
    subtitle.textContent = victory ? "戦闘勝利" : "";

    if (battleScreen) {
        battleScreen.classList.toggle("battle-result-victory", victory);
        battleScreen.classList.toggle("battle-result-defeat", !victory);
    }

    // Restart CSS animation reliably.
    void overlay.offsetWidth;
    overlay.classList.add("is-visible");

    if (typeof fadeBattleBgm === "function") {
        fadeBattleBgm(victory ? 800 : 420, 0);
    }

    if (typeof playSe === "function") {
        playSe(victory ? "victory" : "defeat", victory ? 0.88 : 0.82);
    }

    window.setTimeout(() => {
        overlay.classList.remove("is-visible");

        window.setTimeout(() => {
            overlay.classList.add("hidden");
            overlay.classList.remove(type);
            overlay.setAttribute("aria-hidden", "true");

            if (battleScreen) {
                battleScreen.classList.remove(
                    "battle-result-victory",
                    "battle-result-defeat"
                );
            }

            if (typeof onFinished === "function") {
                onFinished();
            }
        }, victory ? 180 : 80);
    }, duration);
}

function checkBattleEnd() {
    if (typeof battleEnemies !== "undefined") battleEnemies.forEach(flushReactiveArmor);

    if (battleEnded) {
        return;
    }

    const livingEnemies = getLivingBattleEnemies();

    if (battleEnemies.length > 0 && livingEnemies.length === 0) {

        battleEnded = true;

        const earnedSkillPoints =
            currentBattleType === "boss"
                ? 4
                : currentBattleType === "elite"
                    ? 2
                    : 1;

        awardSkillPoint(earnedSkillPoints);

        const victoryStats = ensureRunStats();
        if (victoryStats) {
            victoryStats.skillPointsEarned += earnedSkillPoints;
        }

        if (hasRelic('healingSeed')) healPlayer(6);
        if (hasRelic('potionGuaranteed') && typeof getUnlockedPotionIds === 'function') {
            const ids = getUnlockedPotionIds().filter(id => potions[id] && id !== 'phoenixPotion');
            if (ids.length) addPotion(ids[Math.floor(Math.random()*ids.length)]);
        }
        const victoryHeal = player?.skillBonus?.victoryHeal || 0;
        if (victoryHeal > 0) {
            healPlayer(victoryHeal);
            updatePlayerUI();
        }

        const stats = ensureRunStats();
        if (stats) {
            stats.battlesWon += 1;
        }

        showBattleResultAnimation("victory", () => {
            if (currentBattleType === "boss" &&
                typeof currentDepth === "number" &&
                typeof MAX_RUN_DEPTH === "number" &&
                currentDepth >= MAX_RUN_DEPTH) {
                showClearRunSummary();
            } else if (currentBattleType === "boss") {
                showBossRewardScreen();
            } else if (currentBattleType === "elite") {
                showEliteRewardScreen();
            } else {
                showRewardScreen("normal");
            }
        });
        return;
    }

    if (player.hp <= 0) {
        const potionSlots = typeof ensurePotionSlots === "function" ? ensurePotionSlots() : [];
        const reviveIndex = potionSlots.indexOf("phoenixPotion");
        if (reviveIndex >= 0) {
            potionSlots[reviveIndex] = null;
            player.hp = Math.max(1, Math.ceil(player.maxHp * 0.30));
            if (typeof renderPotionBelt === "function") renderPotionBelt();
            updatePlayerUI();
            return;
        }

        if (hasRelic("phoenixPlume") && !player.phoenixPlumeUsed) {
            player.phoenixPlumeUsed = true;
            player.hp = Math.max(1, Math.floor(player.maxHp * 0.5));
            if (typeof showRelicTrigger === "function") showRelicTrigger("phoenixPlume", `HP ${player.hp}で復活`);
            updatePlayerUI();
            return;
        }

        battleEnded = true;

        showBattleResultAnimation("defeat", () => {
            showDefeatRunSummary();

            const popupButton = document.getElementById("popup-button");
            popupButton.onclick = () => {
                const popup =
                    document.getElementById("popup");

                popup?.classList.add("hidden");
                popup?.classList.remove("run-result-popup");

                if (typeof clearRunSave === "function") clearRunSave();
                changeScene("title");
            };
        });
    }
}

// ======================
// v33.1 攻撃プレビュー
// ======================
function getCardPreviewDamage(card, target = enemy) {
    if (!card || card.type !== "attack" || !target) return null;

    let extraDamage = 0;
    const skillBonus = player?.skillBonus || {};
    const discardCount = player?.discardPile?.length || 0;
    const discardScale = Math.min(discardCount, card.discardScalingCap ?? discardCount);

    if (hasRelic("duelistRibbon") && (player.attacksPlayedThisTurn || 0) === 0) extraDamage += 3;
    if (card.element === "fire" && hasRelic("emberLens")) extraDamage += 3;
    if (card.cost >= 2 && hasRelic("heavySpring")) extraDamage += 4;
    if (selectedCharacter === "gravekeeper" && discardCount >= 6 && hasRelic("graveMarker")) extraDamage += 4;
    if (hasRelic("comboCharm") && player.lastCardType === "skill") extraDamage += 4;
    if (hasRelic("bloodAmber") && player.hp <= player.maxHp * 0.5) extraDamage += 3;

    if (selectedCharacter === "warrior") {
        if (player.hp <= player.maxHp * 0.5) extraDamage += skillBonus.lowHpAttackBonus || 0;
        if ((player.cardsPlayedThisTurn || 0) === 2) extraDamage += skillBonus.thirdCardAttackBonus || 0;
        if ((player.cardsPlayedThisTurn || 0) >= 4) extraDamage += skillBonus.lateComboAttackBonus || 0;
    }

    if (selectedCharacter === "wizard" && card.magic && card.cost >= 2) {
        extraDamage += skillBonus.highCostMagicAttackBonus || 0;
    }

    if (selectedCharacter === "machinist" && card.cost >= 2) {
        extraDamage += skillBonus.highCostAttackBonus || 0;
        if (card.cost >= 3) extraDamage += skillBonus.veryHighCostAttackBonus || 0;
    }

    if (card.damagePerDiscard) {
        extraDamage += discardScale * (card.damagePerDiscard + (selectedCharacter === "gravekeeper" ? (skillBonus.discardScalingBonus || 0) : 0));
    }
    if (card.rageScaling) extraDamage += Math.min((player.rage || 0) * card.rageScaling, card.rageScalingCap || Infinity);
    if (card.chainScaling) extraDamage += Math.min((player.chainCount || 0) * card.chainScaling, card.chainScalingCap || Infinity);
    if (card.recoilScaling) {
        const pressure = (player.nextTurnEnergyBonus || 0) + (player.nextTurnEnergyPenalty || 0) + getStatus(player, "overcharge") + getStatus(player, "leakage");
        extraDamage += Math.min(pressure * card.recoilScaling, card.recoilScalingCap || Infinity);
    }
    if (card.discardFinisherScaling) extraDamage += Math.min(discardCount * card.discardFinisherScaling, card.discardFinisherCap || Infinity);

    if (card.rageCost && (player.rage || 0) >= card.rageCost) {
        extraDamage += (card.rageBonusDamage || 0) + (skillBonus.rageSpendAttackBonus || 0);
    }

    const chain = getElementalChainEffect(card);
    if (chain.triggered) extraDamage += chain.damage || 0;

    const bossRelicDamage = hasRelic("crimsonCrown") ? 4 : 0;
    const whetstoneDamage = 0;
    const hits = card.hits || 1;

    const firstRaw = (card.damage || 0) + bossRelicDamage + whetstoneDamage + extraDamage;
    const laterRaw = (card.damage || 0) + bossRelicDamage + whetstoneDamage;
    const first = modifyAttackDamage(player, target, firstRaw);
    const later = modifyAttackDamage(player, target, laterRaw);
    const total = first + Math.max(0, hits - 1) * later;

    return { first, later, hits, total };
}
