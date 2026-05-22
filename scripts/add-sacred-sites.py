#!/usr/bin/env python3
"""
Add Sacred Sites + Pilgrimage topics and four place nodes
(Mount Shasta, Pyramids of Giza, Sedona, Bali) to the FRQNCY graph.

Skip-if-exists rule applies to PLACE entries:
- p-sedona / p-bali / Sedona / Bali already exist → only link to t-sacred-sites
- p-mount-shasta / p-pyramids-of-giza → add fresh

Topics (Sacred Sites, Pilgrimage) are net-new.
"""
import json
import os
from pathlib import Path

ROOT = Path(__file__).parent.parent

# ────────────────────────────────────────────────────────────────────
# DEFINITIONS — single source of truth for the four additions
# ────────────────────────────────────────────────────────────────────

NEW_TOPICS = [
    {
        "id": "t-sacred-sites",
        "label": "Sacred Sites",
        "slug": "sacred-sites",
        "desc": "Places on Earth that hold a frequency — vortex sites, ancient temples, ceremonial valleys, mountains the local peoples have always called holy. Where the land itself is the teaching.",
        "domain_id": "d-meta",
        "domain": "Consciousness",
        "domain_slug": "consciousness",
        "pillar": "Research",
        "pillar_slug": "research",
        "accent": "#7B4AE8",
        "url_path": "sacred-sites/index.html",
        "url_full": "/sacred-sites/",
        "r": 15,
    },
    {
        "id": "t-pilgrimage",
        "label": "Pilgrimage",
        "slug": "pilgrimage",
        "desc": "The journey itself as practice — walking the Camino, circling Kailash, returning to the well. Movement toward a place that reorganises the inner landscape on arrival.",
        "domain_id": "d-meta",
        "domain": "Consciousness",
        "domain_slug": "consciousness",
        "pillar": "Research",
        "pillar_slug": "research",
        "accent": "#7B4AE8",
        "url_path": "pilgrimage/index.html",
        "url_full": "/pilgrimage/",
        "r": 14,
    },
]

# Places to add as p- nodes in the graph and as place entries in resources.json
# Each links to multiple topics. The 'exists_in_graph' / 'exists_in_resources' flags
# control whether we create or just link.
NEW_PLACES = [
    {
        "id": "p-mount-shasta",
        "name": "Mount Shasta",
        "slug": "mount-shasta",
        "desc": "A 14,000-foot volcano in northern California held as sacred by the Wintu, Shasta, Modoc, and Achomawi long before John Muir's writings, the Lemurian mythos, or the I AM movement found it. Snow-capped, solitary, charged. One of the most consistently named power-points on the North American continent — a mountain that arrives in dreams and pulls people across the country to climb its lower slopes, sit by Panther Meadows, or simply look at it.",
        "domain": "Consciousness",
        "domain_slug": "consciousness",
        "url_full": "/places/mount-shasta/",
        "external": "",
        "topic_links": [
            "t-sacred-sites", "t-source", "t-vibration", "t-channeling",
            "t-indigenous", "t-spirituality", "t-meditation", "t-akashic",
        ],
        "domain_links": ["d-places", "d-meta"],
        "exists_in_graph": False,
        "exists_in_resources": False,
        "r": 14,
    },
    {
        "id": "p-pyramids-of-giza",
        "name": "Pyramids of Giza",
        "slug": "pyramids-of-giza",
        "desc": "The Great Pyramid, Khafre, Menkaure, and the Sphinx on the Giza plateau west of Cairo. Older, more precise, and more strangely aligned than mainstream Egyptology will easily admit. Whatever they were originally for — tomb, initiation chamber, resonator, star-clock — they still hold the geometry. The benchmark sacred site of the ancient world.",
        "domain": "Consciousness",
        "domain_slug": "consciousness",
        "url_full": "/places/pyramids-of-giza/",
        "external": "",
        "topic_links": [
            "t-sacred-sites", "t-sacredgeo", "t-merkaba", "t-history",
            "t-vibration", "t-akashic", "t-dims", "t-archit", "t-spirituality",
        ],
        "domain_links": ["d-places", "d-meta"],
        "exists_in_graph": False,
        "exists_in_resources": False,
        "r": 14,
    },
    {
        # Sedona — exists in graph and resources. Only add new t-sacred-sites link.
        "id": "p-sedona",
        "name": "Sedona",
        "exists_in_graph": True,
        "exists_in_resources": True,
        "additional_links": ["t-sacred-sites"],
    },
    {
        # Bali — exists in graph and resources. Only add new t-sacred-sites link.
        "id": "p-bali",
        "name": "Bali",
        "exists_in_graph": True,
        "exists_in_resources": True,
        "additional_links": ["t-sacred-sites"],
    },
]


