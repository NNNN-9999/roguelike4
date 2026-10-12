
function ensurePileViewer(){
    let modal=document.getElementById("pile-viewer-modal");if(modal)return modal;
    modal=document.createElement("div");modal.id="pile-viewer-modal";modal.className="pile-viewer-modal hidden";
    modal.innerHTML=`<div class="pile-viewer-backdrop"></div><div class="pile-viewer-card"><button id="pile-viewer-close" class="pile-viewer-close" type="button">×</button><h3 id="pile-viewer-title"></h3><div id="pile-viewer-list"></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector(".pile-viewer-backdrop").addEventListener("click",()=>modal.classList.add("hidden"));
    modal.querySelector("#pile-viewer-close").addEventListener("click",()=>modal.classList.add("hidden"));
    return modal;
}
function showPileViewer(title,cardIds){
    const modal=ensurePileViewer();modal.querySelector("#pile-viewer-title").textContent=title;
    const counts=new Map();(cardIds||[]).forEach(id=>counts.set(id,(counts.get(id)||0)+1));
    modal.querySelector("#pile-viewer-list").innerHTML=counts.size?[...counts.entries()].map(([id,count])=>{const card=cards[id];if(!card)return"";return`<div class="pile-viewer-item ${card.rarity||"rare"}"><div><strong>${card.name}</strong><small>COST ${card.cost}</small></div><span>×${count}</span></div>`;}).join(""):`<p class="pile-viewer-empty">カードはありません。</p>`;
    modal.classList.remove("hidden");
}
function renderBattleDeckStatus(){
    if(!player)return;
    if(!Array.isArray(player.exhaustPile))player.exhaustPile=[];

    const drawContainer=document.getElementById("battle-draw-pile");
    const sideContainer=document.getElementById("battle-side-piles");
    const legacy=document.getElementById("battle-deck-status");

    const discard=player.discardPile?.length||0;
    let graveClass="";
    if(selectedCharacter==="gravekeeper"){
        graveClass=discard>=10?" grave-hot":discard>=6?" grave-ready":" grave-focus";
    }

    if(drawContainer){
        drawContainer.innerHTML=`<button class="pile-counter compact-pile draw" data-pile="draw" type="button" title="山札を確認"><span>📚</span><strong>${player.drawPile?.length||0}</strong></button>`;
    }

    if(sideContainer){
        sideContainer.innerHTML=`
          <button class="pile-counter compact-pile discard${graveClass}" data-pile="discard" type="button" title="捨て札を確認"><span>🪦</span><strong>${discard}</strong></button>
          <button class="pile-counter compact-pile exhaust" data-pile="exhaust" type="button" title="消滅を確認"><span>🔥</span><strong>${player.exhaustPile.length}</strong></button>`;
    }

    if(legacy){legacy.innerHTML="";}

    const config={
        draw:["📚 山札",player.drawPile||[]],
        discard:["🪦 捨て札",player.discardPile||[]],
        exhaust:["🔥 消滅",player.exhaustPile||[]]
    };

    [drawContainer,sideContainer].filter(Boolean).forEach(container=>{
        container.querySelectorAll("[data-pile]").forEach(button=>button.addEventListener("click",()=>{
            const[t,ids]=config[button.dataset.pile];
            showPileViewer(t,ids);
        }));
    });
}

// ======================
// v18 レリック取得演出
// ======================

function showRelicAcquired(relicId) {

    const relic =
        typeof relics !== "undefined"
            ? relics[relicId]
            : null;

    if (!relic) {
        return;
    }

    let overlay =
        document.getElementById("relic-acquire-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "relic-acquire-overlay";
        overlay.className = "relic-acquire-overlay";
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div class="relic-acquire-card">
            <div class="relic-acquire-kicker">NEW RELIC</div>
            <div class="relic-acquire-icon">${relic.icon || "💎"}</div>
            <div class="relic-acquire-name">${relic.name}</div>
            <div class="relic-acquire-description">${relic.description || ""}</div>
        </div>
    `;

    overlay.classList.remove("show");
    void overlay.offsetWidth;
    overlay.classList.add("show");

    window.clearTimeout(showRelicAcquired._hideTimer);
    window.clearTimeout(showRelicAcquired._clearTimer);

    showRelicAcquired._hideTimer =
        window.setTimeout(() => {
            overlay.classList.remove("show");
        }, 1450);

    showRelicAcquired._clearTimer =
        window.setTimeout(() => {
            if (!overlay.classList.contains("show")) {
                overlay.innerHTML = "";
            }
        }, 1800);
}


// ======================
// v16 戦闘フィードバック
// ======================

let combatFxStagger = 0;

function getCombatTargetElement(target) {
    if (target === "enemy") {
        return document.querySelector("#enemy-field .enemy-unit.selected-target") ||
            document.querySelector("#enemy-field .enemy-unit");
    }

    return document.getElementById("player-area");
}

function showFloatingCombatText(target, text, kind = "damage", delay = null) {

    const parent = getCombatTargetElement(target);

    if (!parent) {
        return;
    }

    const actualDelay =
        delay === null
            ? Math.min(combatFxStagger++ * 65, 260)
            : delay;

    window.setTimeout(() => {

        const element = document.createElement("div");
        element.className = `combat-floating-text ${kind}`;
        element.textContent = text;

        parent.appendChild(element);

        window.setTimeout(() => {
            element.remove();
        }, 850);

    }, actualDelay);

    window.clearTimeout(showFloatingCombatText._resetTimer);
    showFloatingCombatText._resetTimer = window.setTimeout(() => {
        combatFxStagger = 0;
    }, 330);
}

