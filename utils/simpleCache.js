class SimpleCache {
    constructor(ttlMinutes = 5) {
        this.cache = new Map();
        this.ttl = ttlMinutes * 60 * 1000;
    }

    set(key, value) {
        this.cache.set(key, {
            value: value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }

        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    has(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return false;
        }

        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    clear() {
        this.cache.clear();
    }

    delete(key) {
        this.cache.delete(key);
    }

    size() {
        return this.cache.size;
    }

    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }

    getStats() {
        return {
            size: this.cache.size,
            ttl: this.ttl / 60000 + ' minutes'
        };
    }
}

const autocompleteCache = new SimpleCache(5);
const reportListCache = new SimpleCache(2);   

setInterval(() => {
    autocompleteCache.cleanup();
    reportListCache.cleanup();
}, 10 * 60 * 1000);

module.exports = {
    autocompleteCache,
    reportListCache
};

