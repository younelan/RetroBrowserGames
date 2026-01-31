export const Utils = {
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    }
};
