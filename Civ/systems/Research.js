export const TechnologyData = {
    // ===== ANCIENT ERA =====
    POTTERY: { id: 'POTTERY', name: 'Pottery', cost: 20, era: 'ancient', prerequisites: [], unlocks: ['Granary', 'Shrine'] },
    ANIMAL_HUSBANDRY: { id: 'ANIMAL_HUSBANDRY', name: 'Animal Husbandry', cost: 20, era: 'ancient', prerequisites: [], unlocks: ['Pasture', 'reveals Horses'] },
    MINING: { id: 'MINING', name: 'Mining', cost: 20, era: 'ancient', prerequisites: [], unlocks: ['Mine', 'Quarry'] },
    SAILING: { id: 'SAILING', name: 'Sailing', cost: 20, era: 'ancient', prerequisites: [], unlocks: ['Galley', 'Embarkation'] },

    ARCHERY: { id: 'ARCHERY', name: 'Archery', cost: 35, era: 'ancient', prerequisites: ['ANIMAL_HUSBANDRY'], unlocks: ['Archer'] },
    WRITING: { id: 'WRITING', name: 'Writing', cost: 35, era: 'ancient', prerequisites: ['POTTERY'], unlocks: ['Library'] },
    MASONRY: { id: 'MASONRY', name: 'Masonry', cost: 35, era: 'ancient', prerequisites: ['MINING'], unlocks: ['Walls', 'Pyramids'] },
    BRONZE_WORKING: { id: 'BRONZE_WORKING', name: 'Bronze Working', cost: 35, era: 'ancient', prerequisites: ['MINING'], unlocks: ['Spearman', 'Barracks'] },

    CALENDAR: { id: 'CALENDAR', name: 'Calendar', cost: 55, era: 'ancient', prerequisites: ['POTTERY'], unlocks: ['Plantation', 'Stonehenge'] },
    WHEEL: { id: 'WHEEL', name: 'The Wheel', cost: 55, era: 'ancient', prerequisites: ['ANIMAL_HUSBANDRY'], unlocks: ['Chariot Archer', 'Water Mill', 'Roads'] },
    TRAPPING: { id: 'TRAPPING', name: 'Trapping', cost: 35, era: 'ancient', prerequisites: ['ANIMAL_HUSBANDRY'], unlocks: ['Camp', 'Trading Post'] },

    // ===== CLASSICAL ERA =====
    IRON_WORKING: { id: 'IRON_WORKING', name: 'Iron Working', cost: 80, era: 'classical', prerequisites: ['BRONZE_WORKING'], unlocks: ['Swordsman', 'Colossus'] },
    MATHEMATICS: { id: 'MATHEMATICS', name: 'Mathematics', cost: 80, era: 'classical', prerequisites: ['WRITING', 'WHEEL'], unlocks: ['Catapult', 'Hanging Gardens'] },
    CONSTRUCTION: { id: 'CONSTRUCTION', name: 'Construction', cost: 80, era: 'classical', prerequisites: ['MASONRY'], unlocks: ['Colosseum', 'Oracle'] },
    CURRENCY: { id: 'CURRENCY', name: 'Currency', cost: 80, era: 'classical', prerequisites: ['MATHEMATICS'], unlocks: ['Market', 'Petra'] },
    DRAMA: { id: 'DRAMA', name: 'Drama & Poetry', cost: 80, era: 'classical', prerequisites: ['WRITING'], unlocks: ['Amphitheater'] },
    PHILOSOPHY: { id: 'PHILOSOPHY', name: 'Philosophy', cost: 80, era: 'classical', prerequisites: ['WRITING'], unlocks: ['Temple'] },
    HORSEBACK_RIDING: { id: 'HORSEBACK_RIDING', name: 'Horseback Riding', cost: 80, era: 'classical', prerequisites: ['WHEEL'], unlocks: ['Horseman'] },

    // ===== MEDIEVAL ERA =====
    CIVIL_SERVICE: { id: 'CIVIL_SERVICE', name: 'Civil Service', cost: 120, era: 'medieval', prerequisites: ['CURRENCY', 'PHILOSOPHY'], unlocks: ['Chichen Itza'] },
    EDUCATION: { id: 'EDUCATION', name: 'Education', cost: 120, era: 'medieval', prerequisites: ['PHILOSOPHY'], unlocks: ['University', 'Notre Dame'] },
    CHIVALRY: { id: 'CHIVALRY', name: 'Chivalry', cost: 120, era: 'medieval', prerequisites: ['CIVIL_SERVICE', 'HORSEBACK_RIDING'], unlocks: ['Knight', 'Castle'] },
    METAL_CASTING: { id: 'METAL_CASTING', name: 'Metal Casting', cost: 120, era: 'medieval', prerequisites: ['IRON_WORKING', 'MATHEMATICS'], unlocks: ['Forge', 'Workshop', 'Trebuchet'] },
    MACHINERY: { id: 'MACHINERY', name: 'Machinery', cost: 120, era: 'medieval', prerequisites: ['METAL_CASTING'], unlocks: ['Crossbowman'] },
    ENGINEERING: { id: 'ENGINEERING', name: 'Engineering', cost: 120, era: 'medieval', prerequisites: ['MATHEMATICS', 'CONSTRUCTION'], unlocks: ['Machu Picchu', 'Pikeman'] },
    THEOLOGY: { id: 'THEOLOGY', name: 'Theology', cost: 120, era: 'medieval', prerequisites: ['PHILOSOPHY', 'CALENDAR'], unlocks: ['Monastery'] },
    STEEL: { id: 'STEEL', name: 'Steel', cost: 140, era: 'medieval', prerequisites: ['METAL_CASTING'], unlocks: ['Longswordsman'] },

    // ===== RENAISSANCE ERA =====
    GUNPOWDER: { id: 'GUNPOWDER', name: 'Gunpowder', cost: 200, era: 'renaissance', prerequisites: ['STEEL', 'MACHINERY'], unlocks: ['Musketman', 'Armory'] },
    PRINTING_PRESS: { id: 'PRINTING_PRESS', name: 'Printing Press', cost: 200, era: 'renaissance', prerequisites: ['MACHINERY', 'EDUCATION'], unlocks: ['Theater'] },
    ASTRONOMY: { id: 'ASTRONOMY', name: 'Astronomy', cost: 200, era: 'renaissance', prerequisites: ['EDUCATION'], unlocks: ['Observatory'] },
    BANKING: { id: 'BANKING', name: 'Banking', cost: 200, era: 'renaissance', prerequisites: ['EDUCATION', 'CHIVALRY'], unlocks: ['Bank', 'Forbidden Palace'] },
    ARCHITECTURE: { id: 'ARCHITECTURE', name: 'Architecture', cost: 200, era: 'renaissance', prerequisites: ['BANKING'], unlocks: ['Sistine Chapel', 'Taj Mahal'] },
    CHEMISTRY: { id: 'CHEMISTRY', name: 'Chemistry', cost: 200, era: 'renaissance', prerequisites: ['GUNPOWDER'], unlocks: ['Cannon'] },
    METALLURGY: { id: 'METALLURGY', name: 'Metallurgy', cost: 200, era: 'renaissance', prerequisites: ['GUNPOWDER'], unlocks: ['Lancer'] },
    NAVIGATION: { id: 'NAVIGATION', name: 'Navigation', cost: 200, era: 'renaissance', prerequisites: ['ASTRONOMY'], unlocks: ['Caravel', 'Ocean movement'] },
    ECONOMICS: { id: 'ECONOMICS', name: 'Economics', cost: 200, era: 'renaissance', prerequisites: ['BANKING', 'PRINTING_PRESS'], unlocks: ['Windmill'] },

    // ===== INDUSTRIAL ERA =====
    SCIENTIFIC_THEORY: { id: 'SCIENTIFIC_THEORY', name: 'Scientific Theory', cost: 300, era: 'industrial', prerequisites: ['ASTRONOMY', 'NAVIGATION'], unlocks: ['Public School'] },
    INDUSTRIALIZATION: { id: 'INDUSTRIALIZATION', name: 'Industrialization', cost: 300, era: 'industrial', prerequisites: ['ECONOMICS'], unlocks: ['Factory', 'Big Ben'] },
    RIFLING: { id: 'RIFLING', name: 'Rifling', cost: 300, era: 'industrial', prerequisites: ['METALLURGY'], unlocks: ['Rifleman'] },
    MILITARY_SCIENCE: { id: 'MILITARY_SCIENCE', name: 'Military Science', cost: 300, era: 'industrial', prerequisites: ['CHEMISTRY', 'ECONOMICS'], unlocks: ['Cavalry', 'Military Academy'] },
    BIOLOGY: { id: 'BIOLOGY', name: 'Biology', cost: 300, era: 'industrial', prerequisites: ['SCIENTIFIC_THEORY', 'CHEMISTRY'], unlocks: ['Hospital', 'Zoo'] },
    DYNAMITE: { id: 'DYNAMITE', name: 'Dynamite', cost: 350, era: 'industrial', prerequisites: ['MILITARY_SCIENCE'], unlocks: ['Artillery'] },
    STEAM_POWER: { id: 'STEAM_POWER', name: 'Steam Power', cost: 300, era: 'industrial', prerequisites: ['INDUSTRIALIZATION', 'SCIENTIFIC_THEORY'], unlocks: ['Ironclad', 'Steamship'] },
    REPLACEABLE_PARTS: { id: 'REPLACEABLE_PARTS', name: 'Replaceable Parts', cost: 350, era: 'industrial', prerequisites: ['STEAM_POWER'], unlocks: ['Statue of Liberty'] },
    ELECTRICITY: { id: 'ELECTRICITY', name: 'Electricity', cost: 350, era: 'industrial', prerequisites: ['STEAM_POWER'], unlocks: ['Stock Exchange'] },
    RADIO: { id: 'RADIO', name: 'Radio', cost: 400, era: 'industrial', prerequisites: ['ELECTRICITY'], unlocks: ['Eiffel Tower', 'Broadcast Tower'] },
};

