
export class Translator {
    constructor() {
        this.translations = {
        };
    }

    translate(key) {
        return this.translations[key] || key;
    }
}