function triggerBattleTargetEffect(target, kind = "hit") {

    const element = getCombatTargetElement(target);

    if (!element) {
        return;
    }

    element.classList.remove("fx-hit", "fx-block", "fx-heal");
    void element.offsetWidth;
    element.classList.add(`fx-${kind}`);

    window.setTimeout(() => {
        element.classList.remove(`fx-${kind}`);
    }, 190);
}

function triggerCardCastEffect(card) {

    const battle =
        document.getElementById("battle-screen");

    if (!battle || !card) {
        return;
    }

    let effectClass =
        card.type === "attack"
            ? "cast-attack"
            : "cast-skill";

    if (card.element) {
        effectClass = `cast-${card.element}`;
    }

    battle.classList.remove(
        "cast-attack",
        "cast-skill",
        "cast-fire",
        "cast-lightning",
        "cast-ice"
    );

    void battle.offsetWidth;
    battle.classList.add(effectClass);

    window.setTimeout(() => {
        battle.classList.remove(effectClass);
    }, 210);
}

function showRelicTrigger(relicId, message = "") {

    const feed =
        document.getElementById("relic-trigger-feed");

    const relic =
        typeof relics !== "undefined"
            ? relics[relicId]
            : null;

    if (!feed || !relic) {
        return;
    }

    const toast = document.createElement("div");
    toast.className = "relic-trigger-toast";

    toast.innerHTML = `
        <span class="relic-trigger-icon">${relic.icon || "💎"}</span>
        <span>
            <strong>${relic.name}</strong>
            ${message ? `<small>${message}</small>` : ""}
        </span>
    `;

    feed.appendChild(toast);

    window.setTimeout(() => {
        toast.classList.add("leaving");
    }, 1300);

    window.setTimeout(() => {
        toast.remove();
    }, 1650);
}

function updateBattleHpBar(fillId, current, max) {

    const fill = document.getElementById(fillId);

    if (!fill) {
        return;
    }

    const percent =
        max > 0
            ? Math.max(0, Math.min(100, current / max * 100))
            : 0;

    fill.style.width = `${percent}%`;
}

function updatePersistentRunHud() {

    const hud = document.getElementById("persistent-run-hud");
    const hp = document.getElementById("persistent-run-hp");

    if (!hud || !hp) {
        return;
    }

    const runScene =
        typeof Scene !== "undefined" &&
        ["map", "reward"].includes(Scene.current);

    if (!player || !runScene) {
        hud.classList.add("hidden");
        return;
    }

    hp.textContent = `${player.hp} / ${player.maxHp}`;
    hud.classList.remove("hidden");
}


function updatePlayerUI() {

    updatePersistentRunHud();
    if (typeof renderPotionBelt === "function") renderPotionBelt();

    const playerName =
        document.getElementById("player-name");

    const playerAvatar =
        document.getElementById("player-avatar");

    const characterIcons = {
        warrior: "⚔️",
        wizard: "🔮",
        machinist: "⚙️",
        gravekeeper: "🪦"
    };

    const characterBattleSprites = {
        warrior: "assets/characters/battle/warrior.webp",
        wizard: "assets/characters/battle/wizard.webp",
        machinist: "assets/characters/battle/machinist.webp",
        gravekeeper: "assets/characters/battle/gravekeeper.webp"
    };

    if (playerName) {
        playerName.textContent =
            characters?.[selectedCharacter]?.name ||
            "Player";
    }

    if (playerAvatar) {
        const spriteSrc =
            characterBattleSprites[
                selectedCharacter
            ];

        const characterName =
            characters?.[selectedCharacter]
                ?.name || "Player";

        if (spriteSrc) {
            playerAvatar.classList.add(
                "has-battle-sprite"
            );

            playerAvatar.innerHTML = `
                <img
                    class="battle-player-sprite"
                    src="${spriteSrc}"
                    alt="${characterName}"
                    draggable="false"
                    onerror="this.remove(); this.parentElement.classList.remove('has-battle-sprite'); this.parentElement.textContent='${characterIcons[selectedCharacter] || "🧭"}';"
                >
            `;
        } else {
            playerAvatar.classList.remove(
                "has-battle-sprite"
            );

            playerAvatar.textContent =
                characterIcons[
                    selectedCharacter
                ] || "🧭";
        }
    }

    if (playerAvatar) {
        const playerEffects = getBattleEffectSummaryEntries(player, { isPlayer: true });
        playerAvatar.classList.add("battle-effect-summary-host");
        playerAvatar.setAttribute("tabindex", "0");
        playerAvatar.insertAdjacentHTML(
            "beforeend",
            renderBattleEffectSummaryTooltip(
                playerEffects,
                characters?.[selectedCharacter]?.name || "Player"
            )
        );

        bindBattleEffectSummaryViewport(playerAvatar.parentElement || document);
    }

    const battleFloorIndicator =
        document.getElementById("battle-floor-indicator");

    if (battleFloorIndicator) {
        const floorLabel =
            typeof currentDepth !== "undefined"
                ? `B${currentDepth}`
                : "B1";

        battleFloorIndicator.textContent = floorLabel;
    }

    const battleGoldIndicator =
        document.getElementById("battle-gold-indicator");

    if (battleGoldIndicator) {
        battleGoldIndicator.textContent =
            `💰 ${player.gold || 0}`;
    }

    const playerHpText = document.getElementById("player-hp");
    if (playerHpText) {
        playerHpText.textContent = `HP : ${player.hp} / ${player.maxHp}`;
    }

    const battlePlayerHp = document.getElementById("battle-player-hp");
    if (battlePlayerHp) {
        battlePlayerHp.textContent = `❤️ ${player.hp} / ${player.maxHp}`;
    }

    const playerEnergy = document.getElementById("player-energy");
    if (playerEnergy) {
        playerEnergy.innerHTML = `
            <span class="player-resource energy" title="エナジー">⚡ <strong>${player.energy}</strong></span>
            <span class="player-resource block" title="ブロック">🛡️ <strong>${player.block}</strong></span>
        `;
    }

    updateBattleHpBar(
        "player-hp-bar-fill",
        player.hp,
        player.maxHp
    );

    renderPlayerEffects();
    renderBattleDeckStatus();
}


