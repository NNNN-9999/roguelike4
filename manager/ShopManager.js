// ======================
// ShopManager.js
// ショップ管理
// ======================

let shopCards = [];
let shopRelics = [];
let shopPotions = [];
let activeShopNodeId = null;

function shopShuffle(list) {
    const result = [...list];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function showShop() {
    changeScene("map");

    const shopNodeId = currentMapNode?.id || null;

    // 同じショップ内でカード削除画面などを行き来しても
    // 商品が勝手に再抽選されないようにする。
    if (activeShopNodeId !== shopNodeId) {
        if (player?.relics?.includes('shopHealing') && typeof healPlayer === 'function') healPlayer(15);
        activeShopNodeId = shopNodeId;
        createShopItems();
    }

    renderShop();
}

function createShopItems() {
    const cardList = getCardPoolForCharacter(selectedCharacter);

    // v29.1: 序盤ノードは「商品枠+1」だけに抑え、
    // 強化済み商品の確定出現は最深部へ移動。
    const expandedStockUnlocked =
        typeof isSkillUnlockedForCharacter === "function" &&
        isSkillUnlockedForCharacter("common_shop_upgrade", "common");

    const premiumStockUnlocked =
        typeof isSkillUnlockedForCharacter === "function" &&
        isSkillUnlockedForCharacter("common_trade_cap", "common");

    const upgradeMasteryUnlocked =
        typeof isSkillUnlockedForCharacter === "function" &&
        isSkillUnlockedForCharacter("common_upgrade_cap", "common");

    const shopCardCount = expandedStockUnlocked ? 4 : 3;

    const selectedCards = shopShuffle(cardList)
        .slice(0, shopCardCount);

    // 強化系ツリー最深部を取っている場合のみ、
    // 各商品に控えめな確率で追加の強化品が混ざる。
    let stockCards = selectedCards.map(card => {
        if (!upgradeMasteryUnlocked || Math.random() >= 0.15) {
            return card;
        }

        const upgradedId = typeof getUpgradedCardId === "function"
            ? getUpgradedCardId(card.id)
            : null;

        return upgradedId && cards[upgradedId]
            ? cards[upgradedId]
            : card;
    });

    // 取引ルート最深部：強化可能な商品から1枚だけ確定強化。
    // 「ショップ全強化」にはしない。
    if (premiumStockUnlocked) {
        const candidates = stockCards
            .map((card, index) => {
                const baseId = card.baseCardId || card.id;
                const upgradedId = typeof getUpgradedCardId === "function"
                    ? getUpgradedCardId(baseId)
                    : null;

                return upgradedId && cards[upgradedId]
                    ? { index, upgradedId }
                    : null;
            })
            .filter(Boolean);

        if (candidates.length > 0) {
            const chosen = candidates[
                Math.floor(Math.random() * candidates.length)
            ];

            stockCards[chosen.index] = cards[chosen.upgradedId];
        }
    }

    shopCards = stockCards.map(stockCard => ({
        cardId: stockCard.id,
        price: getShopCardPrice(stockCard)
    }));

    const ownedRelics = new Set(player?.relics || []);

    const relicList = Object.values(relics)
        .filter(relic =>
            relic.category === "normal" &&
            !ownedRelics.has(relic.id) &&
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

    shopRelics = shopShuffle(relicList)
        .slice(0, 3)
        .map(relic => ({
            relicId: relic.id,
            price: getShopRelicPrice(relic)
        }));

    shopPotions = typeof potions !== "undefined"
        ? shopShuffle(
            Object.values(potions)
                .filter(p =>
                    typeof isPotionUnlocked !== "function" ||
                    isPotionUnlocked(p)
                )
        )
            .slice(0, 3)
            .map(potion => ({
                potionId: potion.id,
                price: getShopPotionPrice(potion)
            }))
        : [];
}

function getShopPriceMultiplier() {
    const ownedRelics =
        Array.isArray(player?.relics)
            ? player.relics
            : [];

    let multiplier = 1;

    // 商人の印章：ショップ価格-15%
    if (ownedRelics.includes("merchantSeal")) {
        multiplier *= 0.85;
    }

    return multiplier;
}

function getShopCardPrice(card) {
    let basePrice;

    switch (card.rarity) {
        case "rare": basePrice = 65; break;
        case "epic": basePrice = 105; break;
        case "legendary": basePrice = 145; break;
        default: basePrice = 65; break;
    }

    return Math.ceil(basePrice * getShopPriceMultiplier());
}

function getShopRelicTier(relic) {
    if (!relic) return 1;

    const text = String(relic.description || "");
    let tier = 1;

    // 行動回数・エナジー・ドロー・コスト軽減など、
    // 戦闘全体へ影響しやすい効果は高価格帯にする。
    if (
        /エナジー|カードを[12]枚引|コストが?1減|追加で引|復活|2倍|追加.*レリック/.test(text)
    ) {
        tier = 3;
    } else if (
        /ダメージ\+|ブロック.*\+|HP.*回復|ゴールド.*増|確率.*上|筋力|敏捷|闘志/.test(text)
    ) {
        tier = 2;
    }

    // 専用レリックは構築との噛み合いが強いので最低でも中価格帯。
    if (relic.character) {
        tier = Math.max(tier, 2);
    }

    return tier;
}

function getShopRelicPrice(relic) {
    const tier = getShopRelicTier(relic);
    const basePrice = tier === 3 ? 205 : tier === 2 ? 165 : 130;
    return Math.ceil(basePrice * getShopPriceMultiplier());
}

function getShopPotionPrice(potion) {
    if (!potion) return 45;

    const id = potion.id;
    const basePrices = {
        healingPotion: 40,
        fireBomb: 45,
        resistancePotion: 50,
        regenerationPotion: 55,
        cleansePotion: 55,
        strengthPotion: 60,
        dexterityPotion: 60,
        overchargePotion: 65,
        ritualPotion: 70,
        chaosTonic: 70
    };

    const basePrice = basePrices[id] ?? 50;
    return Math.ceil(basePrice * getShopPriceMultiplier());
}

function getRemoveCardPrice() {
    return Math.ceil(75 * getShopPriceMultiplier());
}

function renderShop() {
    const mapArea = document.getElementById("map-area");

    if (!mapArea) {
        console.error("map-areaが見つかりません");
        return;
    }

    const removePrice = getRemoveCardPrice();

    mapArea.innerHTML = `
        <div class="shop shop-compact-layout">

            <div class="shop-topbar">
                <div class="shop-heading">
                    <h2>🛒 ショップ</h2>

                    <p class="shop-gold">
                        💰 所持金：
                        <strong><span id="shop-gold">${player.gold}</span>G</strong>
                    </p>
                </div>

                <div class="shop-actions shop-actions-top">
                    <button id="shop-leave-button" class="secondary-button">
                        マップへ戻る
                    </button>
                </div>
            </div>

            <div class="shop-inventory-grid">

                <section class="shop-section shop-card-section">
                    <div class="shop-section-title">
                        <h3>🃏 カード</h3>
                        <span>3枠</span>
                    </div>

                    <div id="shop-cards" class="shop-cards"></div>
                </section>

                <section class="shop-section shop-relic-section">
                    <div class="shop-section-title">
                        <h3>💎 レリック</h3>
                        <span>3枠</span>
                    </div>

                    <div id="shop-relics" class="shop-relics"></div>
                </section>

                <section class="shop-section shop-potion-section">
                    <div class="shop-section-title">
                        <h3>🧪 ポーション</h3>
                        <span>3枠</span>
                    </div>
                    <div id="shop-potions" class="shop-potions"></div>
                </section>

            </div>
        </div>
    `;

    renderShopCards();
    renderShopRelics();
    renderShopPotions();

    document
        .getElementById("shop-leave-button")
        .addEventListener("click", advanceFromCurrentNode);
}

function renderRemoveCardShopTile(container) {
    if (!container) return;

    const removePrice = getRemoveCardPrice();
    const affordable = player.gold >= removePrice;

    const tile = document.createElement("div");
    tile.className = "shop-card shop-remove-card-tile";

    tile.innerHTML = `
        <div class="shop-rarity">SERVICE</div>
        <h3>🗑️ カード削除</h3>

        <div class="shop-card-meta">
            <span>デッキ整理</span>
            <span>1枚</span>
        </div>

        <p class="shop-item-description">
            デッキからカードを1枚選んで削除します。
        </p>

        <p class="shop-price ${affordable ? "affordable" : "unaffordable"}">
            💰 ${removePrice}G
        </p>

        <button id="remove-card-button" ${affordable ? "" : "disabled"}>
            ${affordable ? "カードを削除" : "所持金不足"}
        </button>
    `;

    tile
        .querySelector("button")
        ?.addEventListener(
            "click",
            showRemoveCard
        );

    container.appendChild(tile);
}

function renderShopCards() {
    const container = document.getElementById("shop-cards");
    container.innerHTML = "";

    if (shopCards.length === 0) {
        renderRemoveCardShopTile(container);
        return;
    }

    shopCards.forEach(item => {
        const card = cards[item.cardId];
        const cardElement = document.createElement("div");

        const soldOut = item.soldOut === true;

        cardElement.className =
            `shop-card ${card.rarity}${soldOut ? " sold-out" : ""}`;

        const affordable =
            !soldOut &&
            player.gold >= item.price;

        cardElement.innerHTML = `
            ${
                soldOut
                    ? `<div class="shop-sold-out-stamp">SOLD OUT</div>`
                    : ""
            }

            <div class="shop-rarity">${String(card.rarity || "rare").toUpperCase()}</div>
            <h3>${card.name}</h3>

            <div class="shop-card-meta">
                <span>${card.type}</span>
                <span>⚡ ${card.cost}</span>
            </div>

            <p class="shop-item-description">${card.description}</p>

            <p class="shop-price ${
                soldOut
                    ? "sold"
                    : affordable
                        ? "affordable"
                        : "unaffordable"
            }">
                💰 ${item.price}G
            </p>

            <button ${soldOut || !affordable ? "disabled" : ""}>
                ${
                    soldOut
                        ? "購入済み"
                        : affordable
                            ? "購入"
                            : "所持金不足"
                }
            </button>
        `;

        if (!soldOut) {
            cardElement
                .querySelector("button")
                .addEventListener("click", event => {
                    event.stopPropagation();
                    buyCard(item);
                });
        }

        container.appendChild(cardElement);
    });

    // v152: 3枚の販売カードの右端に削除サービスを常設。
    renderRemoveCardShopTile(container);
}


function getShopFloatingTooltip() {
    let tooltip = document.getElementById("shop-floating-tooltip");
    if (!tooltip) {
        tooltip = document.createElement("div");
        tooltip.id = "shop-floating-tooltip";
        tooltip.className = "shop-floating-tooltip";
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

function positionShopFloatingTooltip(tooltip, event) {
    if (!tooltip || !event) return;

    const gap = 14;
    const width = tooltip.offsetWidth || 230;
    const height = tooltip.offsetHeight || 90;
    let left = event.clientX + gap;
    let top = event.clientY + gap;

    if (left + width > window.innerWidth - 10) {
        left = event.clientX - width - gap;
    }
    if (top + height > window.innerHeight - 10) {
        top = event.clientY - height - gap;
    }

    tooltip.style.left = `${Math.max(10, left)}px`;
    tooltip.style.top = `${Math.max(10, top)}px`;
}

function bindShopFloatingTooltips(container) {
    if (!container) return;
    const tooltip = getShopFloatingTooltip();

    container.querySelectorAll(".shop-mini-item").forEach(item => {
        const source = item.querySelector(".shop-hover-tooltip");
        if (!source) return;

        const show = event => {
            tooltip.innerHTML = source.innerHTML;
            tooltip.classList.add("show");
            positionShopFloatingTooltip(tooltip, event);
        };
        const move = event => {
            if (tooltip.classList.contains("show")) {
                positionShopFloatingTooltip(tooltip, event);
            }
        };
        const hide = () => tooltip.classList.remove("show");

        item.addEventListener("mouseenter", show);
        item.addEventListener("mousemove", move);
        item.addEventListener("mouseleave", hide);
        item.addEventListener("focusin", show);
        item.addEventListener("focusout", hide);
    });
}

function renderShopRelics() {
    const container = document.getElementById("shop-relics");
    container.innerHTML = "";

    if (shopRelics.length === 0) {
        container.innerHTML = `
            <p class="shop-empty-message">
                今回購入できるレリックはありません。
            </p>
        `;
        return;
    }

    shopRelics.forEach(item => {
        const relic = relics[item.relicId];
        const relicElement = document.createElement("div");
        const soldOut = item.soldOut === true;
        const affordable = !soldOut && player.gold >= item.price;
        const tier = getShopRelicTier(relic);

        relicElement.className =
            `shop-mini-item shop-relic shop-tier-${tier}${soldOut ? " sold-out" : ""}`;

        relicElement.innerHTML = `
            ${soldOut ? `<div class="shop-sold-out-stamp">SOLD OUT</div>` : ""}

            <div class="shop-mini-head">
                <div class="shop-relic-icon">${relic.icon || "💎"}</div>
                <div class="shop-mini-name">
                    <h3>${relic.name}</h3>
                    <small>${tier === 3 ? "上級" : tier === 2 ? "中級" : "標準"}レリック</small>
                </div>
            </div>

            <div class="shop-hover-tooltip" role="tooltip">
                <strong>${relic.name}</strong>
                <p>${relic.description}</p>
                ${
                    relic.character
                        ? `<small>${characters[relic.character]?.name || "専用"}専用</small>`
                        : ""
                }
            </div>

            <div class="shop-mini-bottom">
                <p class="shop-price ${soldOut ? "sold" : affordable ? "affordable" : "unaffordable"}">
                    💰 ${item.price}G
                </p>

                <button ${soldOut || !affordable ? "disabled" : ""}>
                    ${soldOut ? "購入済み" : affordable ? "購入" : "所持金不足"}
                </button>
            </div>
        `;

        if (!soldOut) {
            relicElement
                .querySelector("button")
                .addEventListener("click", event => {
                    event.stopPropagation();
                    buyRelic(item);
                });
        }

        container.appendChild(relicElement);
    });

    bindShopFloatingTooltips(container);
}


function renderShopPotions() {
    const container = document.getElementById("shop-potions");
    if (!container) return;

    container.innerHTML = "";

    shopPotions.forEach(item => {
        const potion = potions[item.potionId];
        const soldOut = item.soldOut === true;
        const hasSlot = ensurePotionSlots().some(v => !v);
        const affordable =
            !soldOut &&
            player.gold >= item.price &&
            hasSlot;

        const el = document.createElement("div");
        el.className =
            `shop-mini-item shop-potion${soldOut ? " sold-out" : ""}`;

        el.innerHTML = `
            ${soldOut ? `<div class="shop-sold-out-stamp">SOLD OUT</div>` : ""}

            <div class="shop-mini-head">
                <div class="shop-relic-icon">${potion.icon}</div>
                <div class="shop-mini-name">
                    <h3>${potion.name}</h3>
                    <small>ポーション</small>
                </div>
            </div>

            <div class="shop-hover-tooltip" role="tooltip">
                <strong>${potion.name}</strong>
                <p>${potion.description}</p>
                <small>${potion.battleOnly ? "戦闘中のみ使用可能" : "マップでも使用可能"}</small>
            </div>

            <div class="shop-mini-bottom">
                <p class="shop-price ${soldOut ? "sold" : affordable ? "affordable" : "unaffordable"}">
                    💰 ${item.price}G
                </p>

                <button ${affordable ? "" : "disabled"}>
                    ${
                        soldOut
                            ? "購入済み"
                            : !hasSlot
                                ? "枠が満杯"
                                : affordable
                                    ? "購入"
                                    : "所持金不足"
                    }
                </button>
            </div>
        `;

        if (affordable) {
            el.querySelector("button").addEventListener("click", () => {
                if (
                    player.gold < item.price ||
                    !addPotion(item.potionId)
                ) return;

                player.gold -= item.price;
                item.soldOut = true;
                updateShopGold();
                renderShopPotions();
            });
        }

        container.appendChild(el);
    });

    bindShopFloatingTooltips(container);
}

function buyCard(item) {
    const card = cards[item.cardId];

    if (!card) {
        console.error("カードが存在しません:", item.cardId);
        return;
    }

    if (player.gold < item.price) {
        alert("ゴールドが足りません");
        return;
    }

    player.gold -= item.price;
    player.starterDeck.push(card.id);

    // 購入済み表示を残すため、商品枠は消さない。

    item.soldOut = true;

    updateShopGold();
    renderShopCards();
    renderShopRelics();
}

function buyRelic(item) {
    const relic = relics[item.relicId];

    if (!relic) {
        console.error("レリックが存在しません:", item.relicId);
        return;
    }

    if (player.gold < item.price) {
        alert("ゴールドが足りません");
        return;
    }

    if (player.relics.includes(relic.id)) {
        alert("すでに所持しているレリックです");
        return;
    }

    player.gold -= item.price;

    if (typeof addRelicDirectly === "function") {
        addRelicDirectly(relic.id);
    } else {
        player.relics.push(relic.id);

        if (typeof showRelicAcquired === "function") {
            showRelicAcquired(relic.id);
        }
    }

    item.soldOut = true;

    updateShopGold();
    renderShopCards();
    renderShopRelics();
    renderShopPotions();

    if (typeof updateOwnedRelicUI === "function") {
        updateOwnedRelicUI();
    }
}

function updateShopGold() {
    const goldElement = document.getElementById("shop-gold");

    if (goldElement) {
        goldElement.textContent = player.gold;
    }
}

function showRemoveCard() {
    const mapArea = document.getElementById("map-area");
    const removePrice = getRemoveCardPrice();

    mapArea.innerHTML = `
        <div class="shop">
            <h2>🗑️ カード削除</h2>

            <p>${removePrice}Gを使ってカードを1枚削除できます。</p>

            <p>
                💰 所持金：
                <span id="shop-gold">${player.gold}</span>
            </p>

            <div id="remove-card-list" class="remove-card-list"></div>

            <button id="cancel-remove-button" class="secondary-button">
                キャンセル
            </button>
        </div>
    `;

    renderRemoveCards();

    document
        .getElementById("cancel-remove-button")
        .addEventListener("click", renderShop);
}

function renderRemoveCards() {
    const container = document.getElementById("remove-card-list");
    container.innerHTML = "";

    player.starterDeck.forEach((cardId, index) => {
        const card = cards[cardId];
        const button = document.createElement("button");

        button.className = "remove-card-button";
        button.textContent = `${card.name} を削除`;

        button.addEventListener("click", () => {
            removeCard(index);
        });

        container.appendChild(button);
    });
}

function removeCard(index) {
    const removePrice = getRemoveCardPrice();

    if (player.gold < removePrice) {
        alert("ゴールドが足りません");
        return;
    }

    const cardId = player.starterDeck[index];
    const card = cards[cardId];

    if (!card) {
        return;
    }

    player.gold -= removePrice;
    player.starterDeck.splice(index, 1);

    alert(`${card.name} を削除しました`);

    showShop();
}
