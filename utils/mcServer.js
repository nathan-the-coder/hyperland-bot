const { JavaPingClient } = require('craftping');
require('dotenv').config();

const client = new JavaPingClient();
const CACHE_TTL = 60000;
let cache = { data: null, timestamp: 0 };

async function getServerStatus(forceRefresh = false) {
    const now = Date.now();
    
    if (!forceRefresh && cache.data && (now - cache.timestamp) < CACHE_TTL) {
        return cache.data;
    }

    try {
        const status = await client.ping(process.env.MC_IP, 25565, {
            signal: AbortSignal.timeout(3000)
        });

        const result = {
            online: true,
            players: status.players.online,
            maxPlayers: status.players.max,
            version: status.version.name,
            motd: status.description?.text || '',
            sample: status.players.sample || []
        };

        cache = { data: result, timestamp: now };
        return result;
    } catch (error) {
        const cachedResult = cache.data || {
            online: false,
            players: 0,
            maxPlayers: 100,
            version: 'Unknown',
            motd: '',
            sample: []
        };
        return cachedResult;
    }
}

function clearCache() {
    cache = { data: null, timestamp: 0 };
}

if (global.gc) {
    setInterval(() => {
        global.gc();
    }, 120000);
}

module.exports = { getServerStatus, clearCache };
