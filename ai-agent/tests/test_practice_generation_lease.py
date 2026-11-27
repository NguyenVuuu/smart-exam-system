"""Exercise the actual lease scripts without a server or schema migration."""
import re
from pathlib import Path

import fakeredis


SOURCE = (Path(__file__).resolve().parents[2] / "be/soes-be/src/modules/ai-agents/services/practice-generation.lease.ts").read_text(encoding="utf-8-sig")
RENEW = re.search(r"const renewScript = `([\s\S]*?)`", SOURCE).group(1)
RELEASE = re.search(r"const releaseScript = `([\s\S]*?)`", SOURCE).group(1)


def test_lease_scripts_never_renew_or_remove_a_replacement_owner():
    client = fakeredis.FakeRedis(decode_responses=True)
    key = "soes:practice-generation:student"
    assert client.set(key, "first", nx=True, px=1000)
    assert not client.set(key, "second", nx=True, px=1000)
    assert client.eval(RENEW, 1, key, "first", 900000) == 1
    assert client.pttl(key) > 800000
    client.set(key, "replacement", px=10000)
    assert client.eval(RENEW, 1, key, "first", 900000) == 0
    assert client.eval(RELEASE, 1, key, "first") == 0
    assert client.get(key) == "replacement"
    assert client.eval(RELEASE, 1, key, "replacement") == 1
    assert client.get(key) is None
