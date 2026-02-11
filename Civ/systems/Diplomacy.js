export const DiplomaticStatus = {
    NEUTRAL: 'neutral',
    FRIENDLY: 'friendly',
    HOSTILE: 'hostile',
    WAR: 'war',
    PEACE: 'peace',
    ALLIANCE: 'alliance'
};

export const DealType = {
    PEACE_TREATY: { name: 'Peace Treaty', icon: '🕊️' },
    OPEN_BORDERS: { name: 'Open Borders', icon: '🚪', duration: 30 },
    ALLIANCE: { name: 'Defensive Alliance', icon: '🤝', duration: 50 },
    TRADE_GOLD: { name: 'Gold Trade', icon: '💰' },
    TRADE_LUXURY: { name: 'Luxury Trade', icon: '💎', duration: 30 },
    DECLARE_WAR: { name: 'Declaration of War', icon: '⚔️' },
    DEMAND_TRIBUTE: { name: 'Demand Tribute', icon: '👊' }
};

export class DiplomacySystem {
    constructor() {
        this.relationships = new Map(); // "playerId1-playerId2" -> relationship object
        this.deals = []; // Active deals
        this.warWeariness = new Map(); // playerId -> warWeariness
    }

    getRelationship(player1Id, player2Id) {
        const key = this.getKey(player1Id, player2Id);
        if (!this.relationships.has(key)) {
            this.relationships.set(key, {
                status: DiplomaticStatus.NEUTRAL,
                opinion: 0,
                turnsAtWar: 0,
                turnsKnown: 0,
                openBorders: false,
                alliance: false,
                denounced: false,
                tradingLuxuries: []
            });
        }
        return this.relationships.get(key);
    }

    getKey(id1, id2) {
        return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
    }

    declareWar(attacker, defender) {
        const rel = this.getRelationship(attacker.id, defender.id);
        if (rel.status === DiplomaticStatus.WAR) return false;

        rel.status = DiplomaticStatus.WAR;
        rel.turnsAtWar = 0;
        rel.openBorders = false;
        rel.alliance = false;
        rel.opinion -= 30;

        // Cancel all active deals between them
        this.deals = this.deals.filter(d =>
            !(d.parties.includes(attacker.id) && d.parties.includes(defender.id))
        );

        // Other players take notice
        if (window.game) {
            window.game.players.forEach(p => {
                if (p.id !== attacker.id && p.id !== defender.id && p.metPlayers.has(attacker.id)) {
                    const rel2 = this.getRelationship(p.id, attacker.id);
                    rel2.opinion -= 5; // Warmonger penalty
                }
            });
        }

        return true;
    }

    makePeace(player1, player2) {
        const rel = this.getRelationship(player1.id, player2.id);
        if (rel.status !== DiplomaticStatus.WAR) return false;
        if (rel.turnsAtWar < 10) return false; // Minimum war duration

        rel.status = DiplomaticStatus.PEACE;
        rel.turnsAtWar = 0;

        this.deals.push({
            type: 'PEACE_TREATY',
            parties: [player1.id, player2.id],
            turnsRemaining: 10 // 10-turn peace treaty
        });

        return true;
    }

    canDeclareWar(player1Id, player2Id) {
        const rel = this.getRelationship(player1Id, player2Id);
        if (rel.status === DiplomaticStatus.WAR) return false;
        // Check for peace treaty
        const peaceTreaty = this.deals.find(d =>
            d.type === 'PEACE_TREATY' &&
            d.parties.includes(player1Id) && d.parties.includes(player2Id) &&
            d.turnsRemaining > 0
        );
        return !peaceTreaty;
    }

