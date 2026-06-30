from __future__ import annotations

from dataclasses import dataclass
from typing import Final

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .level_ops import color
from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path


@dataclass(frozen=True, slots=True)
class RoomDressingProfile:
    prefix: str
    motif: str
    primary_material: str
    secondary_material: str
    clue_word: str
    service_note: str


@dataclass(frozen=True, slots=True)
class RoomDressingContext:
    room: RoomSpec
    profile: RoomDressingProfile


ROOM_DRESSING_PROFILES: Final[tuple[RoomDressingProfile, ...]] = (
    RoomDressingProfile("PremiumEscape_Room01_DiaryArchive", "paper seams / hidden shelf backs", "WalnutDark", "RoseGlow", "bookmark", "low bookcase service chase"),
    RoomDressingProfile("PremiumEscape_Room02_CafePromise", "tile grout / receipt tape clues", "WarmPlaster", "GlassTeal", "receipt", "counter speaker and staff bell line"),
    RoomDressingProfile("PremiumEscape_Room03_RainRepair", "wet concrete / pipe access panels", "DeepShadow", "RainBlue", "relay", "rain drain and fuse conduit"),
    RoomDressingProfile("PremiumEscape_Room04_NightCity", "roof parapet / neon maintenance marks", "DeepShadow", "NeonAmber", "signal", "elevator control conduit"),
    RoomDressingProfile("PremiumEscape_Room05_HeavenVault", "pearl vault / ceremonial reveal seams", "HeavenPearl", "BrassEdge", "heart", "final door safety release"),
)


def spawn_room_dressing_quality(room: RoomSpec) -> int:
    context = RoomDressingContext(room, _profile_for(room))
    return _spawn_wall_panels(context) + _spawn_ceiling_services(context) + _spawn_search_affordances(context) + _spawn_material_breakup(context)


def _spawn_wall_panels(context: RoomDressingContext) -> int:
    room = context.room
    half_w = room.width / 2.0
    half_d = room.depth / 2.0
    count = 0
    for index in range(5):
        x = room.x - half_w * 0.38 + index * room.width * 0.19
        _cube(f"PE_RoomDressing_{room.prefix}_WallPanel_{index + 1:02d}", unreal.Vector(x, half_d - 10.0, room.height * 0.46), unreal.Vector(0.48, 0.025, 0.76), prop_material_path(room))
        _cube(f"PE_RoomDressing_{room.prefix}_WallGapShadow_{index + 1:02d}", unreal.Vector(x + 24.0, half_d - 13.0, room.height * 0.46), unreal.Vector(0.018, 0.018, 0.78), material_path("DeepShadow"))
        count += 2
    _cube(f"PE_RoomDressing_{room.prefix}_Trim_BackChairRail", unreal.Vector(room.x, half_d - 15.0, room.height * 0.34), unreal.Vector(room.width / 120.0, 0.018, 0.032), material_path(context.profile.primary_material))
    _cube(f"PE_RoomDressing_{room.prefix}_Trim_LeftReveal", unreal.Vector(room.x - half_w + 13.0, 0.0, room.height * 0.54), unreal.Vector(0.022, room.depth / 130.0, 0.46), material_path(context.profile.primary_material))
    _cube(f"PE_RoomDressing_{room.prefix}_Trim_RightReveal", unreal.Vector(room.x + half_w - 13.0, 0.0, room.height * 0.54), unreal.Vector(0.022, room.depth / 130.0, 0.46), material_path(context.profile.primary_material))
    return count + 3


