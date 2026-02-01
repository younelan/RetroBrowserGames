export class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.minZoom = 0.2;
        this.maxZoom = 3;

        this.hexSize = 40; // Base size of a hex

        this.isPanning = false;
        this.lastMousePos = { x: 0, y: 0 };
    }

    // Convert axial q,r to screen x,y
    hexToScreen(q, r) {
        const x = this.hexSize * (3 / 2 * q);
        const y = this.hexSize * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
        return {
            x: (x * this.zoom) + this.x,
            y: (y * this.zoom) + this.y
        };
    }

    // Convert screen x,y to axial q,r (approximate)
    screenToHex(screenX, screenY) {
        const lx = (screenX - this.x) / this.zoom;
        const ly = (screenY - this.y) / this.zoom;

        const q = (2 / 3 * lx) / this.hexSize;
        const r = (-1 / 3 * lx + Math.sqrt(3) / 3 * ly) / this.hexSize;

        return this.hexRound(q, r);
    }

    hexRound(q, r) {
        let x = q;
        let z = r;
        let y = -x - z;

        let rx = Math.round(x);
        let ry = Math.round(y);
        let rz = Math.round(z);

        const x_diff = Math.abs(rx - x);
        const y_diff = Math.abs(ry - y);
        const z_diff = Math.abs(rz - z);

        if (x_diff > y_diff && x_diff > z_diff) {
            rx = -ry - rz;
        } else if (y_diff > z_diff) {
            ry = -rx - rz;
        } else {
            rz = -rx - ry;
        }

        return { q: rx, r: rz };
    }

    clamp(worldWidth, worldHeight) {
        const mapW = worldWidth * this.hexSize * 1.5 * this.zoom;
        const mapH = worldHeight * this.hexSize * Math.sqrt(3) * this.zoom;
        const margin = 100;

        const limitX = Math.max(0, mapW - this.canvas.width);
        this.x = Math.max(-limitX - margin, Math.min(margin, this.x));

        const limitY = Math.max(0, mapH - this.canvas.height);
        this.y = Math.max(-limitY - margin, Math.min(margin, this.y));
    }

    apply(ctx) {
        // Transformations are handled in hexToScreen
    }
}
