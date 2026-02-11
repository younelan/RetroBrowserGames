export const UnitType = {
    // Civilian
    SETTLER: { name: 'Settler', cost: 80, move: 2, strength: 0, actions: ['Settle', 'Skip Turn'], icon: '👤', category: 'civilian', era: 'ancient' },
    WORKER: { name: 'Worker', cost: 40, move: 2, strength: 0, actions: ['Build Farm', 'Build Mine', 'Build Pasture', 'Build Road', 'Build Trading Post', 'Build Lumber Mill', 'Harvest Resource', 'Clear Forest', 'Skip Turn'], icon: '👷', category: 'civilian', era: 'ancient' },
    GREAT_GENERAL: { name: 'Great General', cost: 0, move: 2, strength: 0, actions: ['Citadel', 'Skip Turn'], icon: '⭐', category: 'great_person', era: 'ancient' },
    GREAT_SCIENTIST: { name: 'Great Scientist', cost: 0, move: 2, strength: 0, actions: ['Academy', 'Eureka', 'Skip Turn'], icon: '🧪', category: 'great_person', era: 'ancient' },
    GREAT_MERCHANT: { name: 'Great Merchant', cost: 0, move: 2, strength: 0, actions: ['Custom House', 'Trade Mission', 'Skip Turn'], icon: '💼', category: 'great_person', era: 'ancient' },
    GREAT_ENGINEER: { name: 'Great Engineer', cost: 0, move: 2, strength: 0, actions: ['Manufactory', 'Rush Wonder', 'Skip Turn'], icon: '🔧', category: 'great_person', era: 'ancient' },

    // Ancient Military
    WARRIOR: { name: 'Warrior', cost: 40, move: 2, strength: 8, actions: ['Fortify', 'Skip Turn'], icon: '⚔️', category: 'military', era: 'ancient', class: 'melee' },
    SCOUT: { name: 'Scout', cost: 25, move: 3, strength: 5, actions: ['Explore', 'Skip Turn'], icon: '🏃', category: 'military', era: 'ancient', class: 'recon' },
    ARCHER: { name: 'Archer', cost: 40, move: 2, strength: 5, rangedStrength: 7, range: 2, actions: ['Fortify', 'Skip Turn'], icon: '🏹', category: 'military', era: 'ancient', class: 'ranged' },
    SPEARMAN: { name: 'Spearman', cost: 56, move: 2, strength: 11, actions: ['Fortify', 'Skip Turn'], icon: '🔱', category: 'military', era: 'ancient', class: 'anti-cavalry',
        bonus: { vs: 'mounted', amount: 0.5 } },

    // Classical Military
    SWORDSMAN: { name: 'Swordsman', cost: 75, move: 2, strength: 14, actions: ['Fortify', 'Skip Turn'], icon: '🗡️', category: 'military', era: 'classical', class: 'melee', resourceRequired: 'IRON' },
    CATAPULT: { name: 'Catapult', cost: 75, move: 2, strength: 7, rangedStrength: 12, range: 2, actions: ['Fortify', 'Skip Turn'], icon: '🪨', category: 'military', era: 'classical', class: 'siege',
        bonus: { vs: 'city', amount: 1.0 } },
    CHARIOT: { name: 'Chariot Archer', cost: 56, move: 4, strength: 6, rangedStrength: 8, range: 2, icon: '🐎', category: 'military', era: 'classical', class: 'mounted', resourceRequired: 'HORSES',
        actions: ['Fortify', 'Skip Turn'] },
    HORSEMAN: { name: 'Horseman', cost: 75, move: 4, strength: 12, actions: ['Fortify', 'Skip Turn'], icon: '🏇', category: 'military', era: 'classical', class: 'mounted', resourceRequired: 'HORSES' },

    // Medieval Military
    KNIGHT: { name: 'Knight', cost: 120, move: 4, strength: 20, icon: '🐴', category: 'military', era: 'medieval', class: 'mounted', resourceRequired: 'HORSES',
        actions: ['Fortify', 'Skip Turn'] },
    CROSSBOWMAN: { name: 'Crossbowman', cost: 90, move: 2, strength: 13, rangedStrength: 18, range: 2, icon: '🎯', category: 'military', era: 'medieval', class: 'ranged',
        actions: ['Fortify', 'Skip Turn'] },
    LONGSWORDSMAN: { name: 'Longswordsman', cost: 100, move: 2, strength: 21, actions: ['Fortify', 'Skip Turn'], icon: '⚔️', category: 'military', era: 'medieval', class: 'melee', resourceRequired: 'IRON' },
    PIKEMAN: { name: 'Pikeman', cost: 90, move: 2, strength: 16, actions: ['Fortify', 'Skip Turn'], icon: '🔱', category: 'military', era: 'medieval', class: 'anti-cavalry',
        bonus: { vs: 'mounted', amount: 0.5 } },
    TREBUCHET: { name: 'Trebuchet', cost: 120, move: 2, strength: 12, rangedStrength: 20, range: 2, actions: ['Fortify', 'Skip Turn'], icon: '🏗️', category: 'military', era: 'medieval', class: 'siege',
        bonus: { vs: 'city', amount: 1.0 } },

    // Renaissance Military
    MUSKETMAN: { name: 'Musketman', cost: 150, move: 2, strength: 28, actions: ['Fortify', 'Skip Turn'], icon: '🔫', category: 'military', era: 'renaissance', class: 'melee', techRequired: 'GUNPOWDER' },
    CANNON: { name: 'Cannon', cost: 150, move: 2, strength: 14, rangedStrength: 26, range: 2, actions: ['Fortify', 'Skip Turn'], icon: '💣', category: 'military', era: 'renaissance', class: 'siege', techRequired: 'CHEMISTRY',
        bonus: { vs: 'city', amount: 1.0 } },
    LANCER: { name: 'Lancer', cost: 140, move: 4, strength: 25, actions: ['Fortify', 'Skip Turn'], icon: '🏇', category: 'military', era: 'renaissance', class: 'mounted', resourceRequired: 'HORSES', techRequired: 'METALLURGY' },

    // Industrial Military
    RIFLEMAN: { name: 'Rifleman', cost: 200, move: 2, strength: 35, actions: ['Fortify', 'Skip Turn'], icon: '🎖️', category: 'military', era: 'industrial', class: 'melee', techRequired: 'RIFLING' },
    CAVALRY: { name: 'Cavalry', cost: 200, move: 5, strength: 34, actions: ['Fortify', 'Skip Turn'], icon: '🐎', category: 'military', era: 'industrial', class: 'mounted', resourceRequired: 'HORSES', techRequired: 'MILITARY_SCIENCE' },
    ARTILLERY: { name: 'Artillery', cost: 200, move: 2, strength: 16, rangedStrength: 36, range: 3, actions: ['Fortify', 'Skip Turn'], icon: '🎯', category: 'military', era: 'industrial', class: 'siege', techRequired: 'DYNAMITE',
        bonus: { vs: 'city', amount: 1.0 } }
};

