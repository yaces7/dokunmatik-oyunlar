// ============================================
// STICK WAR LEGACY - PART 1: SETUP & GLOBALS
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('game-container');
const controls = document.getElementById('controls');

let currentGame = null;
let gameLoop = null;
let selectedLevel = 1;
let unlockedLevels = 1;

// Canvas boyutunu ayarla
function resizeCanvas() {
    canvas.width = Math.min(1400, window.innerWidth - 40);
    canvas.height = Math.min(750, window.innerHeight - 180);
    if (currentGame && currentGame.onResize) {
        currentGame.onResize();
    }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ============================================
// PART 2: MENU & LEVEL SELECT
// ============================================

function initLevelSelect() {
    const levelGrid = document.getElementById('levelGrid');
    if (!levelGrid) return;
    
    levelGrid.innerHTML = '';
    
    const totalLevels = getTotalLevels();
    
    for (let i = 1; i <= totalLevels; i++) {
        const btn = document.createElement('div');
        btn.className = 'level-btn';
        btn.textContent = i;
        
        if (i > unlockedLevels) {
            btn.classList.add('locked');
            btn.innerHTML = '🔒';
        } else {
            if (i === selectedLevel) {
                btn.classList.add('selected');
            }
            // Event listener ekle
            btn.addEventListener('click', () => {
                selectLevel(i);
            });
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                selectLevel(i);
            });
        }
        
        levelGrid.appendChild(btn);
    }
}

function selectLevel(level) {
    if (level <= unlockedLevels) {
        selectedLevel = level;
        initLevelSelect();
    }
}

function startSelectedLevel() {
    menu.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    controls.classList.remove('hidden');
    
    if (gameLoop) cancelAnimationFrame(gameLoop);
    resizeCanvas();
    
    currentGame = new StickWar(selectedLevel);
    controls.innerHTML = `
        <div class="stick-controls">
            <button class="mode-btn active" data-action="attack">⚔️ SALDIRI (Q)</button>
            <button class="mode-btn" data-action="defend">🛡️ SAVUNMA (W)</button>
            <button class="mode-btn" data-action="retreat">🏃 ÇEKİL (E)</button>
        </div>
    `;
    setupStickControls();
    
    currentGame.init();
    animate();
}

function backToMenu() {
    gameContainer.classList.add('hidden');
    controls.classList.add('hidden');
    menu.classList.remove('hidden');
    if (gameLoop) cancelAnimationFrame(gameLoop);
    if (currentGame) currentGame.cleanup();
    currentGame = null;
    initLevelSelect();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentGame) {
        currentGame.update();
        currentGame.draw(ctx);
    }
    gameLoop = requestAnimationFrame(animate);
}

