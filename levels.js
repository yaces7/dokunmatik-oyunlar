// ============================================
// STICK WAR LEGACY - 50 LEVEL CONFIGURATIONS
// ============================================

const LEVELS = [];

// Seviye oluşturucu fonksiyon
function generateLevel(level) {
    const baseGold = 100;
    const goldIncrement = 25; // Her seviyede 25 artış
    
    let difficulty, name, units, weights, spawnDelay, unitLevel;
    
    // Zorluk ve birim tipleri seviyeye göre
    if (level === 1) {
        difficulty = "Kolay";
        name = "Başlangıç";
        units = ['miner', 'swordsman'];
        weights = [0.4, 0.6];
        spawnDelay = 8000;
        unitLevel = 1.0;
    } else if (level === 2) {
        difficulty = "Kolay";
        name = "İlk Savaş";
        units = ['miner', 'swordsman', 'archer'];
        weights = [0.3, 0.5, 0.2];
        spawnDelay = 7000;
        unitLevel = 1.0;
    } else if (level <= 5) {
        difficulty = "Kolay";
        name = `Seviye ${level}`;
        units = ['miner', 'swordsman', 'spearman', 'archer'];
        weights = [0.2, 0.4, 0.3, 0.1];
        spawnDelay = 6500 - (level - 3) * 200;
        unitLevel = 1.0 + (level - 2) * 0.1;
    } else if (level <= 10) {
        difficulty = "Normal";
        name = level === 10 ? "İlk Patron" : `Seviye ${level}`;
        units = ['miner', 'swordsman', 'spearman', 'archer', 'mage'];
        weights = [0.1, 0.3, 0.25, 0.25, 0.1];
        spawnDelay = 5500 - (level - 6) * 200;
        unitLevel = 1.3 + (level - 6) * 0.1;
    } else if (level <= 20) {
        difficulty = "Zor";
        name = level === 20 ? "Büyük Patron" : `Seviye ${level}`;
        units = ['miner', 'swordsman', 'spearman', 'archer', 'mage', 'giant'];
        weights = [0.1, 0.25, 0.2, 0.2, 0.15, 0.1];
        spawnDelay = 4500 - (level - 11) * 150;
        unitLevel = 1.8 + (level - 11) * 0.1;
    } else if (level <= 35) {
        difficulty = "Çok Zor";
        name = level === 30 ? "Efsane Patron" : `Seviye ${level}`;
        units = ['swordsman', 'spearman', 'archer', 'mage', 'giant'];
        weights = [0.2, 0.2, 0.2, 0.2, 0.2];
        spawnDelay = Math.max(2000, 3500 - (level - 21) * 100);
        unitLevel = 2.8 + (level - 21) * 0.1;
    } else {
        difficulty = "İmkansız";
        name = level === 50 ? "SON PATRON" : `Seviye ${level}`;
        units = ['swordsman', 'spearman', 'archer', 'mage', 'giant'];
        weights = [0.15, 0.15, 0.2, 0.25, 0.25];
        spawnDelay = Math.max(1200, 2000 - (level - 36) * 50);
        unitLevel = 4.2 + (level - 36) * 0.15;
    }
    
    return {
        level: level,
        name: name,
        difficulty: difficulty,
        enemyCastleHp: 300 + (level - 1) * 25,
        enemyGold: baseGold + (level - 1) * goldIncrement,
        enemySpawnDelay: spawnDelay,
        enemyUnits: units,
        enemyUnitWeights: weights,
        enemyUnitLevel: unitLevel,
        goldMineHp: 150 + Math.floor((level - 1) / 5) * 50
    };
}

// 50 seviye oluştur
for (let i = 1; i <= 50; i++) {
    LEVELS.push(generateLevel(i));
}

// Seviye bilgisini al
function getLevelConfig(levelNumber) {
    if (levelNumber < 1 || levelNumber > LEVELS.length) {
        return LEVELS[0];
    }
    return LEVELS[levelNumber - 1];
}

// Toplam seviye sayısı
function getTotalLevels() {
    return LEVELS.length;
}
