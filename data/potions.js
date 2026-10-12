// 表示名は仮称。IDと分離してあるので後から名前だけ変更可能。
const potions = {
    overchargePotion: { id:"overchargePotion", name:"活力の霊薬", icon:"⚡", description:"このターン、エナジー+2。", battleOnly:true, effect:{ energy:2 } },
    fireBomb: { id:"fireBomb", name:"火炎瓶", icon:"🔥", description:"敵1体に20ダメージ。", battleOnly:true, effect:{ damage:20 } },
    healingPotion: { id:"healingPotion", name:"回復薬", icon:"❤️", description:"最大HPの20%回復。", mapUsable:true, effect:{ healPct:20 } },
    blockPotion: { id:"blockPotion", name:"防壁の雫", icon:"🛡️", description:"ブロック12を得る。", battleOnly:true, effect:{ block:12 } },
    dexterityPotion: { id:"dexterityPotion", name:"敏捷の薬", icon:"🪽", description:"敏捷性2を得る。", battleOnly:true, effect:{ status:"dexterity", amount:2 } },
    energyPotion: { id:"energyPotion", name:"エナジー薬", icon:"🔋", description:"エナジー2を得る。", battleOnly:true, effect:{ energy:2 } },
    blastBottle: { id:"blastBottle", name:"爆炎瓶", icon:"💥", description:"敵全体に10ダメージ。", battleOnly:true, effect:{ aoe:10 } },
    strengthPotion: { id:"strengthPotion", name:"筋力の薬", icon:"💪", description:"筋力2を得る。", battleOnly:true, effect:{ status:"strength", amount:2 } },
    drawPotion: { id:"drawPotion", name:"知恵の水滴", icon:"📜", description:"カードを3枚引く。", battleOnly:true, effect:{ draw:3 } },
    weakPotion: { id:"weakPotion", name:"衰弱の粉", icon:"🪨", description:"敵1体に弱体3を付与。", battleOnly:true, effect:{ enemy:"weak", amount:3 } },
    feeblePotion: { id:"feeblePotion", name:"脱力の粉", icon:"⬇️", description:"敵1体に脱力3を付与。", battleOnly:true, effect:{ enemy:"weak", amount:3 } },
    tempStrength: { id:"tempStrength", name:"猛攻の一滴", icon:"🔴", description:"このターンのみ筋力5を得る。", battleOnly:true, effect:{ tempStrength:5 } },
    tempDexterity: { id:"tempDexterity", name:"瞬身の一滴", icon:"🔵", description:"このターンのみ敏捷性5を得る。", battleOnly:true, effect:{ tempDexterity:5 } },
    upgradeHand: { id:"upgradeHand", name:"鍛錬の護符", icon:"🔨", description:"この戦闘中、現在の手札をすべて強化。", battleOnly:true, effect:{ upgradeHand:1 } },
    regenerationPotion: { id:"regenerationPotion", name:"再生薬", icon:"🌿", description:"再生5を得る。", battleOnly:true, effect:{ status:"regeneration", amount:5 } },
    thornPotion: { id:"thornPotion", name:"棘の瓶", icon:"🌵", description:"トゲ3を得る。", battleOnly:true, effect:{ status:"thorns", amount:3 } },
    redrawPotion: { id:"redrawPotion", name:"選別の羽", icon:"🪶", description:"好きな枚数の手札を捨て、同じ枚数引く。", battleOnly:true, effect:{ redraw:1 } },
    platePotion: { id:"platePotion", name:"装甲の香油", icon:"🏰", description:"プレートアーマー4を得る。", battleOnly:true, effect:{ status:"fortress", amount:4 } },
    echoPotion: { id:"echoPotion", name:"反響の水晶", icon:"💎", description:"次に使用するカードを追加でもう1回発動。", battleOnly:true, effect:{ doubleNext:1 } },
    autoplayPotion: { id:"autoplayPotion", name:"暴走する魔導書", icon:"📖", description:"山札の上から3枚をコストなしで使用。", battleOnly:true, effect:{ autoplay:3 } },
    recallPotion: { id:"recallPotion", name:"回帰の砂時計", icon:"⌛", description:"捨て札からカード1枚を手札に戻す。このターンはコスト0。", battleOnly:true, effect:{ recall:1 } },
    metalPotion: { id:"metalPotion", name:"鋼鉄の霊薬", icon:"🔩", description:"金属化6を得る。", battleOnly:true, effect:{ status:"metallicize", amount:6 } },
    intangiblePotion: { id:"intangiblePotion", name:"幻影の香水", icon:"🌫️", description:"このターンに受ける合計HPダメージを最大1にする。", battleOnly:true, effect:{ status:"intangible", amount:1 } },
    ritualPotion: { id:"ritualPotion", name:"儀式の霊薬", icon:"🕯️", description:"儀式1を得る。", battleOnly:true, effect:{ status:"ritual", amount:1 } },
    maxHpPotion: { id:"maxHpPotion", name:"生命の秘薬", icon:"💗", description:"最大HP+5。", mapUsable:true, effect:{ maxHp:5 } },
    resistancePotion: { id:"resistancePotion", name:"守護の秘薬", icon:"🔷", description:"アーティファクト1を得る。", battleOnly:true, effect:{ status:"artifact", amount:1 } },
    chaosTonic: { id:"chaosTonic", name:"混沌薬", icon:"🌀", description:"5枚ドローし、手札のコストをランダム化。", battleOnly:true, effect:{ chaos:5 } },
    phoenixPotion: { id:"phoenixPotion", name:"不死鳥の雫", icon:"🪶", description:"所持中、戦闘不能時に最大HP30%で1回復活。自動消費。", battleOnly:true, effect:{ phoenix:1 } },
    smokeBomb: { id:"smokeBomb", name:"煙玉", icon:"💨", description:"ボス以外から逃走する。報酬は獲得しない。", battleOnly:true, effect:{ escape:1 } },
    refillPotion: { id:"refillPotion", name:"錬金術師の小箱", icon:"📦", description:"空いているポーション枠をランダム補充。", mapUsable:true, effect:{ refill:1 } }
};
function isPotionUnlocked(potion) {
    // v131: ポーションはスキルツリーから切り離し、最初から全開放。
    return Boolean(potion);
}