function setupStickControls() {
    const buttons = controls.querySelectorAll('[data-action]');
    buttons.forEach(btn => {
        const action = btn.getAttribute('data-action');
        ['click', 'touchstart'].forEach(event => {
            btn.addEventListener(event, (e) => {
                e.preventDefault();
                currentGame.setMode(action);
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    });
}

// Sayfa yüklendiğinde başlat
window.addEventListener('DOMContentLoaded', () => {
    initLevelSelect();
});

// Global fonksiyonları window'a ekle
window.startSelectedLevel = startSelectedLevel;
window.backToMenu = backToMenu;
window.selectLevel = selectLevel;


// ============================================
// PART 3: STICK WAR LEGACY CLASS - CONSTRUCTOR
// ============================================

class StickWar {
    constructor(startLevel = 1) {
        this.level = startLevel;
        
        // Seviye config'ini al
        this.levelConfig = getLevelConfig(startLevel);
        this.difficulty = this.levelConfig.difficulty;
        
        this.mode = 'attack';
        this.gameState = 'playing';
        
        // Kaynaklar
        this.gold = 400;
        this.enemyGold = this.levelConfig.enemyGold;
        this.goldPerSecond = 1;
        this.passiveIncome = 1;
        
        // Harita kaydırma
        this.worldWidth = 3000;
        this.cameraX = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartCameraX = 0;
        
        // Statüler
        this.playerStatue = { x: 100, y: 0, hp: 500, maxHp: 500, width: 60, height: 150 };
        this.enemyStatue = { 
            x: 2800, 
            y: 0, 
            hp: this.levelConfig.enemyCastleHp, 
            maxHp: this.levelConfig.enemyCastleHp, 
            width: 60, 
            height: 150 
        };
        
        // Birimler
        this.units = [];
        this.enemyUnits = [];
        
        // Altın madenleri
        this.goldMines = [
            { x: 800, y: 0, hp: this.levelConfig.goldMineHp, maxHp: this.levelConfig.goldMineHp, team: null, workers: 0, goldRate: 0.4 },
            { x: 2200, y: 0, hp: this.levelConfig.goldMineHp, maxHp: this.levelConfig.goldMineHp, team: null, workers: 0, goldRate: 0.4 }
        ];
        
        // Okçu sistemi - YENİ!
        this.archers = [];
        this.enemyArchers = [];
        
        this.selectedUnit = 'miner';
        
        this.upgrades = {
            miner: { level: 1, damage: 12, hp: 60, cost: 100 },
            swordsman: { level: 1, damage: 30, hp: 120, cost: 150 },
            spearman: { level: 1, damage: 25, hp: 100, cost: 150 },
            archer: { level: 1, damage: 22, hp: 80, cost: 150 },
            mage: { level: 1, damage: 40, hp: 70, cost: 200 },
            giant: { level: 1, damage: 60, hp: 350, cost: 250 }
        };
        
        this.particles = [];
        this.projectiles = [];
        this.effects = [];
        this.enemyLastSpawn = 0;
        this.lastPassiveIncome = Date.now();
        
        // Birim üretim cooldown - YENİ!
        this.spawnCooldowns = {
            miner: 0,
            swordsman: 0,
            spearman: 0,
            archer: 0,
            mage: 0,
            giant: 0
        };
        this.spawnCooldownMax = {
            miner: 60,      // 1 saniye (60 frame)
            swordsman: 120, // 2 saniye
            spearman: 120,
            archer: 150,    // 2.5 saniye
            mage: 180,      // 3 saniye
            giant: 240      // 4 saniye
        };
        
        // Süre takibi
        this.startTime = Date.now();
        this.elapsedTime = 0;
        
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }
    

    
    init() {
        document.addEventListener('keydown', this.handleKeyDown);
        canvas.addEventListener('click', this.handleClick);
        
        // Kaydırma için event listeners
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('mouseup', this.handleMouseUp);
        canvas.addEventListener('mouseleave', this.handleMouseUp);
        
        canvas.addEventListener('touchstart', this.handleTouchStart);
        canvas.addEventListener('touchmove', this.handleTouchMove);
        canvas.addEventListener('touchend', this.handleTouchEnd);
        
        this.onResize();
    }
    
    onResize() {
        this.playerStatue.y = canvas.height - 250;
        this.enemyStatue.y = canvas.height - 250;
        this.goldMines.forEach(mine => {
            mine.y = canvas.height - 120;
        });
    }

    
    // ============================================
    // PART 4: INPUT HANDLERS
    // ============================================
    
    handleKeyDown(e) {
        if (e.key === '1') this.selectUnit('miner');
        if (e.key === '2') this.selectUnit('swordsman');
        if (e.key === '3') this.selectUnit('spearman');
        if (e.key === '4') this.selectUnit('archer');
        if (e.key === '5') this.selectUnit('mage');
        if (e.key === '6') this.selectUnit('giant');
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this.spawnUnit(this.selectedUnit);
        }
        if (e.key === 'u' || e.key === 'U') {
            this.upgradeUnit(this.selectedUnit);
        }
        if (e.key === 'q' || e.key === 'Q') this.setMode('attack');
        if (e.key === 'w' || e.key === 'W') this.setMode('defend');
        if (e.key === 'e' || e.key === 'E') this.setMode('retreat');
    }
    
    handleClick(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        if (y > 10 && y < 80) {
            const units = ['miner', 'swordsman', 'spearman', 'archer', 'mage', 'giant'];
            units.forEach((unit, i) => {
                const buttonX = 10 + i * 100;
                if (x > buttonX && x < buttonX + 90) {
                    this.selectUnit(unit);
                }
            });
            
            if (x > canvas.width - 220 && x < canvas.width - 110) {
                this.spawnUnit(this.selectedUnit);
            }
            
            if (x > canvas.width - 100 && x < canvas.width - 10) {
                this.upgradeUnit(this.selectedUnit);
            }
        }
    }
    
    // Kaydırma - Mouse
    handleMouseDown(e) {
        if (e.clientY - canvas.getBoundingClientRect().top > 90) {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartCameraX = this.cameraX;
        }
    }
    
    handleMouseMove(e) {
        if (this.isDragging) {
            const deltaX = e.clientX - this.dragStartX;
            this.cameraX = Math.max(0, Math.min(this.worldWidth - canvas.width, this.dragStartCameraX - deltaX));
        }
    }
    
    handleMouseUp(e) {
        this.isDragging = false;
    }
    
    // Kaydırma - Touch
    handleTouchStart(e) {
        if (e.touches[0].clientY - canvas.getBoundingClientRect().top > 90) {
            this.isDragging = true;
            this.dragStartX = e.touches[0].clientX;
            this.dragStartCameraX = this.cameraX;
        }
    }
    
    handleTouchMove(e) {
        if (this.isDragging) {
            e.preventDefault();
            const deltaX = e.touches[0].clientX - this.dragStartX;
            this.cameraX = Math.max(0, Math.min(this.worldWidth - canvas.width, this.dragStartCameraX - deltaX));
        }
    }
    
    handleTouchEnd(e) {
        this.isDragging = false;
    }
    
    selectUnit(type) {
        this.selectedUnit = type;
    }
    
    setMode(mode) {
        this.mode = mode;
        this.units.forEach(u => {
            u.orderMode = mode;
        });
    }
    
    getUnitCost(type) {
        const baseCosts = { miner: 30, swordsman: 60, spearman: 50, archer: 70, mage: 120, giant: 200 };
        return baseCosts[type];
    }
    
    spawnUnit(type) {
        const cost = this.getUnitCost(type);
        
        // Cooldown kontrolü
        if (this.spawnCooldowns[type] > 0) {
            return; // Henüz hazır değil
        }
        
        // Seviye kontrolü - sadece izin verilen birimleri üret
        const allowedUnits = this.getAllowedUnits();
        if (!allowedUnits.includes(type)) {
            return; // Bu seviyede bu birim yok
        }
        
        if (this.gold >= cost) {
            this.gold -= cost;
            const upgrade = this.upgrades[type];
            
            this.units.push({
                x: 200,
                y: canvas.height - 120,
                type: type,
                hp: upgrade.hp,
                maxHp: upgrade.hp,
                damage: upgrade.damage,
                speed: type === 'miner' ? 2.5 : type === 'giant' ? 1.2 : type === 'archer' ? 1.8 : 2.2,
                range: type === 'archer' ? 200 : type === 'mage' ? 250 : 50,
                attackCooldown: 0,
                animFrame: 0,
                mining: false,
                targetMine: null,
                state: 'idle',
                orderMode: this.mode,
                defendPosition: 600,
                attackAnim: 0
            });
            
            // Cooldown başlat
            this.spawnCooldowns[type] = this.spawnCooldownMax[type];
            
            this.createParticles(200, canvas.height - 120, 10, '#2ecc71');
            this.updateArchers();
        }
    }
    
    upgradeUnit(type) {
        const upgrade = this.upgrades[type];
        if (this.gold >= upgrade.cost && upgrade.level < 5) {
            this.gold -= upgrade.cost;
            upgrade.level++;
            upgrade.damage = Math.floor(upgrade.damage * 1.3);
            upgrade.hp = Math.floor(upgrade.hp * 1.3);
            upgrade.cost = Math.floor(upgrade.cost * 1.5);
            this.createEffect('YÜKSELTME!', canvas.width / 2 + this.cameraX, 100, '#2ecc71');
        }
    }
    
    getAllowedUnits() {
        // Seviyeye göre izin verilen birimler
        if (this.level === 1) {
            return ['miner', 'swordsman'];
        } else if (this.level === 2) {
            return ['miner', 'swordsman', 'archer'];
        } else if (this.level <= 5) {
            return ['miner', 'swordsman', 'spearman', 'archer'];
        } else if (this.level <= 10) {
            return ['miner', 'swordsman', 'spearman', 'archer', 'mage'];
        } else {
            return ['miner', 'swordsman', 'spearman', 'archer', 'mage', 'giant'];
        }
    }
    
    // Okçu sistemi - 3 askere 1 okçu
    updateArchers() {
        const nonMinerCount = this.units.filter(u => u.type !== 'miner').length;
        const neededArchers = Math.floor(nonMinerCount / 3);
        
        // Fazla okçuları kaldır
        while (this.archers.length > neededArchers) {
            this.archers.pop();
        }
        
        // Eksik okçuları ekle
        while (this.archers.length < neededArchers) {
            this.archers.push({
                x: 150,
                y: canvas.height - 200,
                hp: 50,
                maxHp: 50,
                damage: 15,
                attackCooldown: 0
            });
        }
    }

    
    // ============================================
    // PART 5: UPDATE LOGIC
    // ============================================
    
    update() {
        if (this.gameState !== 'playing') {
            return; // Butonlar gösterilecek, otomatik geçiş yok
        }
        
        // Süre takibi
        this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Spawn cooldown'ları azalt
        Object.keys(this.spawnCooldowns).forEach(key => {
            if (this.spawnCooldowns[key] > 0) {
                this.spawnCooldowns[key]--;
            }
        });
        
        // Pasif gelir
        const now = Date.now();
        if (now - this.lastPassiveIncome > 1000) {
            this.gold += this.passiveIncome;
            this.lastPassiveIncome = now;
        }
        
        // Altın üretimi
        this.goldPerSecond = this.passiveIncome;
        this.goldMines.forEach(mine => {
            if (mine.hp > 0 && mine.workers > 0) {
                const goldGen = mine.goldRate * mine.workers;
                this.goldPerSecond += goldGen;
                if (mine.team === 'player') {
                    this.gold += goldGen;
                } else if (mine.team === 'enemy') {
                    this.enemyGold += goldGen * 0.8;
                }
            }
        });
        
        // Okçuları güncelle
        this.updateArchers();
        
        // Düşman AI
        this.updateEnemyAI();
        
        // Birimleri güncelle
        this.updateUnits(this.units, this.enemyUnits, true);
        this.updateUnits(this.enemyUnits, this.units, false);
        
        // Okçuları güncelle
        this.updateArcherUnits();
        
        // Mermileri güncelle
        this.updateProjectiles();
        
        // Parçacıkları güncelle
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;
            return p.life > 0;
        });
        
        this.effects = this.effects.filter(e => {
            e.life--;
            e.y -= 1;
            return e.life > 0;
        });
        
        // Ölü birimleri temizle
        this.units.forEach(u => {
            if (u.hp <= 0) {
                if (u.targetMine && u.targetMine.workers > 0) {
                    u.targetMine.workers--;
                }
                this.createParticles(u.x, u.y, 15, '#95a5a6');
            }
        });
        this.enemyUnits.forEach(e => {
            if (e.hp <= 0) {
                if (e.targetMine && e.targetMine.workers > 0) {
                    e.targetMine.workers--;
                }
                this.createParticles(e.x, e.y, 15, '#95a5a6');
            }
        });
        
        this.units = this.units.filter(u => u.hp > 0);
        this.enemyUnits = this.enemyUnits.filter(e => e.hp > 0);
        
        // Kazanma/Kaybetme
        if (this.enemyStatue.hp <= 0) {
            this.gameState = 'won';
            this.createEffect('ZAFER!', this.worldWidth / 2, canvas.height / 2, '#2ecc71');
            if (this.level > unlockedLevels) {
                unlockedLevels = this.level;
            }
        }
        if (this.playerStatue.hp <= 0) {
            this.gameState = 'lost';
            this.createEffect('YENİLDİN!', this.worldWidth / 2, canvas.height / 2, '#e74c3c');
        }
    }
    
    updateArcherUnits() {
        // Oyuncu okçuları
        this.archers.forEach(archer => {
            // Çekilme modunda geri çekil
            if (this.mode === 'retreat') {
                if (archer.x > 150) {
                    archer.x -= 3;
                }
                return;
            }
            
            // Düşman bul ve ateş et
            let target = this.findNearestTarget(archer, this.enemyUnits);
            if (target && Math.abs(archer.x - target.x) < 300) {
                archer.attackCooldown--;
                if (archer.attackCooldown <= 0) {
                    this.projectiles.push({
                        x: archer.x,
                        y: archer.y,
                        vx: (target.x - archer.x) / 30,
                        vy: -3,
                        damage: archer.damage,
                        type: 'archer',
                        friendly: true
                    });
                    archer.attackCooldown = 60;
                }
            }
        });
        
        // Düşman okçuları
        const enemyNonMinerCount = this.enemyUnits.filter(u => u.type !== 'miner').length;
        const neededEnemyArchers = Math.floor(enemyNonMinerCount / 3);
        
        while (this.enemyArchers.length > neededEnemyArchers) {
            this.enemyArchers.pop();
        }
        
        while (this.enemyArchers.length < neededEnemyArchers) {
            this.enemyArchers.push({
                x: 2850,
                y: canvas.height - 200,
                hp: 50,
                maxHp: 50,
                damage: 15,
                attackCooldown: 0
            });
        }
        
        this.enemyArchers.forEach(archer => {
            let target = this.findNearestTarget(archer, this.units);
            if (target && Math.abs(archer.x - target.x) < 300) {
                archer.attackCooldown--;
                if (archer.attackCooldown <= 0) {
                    this.projectiles.push({
                        x: archer.x,
                        y: archer.y,
                        vx: (target.x - archer.x) / 30,
                        vy: -3,
                        damage: archer.damage,
                        type: 'archer',
                        friendly: false
                    });
                    archer.attackCooldown = 60;
                }
            }
        });
    }

    
    updateUnits(units, enemies, isPlayer) {
        units.forEach(u => {
            u.animFrame += 0.12;
            
            // Madenci davranışı
            if (u.type === 'miner') {
                if (isPlayer && u.orderMode === 'retreat') {
                    if (u.x > 250) {
                        u.x -= u.speed * 1.5;
                        u.state = 'retreating';
                        if (u.targetMine && u.targetMine.workers > 0) {
                            u.targetMine.workers--;
                            u.targetMine = null;
                        }
                        u.mining = false;
                    }
                    return;
                }
                
                if (!u.targetMine || u.targetMine.hp <= 0) {
                    let nearestMine = null;
                    let minDist = Infinity;
                    this.goldMines.forEach(mine => {
                        if (mine.hp > 0) {
                            let dist = Math.abs(u.x - mine.x);
                            if (dist < minDist) {
                                minDist = dist;
                                nearestMine = mine;
                            }
                        }
                    });
                    u.targetMine = nearestMine;
                }
                
                if (u.targetMine && u.targetMine.hp > 0) {
                    let dist = Math.abs(u.x - u.targetMine.x);
                    if (dist < 40) {
                        u.mining = true;
                        u.state = 'mining';
                        if (u.targetMine.team !== (isPlayer ? 'player' : 'enemy')) {
                            u.targetMine.team = isPlayer ? 'player' : 'enemy';
                            u.targetMine.workers = 1;
                        } else if (!u.targetMine.workers) {
                            u.targetMine.workers = 1;
                        }
                    } else {
                        u.mining = false;
                        u.state = 'moving';
                        if (u.x < u.targetMine.x) u.x += u.speed;
                        else u.x -= u.speed;
                    }
                }
            } else {
                // Savaşçı birimlerin davranışı
                let target = this.findNearestTarget(u, enemies);
                let targetStatue = isPlayer ? this.enemyStatue : this.playerStatue;
                
                // Çekilme modu
                if (u.orderMode === 'retreat') {
                    if (isPlayer) {
                        if (u.x > 250) {
                            u.x -= u.speed * 2;
                            u.state = 'retreating';
                        } else {
                            u.state = 'idle';
                        }
                    } else {
                        if (u.x < 2600) {
                            u.x += u.speed * 2;
                            u.state = 'retreating';
                        } else {
                            u.state = 'idle';
                        }
                    }
                    return;
                }
                
                // Savunma modu
                if (u.orderMode === 'defend') {
                    if (target && Math.abs(u.x - target.x) < u.range + 150) {
                        let dist = Math.abs(u.x - target.x);
                        if (dist < u.range) {
                            u.state = 'attacking';
                            u.attackCooldown--;
                            if (u.attackCooldown <= 0) {
                                this.attack(u, target, isPlayer);
                                u.attackCooldown = u.type === 'archer' ? 60 : u.type === 'mage' ? 80 : u.type === 'giant' ? 50 : 40;
                            }
                        } else {
                            // Savunma pozisyonuna dön
                            if (isPlayer) {
                                if (u.x < u.defendPosition - 20) {
                                    u.x += u.speed * 0.8;
                                    u.state = 'moving';
                                } else if (u.x > u.defendPosition + 20) {
                                    u.x -= u.speed * 0.8;
                                    u.state = 'returning';
                                } else {
                                    u.state = 'defending';
                                }
                            } else {
                                if (u.x > u.defendPosition + 20) {
                                    u.x -= u.speed * 0.8;
                                    u.state = 'moving';
                                } else if (u.x < u.defendPosition - 20) {
                                    u.x += u.speed * 0.8;
                                    u.state = 'returning';
                                } else {
                                    u.state = 'defending';
                                }
                            }
                        }
                    } else {
                        // Düşman yok, pozisyonda kal
                        if (isPlayer) {
                            if (u.x > u.defendPosition + 20) {
                                u.x -= u.speed * 0.8;
                                u.state = 'returning';
                            } else if (u.x < u.defendPosition - 20) {
                                u.x += u.speed * 0.5;
                                u.state = 'moving';
                            } else {
                                u.state = 'defending';
                            }
                        } else {
                            if (u.x < u.defendPosition - 20) {
                                u.x += u.speed * 0.8;
                                u.state = 'returning';
                            } else if (u.x > u.defendPosition + 20) {
                                u.x -= u.speed * 0.5;
                                u.state = 'moving';
                            } else {
                                u.state = 'defending';
                            }
                        }
                    }
                    return;
                }
                
                // Saldırı modu
                if (target) {
                    let dist = Math.abs(u.x - target.x);
                    if (dist < u.range) {
                        u.state = 'attacking';
                        u.attackCooldown--;
                        if (u.attackCooldown <= 0) {
                            this.attack(u, target, isPlayer);
                            u.attackCooldown = u.type === 'archer' ? 60 : u.type === 'mage' ? 80 : u.type === 'giant' ? 50 : 40;
                        }
                    } else {
                        u.state = 'moving';
                        if (isPlayer) u.x += u.speed;
                        else u.x -= u.speed;
                    }
                } else {
                    let distToStatue = Math.abs(u.x - (targetStatue.x + targetStatue.width/2));
                    if (distToStatue < 100) {
                        u.state = 'attacking';
                        u.attackCooldown--;
                        if (u.attackCooldown <= 0) {
                            targetStatue.hp -= u.damage * 0.5;
                            this.createParticles(targetStatue.x + targetStatue.width/2, targetStatue.y + 70, 10, '#e74c3c');
                            u.attackCooldown = 40;
                        }
                    } else {
                        u.state = 'moving';
                        if (isPlayer) u.x += u.speed;
                        else u.x -= u.speed;
                    }
                }
            }
        });
    }
    
    findNearestTarget(unit, enemies) {
        let nearest = null;
        let minDist = Infinity;
        enemies.forEach(e => {
            let dist = Math.abs(unit.x - e.x);
            if (dist < minDist) {
                minDist = dist;
                nearest = e;
            }
        });
        return nearest;
    }
    
    attack(attacker, target, isPlayer) {
        if (attacker.type === 'archer' || attacker.type === 'mage') {
            // Uzaktan saldırı - mermi at
            this.projectiles.push({
                x: attacker.x,
                y: attacker.y + 10,
                vx: (target.x - attacker.x) / 30,
                vy: -3,
                damage: attacker.damage,
                type: attacker.type,
                friendly: isPlayer
            });
        } else {
            // Yakın dövüş - animasyonlu saldırı
            let dist = Math.abs(attacker.x - target.x);
            if (dist < 50) {
                // Hasar ver
                target.hp -= attacker.damage;
                
                // Saldırı animasyonu - saldıran ileri atlar
                attacker.attackAnim = 10;
                
                // Vuruş efekti
                this.createParticles(target.x, target.y, 10, '#e74c3c');
                this.createEffect(`-${attacker.damage}`, target.x, target.y - 20, '#e74c3c');
                
                // Hedef geri iter
                if (isPlayer) {
                    target.x += 5;
                } else {
                    target.x -= 5;
                }
            }
        }
    }
    
    updateProjectiles() {
        this.projectiles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.25;
            
            let targets = p.friendly ? this.enemyUnits : this.units;
            targets.forEach(t => {
                if (Math.abs(p.x - t.x) < 25 && Math.abs(p.y - t.y) < 35) {
                    t.hp -= p.damage;
                    this.createParticles(t.x, t.y, 12, p.type === 'mage' ? '#9b59b6' : '#e74c3c');
                    if (p.type === 'mage') {
                        targets.forEach(t2 => {
                            if (t2 !== t && Math.abs(t2.x - t.x) < 60) {
                                t2.hp -= p.damage * 0.5;
                            }
                        });
                    }
                    p.hit = true;
                }
            });
        });
        
        this.projectiles = this.projectiles.filter(p => !p.hit && p.x > -50 && p.x < this.worldWidth + 50 && p.y < canvas.height);
    }
    
    updateEnemyAI() {
        const spawnDelay = this.levelConfig.enemySpawnDelay;
        
        // Düşman AI stratejisi - seviyeye göre
        if (!this.enemyStrategy) {
            this.enemyStrategy = {
                mode: 'building', // building, attacking, defending
                targetArmySize: this.getTargetArmySize(),
                lastModeChange: Date.now()
            };
        }
        
        // Strateji değiştirme (her 15 saniyede bir)
        if (Date.now() - this.enemyStrategy.lastModeChange > 15000) {
            this.updateEnemyStrategy();
        }
        
        // Birim üretimi
        if (Date.now() - this.enemyLastSpawn > spawnDelay) {
            const unitTypes = this.levelConfig.enemyUnits;
            const weights = this.levelConfig.enemyUnitWeights;
            
            // Strateji moduna göre üretim kararı
            let shouldSpawn = false;
            
            if (this.enemyStrategy.mode === 'building') {
                // Ordu kurma modu - hedef sayıya ulaşana kadar üret
                const currentArmy = this.enemyUnits.filter(u => u.type !== 'miner').length;
                shouldSpawn = currentArmy < this.enemyStrategy.targetArmySize;
            } else if (this.enemyStrategy.mode === 'attacking') {
                // Saldırı modu - sürekli üret
                shouldSpawn = true;
            } else {
                // Savunma modu - sadece az birim varsa üret
                const currentArmy = this.enemyUnits.filter(u => u.type !== 'miner').length;
                shouldSpawn = currentArmy < 5;
            }
            
            if (shouldSpawn) {
                let rand = Math.random();
                let cumulative = 0;
                let selectedType = unitTypes[0];
                
                for (let i = 0; i < unitTypes.length; i++) {
                    cumulative += weights[i];
                    if (rand < cumulative) {
                        selectedType = unitTypes[i];
                        break;
                    }
                }
                
                const cost = this.getUnitCost(selectedType);
                if (this.enemyGold >= cost) {
                    this.enemyGold -= cost;
                    const upgrade = this.upgrades[selectedType];
                    const unitLevel = this.levelConfig.enemyUnitLevel;
                    
                    this.enemyUnits.push({
                        x: 2750,
                        y: canvas.height - 120,
                        type: selectedType,
                        hp: upgrade.hp * unitLevel,
                        maxHp: upgrade.hp * unitLevel,
                        damage: upgrade.damage * unitLevel,
                        speed: selectedType === 'miner' ? 2.5 : selectedType === 'giant' ? 1.2 : selectedType === 'archer' ? 1.8 : 2.2,
                        range: selectedType === 'archer' ? 200 : selectedType === 'mage' ? 250 : 50,
                        attackCooldown: 0,
                        animFrame: 0,
                        mining: false,
                        targetMine: null,
                        state: 'idle',
                        orderMode: this.enemyStrategy.mode === 'defending' ? 'defend' : 'attack',
                        attackAnim: 0,
                        defendPosition: 2400
                    });
                    
                    this.enemyLastSpawn = Date.now();
                }
            }
        }
        
        this.enemyGold += 0.15;
    }
    
    getTargetArmySize() {
        // Seviyeye göre hedef ordu büyüklüğü
        if (this.level <= 3) return 3;
        if (this.level <= 7) return 5;
        if (this.level <= 15) return 8;
        if (this.level <= 30) return 12;
        return 15;
    }
    
    updateEnemyStrategy() {
        const playerArmy = this.units.filter(u => u.type !== 'miner').length;
        const enemyArmy = this.enemyUnits.filter(u => u.type !== 'miner').length;
        
        // Strateji kararı
        if (enemyArmy < this.enemyStrategy.targetArmySize) {
            // Ordu küçükse, ordu kur
            this.enemyStrategy.mode = 'building';
        } else if (enemyArmy > playerArmy * 1.5) {
            // Düşmandan çok güçlüyse, saldır
            this.enemyStrategy.mode = 'attacking';
            // Tüm birimlere saldırı emri ver
            this.enemyUnits.forEach(u => {
                if (u.type !== 'miner') {
                    u.orderMode = 'attack';
                }
            });
        } else if (playerArmy > enemyArmy * 1.5) {
            // Oyuncu çok güçlüyse, savun
            this.enemyStrategy.mode = 'defending';
            // Tüm birimlere savunma emri ver
            this.enemyUnits.forEach(u => {
                if (u.type !== 'miner') {
                    u.orderMode = 'defend';
                }
            });
        } else {
            // Dengeli durumda, saldır
            this.enemyStrategy.mode = 'attacking';
            this.enemyUnits.forEach(u => {
                if (u.type !== 'miner') {
                    u.orderMode = 'attack';
                }
            });
        }
        
        this.enemyStrategy.lastModeChange = Date.now();
        this.enemyStrategy.targetArmySize = this.getTargetArmySize();
    }
    
    nextLevel() {
        // Seviyeyi artır
        this.level++;
        
        // Maksimum seviyeyi kontrol et
        if (this.level > getTotalLevels()) {
            this.level = getTotalLevels();
            this.gameState = 'won';
            this.createEffect('TÜM SEVİYELER TAMAMLANDI!', this.worldWidth / 2, canvas.height / 2, '#FFD700');
            return;
        }
        
        // Yeni seviye config'ini al
        this.levelConfig = getLevelConfig(this.level);
        this.difficulty = this.levelConfig.difficulty;
        
        // Ödül ver
        this.gold += 250 + this.level * 50;
        
        // Oyunu sıfırla
        this.gameState = 'playing';
        this.units = [];
        this.enemyUnits = [];
        this.archers = [];
        this.enemyArchers = [];
        this.projectiles = [];
        this.particles = [];
        this.effects = [];
        this.cameraX = 0;
        
        // Statüleri güncelle
        this.playerStatue.hp = this.playerStatue.maxHp;
        this.enemyStatue.hp = this.levelConfig.enemyCastleHp;
        this.enemyStatue.maxHp = this.levelConfig.enemyCastleHp;
        
        // Madenleri güncelle
        this.goldMines.forEach(m => {
            m.hp = this.levelConfig.goldMineHp;
            m.maxHp = this.levelConfig.goldMineHp;
            m.workers = 0;
            m.team = null;
        });
        
        // Düşman altınını güncelle
        this.enemyGold = this.levelConfig.enemyGold;
        
        // Kilidi aç
        if (this.level > unlockedLevels) {
            unlockedLevels = this.level;
        }
    }
    
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 3,
                life: 40,
                color
            });
        }
    }
    
    createEffect(text, x, y, color) {
        this.effects.push({ text, x, y, color, life: 60 });
    }

    
    // ============================================
    // PART 6: DRAW FUNCTIONS
    // ============================================
    
    draw(ctx) {
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.save();
        ctx.translate(-this.cameraX, 0);
        
        // Arkaplan
        let gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#DEB887');
        gradient.addColorStop(1, '#8B7355');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.worldWidth, h);
        
        // Zemin
        ctx.fillStyle = '#654321';
        ctx.fillRect(0, h - 100, this.worldWidth, 100);
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, h - 105, this.worldWidth, 5);
        
        // Altın madenleri
        this.goldMines.forEach(mine => {
            if (mine.hp > 0) {
                ctx.fillStyle = mine.team === 'player' ? '#3498db' : mine.team === 'enemy' ? '#e74c3c' : '#95a5a6';
                ctx.fillRect(mine.x - 25, mine.y - 25, 50, 50);
                ctx.fillStyle = '#f39c12';
                ctx.font = 'bold 30px Arial';
                ctx.fillText('⛏️', mine.x - 15, mine.y + 10);
                
                if (mine.workers > 0) {
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 14px Arial';
                    ctx.fillText(`x${mine.workers}`, mine.x - 10, mine.y + 35);
                }
                
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(mine.x - 25, mine.y - 35, 50, 6);
                ctx.fillStyle = '#2ecc71';
                ctx.fillRect(mine.x - 25, mine.y - 35, 50 * (mine.hp / mine.maxHp), 6);
            }
        });
        
        // Statüler
        this.drawStatue(ctx, this.playerStatue, true);
        this.drawStatue(ctx, this.enemyStatue, false);
        
        // Parçacıklar
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 40;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        // Mermiler
        this.projectiles.forEach(p => {
            if (p.type === 'mage') {
                ctx.fillStyle = '#9b59b6';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#9b59b6';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = p.friendly ? '#8B4513' : '#8B0000';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Birimler
        this.units.forEach(u => this.drawUnit(ctx, u, true));
        this.enemyUnits.forEach(e => this.drawUnit(ctx, e, false));
        
        // Okçular
        this.archers.forEach(a => this.drawArcher(ctx, a, true));
        this.enemyArchers.forEach(a => this.drawArcher(ctx, a, false));
        
        // Efektler
        this.effects.forEach(e => {
            ctx.fillStyle = e.color;
            ctx.globalAlpha = e.life / 60;
            ctx.font = 'bold 24px Arial';
            ctx.fillText(e.text, e.x - ctx.measureText(e.text).width / 2, e.y);
        });
        ctx.globalAlpha = 1;
        
        ctx.restore();
        
        // UI Panel (kamera dışında)
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, w, 90);
        
        // Birim butonları
        const units = ['miner', 'swordsman', 'spearman', 'archer', 'mage', 'giant'];
        const icons = ['⛏️', '⚔️', '🗡️', '🏹', '🔮', '👹'];
        const costs = units.map(u => this.getUnitCost(u));
        
        units.forEach((unit, i) => {
            const x = 10 + i * 100;
            const canAfford = this.gold >= costs[i];
            const isSelected = this.selectedUnit === unit;
            
            ctx.fillStyle = isSelected ? '#2ecc71' : canAfford ? '#555' : '#333';
            ctx.fillRect(x, 10, 90, 70);
            
            if (isSelected) {
                ctx.strokeStyle = '#27ae60';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, 10, 90, 70);
            }
            
            ctx.fillStyle = 'white';
            ctx.font = '32px Arial';
            ctx.fillText(icons[i], x + 30, 50);
            ctx.font = 'bold 12px Arial';
            ctx.fillText(`${costs[i]}G`, x + 25, 70);
            
            const upgrade = this.upgrades[unit];
            ctx.fillStyle = '#f39c12';
            ctx.font = '10px Arial';
            ctx.fillText(`Lv${upgrade.level}`, x + 5, 25);
        });
        
        // Spawn button
        const spawnX = w - 220;
        ctx.fillStyle = this.gold >= this.getUnitCost(this.selectedUnit) ? '#2ecc71' : '#555';
        ctx.fillRect(spawnX, 10, 100, 70);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('ÜRET', spawnX + 20, 40);
        ctx.font = '12px Arial';
        ctx.fillText('(Space)', spawnX + 20, 60);
        
        // Upgrade button
        const upgradeX = w - 110;
        const upgradeCost = this.upgrades[this.selectedUnit].cost;
        ctx.fillStyle = this.gold >= upgradeCost ? '#f39c12' : '#555';
        ctx.fillRect(upgradeX, 10, 100, 70);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('YÜKSELT', upgradeX + 10, 35);
        ctx.font = '11px Arial';
        ctx.fillText(`${upgradeCost}G`, upgradeX + 30, 50);
        ctx.fillText('(U)', upgradeX + 35, 65);
        
        // Altın ve bilgiler
        ctx.fillStyle = '#f39c12';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`💰 ${Math.floor(this.gold)}`, 620, 35);
        ctx.font = '14px Arial';
        ctx.fillText(`+${this.goldPerSecond.toFixed(1)}/s`, 625, 55);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Seviye ${this.level}: ${this.levelConfig.name}`, 620, 75);
        ctx.fillText(`${this.difficulty}`, 820, 75);
        
        // Mod göstergesi
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        const modeText = this.mode === 'attack' ? '⚔️ SALDIRI' : this.mode === 'defend' ? '🛡️ SAVUNMA' : '🏃 ÇEKİL';
        ctx.fillText(modeText, 820, 35);
        
        // Birim sayıları
        ctx.font = '13px Arial';
        ctx.fillText(`Asker: ${this.units.length}`, 820, 55);
        ctx.fillText(`Okçu: ${this.archers.length}`, 820, 72);
        
        // Düşman stratejisi
        if (this.enemyStrategy) {
            ctx.fillStyle = '#f39c12';
            ctx.font = '12px Arial';
            const strategyText = this.enemyStrategy.mode === 'building' ? '🏗️ Ordu Kuruyor' : 
                                 this.enemyStrategy.mode === 'attacking' ? '⚔️ Saldırıyor' : '🛡️ Savunuyor';
            ctx.fillText(`Düşman: ${strategyText}`, 950, 55);
            ctx.fillText(`Hedef: ${this.enemyStrategy.targetArmySize} asker`, 950, 72);
        }
        
        // Kazanma/Kaybetme ekranı
        if (this.gameState === 'won') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#2ecc71';
            ctx.font = 'bold 72px Arial';
            ctx.fillText('ZAFER!', w/2 - 120, h/2 - 50);
            ctx.fillStyle = 'white';
            ctx.font = '28px Arial';
            ctx.fillText(`Seviye ${this.level} Tamamlandı!`, w/2 - 180, h/2 + 20);
            ctx.font = '20px Arial';
            ctx.fillText('Yeni seviye başlıyor...', w/2 - 130, h/2 + 60);
        } else if (this.gameState === 'lost') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 72px Arial';
            ctx.fillText('YENİLDİN!', w/2 - 160, h/2 - 50);
            ctx.fillStyle = 'white';
            ctx.font = '28px Arial';
            ctx.fillText(`Seviye ${this.level} - ${this.difficulty}`, w/2 - 150, h/2 + 20);
            ctx.font = '20px Arial';
            ctx.fillText('Ana menüye dönmek için geri tuşuna bas', w/2 - 240, h/2 + 60);
        }
    }
    
    drawStatue(ctx, statue, isPlayer) {
        ctx.fillStyle = isPlayer ? '#2980b9' : '#c0392b';
        ctx.fillRect(statue.x, statue.y + statue.height - 30, statue.width, 30);
        
        ctx.fillStyle = isPlayer ? '#3498db' : '#e74c3c';
        ctx.fillRect(statue.x + 10, statue.y, statue.width - 20, statue.height - 30);
        
        ctx.beginPath();
        ctx.arc(statue.x + statue.width/2, statue.y + 20, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(statue.x + statue.width/2, statue.y + 40);
        ctx.lineTo(statue.x + statue.width/2, statue.y - 10);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(statue.x, statue.y - 20, statue.width, 10);
        ctx.fillStyle = isPlayer ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(statue.x, statue.y - 20, statue.width * (statue.hp / statue.maxHp), 10);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`${Math.floor(statue.hp)}/${statue.maxHp}`, statue.x + 5, statue.y - 25);
    }
    
    drawUnit(ctx, u, isPlayer) {
        const colors = {
            miner: '#f39c12',
            swordsman: '#27ae60',
            spearman: '#3498db',
            archer: '#8B4513',
            mage: '#9b59b6',
            giant: '#e67e22'
        };
        
        const color = isPlayer ? colors[u.type] : '#e74c3c';
        const size = u.type === 'giant' ? 1.5 : 1;
        
        // Saldırı animasyonu
        let attackOffset = 0;
        if (u.attackAnim) {
            attackOffset = u.attackAnim;
            u.attackAnim--;
            if (isPlayer) {
                u.x += 0.5;
            } else {
                u.x -= 0.5;
            }
        }
        
        // Savaş durumunda titreme efekti
        let shakeX = 0;
        let shakeY = 0;
        if (u.state === 'attacking') {
            shakeX = (Math.random() - 0.5) * 2;
            shakeY = (Math.random() - 0.5) * 2;
        }
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(u.x + 10 * size, canvas.height - 105, 12 * size, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Gövde (shake efekti ile)
        ctx.fillStyle = color;
        ctx.fillRect(u.x + 2 + shakeX, u.y + 10 * size + shakeY, 16 * size, 25 * size);
        
        // Baş
        ctx.beginPath();
        ctx.arc(u.x + 10 * size + shakeX, u.y + 8 * size + shakeY, 8 * size, 0, Math.PI * 2);
        ctx.fill();
        
        // Saldırı durumunda kırmızı glow
        if (u.state === 'attacking') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = isPlayer ? '#2ecc71' : '#e74c3c';
            ctx.beginPath();
            ctx.arc(u.x + 10 * size, u.y + 20 * size, 25 * size, 0, Math.PI * 2);
            ctx.fillStyle = isPlayer ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)';
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 4 * size;
        ctx.lineCap = 'round';
        let legOffset = u.state === 'moving' ? Math.sin(u.animFrame) * 8 : 0;
        ctx.beginPath();
        ctx.moveTo(u.x + 6 * size, u.y + 35 * size);
        ctx.lineTo(u.x + (6 + legOffset) * size, u.y + 45 * size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(u.x + 14 * size, u.y + 35 * size);
        ctx.lineTo(u.x + (14 - legOffset) * size, u.y + 45 * size);
        ctx.stroke();
        
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 3 * size;
        
        if (u.type === 'miner') {
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(u.x + 18 * size, u.y + 15 * size, 8 * size, 3 * size);
            ctx.fillRect(u.x + 24 * size, u.y + 12 * size, 3 * size, 8 * size);
        } else if (u.type === 'swordsman') {
            ctx.beginPath();
            ctx.moveTo(u.x + 18 * size, u.y + 25 * size);
            ctx.lineTo(u.x + 18 * size, u.y + 5 * size);
            ctx.stroke();
        } else if (u.type === 'spearman') {
            ctx.lineWidth = 2 * size;
            ctx.beginPath();
            ctx.moveTo(u.x + 18 * size, u.y + 30 * size);
            ctx.lineTo(u.x + 18 * size, u.y + 2 * size);
            ctx.stroke();
        } else if (u.type === 'archer') {
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2 * size;
            ctx.beginPath();
            ctx.arc(u.x + 20 * size, u.y + 15 * size, 6 * size, -Math.PI/2, Math.PI/2);
            ctx.stroke();
        } else if (u.type === 'mage') {
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath();
            ctx.moveTo(u.x + 10 * size, u.y - 5 * size);
            ctx.lineTo(u.x + 5 * size, u.y + 5 * size);
            ctx.lineTo(u.x + 15 * size, u.y + 5 * size);
            ctx.fill();
        }
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(u.x, u.y - 8, 20 * size, 4);
        ctx.fillStyle = isPlayer ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(u.x, u.y - 8, 20 * size * (u.hp / u.maxHp), 4);
    }
    
    drawArcher(ctx, archer, isPlayer) {
        ctx.fillStyle = isPlayer ? '#8B4513' : '#8B0000';
        ctx.fillRect(archer.x, archer.y, 20, 30);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('🏹', archer.x + 2, archer.y + 20);
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(archer.x, archer.y - 8, 20, 4);
        ctx.fillStyle = isPlayer ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(archer.x, archer.y - 8, 20 * (archer.hp / archer.maxHp), 4);
    }
    
    cleanup() {
        document.removeEventListener('keydown', this.handleKeyDown);
        canvas.removeEventListener('click', this.handleClick);
        canvas.removeEventListener('mousedown', this.handleMouseDown);
        canvas.removeEventListener('mousemove', this.handleMouseMove);
        canvas.removeEventListener('mouseup', this.handleMouseUp);
        canvas.removeEventListener('mouseleave', this.handleMouseUp);
        canvas.removeEventListener('touchstart', this.handleTouchStart);
        canvas.removeEventListener('touchmove', this.handleTouchMove);
        canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
}
