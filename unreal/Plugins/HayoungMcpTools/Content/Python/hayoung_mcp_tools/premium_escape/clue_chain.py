from __future__ import annotations

import math
from dataclasses import dataclass

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _spawn, _text

from .specs import LockSpec, RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path


@dataclass(frozen=True, slots=True)
class ClueChainSpec:
    room: RoomSpec
    lock: LockSpec
    index: int


@dataclass(frozen=True, slots=True)
class SegmentSpec:
    label: str
    start: "unreal.Vector"
    end: "unreal.Vector"
    material: str


def spawn_room_clue_chains(room: RoomSpec) -> int:
    count = 0
    for index, lock in enumerate(room.locks):
        count += _spawn_chain(ClueChainSpec(room, lock, index))
    return count


def _spawn_chain(spec: ClueChainSpec) -> int:
    source = _source_location(spec)
    decode = _decode_location(spec)
    lock = _lock_location(spec)
    label = _label(spec)
    _cube(f"{label}_ObservationPanel", source, unreal.Vector(0.40, 0.032, 0.22), prop_material_path(spec.room))
    _text(f"{label}_ObservationText", _observation_text(spec), unreal.Vector(source.x, source.y - 8.0, source.z + 2.0), unreal.Rotator(0.0, 0.0, 0.0), 7.0)
    _shape(f"{label}_DecodeLens", "Cylinder", decode, unreal.Vector(0.16, 0.16, 0.025), material_path("GlassTeal"))
    _text(f"{label}_DecodeText", _decode_text(spec), unreal.Vector(decode.x, decode.y - 9.0, decode.z + 23.0), unreal.Rotator(0.0, 0.0, 0.0), 7.0)
    _cube(f"{label}_InputTargetBadge", lock, unreal.Vector(0.34, 0.026, 0.15), accent_material_path(spec.room))
    _text(f"{label}_InputTargetText", spec.lock.title, unreal.Vector(lock.x, lock.y - 8.0, lock.z + 3.0), unreal.Rotator(0.0, 0.0, 0.0), 6.0)
    _spawn_segment(SegmentSpec(f"{label}_Route_A", source, decode, material_path("BrassEdge")))
    _spawn_segment(SegmentSpec(f"{label}_Route_B", decode, lock, material_path("RoseGlow")))
    _point_light(f"{label}_LogicPulse", unreal.Vector(decode.x, decode.y - 20.0, decode.z + 28.0), _accent(spec.room), 180.0, 190.0)
    return 9


def _spawn_segment(spec: SegmentSpec) -> None:
    center = unreal.Vector((spec.start.x + spec.end.x) / 2.0, (spec.start.y + spec.end.y) / 2.0, (spec.start.z + spec.end.z) / 2.0)
    length = math.hypot(spec.end.x - spec.start.x, spec.end.y - spec.start.y)
    actor = _spawn(unreal.StaticMeshActor, center, _yaw_rotation(spec.start, spec.end), spec.label)
    actor.static_mesh_component.set_static_mesh(unreal.load_asset("/Engine/BasicShapes/Cube.Cube"))
    actor.set_actor_scale3d(unreal.Vector(max(0.12, length / 100.0), 0.018, 0.018))
    material = unreal.load_asset(spec.material)
    if material:
        actor.static_mesh_component.set_material(0, material)


def _source_location(spec: ClueChainSpec) -> "unreal.Vector":
    side = -1.0 if spec.index == 0 else 1.0
    return unreal.Vector(spec.room.x + side * spec.room.width * 0.34, -spec.room.depth * 0.24 + spec.index * spec.room.depth * 0.20, 126.0)


def _decode_location(spec: ClueChainSpec) -> "unreal.Vector":
    return unreal.Vector(spec.room.x - 35.0 + spec.index * 70.0, -spec.room.depth * 0.02 + spec.index * 44.0, 118.0)


def _lock_location(spec: ClueChainSpec) -> "unreal.Vector":
    return unreal.Vector(spec.room.x + spec.lock.rel_x, spec.lock.rel_y - 92.0, 116.0)


def _yaw_rotation(start: "unreal.Vector", end: "unreal.Vector") -> "unreal.Rotator":
    return unreal.Rotator(0.0, math.degrees(math.atan2(end.y - start.y, end.x - start.x)), 0.0)


def _observation_text(spec: ClueChainSpec) -> str:
    return f"OBSERVE {spec.index + 1}: {spec.lock.clue}"


def _decode_text(spec: ClueChainSpec) -> str:
    return f"DECODE: {spec.lock.kind.value}"


def _label(spec: ClueChainSpec) -> str:
    return f"PE_ClueChain_{spec.room.prefix}_{spec.index + 1:02d}_{spec.lock.kind.value}"


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
