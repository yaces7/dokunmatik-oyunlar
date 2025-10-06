const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('game-container');
const controls = document.getElementById('controls');

let currentGame = null;
let gameLoop = null;

// Tam ekran için canvas boyutunu ayarla
function resizeCanvas() {
    const container = document.getElementById('game-container');
    const rect = container.getBoundingClientRect();
    canvas.width = Math.min(1200, rect.width - 40);
    canvas.height = Math.min(700, rect.height - 140);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function startGame(gameName) {
    menu.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    controls.classList.remove('hidden');
    
    if (gameLoop) cancelAnimationFrame(gameLoop);
    resizeCanvas();
    
    switch(gameName) {
        case 'soccer-legends':
            currentGame = new SoccerLegends();
            controls.innerHTML = `
                <div class="player-controls">
                    <div class="player-label">Oyuncu 1 (A/D/W)</div>
                    <button class="control-btn" data-action="p1-left">◄</button>
                    <button class="control-btn jump-btn" data-action="p1-jump">Zıpla</button>
                    <button class="control-btn" data-action="p1-right">►</button>
                </div>
                <div class="player-controls">
                    <div class="player-label">Oyuncu 2 (←/→/↑)</div>
                    <button class="control-btn" data-action="p2-left">◄</button>
                    <button class="control-btn jump-btn" data-action="p2-jump">Zıpla</button>
                    <button class="control-btn" data-action="p2-right">►</button>
                </div>
            `;
            setupTouchControls();
            break;
        case 'soccer-random':
            currentGame = new SoccerRandom();
            controls.innerHTML = `
                <div class="player-controls">
                    <div class="player-label">Oyuncu 1 (W)</div>
                    <button class="control-btn jump-btn big" data-action="p1-jump">ZIPLA</button>
                </div>
                <div class="player-controls">
                    <div class="player-label">Oyuncu 2 (↑)</div>
                    <button class="control-btn jump-btn big" data-action="p2-jump">ZIPLA</button>
                </div>
            `;
            setupTouchControls();
            break;
        case 'stick-war':
            currentGame = new StickWar();
            controls.innerHTML = `
                <div class="stick-controls">
                    <button class="mode-btn" data-action="attack">⚔️ SALDIRI</button>
                    <button class="mode-btn" data-action="defend">🛡️ SAVUNMA</button>
                    <button class="mode-btn" data-action="retreat">🏃 ÇEKİL</button>
                </div>
            `;
            setupStickControls();
            break;
    }
    
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
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentGame) {
        currentGame.update();
        currentGame.draw(ctx);
    }
    gameLoop = requestAnimationFrame(animate);
}

function setupTouchControls() {
    const buttons = controls.querySelectorAll('[data-action]');
    buttons.forEach(btn => {
        const action = btn.getAttribute('data-action');
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            currentGame.touchControl(action, true);
        });
        btn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            currentGame.touchControl(action, false);
        });
        btn.addEventListener('mouseleave', (e) => {
            currentGame.touchControl(action, false);
        });
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            currentGame.touchControl(action, true);
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            currentGame.touchControl(action, false);
        });
        btn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            currentGame.touchControl(action, false);
        });
    });
}

function setupStickControls() {
    const buttons = controls.querySelectorAll('[data-action]');
    buttons.forEach(btn => {
        const action = btn.getAttribute('data-action');
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            currentGame.setMode(action);
        });
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            currentGame.setMode(action);
        });
    });
}

// Soccer Legends (basitleştirilmiş)
class SoccerLegends {
    constructor() {
        this.player1 = { x: 150, y: 400, vx: 0, vy: 0, width: 40, height: 60, score: 0, canJump: true };
        this.player2 = { x: 650, y: 400, vx: 0, vy: 0, width: 40, height: 60, score: 0, canJump: true };
        this.ball = { x: 400, y: 300, vx: 0, vy: 0, radius: 15 };
        this.ground = 500;
        this.gravity = 0.8;
        this.controls = { p1Left: false, p1Right: false, p2Left: false, p2Right: false };
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }
    