function renderPlayerEffects() {

    const container = document.getElementById("player-effects");

    if (!container || !player) {
        return;
    }

    const effects = [];

    if (selectedCharacter === "warrior") {
        effects.push({ className: "rage", icon: "🔥", value: player.rage || 0, name: "闘志", description: `現在の闘志：${player.rage || 0}` });
    }

    if (selectedCharacter === "wizard") {
        const mana = typeof ensureWizardMana === "function"
            ? ensureWizardMana()
            : (player.wizardMana || {fire:0, lightning:0, ice:0});
        for (const [key, icon, name] of [
            ["fire", "🔥", "炎魔力"],
            ["lightning", "⚡", "雷魔力"],
            ["ice", "❄️", "氷魔力"]
        ]) {
            effects.push({
                className: "positive wizard-mana-effect",
                icon, value: mana[key] || 0, name,
                description: `${name}：${mana[key] || 0}。使用した属性カードの実際のエナジー消費量ぶん貯まる。`
            });
        }
        const elementIcons = {
            fire: "🔥",
            lightning: "⚡",
            ice: "❄️"
        };

        const nextHints = {
            fire: "🔥→⚡：追加ダメージ。次に雷属性を使うと連鎖します。",
            lightning: "⚡→❄️：ブロック獲得。次に氷属性を使うと連鎖します。",
            ice: "❄️→🔥：カードを1枚引く。次に火属性を使うと連鎖します。"
        };

        const description =
            player.lastElement
                ? nextHints[player.lastElement]
                : "属性カードを順番につなぐと追加効果。🔥→⚡：追加ダメージ / ⚡→❄️：ブロック / ❄️→🔥：1ドロー。";

        effects.push({
            className: "element",
            icon: player.lastElement
                ? (elementIcons[player.lastElement] || "✨")
                : "🔗",
            value: "",
            name: "属性連鎖",
            description
        });
    }

    if ((player.nextTurnEnergyBonus || 0) > 0) effects.push({ className: "positive", icon: "⚡↑", value: player.nextTurnEnergyBonus, name: "次ターン加速", description: `次のターン：エナジー +${player.nextTurnEnergyBonus}` });
    if ((player.nextTurnEnergyPenalty || 0) > 0) effects.push({ className: "negative", icon: "⚡↓", value: player.nextTurnEnergyPenalty, name: "次ターン反動", description: `次のターン：エナジー -${player.nextTurnEnergyPenalty}` });

    if (typeof getStatusEntries === "function") {
        getStatusEntries(player).forEach(status => {
            effects.push({
                className: status.kind === "debuff" ? "negative" : "positive",
                icon: status.icon,
                value: status.value,
                name: status.name,
                description: typeof formatStatusDescription === "function" ? formatStatusDescription(status.id, status.value) : String(status.description || "").replaceAll("X", String(status.value))
            });
        });
    }

    container.innerHTML = effects.map(effect => `
        <span
            class="battle-effect-icon ${effect.className}"
            data-tooltip="${effect.name}${effect.value !== "" ? ` ${effect.value}` : ""}：${effect.description}"
            aria-label="${effect.name}${effect.value !== "" ? ` ${effect.value}` : ""}"
            tabindex="0"
        >
            <span class="effect-symbol">${effect.icon}</span>
            ${effect.value !== "" ? `<strong>${effect.value}</strong>` : ""}
        </span>
    `).join("");
}


