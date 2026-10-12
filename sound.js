// ======================
// v30 Sound System
// ======================

const soundConfig = {
    enabled: localStorage.getItem("cardRoguelike_soundEnabled") !== "false",
    seVolume: Number(localStorage.getItem("cardRoguelike_seVolume") ?? 0.62),
    bgmVolume: 0.88
};

const soundFiles = {
    cardPlay: "assets/audio/se/card_play.wav",
    slash: "assets/audio/se/slash.wav",
    guardReady: "assets/audio/se/guard_ready.wav",
    attackHit: "assets/audio/se/attack_hit.wav",
    block: "assets/audio/se/block.wav",
    endTurn: "assets/audio/se/end_turn.wav",
    enemyDown: "assets/audio/se/enemy_down.wav",
    uiClick: "assets/audio/se/ui_click.wav",
    heal: "assets/audio/se/heal.wav",
    draw: "assets/audio/se/draw.wav",
    victory: "assets/audio/se/victory_sting.wav",
    defeat: "assets/audio/se/defeat_sting.wav"
};

const soundLibrary = {};
let audioUnlocked = false;
let bgmAudio = null;
let titleBgmAudio = null;

function initSoundSystem() {
    bgmAudio = new Audio("assets/audio/bgm/dungeon_theme.mp3");
    bgmAudio.loop = true;
    bgmAudio.preload = "auto";
    bgmAudio.volume = soundConfig.bgmVolume;

    titleBgmAudio = new Audio("assets/audio/bgm/title_theme.mp3");
    titleBgmAudio.loop = true;
    titleBgmAudio.preload = "auto";
    titleBgmAudio.volume = Math.min(1, soundConfig.bgmVolume * 0.62);
    Object.entries(soundFiles).forEach(([key, src]) => {
        const audio = new Audio(src);
        audio.preload = "auto";
        soundLibrary[key] = audio;
    });

    updateSoundToggleUI();

    const unlock = () => {
        audioUnlocked = true;
        updateBgmForScene();
        document.removeEventListener("pointerdown", unlock);
        document.removeEventListener("keydown", unlock);
    };

    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });

    document.addEventListener("click", event => {
        const button = event.target.closest("button");
        if (!button || button.id === "sound-toggle" || button.id === "end-turn") {
            return;
        }
        playSe("uiClick", 0.45);
    });
}

function playSe(name, volumeScale = 1) {
    if (!soundConfig.enabled || !audioUnlocked) {
        return;
    }

    const base = soundLibrary[name];
    if (!base) {
        return;
    }

    const sound = base.cloneNode();
    sound.volume = Math.max(
        0,
        Math.min(1, soundConfig.seVolume * volumeScale)
    );

    sound.play().catch(() => {});
}


function fadeBattleBgm(duration = 600, targetVolume = 0) {
    if (!bgmAudio || bgmAudio.paused) return;

    const startVolume = bgmAudio.volume;
    const startTime = performance.now();
    const safeDuration = Math.max(1, duration);

    const tick = now => {
        const progress = Math.min(1, (now - startTime) / safeDuration);
        bgmAudio.volume =
            startVolume +
            (targetVolume - startVolume) * progress;

        if (progress < 1) {
            requestAnimationFrame(tick);
        } else if (targetVolume <= 0.001) {
            bgmAudio.pause();
        }
    };

    requestAnimationFrame(tick);
}

function toggleSound() {
    soundConfig.enabled = !soundConfig.enabled;
    localStorage.setItem(
        "cardRoguelike_soundEnabled",
        String(soundConfig.enabled)
    );
    updateSoundToggleUI();
    updateBgmForScene();

}


function updateBgmForScene() {
    if (!bgmAudio || !titleBgmAudio) return;

    const canPlay = soundConfig.enabled && audioUnlocked;
    // v132: Class Pathはタイトルと同じ落ち着いたBGMを使用。
    // ツリー閲覧中の無音をなくしつつ、戦闘BGMとは明確に分離する。
    const titleScene =
        ["title", "skill-tree"]
            .includes(Scene.current);

    const dungeonScene =
        ["map", "battle", "reward"]
            .includes(Scene.current);

    if (canPlay && titleScene) {
        bgmAudio.pause();
        titleBgmAudio.volume = Math.max(0, Math.min(1, soundConfig.bgmVolume * 0.62));
        titleBgmAudio.play().catch(() => {});
        return;
    }

    titleBgmAudio.pause();

    if (canPlay && dungeonScene) {
        bgmAudio.volume = Math.max(0, Math.min(1, soundConfig.bgmVolume));
        bgmAudio.play().catch(() => {});
    } else {
        bgmAudio.pause();
    }
}

function updateSoundToggleUI() {
    const button = document.getElementById("sound-toggle");
    if (!button) {
        return;
    }

    button.textContent = soundConfig.enabled ? "🔊" : "🔇";
    button.title = soundConfig.enabled ? "効果音：ON" : "効果音：OFF";
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-pressed", String(soundConfig.enabled));
}

document.addEventListener("DOMContentLoaded", () => {
    initSoundSystem();

    const toggle = document.getElementById("sound-toggle");
    if (toggle) {
        toggle.addEventListener("click", toggleSound);
    }
});
