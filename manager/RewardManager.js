// ======================
// RewardManager.js
// ======================

const REWARD_CONFIG = {
    normal: {
        goldMin: 10,
        goldMax: 20
    },

    elite: {
        goldMin: 30,
        goldMax: 45
    },

    boss: {
        goldMin: 60,
        goldMax: 90
    }
};

// エリートは高確率で通常レリックを落とす。
// 0.75 = 75%。調整したい場合はここだけ変更。
const ELITE_RELIC_DROP_RATE = 1.0;

// レリックが落ちなかった場合の追加ゴールド。
const ELITE_NO_RELIC_BONUS_GOLD = 25;

let rewardCards = [];
let rewardRelics = [];

let currentRewardType = "normal";
let currentRewardGold = 0;
let eliteDroppedRelic = null;
let eliteBonusRelic = null;
let currentRewardPotion = null;
let selectedBossRelic = null;

// v144: スキップは「次へ進む」までは取り消せる。
let normalRewardSkipped = false;
let normalRewardChosen = false;


// ======================
// 共通
// ======================

function getRandomRewardGold(type) {

    const config =
        REWARD_CONFIG[type] ||
        REWARD_CONFIG.normal;

    const baseGold = Math.floor(
        Math.random() *
        (config.goldMax - config.goldMin + 1)
    ) + config.goldMin;

    // 黄金の仮面：戦闘ゴールド+50%
    let relicMultiplier = 1;

    if (typeof hasRelic === "function") {
        if (hasRelic("gildedMask")) {
            relicMultiplier *= 1.25;
        }

        if (hasRelic("luckyCharm")) {
            relicMultiplier *= 1.15;
        }
    }

    // スキルツリー：戦闘ゴールド増加。
    const skillMultiplier =
        1 + (player?.skillBonus?.battleGoldBonus || 0);

    return Math.ceil(
        baseGold * relicMultiplier * skillMultiplier
    );
}


function beginBattleReward(type) {

    currentRewardType = type;
    normalRewardSkipped = false;
    normalRewardChosen = false;
    currentRewardGold = getRandomRewardGold(type);
    currentRewardPotion = null;
    rewardCards = [];

    if (typeof gainGold === "function") {
        currentRewardGold = gainGold(currentRewardGold);
    } else {
        player.gold += currentRewardGold;

    const stats =
        typeof ensureRunStats === "function"
            ? ensureRunStats()
            : null;

    if (stats) {
        stats.goldEarned += currentRewardGold;
    }
    }

    if (typeof potions !== "undefined" && typeof addPotion === "function") {
        const chance = type === "boss" ? 1 : type === "elite" ? 0.55 : 0.30;
        if (Math.random() < chance) {
            const ids = typeof getUnlockedPotionIds === "function" ? getUnlockedPotionIds() : Object.keys(potions);
            const potionId = ids[Math.floor(Math.random() * ids.length)];
            if (addPotion(potionId)) currentRewardPotion = potionId;
        }
    }
}

function getPotionRewardHtml() {
    if (!currentRewardPotion || typeof potions === "undefined") return "";
    const potion = potions[currentRewardPotion];
    return potion ? `<div class="reward-potion">🧪 ${potion.icon} ${potion.name} を獲得</div>` : "";
}


function setSkipRewardVisible(visible) {

    const skipButton =
        document.getElementById(
            "skip-reward"
        );

    if (!skipButton) {
        return;
    }

    skipButton.classList.toggle(
        "hidden",
        !visible
    );
}


function getOwnedRelicIds() {

    return new Set(
        player.relics || []
    );
}


function getAvailableRelics() {

    const owned = getOwnedRelicIds();

    return Object.values(relics)
        .filter(relic =>
            relic.category === "normal" &&
            !owned.has(relic.id) &&
            (
                !relic.character ||
                relic.character === selectedCharacter
            ) &&
            (
                typeof isRelicUnlockedForCharacter !== "function" ||
                isRelicUnlockedForCharacter(
                    relic,
                    selectedCharacter
                )
            )
        );
}


function getAvailableBossRelics() {

    const owned = getOwnedRelicIds();

    return Object.values(relics)
        .filter(relic =>
            relic.category === "boss" &&
            !owned.has(relic.id)
        );
}


