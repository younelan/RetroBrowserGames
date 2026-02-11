export const TerrainType = {
    OCEAN: { name: 'Ocean', color: '#0f2b4a', food: 1, prod: 0, gold: 1, moveCost: 99, icon: '🌊', impassable: true },
    COAST: { name: 'Coast', color: '#1a4a7a', food: 1, prod: 0, gold: 2, moveCost: 99, icon: '🏖️' },
    GRASSLAND: { name: 'Grassland', color: '#3d8b37', food: 2, prod: 0, gold: 0, moveCost: 1, icon: '' },
    PLAINS: { name: 'Plains', color: '#b8a44c', food: 1, prod: 1, gold: 0, moveCost: 1, icon: '' },
    HILLS: { name: 'Hills', color: '#7a8a3e', food: 1, prod: 2, gold: 0, moveCost: 2, icon: '⛰️', defense: 0.25 },
    DESERT: { name: 'Desert', color: '#c4a84e', food: 0, prod: 0, gold: 0, moveCost: 1, icon: '' },
    TUNDRA: { name: 'Tundra', color: '#7a8a8a', food: 1, prod: 0, gold: 0, moveCost: 1, icon: '' },
    SNOW: { name: 'Snow', color: '#d0dde6', food: 0, prod: 0, gold: 0, moveCost: 2, icon: '' },
    MOUNTAIN: { name: 'Mountain', color: '#3a3a3a', food: 0, prod: 0, gold: 0, moveCost: 99, impassable: true, icon: '🏔️', defense: 0.5 }
};

export const FeatureType = {
    NONE: { name: 'None', food: 0, prod: 0, gold: 0, moveCost: 0, icon: '', defense: 0 },
    FOREST: { name: 'Forest', food: 0, prod: 1, gold: 0, moveCost: 1, icon: '🌲', defense: 0.25 },
    JUNGLE: { name: 'Jungle', food: 1, prod: -1, gold: 0, moveCost: 1, icon: '🌴', defense: 0.25 },
    MARSH: { name: 'Marsh', food: -1, prod: 0, gold: 0, moveCost: 1, icon: '🍄', defense: -0.15 },
    OASIS: { name: 'Oasis', food: 3, prod: 0, gold: 1, moveCost: 0, icon: '🏝️', defense: 0 },
    FLOOD_PLAINS: { name: 'Flood Plains', food: 2, prod: 0, gold: 0, moveCost: 0, icon: '', defense: -0.1 }
};

export const ResourceType = {
    NONE: { name: 'None', food: 0, prod: 0, gold: 0, icon: '', type: 'none' },
    // Strategic
    IRON: { name: 'Iron', food: 0, prod: 2, gold: 0, icon: '⚙️', type: 'strategic' },
    HORSES: { name: 'Horses', food: 0, prod: 1, gold: 0, icon: '🐎', type: 'strategic' },
    COAL: { name: 'Coal', food: 0, prod: 3, gold: 0, icon: '♨️', type: 'strategic' },
    OIL: { name: 'Oil', food: 0, prod: 3, gold: 1, icon: '🛢️', type: 'strategic' },
    NITER: { name: 'Niter', food: 0, prod: 2, gold: 0, icon: '💥', type: 'strategic' },
    // Luxury
    GOLD_RES: { name: 'Gold', food: 0, prod: 0, gold: 3, icon: '💎', type: 'luxury', happiness: 4 },
    GEMS: { name: 'Gems', food: 0, prod: 0, gold: 3, icon: '💍', type: 'luxury', happiness: 4 },
    SILK: { name: 'Silk', food: 0, prod: 0, gold: 3, icon: '🧵', type: 'luxury', happiness: 4 },
    SPICES: { name: 'Spices', food: 1, prod: 0, gold: 2, icon: '🌶️', type: 'luxury', happiness: 4 },
    WINE: { name: 'Wine', food: 0, prod: 0, gold: 2, icon: '🍷', type: 'luxury', happiness: 4 },
    IVORY: { name: 'Ivory', food: 0, prod: 1, gold: 2, icon: '🦣', type: 'luxury', happiness: 4 },
    FURS: { name: 'Furs', food: 0, prod: 0, gold: 2, icon: '🧥', type: 'luxury', happiness: 4 },
    INCENSE: { name: 'Incense', food: 0, prod: 0, gold: 2, icon: '🕯️', type: 'luxury', happiness: 4 },
    MARBLE: { name: 'Marble', food: 0, prod: 1, gold: 1, icon: '🪨', type: 'luxury', happiness: 4 },
    // Bonus
    WHEAT: { name: 'Wheat', food: 2, prod: 0, gold: 0, icon: '🌾', type: 'bonus' },
    CATTLE: { name: 'Cattle', food: 2, prod: 0, gold: 0, icon: '🐄', type: 'bonus' },
    FISH: { name: 'Fish', food: 2, prod: 0, gold: 0, icon: '🐟', type: 'bonus' },
    DEER: { name: 'Deer', food: 1, prod: 1, gold: 0, icon: '🦌', type: 'bonus' },
    STONE: { name: 'Stone', food: 0, prod: 2, gold: 0, icon: '🧱', type: 'bonus' },
    SHEEP: { name: 'Sheep', food: 1, prod: 1, gold: 0, icon: '🐑', type: 'bonus' }
};

