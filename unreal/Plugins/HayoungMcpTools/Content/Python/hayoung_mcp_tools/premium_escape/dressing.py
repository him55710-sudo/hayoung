from __future__ import annotations

from dataclasses import dataclass
from typing import Final

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path


@dataclass(frozen=True, slots=True)
class DressingContext:
    room: RoomSpec
    label: str


CLUE_LABELS: Final[tuple[str, ...]] = ("DATE", "UV", "TAG", "KEY", "MAP", "AUDIO")


def spawn_room_dressing(room: RoomSpec) -> int:
    context = DressingContext(room, f"PE_Dressing_{room.prefix}")
    return _spawn_trim(context) + _spawn_clue_surface(context) + _spawn_monitoring(context) + _spawn_wear_marks(context)


def _spawn_trim(context: DressingContext) -> int:
    room = context.room
    half_w = room.width / 2.0
    half_d = room.depth / 2.0
    _cube(f"{context.label}_Back_Baseboard", unreal.Vector(room.x, half_d - 8.0, 18.0), unreal.Vector(room.width / 100.0, 0.028, 0.075), material_path("WalnutDark"))
    _cube(f"{context.label}_Left_Baseboard", unreal.Vector(room.x - half_w + 8.0, 0.0, 18.0), unreal.Vector(0.028, room.depth / 100.0, 0.075), material_path("WalnutDark"))
    _cube(f"{context.label}_Right_Baseboard", unreal.Vector(room.x + half_w - 8.0, 0.0, 18.0), unreal.Vector(0.028, room.depth / 100.0, 0.075), material_path("WalnutDark"))
    _cube(f"{context.label}_Ceiling_CableTray", unreal.Vector(room.x - half_w * 0.18, half_d * 0.18, room.height - 24.0), unreal.Vector(room.width / 180.0, 0.035, 0.035), material_path("DeepShadow"))
    _cube(f"{context.label}_Service_KickPlate", unreal.Vector(room.x + half_w * 0.32, -half_d * 0.45, 42.0), unreal.Vector(0.58, 0.035, 0.18), material_path("BrassEdge"))
    return 5


def _spawn_clue_surface(context: DressingContext) -> int:
    room = context.room
    count = 0
    for index, clue in enumerate(CLUE_LABELS):
        x_side = -1.0 if index % 2 == 0 else 1.0
        y = -room.depth * 0.33 + index * room.depth * 0.12
        x = room.x + x_side * room.width * 0.40
        _cube(f"{context.label}_LaminatedClue_{index + 1:02d}", unreal.Vector(x, y, 138.0), unreal.Vector(0.24, 0.025, 0.16), material_path("HeavenPearl"))
        _cube(f"{context.label}_TapeStrip_{index + 1:02d}", unreal.Vector(x, y - 3.0, 157.0), unreal.Vector(0.28, 0.014, 0.028), material_path("BrassEdge"))
        _text(f"{context.label}_ClueText_{index + 1:02d}", clue, unreal.Vector(x, y - 8.0, 139.0), unreal.Rotator(0.0, 0.0, 0.0), 7.0)
        count += 3
    return count


def _spawn_monitoring(context: DressingContext) -> int:
    room = context.room
    half_w = room.width / 2.0
    half_d = room.depth / 2.0
    screen = unreal.Vector(room.x - half_w * 0.33, half_d - 16.0, room.height * 0.56)
    cctv = unreal.Vector(room.x + half_w * 0.36, half_d - 20.0, room.height - 66.0)
    _cube(f"{context.label}_HintMonitor_Frame", screen, unreal.Vector(0.48, 0.035, 0.30), material_path("DeepShadow"))
    _cube(f"{context.label}_HintMonitor_ScreenGlow", unreal.Vector(screen.x, screen.y - 4.0, screen.z), unreal.Vector(0.42, 0.018, 0.24), accent_material_path(room))
    _shape(f"{context.label}_CCTV_Dome", "Sphere", cctv, unreal.Vector(0.16, 0.16, 0.10), material_path("DeepShadow"))
    _cube(f"{context.label}_CCTV_Bracket", unreal.Vector(cctv.x, cctv.y + 4.0, cctv.z + 16.0), unreal.Vector(0.05, 0.08, 0.05), material_path("BrassEdge"))
    _shape(f"{context.label}_Speaker", "Cylinder", unreal.Vector(room.x + half_w * 0.22, half_d - 18.0, room.height * 0.58), unreal.Vector(0.11, 0.11, 0.045), prop_material_path(room))
    _point_light(f"{context.label}_Monitor_SoftBounce", unreal.Vector(screen.x, screen.y - 48.0, screen.z + 8.0), _accent(room), 240.0, 210.0)
    return 6


def _spawn_wear_marks(context: DressingContext) -> int:
    room = context.room
    count = 0
    for index in range(7):
        x = room.x - room.width * 0.36 + index * room.width * 0.12
        y = -room.depth * 0.42 + index % 3 * room.depth * 0.18
        _cube(f"{context.label}_Scuff_{index + 1:02d}", unreal.Vector(x, y, 3.0), unreal.Vector(0.24 + index * 0.015, 0.025, 0.006), material_path("DeepShadow"))
        count += 1
    for index in range(4):
        _shape(f"{context.label}_DustMote_{index + 1:02d}", "Sphere", unreal.Vector(room.x - 80.0 + index * 52.0, -room.depth * 0.18 + index * 36.0, 145.0 + index * 18.0), unreal.Vector(0.025, 0.025, 0.025), material_path("HeavenPearl"))
        count += 1
    return count


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