    init() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }
    
    handleKeyDown(e) {
        if (e.key === 'a' || e.key === 'A') this.controls.p1Left = true;
        if (e.key === 'd' || e.key === 'D') this.controls.p1Right = true;
        if (e.key === 'w' || e.key === 'W') {
            if (this.player1.canJump) { this.player1.vy = -16; this.player1.canJump = false; }
        }
        if (e.key === 'ArrowLeft') this.controls.p2Left = true;
        if (e.key === 'ArrowRight') this.controls.p2Right = true;
        if (e.key === 'ArrowUp') {
            if (this.player2.canJump) { this.player2.vy = -16; this.player2.canJump = false; }
        }
    }
    
    handleKeyUp(e) {
        if (e.key === 'a' || e.key === 'A') this.controls.p1Left = false;
        if (e.key === 'd' || e.key === 'D') this.controls.p1Right = false;
        if (e.key === 'ArrowLeft') this.controls.p2Left = false;
        if (e.key === 'ArrowRight') this.controls.p2Right = false;
    }
    
    touchControl(action, pressed) {
        if (action === 'p1-left') this.controls.p1Left = pressed;
        if (action === 'p1-right') this.controls.p1Right = pressed;
        if (action === 'p1-jump' && pressed && this.player1.canJump) {
            this.player1.vy = -16; this.player1.canJump = false;
        }
        if (action === 'p2-left') this.controls.p2Left = pressed;
        if (action === 'p2-right') this.controls.p2Right = pressed;
        if (action === 'p2-jump' && pressed && this.player2.canJump) {
            this.player2.vy = -16; this.player2.canJump = false;
        }
    }
    
    update() {
        if (this.controls.p1Left) this.player1.vx = -5;
        else if (this.controls.p1Right) this.player1.vx = 5;
        else this.player1.vx *= 0.8;
        
        if (this.controls.p2Left) this.player2.vx = -5;
        else if (this.controls.p2Right) this.player2.vx = 5;
        else this.player2.vx *= 0.8;
        
        [this.player1, this.player2].forEach(p => {
            p.vy += this.gravity;
            p.x += p.vx;
            p.y += p.vy;
            if (p.y > this.ground - p.height) {
                p.y = this.ground - p.height;
                p.vy = 0;
                p.canJump = true;
            }
            p.x = Math.max(0, Math.min(canvas.width - p.width, p.x));
        });
        
        this.ball.vy += this.gravity;
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        this.ball.vx *= 0.98;
        
        if (this.ball.y > this.ground - this.ball.radius) {
            this.ball.y = this.ground - this.ball.radius;
            this.ball.vy *= -0.7;
            this.ball.vx *= 0.95;
        }
        
        if (this.ball.x < this.ball.radius || this.ball.x > canvas.width - this.ball.radius) {
            this.ball.vx *= -0.8;
            this.ball.x = this.ball.x < this.ball.radius ? this.ball.radius : canvas.width - this.ball.radius;
        }
        
        [this.player1, this.player2].forEach(p => {
            if (this.ball.x + this.ball.radius > p.x && 
                this.ball.x - this.ball.radius < p.x + p.width &&
                this.ball.y + this.ball.radius > p.y && 
                this.ball.y - this.ball.radius < p.y + p.height) {
                let dx = this.ball.x - (p.x + p.width/2);
                let dy = this.ball.y - (p.y + p.height/2);
                let angle = Math.atan2(dy, dx);
                let speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy) + 10;
                this.ball.vx = Math.cos(angle) * speed;
                this.ball.vy = Math.sin(angle) * speed - 3;
            }
        });
        
        if (this.ball.y < 120 && this.ball.x < 90) {
            this.player2.score++;
            this.resetBall();
        }
        if (this.ball.y < 120 && this.ball.x > canvas.width - 90) {
            this.player1.score++;
            this.resetBall();
        }
    }
    
    resetBall() {
        this.ball.x = canvas.width / 2;
        this.ball.y = 300;
        this.ball.vx = 0;
        this.ball.vy = 0;
    }
    
    draw(ctx) {
        let gradient = ctx.createLinearGradient(0, 0, 0, this.ground);
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(1, '#27ae60');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, this.ground);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(canvas.width/2, 0);
        ctx.lineTo(canvas.width/2, this.ground);
        ctx.stroke();
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(0, 0, 90, 130);
        ctx.fillRect(canvas.width - 90, 0, 90, 130);
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(this.player1.x, this.player1.y, this.player1.width, this.player1.height);
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(this.player2.x, this.player2.y, this.player2.width, this.player2.height);
        
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(canvas.width/2 - 80, 10, 160, 50);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 35px Arial';
        ctx.fillText(`${this.player1.score} - ${this.player2.score}`, canvas.width/2 - 40, 50);
        
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(0, this.ground, canvas.width, canvas.height - this.ground);
    }
    
    cleanup() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}

