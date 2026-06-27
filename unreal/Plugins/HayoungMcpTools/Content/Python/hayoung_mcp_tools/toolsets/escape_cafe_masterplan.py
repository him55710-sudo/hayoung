from __future__ import annotations

from typing import Final, TypedDict

import toolset_registry
import unreal

from .romantic_escape_room import _cube, _point_light, _shape, _text


class RoomSpec(TypedDict):
    prefix: str
    title: str
    x: float
    phase: str
    search: str
    lock: str
    reward: str
    carried_clue: str
    ambience: str
    accent: "unreal.LinearColor"


class MasterplanResult(TypedDict):
    spawned_count: int
    rooms: list[str]
    room_flow: list[str]
    space_zones: list[str]
    item_taxonomy: list[str]
    puzzle_architecture: list[str]
    quality_pass: list[str]
    recommended_next_prompts: list[str]


SPACE_ZONES: Final[tuple[str, ...]] = (
    "briefing threshold",
    "search wall and shelf zone",
    "central interaction console",
    "locked cabinet or drawer",
    "evidence board with clue links",
    "staff hint/reset fixture",
    "exit door with visible unlock motion rig",
)

ITEM_TAXONOMY: Final[tuple[str, ...]] = (
    "container: drawers, photo frames, cabinet doors, receipt boxes",
    "lock body: keypad, direction rail, word/symbol wheel, final gate",
    "clue medium: diary, photo, receipt, rain marks, note fragments, star chart",
    "feedback device: bolt, seam light, scanner plate, status lamp, audio cue",
    "carry reward: token, key shard, vow letter piece, constellation piece",
)

PUZZLE_ARCHITECTURE: Final[tuple[str, ...]] = (
    "Each room has puzzle A for search/collection and puzzle B for device unlock.",
    "Puzzle A reward is physically placed beside puzzle B, not only in HUD text.",
    "Every solved device brightens one cable/string path from clue to console to exit.",
    "The final room consumes the four earlier carry rewards before the 500-day vow gate.",
)


def _rooms(spacing: float) -> list[RoomSpec]:
    return [
        {
            "prefix": "CafeEscape_Room_01_FirstDiary",
            "title": "1-100일 첫 단서실",
            "x": 0.0 * spacing,
            "phase": "find diary page numbers, then open the first photo lock",
            "search": "diary pages, first-photo frame, low drawer, pencil marks",
            "lock": "numeric keypad plus hidden key slot",
            "reward": "small brass H key",
            "carried_clue": "H key opens the cafe receipt drawer in room 2",
            "ambience": "warm piano, paper, pencil, small lamp hum",
            "accent": unreal.LinearColor(1.0, 0.48, 0.32, 1.0),
        },
        {
            "prefix": "CafeEscape_Room_02_CafePromise",
            "title": "101-200일 카페 약속실",
            "x": 1.0 * spacing,
            "phase": "match receipt marks to seats, then choose the promise token",
            "search": "cafe table, receipt board, token tray, chair numbers",
            "lock": "choice lock and magnetic promise drawer",
            "reward": "green promise token",
            "carried_clue": "token powers the rain repair switch in room 3",
            "ambience": "quiet cafe room tone, cups, soft bell",
            "accent": unreal.LinearColor(0.43, 0.86, 0.62, 1.0),
        },
        {
            "prefix": "CafeEscape_Room_03_RainRepair",
            "title": "201-300일 비와 화해실",
            "x": 2.0 * spacing,
            "phase": "read raindrop trails, then restore the broken heart switch",
            "search": "rain glass, umbrella stand, broken-heart panel, wet footprints",
            "lock": "direction rail plus repair switch",
            "reward": "blue heart shard",
            "carried_clue": "heart shard fits the note bridge in room 4",
            "ambience": "rain loop, low strings, repaired-light chime",
            "accent": unreal.LinearColor(0.42, 0.56, 1.0, 1.0),
        },
        {
            "prefix": "CafeEscape_Room_04_NightBridge",
            "title": "301-400일 밤의 연결실",
            "x": 3.0 * spacing,
            "phase": "assemble note fragments, then light the bridge word order",
            "search": "night window, bridge notes, tape strings, city silhouettes",
            "lock": "symbol wheel and word lock",
            "reward": "gold constellation pin",
            "carried_clue": "pin completes the final 500-day star chart",
            "ambience": "night city pad, distant traffic, paper flutter",
            "accent": unreal.LinearColor(1.0, 0.62, 0.34, 1.0),
        },
        {
            "prefix": "CafeEscape_Room_05_HeavenGate",
            "title": "401-500일 하늘문",
            "x": 4.0 * spacing,
            "phase": "combine all rewards, then open the letter gate",
            "search": "cloud steps, memory frames, star chart, final letter plinth",
            "lock": "memory confirmation gate and YES vow console",
            "reward": "500-day ending letter",
            "carried_clue": "ending reveal",
            "ambience": "choir shimmer, airy bell, soft heartbeat",
            "accent": unreal.LinearColor(0.78, 0.9, 1.0, 1.0),
        },
    ]


