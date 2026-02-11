export const GovernmentType = {
    CHIEFDOM: {
        name: 'Chiefdom',
        description: 'A basic tribal government',
        icon: '🏕️',
        bonuses: {},
        penalties: {},
        era: 'ancient',
        slotCount: 1
    },
    AUTOCRACY: {
        name: 'Autocracy',
        description: 'Rule by a single leader with absolute power',
        icon: '👑',
        bonuses: { production: 0.10, unitMaintenance: -0.5 },
        penalties: { happiness: -1 },
        era: 'ancient',
        tech: 'POTTERY',
        slotCount: 2
    },
    OLIGARCHY: {
        name: 'Oligarchy',
        description: 'Rule by a small group of powerful leaders',
        icon: '⚔️',
        bonuses: { militaryXP: 0.25, cityDefense: 0.25 },
        penalties: {},
        era: 'classical',
        tech: 'PHILOSOPHY',
        slotCount: 2
    },
    CLASSICAL_REPUBLIC: {
        name: 'Classical Republic',
        description: 'Government by elected representatives',
        icon: '🏛️',
        bonuses: { gold: 0.15, happiness: 1, greatPersonRate: 0.15 },
        penalties: { warWeariness: 0.25 },
        era: 'classical',
        tech: 'DRAMA',
        slotCount: 3
    },
    MONARCHY: {
        name: 'Monarchy',
        description: 'Hereditary rule by a royal family',
        icon: '🏰',
        bonuses: { production: 0.10, gold: 0.10, diplomaticBonus: 10 },
        penalties: {},
        era: 'medieval',
        tech: 'CIVIL_SERVICE',
        slotCount: 3
    },
    MERCHANT_REPUBLIC: {
        name: 'Merchant Republic',
        description: 'Government focused on commerce and trade',
        icon: '🏪',
        bonuses: { gold: 0.25, tradeRoutes: 2, purchaseDiscount: 0.15 },
        penalties: { militaryStrength: -0.05 },
        era: 'renaissance',
        tech: 'ECONOMICS',
        slotCount: 4
    },
    THEOCRACY: {
        name: 'Theocracy',
        description: 'Government based on religious authority',
        icon: '⛪',
        bonuses: { happiness: 3, culture: 0.15, faith: 0.25 },
        penalties: { science: -0.05 },
        era: 'renaissance',
        tech: 'BANKING',
        slotCount: 3
    },
    DEMOCRACY: {
        name: 'Democracy',
        description: 'Government by the people',
        icon: '🗳️',
        bonuses: { science: 0.15, gold: 0.15, happiness: 2, greatPersonRate: 0.25 },
        penalties: { warWeariness: 0.5, warDeclareOpinion: -20 },
        era: 'industrial',
        tech: 'SCIENTIFIC_THEORY',
        slotCount: 5
    },
    COMMUNISM: {
        name: 'Communism',
        description: 'Collective ownership of production',
        icon: '🔨',
        bonuses: { production: 0.25, science: 0.10, spyBonus: 0.25 },
        penalties: { happiness: -2, gold: -0.10 },
        era: 'industrial',
        tech: 'INDUSTRIALIZATION',
        slotCount: 5
    },
    FASCISM: {
        name: 'Fascism',
        description: 'Authoritarian ultranationalist government',
        icon: '🦅',
        bonuses: { production: 0.20, militaryStrength: 0.15, unitMaintenance: -0.5 },
        penalties: { happiness: -3, diplomaticBonus: -20 },
        era: 'industrial',
        tech: 'MILITARY_SCIENCE',
        slotCount: 4
    }
};

export const PolicyType = {
    // Military policies
    DISCIPLINE: { name: 'Discipline', description: '+15% combat strength for melee units', category: 'military', effect: { meleeCombat: 0.15 } },
    SURVEY: { name: 'Survey', description: '+1 Movement for Scouts', category: 'military', effect: { scoutMove: 1 } },
    CONSCRIPTION: { name: 'Conscription', description: '-1 Gold unit maintenance', category: 'military', effect: { unitMaintenance: -1 } },
    PROFESSIONAL_ARMY: { name: 'Professional Army', description: '50% less upgrade cost', category: 'military', effect: { upgradeCost: -0.5 } },

    // Economic policies
    GOD_KING: { name: 'God King', description: '+1 Gold, +1 Culture, +1 Science in Capital', category: 'economic', effect: { capitalGold: 1, capitalCulture: 1, capitalScience: 1 } },
    URBAN_PLANNING: { name: 'Urban Planning', description: '+1 Production in all cities', category: 'economic', effect: { cityProduction: 1 } },
    CARAVANSARIES: { name: 'Caravansaries', description: '+2 Gold from trade routes', category: 'economic', effect: { tradeGold: 2 } },
    TRADE_ROUTES: { name: 'Trade Routes', description: '+1 Gold from Markets', category: 'economic', effect: { marketGold: 1 } },

    // Diplomatic policies
    CHARISMATIC_LEADER: { name: 'Charismatic Leader', description: '+2 Influence per turn with city-states', category: 'diplomatic', effect: { cityStateInfluence: 2 } },
    DIPLOMATIC_LEAGUE: { name: 'Diplomatic League', description: '+50% alliance duration', category: 'diplomatic', effect: { allianceDuration: 0.5 } },

    // Cultural policies
    INSPIRATION: { name: 'Inspiration', description: '+15% Culture', category: 'cultural', effect: { culture: 0.15 } },
    LITERARY_TRADITION: { name: 'Literary Tradition', description: '+2 Great Writer points', category: 'cultural', effect: { greatWriter: 2 } }
};

export class GovernmentSystem {
    constructor(player) {
        this.player = player;
        this.currentGovernment = GovernmentType.CHIEFDOM;
        this.activePolicies = [];
        this.availableGovernments = [GovernmentType.CHIEFDOM];
        this.anarchyTurns = 0;
    }

    getAvailableGovernments() {
        return Object.values(GovernmentType).filter(gov => {
            if (gov === this.currentGovernment) return false;
            if (!gov.tech) return true;
            return this.player.unlockedTechs.has(gov.tech);
        });
    }

    changeGovernment(newGov) {
        if (newGov === this.currentGovernment) return false;

        this.currentGovernment = newGov;
        this.anarchyTurns = 1; // 1 turn of anarchy when switching
        this.activePolicies = []; // Reset policies on government change
        return true;
    }

    canAdoptPolicy(policy) {
        if (this.activePolicies.includes(policy)) return false;
        return this.activePolicies.length < this.currentGovernment.slotCount;
    }

    adoptPolicy(policy) {
        if (!this.canAdoptPolicy(policy)) return false;
        this.activePolicies.push(policy);
        return true;
    }

    removePolicy(policy) {
        this.activePolicies = this.activePolicies.filter(p => p !== policy);
    }

    getBonuses() {
        const bonuses = { ...this.currentGovernment.bonuses };

        // Add policy effects
        this.activePolicies.forEach(policy => {
            if (policy.effect) {
                Object.entries(policy.effect).forEach(([key, value]) => {
                    bonuses[key] = (bonuses[key] || 0) + value;
                });
            }
        });

        return bonuses;
    }

    isInAnarchy() {
        return this.anarchyTurns > 0;
    }

    updateTurn() {
        if (this.anarchyTurns > 0) {
            this.anarchyTurns--;
        }
    }
}