// Soccer Random (basitleştirilmiş)
class SoccerRandom {
    constructor() {
        this.player1 = { x: 200, y: 450, vx: 0, vy: 0, angle: 0, jumping: false };
        this.player2 = { x: 600, y: 450, vx: 0, vy: 0, angle: 0, jumping: false };
        this.ball = { x: 400, y: 200, vx: 0, vy: 0, radius: 20 };
        this.score = { p1: 0, p2: 0 };
        this.gravity = 0.6;
        this.randomness = 1;
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }
    
    init() {
        this.changePhysics();
        this.physicsInterval = setInterval(() => this.changePhysics(), 6000);
        document.addEventListener('keydown', this.handleKeyDown);
    }
    
    handleKeyDown(e) {
        if ((e.key === 'w' || e.key === 'W') && !this.player1.jumping) {
            this.player1.jumping = true;
            this.player1.vy = -14 * this.randomness;
            this.player1.vx = (Math.random() - 0.5) * 3 * this.randomness;
        }
        if (e.key === 'ArrowUp' && !this.player2.jumping) {
            this.player2.jumping = true;
            this.player2.vy = -14 * this.randomness;
            this.player2.vx = (Math.random() - 0.5) * 3 * this.randomness;
        }
    }
    
    touchControl(action, pressed) {
        if (!pressed) return;
        if (action === 'p1-jump' && !this.player1.jumping) {
            this.player1.jumping = true;
            this.player1.vy = -14 * this.randomness;
            this.player1.vx = (Math.random() - 0.5) * 3 * this.randomness;
        }
        if (action === 'p2-jump' && !this.player2.jumping) {
            this.player2.jumping = true;
            this.player2.vy = -14 * this.randomness;
            this.player2.vx = (Math.random() - 0.5) * 3 * this.randomness;
        }
    }
    
    changePhysics() {
        const modes = ['normal', 'moon', 'heavy', 'crazy'];
        this.physicsMode = modes[Math.floor(Math.random() * modes.length)];
        switch(this.physicsMode) {
            case 'moon': this.gravity = 0.3; this.randomness = 1.5; break;
            case 'heavy': this.gravity = 1.0; this.randomness = 0.7; break;
            case 'crazy': this.gravity = 0.5; this.randomness = 2.0; break;
            default: this.gravity = 0.6; this.randomness = 1;
        }
    }
    
    update() {
        [this.player1, this.player2].forEach(p => {
            if (p.jumping) {
                p.vy += this.gravity;
                p.y += p.vy;
                p.x += p.vx;
                p.angle += 0.15;
                p.vx *= 0.98;
                if (p.y >= 450) {
                    p.y = 450;
                    p.jumping = false;
                    p.vy = 0;
                    p.vx = 0;
                    p.angle = 0;
                }
            }
        });
        
        this.ball.vy += this.gravity;
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        this.ball.vx *= 0.99;
        
        if (this.ball.y > 550) {
            this.ball.y = 550;
            this.ball.vy *= -0.7;
        }
        
        [this.player1, this.player2].forEach(p => {
            let dist = Math.hypot(this.ball.x - p.x, this.ball.y - p.y);
            if (dist < 50) {
                let angle = Math.atan2(this.ball.y - p.y, this.ball.x - p.x);
                let power = 12 * this.randomness;
                this.ball.vx = Math.cos(angle) * power + p.vx;
                this.ball.vy = Math.sin(angle) * power - 4;
            }
        });
        
        if (this.ball.x < 0 && this.ball.y > 200 && this.ball.y < 450) {
            this.score.p2++;
            this.resetBall();
        }
        if (this.ball.x > canvas.width && this.ball.y > 200 && this.ball.y < 450) {
            this.score.p1++;
            this.resetBall();
        }
    }
    