def _spawn_architecture(prefix: str, origin_x: float, spec: RoomSpec) -> int:
    _cube(f"{prefix}_Briefing_Threshold", unreal.Vector(origin_x - 245, -270, 45), unreal.Vector(0.9, 0.12, 0.9))
    _cube(f"{prefix}_Search_Wall_Surface", unreal.Vector(origin_x - 245, -25, 140), unreal.Vector(0.08, 4.5, 2.1))
    _cube(f"{prefix}_Central_Table_Physical", unreal.Vector(origin_x, 80, 54), unreal.Vector(1.35, 0.82, 0.48))
    _cube(f"{prefix}_Locked_Cabinet", unreal.Vector(origin_x + 205, -115, 75), unreal.Vector(0.75, 0.5, 0.92))
    _cube(f"{prefix}_Exit_Door_Slab", unreal.Vector(origin_x + 282, 255, 132), unreal.Vector(0.12, 1.0, 2.55))
    _shape(f"{prefix}_Overhead_Practical_Light", "Cylinder", unreal.Vector(origin_x, 20, 330), unreal.Vector(0.55, 0.55, 0.08))
    _text(f"{prefix}_Room_Title", spec["title"], unreal.Vector(origin_x, 292, 265), unreal.Rotator(0.0, 180.0, 0.0), 34.0)
    _text(f"{prefix}_Phase_Label", spec["phase"], unreal.Vector(origin_x - 185, -258, 132), unreal.Rotator(0.0, 0.0, 0.0), 15.0)
    _point_light(f"{prefix}_Practical_Key_Light", unreal.Vector(origin_x - 145, -20, 228), spec["accent"], 1450.0, 560.0)
    _point_light(f"{prefix}_Exit_Seam_Light", unreal.Vector(origin_x + 252, 235, 158), spec["accent"], 920.0, 260.0)
    return 10


def _spawn_clue_network(prefix: str, origin_x: float, spec: RoomSpec) -> int:
    for index, label in enumerate(["A_Search", "B_Transform", "C_Device", "D_Exit"]):
        y = -205 + index * 92
        _cube(f"{prefix}_Evidence_Card_{label}", unreal.Vector(origin_x - 250, y, 155), unreal.Vector(0.035, 0.42, 0.26))
        _shape(f"{prefix}_Evidence_Pin_{label}", "Sphere", unreal.Vector(origin_x - 243, y, 183), unreal.Vector(0.055, 0.055, 0.055))
        _cube(f"{prefix}_Glow_String_{label}", unreal.Vector(origin_x - 126 + index * 72, y + 18, 58), unreal.Vector(0.72, 0.018, 0.018))
    _text(f"{prefix}_Search_Text", spec["search"], unreal.Vector(origin_x - 245, -236, 232), unreal.Rotator(0.0, 90.0, 0.0), 13.0)
    _text(f"{prefix}_Lock_Text", spec["lock"], unreal.Vector(origin_x + 38, 42, 125), unreal.Rotator(0.0, 180.0, 0.0), 15.0)
    _text(f"{prefix}_Reward_Text", spec["reward"], unreal.Vector(origin_x + 205, -118, 142), unreal.Rotator(0.0, 180.0, 0.0), 14.0)
    _text(f"{prefix}_Ambience_Label", spec["ambience"], unreal.Vector(origin_x + 68, -252, 105), unreal.Rotator(0.0, 0.0, 0.0), 13.0)
    return 12