    proposeDeal(fromPlayer, toPlayer, deal) {
        const rel = this.getRelationship(fromPlayer.id, toPlayer.id);

        switch (deal.type) {
            case 'OPEN_BORDERS':
                rel.openBorders = true;
                rel.opinion += 5;
                this.deals.push({
                    type: 'OPEN_BORDERS',
                    parties: [fromPlayer.id, toPlayer.id],
                    turnsRemaining: 30
                });
                return true;

            case 'ALLIANCE':
                rel.alliance = true;
                rel.status = DiplomaticStatus.ALLIANCE;
                rel.opinion += 15;
                this.deals.push({
                    type: 'ALLIANCE',
                    parties: [fromPlayer.id, toPlayer.id],
                    turnsRemaining: 50
                });
                return true;

            case 'TRADE_LUXURY':
                rel.tradingLuxuries.push(deal.resource);
                rel.opinion += 5;
                this.deals.push({
                    type: 'TRADE_LUXURY',
                    parties: [fromPlayer.id, toPlayer.id],
                    resource: deal.resource,
                    turnsRemaining: 30
                });
                return true;

            case 'TRADE_GOLD':
                if (fromPlayer.gold >= deal.amount) {
                    fromPlayer.gold -= deal.amount;
                    toPlayer.gold += deal.amount;
                    rel.opinion += Math.min(10, deal.amount / 10);
                    return true;
                }
                return false;
        }
        return false;
    }

    isAtWar(player1Id, player2Id) {
        return this.getRelationship(player1Id, player2Id).status === DiplomaticStatus.WAR;
    }

    hasOpenBorders(player1Id, player2Id) {
        return this.getRelationship(player1Id, player2Id).openBorders;
    }

    isAllied(player1Id, player2Id) {
        return this.getRelationship(player1Id, player2Id).alliance;
    }

    getOpinion(fromId, toId) {
        return this.getRelationship(fromId, toId).opinion;
    }

    updateTurn() {
        // Update deals
        this.deals = this.deals.filter(deal => {
            if (deal.turnsRemaining !== undefined) {
                deal.turnsRemaining--;
                if (deal.turnsRemaining <= 0) {
                    // Deal expired
                    const rel = this.getRelationship(deal.parties[0], deal.parties[1]);
                    if (deal.type === 'OPEN_BORDERS') rel.openBorders = false;
                    if (deal.type === 'ALLIANCE') {
                        rel.alliance = false;
                        if (rel.status === DiplomaticStatus.ALLIANCE) rel.status = DiplomaticStatus.FRIENDLY;
                    }
                    return false;
                }
            }
            return true;
        });

        // Update war-related stuff
        for (const [key, rel] of this.relationships) {
            rel.turnsKnown++;
            if (rel.status === DiplomaticStatus.WAR) {
                rel.turnsAtWar++;
            }
            // Natural opinion drift toward 0
            if (rel.opinion > 0) rel.opinion -= 0.5;
            if (rel.opinion < 0) rel.opinion += 0.25;
        }
    }

    // AI decision making
    shouldDeclareWar(aiPlayer, targetPlayer) {
        const rel = this.getRelationship(aiPlayer.id, targetPlayer.id);
        if (!this.canDeclareWar(aiPlayer.id, targetPlayer.id)) return false;

        const militaryRatio = this.getMilitaryStrength(aiPlayer) / Math.max(1, this.getMilitaryStrength(targetPlayer));
        const opinionFactor = rel.opinion < -20 ? 1 : 0;

        return militaryRatio > 1.8 && opinionFactor > 0;
    }

    shouldAcceptPeace(aiPlayer, proposingPlayer) {
        const rel = this.getRelationship(aiPlayer.id, proposingPlayer.id);
        const militaryRatio = this.getMilitaryStrength(aiPlayer) / Math.max(1, this.getMilitaryStrength(proposingPlayer));

        if (rel.turnsAtWar < 10) return false;
        if (militaryRatio < 0.8) return true; // Losing
        if (rel.turnsAtWar > 30) return true; // Long war
        return Math.random() < 0.3; // Random chance
    }

    getMilitaryStrength(player) {
        return player.units.reduce((sum, u) => sum + (u.type.strength || 0), 0);
    }
}