function getUnlockedPotionIds() {
    return Object.values(potions).filter(isPotionUnlocked).map(p => p.id);
}

function ensurePotionSlots() {
    if (!player) return [];
    if (!Array.isArray(player.potions)) player.potions = [];
    const capacity = 3 + Math.max(0, player.potionSlotBonus || 0);
    while (player.potions.length < capacity) player.potions.push(null);
    if (player.potions.length > capacity) player.potions.length = capacity;
    return player.potions;
}

function addPotion(potionId) {
    if (!potions[potionId] || !player) return false;
    const slots = ensurePotionSlots();
    const index = slots.findIndex(v => !v);
    if (index < 0) return false;
    slots[index] = potionId;
    if (typeof renderPotionBelt === "function") renderPotionBelt();
    if (typeof saveRunState === "function") saveRunState();
    return true;
}

function usePotionSlot(index) {
    if (!player) return;

    const slots = ensurePotionSlots();
    const id = slots[index];
    const potion = potions[id];

    if (!potion) return;

    const inBattle =
        typeof Scene !== "undefined" &&
        Scene.current === "battle" &&
        enemy &&
        !battleEnded;

    if (potion.battleOnly && !inBattle) return;
    if (!inBattle && !potion.mapUsable) return;

    showPotionUseConfirmation(index, potion);
}