export const ImprovementType = {
    FARM: { name: 'Farm', food: 2, prod: 0, gold: 0, icon: '🚜' },
    MINE: { name: 'Mine', food: 0, prod: 2, gold: 0, icon: '⚒️' },
    PASTURE: { name: 'Pasture', food: 1, prod: 1, gold: 0, icon: '🛖' },
    PLANTATION: { name: 'Plantation', food: 0, prod: 0, gold: 3, icon: '🏵️' },
    CAMP: { name: 'Camp', food: 0, prod: 1, gold: 2, icon: '⛺' },
    QUARRY: { name: 'Quarry', food: 0, prod: 3, gold: 0, icon: '🪨' },
    LUMBER_MILL: { name: 'Lumber Mill', food: 0, prod: 2, gold: 0, icon: '🪵' },
    TRADING_POST: { name: 'Trading Post', food: 0, prod: 0, gold: 3, icon: '🏪' },
    ROAD: { name: 'Road', food: 0, prod: 0, gold: 0, icon: '🛤️', moveCost: -0.5 }
};

export class HexTile {
    constructor(q, r, terrain = TerrainType.GRASSLAND) {
        this.q = q;
        this.r = r;
        this.terrain = terrain;
        this.elevation = 0;
        this.moisture = 0;
        this.temperature = 0;
        this.feature = FeatureType.NONE;
        this.resource = ResourceType.NONE;
        this.improvement = null;
        this.owner = null;
        this.city = null;
        this.village = false;
        this.rivers = [];
        this.riverFlow = 0;
        this.hasRoad = false;
        this.discoveredBy = new Set();
        this.visibleTo = new Set();
        this.culturalOwner = null;
        this.cultureLevel = 0;
    }

    getMoveCost() {
        let cost = this.terrain.moveCost || 1;
        cost += (this.feature.moveCost || 0);
        if (this.hasRoad) cost = Math.max(0.5, cost * 0.5);
        return cost;
    }

    getDefenseBonus() {
        return (this.terrain.defense || 0) + (this.feature.defense || 0);
    }

    getYield() {
        const freshWaterBonus = this.rivers.length > 0 ? 1 : 0;
        return {
            food: Math.max(0, this.terrain.food + this.feature.food + this.resource.food + (this.improvement ? this.improvement.food : 0) + freshWaterBonus),
            production: Math.max(0, this.terrain.prod + this.feature.prod + this.resource.prod + (this.improvement ? this.improvement.prod : 0)),
            gold: Math.max(0, this.terrain.gold + this.feature.gold + this.resource.gold + (this.improvement ? this.improvement.gold : 0)),
            science: 0
        };
    }

    getCube() {
        return { x: this.q, y: -this.q - this.r, z: this.r };
    }
}