def load_json(name):
    with open(ROOT / name, "r", encoding="utf-8") as f:
        return json.load(f)


def dump_json(name, data, indent=None):
    """search.json/resources.json/content.json are single-line; explore-data.json is pretty.
       Match the existing format to keep diffs minimal."""
    path = ROOT / name
    with open(path, "r", encoding="utf-8") as f:
        first_line = f.readline()
    # If the file starts with [{ or {" and has no newline structure → single-line
    # Detect by checking line count
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    is_single_line = text.count("\n") < 5
    with open(path, "w", encoding="utf-8") as f:
        if is_single_line:
            json.dump(data, f, ensure_ascii=False, separators=(", ", ": "))
        else:
            json.dump(data, f, ensure_ascii=False, indent=indent if indent else 2)


# ────────────────────────────────────────────────────────────────────
# 1. explore-data.json — add nodes, links, node_urls
# ────────────────────────────────────────────────────────────────────
def update_explore_data():
    data = load_json("explore-data.json")
    existing_ids = {n["id"] for n in data["nodes"]}
    existing_links = {tuple(sorted(l)) for l in data["links"]}

    # Add topic nodes
    for t in NEW_TOPICS:
        if t["id"] not in existing_ids:
            data["nodes"].append({
                "id": t["id"],
                "label": t["label"],
                "type": "topic",
                "r": t["r"],
                "desc": t["desc"],
            })
            existing_ids.add(t["id"])
        data["node_urls"][t["id"]] = t["url_path"]

    # Add place nodes
    for p in NEW_PLACES:
        if p.get("exists_in_graph"):
            continue
        data["nodes"].append({
            "id": p["id"],
            "label": p["name"],
            "type": "topic",
            "r": p["r"],
            "desc": p["desc"],
        })
        existing_ids.add(p["id"])
        data["node_urls"][p["id"]] = p["url_full"]

    # Helper for adding links idempotently
    def add_link(a, b):
        key = tuple(sorted([a, b]))
        if key not in existing_links and a != b:
            data["links"].append([a, b])
            existing_links.add(key)

    # Topic-to-cluster links
    add_link("t-sacred-sites", "d-meta")
    add_link("t-sacred-sites", "t-pilgrimage")
    add_link("t-sacred-sites", "t-indigenous")
    add_link("t-sacred-sites", "t-spirituality")
    add_link("t-sacred-sites", "t-sacredgeo")
    add_link("t-sacred-sites", "t-source")
    add_link("t-sacred-sites", "t-vibration")
    add_link("t-pilgrimage", "d-meta")
    add_link("t-pilgrimage", "t-spirituality")
    add_link("t-pilgrimage", "t-meditation")
    add_link("t-pilgrimage", "t-indigenous")
    add_link("t-pilgrimage", "t-soul")
    add_link("t-pilgrimage", "t-movement")

    # Place links (new places)
    for p in NEW_PLACES:
        if p.get("exists_in_graph"):
            # Just add the additional link(s)
            for link_to in p.get("additional_links", []):
                add_link(p["id"], link_to)
            continue
        for link_to in p.get("topic_links", []):
            add_link(p["id"], link_to)
        for link_to in p.get("domain_links", []):
            add_link(p["id"], link_to)

    # bump $last_sync stamp
    data["$last_sync"] = "2026-05-22"
    data["$updated"] = (
        "2026-05-22 — added Sacred Sites + Pilgrimage topics and four place "
        "nodes (Mount Shasta, Pyramids of Giza newly created; Sedona, Bali "
        "linked to Sacred Sites)."
    )

    with open(ROOT / "explore-data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)  # single-line, matches existing
    print(f"explore-data.json: {len(data['nodes'])} nodes, {len(data['links'])} links")
    return data


# ────────────────────────────────────────────────────────────────────
# 2. explore-data.js — regenerate wrapper around updated JSON
# ────────────────────────────────────────────────────────────────────
def update_explore_data_js(data):
    header = (
        "// Auto-generated wrapper around explore-data.json so the map can load "
        "via file:// (where fetch() is blocked by CORS) as well as http(s)://.\n"
    )
    body = "window.EXPLORE_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n"
    with open(ROOT / "explore-data.js", "w", encoding="utf-8") as f:
        f.write(header + body)
    print("explore-data.js: regenerated")


# ────────────────────────────────────────────────────────────────────
# 3. search.json — add Sacred Sites + Pilgrimage topic entries
# ────────────────────────────────────────────────────────────────────
def update_search_json():
    data = load_json("search.json")
    existing_ids = {d["id"] for d in data}
    for t in NEW_TOPICS:
        if t["id"] in existing_ids:
            continue
        data.append({
            "id": t["id"],
            "label": t["label"],
            "slug": t["slug"],
            "desc": t["desc"],
            "domain": t["domain"],
            "domainLabel": t["domain"],
            "domainSlug": t["domain_slug"],
            "pillar": t["pillar"],
            "pillarLabel": t["pillar"],
            "pillarSlug": t["pillar_slug"],
            "accent": t["accent"],
            "picks": [],
            "resourceCount": 0,
            "url": t["url_full"],
        })
    with open(ROOT / "search.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)  # single-line
    print(f"search.json: {len(data)} entries")


# ────────────────────────────────────────────────────────────────────
# 4. content.json — add topics to topics array
# ────────────────────────────────────────────────────────────────────
def update_content_json():
    data = load_json("content.json")
    existing_ids = {t["id"] for t in data["topics"]}
    for t in NEW_TOPICS:
        if t["id"] in existing_ids:
            continue
        data["topics"].append({
            "id": t["id"],
            "slug": t["slug"],
            "label": t["label"],
            "domain": t["domain_id"],
            "desc": t["desc"],
        })
    with open(ROOT / "content.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)  # single-line
    print(f"content.json: {len(data['topics'])} topics")


# ────────────────────────────────────────────────────────────────────
# 5. resources.json — add Mount Shasta + Giza place entries
#    (multiple rows, one per topic linkage — matches existing pattern)
# ────────────────────────────────────────────────────────────────────
def update_resources_json():
    data = load_json("resources.json")

    # Topic id → metadata lookup from search.json
    topic_meta = {}
    for t in load_json("search.json"):
        topic_meta[t["id"]] = t

    # Existing place rows for skip-check
    existing_place_names = {
        r["name"] for r in data if r.get("type") == "place"
    }

    added = 0
    for p in NEW_PLACES:
        if p.get("exists_in_resources"):
            continue
        if p["name"] in existing_place_names:
            print(f"  skipping {p['name']} (already in resources.json)")
            continue
        for tid in p.get("topic_links", []):
            tm = topic_meta.get(tid)
            if not tm:
                # not in search.json — use just-added topic metadata
                tm = next((nt for nt in NEW_TOPICS if nt["id"] == tid), None)
                if tm:
                    topic_label = tm["label"]
                    topic_slug = tm["slug"]
                    topic_url = tm["url_full"]
                    domain = tm["domain"]
                    domain_slug = tm["domain_slug"]
                else:
                    continue
            else:
                topic_label = tm["label"]
                topic_slug = tm["slug"]
                topic_url = tm["url"]
                domain = tm["domain"]
                domain_slug = tm["domainSlug"]
            data.append({
                "type": "place",
                "name": p["name"],
                "desc": p["desc"],
                "url": p["url_full"],
                "topicSlug": topic_slug,
                "topicLabel": topic_label,
                "topicUrl": topic_url,
                "domain": domain,
                "domainSlug": domain_slug,
                "external": p["external"],
            })
            added += 1

    with open(ROOT / "resources.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)  # single-line
    print(f"resources.json: added {added} new rows, total {len(data)}")


# ────────────────────────────────────────────────────────────────────
# Run
# ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Updating explore-data.json…")
    edata = update_explore_data()
    print("Updating explore-data.js…")
    update_explore_data_js(edata)
    print("Updating search.json…")
    update_search_json()
    print("Updating content.json…")
    update_content_json()
    print("Updating resources.json…")
    update_resources_json()
    print("Done.")