    resetBall() {
        this.ball.x = canvas.width / 2;
        this.ball.y = 200;
        this.ball.vx = 0;
        this.ball.vy = 0;
    }
    
    draw(ctx) {
        let bgColor = this.physicsMode === 'moon' ? '#34495e' : 
                      this.physicsMode === 'heavy' ? '#c0392b' : 
                      this.physicsMode === 'crazy' ? '#9b59b6' : '#1abc9c';
        
        let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, bgColor);
        gradient.addColorStop(1, '#16a085');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'rgba(231, 76, 60, 0.7)';
        ctx.fillRect(0, 200, 30, 250);
        ctx.fillRect(canvas.width - 30, 200, 30, 250);
        
        ctx.fillStyle = '#16a085';
        ctx.fillRect(0, 500, canvas.width, canvas.height - 500);
        
        [this.player1, this.player2].forEach((p, i) => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = i === 0 ? '#3498db' : '#e74c3c';
            ctx.fillRect(-20, -50, 40, 70);
            ctx.beginPath();
            ctx.arc(0, -65, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(canvas.width/2 - 100, 10, 200, 60);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 45px Arial';
        ctx.fillText(`${this.score.p1} : ${this.score.p2}`, canvas.width/2 - 50, 60);
    }
    
    cleanup() {
        if (this.physicsInterval) clearInterval(this.physicsInterval);
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}

// STICK WAR LEGACY - TAM VERSİYON (Orijinal Oyun Gibi)
class StickWar {
    constructor() {
        // Oyun durumu
        this.level = 1;
        this.difficulty = 'Normal';
        this.mode = 'defend';
        this.gameState = 'playing'; // playing, won, lost
        
        // Kaynaklar
        this.gold = 300;
        this.enemyGold = 200;
        this.goldPerSecond = 0;
        
        // Statüler (Oyunun ana hedefi)
        this.playerStatue = { x: 80, y: 350, hp: 500, maxHp: 500, width: 60, height: 150 };
        this.enemyStatue = { x: canvas.width - 140, y: 350, hp: 500, maxHp: 500, width: 60, height: 150 };
        
        // Birimler
        this.units = [];
        this.enemyUnits = [];
        
        // Altın madenleri
        this.goldMines = [
            { x: canvas.width * 0.25, y: canvas.height - 120, hp: 150, maxHp: 150, team: null, workers: 0 },
            { x: canvas.width * 0.75, y: canvas.height - 120, hp: 150, maxHp: 150, team: null, workers: 0 }
        ];
        
        // Seçili birim ve yükseltmeler
        this.selectedUnit = 'miner';
        this.upgrades = {
            miner: { level: 1, damage: 10, hp: 50, cost: 100 },
            swordsman: { level: 1, damage: 25, hp: 100, cost: 150 },
            spearman: { level: 1, damage: 20, hp: 90, cost: 150 },
            archer: { level: 1, damage: 18, hp: 70, cost: 150 },
            mage: { level: 1, damage: 35, hp: 60, cost: 200 },
            giant: { level: 1, damage: 50, hp: 300, cost: 250 }
        };
        
        // Efektler
        this.particles = [];
        this.projectiles = [];
        this.effects = [];
        
        // Düşman AI
        this.enemyLastSpawn = 0;
        this.enemyStrategy = 'balanced';
        
        // Event handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }
    
    init() {
        document.addEventListener('keydown', this.handleKeyDown);
        canvas.addEventListener('click', this.handleClick);
        this.enemyStatue.hp = 500 + (this.level - 1) * 100;
        this.enemyStatue.maxHp = this.enemyStatue.hp;
    }
    
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
    }
    
    handleClick(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // UI butonları
        const buttonY = 10;
        const buttonHeight = 70;
        const buttonWidth = 90;
        
        if (y > buttonY && y < buttonY + buttonHeight) {
            const units = ['miner', 'swordsman', 'spearman', 'archer', 'mage', 'giant'];
            units.forEach((unit, i) => {
                const buttonX = 10 + i * (buttonWidth + 10);
                if (x > buttonX && x < buttonX + buttonWidth) {
                    this.selectUnit(unit);
                }
            });
            
            // Spawn button
            if (x > canvas.width - 220 && x < canvas.width - 110) {
                this.spawnUnit(this.selectedUnit);
            }
            
            // Upgrade button
            if (x > canvas.width - 100 && x < canvas.width - 10) {
                this.upgradeUnit(this.selectedUnit);
            }
        }
    }
    
    selectUnit(type) {
        this.selectedUnit = type;
    }
    
    setMode(mode) {
        this.mode = mode;
    }
    
    getUnitCost(type) {
        const baseCosts = { miner: 30, swordsman: 60, spearman: 50, archer: 70, mage: 120, giant: 200 };
        return baseCosts[type];
    }
    
    spawnUnit(type) {
        const cost = this.getUnitCost(type);
        
        if (this.gold >= cost) {
            this.gold -= cost;
            const upgrade = this.upgrades[type];
            
            this.units.push({
                x: 150,
                y: canvas.height - 120,
                type: type,
                hp: upgrade.hp,
                maxHp: upgrade.hp,
                damage: upgrade.damage,
                speed: type === 'miner' ? 2.5 : type === 'giant' ? 1 : type === 'archer' ? 1.5 : 2,
                range: type === 'archer' ? 200 : type === 'mage' ? 250 : 50,
                attackCooldown: 0,
                animFrame: 0,
                mining: false,
                targetMine: null,
                state: 'idle'
            });
            
            this.createParticles(150, canvas.height - 120, 10, '#2ecc71');
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
            this.createEffect('YÜKSELTME!', canvas.width / 2, 100, '#2ecc71');
        }
    }
    
    update() {
        if (this.gameState !== 'playing') {
            if (this.gameState === 'won') {
                setTimeout(() => this.nextLevel(), 2000);
            }
            return;
        }
        
        // Altın üretimi
        this.goldPerSecond = 0;
        this.goldMines.forEach(mine => {
            if (mine.hp > 0 && mine.workers > 0) {
                const goldGen = 0.2 * mine.workers;
                this.goldPerSecond += goldGen;
                if (mine.team === 'player') {
                    this.gold += goldGen;
                } else if (mine.team === 'enemy') {
                    this.enemyGold += goldGen;
                }
            }
        });
        
        // Düşman AI
        this.updateEnemyAI();
        
        // Oyuncu birimlerini güncelle
        this.updateUnits(this.units, this.enemyUnits, true);
        
        // Düşman birimlerini güncelle
        this.updateUnits(this.enemyUnits, this.units, false);
        
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
        
        // Efektleri güncelle
        this.effects = this.effects.filter(e => {
            e.life--;
            e.y -= 1;
            return e.life > 0;
        });
        
        // Ölü birimleri temizle
        this.units.forEach(u => {
            if (u.hp <= 0) {
                if (u.targetMine) u.targetMine.workers = Math.max(0, u.targetMine.workers - 1);
                this.createParticles(u.x, u.y, 15, '#95a5a6');
            }
        });
        this.enemyUnits.forEach(e => {
            if (e.hp <= 0) {
                if (e.targetMine) e.targetMine.workers = Math.max(0, e.targetMine.workers - 1);
                this.createParticles(e.x, e.y, 15, '#95a5a6');
            }
        });
        
        this.units = this.units.filter(u => u.hp > 0 && u.x < canvas.width + 50);
        this.enemyUnits = this.enemyUnits.filter(e => e.hp > 0 && e.x > -50);
        
        // Kazanma/Kaybetme kontrolü
        if (this.enemyStatue.hp <= 0) {
            this.gameState = 'won';
            this.createEffect('ZAFER!', canvas.width / 2, canvas.height / 2, '#2ecc71');
        }
        if (this.playerStatue.hp <= 0) {
            this.gameState = 'lost';
            this.createEffect('YENİLDİN!', canvas.width / 2, canvas.height / 2, '#e74c3c');
        }
    }
    
    updateUnits(units, enemies, isPlayer) {
        units.forEach(u => {
            u.animFrame += 0.12;
            
            // Miner davranışı
            if (u.type === 'miner') {
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
                
                // Mod bazlı davranış
                if (isPlayer) {
                    if (this.mode === 'retreat') {
                        if (u.x > 200) {
                            u.x -= u.speed * 1.5;
                            u.state = 'retreating';
                        }
                        return;
                    } else if (this.mode === 'defend') {
                        if (u.x > 300 && !target) {
                            u.x -= u.speed * 0.5;
                            u.state = 'returning';
                        }
                    }
                }
                
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
                    // Statüye saldır
                    let distToStatue = Math.abs(u.x - targetStatue.x);
                    if (distToStatue < 80) {
                        u.state = 'attacking';
                        u.attackCooldown--;
                        if (u.attackCooldown <= 0) {
                            targetStatue.hp -= u.damage * 0.3;
                            this.createParticles(targetStatue.x + targetStatue.width/2, targetStatue.y + 50, 8, '#e74c3c');
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
            this.projectiles.push({
                x: attacker.x,
                y: attacker.y + 10,
                targetX: target.x,
                targetY: target.y + 10,
                vx: (target.x - attacker.x) / 30,
                vy: -3,
                damage: attacker.damage,
                type: attacker.type,
                friendly: isPlayer
            });
        } else {
            let dist = Math.abs(attacker.x - target.x);
            if (dist < 50) {
                target.hp -= attacker.damage;
                this.createParticles(target.x, target.y, 10, '#e74c3c');
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
                        // Büyücü splash damage
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
        
        this.projectiles = this.projectiles.filter(p => !p.hit && p.x > -50 && p.x < canvas.width + 50 && p.y < canvas.height);
    }
    
    updateEnemyAI() {
        const spawnDelay = this.difficulty === 'Kolay' ? 5000 : this.difficulty === 'Zor' ? 2500 : this.difficulty === 'İmkansız' ? 1500 : 3500;
        
        if (Date.now() - this.enemyLastSpawn > spawnDelay) {
            let unitTypes = ['swordsman', 'spearman', 'archer', 'mage', 'giant', 'miner'];
            let weights = this.difficulty === 'İmkansız' ? [0.25, 0.25, 0.2, 0.15, 0.1, 0.05] : [0.3, 0.25, 0.2, 0.1, 0.05, 0.1];
            
            let rand = Math.random();
            let cumulative = 0;
            let selectedType = 'swordsman';
            
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
                
                this.enemyUnits.push({
                    x: canvas.width - 150,
                    y: canvas.height - 120,
                    type: selectedType,
                    hp: upgrade.hp * (this.level * 0.2 + 0.8),
                    maxHp: upgrade.hp * (this.level * 0.2 + 0.8),
                    damage: upgrade.damage * (this.level * 0.15 + 0.85),
                    speed: selectedType === 'miner' ? 2.5 : selectedType === 'giant' ? 1 : selectedType === 'archer' ? 1.5 : 2,
                    range: selectedType === 'archer' ? 200 : selectedType === 'mage' ? 250 : 50,
                    attackCooldown: 0,
                    animFrame: 0,
                    mining: false,
                    targetMine: null,
                    state: 'idle'
                });
                
                this.enemyLastSpawn = Date.now();
            }
        }
        
        this.enemyGold += 0.15;
    }
    
    nextLevel() {
        this.level++;
        
        // Zorluk ayarla
        if (this.level >= 10) this.difficulty = 'İmkansız';
        else if (this.level >= 6) this.difficulty = 'Zor';
        else if (this.level >= 3) this.difficulty = 'Normal';
        else this.difficulty = 'Kolay';
        
        // Ödüller
        this.gold += 200 + this.level * 50;
        
        // Sıfırla
        this.gameState = 'playing';
        this.units = [];
        this.enemyUnits = [];
        this.projectiles = [];
        this.particles = [];
        this.effects = [];
        
        this.playerStatue.hp = this.playerStatue.maxHp;
        this.enemyStatue.hp = 500 + (this.level - 1) * 100;
        this.enemyStatue.maxHp = this.enemyStatue.hp;
        
        this.goldMines.forEach(m => {
            m.hp = m.maxHp;
            m.workers = 0;
            m.team = null;
        });
        
        this.enemyGold = 200 + this.level * 30;
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
        this.effects.push({ text, x, y, color, life: 120 });
    }
    
    draw(ctx) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Arkaplan
        let gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#DEB887');
        gradient.addColorStop(1, '#8B7355');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        // Zemin
        ctx.fillStyle = '#654321';
        ctx.fillRect(0, h - 100, w, 100);
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, h - 105, w, 5);
        
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
        
        // UI Panel
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
        ctx.font = 'bold 22px Arial';
        ctx.fillText(`💰 ${Math.floor(this.gold)}`, 620, 35);
        ctx.font = '12px Arial';
        ctx.fillText(`+${this.goldPerSecond.toFixed(1)}/s`, 625, 50);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Seviye: ${this.level}`, 620, 70);
        ctx.fillText(`${this.difficulty}`, 720, 70);
        
        // Mod göstergesi
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        const modeText = this.mode === 'attack' ? '⚔️ SALDIRI' : this.mode === 'defend' ? '🛡️ SAVUNMA' : '🏃 ÇEKİL';
        ctx.fillText(modeText, 820, 35);
        
        // Birim sayıları
        ctx.font = '12px Arial';
        ctx.fillText(`Birimler: ${this.units.length}`, 820, 55);
        ctx.fillText(`Düşman: ${this.enemyUnits.length}`, 820, 70);
        
        // Efektler
        this.effects.forEach(e => {
            ctx.fillStyle = e.color;
            ctx.globalAlpha = e.life / 120;
            ctx.font = 'bold 48px Arial';
            ctx.fillText(e.text, e.x - ctx.measureText(e.text).width / 2, e.y);
        });
        ctx.globalAlpha = 1;
        
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
        // Statü tabanı
        ctx.fillStyle = isPlayer ? '#2980b9' : '#c0392b';
        ctx.fillRect(statue.x, statue.y + statue.height - 30, statue.width, 30);
        
        // Statü gövdesi
        ctx.fillStyle = isPlayer ? '#3498db' : '#e74c3c';
        ctx.fillRect(statue.x + 10, statue.y, statue.width - 20, statue.height - 30);
        
        // Statü başı
        ctx.beginPath();
        ctx.arc(statue.x + statue.width/2, statue.y + 20, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Silah
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(statue.x + statue.width/2, statue.y + 40);
        ctx.lineTo(statue.x + statue.width/2, statue.y - 10);
        ctx.stroke();
        
        // HP bar
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(statue.x, statue.y - 20, statue.width, 10);
        ctx.fillStyle = isPlayer ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(statue.x, statue.y - 20, statue.width * (statue.hp / statue.maxHp), 10);
        
        // HP text
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
        
        // Gölge
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(u.x + 10 * size, canvas.height - 105, 12 * size, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Gövde
        ctx.fillStyle = color;
        ctx.fillRect(u.x + 2, u.y + 10 * size, 16 * size, 25 * size);
        
        // Baş
        ctx.beginPath();
        ctx.arc(u.x + 10 * size, u.y + 8 * size, 8 * size, 0, Math.PI * 2);
        ctx.fill();
        
        // Bacaklar (animasyonlu)
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
        
        // Silah/Alet
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
        
        // HP bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(u.x, u.y - 8, 20 * size, 4);
        ctx.fillStyle = isPlayer ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(u.x, u.y - 8, 20 * size * (u.hp / u.maxHp), 4);
    }
    
    cleanup() {
        document.removeEventListener('keydown', this.handleKeyDown);
        canvas.removeEventListener('click', this.handleClick);
    }
}