export const EraInfo = {
    ancient: { name: 'Ancient Era', color: '#8b6914', order: 0 },
    classical: { name: 'Classical Era', color: '#6b3fa0', order: 1 },
    medieval: { name: 'Medieval Era', color: '#4a6741', order: 2 },
    renaissance: { name: 'Renaissance Era', color: '#8b4513', order: 3 },
    industrial: { name: 'Industrial Era', color: '#4a4a5a', order: 4 }
};

export class TechTree {
    constructor() {
        this.techs = TechnologyData;
    }

    getAvailableTechs(unlockedTechs) {
        return Object.values(this.techs).filter(tech => {
            if (unlockedTechs.has(tech.id)) return false;
            return tech.prerequisites.every(pre => unlockedTechs.has(pre));
        });
    }

    getTech(id) {
        return this.techs[id];
    }

    getCurrentEra(unlockedTechs) {
        let highestEra = 'ancient';
        const eraOrder = { ancient: 0, classical: 1, medieval: 2, renaissance: 3, industrial: 4 };
        for (const techId of unlockedTechs) {
            const tech = this.techs[techId];
            if (tech && eraOrder[tech.era] > eraOrder[highestEra]) {
                highestEra = tech.era;
            }
        }
        return highestEra;
    }

    getTechsByEra() {
        const grouped = {};
        Object.values(this.techs).forEach(tech => {
            if (!grouped[tech.era]) grouped[tech.era] = [];
            grouped[tech.era].push(tech);
        });
        return grouped;
    }
}
