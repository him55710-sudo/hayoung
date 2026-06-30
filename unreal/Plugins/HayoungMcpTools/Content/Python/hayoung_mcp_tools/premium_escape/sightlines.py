from __future__ import annotations

import math
from dataclasses import dataclass

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _point_light, _shape, _spawn

from .specs import LockSpec, RoomSpec
from .visuals import accent_material_path, material_path


@dataclass(frozen=True, slots=True)
class PathSegmentSpec:
    label: str
    start: "unreal.Vector"
    end: "unreal.Vector"
    material: str


def spawn_first_person_sightlines(room: RoomSpec) -> int:
    camera = _camera_location(room)
    target = _camera_target(room)
    count = _spawn_preview_camera(room, camera, target)
    nodes = _path_nodes(room)
    for index, node in enumerate(nodes):
        _spawn_path_node(room, index, node)
        count += 1
    for index in range(len(nodes) - 1):
        count += _spawn_path_segment(PathSegmentSpec(f"PE_Path_{room.prefix}_Segment_{index + 1:02d}", nodes[index], nodes[index + 1], material_path("BrassEdge")))
    _point_light(f"PE_Path_{room.prefix}_PlayerEye_Glow", target, unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0), 520.0, 360.0)
    return count + 1


def _spawn_preview_camera(room: RoomSpec, location: "unreal.Vector", target: "unreal.Vector") -> int:
    camera = _spawn(unreal.CameraActor, location, _look_at(location, target), f"PE_Camera_{room.prefix}_FirstPersonPreview")
    camera_component = camera.get_component_by_class(unreal.CameraComponent)
    if camera_component:
        camera_component.set_editor_property("field_of_view", 82.0)
    return 1


def _path_nodes(room: RoomSpec) -> tuple["unreal.Vector", ...]:
    first_lock = room.locks[0]
    second_lock = room.locks[1]
    return (
        unreal.Vector(room.x - room.width * 0.34, -room.depth * 0.38, 4.0),
        _lock_focus(room, first_lock),
        unreal.Vector(room.x, 0.0, 4.0),
        _lock_focus(room, second_lock),
        _door_focus(room),
    )


def _spawn_path_node(room: RoomSpec, index: int, location: "unreal.Vector") -> None:
    node = _shape(f"PE_Path_{room.prefix}_Waypoint_{index + 1:02d}", "Cylinder", location, unreal.Vector(0.22, 0.22, 0.018), accent_material_path(room))
    node.set_actor_rotation(unreal.Rotator(0.0, 0.0, 0.0), False)


def _spawn_path_segment(spec: PathSegmentSpec) -> int:
    center = unreal.Vector((spec.start.x + spec.end.x) / 2.0, (spec.start.y + spec.end.y) / 2.0, 2.0)
    length = math.hypot(spec.end.x - spec.start.x, spec.end.y - spec.start.y)
    actor = _spawn(unreal.StaticMeshActor, center, _yaw_rotation(spec.start, spec.end), spec.label)
    actor.static_mesh_component.set_static_mesh(unreal.load_asset("/Engine/BasicShapes/Cube.Cube"))
    actor.set_actor_scale3d(unreal.Vector(length / 100.0, 0.045, 0.012))
    material = unreal.load_asset(spec.material)
    if material:
        actor.static_mesh_component.set_material(0, material)
    return 1


def _camera_location(room: RoomSpec) -> "unreal.Vector":
    return unreal.Vector(room.x - room.width * 0.31, -room.depth * 0.39, 164.0)


def _camera_target(room: RoomSpec) -> "unreal.Vector":
    return unreal.Vector(room.x + room.width * 0.08, room.depth * 0.05, 132.0)


def _lock_focus(room: RoomSpec, lock: LockSpec) -> "unreal.Vector":
    return unreal.Vector(room.x + lock.rel_x, lock.rel_y - 95.0, 4.0)


def _door_focus(room: RoomSpec) -> "unreal.Vector":
    if room.prefix.endswith("HeavenVault"):
        return unreal.Vector(room.x, room.depth / 2.0 - 150.0, 4.0)
    return unreal.Vector(room.x + room.width / 2.0 - 78.0, room.depth / 2.0 - 70.0, 4.0)


def _yaw_rotation(start: "unreal.Vector", end: "unreal.Vector") -> "unreal.Rotator":
    yaw = math.degrees(math.atan2(end.y - start.y, end.x - start.x))
    return unreal.Rotator(0.0, yaw, 0.0)


def _look_at(start: "unreal.Vector", end: "unreal.Vector") -> "unreal.Rotator":
    yaw = math.degrees(math.atan2(end.y - start.y, end.x - start.x))
    planar = math.hypot(end.x - start.x, end.y - start.y)
    pitch = math.degrees(math.atan2(end.z - start.z, planar))
    return unreal.Rotator(pitch, yaw, 0.0)