// Promotion tree
export const PromotionType = {
    // Melee
    SHOCK: { name: 'Shock I', description: '+15% open terrain combat', combatBonus: 0.15, condition: 'open', class: ['melee'] },
    SHOCK_II: { name: 'Shock II', description: '+15% open terrain combat', combatBonus: 0.15, condition: 'open', requires: 'SHOCK', class: ['melee'] },
    DRILL: { name: 'Drill I', description: '+15% rough terrain combat', combatBonus: 0.15, condition: 'rough', class: ['melee'] },
    DRILL_II: { name: 'Drill II', description: '+15% rough terrain combat', combatBonus: 0.15, condition: 'rough', requires: 'DRILL', class: ['melee'] },
    COVER: { name: 'Cover I', description: '+25% vs ranged attacks', combatBonus: 0.25, condition: 'vs_ranged', class: ['melee', 'anti-cavalry'] },
    MARCH: { name: 'March', description: 'Heal every turn even if moving', healOnMove: true, requires: 'SHOCK_II', class: ['melee', 'mounted'] },
    BLITZ: { name: 'Blitz', description: 'Can attack twice per turn', extraAttack: true, requires: 'SHOCK_II', class: ['melee', 'mounted'] },
    // Ranged
    ACCURACY: { name: 'Accuracy I', description: '+15% open terrain ranged', rangedBonus: 0.15, condition: 'open', class: ['ranged'] },
    BARRAGE: { name: 'Barrage I', description: '+15% rough terrain ranged', rangedBonus: 0.15, condition: 'rough', class: ['ranged'] },
    RANGE: { name: 'Range', description: '+1 Range', rangeBonus: 1, requires: 'ACCURACY', class: ['ranged'] },
    LOGISTICS: { name: 'Logistics', description: 'Can attack twice per turn', extraAttack: true, requires: 'ACCURACY', class: ['ranged'] },
    // Mounted
    CHARGE: { name: 'Charge', description: '+33% vs wounded units', combatBonus: 0.33, condition: 'vs_wounded', class: ['mounted'] },
    MOBILITY: { name: 'Mobility', description: '+1 Movement', moveBonus: 1, class: ['mounted'] },
    // General
    MEDIC: { name: 'Medic', description: 'Adjacent units heal +5 per turn', healAura: 5, class: ['melee', 'anti-cavalry'] },
    SENTRY: { name: 'Sentry', description: '+1 Visibility Range', visionBonus: 1, class: ['recon', 'ranged'] }
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
        // Default task: scouts auto-explore, settlers remain ready
        this.task = (type.name === 'Scout') ? 'Explore' : 'Ready';
        this.workRemaining = 0;
        this.workCallback = null;

        // Promotion system
        this.experience = 0;
        this.level = 0;
        this.promotions = [];
        this.attacksThisTurn = 0;
        this.maxAttacks = 1;

        // Movement animation
        this.animX = null;
        this.animY = null;
        this.isMoving = false;

        owner.units.push(this);
    }

    get xpNeeded() {
        return 10 + (this.level * 10);
    }

    canPromote() {
        return this.experience >= this.xpNeeded && this.type.category === 'military';
    }

    getAvailablePromotions() {
        const unitClass = this.type.class;
        return Object.entries(PromotionType)
            .filter(([id, promo]) => {
                if (this.promotions.includes(id)) return false;
                if (!promo.class.includes(unitClass)) return false;
                if (promo.requires && !this.promotions.includes(promo.requires)) return false;
                return true;
            })
            .map(([id, promo]) => ({ id, ...promo }));
    }

    promote(promotionId) {
        if (!this.canPromote()) return false;
        const promo = PromotionType[promotionId];
        if (!promo) return false;

        this.promotions.push(promotionId);
        this.experience -= this.xpNeeded;
        this.level++;
        this.health = 100; // Full heal on promotion

        // Apply permanent bonuses
        if (promo.moveBonus) this.movementPoints += promo.moveBonus;
        if (promo.extraAttack) this.maxAttacks = 2;

        return true;
    }

    gainExperience(amount) {
        if (this.type.category !== 'military') return;
        this.experience += amount;
    }

    getCombatModifiers(defender, defenderTile) {
        let bonus = 0;
        for (const promoId of this.promotions) {
            const promo = PromotionType[promoId];
            if (!promo) continue;

            if (promo.combatBonus) {
                if (promo.condition === 'open' && !defenderTile?.feature?.defense) bonus += promo.combatBonus;
                if (promo.condition === 'rough' && defenderTile?.feature?.defense > 0) bonus += promo.combatBonus;
                if (promo.condition === 'vs_ranged' && defender?.type?.range) bonus += promo.combatBonus;
                if (promo.condition === 'vs_wounded' && defender?.health < 100) bonus += promo.combatBonus;
            }
        }

        // Unit type bonus
        if (this.type.bonus && defender) {
            if (this.type.bonus.vs === 'mounted' && defender.type.class === 'mounted') bonus += this.type.bonus.amount;
            if (this.type.bonus.vs === 'city' && defender.isCity) bonus += this.type.bonus.amount;
        }

        return bonus;
    }

    move(targetQ, targetR, cost) {
        if (this.movementPoints < cost) return false;

        this.q = targetQ;
        this.r = targetR;
        this.movementPoints -= cost;
        this.isFortified = false;
        this.task = 'Ready';
        return true;
    }

    resetTurn() {
        this.movementPoints = this.type.move;
        this.attacksThisTurn = 0;

        // Apply promotion bonuses
        for (const promoId of this.promotions) {
            const promo = PromotionType[promoId];
            if (promo?.moveBonus) this.movementPoints += promo.moveBonus;
        }

        // Healing
        if (this.health < 100) {
            let healAmount = 0;
            if (this.isFortified) healAmount = 15;
            else if (this.task === 'Sentry') healAmount = 10;
            else healAmount = 5;

            // Check for medic aura from nearby friendly units
            if (window.game) {
                const nearby = this.owner.units.filter(u =>
                    u !== this && window.game.worldMap.getDistance(u.q, u.r, this.q, this.r) <= 1
                );
                for (const u of nearby) {
                    if (u.promotions.includes('MEDIC')) healAmount += 5;
                }
            }

            // Heal in friendly territory
            if (window.game) {
                const tile = window.game.worldMap.getTile(this.q, this.r);
                if (tile?.owner === this.owner) healAmount += 5;
                const inCity = this.owner.cities.some(c => c.q === this.q && c.r === this.r);
                if (inCity) healAmount += 10;
            }

            this.health = Math.min(100, this.health + healAmount);
        }

        // Worker tasks
        if (this.workRemaining > 0) {
            this.workRemaining--;
            if (this.workRemaining <= 0 && this.workCallback) {
                this.workCallback();
                this.workCallback = null;
                this.task = 'Ready';
            }
        }
    }
}
