from __future__ import annotations

from collections.abc import Mapping
from typing import TypeAlias, assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _point_light, _spawn, _text

from .escape_cafe_props import EscapeCafeProp, PropKind, REAL_ESCAPE_PROP_PLANS
from .level_ops import color
from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

AudioAssets: TypeAlias = Mapping[str, str]
MotionSpec: TypeAlias = tuple["unreal.Vector", "unreal.Rotator"]


def spawn_room_runtime_escape_cafe_props(room: RoomSpec, audio_assets: AudioAssets) -> int:
    prop_class = unreal.load_class(None, "/Script/Hayoung500.HYInteractablePropActor")
    if not prop_class:
        return 0
    count = 0
    for index, prop in enumerate(_props_for(room), start=1):
        actor = _spawn(prop_class, _location(room, prop), label=runtime_escape_prop_label(room, index, prop))
        actor.set_actor_scale3d(_scale_for(prop.kind))
        _set_mesh(actor, _mesh_for(prop.kind))
        _set_material(actor, _material_for(room, prop.kind))
        motion_offset, motion_rotation = _motion_for(prop.kind)
        actor.set_editor_property("interaction_prompt", prop.cue)
        actor.set_editor_property("reward_key_id", f"{room.prefix}_runtime_real_prop_{index:02d}_checked")
        actor.set_editor_property("interaction_sound", _sound(audio_assets, prop.sound_key))
        actor.set_editor_property("motion_offset", motion_offset)
        actor.set_editor_property("motion_rotation", motion_rotation)
        _text(f"{actor.get_actor_label()}_RuntimeCue", prop.cue, _text_location(actor), unreal.Rotator(0.0, 0.0, 0.0), 6.0)
        _point_light(f"{actor.get_actor_label()}_RuntimeUseGlow", _glow_location(actor), color(room), 260.0, 150.0)
        count += 3
    return count


def runtime_escape_prop_label(room: RoomSpec, index: int, prop: EscapeCafeProp) -> str:
    return f"PE_RuntimeRealEscapeProp_{room.prefix}_{index:02d}_{prop.kind}_{prop.name}_InteractableProp"


def _props_for(room: RoomSpec) -> tuple[EscapeCafeProp, ...]:
    for plan in REAL_ESCAPE_PROP_PLANS:
        if plan.room_prefix == room.prefix:
            return plan.props
    return ()


def _location(room: RoomSpec, prop: EscapeCafeProp) -> "unreal.Vector":
    return unreal.Vector(room.x + room.width * prop.x_ratio, room.depth * prop.y_ratio - 18.0, prop.z + 18.0)


def _mesh_for(kind: PropKind) -> str:
    match kind:
        case "hidden_panel" | "mechanical_lock" | "electronic_panel":
            return "Cube"
        case "key_cache" | "direction_route" | "finale_ritual":
            return "Cylinder"
        case unreachable:
            assert_never(unreachable)


def _scale_for(kind: PropKind) -> "unreal.Vector":
    match kind:
        case "hidden_panel":
            return unreal.Vector(0.38, 0.08, 0.16)
        case "key_cache":
            return unreal.Vector(0.18, 0.18, 0.08)
        case "mechanical_lock":
            return unreal.Vector(0.30, 0.13, 0.18)
        case "direction_route":
            return unreal.Vector(0.22, 0.22, 0.06)
        case "electronic_panel":
            return unreal.Vector(0.34, 0.06, 0.20)
        case "finale_ritual":
            return unreal.Vector(0.30, 0.30, 0.08)
        case unreachable:
            assert_never(unreachable)


def _motion_for(kind: PropKind) -> MotionSpec:
    match kind:
        case "hidden_panel":
            return unreal.Vector(0.0, -34.0, 12.0), unreal.Rotator(0.0, 0.0, 7.0)
        case "key_cache":
            return unreal.Vector(0.0, 0.0, 34.0), unreal.Rotator(0.0, 135.0, 0.0)
        case "mechanical_lock":
            return unreal.Vector(0.0, -18.0, 8.0), unreal.Rotator(0.0, 72.0, 0.0)
        case "direction_route":
            return unreal.Vector(0.0, -12.0, 0.0), unreal.Rotator(0.0, 0.0, 26.0)
        case "electronic_panel":
            return unreal.Vector(0.0, -10.0, -4.0), unreal.Rotator(-12.0, 0.0, 0.0)
        case "finale_ritual":
            return unreal.Vector(0.0, -26.0, 22.0), unreal.Rotator(0.0, 0.0, 45.0)
        case unreachable:
            assert_never(unreachable)


def _material_for(room: RoomSpec, kind: PropKind) -> str:
    match kind:
        case "hidden_panel" | "electronic_panel":
            return prop_material_path(room)
        case "key_cache" | "mechanical_lock":
            return material_path("BrassEdge")
        case "direction_route" | "finale_ritual":
            return accent_material_path(room)
        case unreachable:
            assert_never(unreachable)


def _set_mesh(actor: "unreal.Actor", mesh: str) -> None:
    component = actor.get_component_by_class(unreal.StaticMeshComponent)
    static_mesh = unreal.load_asset(f"/Engine/BasicShapes/{mesh}.{mesh}")
    if component and static_mesh:
        component.set_static_mesh(static_mesh)


def _set_material(actor: "unreal.Actor", material_path_value: str) -> None:
    material = unreal.load_asset(material_path_value)
    if material:
        for component in actor.get_components_by_class(unreal.StaticMeshComponent):
            component.set_material(0, material)


def _sound(audio_assets: AudioAssets, key: str) -> "unreal.SoundBase | None":
    asset_path = audio_assets.get(key)
    if not asset_path:
        return None
    return unreal.load_asset(asset_path)


def _text_location(actor: "unreal.Actor") -> "unreal.Vector":
    location = actor.get_actor_location()
    return unreal.Vector(location.x, location.y - 31.0, location.z + 44.0)


def _glow_location(actor: "unreal.Actor") -> "unreal.Vector":
    location = actor.get_actor_location()
    return unreal.Vector(location.x, location.y - 24.0, location.z + 38.0)
