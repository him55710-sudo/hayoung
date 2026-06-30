from __future__ import annotations

from dataclasses import dataclass
from typing import TypeAlias

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _spawn

from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

Offset: TypeAlias = tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class LightingQualityContext:
    room: RoomSpec
    label: str
    center: "unreal.Vector"


def spawn_room_lighting_quality(room: RoomSpec) -> int:
    context = LightingQualityContext(room, f"PE_LightingQuality_{room.prefix}", unreal.Vector(room.x, 0.0, room.height / 2.0))
    count = _spawn_local_post_process(context)
    count += _spawn_light_story(context)
    count += _spawn_air_volume(context)
    count += _spawn_reflection_shadow_guides(context)
    return count


def _spawn_local_post_process(context: LightingQualityContext) -> int:
    room = context.room
    actor = _spawn(unreal.PostProcessVolume, context.center, label=f"{context.label}_PostProcessVolume")
    actor.set_editor_property("unbound", False)
    actor.set_editor_property("blend_weight", 0.82)
    actor.set_editor_property("blend_radius", 160.0)
    actor.set_actor_scale3d(unreal.Vector(room.width / 100.0, room.depth / 100.0, room.height / 100.0))
    _cube(f"{context.label}_ExposureAnchor", _point(context, (-room.width * 0.38, -room.depth * 0.38, room.height * 0.28)), unreal.Vector(0.11, 0.011, 0.07), material_path("HeavenPearl"))
    return 2


def _spawn_light_story(context: LightingQualityContext) -> int:
    room = context.room
    half_w = room.width / 2.0
    half_d = room.depth / 2.0
    accent = _accent(room)
    _point_light(f"{context.label}_KeyLight", unreal.Vector(room.x - half_w * 0.28, -half_d * 0.32, room.height - 68.0), accent, 3200.0, max(room.width, room.depth) * 0.72)
    _point_light(f"{context.label}_FillLight", unreal.Vector(room.x + half_w * 0.24, -half_d * 0.20, room.height - 98.0), unreal.LinearColor(0.38, 0.50, 0.88, 1.0), 760.0, max(room.width, room.depth) * 0.58)
    _point_light(f"{context.label}_RimLight", unreal.Vector(room.x, half_d * 0.44, room.height - 108.0), accent, 1900.0, max(room.width, room.depth) * 0.46)
    _point_light(f"{context.label}_PuzzleFocusLight", unreal.Vector(room.x + half_w * 0.31, -half_d * 0.10, 128.0), accent, 1400.0, 320.0)
    _point_light(f"{context.label}_ExitGlowLight", unreal.Vector(room.x + half_w * 0.40, half_d * 0.38, 166.0), unreal.LinearColor(1.0, 0.86, 0.58, 1.0), 1650.0, 360.0)
    return 5


def _spawn_air_volume(context: LightingQualityContext) -> int:
    room = context.room
    count = 0
    for index in range(4):
        x = room.x - room.width * 0.34 + index * room.width * 0.22
        y = -room.depth * 0.20 + index * room.depth * 0.11
        z = room.height - 94.0 - index * 18.0
        _cube(f"{context.label}_VolumetricBeam_{index + 1}", unreal.Vector(x, y, z), unreal.Vector(0.035, room.depth / 210.0, 0.022), accent_material_path(room))
        count += 1
    for index in range(8):
        x = room.x - room.width * 0.32 + index * room.width * 0.09
        y = -room.depth * 0.24 + (index % 4) * room.depth * 0.12
        z = 132.0 + (index % 3) * 42.0
        _shape(f"{context.label}_DustMote_{index + 1}", "Sphere", unreal.Vector(x, y, z), unreal.Vector(0.017, 0.017, 0.017), material_path("HeavenPearl"))
        count += 1
    return count


def _spawn_reflection_shadow_guides(context: LightingQualityContext) -> int:
    room = context.room
    half_w = room.width / 2.0
    half_d = room.depth / 2.0
    count = 0
    for index in range(3):
        y = -half_d * 0.30 + index * half_d * 0.30
        _cube(f"{context.label}_ReflectionCard_{index + 1}", unreal.Vector(room.x + half_w - 18.0, y, 128.0 + index * 24.0), unreal.Vector(0.016, 0.34, 0.22), material_path("GlassTeal"))
        _cube(f"{context.label}_ShadowCatcher_{index + 1}", unreal.Vector(room.x - half_w + 24.0, y + 26.0, 3.5), unreal.Vector(0.40, 0.24, 0.006), material_path("DeepShadow"))
        _cube(f"{context.label}_ContrastSwatch_{index + 1}", unreal.Vector(room.x - 22.0 + index * 22.0, half_d - 28.0, 118.0), unreal.Vector(0.09, 0.012, 0.05), prop_material_path(room))
        count += 3
    _cube(f"{context.label}_CompositionFrame_Left", unreal.Vector(room.x - half_w + 12.0, 0.0, room.height * 0.50), unreal.Vector(0.014, room.depth / 118.0, room.height / 132.0), material_path("BrassEdge"))
    _cube(f"{context.label}_CompositionFrame_Right", unreal.Vector(room.x + half_w - 12.0, 0.0, room.height * 0.50), unreal.Vector(0.014, room.depth / 118.0, room.height / 132.0), material_path("BrassEdge"))
    return count + 2


def _point(context: LightingQualityContext, offset: Offset) -> "unreal.Vector":
    return unreal.Vector(context.center.x + offset[0], context.center.y + offset[1], context.center.z + offset[2])


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
