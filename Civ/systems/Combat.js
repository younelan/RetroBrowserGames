export class CombatSystem {
    static resolveCombat(attacker, defender, attackerTile, defenderTile) {
        // Base strengths
        let attackerStrength = attacker.type.strength * (attacker.health / 100);
        let defenderStrength = defender.type.strength * (defender.health / 100);

        // Terrain modifiers
        if (defenderTile.terrain.name === 'Mountain' || defenderTile.feature.name === 'Forest') {
            defenderStrength *= 1.25;
        }

        if (defender.isFortified) {
            defenderStrength *= 1.5;
        }

        // Damage calculation (Simplified)
        const totalStrength = attackerStrength + defenderStrength;
        const attackerDamage = (defenderStrength / totalStrength) * 30;
        const defenderDamage = (attackerStrength / totalStrength) * 30;

        attacker.health -= attackerDamage;
        defender.health -= defenderDamage;

        return {
            attackerHealth: attacker.health,
            defenderHealth: defender.health,
            killed: {
                attacker: attacker.health <= 0,
                defender: defender.health <= 0
            }
        };
    }
}
