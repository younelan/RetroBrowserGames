export const UnitType = {
    // Civilian
    SETTLER: { name: 'Settler', cost: 80, move: 2, strength: 0, actions: ['Settle', 'Skip Turn'], icon: '👤', category: 'civilian' },
    WORKER: { name: 'Worker', cost: 40, move: 2, strength: 0, actions: ['Build Farm', 'Build Mine', 'Build Pasture', 'Harvest Resource', 'Clear Forest', 'Skip Turn'], icon: '👷', category: 'civilian' },

    // Ancient
    WARRIOR: { name: 'Warrior', cost: 40, move: 2, strength: 8, actions: ['Fortify', 'Skip Turn'], icon: '⚔️', category: 'military' },
    SCOUT: { name: 'Scout', cost: 30, move: 3, strength: 5, actions: ['Explore', 'Skip Turn'], icon: '🏃', category: 'military' },
    ARCHER: { name: 'Archer', cost: 60, move: 2, strength: 5, range: 2, actions: ['Fortify', 'Skip Turn'], icon: '🏹', category: 'military' },
    SPEARMAN: { name: 'Spearman', cost: 56, move: 2, strength: 11, actions: ['Fortify', 'Skip Turn'], icon: '🔱', category: 'military' },

    // Classical
    SWORDSMAN: { name: 'Swordsman', cost: 75, move: 2, strength: 14, actions: ['Fortify', 'Skip Turn'], icon: '🗡️', category: 'military', resourceRequired: 'IRON' },
    CATAPULT: { name: 'Catapult', cost: 75, move: 2, strength: 7, range: 2, actions: ['Fortify', 'Skip Turn'], icon: '🚜', category: 'military', techRequired: 'MATHEMATICS' },
    CHARIOT: { name: 'Chariot Archer', cost: 56, move: 4, strength: 6, range: 2, icon: '🐎', category: 'military', resourceRequired: 'HORSES' },

    // Medieval
    KNIGHT: { name: 'Knight', cost: 120, move: 4, strength: 20, icon: '🏇', category: 'military', resourceRequired: 'HORSES' },
    CROSSBOWMAN: { name: 'Crossbowman', cost: 90, move: 2, strength: 13, range: 2, icon: '🎯', category: 'military', techRequired: 'MACHINERY' }
};

export class Unit {
    constructor(type, q, r, owner) {
        this.type = type;
        this.q = q;
        this.r = r;
        this.owner = owner;

        this.health = 100;
        this.movementPoints = type.move;
        this.isFortified = false;
        this.task = 'Ready';

        owner.units.push(this);
    }

    move(targetQ, targetR, cost) {
        if (this.movementPoints < cost) return false;

        this.q = targetQ;
        this.r = targetR;
        this.movementPoints -= cost;
        this.isFortified = false;
        return true;
    }

    resetTurn() {
        this.movementPoints = this.type.move;
        // Keep fortified status unless moved
    }
}