def _spawn_lock_detail(prefix: str, origin_x: float, spec: RoomSpec) -> int:
    _shape(f"{prefix}_Lock_Dial_Reference", "Cylinder", unreal.Vector(origin_x - 42, 54, 124), unreal.Vector(0.25, 0.25, 0.045))
    _shape(f"{prefix}_Scanner_Lens_Reference", "Sphere", unreal.Vector(origin_x + 46, 54, 126), unreal.Vector(0.16, 0.16, 0.16))
    _cube(f"{prefix}_Bolt_Closed_Start", unreal.Vector(origin_x + 238, 230, 122), unreal.Vector(0.44, 0.055, 0.06))
    _cube(f"{prefix}_Bolt_Open_Target", unreal.Vector(origin_x + 270, 230, 122), unreal.Vector(0.44, 0.055, 0.06))
    _shape(f"{prefix}_Reward_Object_{spec['reward'].replace(' ', '_')}", "Sphere", unreal.Vector(origin_x + 205, -118, 138), unreal.Vector(0.16, 0.16, 0.16))
    _cube(f"{prefix}_Carry_Clue_Trail", unreal.Vector(origin_x + 355, 248, 18), unreal.Vector(1.15, 0.03, 0.035))
    _text(f"{prefix}_Carry_Clue_Label", spec["carried_clue"], unreal.Vector(origin_x + 312, 225, 78), unreal.Rotator(0.0, 180.0, 0.0), 12.0)
    return 7


@unreal.uclass()
class HayoungEscapeCafeMasterplanTools(unreal.ToolsetDefinition):

    @staticmethod
    @toolset_registry.tool_call
    def create_escape_cafe_500_masterplan(
        theme_label: str = "하영이와 현수의 500일 방탈출",
        fidelity_pass: int = 3,
        compact_layout: bool = False,
    ) -> MasterplanResult:
        density = max(1, min(int(fidelity_pass), 4))
        spacing = 760.0 if compact_layout else 940.0
        spawned_count = 0
        room_specs = _rooms(spacing)

        for index, spec in enumerate(room_specs):
            prefix = spec["prefix"]
            origin_x = spec["x"]
            spawned_count += _spawn_architecture(prefix, origin_x, spec)
            spawned_count += _spawn_clue_network(prefix, origin_x, spec)
            spawned_count += _spawn_lock_detail(prefix, origin_x, spec)

            for extra_index in range(density):
                prop_y = -196 + extra_index * 66
                _cube(f"{prefix}_Searchable_Prop_{extra_index + 1}", unreal.Vector(origin_x - 92, prop_y, 44), unreal.Vector(0.24, 0.2, 0.08))
                _shape(f"{prefix}_Micro_Feedback_Lamp_{extra_index + 1}", "Sphere", unreal.Vector(origin_x + 96, prop_y, 98), unreal.Vector(0.07, 0.07, 0.07))
                spawned_count += 2

            if index < len(room_specs) - 1:
                _cube(f"EscapeCafe_Link_{index + 1}_CarryReward_Hall", unreal.Vector(origin_x + spacing * 0.5, 252, 6), unreal.Vector(2.8, 0.46, 0.08))
                _point_light(f"EscapeCafe_Link_{index + 1}_Guidance_Light", unreal.Vector(origin_x + spacing * 0.5, 238, 160), spec["accent"], 620.0, 340.0)
                spawned_count += 2

        _text("EscapeCafe_Master_Title_500", theme_label, unreal.Vector(0, -300, 230), unreal.Rotator(0.0, 0.0, 0.0), 42.0)
        spawned_count += 1

        return {
            "spawned_count": spawned_count,
            "rooms": [spec["prefix"] for spec in room_specs],
            "room_flow": [spec["carried_clue"] for spec in room_specs],
            "space_zones": list(SPACE_ZONES),
            "item_taxonomy": list(ITEM_TAXONOMY),
            "puzzle_architecture": list(PUZZLE_ARCHITECTURE),
            "quality_pass": [
                "Blockout is organized for later Nanite/Fab asset replacement by actor label.",
                "Each room has practical lights, clue board, central console, locked storage, and exit motion references.",
                "Use Lumen, post-process bloom/ACES, KTX2 textures, and LOD/Nanite replacement before final cinematic capture.",
            ],
            "recommended_next_prompts": [
                "Replace every *_Searchable_Prop_* with licensed Fab/Megascans room props while preserving labels.",
                "Convert *_Bolt_* and *_Exit_Door_Slab into Blueprint unlock animation actors.",
                "Attach room-specific ambience loops to the Ambience_Label actors and trigger them by room volume.",
                "Import real couple photos into the evidence cards and final memory frames.",
            ],
        }
