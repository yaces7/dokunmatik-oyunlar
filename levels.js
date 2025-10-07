// ============================================
// STICK WAR LEGACY - LEVEL CONFIGURATIONS
// ============================================

const LEVELS = [
    // LEVEL 1 - Tutorial
    {
        level: 1,
        name: "Başlangıç",
        difficulty: "Kolay",
        enemyCastleHp: 300,
        enemyGold: 100,
        enemySpawnDelay: 8000,
        enemyUnits: ['miner', 'swordsman'], // Sadece madenci ve savaşçı
        enemyUnitWeights: [0.4, 0.6],
        enemyUnitLevel: 1.0,
        goldMineHp: 150
    },
    
    // LEVEL 2
    {
        level: 2,
        name: "İlk Savaş",
        difficulty: "Kolay",
        enemyCastleHp: 400,
        enemyGold: 150,
        enemySpawnDelay: 7000,
        enemyUnits: ['miner', 'swordsman', 'archer'],
        enemyUnitWeights: [0.3, 0.5, 0.2],
        enemyUnitLevel: 1.0,
        goldMineHp: 150
    },
    
    // LEVEL 3
    {
        level: 3,
        name: "Mızrakçılar",
        difficulty: "Kolay",
        enemyCastleHp: 500,
        enemyGold: 200,
        enemySpawnDelay: 6500,
        enemyUnits: ['miner', 'swordsman', 'spearman', 'archer'],
        enemyUnitWeights: [0.2, 0.4, 0.3, 0.1],
        enemyUnitLevel: 1.1,
        goldMineHp: 200
    },
    
    // LEVEL 4
    {
        level: 4,
        name: "Okçu Ordusu",
        difficulty: "Normal",
        enemyCastleHp: 600,
        enemyGold: 250,
        enemySpawnDelay: 6000,
        enemyUnits: ['miner', 'swordsman', 'spearman', 'archer'],
        enemyUnitWeights: [0.15, 0.3, 0.25, 0.3],
        enemyUnitLevel: 1.2,
        goldMineHp: 200
    },
    
    // LEVEL 5
    {
        level: 5,
        name: "Büyücüler Geliyor",
        difficulty: "Normal",
        enemyCastleHp: 700,
        enemyGold: 300,
        enemySpawnDelay: 5500,
        enemyUnits: ['miner', 'swordsman', 'spearman', 'archer', 'mage'],
        enemyUnitWeights: [0.1, 0.3, 0.25, 0.25, 0.1],
        enemyUnitLevel: 1.3,
        goldMineHp: 200
    },
    
    // LEVEL 6
    {
        level: 6,
        name: "Karışık Ordu",
        difficulty: "Normal",
        enemyCastleHp: 800,
        enemyGold: 350,
        enemySpawnDelay: 5000,
        enemyUnits: ['miner', 'swordsman', 'spearman', 'archer', 'mage'],
        enemyUnitWeights: [0.1, 0.25, 0.25, 0.25, 0.15],
        enemyUnitLevel: 1.4,
        goldMineHp: 250
    },
    
    // LEVEL 7
    {
        level: 7,
        name: "Dev Tehdidi",
        difficulty: "Zor",
        enemyCastleHp: 900,
        enemyGold: 400,
        enemySpawnDelay: 4500,
        enemyUnits: ['miner', 'swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.1, 0.25, 0.2, 0.2, 0.15, 0.1],
        enemyUnitLevel: 1.5,
        goldMineHp: 250
    },
    
    // LEVEL 8
    {
        level: 8,
        name: "Hızlı Saldırı",
        difficulty: "Zor",
        enemyCastleHp: 1000,
        enemyGold: 450,
        enemySpawnDelay: 4000,
        enemyUnits: ['miner', 'swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.05, 0.25, 0.25, 0.2, 0.15, 0.1],
        enemyUnitLevel: 1.6,
        goldMineHp: 250
    },
    
    // LEVEL 9
    {
        level: 9,
        name: "Güçlü Düşman",
        difficulty: "Zor",
        enemyCastleHp: 1100,
        enemyGold: 500,
        enemySpawnDelay: 3800,
        enemyUnits: ['swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.25, 0.25, 0.2, 0.15, 0.15],
        enemyUnitLevel: 1.7,
        goldMineHp: 300
    },
    
    // LEVEL 10
    {
        level: 10,
        name: "Dev Ordusu",
        difficulty: "Çok Zor",
        enemyCastleHp: 1200,
        enemyGold: 550,
        enemySpawnDelay: 3500,
        enemyUnits: ['swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.2, 0.2, 0.2, 0.2, 0.2],
        enemyUnitLevel: 1.8,
        goldMineHp: 300
    },
    
    // LEVEL 11
    {
        level: 11,
        name: "Büyücü İstilası",
        difficulty: "Çok Zor",
        enemyCastleHp: 1300,
        enemyGold: 600,
        enemySpawnDelay: 3200,
        enemyUnits: ['swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.2, 0.15, 0.2, 0.3, 0.15],
        enemyUnitLevel: 1.9,
        goldMineHp: 300
    },
    
    // LEVEL 12
    {
        level: 12,
        name: "Devler Yürüyor",
        difficulty: "Çok Zor",
        enemyCastleHp: 1400,
        enemyGold: 650,
        enemySpawnDelay: 3000,
        enemyUnits: ['swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.15, 0.15, 0.2, 0.2, 0.3],
        enemyUnitLevel: 2.0,
        goldMineHp: 350
    },
    
    // LEVEL 13
    {
        level: 13,
        name: "Hızlı ve Öfkeli",
        difficulty: "Çok Zor",
        enemyCastleHp: 1500,
        enemyGold: 700,
        enemySpawnDelay: 2800,
        enemyUnits: ['swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.2, 0.2, 0.2, 0.2, 0.2],
        enemyUnitLevel: 2.1,
        goldMineHp: 350
    },
    
    // LEVEL 14
    {
        level: 14,
        name: "Kaos",
        difficulty: "Çok Zor",
        enemyCastleHp: 1600,
        enemyGold: 750,
        enemySpawnDelay: 2600,
        enemyUnits: ['swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.2, 0.2, 0.2, 0.2, 0.2],
        enemyUnitLevel: 2.2,
        goldMineHp: 350
    },
    
    // LEVEL 15
    {
        level: 15,
        name: "İmkansız Başlangıç",
        difficulty: "İmkansız",
        enemyCastleHp: 1700,
        enemyGold: 800,
        enemySpawnDelay: 2400,
        enemyUnits: ['swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.2, 0.2, 0.2, 0.2, 0.2],
        enemyUnitLevel: 2.3,
        goldMineHp: 400
    },
    
    // LEVEL 16
    {
        level: 16,
        name: "Cehennem Kapıları",
        difficulty: "İmkansız",
        enemyCastleHp: 1800,
        enemyGold: 850,
        enemySpawnDelay: 2200,
        enemyUnits: ['swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.15, 0.15, 0.2, 0.25, 0.25],
        enemyUnitLevel: 2.4,
        goldMineHp: 400
    },
    
    // LEVEL 17
    {
        level: 17,
        name: "Kıyamet",
        difficulty: "İmkansız",
        enemyCastleHp: 1900,
        enemyGold: 900,
        enemySpawnDelay: 2000,
        enemyUnits: ['swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.15, 0.15, 0.2, 0.25, 0.25],
        enemyUnitLevel: 2.5,
        goldMineHp: 400
    },
    
    // LEVEL 18
    {
        level: 18,
        name: "Son Savaş",
        difficulty: "İmkansız",
        enemyCastleHp: 2000,
        enemyGold: 950,
        enemySpawnDelay: 1800,
        enemyUnits: ['swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.1, 0.1, 0.2, 0.3, 0.3],
        enemyUnitLevel: 2.6,
        goldMineHp: 450
    },
    
    // LEVEL 19
    {
        level: 19,
        name: "Efsane Savaşçılar",
        difficulty: "İmkansız",
        enemyCastleHp: 2200,
        enemyGold: 1000,
        enemySpawnDelay: 1600,
        enemyUnits: ['swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.1, 0.1, 0.2, 0.3, 0.3],
        enemyUnitLevel: 2.8,
        goldMineHp: 450
    },
    
    // LEVEL 20 - FINAL BOSS
    {
        level: 20,
        name: "SON PATRON",
        difficulty: "İmkansız",
        enemyCastleHp: 2500,
        enemyGold: 1200,
        enemySpawnDelay: 1400,
        enemyUnits: ['swordsman', 'spearman', 'archer', 'mage', 'giant'],
        enemyUnitWeights: [0.1, 0.1, 0.2, 0.3, 0.3],
        enemyUnitLevel: 3.0,
        goldMineHp: 500
    }
];

// Seviye bilgisini al
function getLevelConfig(levelNumber) {
    if (levelNumber < 1 || levelNumber > LEVELS.length) {
        return LEVELS[0]; // Varsayılan olarak 1. seviye
    }
    return LEVELS[levelNumber - 1];
}

// Toplam seviye sayısı
function getTotalLevels() {
    return LEVELS.length;
}