function showPotionUseConfirmation(index, potion) {
    let overlay = document.getElementById("potion-confirm-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "potion-confirm-overlay";
        overlay.className = "potion-confirm-overlay hidden";
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div class="potion-confirm-card" role="dialog" aria-modal="true">
            <div class="potion-confirm-icon">${potion.icon}</div>
            <h3>${potion.name}を使う？</h3>
            <p>${potion.description}</p>
            <div class="potion-confirm-actions">
                <button type="button" data-potion-confirm="use" class="primary">使用する</button>
                <button type="button" data-potion-confirm="cancel">使用しない</button>
            </div>
        </div>
    `;

    overlay.classList.remove("hidden");

    const close = () => {
        overlay.classList.add("hidden");
        overlay.innerHTML = "";
    };

    overlay
        .querySelector('[data-potion-confirm="cancel"]')
        .addEventListener("click", close);

    overlay
        .querySelector('[data-potion-confirm="use"]')
        .addEventListener("click", () => {
            close();
            executePotionUse(index);
        });

    overlay.addEventListener("click", event => {
        if (event.target === overlay) close();
    }, { once: true });
}

// 複数候補から選ぶときは専用ダイアログを使用（キャンセルなら消費しない）。
function choosePotionCards(title, cardIds, allowMultiple = false) {
    return new Promise(resolve => {
        const overlay = document.createElement("div");
        overlay.className = "potion-confirm-overlay";
        overlay.innerHTML = `<div class="potion-confirm-card" role="dialog" aria-modal="true"><h3>${title}</h3><div class="potion-card-choices"></div><div class="potion-confirm-actions"><button class="primary" data-done>決定</button><button data-cancel>キャンセル</button></div></div>`;
        const choices = overlay.querySelector(".potion-card-choices");
        let selected = [];
        cardIds.forEach((id, i) => {
            const card = cards[id];
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = `${card?.name || id}（${card?.cost ?? 0}コスト）`;
            btn.addEventListener("click", () => {
                if (allowMultiple) {
                    selected = selected.includes(i) ? selected.filter(v=>v!==i) : [...selected,i];
                } else selected = [i];
                [...choices.children].forEach((node,k)=>node.classList.toggle("selected", selected.includes(k)));
            });
            choices.appendChild(btn);
        });
        const finish = result => { overlay.remove(); resolve(result); };
        overlay.querySelector('[data-done]').onclick = () => finish(allowMultiple ? selected : (selected[0] ?? null));
        overlay.querySelector('[data-cancel]').onclick = () => finish(null);
        document.body.appendChild(overlay);
    });
}

function choosePotionTarget() {
    const targets = typeof getLivingBattleEnemies === "function" ? getLivingBattleEnemies() : [];
    if (!targets.length) return null;
    // 既に選択されている敵を優先。画面上の敵選択操作と共通。
    return (typeof enemy !== "undefined" && enemy?.hp > 0) ? enemy : targets[0];
}

async function executePotionUse(index) {
    if (!player) return;
    const slots = ensurePotionSlots();
    const id = slots[index];
    const potion = potions[id];
    if (!potion) return;
    const inBattle = typeof Scene !== "undefined" && Scene.current === "battle" && enemy && !battleEnded;
    if (potion.battleOnly && !inBattle) return;
    if (!inBattle && !potion.mapUsable) return;
    const e = potion.effect || {};
    // 生存時には復活ポーションを使わず所持しているだけで有効。
    if (e.phoenix) { if (typeof log === "function") log("不死鳥の雫は戦闘不能時に自動使用される。"); return; }
    if (e.escape && (!inBattle || currentBattleType === "boss")) return;
    let picks = null;
    if (e.redraw) {
        picks = await choosePotionCards("捨てるカードを選択（0枚も可）", player.hand.slice(), true);
        if (picks === null) return;
    }
    if (e.recall) {
        picks = await choosePotionCards("回収するカードを選択", player.discardPile.slice());
        if (picks === null) return;
    }
    // 副作用が完了してから枠を消費。
    slots[index] = null;
    if (inBattle && Array.isArray(player.relics) && player.relics.includes('alchemistTube')) drawCards(1);
    if (e.healPct) healPlayer(Math.max(1, Math.ceil(player.maxHp * e.healPct / 100)));
    if (e.maxHp) { player.maxHp += e.maxHp; player.hp += e.maxHp; }
    if (e.energy) player.energy += e.energy;
    if (e.block) player.block = (player.block || 0) + modifyBlockGain(player, e.block);
    if (e.status) {
        addStatus(player, e.status, e.amount || 1, { ignoreResistance:true });
        if (e.status === "intangible") player._intangibleDamageTaken = 0;
        if (e.status === "thorns") player.thorns = getStatus(player,"thorns");
    }
    if (e.tempStrength) { addStatus(player,"strength",e.tempStrength,{ignoreResistance:true}); player._potionTemporaryStrength=(player._potionTemporaryStrength||0)+e.tempStrength; }
    if (e.tempDexterity) { addStatus(player,"dexterity",e.tempDexterity,{ignoreResistance:true}); player._potionTemporaryDexterity=(player._potionTemporaryDexterity||0)+e.tempDexterity; }
    if (e.draw) drawCards(e.draw);
    if (e.enemy) addStatus(choosePotionTarget(),e.enemy,e.amount||1);
    if (e.damage) dealDamage(choosePotionTarget(),e.damage);
    if (e.aoe) getLivingBattleEnemies().slice().forEach(unit=>dealDamage(unit,e.aoe));
    if (e.upgradeHand) {
        player.hand = player.hand.map(cardId=>getUpgradedCardId(cardId)||cardId);
        renderHand();
    }
    if (e.redraw) {
        const ids = picks.sort((a,b)=>b-a).map(i=>player.hand.splice(i,1)[0]).filter(Boolean);
        player.discardPile.push(...ids);
        drawCards(ids.length);
    }
    if (e.recall) {
        const cardId = player.discardPile.splice(picks,1)[0];
        if (cardId) {
            player.hand.push(cardId);
            player._potionFreeCardId = cardId;
            player._potionFreeCardUses = (player._potionFreeCardUses || 0) + 1;
            renderHand();
        }
    }
    if (e.doubleNext) player._potionDoubleNext = (player._potionDoubleNext||0) + 1;
    if (e.autoplay) {
        // 山札上から使用可能カードを取り出して、通常プレイ処理を呼ぶ。
        const top = [];
        for(let i=0;i<e.autoplay;i++) {
            if(!player.drawPile.length && player.discardPile.length) {
                player.drawPile = shuffle([...player.discardPile]); player.discardPile=[];
            }
            if(player.drawPile.length) top.push(player.drawPile.pop());
        }
        for(const cardId of top) {
            const c=cards[cardId];
            if (!c || c.unplayable) { player.discardPile.push(cardId); continue; }
            player.hand.push(cardId);
            player._potionFreeCardId=cardId; player._potionFreeCardUses=(player._potionFreeCardUses||0)+1;
            const ix=player.hand.length-1;
            playCard(ix, c.manaSpell ? "none" : null);
            // 未使用のカードは捨て札に移す（詠唱待ちなどを含む）。
            const remaining=player.hand.indexOf(cardId);
            if (remaining>=0) { player.hand.splice(remaining,1); player.discardPile.push(cardId); }
        }
        renderHand();
    }
    if (e.chaos) {
        drawCards(e.chaos);
        player._potionChaosCosts = {};
        player.hand.forEach((cardId,i)=>{ player._potionChaosCosts[cardId]=Math.floor(Math.random()*5); });
        renderHand();
    }
    if (e.refill) {
        const pool=getUnlockedPotionIds().filter(v=>v!=="refillPotion" && v!=="phoenixPotion");
        slots.forEach((value,i)=>{if (!value && pool.length) slots[i]=pool[Math.floor(Math.random()*pool.length)];});
    }
    if (e.escape) {
        battleEnded=true;
        if (typeof showMap === "function") showMap();
    }
    if (inBattle && typeof checkBattleEnd === "function" && !battleEnded) checkBattleEnd();
    if (typeof updatePlayerUI === "function") updatePlayerUI();
    if (typeof updateEnemyUI === "function") updateEnemyUI();
    if (typeof renderPotionBelt === "function") renderPotionBelt();
    if (typeof saveRunState === "function") saveRunState();
}

function renderPotionBelt() {
    const belt = document.getElementById("potion-belt");
    if (!belt) return;
    if (!player) { belt.classList.add("hidden"); return; }
    belt.classList.remove("hidden");
    const slots = ensurePotionSlots();
    const inBattle = typeof Scene !== "undefined" && Scene.current === "battle" && enemy && !battleEnded;
    belt.innerHTML = slots.map((id, index) => {
        const potion = id ? potions[id] : null;
        if (!potion) return `<button class="potion-slot empty" type="button" disabled title="空きポーション枠">＋</button>`;
        const usable = inBattle || potion.mapUsable;
        return `<button class="potion-slot${usable ? "" : " disabled"}" type="button" data-potion-slot="${index}" title="${potion.name}：${potion.description}"><span>${potion.icon}</span></button>`;
    }).join("");
    belt.querySelectorAll("[data-potion-slot]").forEach(btn => btn.addEventListener("click", () => usePotionSlot(Number(btn.dataset.potionSlot))));
}