function escapeBattleTooltipText(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function renderEnemyRichTooltip(contentHtml, title, body, tone = "neutral") {
    const safeTitle = escapeBattleTooltipText(title);
    const safeBody = escapeBattleTooltipText(body);

    return `
        <span class="enemy-rich-tooltip-wrap">
            ${contentHtml}
            <span class="enemy-rich-tooltip enemy-rich-tooltip-${tone}" role="tooltip">
                <strong class="enemy-rich-tooltip-title">${safeTitle}</strong>
                <span class="enemy-rich-tooltip-body">${safeBody}</span>
            </span>
        </span>
    `;
}


function getBattleEffectSummaryEntries(target, options = {}) {
    const entries = [];
    const isPlayerTarget = options.isPlayer === true;
    if (!target) return entries;

    if (!isPlayerTarget && target.passive) {
        const isBossLike = target.type === "boss" || target.type === "bossPart" || target.isTwinBoss;
        const keepBossPassive =
            target.bossAbility?.type === "chargeCycle" ||
            target.bossAbility?.type === "summonMinions" ||
            target.isSummonerBoss ||
            target.isTwinBoss;

        if (!isBossLike || keepBossPassive) {
            entries.push({
                group:"unique", icon:"◆", name:target.passive.label || "固有能力", value:"",
                description:target.passive.description || ""
            });
        }
    }

    if (isPlayerTarget) {
        if (selectedCharacter === "warrior") entries.push({
            group:"unique", icon:"🔥", name:"闘志", value:player.rage || 0,
            description:`現在の闘志：${player.rage || 0}`
        });
        if (selectedCharacter === "wizard") {
            const hints={fire:"次に雷属性を使うと追加ダメージ。",lightning:"次に氷属性を使うとブロック獲得。",ice:"次に火属性を使うとカードを1枚引く。"};
            entries.push({group:"unique",icon:"🔗",name:"属性連鎖",value:"",
                description:player.lastElement ? hints[player.lastElement] : "🔥→⚡：追加ダメージ / ⚡→❄️：ブロック / ❄️→🔥：1ドロー。"});
        }
        if ((player.nextTurnEnergyBonus||0)>0) entries.push({group:"buff",icon:"⚡↑",name:"次ターン加速",value:player.nextTurnEnergyBonus,description:`次のターン：エナジー +${player.nextTurnEnergyBonus}`});
        if ((player.nextTurnEnergyPenalty||0)>0) entries.push({group:"debuff",icon:"⚡↓",name:"次ターン反動",value:player.nextTurnEnergyPenalty,description:`次のターン：エナジー -${player.nextTurnEnergyPenalty}`});
    }

    if (!isPlayerTarget && (target.thorns||0)>0) entries.push({
        group:"buff",icon:"🌵",name:"トゲ",value:target.thorns,
        description:`攻撃1ヒットごとに、攻撃してきた相手へ${target.thorns}ダメージを与える。`
    });

    if (!isPlayerTarget && target.bossAbility?.type === "chargeCycle") {
        const maxStage = target.bossAbility.maxStage || 6;
        const stage = target.chargeStage ?? 0;
        entries.push({
            group:"buff", icon:"🔥", name:"灯火", value:`${stage}/${maxStage}`,
            description: stage >= maxStage
                ? "灯火が最大。次の行動が強力な解放攻撃になる。"
                : "行動するたび灯火が1段階増える。"
        });
    }

    if (!isPlayerTarget && target.isSummonerBoss && target.summonPending) {
        entries.push({
            group:"buff", icon:"👥", name:"召喚予約", value:"",
            description:"次の行動で子分を補充する。"
        });
    }

    if (!isPlayerTarget && Number.isFinite(target.twinReviveCountdown)) {
        entries.push({
            group:"debuff", icon:"⏳", name:"復活予兆", value:target.twinReviveCountdown,
            description:"カウントが0になると、倒れた相方が復活する。"
        });
    }

    if (typeof getStatusEntries === "function") getStatusEntries(target).forEach(status => entries.push({
        group:status.kind==="debuff" ? "debuff":"buff", icon:status.icon, name:status.name, value:status.value,
        description:typeof formatStatusDescription==="function" ? formatStatusDescription(status.id,status.value) : String(status.description||"").replaceAll("X",String(status.value))
    }));

    const order={unique:0,buff:1,debuff:2};
    return entries.sort((a,b)=>(order[a.group]??9)-(order[b.group]??9));
}

function renderBattleEffectSummaryTooltip(entries, ownerName) {
    const safeName=escapeBattleTooltipText(ownerName||"キャラクター");
    const labels={unique:"固有能力",buff:"バフ",debuff:"デバフ"};
    if (!entries.length) return `<span class="battle-effect-summary-tooltip" role="tooltip"><strong class="battle-effect-summary-heading">${safeName}</strong><span class="battle-effect-summary-empty">現在の効果はありません。</span></span>`;

    let last=null;
    const rows=entries.map(e=>{
        const header=e.group!==last ? `<span class="battle-effect-summary-group battle-effect-summary-group-${e.group}">${labels[e.group]||"効果"}</span>`:"";
        last=e.group;
        return `${header}<span class="battle-effect-summary-row battle-effect-summary-row-${e.group}">
            <span class="battle-effect-summary-name"><span>${escapeBattleTooltipText(e.icon||"•")}</span><strong>${escapeBattleTooltipText(e.name||"効果")}</strong>${e.value!==""&&e.value!=null?`<b>${escapeBattleTooltipText(e.value)}</b>`:""}</span>
            <span class="battle-effect-summary-desc">${escapeBattleTooltipText(e.description||"")}</span></span>`;
    }).join("");
    return `<span class="battle-effect-summary-tooltip" role="tooltip"><strong class="battle-effect-summary-heading">${safeName}：現在の効果</strong><span class="battle-effect-summary-scroll">${rows}</span></span>`;
}


let battleEffectSummaryHideTimer = null;

function getBattleEffectSummaryFloating() {
    let floating = document.getElementById("battle-effect-summary-floating");

    if (!floating) {
        floating = document.createElement("div");
        floating.id = "battle-effect-summary-floating";
        floating.className = "battle-effect-summary-tooltip battle-effect-summary-floating";
        floating.setAttribute("role", "tooltip");
        floating.setAttribute("tabindex", "0");
        document.body.appendChild(floating);

        floating.addEventListener("mouseenter", () => {
            if (battleEffectSummaryHideTimer) {
                clearTimeout(battleEffectSummaryHideTimer);
                battleEffectSummaryHideTimer = null;
            }
        });

        floating.addEventListener("mouseleave", () => {
            floating.classList.remove("is-visible");
        });
    }

    return floating;
}

function placeBattleEffectSummaryFloating(host) {
    const source =
        host.querySelector(":scope > .battle-effect-summary-tooltip");

    if (!source) return;

    const floating = getBattleEffectSummaryFloating();
    floating.innerHTML = source.innerHTML;

    const margin = 12;
    const gap = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const hostRect = host.getBoundingClientRect();

    // Measure first, then place above the character.
    // With multiple enemies this prevents the popup from sitting
    // over the neighboring enemy artwork.
    floating.style.left = "-9999px";
    floating.style.top = "0px";
    floating.classList.add("is-visible");

    const rect = floating.getBoundingClientRect();
    const width = Math.min(
        rect.width || 286,
        viewportWidth - margin * 2
    );
    const height = Math.min(
        rect.height || 300,
        viewportHeight - margin * 2
    );

    let left =
        hostRect.left +
        hostRect.width / 2 -
        width / 2;

    left = Math.max(
        margin,
        Math.min(
            viewportWidth - width - margin,
            left
        )
    );

    let top = hostRect.top - height - gap;

    // If there is not enough room directly above the enemy,
    // keep the popup at the upper edge instead of moving it
    // beside another enemy.
    if (top < margin) {
        top = margin;
    }

    floating.style.left = `${Math.round(left)}px`;
    floating.style.top = `${Math.round(top)}px`;
}

function hideBattleEffectSummaryFloatingSoon() {
    if (battleEffectSummaryHideTimer) {
        clearTimeout(battleEffectSummaryHideTimer);
    }

    battleEffectSummaryHideTimer = setTimeout(() => {
        const floating =
            document.getElementById(
                "battle-effect-summary-floating"
            );

        floating?.classList.remove("is-visible");
    }, 140);
}

function bindBattleEffectSummaryViewport(root = document) {
    const hosts =
        root.querySelectorAll?.(
            ".battle-effect-summary-host"
        ) || [];

    hosts.forEach(host => {
        if (
            host.dataset.summaryViewportBound === "1"
        ) {
            return;
        }

        host.dataset.summaryViewportBound = "1";

        host.addEventListener(
            "mouseenter",
            () => {
                if (battleEffectSummaryHideTimer) {
                    clearTimeout(
                        battleEffectSummaryHideTimer
                    );
                    battleEffectSummaryHideTimer = null;
                }

                placeBattleEffectSummaryFloating(host);
            }
        );

        host.addEventListener(
            "mouseleave",
            hideBattleEffectSummaryFloatingSoon
        );

        host.addEventListener(
            "focusin",
            () => {
                placeBattleEffectSummaryFloating(host);
            }
        );

        host.addEventListener(
            "focusout",
            hideBattleEffectSummaryFloatingSoon
        );
    });
}


function getChargeBossImage(unit) {
    if (
        unit?.bossAbility?.type !== "chargeCycle" ||
        !Array.isArray(unit?.chargeImages)
    ) {
        return unit?.image;
    }

    const maxStage = unit.bossAbility.maxStage ?? 6;
    const stage = Math.max(
        0,
        Math.min(
            maxStage,
            Number(unit.chargeStage ?? 0)
        )
    );

    return unit.chargeImages[stage] || unit.image;
}

function getEnemyBattleImage(unit) {
    if (
        unit?.bossAbility?.type === "thornCycle" &&
        unit?.thornVisualActive &&
        unit?.thornImage
    ) {
        return unit.thornImage;
    }

    return getChargeBossImage(unit);
}

function updateEnemyUI() {

    const floatingSummary =
        document.getElementById(
            "battle-effect-summary-floating"
        );

    floatingSummary?.classList.remove(
        "is-visible"
    );

    const field = document.getElementById("enemy-field");
    if (!field) return;

    const units = (typeof battleEnemies !== "undefined" && battleEnemies.length) ? battleEnemies : (enemy ? [enemy] : []);
    if (!units.length) {
        field.innerHTML = "";
        return;
    }

    if (typeof syncSelectedEnemy === "function") syncSelectedEnemy();

    const livingCount =
        units.filter(
            unit => unit && unit.hp > 0
        ).length;

    field.classList.toggle(
        "multi-enemy",
        livingCount > 1
    );

    field.classList.remove(
        "enemy-count-1",
        "enemy-count-2",
        "enemy-count-3",
        "enemy-count-4",
        "enemy-count-5"
    );

    field.classList.add(
        `enemy-count-${Math.min(5, livingCount)}`
    );

    field.innerHTML = units.map((unit, index) => {
        const dead = !unit || unit.hp <= 0;
        const selected = index === selectedEnemyIndex && !dead;
        const move = dead ? null : unit?.nextMove;
        let visibleIntent = "❔";
        let intentTooltip = "次の行動：不明";
        let intentClass = "special";

        if (move) {
            if (move.type === "attack") {
                intentClass = "attack";
                const shownDamage = typeof modifyAttackDamage === "function" ? modifyAttackDamage(unit, player, move.value + (unit._nextAttackBonus || 0)) : move.value + (unit._nextAttackBonus || 0);
                const attackValue = move.hits && move.hits > 1 ? `${shownDamage}×${move.hits}` : `${shownDamage}`;
                visibleIntent = `⚔️ ${attackValue}`;
                intentTooltip = `攻撃：${attackValue}`;
                if (move.addWound) {
                    visibleIntent += " 🩹";
                    intentTooltip += ` / 捨て札に負傷${move.addWound}枚を追加`;
                }
                if (move.applyStatus && typeof STATUS_DEFS !== "undefined") {
                    const status = STATUS_DEFS[move.applyStatus.id];
                    if (status) {
                        const isDebuff = status.kind === "debuff";
                        visibleIntent += isDebuff ? " ☠️" : " ✨";
                        intentTooltip += isDebuff
                            ? " / デバフを付与しようとしている"
                            : " / バフを付与しようとしている";
                    }
                }
            } else if (move.type === "block") {
                intentClass = "block";
                visibleIntent = "🛡️";
                intentTooltip = move.selfBuff
                    ? `防御して自身の筋力+${move.selfBuff.amount || 1}`
                    : "防御しようとしている";
            } else if (move.type === "split") {
                visibleIntent = "🫧 分裂";
                intentTooltip = "このターンを使って2体に分裂する";
            } else if (move.type === "summon") {
                visibleIntent = "👥 召喚";
                intentTooltip = "このターンを使って子分を呼ぶ";
            } else if (move.type === "thorn") {
                visibleIntent = "🌵 🛡️";
                intentTooltip = "20ブロックを得てトゲを展開する。トゲ中は攻撃1ヒットごとに反撃する";
            } else if (move.type === "guardAlly") {
                visibleIntent = "🛡️";
                intentTooltip = `相方へ${move.value || 0}ブロックを付与する`;
            } else if (move.type === "healAlly") {
                visibleIntent = `💚 ${move.value || ""}`;
                intentTooltip = `相方のHPを${move.value || 0}回復する`;
            } else if (move.type === "buffAlly") {
                visibleIntent = `✨ 強化${move.value ? ` +${move.value}` : ""}`;
                intentTooltip = `相方の${move.status === "strength" ? "筋力" : "能力"}を${move.value || 1}強化する`;
            } else if (move.type === "buffSelf") {
                if (move.status === "ritual") {
                    visibleIntent = `🕯️ 儀式${move.value ? ` ${move.value}` : ""}`;
                    intentTooltip = `自身に儀式${move.value || 1}を付与する。以後、毎ターン開始時に筋力が増える`;
                } else {
                    visibleIntent = `💢 強化${move.value ? ` +${move.value}` : ""}`;
                    intentTooltip = `自身の${move.status === "strength" ? "筋力" : "能力"}を${move.value || 1}強化する`;
                }
            } else if (move.type === "debuffPlayer") {
                visibleIntent = `☠️ ${move.status === "vulnerable" ? "脆弱" : "弱体"}${move.value ? ` ${move.value}` : ""}`;
                intentTooltip = `プレイヤーへ${move.status === "vulnerable" ? "脆弱" : "弱体効果"}を${move.value || 1}付与する`;
            } else {
                visibleIntent = "✨";
                intentTooltip = "特殊行動を行う";
            }
        }

        const hpPercent = unit?.maxHp > 0 ? Math.max(0, Math.min(100, unit.hp / unit.maxHp * 100)) : 0;
        let statusHtml =
            !dead &&
            typeof getStatusEntries ===
                "function"
                ? getStatusEntries(unit)
                    .map(status => {
                        const detail =
                            typeof formatStatusDescription ===
                            "function"
                                ? formatStatusDescription(
                                    status.id,
                                    status.value
                                )
                                : String(
                                    status.description || ""
                                ).replaceAll(
                                    "X",
                                    String(status.value)
                                );

                        return renderEnemyRichTooltip(
                            `<span class="enemy-status ${status.kind}" aria-label="${escapeBattleTooltipText(status.name)}">${status.icon}<strong>${status.value}</strong></span>`,
                            `${status.name} ${status.icon}`,
                            detail,
                            status.kind === "debuff"
                                ? "debuff"
                                : "buff"
                        );
                    })
                    .join("")
                : "";

        const bossStateBadges = [];

        let deadTwinReviveCountdown = null;
        if (dead && unit?.isTwinBoss) {
            const livingTwin = units.find(other =>
                other &&
                other !== unit &&
                other.isTwinBoss &&
                other.hp > 0 &&
                Number.isFinite(other.twinReviveCountdown)
            );

            if (livingTwin) {
                deadTwinReviveCountdown =
                    livingTwin.twinReviveCountdown;

                bossStateBadges.push(
                    renderEnemyRichTooltip(
                        `<span class="enemy-status debuff twin-revive-status">⏳<span>復活</span><strong>${deadTwinReviveCountdown}</strong></span>`,
                        "復活予兆 ⏳",
                        "カウントが0になると、この双子が復活する。",
                        "debuff"
                    )
                );
            }
        }

        if (!dead && (unit?.thorns || 0) > 0) {
            bossStateBadges.push(
                renderEnemyRichTooltip(
                    `<span class="enemy-status buff">🌵<span>トゲ</span><strong>${unit.thorns}</strong></span>`,
                    "トゲ 🌵",
                    `攻撃1ヒットごとに、攻撃してきた相手へ${unit.thorns}ダメージを与える。`,
                    "buff"
                )
            );
        }

        if (!dead && unit?.bossAbility?.type === "chargeCycle") {
            const maxStage = unit.bossAbility.maxStage || 6;
            const chargeStage = unit.chargeStage ?? 0;
            const chargeBody = chargeStage >= maxStage
                ? "灯火が最大。次の行動は強力な解放攻撃。使用後、灯火は0/6へ戻る。"
                : `行動するたび灯火が1段階増える。現在 ${chargeStage}/${maxStage}。6/6になると次の行動が解放攻撃になる。`;

            bossStateBadges.push(
                renderEnemyRichTooltip(
                    `<span class="enemy-status buff">🔥<span>灯火</span><strong>${chargeStage}/${maxStage}</strong></span>`,
                    "六灯蓄積 🔥",
                    chargeBody,
                    chargeStage >= maxStage ? "danger" : "buff"
                )
            );
        }

        if (!dead && unit?.isSummonerBoss && unit?.summonPending) {
            bossStateBadges.push(
                renderEnemyRichTooltip(
                    `<span class="enemy-status buff">👥<span>召喚予約</span></span>`,
                    "召喚予約 👥",
                    "現在の行動はキャンセルされず、その次の行動を使って子分を補充する。",
                    "buff"
                )
            );
        }

        statusHtml += bossStateBadges.join("");

        const isBossLikeForPassive =
            unit?.type === "boss" ||
            unit?.type === "bossPart" ||
            unit?.isTwinBoss;
        const showBossPassive =
            unit?.bossAbility?.type === "chargeCycle" ||
            unit?.bossAbility?.type === "summonMinions" ||
            unit?.isSummonerBoss ||
            unit?.isTwinBoss;
        const showPassive =
            !dead &&
            unit?.passive &&
            (!isBossLikeForPassive || showBossPassive);
        const passiveText = showPassive
            ? `${unit.passive.label || "特性"}${unit.passiveTriggered ? "（発動済み）" : ""}：${unit.passive.description || ""}`
            : "";
        const artScale =
            unit?.displayScale ?? 1;

        const currentEnemyImage = getEnemyBattleImage(unit);

        const enemyEffectSummary =
            dead
                ? ""
                : renderBattleEffectSummaryTooltip(
                    getBattleEffectSummaryEntries(unit),
                    unit?.name || "敵"
                );

        const art = currentEnemyImage
            ? `<div class="enemy-icon has-image battle-effect-summary-host" tabindex="0" style="background-image:url('${currentEnemyImage}');--enemy-art-scale:${artScale}" aria-label="${unit.name || "敵"}">${enemyEffectSummary}</div>`
            : `<div class="enemy-icon battle-effect-summary-host" tabindex="0" style="--enemy-art-scale:${artScale}">${unit?.icon || "❔"}${enemyEffectSummary}</div>`;

        return `
            <div class="battle-actor enemy-actor enemy-unit enemy-${unit?.type || "normal"}${unit?.isSummonedMinion ? " summoned-minion" : ""}${selected ? " selected-target" : ""}${dead ? " defeated-enemy" : ""}" data-enemy-index="${index}" ${dead ? "aria-disabled=\"true\"" : "tabindex=\"0\""}>
                <div class="enemy-overhead-ui">
                    ${passiveText ? renderEnemyRichTooltip(
                        `<button class="enemy-passive-indicator" type="button" aria-label="${escapeBattleTooltipText(passiveText)}">◆</button>`,
                        unit.passive?.label || "特性",
                        unit.passive?.description || "",
                        "neutral"
                    ) : ""}
                    ${renderEnemyRichTooltip(
                        `<p class="enemy-intent-icon-only enemy-intent-${intentClass}">${visibleIntent}</p>`,
                        move?.bossLabel || "次の行動",
                        intentTooltip,
                        intentClass === "attack" ? "danger" : (intentClass === "block" ? "buff" : "neutral")
                    )}
                </div>
                ${art}
                <div class="battle-hp-bar enemy-hp-bar enemy-hp-inline" aria-label="敵HP">
                    <div class="battle-hp-bar-fill" style="width:${hpPercent}%"></div>
                    <span class="enemy-hp-inline-text">${unit.hp} / ${unit.maxHp}　🛡️ ${unit.block || 0}</span>
                </div>
                <div class="enemy-status-strip">${statusHtml}</div>
                ${units.filter(x => x && x.hp > 0).length > 1 ? `<div class="enemy-target-label">${selected ? "TARGET" : "クリックで対象選択"}</div>` : ""}
            </div>`;
    }).join("");

    bindBattleEffectSummaryViewport(field);

    field.querySelectorAll(".enemy-unit:not(.defeated-enemy)").forEach(unitEl => {
        const choose = () => {
            const index = Number(unitEl.dataset.enemyIndex);
            if (typeof selectEnemyTarget === "function") selectEnemyTarget(index);
        };
        unitEl.addEventListener("click", choose);
        unitEl.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                choose();
            }
        });
    });
}


