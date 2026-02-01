export const TechnologyData = {
    // Ancient Era
    POTTERY: { id: 'POTTERY', name: 'Pottery', cost: 20, prerequisites: [], unlocks: ['Granary'] },
    ANIMAL_HUSBANDRY: { id: 'ANIMAL_HUSBANDRY', name: 'Animal Husbandry', cost: 20, prerequisites: [], unlocks: ['Pasture'] },
    MINING: { id: 'MINING', name: 'Mining', cost: 20, prerequisites: [], unlocks: ['Mine'] },
    SAILING: { id: 'SAILING', name: 'Sailing', cost: 20, prerequisites: [], unlocks: ['Work Boat'] },

    ARCHERY: { id: 'ARCHERY', name: 'Archery', cost: 35, prerequisites: ['ANIMAL_HUSBANDRY'], unlocks: ['Archer'] },
    WRITING: { id: 'WRITING', name: 'Writing', cost: 35, prerequisites: ['POTTERY'], unlocks: ['Library'] },
    MASONRY: { id: 'MASONRY', name: 'Masonry', cost: 35, prerequisites: ['MINING'], unlocks: ['Walls'] },
    BRONZE_WORKING: { id: 'BRONZE_WORKING', name: 'Bronze Working', cost: 35, prerequisites: ['MINING'], unlocks: ['Spearman'] },

    CALENDAR: { id: 'CALENDAR', name: 'Calendar', cost: 55, prerequisites: ['POTTERY'], unlocks: ['Plantation'] },
    WHEEL: { id: 'WHEEL', name: 'Wheel', cost: 55, prerequisites: ['ARCHERY'], unlocks: ['Chariot'] },

    // Classical Era
    IRON_WORKING: { id: 'IRON_WORKING', name: 'Iron Working', cost: 80, prerequisites: ['BRONZE_WORKING'], unlocks: ['Swordsman'] },
    MATHEMATICS: { id: 'MATHEMATICS', name: 'Mathematics', cost: 80, prerequisites: ['WRITING', 'WHEEL'], unlocks: ['Catapult'] },
    CONSTRUCTION: { id: 'CONSTRUCTION', name: 'Construction', cost: 80, prerequisites: ['MASONRY'], unlocks: ['Colosseum'] },
    CURRENCY: { id: 'CURRENCY', name: 'Currency', cost: 80, prerequisites: ['WRITING'], unlocks: ['Market'] },

    // Medieval Era
    ENGINEERING: { id: 'ENGINEERING', name: 'Engineering', cost: 120, prerequisites: ['MATHEMATICS', 'CONSTRUCTION'], unlocks: ['Aqueduct'] },
    CHIVALRY: { id: 'CHIVALRY', name: 'Chivalry', cost: 120, prerequisites: ['CURRENCY'], unlocks: ['Knight'] },
    MACHINERY: { id: 'MACHINERY', name: 'Machinery', cost: 120, prerequisites: ['IRON_WORKING', 'ENGINEERING'], unlocks: ['Crossbowman'] }
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
}
