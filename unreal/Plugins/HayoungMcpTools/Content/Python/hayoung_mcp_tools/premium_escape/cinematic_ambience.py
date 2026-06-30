from __future__ import annotations

from dataclasses import dataclass
from typing import Final

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .level_ops import color
from .specs import RoomSpec
from .visuals import accent_material_path, material_path


@dataclass(frozen=True, slots=True)
class CinematicMood:
    prefix: str
    motif: str
    material_key: str
    beam_side: float
    haze_height: float


@dataclass(frozen=True, slots=True)
class CinematicContext:
    room: RoomSpec
    mood: CinematicMood


ROOM_MOODS: Final[tuple[CinematicMood, ...]] = (
    CinematicMood("PremiumEscape_Room01_DiaryArchive", "warm paper dust / shelf shadows", "RoseGlow", -1.0, 148.0),
    CinematicMood("PremiumEscape_Room02_CafePromise", "cafe steam / counter glow", "GlassTeal", 1.0, 164.0),
    CinematicMood("PremiumEscape_Room03_RainRepair", "rain streaks / blue relay haze", "RainBlue", -1.0, 178.0),
    CinematicMood("PremiumEscape_Room04_NightCity", "neon skyline / rooftop shafts", "NeonAmber", 1.0, 190.0),
    CinematicMood("PremiumEscape_Room05_HeavenVault", "heaven bloom / pearl dust", "HeavenPearl", -1.0, 214.0),
)


def spawn_room_cinematic_ambience(room: RoomSpec) -> int:
    context = CinematicContext(room, _mood_for(room))
    return _spawn_beam_stack(context) + _spawn_dust_field(context) + _spawn_shadow_story(context)


def _spawn_beam_stack(context: CinematicContext) -> int:
    room = context.room
    mood = context.mood
    half_w = room.width / 2.0
    half_d = room.depth / 2.0
    side_x = room.x + half_w * 0.34 * mood.beam_side
    _cube(f"PE_Cinematic_{room.prefix}_VolumetricBeam_A", unreal.Vector(side_x, -half_d * 0.12, mood.haze_height), unreal.Vector(0.035, room.depth / 210.0, 0.72), material_path(mood.material_key))
    _cube(f"PE_Cinematic_{room.prefix}_VolumetricBeam_B", unreal.Vector(side_x - 52.0 * mood.beam_side, half_d * 0.18, mood.haze_height + 28.0), unreal.Vector(0.028, room.depth / 250.0, 0.58), accent_material_path(room))
    _point_light(f"PE_Cinematic_{room.prefix}_Motif_KeyGlow", unreal.Vector(side_x, -half_d * 0.32, mood.haze_height + 68.0), color(room), 940.0, 410.0)
    _point_light(f"PE_Cinematic_{room.prefix}_Motif_BackGlow", unreal.Vector(room.x - side_x + room.x, half_d * 0.38, mood.haze_height + 42.0), color(room), 620.0, 360.0)
    return 4


def _spawn_dust_field(context: CinematicContext) -> int:
    count = 0
    room = context.room
    for index in range(5):
        x_offset = -room.width * 0.24 + index * room.width * 0.12
        y_offset = -room.depth * 0.10 + (index % 2) * room.depth * 0.16
        _shape(f"PE_Cinematic_{room.prefix}_HazeParticle_{index + 1}", "Sphere", unreal.Vector(room.x + x_offset, y_offset, context.mood.haze_height + index * 8.0), unreal.Vector(0.028, 0.028, 0.028), accent_material_path(room))
        count += 1
    _text(f"PE_Cinematic_{room.prefix}_MoodLabel", context.mood.motif, unreal.Vector(room.x - room.width * 0.34, -room.depth * 0.40, context.mood.haze_height + 64.0), unreal.Rotator(0.0, 18.0, 0.0), 8.0)
    return count + 1


def _spawn_shadow_story(context: CinematicContext) -> int:
    room = context.room
    half_d = room.depth / 2.0
    _cube(f"PE_Cinematic_{room.prefix}_ForegroundShadowSlat_Left", unreal.Vector(room.x - room.width * 0.22, half_d * 0.48, 96.0), unreal.Vector(0.032, 0.42, 0.84), material_path("DeepShadow"))
    _cube(f"PE_Cinematic_{room.prefix}_ForegroundShadowSlat_Right", unreal.Vector(room.x + room.width * 0.22, half_d * 0.48, 96.0), unreal.Vector(0.032, 0.42, 0.84), material_path("DeepShadow"))
    _cube(f"PE_Cinematic_{room.prefix}_CameraColorReference", unreal.Vector(room.x, -half_d * 0.46, 34.0), unreal.Vector(1.45, 0.030, 0.045), material_path(context.mood.material_key))
    return 3


def _mood_for(room: RoomSpec) -> CinematicMood:
    for mood in ROOM_MOODS:
        if mood.prefix == room.prefix:
            return mood
    return ROOM_MOODS[0]