// v166: Card rarity has three tiers. Relic tiers are independent.
function getRarityLabel(rarity) {
    return ({rare:"RARE", epic:"EPIC", legendary:"LEGENDARY"})[rarity] || "SPECIAL";
}
function getRarityRank(rarity) {
    return ({rare:0, epic:1, legendary:2})[rarity] ?? -1;
}
function getRewardRarityWeights(type = "normal") {
    const tables = {
        normal: {rare:82, epic:18, legendary:0},
        elite: {rare:35, epic:38, legendary:27},
        boss: {rare:0, epic:35, legendary:65}
    };
    return tables[type] || tables.normal;
}

function pickWeightedRarity(weights, availableCards) {

    const availableRarities = Object.keys(weights)
        .filter(rarity =>
            weights[rarity] > 0 &&
            availableCards.some(card => card.rarity === rarity)
        );

    if (availableRarities.length === 0) {
        return null;
    }

    const totalWeight = availableRarities
        .reduce((sum, rarity) => sum + weights[rarity], 0);

    let roll = Math.random() * totalWeight;

    for (const rarity of availableRarities) {
        roll -= weights[rarity];

        if (roll <= 0) {
            return rarity;
        }
    }

    return availableRarities[availableRarities.length - 1];
}


function getRewardCardChoices(count = 3, type = "normal") {

    let pool = [
        ...getCardPoolForCharacter(selectedCharacter)
    ];

    // 通常戦ではRAREとEPICまで。LEGENDARYはエリート・ボスなどの報酬に残す。
    if (type === "normal") {
        pool = pool.filter(card =>
            getRarityRank(card.rarity) <= getRarityRank("epic")
        );
    }

    const weights = getRewardRarityWeights(type);
    const selected = [];
    const remaining = [...pool];

    while (selected.length < count && remaining.length > 0) {
        const rarity = pickWeightedRarity(weights, remaining);

        let candidates = rarity
            ? remaining.filter(card => card.rarity === rarity)
            : remaining;

        if (candidates.length === 0) {
            candidates = remaining;
        }

        const chosen = candidates[
            Math.floor(Math.random() * candidates.length)
        ];

        selected.push(chosen);

        const removeIndex = remaining.findIndex(
            card => card.id === chosen.id
        );

        if (removeIndex >= 0) {
            remaining.splice(removeIndex, 1);
        }
    }

    return selected;
}


function getHighRarityCards(count = 3) {

    // v13：ボス報酬でもスキルツリー未解放カードは出さない。
    // その代わり、各キャラに最初から使えるEPIC/LEGENDARYを追加している。
    const pool = getCardPoolForCharacter(selectedCharacter)
        .filter(card =>
            card.rarity === "epic" ||
            card.rarity === "legendary"
        );

    const weights = getRewardRarityWeights("boss");
    const selected = [];
    const remaining = [...pool];

    while (selected.length < count && remaining.length > 0) {
        const rarity = pickWeightedRarity(weights, remaining);

        let candidates = rarity
            ? remaining.filter(card => card.rarity === rarity)
            : remaining;

        if (candidates.length === 0) {
            candidates = remaining;
        }

        const chosen = candidates[
            Math.floor(Math.random() * candidates.length)
        ];

        selected.push(chosen);

        const removeIndex = remaining.findIndex(
            card => card.id === chosen.id
        );

        if (removeIndex >= 0) {
            remaining.splice(removeIndex, 1);
        }
    }

    // 高レアカードが3種類未満でも、RAREを混ぜず3択を維持する。
    // 候補が不足する場合のみ別枠として同カードを再提示する。
    if (pool.length) {
        while (selected.length < count) selected.push(pool[selected.length % pool.length]);
    }
    return selected;
}


