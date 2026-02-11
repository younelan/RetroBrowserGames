export class CombatSystem {
    static resolveCombat(attacker, defender, attackerTile, defenderTile) {
        let attackerStrength = attacker.type.strength * (attacker.health / 100);
        let defenderStrength = defender.type.strength * (defender.health / 100);

        // Embarked units suffer -75% combat strength
        if (attacker.isEmbarked) attackerStrength *= 0.25;
        if (defender.isEmbarked) defenderStrength *= 0.25;

        // Use ranged strength for ranged units if applicable
        const isRangedAttack = attacker.type.rangedStrength && attacker.type.range;
        if (isRangedAttack) {
            attackerStrength = attacker.type.rangedStrength * (attacker.health / 100);
        }

        // Terrain defense bonus
        if (defenderTile) {
            defenderStrength *= (1 + (defenderTile.terrain.defense || 0));
            defenderStrength *= (1 + (defenderTile.feature?.defense || 0));
        }

        // Fortification bonus
        if (defender.isFortified) {
            defenderStrength *= 1.5;
        }

        // City defense
        if (defender.isCity) {
            defenderStrength = defender.getCityDefense() * (defender.cityHP / defender.maxCityHP);
        }

        // Promotion bonuses
        if (attacker.getCombatModifiers) {
            attackerStrength *= (1 + attacker.getCombatModifiers(defender, defenderTile));
        }
        if (defender.getCombatModifiers) {
            defenderStrength *= (1 + defender.getCombatModifiers(attacker, attackerTile));
        }

        // Government military bonuses
        if (attacker.owner?.government) {
            const bonuses = attacker.owner.government.getBonuses();
            if (bonuses.militaryStrength) attackerStrength *= (1 + bonuses.militaryStrength);
            if (bonuses.meleeCombat && !attacker.type.range) attackerStrength *= (1 + bonuses.meleeCombat);
        }
        if (defender.owner?.government) {
            const bonuses = defender.owner.government.getBonuses();
            if (bonuses.militaryStrength) defenderStrength *= (1 + bonuses.militaryStrength);
            if (bonuses.cityDefense && defender.isCity) defenderStrength *= (1 + bonuses.cityDefense);
        }

        // Great General aura (+15% to nearby friendly units)
        if (attacker.owner) {
            const hasGeneral = attacker.owner.units.some(u =>
                u.type.name === 'Great General' &&
                window.game?.worldMap?.getDistance(u.q, u.r, attacker.q, attacker.r) <= 2
            );
            if (hasGeneral) attackerStrength *= 1.15;
        }
        if (defender.owner && !defender.isCity) {
            const hasGeneral = defender.owner.units.some(u =>
                u.type.name === 'Great General' &&
                window.game?.worldMap?.getDistance(u.q, u.r, defender.q, defender.r) <= 2
            );
            if (hasGeneral) defenderStrength *= 1.15;
        }

        // Damage calculation
        const totalStrength = attackerStrength + defenderStrength;
        const attackerDamage = Math.max(5, (defenderStrength / totalStrength) * 30);
        const defenderDamage = Math.max(5, (attackerStrength / totalStrength) * 30);

        // Ranged attacks: attacker takes no damage (unless melee)
        if (isRangedAttack) {
            if (defender.isCity) {
                defender.cityHP -= defenderDamage * 3;
            } else {
                defender.health -= defenderDamage;
            }
        } else {
            attacker.health -= attackerDamage;
            if (defender.isCity) {
                defender.cityHP -= defenderDamage * 2;
            } else {
                defender.health -= defenderDamage;
            }
        }

        // Experience gain
        const xpGain = defender.isCity ? 8 : 5;
        if (attacker.gainExperience) attacker.gainExperience(xpGain);
        if (defender.gainExperience) defender.gainExperience(Math.floor(xpGain * 0.7));

        // Great General points
        if (attacker.owner) {
            attacker.owner.greatGeneralPoints = (attacker.owner.greatGeneralPoints || 0) + 2;
        }

        const result = {
            attackerDamage: Math.round(attackerDamage),
            defenderDamage: Math.round(defenderDamage),
            attackerHealth: attacker.health,
            defenderHealth: defender.isCity ? defender.cityHP : defender.health,
            killed: {
                attacker: !isRangedAttack && attacker.health <= 0,
                defender: defender.isCity ? defender.cityHP <= 0 : defender.health <= 0
            },
            wasRanged: isRangedAttack
        };

        // Combat animation data
        result.combat = {
            attackerQ: attacker.q, attackerR: attacker.r,
            defenderQ: defender.q || defender.q, defenderR: defender.r || defender.r,
            isRanged: isRangedAttack
        };

        return result;
    }

    static canAttack(attacker, targetQ, targetR) {
        if (!attacker || attacker.type.category !== 'military') return false;
        if (attacker.attacksThisTurn >= attacker.maxAttacks) return false;
        if (attacker.movementPoints <= 0 && !attacker.type.range) return false;

        const dist = window.game?.worldMap?.getDistance(attacker.q, attacker.r, targetQ, targetR) || 0;

        if (attacker.type.range) {
            return dist <= attacker.type.range + (attacker.promotions?.includes('RANGE') ? 1 : 0);
        }
        return dist <= 1;
    }
}