function getDynamicCardDescription(card, target = enemy) {
    if (!card) return "";

    let description = card.description || "";

    if (card.type !== "attack" || !target || typeof getCardPreviewDamage !== "function") {
        return description;
    }

    const preview = getCardPreviewDamage(card, target);
    if (!preview) return description;

    // 表示だけを動的に変更する。カード本体のデータは書き換えない。
    if (preview.hits <= 1) {
        return description.replace(/\d+ダメージ/, `${preview.total}ダメージ`);
    }

    const multiHitPattern = /\d+ダメージを(\d+)回/;

    if (preview.first === preview.later && multiHitPattern.test(description)) {
        return description.replace(multiHitPattern, `${preview.first}ダメージを$1回`);
    }

    // 初撃だけ追加補正が入るなど、各ヒットが同じ値にならない場合。
    if (multiHitPattern.test(description)) {
        return description.replace(multiHitPattern, `合計${preview.total}ダメージ（現在）`);
    }

    return description.replace(/\d+ダメージ/, `${preview.total}ダメージ`);
}


function renderHand() {

    const handDiv = document.getElementById("hand");
    handDiv.innerHTML = "";

    player.hand.forEach((cardId, index) => {
        const card = cards[cardId];
        const cost = getCardCost(card);
        const affordable = !card.unplayable && player.energy >= cost;
        const cardElement = document.createElement("div");
        cardElement.className = `card ${card.rarity}${card.special ? " special-card" : ""}${card.upgraded ? " upgraded-card" : ""}${card.exhaust ? " exhaust-card" : ""}${affordable ? "" : " disabled"}`;

        const displayDescription = getDynamicCardDescription(card, enemy);

        cardElement.innerHTML = `
            ${card.exhaust ? `<span class="exhaust-card-badge">🔥 消滅</span>` : ""}
            ${card.upgraded ? `<span class="upgraded-card-badge">UP</span>` : ""}
            <h3>${card.name}</h3>
            <p>${card.unplayable ? "使用不可" : `Cost : ${cost}`}</p>
            <p>${displayDescription}</p>
        `;

        // v168: カードをつかんでターゲットへドラッグできる。
        setupHandCardDrag(cardElement, index, card, affordable);

        // v169: カードの使用はドラッグ＆ドロップ専用。
        // 旧クリック・タップ即時使用のイベントは登録しない。

        handDiv.appendChild(cardElement);
    });
    renderBattleDeckStatus();
}