function addRelicDirectly(relicId) {

    const relic = relics[relicId];

    if (!relic) {
        return false;
    }

    if (!Array.isArray(player.relics)) {
        player.relics = [];
    }

    if (player.relics.includes(relicId)) {
        return false;
    }

    player.relics.push(relicId);
    // v164: acquisition effects are applied exactly once.
    if ({maxHpSeven:7,maxHpTen:10,maxHpFourteen:14}[relicId]) {
        const amount = {maxHpSeven:7,maxHpTen:10,maxHpFourteen:14}[relicId];
        player.maxHp += amount;
        player.hp += amount;
    }
    if (relicId === 'potionHolster') {
        player.potionSlotBonus = (player.potionSlotBonus || 0) + 2;
        if (typeof ensurePotionSlots === 'function') ensurePotionSlots();
    }
    if (relicId === 'curseWard') player.curseWardCharges = 2;
    if (relicId === 'skillUpgradeTwo' && Array.isArray(player.starterDeck)) {
        const available = player.starterDeck.map((id, i) => ({id, i})).filter(x =>
            cards[x.id]?.type === 'skill' && typeof getUpgradedCardId === 'function' && getUpgradedCardId(x.id));
        for (let i = 0; i < 2 && available.length; i++) {
            const index = Math.floor(Math.random() * available.length);
            const chosen = available.splice(index,1)[0];
            player.starterDeck[chosen.i] = getUpgradedCardId(chosen.id);
        }
    }

    if (
        typeof updateOwnedRelicUI === "function"
    ) {
        updateOwnedRelicUI();
    }

    // v127: レリック取得の中央演出は廃止。
    // 取得結果と効果確認は右上の所持レリックUIに一本化する。

    return true;
}


function applyBossRelicOnAcquire(relicId) {

    const addMaxEnergy = () => {
        player.maxEnergy += 1;
        player.energy = player.maxEnergy;
    };

    switch (relicId) {

        case "abyssCore":
            addMaxEnergy();
            break;

        case "deepHeart":
            addMaxEnergy();
            player.maxHp = Math.max(1, player.maxHp - 18);
            player.hp = Math.min(player.hp, player.maxHp);
            break;

        case "endlessSpark":
            // デバフカード「過熱」は各戦闘開始時に一時追加。
            addMaxEnergy();
            break;

        case "cursedCore":
            addMaxEnergy();
            // 1つのレリック効果につき、追加する呪いは1枚だけ。
            // 呪いカード自体の総所持枚数には上限を設けない。
            if (Array.isArray(player.starterDeck)) {
                player.starterDeck.push("burningShardCurse");
            }
            break;

        case "sealedPurseCore":
            // 既に持っているゴールドは失わない。
            // 以降の新規獲得だけ gainGold() 側で止める。
            addMaxEnergy();
            break;

        case "crimsonCrown":
            // メリット・デメリットともに battle.js 側で処理。
            break;
    }

    if (typeof updateOwnedRelicUI === "function") {
        updateOwnedRelicUI();
    }

    if (typeof updatePersistentRunHud === "function") {
        updatePersistentRunHud();
    }
}



// ======================
// 通常戦：カード報酬
// ======================

function showRewardScreen(type = "normal") {

    changeScene("reward");
    setSkipRewardVisible(true);

    beginBattleReward(type);
    renderRewardCards();
}


function renderRewardCards() {

    const container =
        document.getElementById(
            "reward-cards"
        );

    if (!container) {
        console.error(
            "reward-cards が見つかりません"
        );
        return;
    }

    // 候補はこの報酬中に一度だけ生成する。
    if (!Array.isArray(rewardCards) || rewardCards.length === 0) {
        const skillBonus =
            player?.skillBonus || {};

        const commonRewardChoice =
            typeof isSkillUnlockedForCharacter === "function" &&
            isSkillUnlockedForCharacter("common_reward_choice", "common")
                ? 1
                : 0;

        const rewardCount = 3;

        rewardCards =
            getRewardCardChoices(
                rewardCount,
                currentRewardType
            );

        // v29: 共通ツリー「磨かれた戦利品」
        if (
            currentRewardType === "normal" &&
            typeof isSkillUnlockedForCharacter === "function" &&
            isSkillUnlockedForCharacter("common_reward_upgrade", "common")
        ) {
            const upgradeChance =
                isSkillUnlockedForCharacter("common_upgrade_cap", "common")
                    ? 0.30
                    : 0.15;

            rewardCards = rewardCards.map(card => {
                if (Math.random() >= upgradeChance) return card;

                const upgradedId =
                    typeof getUpgradedCardId === "function"
                        ? getUpgradedCardId(card.id)
                        : null;

                return upgradedId && cards[upgradedId]
                    ? cards[upgradedId]
                    : card;
            });
        }
    }

    renderRewardOverview({
        title: "戦闘報酬",
        kicker: "BATTLE REWARD",
        cardLabel: `カードを選択（${rewardCards.length}候補）`,
        onCardSelect: () => {
            renderRewardCardSelection(
                "カードを1枚選択",
                "デッキに追加するカードを選んでください",
                rewardCards,
                addCardToDeck,
                () => renderRewardCards()
            );
        }
    });
}


