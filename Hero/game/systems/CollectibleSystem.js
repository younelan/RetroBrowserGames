class CollectibleSystem {
    constructor(collectibleData) {
        this.collectibles = collectibleData.map(data => 
            new Collectible(data.x, data.y, data.type)
        );
    }

    addCollectible(collectible) {
        this.collectibles.push(collectible);
    }

    update(player) {
        let score = 0;
        this.collectibles.forEach(collectible => {
            if (!collectible.collected) {
                score += collectible.update(player);
            }
        });
        return score;
    }

    render(ctx, cameraX, cameraY) {
        this.collectibles.forEach(collectible => {
            collectible.render(ctx, cameraX, cameraY);
        });
    }
}

window.CollectibleSystem = CollectibleSystem;
