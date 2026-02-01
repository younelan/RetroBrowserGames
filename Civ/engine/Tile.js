export const TerrainType = {
    OCEAN: { name: 'Ocean', color: '#1a365d', food: 1, prod: 0, gold: 1, icon: '🌊' },
    COAST: { name: 'Coast', color: '#2c5282', food: 1, prod: 0, gold: 2, icon: '🏖️' },
    GRASSLAND: { name: 'Grassland', color: '#48bb78', food: 2, prod: 0, gold: 0, icon: '🌱' },
    PLAINS: { name: 'Plains', color: '#ecc94b', food: 1, prod: 1, gold: 0, icon: '🌾' },
    DESERT: { name: 'Desert', color: '#f6e05e', food: 0, prod: 0, gold: 0, icon: '🏜️' },
    TUNDRA: { name: 'Tundra', color: '#a0aec0', food: 1, prod: 0, gold: 0, icon: '❄️' },
    SNOW: { name: 'Snow', color: '#f7fafc', food: 0, prod: 0, gold: 0, icon: '🌨️' },
    MOUNTAIN: { name: 'Mountain', color: '#2d3748', food: 0, prod: 0, gold: 0, impassable: true, icon: '🏔️' }
};

export const FeatureType = {
    NONE: { name: 'None', food: 0, prod: 0, gold: 0, icon: '' },
    FOREST: { name: 'Forest', food: 0, prod: 1, gold: 0, icon: '🌲', defense: 0.25 },
    JUNGLE: { name: 'Jungle', food: 1, prod: -1, gold: 0, icon: '🌴', defense: 0.25 },
    MARSH: { name: 'Marsh', food: -1, prod: 0, gold: 0, icon: '🍄', defense: -0.15 }
};

export const ResourceType = {
    NONE: { name: 'None', food: 0, prod: 0, gold: 0, icon: '' },
    IRON: { name: 'Iron', food: 0, prod: 2, gold: 0, icon: '⚙️', type: 'strategic' },
    HORSES: { name: 'Horses', food: 0, prod: 1, gold: 0, icon: '🐎', type: 'strategic' },
    GOLD: { name: 'Gold Resource', food: 0, prod: 0, gold: 3, icon: '💎', type: 'luxury' },
    WHEAT: { name: 'Wheat', food: 2, prod: 0, gold: 0, icon: '🍞', type: 'bonus' }
};

export const ImprovementType = {
    FARM: { name: 'Farm', food: 1, prod: 0, gold: 0, icon: '🚜', techsRequired: ['POTTERY'] },
    MINE: { name: 'Mine', food: 0, prod: 2, gold: 0, icon: '⚒️', techsRequired: ['MINING'] },
    PASTURE: { name: 'Pasture', food: 1, prod: 1, gold: 0, icon: '🛖', techsRequired: ['ANIMAL_HUSBANDRY'] },
    PLANTATION: { name: 'Plantation', food: 0, prod: 0, gold: 3, icon: '🏵️', techsRequired: ['CALENDAR'] }
};

export class HexTile {
    constructor(q, r, terrain = TerrainType.GRASSLAND) {
        this.q = q;
        this.r = r;
        this.terrain = terrain;
        this.feature = FeatureType.NONE;
        this.resource = ResourceType.NONE;
        this.improvement = null; // Store the ImprovementType object
        this.owner = null;
        this.city = null;
        this.village = false; // Tribal Village (Goody Hut)
        this.rivers = []; // Array of edge indices (0-5)
        this.discoveredBy = new Set();
        this.visibleTo = new Set();
    }

    getYield() {
        const freshWaterBonus = this.rivers.length > 0 ? 1 : 0;
        return {
            food: this.terrain.food + this.feature.food + this.resource.food + (this.improvement ? this.improvement.food : 0) + freshWaterBonus,
            production: this.terrain.prod + this.feature.prod + this.resource.prod + (this.improvement ? this.improvement.prod : 0),
            gold: this.terrain.gold + this.feature.gold + this.resource.gold + (this.improvement ? this.improvement.gold : 0),
            science: 0
        };
    }

    getCube() {
        return { x: this.q, y: -this.q - this.r, z: this.r };
    }
}
