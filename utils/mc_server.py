import time
from mcstatus import JavaServer
from config import MC_IP, MC_PORT

CACHE_TTL = 60
_cache = {"data": None, "timestamp": 0}


async def get_server_status(force_refresh: bool = False) -> dict:
    now = time.time()

    if not force_refresh and _cache["data"] and (now - _cache["timestamp"]) < CACHE_TTL:
        return _cache["data"]

    try:
        server = JavaServer.lookup(f"{MC_IP}:{MC_PORT}")
        status = server.status()

        result = {
            "online": True,
            "players": status.players.online,
            "max_players": status.players.max,
            "version": status.version.name,
            "motd": status.description,
            "sample": [{"name": p.name, "id": str(p.id)} for p in status.players.sample]
            if status.players.sample
            else [],
        }

        _cache["data"] = result
        _cache["timestamp"] = now
        return result
    except Exception as e:
        print(f"Error pinging server: {e}")
        return _cache["data"] or {
            "online": False,
            "players": 0,
            "max_players": 100,
            "version": "1.21.x",
            "motd": "",
            "sample": [],
        }


def clear_cache():
    _cache["data"] = None
    _cache["timestamp"] = 0
