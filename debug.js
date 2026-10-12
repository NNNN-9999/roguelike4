// ======================
// v86 DEBUG MODE
// F2 で開閉する開発用パネル
// ======================

(() => {
    const bossIds = [
        ["splitBoss", "キングスライム"],
        ["summonBoss", "イリス"],
        ["chargeBoss", "ヘキサウルフ"],
        ["thornBoss", "ガーディアン"],
        ["twinBoss", "ヴァーミリオン＆セレス"]
    ];

    const normalIds = Object.values(enemies || {})
        .filter(data => data?.type === "normal")
        .map(data => [data.id, data.name || data.id]);

    const eliteIds = Object.values(enemies || {})
        .filter(data => data?.type === "elite")
        .map(data => [data.id, data.name || data.id]);

    let panel = null;
    let logBox = null;
    let adminDeckMode = false;

    function log(message) {
        console.log("🧪 DEBUG:", message);
        if (!logBox) return;
        const time = new Date().toLocaleTimeString("ja-JP", {
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        });
        const row = document.createElement("div");
        row.className = "debug-log-row";
        row.textContent = `[${time}] ${message}`;
        logBox.prepend(row);
        while (logBox.children.length > 30) logBox.lastElementChild?.remove();
    }

    function currentUnit() {
        if (!Array.isArray(battleEnemies) || battleEnemies.length === 0) return null;
        if (typeof syncSelectedEnemy === "function") syncSelectedEnemy();
        return enemy || battleEnemies[selectedEnemyIndex] || null;
    }

    function ensurePlayer() {
        if (player) return true;
        const characterId = document.getElementById("debug-character")?.value || "warrior";
        if (!characters?.[characterId]) return false;
        startGame(characterId);
        log(`${characters[characterId].name || characterId} でデバッグ用ランを作成`);
        return Boolean(player);
    }

    function startEnemyBattle(enemyId) {
        const data = enemies?.[enemyId];
        if (!data) return log(`敵が見つからない: ${enemyId}`);
        if (!ensurePlayer()) return log("プレイヤー初期化に失敗");

        window.__debugForcedEnemyId = enemyId;
        changeScene("battle");
        startBattle(data.type);
        log(`直接戦闘開始: ${data.name || enemyId}`);
        refresh();
    }

    function refresh() {
        try { if (typeof syncSelectedEnemy === "function") syncSelectedEnemy(); } catch (_) {}
        try { if (typeof updatePlayerUI === "function") updatePlayerUI(); } catch (_) {}
        try { if (typeof updateEnemyUI === "function") updateEnemyUI(); } catch (_) {}
        try { if (typeof renderHand === "function") renderHand(); } catch (_) {}
        updateSummary();
        updateDebugCardPicker();
        updateDebugDeckEditor();
        updateWizardManaDebug();
        updateDebugItems();
    }

    function updateSummary() {
        const summary = document.getElementById("debug-summary");
        if (!summary) return;
        const unit = currentUnit();
        const playerText = player
            ? `${player.name || selectedCharacter || "Player"} HP ${player.hp}/${player.maxHp} E ${player.energy}`
            : "未開始";
        const enemyText = unit
            ? `${unit.name || unit.id} HP ${unit.hp}/${unit.maxHp}`
            : "敵なし";
        summary.innerHTML = `<span>PLAYER: ${playerText}</span><span>ENEMY: ${enemyText}</span>`;
    }

    function setEnemyHp(mode) {
        const unit = currentUnit();
        if (!unit) return log("操作できる敵がいない");

        const before = unit.hp;
        if (mode === "half") unit.hp = Math.max(1, Math.floor(unit.maxHp * 0.49));
        if (mode === "one") unit.hp = 1;
        if (mode === "full") unit.hp = unit.maxHp;

        const hpDamage = Math.max(0, before - unit.hp);
        if (hpDamage > 0 && typeof handleBossDamageEvent === "function") {
            handleBossDamageEvent(unit, hpDamage, before);
        }
        log(`${unit.name}: HP ${unit.hp}/${unit.maxHp}`);
        refresh();
    }

    function killSelectedEnemy() {
        const unit = currentUnit();
        if (!unit) return log("操作できる敵がいない");
        dealDamage(unit, Math.max(1, (unit.block || 0) + unit.hp));
        log(`${unit.name}: 即撃破`);
        refresh();
    }

    function healPlayerDebug() {
        if (!ensurePlayer()) return;
        player.hp = player.maxHp;
        log(`プレイヤーHP全回復`);
        refresh();
    }

    function addEnergyDebug() {
        if (!ensurePlayer()) return;
        player.energy = (player.energy || 0) + 10;
        log("エナジー +10");
        refresh();
    }

    function addBlockDebug() {
        if (!ensurePlayer()) return;
        player.block = (player.block || 0) + 100;
        log("ブロック +100");
        refresh();
    }

    function drawDebug() {
        if (!player || Scene?.current !== "battle") return log("戦闘中に使用してね");
        drawCards(5);
        log("5枚ドロー");
        refresh();
    }

    function setChargeStage(stage) {
        const unit = battleEnemies?.find(u => u?.bossAbility?.type === "chargeCycle");
        if (!unit) return log("蓄積型ボスがいない");
        const maxStage = unit.bossAbility.maxStage ?? 6;
        unit.chargeStage = Math.max(0, Math.min(maxStage, Number(stage) || 0));
        refreshBossIntent(unit);
        log(`灯火 ${unit.chargeStage}/${maxStage}`);
        refresh();
    }

    function forceSplit() {
        const unit = currentUnit();
        if (!unit || unit.bossAbility?.type !== "splitChain") {
            return log("分裂可能なスライムを選択してね");
        }
        if ((unit.splitStage || 0) >= 2) return log("小型はこれ以上分裂しない");
        markSplitPending(unit);
        log(`${unit.name}: 次の行動を分裂に変更`);
        refresh();
    }

    function forceSummon() {
        const owner = battleEnemies?.find(u => u?.hp > 0 && u?.bossAbility?.type === "summonMinions");
        if (!owner) return log("召喚型ボスがいない");
        performSummon(owner);
        log("子分を即時補充");
        refresh();
    }

    function forceThorn() {
        const unit = battleEnemies?.find(u => u?.hp > 0 && u?.bossAbility?.type === "thornCycle");
        if (!unit) return log("トゲ型ボスがいない");

        // v94: デバッグでは待たずにトゲ状態へ即移行。
        // 画像切替・20ブロック・反撃をその場で確認できる。
        unit.thornPending = false;
        unit.thornActive = true;
        unit.thornVisualActive = true;
        unit.thorns = unit.bossAbility?.thorns ?? 3;
        unit.block = Math.max(unit.block || 0, unit.bossAbility?.thornBlock ?? 20);
        unit.specialNotice = `DEBUG: トゲ${unit.thorns} / ブロック${unit.block}`;
        log(`トゲ状態を即時発動: トゲ${unit.thorns} / ブロック${unit.block}`);
        refresh();
    }

    function addDebugStatus(target, statusId, amount = 1) {
        if (!target) return log("対象がいない");
        if (typeof addStatus !== "function") return log("状態異常システムが見つからない");

        addStatus(target, statusId, amount, { ignoreResistance: true });

        const label =
            (typeof STATUS_DEFS !== "undefined" && STATUS_DEFS[statusId]?.name)
                ? STATUS_DEFS[statusId].name
                : statusId;

        log(`${target.name || "対象"}: ${label} +${amount}`);
        refresh();
    }

    function returnMap() {
        if (!player) return log("ランがまだない");
        changeScene("map");
        log("マップへ移動");
        refresh();
    }

    function jumpToStage() {
        if (!ensurePlayer()) {
            return log("プレイヤー初期化に失敗");
        }

        if (
            typeof createMap !== "function" ||
            typeof showMap !== "function"
        ) {
            return log("マップ機能が見つからない");
        }

        const depthInput =
            document.getElementById(
                "debug-stage-depth"
            );

        const floorInput =
            document.getElementById(
                "debug-stage-floor"
            );

        const targetDepth =
            Math.max(
                1,
                Number(depthInput?.value || 1)
            );

        const maxLayers =
            typeof MAP_LAYERS === "number"
                ? MAP_LAYERS
                : 10;

        const requestedFloor =
            floorInput?.value === "boss"
                ? maxLayers + 1
                : Math.max(
                    1,
                    Math.min(
                        maxLayers,
                        Number(floorInput?.value || 1)
                    )
                );

        currentDepth = targetDepth;
        floor = requestedFloor;
        currentMapNode = null;

        if (
            typeof visitedMapNodeIds !== "undefined" &&
            visitedMapNodeIds?.clear
        ) {
            visitedMapNodeIds.clear();
        }

        mapData = createMap();

        if (requestedFloor > 1) {
            const previousLayerIndex =
                Math.min(
                    requestedFloor - 2,
                    mapData.length - 2
                );

            const previousNode =
                mapData[previousLayerIndex]?.[0] ||
                null;

            if (previousNode) {
                currentMapNode =
                    previousNode;

                for (
                    let i = 0;
                    i <= previousLayerIndex;
                    i++
                ) {
                    const node =
                        mapData[i]?.[0];

                    if (
                        node &&
                        typeof visitedMapNodeIds !== "undefined"
                    ) {
                        visitedMapNodeIds.add(
                            node.id
                        );
                    }
                }
            }
        }

        showMap();

        if (typeof saveRunState === "function") {
            saveRunState();
        }

        panel?.classList.add("hidden");

        log(
            `階層移動: B${targetDepth} / ${
                requestedFloor > maxLayers
                    ? "BOSS"
                    : `Layer ${requestedFloor}`
            }`
        );

        refresh();
    }

    function prepareDebugLocation(nodeType = "event") {
        if (!ensurePlayer()) {
            return false;
        }

        if (
            typeof createMap !== "function" ||
            typeof MAP_TYPES === "undefined"
        ) {
            log("マップ機能が見つからない");
            return false;
        }

        if (!Array.isArray(mapData) || mapData.length === 0) {
            currentDepth = Math.max(1, Number(currentDepth || 1));
            mapData = createMap();
        }

        // デバッグ用の仮ノードを作る。
        // 各画面の「次へ / マップへ戻る」もそのまま動くよう、
        // 次Layerへの接続だけ持たせておく。
        const nextLayer = mapData[1] || [];

        currentMapNode = {
            id: `DEBUG-${nodeType}-${Date.now()}`,
            floor: 1,
            index: 0,
            type: nodeType,
            connections: nextLayer.map(node => node.id)
        };

        floor = 1;
        return true;
    }

    function jumpToDebugLocation(kind) {
        if (!ensurePlayer()) {
            return log("プレイヤー初期化に失敗");
        }

        const hidePanel = () => {
            panel?.classList.add("hidden");
        };

        switch (kind) {
            case "map":
                if (!Array.isArray(mapData) || mapData.length === 0) {
                    mapData = createMap();
                    currentMapNode = null;
                    floor = 1;
                }
                showMap();
                log("マップへ移動");
                break;

            case "shop":
                if (!prepareDebugLocation(MAP_TYPES.SHOP)) return;
                // 毎回デバッグ用の商品を再抽選できるようにする。
                if (typeof activeShopNodeId !== "undefined") {
                    activeShopNodeId = null;
                }
                showShop();
                log("ショップへ移動");
                break;

            case "rest":
                if (!prepareDebugLocation(MAP_TYPES.REST)) return;
                showRest();
                log("休憩所へ移動");
                break;

            case "event":
                if (!prepareDebugLocation(MAP_TYPES.EVENT)) return;
                showEvent();
                log("イベントへ移動");
                break;

            case "treasure":
                if (!prepareDebugLocation(MAP_TYPES.TREASURE)) return;
                showTreasureReward();
                log("宝箱報酬へ移動");
                break;

            case "reward":
                if (!prepareDebugLocation(MAP_TYPES.BATTLE)) return;
                showRewardScreen("normal");
                log("通常戦報酬へ移動");
                break;

            case "eliteReward":
                if (!prepareDebugLocation(MAP_TYPES.ELITE)) return;
                showEliteRewardScreen();
                log("エリート報酬へ移動");
                break;

            case "bossReward":
                if (!prepareDebugLocation(MAP_TYPES.BOSS)) return;
                showBossRewardScreen();
                log("ボス報酬へ移動");
                break;

            default:
                return log(`移動先が不明: ${kind}`);
        }

        hidePanel();
        refresh();
    }

    // v146: デッキと戦闘中の山札を別々に編集する。
    function availableDebugCards() {
        const query = (panel?.querySelector("#debug-card-search")?.value || "").trim().toLowerCase();
        const charId = selectedCharacter || panel?.querySelector("#debug-character")?.value || "warrior";
        return Object.values(cards || {})
            .filter(card => card && !card.special && (adminDeckMode || !card.upgraded))
            .filter(card => adminDeckMode || !card.character || card.character === charId)
            .filter(card => !query || `${card.name} ${card.id} ${card.rarity}`.toLowerCase().includes(query))
            .sort((a, b) => (a.character || "").localeCompare(b.character || "") || a.name.localeCompare(b.name, "ja"));
    }

    function updateDebugCardPicker() {
        const picker = panel?.querySelector("#debug-card-picker");
        if (!picker) return;
        const current = picker.value;
        picker.replaceChildren();
        const candidates = availableDebugCards();
        for (const card of candidates) {
            const option = document.createElement("option");
            option.value = card.id;
            option.textContent = `${card.name} [${card.rarity}] (${card.character || "共通"})`;
            picker.appendChild(option);
        }
        if (candidates.some(card => card.id === current)) picker.value = current;
        const msg = panel.querySelector("#debug-card-count");
        if (msg) msg.textContent = `${candidates.length}種 / 所持 ${player?.starterDeck?.length || 0}枚`;
    }

    function updateDebugDeckEditor() {
        const area = panel?.querySelector("#debug-deck-editor");
        const drawArea = panel?.querySelector("#debug-draw-editor");
        if (!area || !drawArea) return;
        const deck = player?.starterDeck || [];
        const counts = {};
        for (const id of deck) counts[id] = (counts[id] || 0) + 1;
        area.replaceChildren();
        for (const [id, amount] of Object.entries(counts)) {
            const row = document.createElement("div");
            row.className = "debug-deck-row";
            const label = document.createElement("span");
            label.textContent = `${cards[id]?.name || id} ×${amount}`;
            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "1枚削除";
            remove.disabled = !adminDeckMode;
            remove.addEventListener("click", () => removeDebugCard(id, "deck"));
            row.append(label, remove);
            area.appendChild(row);
        }
        if (!deck.length) area.textContent = "デッキは空";
        drawArea.replaceChildren();
        const pile = player?.drawPile || [];
        const pileCounts = {};
        for (const id of pile) pileCounts[id] = (pileCounts[id] || 0) + 1;
        for (const [id, amount] of Object.entries(pileCounts)) {
            const row = document.createElement("div");
            row.className = "debug-deck-row";
            const label = document.createElement("span");
            label.textContent = `${cards[id]?.name || id} ×${amount}`;
            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "山札から削除";
            remove.disabled = !adminDeckMode || Scene?.current !== "battle";
            remove.addEventListener("click", () => removeDebugCard(id, "draw"));
            row.append(label, remove);
            drawArea.appendChild(row);
        }
        if (Scene?.current !== "battle") drawArea.textContent = "戦闘中のみ編集可能";
        else if (!pile.length) drawArea.textContent = "山札は空";
        const switcher = panel.querySelector("#debug-admin-switch");
        if (switcher) {
            switcher.checked = adminDeckMode;
            const status = panel.querySelector("#debug-admin-status");
            if (status) status.textContent = adminDeckMode ? "ON：デッキ・戦闘山札を編集可能" : "OFF：カード追加のみ";
        }
    }

    function addDebugCard() {
        if (!ensurePlayer()) return;
        const id = panel?.querySelector("#debug-card-picker")?.value;
        const card = cards?.[id];
        if (!card || card.special) return log("追加するカードを選んでね");
        if (!adminDeckMode && card.character && card.character !== selectedCharacter) {
            return log("別キャラのカードは管理者モードでのみ追加可能");
        }
        if (!Array.isArray(player.starterDeck)) player.starterDeck = [];
        player.starterDeck.push(id);
        // 戦闘中は、次のドローから試せるよう山札にも追加。
        if (Scene?.current === "battle") player.drawPile.push(id);
        if (typeof saveRunState === "function") saveRunState();
        log(`カード獲得: ${card.name}`);
        refresh();
    }

    function removeDebugCard(id, place) {
        if (!adminDeckMode || !player) return;
        const array = place === "draw" ? player.drawPile : player.starterDeck;
        if (!Array.isArray(array)) return;
        const index = array.indexOf(id);
        if (index < 0) return;
        array.splice(index, 1);
        // デッキから削除するときは戦闘中の該当カードも1枚取り除く。
        if (place === "deck" && Scene?.current === "battle") {
            for (const pile of [player.drawPile, player.discardPile, player.hand, player.exhaustPile]) {
                const i = pile?.indexOf(id) ?? -1;
                if (i >= 0) { pile.splice(i, 1); break; }
            }
        }
        if (typeof saveRunState === "function") saveRunState();
        log(`${cards[id]?.name || id} を${place === "deck" ? "デッキ" : "戦闘山札"}から1枚削除`);
        refresh();
    }

    // v149: 魔法使いの属性魔力をF2から直接調整
    function changeWizardMana(kind, amount) {
        if (!player) return log("先に魔法使いでラン/戦闘を開始してね");
        if (selectedCharacter !== "wizard") return log("属性魔力は魔法使い選択時のみ変更できる");
        if (typeof ensureWizardMana !== "function") return log("属性魔力システムが見つからない");

        const mana = ensureWizardMana();
        if (kind === "all") {
            for (const type of ["fire", "lightning", "ice"]) {
                mana[type] = Math.max(0, (Number(mana[type]) || 0) + amount);
            }
            log(`全属性魔力 ${amount >= 0 ? "+" : ""}${amount}`);
        } else if (["fire", "lightning", "ice"].includes(kind)) {
            mana[kind] = Math.max(0, (Number(mana[kind]) || 0) + amount);
            const label = {fire:"炎", lightning:"雷", ice:"氷"}[kind];
            log(`${label}魔力 ${amount >= 0 ? "+" : ""}${amount}`);
        }
        refresh();
    }

    function resetWizardManaDebug() {
        if (!player) return log("先に魔法使いでラン/戦闘を開始してね");
        if (selectedCharacter !== "wizard") return log("属性魔力は魔法使い選択時のみ変更できる");
        if (typeof ensureWizardMana !== "function") return log("属性魔力システムが見つからない");

        const mana = ensureWizardMana();
        mana.fire = 0;
        mana.lightning = 0;
        mana.ice = 0;
        log("属性魔力をリセット");
        refresh();
    }

    function updateWizardManaDebug() {
        const value = panel?.querySelector("#debug-wizard-mana-value");
        if (!value) return;
        if (!player || selectedCharacter !== "wizard" || typeof ensureWizardMana !== "function") {
            value.textContent = "魔法使いで開始すると現在値を表示";
            return;
        }
        const mana = ensureWizardMana();
        value.textContent = `現在値：🔥 ${mana.fire} / ⚡ ${mana.lightning} / ❄️ ${mana.ice}`;
    }

    function buttons(items) {
        return items.map(([id, label]) =>
            `<button type="button" data-debug-enemy="${id}">${label}</button>`
        ).join("");
    }

    function updateDebugItems() {
        if (!panel) return;
        for (const [kind, source] of [["relic", relics], ["potion", potions]]) {
            const input = panel.querySelector(`#debug-${kind}-search`);
            const picker = panel.querySelector(`#debug-${kind}-picker`);
            if (!input || !picker) continue;
            const q = input.value.trim().toLowerCase();
            const old = picker.value;
            const rows = Object.values(source || {}).filter(v =>
                (!v.character || v.character === selectedCharacter || adminDeckMode) &&
                `${v.name} ${v.id} ${v.rarity || v.category || ""}`.toLowerCase().includes(q)
            );
            picker.replaceChildren(...rows.map(v => {
                const o = document.createElement('option');
                o.value = v.id;
                o.textContent = `${v.icon || '◆'} ${v.name} [${v.rarity || v.category || ''}]`;
                return o;
            }));
            if (rows.some(v => v.id === old)) picker.value = old;
            const note = panel.querySelector(`#debug-${kind}-count`);
            if (note) note.textContent = `${rows.length}件`;
        }
        const owned = panel.querySelector('#debug-relic-owned');
        if (owned) owned.textContent = `所持レリック：${(player?.relics || []).map(id => relics[id]?.name || id).join(' / ') || 'なし'}`;
    }

    function debugGrantItem(kind) {
        if (!ensurePlayer()) return;
        const id = panel.querySelector(`#debug-${kind}-picker`)?.value;
        if (!id) return;
        const ok = kind === 'relic' ? addRelicDirectly(id) : addPotion(id);
        log(`${kind === 'relic' ? 'レリック' : 'ポーション'} ${id}：${ok ? '取得' : '取得できません（既所持・満杯など）'}`);
        refresh();
    }

    function debugRemoveRelic() {
        if (!adminDeckMode || !player) return log('管理者モードが必要です');
        const id = panel.querySelector('#debug-relic-picker')?.value;
        const index = (player.relics || []).indexOf(id);
        if (index < 0) return log('未所持です');
        // 獲得時の永続的な最大HP変更などは巻き戻さず、今後の効果だけ停止する。
        player.relics.splice(index, 1);
        if (typeof updateOwnedRelicUI === 'function') updateOwnedRelicUI();
        log(`レリック削除：${id}`);
        refresh();
    }

    function createPanel() {
        if (document.getElementById("debug-panel")) {
            panel = document.getElementById("debug-panel");
            logBox = document.getElementById("debug-log");
            return;
        }

        panel = document.createElement("aside");
        panel.id = "debug-panel";
        panel.className = "debug-panel hidden";

        const charOptions = Object.entries(characters || {}).map(([id, data]) =>
            `<option value="${id}">${data.name || id}</option>`
        ).join("");

        panel.innerHTML = `
            <div class="debug-head">
                <div><strong>DEBUG MODE</strong><small>v155 / F2で開閉</small></div>
                <button id="debug-close" type="button">×</button>
            </div>
            <div id="debug-summary" class="debug-summary"></div>

            <section class="debug-section">
                <h3>直接戦闘</h3>
                <label class="debug-inline-label">キャラ<select id="debug-character">${charOptions}</select></label>
                <div class="debug-button-grid boss-grid">${buttons(bossIds)}</div>
                <details class="debug-details">
                    <summary>通常敵を選ぶ</summary>
                    <div class="debug-button-grid normal-grid">${buttons(normalIds)}</div>
                </details>
                <details class="debug-details">
                    <summary>エリート敵を選ぶ</summary>
                    <div class="debug-button-grid normal-grid">${buttons(eliteIds)}</div>
                </details>
            </section>

            <section class="debug-section">
                <h3>画面へ移動</h3>
                <div class="debug-button-grid debug-location-grid">
                    <button type="button" data-debug-location="shop">🛒 ショップ</button>
                    <button type="button" data-debug-location="rest">🔥 休憩所</button>
                    <button type="button" data-debug-location="event">❓ イベント</button>
                    <button type="button" data-debug-location="treasure">🎁 宝箱</button>
                    <button type="button" data-debug-location="reward">🃏 通常報酬</button>
                    <button type="button" data-debug-location="eliteReward">⭐ エリート報酬</button>
                    <button type="button" data-debug-location="bossReward">👑 ボス報酬</button>
                    <button type="button" data-debug-location="map">🗺️ マップ</button>
                </div>
            </section>

            <section class="debug-section">
                <h3>階層移動</h3>
                <div class="debug-stage-jump">
                    <label>
                        B
                        <input
                            id="debug-stage-depth"
                            type="number"
                            min="1"
                            max="99"
                            value="1"
                        >
                    </label>

                    <select id="debug-stage-floor">
                        ${Array.from(
                            { length: 10 },
                            (_, i) =>
                                `<option value="${i + 1}">Layer ${i + 1}</option>`
                        ).join("")}
                        <option value="boss">BOSS</option>
                    </select>

                    <button
                        id="debug-stage-jump"
                        type="button"
                    >
                        移動
                    </button>
                </div>
            </section>

            <section class="debug-section">
                <h3>プレイヤー</h3>
                <div class="debug-button-grid">
                    <button id="debug-heal" type="button">HP全回復</button>
                    <button id="debug-energy" type="button">エナジー+10</button>
                    <button id="debug-block" type="button">ブロック+100</button>
                    <button id="debug-draw" type="button">5枚ドロー</button>
                </div>
            </section>

            <section class="debug-section">
                <h3>魔法使い・属性魔力</h3>
                <small id="debug-wizard-mana-value">魔法使いで開始すると現在値を表示</small>
                <div class="debug-button-grid">
                    <button type="button" data-debug-wizard-mana="fire" data-debug-mana-amount="5">🔥 炎 +5</button>
                    <button type="button" data-debug-wizard-mana="lightning" data-debug-mana-amount="5">⚡ 雷 +5</button>
                    <button type="button" data-debug-wizard-mana="ice" data-debug-mana-amount="5">❄️ 氷 +5</button>
                    <button type="button" data-debug-wizard-mana="all" data-debug-mana-amount="10">✨ 全属性 +10</button>
                    <button id="debug-wizard-mana-reset" type="button">魔力リセット</button>
                </div>
            </section>

            <section class="debug-section">
                <h3>レリック取得・検索</h3>
                <input id="debug-relic-search" type="search" placeholder="名前・ID・レアリティで検索">
                <select id="debug-relic-picker" aria-label="取得するレリック"></select>
                <div class="debug-button-grid"><button id="debug-relic-add" type="button">レリック取得</button><button id="debug-relic-remove" type="button" class="debug-danger">選択レリック削除（管理者）</button></div>
                <small id="debug-relic-count"></small><small id="debug-relic-owned"></small>
            </section>
            <section class="debug-section">
                <h3>ポーション取得・検索</h3>
                <input id="debug-potion-search" type="search" placeholder="名前・IDで検索">
                <select id="debug-potion-picker" aria-label="取得するポーション"></select>
                <div class="debug-button-grid"><button id="debug-potion-add" type="button">ポーション追加</button></div>
                <small id="debug-potion-count"></small>
            </section>
            <section class="debug-section">
                <h3>カード取得・管理者デッキ編集</h3>
                <label class="debug-inline-label">検索
                    <input id="debug-card-search" type="search" placeholder="名前・ID・レアリティ" autocomplete="off">
                </label>
                <select id="debug-card-picker" aria-label="取得するカード"></select>
                <div class="debug-button-grid">
                    <button id="debug-card-add" type="button">選択したカードを取得</button>
                </div>
                <small id="debug-card-count"></small>
                <label class="debug-admin-label">
                    <input type="checkbox" id="debug-admin-switch">
                    <strong>管理者編集モード</strong>
                    <span id="debug-admin-status">OFF：カード追加のみ</span>
                </label>
                <details class="debug-details" open>
                    <summary>デッキ内のカード（1枚ずつ削除）</summary>
                    <div id="debug-deck-editor" class="debug-deck-list"></div>
                </details>
                <details class="debug-details">
                    <summary>戦闘中の山札（1枚ずつ削除）</summary>
                    <div id="debug-draw-editor" class="debug-deck-list"></div>
                </details>
            </section>

            <section class="debug-section">
                <h3>選択中の敵</h3>
                <div class="debug-button-grid">
                    <button data-debug-hp="half" type="button">HP49%</button>
                    <button data-debug-hp="one" type="button">HP1</button>
                    <button data-debug-hp="full" type="button">HP全快</button>
                    <button id="debug-kill" class="debug-danger" type="button">即撃破</button>
                </div>
            </section>

            <section class="debug-section">
                <h3>状態効果</h3>
                <div class="debug-status-target">プレイヤー</div>
                <div class="debug-button-grid debug-status-grid">
                    <button type="button" data-debug-status-target="player" data-debug-status="vulnerable">脆弱 +1</button>
                    <button type="button" data-debug-status-target="player" data-debug-status="weak">弱体 +1</button>
                    <button type="button" data-debug-status-target="player" data-debug-status="strength">筋力 +1</button>
                    <button type="button" data-debug-status-target="player" data-debug-status="ritual">儀式 +1</button>
                    <button type="button" data-debug-status-target="player" data-debug-status="artifact">アーティファクト +1</button>
                    <button type="button" data-debug-status-target="player" data-debug-status="regeneration">再生 +1</button>
                </div>
                <div class="debug-status-target">選択中の敵</div>
                <div class="debug-button-grid debug-status-grid">
                    <button type="button" data-debug-status-target="enemy" data-debug-status="vulnerable">脆弱 +1</button>
                    <button type="button" data-debug-status-target="enemy" data-debug-status="weak">弱体 +1</button>
                    <button type="button" data-debug-status-target="enemy" data-debug-status="strength">筋力 +1</button>
                    <button type="button" data-debug-status-target="enemy" data-debug-status="ritual">儀式 +1</button>
                    <button type="button" data-debug-status-target="enemy" data-debug-status="artifact">アーティファクト +1</button>
                    <button type="button" data-debug-status-target="enemy" data-debug-status="blockRetain">バリケード +1</button>
                    <button type="button" data-debug-status-target="enemy" data-debug-status="reactiveArmor">リアクティブアーマー +1</button>
                    <button type="button" data-debug-status-target="enemy" data-debug-status="regeneration">再生 +1</button>
                </div>
            </section>

            <section class="debug-section">
                <h3>ボス固有</h3>
                <div class="debug-charge-row">
                    <span>蓄積</span>
                    ${[0,1,2,3,4,5,6].map(n => `<button type="button" data-debug-charge="${n}">${n}</button>`).join("")}
                </div>
                <div class="debug-button-grid">
                    <button id="debug-split" type="button">分裂を予約</button>
                    <button id="debug-summon" type="button">子分を補充</button>
                    <button id="debug-thorn" type="button">トゲ即時発動</button>
                    <button id="debug-map" type="button">マップへ戻る</button>
                </div>
            </section>

            <section class="debug-section">
                <div class="debug-log-title"><h3>DEBUG LOG</h3><button id="debug-log-clear" type="button">消去</button></div>
                <div id="debug-log" class="debug-log"></div>
            </section>
        `;

        document.body.appendChild(panel);
        logBox = panel.querySelector("#debug-log");

        panel.querySelector("#debug-close")?.addEventListener("click", toggle);
        panel.querySelectorAll("[data-debug-enemy]").forEach(b => b.addEventListener("click", () => startEnemyBattle(b.dataset.debugEnemy)));
        panel.querySelectorAll("[data-debug-hp]").forEach(b => b.addEventListener("click", () => setEnemyHp(b.dataset.debugHp)));
        panel.querySelectorAll("[data-debug-charge]").forEach(b => b.addEventListener("click", () => setChargeStage(b.dataset.debugCharge)));
        panel.querySelectorAll("[data-debug-status]").forEach(b => b.addEventListener("click", () => {
            const target = b.dataset.debugStatusTarget === "player"
                ? player
                : currentUnit();
            addDebugStatus(target, b.dataset.debugStatus, 1);
        }));
        for (const kind of ['relic', 'potion']) {
            panel.querySelector(`#debug-${kind}-search`)?.addEventListener('input', updateDebugItems);
            panel.querySelector(`#debug-${kind}-add`)?.addEventListener('click', () => debugGrantItem(kind));
        }
        panel.querySelector('#debug-relic-remove')?.addEventListener('click', debugRemoveRelic);
        panel.querySelector("#debug-card-search")?.addEventListener("input", updateDebugCardPicker);
        panel.querySelector("#debug-character")?.addEventListener("change", () => {updateDebugCardPicker(); updateDebugItems();});
        panel.querySelector("#debug-card-add")?.addEventListener("click", addDebugCard);
        panel.querySelector("#debug-admin-switch")?.addEventListener("change", event => {
            adminDeckMode = Boolean(event.target.checked);
            log(`管理者編集モード ${adminDeckMode ? "ON" : "OFF"}`);
            updateDebugCardPicker();
            updateDebugDeckEditor();
            updateDebugItems();
        });
        panel.querySelector("#debug-heal")?.addEventListener("click", healPlayerDebug);
        panel.querySelector("#debug-energy")?.addEventListener("click", addEnergyDebug);
        panel.querySelector("#debug-block")?.addEventListener("click", addBlockDebug);
        panel.querySelector("#debug-draw")?.addEventListener("click", drawDebug);
        panel.querySelectorAll("[data-debug-wizard-mana]").forEach(button => {
            button.addEventListener("click", () => {
                changeWizardMana(
                    button.dataset.debugWizardMana,
                    Number(button.dataset.debugManaAmount || 0)
                );
            });
        });
        panel.querySelector("#debug-wizard-mana-reset")?.addEventListener("click", resetWizardManaDebug);
        panel.querySelector("#debug-kill")?.addEventListener("click", killSelectedEnemy);
        panel.querySelector("#debug-split")?.addEventListener("click", forceSplit);
        panel.querySelector("#debug-summon")?.addEventListener("click", forceSummon);
        panel.querySelector("#debug-thorn")?.addEventListener("click", forceThorn);
        panel.querySelector("#debug-map")?.addEventListener("click", returnMap);
        panel.querySelectorAll("[data-debug-location]").forEach(button => {
            button.addEventListener("click", () => {
                jumpToDebugLocation(button.dataset.debugLocation);
            });
        });

        panel
            .querySelector("#debug-stage-jump")
            ?.addEventListener(
                "click",
                jumpToStage
            );
        panel.querySelector("#debug-log-clear")?.addEventListener("click", () => { if (logBox) logBox.innerHTML = ""; });

        log("デバッグパネル準備完了");
        updateSummary();
        updateDebugCardPicker();
        updateDebugDeckEditor();
        updateDebugItems();
    }

    function toggle() {
        if (!panel) createPanel();
        panel?.classList.toggle("hidden");
        if (panel && !panel.classList.contains("hidden")) refresh();
    }

    document.addEventListener("keydown", event => {
        if (event.key === "F2") {
            event.preventDefault();
            toggle();
        }
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createPanel);
    } else {
        createPanel();
    }

    window.gameDebug = { toggle, startEnemyBattle, setChargeStage, refresh };
})();