function renderRewardOverview({
    title,
    kicker,
    cardLabel,
    onCardSelect,
    extraHtml = ""
}) {
    const container =
        document.getElementById("reward-cards");

    if (!container) return;

    const potionHtml =
        currentRewardPotion &&
        typeof potions !== "undefined" &&
        potions[currentRewardPotion]
            ? `
                <div class="reward-overview-row">
                    <div class="reward-overview-icon">🧪</div>
                    <div class="reward-overview-copy">
                        <span>ポーション</span>
                        <strong>
                            ${potions[currentRewardPotion].icon}
                            ${potions[currentRewardPotion].name}
                        </strong>
                    </div>
                    <div class="reward-overview-done">獲得済み</div>
                </div>
            `
            : `
                <div class="reward-overview-row muted">
                    <div class="reward-overview-icon">🧪</div>
                    <div class="reward-overview-copy">
                        <span>ポーション</span>
                        <strong>なし</strong>
                    </div>
                </div>
            `;

    container.innerHTML = `
        <div class="reward-overview">
            <div class="reward-overview-head">
                <span class="reward-summary-label">${kicker}</span>
                <h2>${title}</h2>
            </div>

            <div class="reward-overview-list">
                <div class="reward-overview-row">
                    <div class="reward-overview-icon">💰</div>
                    <div class="reward-overview-copy">
                        <span>ゴールド</span>
                        <strong>${currentRewardGold}G</strong>
                    </div>
                    <div class="reward-overview-done">獲得済み</div>
                </div>

                ${potionHtml}

                ${extraHtml}

                <button
                    id="reward-open-card-selection"
                    class="reward-overview-row reward-card-select-row"
                    type="button"
                >
                    <div class="reward-overview-icon">🃏</div>
                    <div class="reward-overview-copy">
                        <span>カード報酬</span>
                        <strong>${cardLabel}</strong>
                    </div>
                    <div class="reward-overview-arrow">›</div>
                </button>
            </div>
        </div>
    `;

    const button =
        document.getElementById(
            "reward-open-card-selection"
        );

    if (button && typeof onCardSelect === "function") {
        button.addEventListener(
            "click",
            onCardSelect
        );
    }
}


function renderRewardCardSelection(
    title,
    description,
    choices,
    clickHandler,
    backHandler = null
) {
    const container =
        document.getElementById("reward-cards");

    if (!container) return;

    container.innerHTML = `
        <div class="reward-card-selection-screen">
            <div class="reward-card-selection-head">
                ${
                    backHandler
                        ? `<button id="reward-selection-back" type="button">← 報酬一覧</button>`
                        : `<span></span>`
                }

                <div>
                    <span class="reward-summary-label">CARD REWARD</span>
                    <h2>${title}</h2>
                    <p>${description}</p>
                </div>

                <span></span>
            </div>

            <div class="reward-card-grid"></div>
        </div>
    `;

    if (backHandler) {
        const back =
            document.getElementById(
                "reward-selection-back"
            );

        if (back) {
            back.addEventListener(
                "click",
                backHandler
            );
        }
    }

    renderCardChoices(
        container,
        choices,
        clickHandler
    );
}


function renderCardChoices(
    container,
    cardChoices,
    clickHandler
) {

    const cardContainer =
        container.querySelector(".reward-card-grid") ||
        container;

    cardChoices.forEach(card => {

        const cardElement =
            document.createElement("div");

        cardElement.className =
            `reward-card ${card.rarity || "rare"}`;

        cardElement.innerHTML = `
            <div class="reward-rarity rarity-${card.rarity || "rare"}">
                ${getRarityLabel(card.rarity)}
            </div>

            <h3>${card.name}</h3>

            <p>
                タイプ：${card.type}
            </p>

            <p>
                コスト：${card.cost}
            </p>

            <p>
                ${card.description}
            </p>
        `;

        cardElement.addEventListener(
            "click",
            () => {
                clickHandler(card.id);
            }
        );

        cardContainer.appendChild(
            cardElement
        );
    });
}