// v168: Pointer Events でマウス・タッチ共通のドラッグ使用を処理。
// カード効果の適用は既存の playCard に委ね、魔力選択・AoE・状態異常を保つ。
let activeCardDrag = null;
function cardDragRequiresEnemy(card) {
    if (!card || card.aoe) return false;
    // 単体攻撃、または敵に状態異常を与えるカードは対象を選ぶ。
    return card.type === "attack" || !!(card.weak || card.vulnerable || card.slow || card.bleed || card.enemyStatus);
}
function clearCardDragVisuals() {
    document.getElementById("card-drag-ghost")?.remove();
    document.getElementById("card-drag-arrow")?.remove();
    document.querySelectorAll(".card-drag-target").forEach(e => e.classList.remove("card-drag-target"));
    document.getElementById("battle-screen")?.classList.remove("card-dragging");
}
function setupHandCardDrag(cardEl, index, card, affordable) {
    if (!affordable) return;
    cardEl.addEventListener("pointerdown", e => {
        if (e.button !== 0 || activeCardDrag || typeof battleEnded !== 'undefined' && battleEnded) return;
        activeCardDrag = { pointerId: e.pointerId, index, cardId: card.id, el: cardEl,
            x: e.clientX, y: e.clientY, dragged: false, enemyTarget: cardDragRequiresEnemy(card) };
        // ドラッグ開始地点のみ記録。短いクリックではカードを使用しない。
    });
}
function updateCardDragPosition(x, y) {
    const drag = activeCardDrag;
    if (!drag || !drag.dragged) return;
    const ghost = document.getElementById('card-drag-ghost');
    if (ghost) { ghost.style.left = x + 'px'; ghost.style.top = y + 'px'; }
    const arrow = document.getElementById('card-drag-arrow');
    if (arrow) {
        const dx = x - drag.x, dy = y - drag.y;
        const line = arrow.querySelector('line');
        line?.setAttribute('x1', drag.x); line?.setAttribute('y1', drag.y);
        line?.setAttribute('x2', x); line?.setAttribute('y2', y);
        arrow.querySelector('circle')?.setAttribute('cx', x);
        arrow.querySelector('circle')?.setAttribute('cy', y);
    }
    document.querySelectorAll('.card-drag-target').forEach(el => el.classList.remove('card-drag-target'));
    const hit = document.elementFromPoint(x,y);
    const target = hit?.closest('.enemy-unit:not(.defeated-enemy)');
    if (drag.enemyTarget && target && target.closest('#enemy-field')) target.classList.add('card-drag-target');
    if (!drag.enemyTarget && hit?.closest('#battle-screen') && !hit.closest('#hand'))
        document.getElementById('battle-screen')?.classList.add('card-dragging');
    else document.getElementById('battle-screen')?.classList.remove('card-dragging');
}
function startCardDrag(drag) {
    if (!drag.el.isConnected) return;
    drag.dragged = true;
    const ghost = drag.el.cloneNode(true);
    ghost.id = 'card-drag-ghost'; ghost.classList.add('card-drag-ghost');
    ghost.removeAttribute('data-touch-handled');
    document.body.appendChild(ghost);
    if (drag.enemyTarget) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.id = 'card-drag-arrow'; svg.setAttribute('aria-hidden','true');
        svg.innerHTML = '<line stroke="#f6d58a" stroke-width="3" stroke-dasharray="9 5" stroke-linecap="round"/><circle r="5" fill="#f6d58a"/>';
        document.body.appendChild(svg);
    }
    document.body.classList.add('is-card-dragging');
}
// documentに一度だけ登録。renderHandのたびにハンドラを増やさない。
document.addEventListener('pointermove', e => {
    const drag = activeCardDrag;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (!drag.dragged && Math.hypot(e.clientX-drag.x,e.clientY-drag.y) > 10) startCardDrag(drag);
    if (drag.dragged) { e.preventDefault(); updateCardDragPosition(e.clientX,e.clientY); }
}, {passive:false});
document.addEventListener('pointerup', e => {
    const drag = activeCardDrag;
    if (!drag || drag.pointerId !== e.pointerId) return;
    activeCardDrag = null;
    if (!drag.dragged) return; // クリックのみならカードは使用しない
    e.preventDefault();
    const hit = document.elementFromPoint(e.clientX,e.clientY);
    const enemyEl = hit?.closest('.enemy-unit:not(.defeated-enemy)');
    const targetIndex = enemyEl && enemyEl.closest('#enemy-field') ? Number(enemyEl.dataset.enemyIndex) : -1;
    const overBattle = !!hit?.closest('#battle-screen') && !hit.closest('#hand');
    clearCardDragVisuals();
    document.body.classList.remove('is-card-dragging');
    const cardId = player?.hand?.[drag.index];
    const card = typeof cards !== 'undefined' ? cards[cardId] : null;
    if (!card || cardId !== drag.cardId || typeof battleEnded !== 'undefined' && battleEnded || player.energy < getCardCost(card)) return;
    if (drag.enemyTarget) {
        if (targetIndex < 0 || !battleEnemies?.[targetIndex] || battleEnemies[targetIndex].hp <= 0) return;
        if (typeof selectEnemyTarget === 'function') selectEnemyTarget(targetIndex);
    } else if (!overBattle) return;
    playCard(drag.index);
}, {passive:false});
document.addEventListener('pointercancel', e => {
    if (activeCardDrag?.pointerId !== e.pointerId) return;
    activeCardDrag = null; clearCardDragVisuals(); document.body.classList.remove('is-card-dragging');
});

function showPopup(title, buttonText){

    document
        .getElementById("popup-title")
        .textContent = title;

    document
        .getElementById("popup-button")
        .textContent = buttonText;

    const stats = document.getElementById("popup-stats");
    if (stats) {
        stats.innerHTML = "";
        stats.classList.add("hidden");
    }

    const popup =
        document.getElementById("popup");

    popup?.classList.remove(
        "run-result-popup"
    );

    popup?.classList.remove("hidden");
}
