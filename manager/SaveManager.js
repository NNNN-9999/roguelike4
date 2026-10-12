// ======================
// SaveManager.js v11
// ラン状態のチェックポイント保存
// ======================

const RUN_SAVE_KEY = "cardRoguelike_run_v11";
const RUN_SAVE_VERSION = 1;


function getCurrentMapNodeIdForSave() {
    return currentMapNode?.id || null;
}


function isSafeMapSavePoint() {
    if (Scene.current !== "map") {
        return false;
    }

    // ノードを選択した直後（イベント・ショップ処理中など）は保存しない。
    // 直前の安全なチェックポイントへ戻れるようにする。
    if (
        currentMapNode &&
        floor <= currentMapNode.floor
    ) {
        return false;
    }

    return true;
}


function canSaveRunNow() {
    if (!player || !selectedCharacter || player.hp <= 0) {
        return false;
    }

    if (Scene.current === "battle") {
        return Boolean(enemy) && !battleEnded;
    }

    return isSafeMapSavePoint();
}


function createRunSnapshot() {
    if (!canSaveRunNow()) {
        return null;
    }

    return {
        version: RUN_SAVE_VERSION,
        savedAt: Date.now(),
        selectedCharacter,
        player,
        scene: Scene.current,
        map: {
            currentDepth,
            floor,
            mapData,
            currentMapNodeId: getCurrentMapNodeIdForSave(),
            visitedMapNodeIds: [...visitedMapNodeIds]
        },
        battle: Scene.current === "battle"
            ? {
                enemy,
                battleEnemies,
                selectedEnemyIndex,
                currentBattleType,
                battleEnded
            }
            : null
    };
}


function saveRunState() {
    const snapshot = createRunSnapshot();

    if (!snapshot) {
        return false;
    }

    try {
        localStorage.setItem(
            RUN_SAVE_KEY,
            JSON.stringify(snapshot)
        );
        updateContinueButton();
        return true;
    } catch (error) {
        console.error("ランデータの保存に失敗しました", error);
        return false;
    }
}


function getSavedRun() {
    try {
        const raw = localStorage.getItem(RUN_SAVE_KEY);
        if (!raw) return null;

        const data = JSON.parse(raw);

        if (
            !data ||
            data.version !== RUN_SAVE_VERSION ||
            !data.player ||
            !data.selectedCharacter ||
            !data.map
        ) {
            return null;
        }

        return data;
    } catch (error) {
        console.error("ランデータの読み込みに失敗しました", error);
        return null;
    }
}


function hasRunSave() {
    return Boolean(getSavedRun());
}


function clearRunSave() {
    try {
        localStorage.removeItem(RUN_SAVE_KEY);
    } catch (error) {
        console.error("ランデータの削除に失敗しました", error);
    }

    updateContinueButton();
}


function findSavedMapNode(nodeId) {
    if (!nodeId) return null;

    for (const layer of mapData) {
        const found = layer.find(node => node.id === nodeId);
        if (found) return found;
    }

    return null;
}


function restoreRunState() {
    const data = getSavedRun();

    if (!data) {
        updateContinueButton();
        return false;
    }

    try {
        selectedCharacter = data.selectedCharacter;
        player = data.player;
        // v158: 旧セーブの削除済み「フォーカス」を各デッキから除外。
        for (const pileName of ["starterDeck", "drawPile", "hand", "discardPile", "exhaustPile"]) {
            if (Array.isArray(player[pileName])) {
                player[pileName] = player[pileName].filter(card => {
                    const id = typeof card === "string" ? card : card?.id;
                    return id !== "focus" && id !== "focus__up";
                });
            }
        }

        currentDepth = data.map.currentDepth || 1;
        floor = data.map.floor || 1;
        mapData = Array.isArray(data.map.mapData)
            ? data.map.mapData
            : [];

        visitedMapNodeIds.clear();
        (data.map.visitedMapNodeIds || []).forEach(nodeId => {
            visitedMapNodeIds.add(nodeId);
        });

        currentMapNode = findSavedMapNode(
            data.map.currentMapNodeId
        );

        updateOwnedRelicUI();

        if (
            data.scene === "battle" &&
            data.battle?.enemy
        ) {
            battleEnemies =
                Array.isArray(
                    data.battle.battleEnemies
                ) &&
                data.battle.battleEnemies.length
                    ? data.battle.battleEnemies
                    : [data.battle.enemy];

            selectedEnemyIndex =
                Number.isInteger(
                    data.battle.selectedEnemyIndex
                )
                    ? data.battle.selectedEnemyIndex
                    : 0;

            currentBattleType =
                data.battle.currentBattleType ||
                "normal";

            battleEnded =
                Boolean(
                    data.battle.battleEnded
                );

            syncSelectedEnemy();

            changeScene("battle");
            updatePlayerUI();
            updateEnemyUI();
            renderHand();
        } else {
            showMap();
        }

        return true;

    } catch (error) {
        console.error("ランデータの復元に失敗しました", error);
        return false;
    }
}


function updateContinueButton() {
    const button = document.getElementById("continue-button");
    if (!button) return;

    const save = getSavedRun();
    const titleScreen = document.getElementById("title-screen");

    button.classList.toggle("hidden", !save);

    // v88: the title artwork itself has two states.
    // save exists -> bright CONTINUE artwork
    // no save     -> dark/disabled CONTINUE artwork
    if (titleScreen) {
        titleScreen.classList.toggle("has-run-save", !!save);
        titleScreen.classList.toggle("no-run-save", !save);
        titleScreen.dataset.continueState = save ? "available" : "disabled";
    }

    if (save) {
        const depth = save.map?.currentDepth || 1;
        button.textContent = `▶ 続きから（B${depth}）`;
        button.dataset.saveLabel = `B${depth}`;
    } else {
        delete button.dataset.saveLabel;
    }
}


const continueButton = document.getElementById("continue-button");
if (continueButton) {
    continueButton.addEventListener("click", restoreRunState);
}


// タブを閉じる・リロードする直前にも、安全な状態なら保存。
window.addEventListener("beforeunload", () => {
    saveRunState();
});


document.addEventListener("DOMContentLoaded", () => {
    updateContinueButton();
});