function addCardToDeck(cardId) {

    const card = cards[cardId];

    if (!card) {
        console.error(
            "カードが存在しません:",
            cardId
        );
        return;
    }

    // 戻ってきた時や連打でカードを二重取得しない。
    if (normalRewardChosen) return;
    normalRewardChosen = true;
    normalRewardSkipped = false;

    player.starterDeck.push(cardId);

    finishReward(
        `${card.name} を選択しました！`
    );
}


function finishReward(message) {

    setSkipRewardVisible(false);

    const container =
        document.getElementById(
            "reward-cards"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="reward-finish-panel">
            <span class="reward-summary-label">REWARD ACQUIRED</span>
            <h2>${message}</h2>
            <p>💰 ${currentRewardGold}G を獲得しました</p>
            ${
                normalRewardSkipped && !normalRewardChosen
                    ? `<button id="reward-undo-skip" type="button">↩ カード選択に戻る</button>`
                    : ""
            }
            <button id="reward-next-button">次へ進む</button>
        </div>
    `;

    const undoSkip = document.getElementById("reward-undo-skip");
    if (undoSkip) {
        undoSkip.addEventListener("click", () => {
            if (!normalRewardSkipped || normalRewardChosen) return;
            normalRewardSkipped = false;
            setSkipRewardVisible(true);
            // 同じ報酬候補を再表示。ゴールド・ポーションは再抽選しない。
            renderRewardCardSelection(
                "カードを1枚選択",
                "デッキに追加するカードを選んでください",
                rewardCards,
                addCardToDeck,
                () => renderRewardCards()
            );
        });
    }

    document
        .getElementById(
            "reward-next-button"
        )
        .addEventListener(
            "click",
            goToNextMap
        );
}


// ======================
// エリート報酬
// ======================

function showEliteRewardScreen() {

    changeScene("reward");
    setSkipRewardVisible(false);

    beginBattleReward("elite");

    eliteDroppedRelic = null;
    eliteBonusRelic = null;

    const doubleRelicActive = typeof hasRelic === "function" && hasRelic("eliteDoubleDrop");

    const availableRelics =
        getAvailableRelics();

    const eliteRelicDropRate =
        Math.min(
            1.0,
            ELITE_RELIC_DROP_RATE +
            (
                typeof hasRelic === "function" &&
                hasRelic("eliteCompass")
                    ? 0.10
                    : 0
            )
        );

    const relicDrops =
        availableRelics.length > 0 &&
        Math.random() < eliteRelicDropRate;

    if (relicDrops) {

        eliteDroppedRelic =
            randomFrom(availableRelics);

        addRelicDirectly(
            eliteDroppedRelic.id
        );

        if (doubleRelicActive) {
            const remaining = getAvailableRelics();
            if (remaining.length > 0) {
                eliteBonusRelic = randomFrom(remaining);
                addRelicDirectly(eliteBonusRelic.id);
            }
        }

    } else {

        // レリックなしでも報酬を豪華にする。
        const bonusGold =
            typeof gainGold === "function"
                ? gainGold(ELITE_NO_RELIC_BONUS_GOLD)
                : ELITE_NO_RELIC_BONUS_GOLD;

        if (typeof gainGold !== "function") {
            player.gold += bonusGold;
        }

        currentRewardGold += bonusGold;
    }

    renderEliteReward();
}


// 古いbattle.js等との互換用
function showRelicRewardScreen() {
    showEliteRewardScreen();
}


function renderEliteReward() {

    const container =
        document.getElementById(
            "reward-cards"
        );

    if (!container) {
        return;
    }

    const skillBonus =
        player?.skillBonus || {};

    const cardCount = 3;

    if (!Array.isArray(rewardCards) || rewardCards.length === 0) {
        rewardCards =
            getRewardCardChoices(
                cardCount,
                "elite"
            );
    }

    const extraHtml =
        eliteDroppedRelic
            ? `
                <div class="reward-overview-row">
                    <div class="reward-overview-icon">
                        ${eliteDroppedRelic.icon || "💎"}
                    </div>
                    <div class="reward-overview-copy">
                        <span>レリック</span>
                        <strong>${eliteDroppedRelic.name}</strong>
                        ${
                            eliteBonusRelic
                                ? `<small>＋ ${eliteBonusRelic.name}</small>`
                                : ""
                        }
                    </div>
                    <div class="reward-overview-done">獲得済み</div>
                </div>
            `
            : `
                <div class="reward-overview-row">
                    <div class="reward-overview-icon">✨</div>
                    <div class="reward-overview-copy">
                        <span>追加報酬</span>
                        <strong>+${ELITE_NO_RELIC_BONUS_GOLD}G / カード候補+1</strong>
                    </div>
                    <div class="reward-overview-done">獲得済み</div>
                </div>
            `;

    renderRewardOverview({
        title: "エリート戦報酬",
        kicker: "ELITE REWARD",
        cardLabel: `カードを選択（${rewardCards.length}候補）`,
        extraHtml,
        onCardSelect: () => {
            renderRewardCardSelection(
                "カードを1枚選択",
                "エリート戦のカード報酬です",
                rewardCards,
                addEliteCardToDeck,
                () => renderEliteReward()
            );
        }
    });
}


function addEliteCardToDeck(cardId) {

    const card = cards[cardId];

    if (!card) {
        return;
    }

    player.starterDeck.push(cardId);

    const relicText =
        eliteDroppedRelic
            ? ` / ${eliteDroppedRelic.name} 獲得`
            : "";

    finishReward(
        `${card.name} を選択しました！${relicText}`
    );
}


// ======================
// ボス報酬
// ======================

function showBossRewardScreen() {

    changeScene("reward");
    setSkipRewardVisible(false);

    beginBattleReward("boss");

    selectedBossRelic = null;

    renderBossRelicChoices();
}


function renderBossRelicChoices() {

    const container =
        document.getElementById(
            "reward-cards"
        );

    if (!container) {
        return;
    }

    let bossRelics =
        getAvailableBossRelics();

    // 全て所持している場合でも進行不能にはしない。
    if (bossRelics.length === 0) {
        renderBossCardChoices();
        return;
    }

    bossRelics =
        shuffle([...bossRelics])
            .slice(0, 3);

    container.innerHTML = `
        <div class="reward-layout">
            <div class="reward-summary-bar">
                <div>
                    <span class="reward-summary-label">BOSS REWARD</span>
                    <strong>ボス撃破報酬</strong>
                </div>
                <div class="reward-summary-items">
                    <span>💰 ${currentRewardGold}G</span>
                    ${getPotionRewardHtml()}
                </div>
            </div>

            <div class="reward-card-panel boss-reward-panel">
                <div class="reward-card-panel-head">
                    <h2>👑 ボスレリックを1つ選択</h2>
                    <p>ランを大きく変える強力なレリックです</p>
                </div>
                <div class="reward-card-grid boss-relic-grid"></div>
            </div>
        </div>
    `;

    bossRelics.forEach(relic => {

        const relicElement =
            document.createElement("div");

        relicElement.className =
            "reward-card boss-relic-reward";

        const grantedCard =
            relic.grantedCardId && typeof cards !== "undefined"
                ? cards[relic.grantedCardId]
                : null;

        const grantedCardHtml = grantedCard
            ? `
                <div class="boss-relic-granted-card">
                    <div class="boss-relic-granted-card-label">付与カード</div>
                    <div class="boss-relic-granted-card-head">
                        <strong>${grantedCard.name}</strong>
                        <span>${String(grantedCard.rarity || grantedCard.type || "SPECIAL").toUpperCase()}</span>
                    </div>
                    <p>${grantedCard.description}</p>
                    ${
                        relic.grantedCardContext
                            ? `<small>${relic.grantedCardContext}</small>`
                            : ""
                    }
                </div>
            `
            : "";

        relicElement.innerHTML = `
            <div class="boss-relic-crown">BOSS RELIC</div>
            <h3>${relic.icon || "👑"} ${relic.name}</h3>

            <div class="boss-relic-effect-box benefit">
                <div class="boss-relic-effect-label">▲ メリット</div>
                <div class="boss-relic-effect-text">
                    ${relic.benefit || relic.description}
                </div>
            </div>

            <div class="boss-relic-effect-box drawback">
                <div class="boss-relic-effect-label">▼ デメリット</div>
                <div class="boss-relic-effect-text">
                    ${relic.drawback || "デメリットなし"}
                </div>
            </div>

            ${grantedCardHtml}
        `;

        relicElement.addEventListener(
            "click",
            () => {
                selectBossRelic(relic.id);
            }
        );

        (container.querySelector(".boss-relic-grid") || container).appendChild(
            relicElement
        );
    });
}


function selectBossRelic(relicId) {

    const relic = relics[relicId];

    if (!relic) {
        return;
    }

    if (
        !addRelicDirectly(relicId)
    ) {
        return;
    }

    selectedBossRelic = relic;

    applyBossRelicOnAcquire(
        relicId
    );

    renderBossCardChoices();
}


function renderBossCardChoices() {

    const container =
        document.getElementById(
            "reward-cards"
        );

    if (!container) {
        return;
    }

    const skillBonus =
        player?.skillBonus || {};

    const cardCount = 3;

    rewardCards =
        getHighRarityCards(cardCount);

    renderRewardCardSelection(
        "高レアリティカードを1枚選択",
        selectedBossRelic
            ? `👑 ${selectedBossRelic.name} を獲得済み`
            : "ボス戦のカード報酬です",
        rewardCards,
        addBossCardToDeck,
        null
    );
}


function addBossCardToDeck(cardId) {

    const card = cards[cardId];

    if (!card) {
        return;
    }

    player.starterDeck.push(cardId);

    finishBossReward(
        `${card.name} を獲得しました！`
    );
}


function finishBossReward(message) {

    const container =
        document.getElementById(
            "reward-cards"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="reward-finish-panel boss-reward-finish-panel">
            <h2>${message}</h2>

            <p>
                BOSS報酬を獲得しました
            </p>

            <button id="boss-reward-next-button">
                ⬇️ 次の階層に進む
            </button>
        </div>
    `;

    document
        .getElementById(
            "boss-reward-next-button"
        )
        .addEventListener(
            "click",
            goToNextMap
        );
}


// ======================
// 宝箱
// ======================

function showTreasureReward() {

    changeScene("reward");
    setSkipRewardVisible(false);

    const container =
        document.getElementById(
            "reward-cards"
        );

    // v93:
    // 通常マップの宝箱は選択式にせず、
    // 解放済み・未所持の候補からランダムに1個を直接獲得する。
    const relicList =
        typeof getAvailableRelics === "function"
            ? [...getAvailableRelics()]
            : [];

    if (relicList.length === 0) {

        container.innerHTML = `
            <h2>🎁 宝箱</h2>

            <p>
                獲得できる新しい通常レリックはありません。
            </p>

            <button id="treasure-next-button">
                🗺️ 次へ進む
            </button>
        `;

        document
            .getElementById(
                "treasure-next-button"
            )
            .addEventListener(
                "click",
                goToNextMap
            );

        return;
    }

    const relic =
        relicList[
            Math.floor(
                Math.random() *
                relicList.length
            )
        ];

    if (!addRelicDirectly(relic.id)) {
        // 念のため取得に失敗した場合でも進行不能にしない。
        finishTreasureReward(
            "宝箱を開けましたが、獲得できるレリックはありませんでした。"
        );
        return;
    }

    finishTreasureReward(
        `${relic.icon || "💎"} ${relic.name} を獲得しました！`
    );
}

function obtainRelic(relicId) {

    const relic = relics[relicId];

    if (!relic) {
        return;
    }

    if (!addRelicDirectly(relicId)) {
        return;
    }

    finishTreasureReward(
        `${relic.icon || "💎"} ${relic.name} を獲得しました！`
    );
}


function finishTreasureReward(message) {

    const container =
        document.getElementById(
            "reward-cards"
        );

    container.innerHTML = `
        <h2>${message}</h2>

        <button id="treasure-next-button">
            🗺️ 次へ進む
        </button>
    `;

    document
        .getElementById(
            "treasure-next-button"
        )
        .addEventListener(
            "click",
            goToNextMap
        );
}


// ======================
// 次へ
// ======================

function goToNextMap() {

    if (
        typeof advanceFromCurrentNode !==
        "function"
    ) {

        console.error(
            "advanceFromCurrentNode() が見つかりません"
        );

        return;
    }

    advanceFromCurrentNode();
}


// ======================
// スキップ
// ======================

const skipRewardButton =
    document.getElementById(
        "skip-reward"
    );

if (skipRewardButton) {

    skipRewardButton.addEventListener(
        "click",
        () => {

            // ボス・エリートはスキップ不可。
            if (
                currentRewardType === "boss" ||
                currentRewardType === "elite"
            ) {
                return;
            }

            if (normalRewardChosen || normalRewardSkipped) return;
            normalRewardSkipped = true;

            finishReward(
                "カード報酬をスキップしました"
            );
        }
    );
}