def _spawn_ceiling_services(context: RoomDressingContext) -> int:
    room = context.room
    half_d = room.depth / 2.0
    y = half_d * 0.18
    _cube(f"PE_RoomDressing_{room.prefix}_CeilingService_CableTray", unreal.Vector(room.x - room.width * 0.18, y, room.height - 28.0), unreal.Vector(room.width / 190.0, 0.028, 0.032), material_path("DeepShadow"))
    _shape(f"PE_RoomDressing_{room.prefix}_CeilingService_SprinklerLine", "Cylinder", unreal.Vector(room.x + room.width * 0.18, y + 38.0, room.height - 24.0), unreal.Vector(0.04, 0.04, room.depth / 180.0), material_path("BrassEdge"))
    _cube(f"PE_RoomDressing_{room.prefix}_CeilingService_ReturnVent", unreal.Vector(room.x, -half_d * 0.22, room.height - 18.0), unreal.Vector(0.42, 0.15, 0.018), material_path("DeepShadow"))
    _shape(f"PE_RoomDressing_{room.prefix}_CeilingService_SpeakerGrille", "Cylinder", unreal.Vector(room.x + room.width * 0.31, half_d * 0.34, room.height - 34.0), unreal.Vector(0.13, 0.13, 0.022), material_path(context.profile.primary_material))
    _shape(f"PE_RoomDressing_{room.prefix}_CeilingService_EmergencyBeacon", "Sphere", unreal.Vector(room.x - room.width * 0.31, half_d * 0.35, room.height - 42.0), unreal.Vector(0.09, 0.09, 0.055), accent_material_path(room))
    _point_light(f"PE_RoomDressing_{room.prefix}_PracticalLight_ServiceGlow", unreal.Vector(room.x - room.width * 0.18, y, room.height - 54.0), color(room), 340.0, 260.0)
    return 6


def _spawn_search_affordances(context: RoomDressingContext) -> int:
    room = context.room
    count = 0
    for index in range(4):
        x = room.x - room.width * 0.32 + index * room.width * 0.21
        y = -room.depth * 0.40 + index % 2 * room.depth * 0.18
        _cube(f"PE_RoomDressing_{room.prefix}_SearchAffordance_EdgeGlint_{index + 1:02d}", unreal.Vector(x, y, 92.0 + index * 15.0), unreal.Vector(0.19, 0.012, 0.018), material_path(context.profile.secondary_material))
        _cube(f"PE_RoomDressing_{room.prefix}_Wear_HandRub_{index + 1:02d}", unreal.Vector(x + 16.0, y + 7.0, 72.0 + index * 13.0), unreal.Vector(0.11, 0.010, 0.028), material_path("DeepShadow"))
        count += 2
    _shape(f"PE_RoomDressing_{room.prefix}_SearchAffordance_MapPin", "Sphere", unreal.Vector(room.x + room.width * 0.36, -room.depth * 0.34, 136.0), unreal.Vector(0.055, 0.055, 0.055), accent_material_path(room))
    _text(f"PE_RoomDressing_{room.prefix}_SearchAffordance_ReadableNote", f"{context.profile.clue_word} trace", unreal.Vector(room.x + room.width * 0.35, -room.depth * 0.38, 154.0), unreal.Rotator(0.0, 0.0, 0.0), 7.0)
    return count + 2


def _spawn_material_breakup(context: RoomDressingContext) -> int:
    room = context.room
    count = 0
    for index in range(5):
        x = room.x - room.width * 0.42 + index * room.width * 0.21
        _cube(f"PE_RoomDressing_{room.prefix}_MaterialBreak_FloorInlay_{index + 1:02d}", unreal.Vector(x, -room.depth * 0.12 + index % 2 * 36.0, 2.0), unreal.Vector(0.21, 0.035, 0.006), material_path(context.profile.primary_material))
        count += 1
    for index in range(3):
        _cube(f"PE_RoomDressing_{room.prefix}_Wear_WallRub_{index + 1:02d}", unreal.Vector(room.x - room.width * 0.38 + index * room.width * 0.38, room.depth * 0.48, 98.0 + index * 28.0), unreal.Vector(0.18, 0.010, 0.052), material_path("DeepShadow"))
        count += 1
    _cube(f"PE_RoomDressing_{room.prefix}_MaterialBreak_BackReflection", unreal.Vector(room.x, room.depth * 0.46, room.height * 0.72), unreal.Vector(0.82, 0.012, 0.036), accent_material_path(room))
    _text(f"PE_RoomDressing_{room.prefix}_Wear_ServiceNote", context.profile.service_note, unreal.Vector(room.x - room.width * 0.34, room.depth * 0.40, 58.0), unreal.Rotator(0.0, 0.0, 0.0), 6.5)
    return count + 2


def _profile_for(room: RoomSpec) -> RoomDressingProfile:
    for profile in ROOM_DRESSING_PROFILES:
        if profile.prefix == room.prefix:
            return profile
    return ROOM_DRESSING_PROFILES[0]
