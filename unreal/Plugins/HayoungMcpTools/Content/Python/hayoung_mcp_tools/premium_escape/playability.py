from __future__ import annotations

import math
from dataclasses import dataclass

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .specs import LockSpec, RoomSpec
from .visuals import accent_material_path, material_path


@dataclass(frozen=True, slots=True)
class RouteNode:
    name: str
    location: "unreal.Vector"


@dataclass(frozen=True, slots=True)
class RouteSegment:
    label: str
    start: "unreal.Vector"
    end: "unreal.Vector"


@dataclass(frozen=True, slots=True)
class ReachTarget:
    label: str
    location: "unreal.Vector"
    caption: str


def spawn_room_playability(room: RoomSpec) -> int:
    nodes = _route_nodes(room)
    count = _spawn_route_nodes(room, nodes)
    for index in range(len(nodes) - 1):
        count += _spawn_route_segment(room, RouteSegment(f"PE_Playability_{room.prefix}_RouteSegment_{index + 1:02d}", nodes[index].location, nodes[index + 1].location))
    for target in _reach_targets(room):
        count += _spawn_reach_target(room, target)
    count += _spawn_door_clearance(room)
    return count


def _spawn_route_nodes(room: RoomSpec, nodes: tuple[RouteNode, ...]) -> int:
    for index, node in enumerate(nodes):
        label = f"PE_Playability_{room.prefix}_StandZone_{index + 1:02d}_{node.name}"
        _shape(label, "Cylinder", node.location, unreal.Vector(0.31, 0.31, 0.012), accent_material_path(room))
        _text(f"{label}_Caption", node.name, unreal.Vector(node.location.x, node.location.y - 18.0, node.location.z + 24.0), unreal.Rotator(0.0, 0.0, 0.0), 4.8)
    return len(nodes) * 2


def _spawn_route_segment(room: RoomSpec, segment: RouteSegment) -> int:
    center = unreal.Vector((segment.start.x + segment.end.x) / 2.0, (segment.start.y + segment.end.y) / 2.0, 3.0)
    length = math.hypot(segment.end.x - segment.start.x, segment.end.y - segment.start.y)
    actor = _cube(segment.label, center, unreal.Vector(max(0.28, length / 100.0), 0.075, 0.010), material_path("GlassTeal"))
    actor.set_actor_rotation(_yaw_rotation(segment.start, segment.end), False)
    _point_light(f"{segment.label}_FloorReadability", center, _accent(room), 85.0, 125.0)
    return 2


def _spawn_reach_target(room: RoomSpec, target: ReachTarget) -> int:
    _shape(target.label, "Sphere", target.location, unreal.Vector(0.18, 0.18, 0.18), material_path("HeavenPearl"))
    _cube(f"{target.label}_ArmLengthBand", unreal.Vector(target.location.x, target.location.y - 26.0, target.location.z - 12.0), unreal.Vector(0.42, 0.016, 0.018), accent_material_path(room))
    _text(f"{target.label}_Caption", target.caption, unreal.Vector(target.location.x, target.location.y - 35.0, target.location.z + 24.0), unreal.Rotator(0.0, 0.0, 0.0), 4.7)
    return 3


def _spawn_door_clearance(room: RoomSpec) -> int:
    door = _door_focus(room)
    label = f"PE_Playability_{room.prefix}_DoorClearance"
    _cube(f"{label}_NoBlockLane", door, unreal.Vector(0.62, 0.34, 0.012), material_path("DeepShadow"))
    _cube(f"{label}_SwingSafeArc", unreal.Vector(door.x + 38.0, door.y - 46.0, door.z + 8.0), unreal.Vector(0.36, 0.018, 0.018), material_path("RoseGlow"))
    _shape(f"{label}_ExitStandPoint", "Cylinder", unreal.Vector(door.x - 40.0, door.y - 74.0, door.z), unreal.Vector(0.24, 0.24, 0.014), accent_material_path(room))
    _text(f"{label}_Caption", "문 열림 반경 확보 / 끼이익 SFX 확인 지점", unreal.Vector(door.x, door.y - 88.0, door.z + 44.0), unreal.Rotator(0.0, 0.0, 0.0), 5.2)
    return 4


def _route_nodes(room: RoomSpec) -> tuple[RouteNode, ...]:
    return (
        RouteNode("ENTRY", unreal.Vector(room.x - room.width * 0.34, -room.depth * 0.38, 4.0)),
        RouteNode("SEARCH", unreal.Vector(room.x - room.width * 0.16, -room.depth * 0.16, 4.0)),
        RouteNode("LOCK_A", _lock_stand(room, room.locks[0])),
        RouteNode("LOCK_B", _lock_stand(room, room.locks[1])),
        RouteNode("EXIT", _door_focus(room)),
    )


def _reach_targets(room: RoomSpec) -> tuple[ReachTarget, ...]:
    return (
        ReachTarget(f"PE_Playability_{room.prefix}_Reach_{room.locks[0].kind.value}", _lock_reach(room, room.locks[0]), room.locks[0].motion),
        ReachTarget(f"PE_Playability_{room.prefix}_Reach_{room.locks[1].kind.value}", _lock_reach(room, room.locks[1]), room.locks[1].motion),
        ReachTarget(f"PE_Playability_{room.prefix}_Reach_RewardKey", unreal.Vector(room.x + room.width * 0.30, room.depth * 0.34, 92.0), "보상 키를 눈높이 아래에서 집는다"),
    )


def _lock_stand(room: RoomSpec, lock: LockSpec) -> "unreal.Vector":
    return unreal.Vector(room.x + lock.rel_x, lock.rel_y - 156.0, 4.0)


def _lock_reach(room: RoomSpec, lock: LockSpec) -> "unreal.Vector":
    return unreal.Vector(room.x + lock.rel_x, lock.rel_y - 92.0, 126.0)


def _door_focus(room: RoomSpec) -> "unreal.Vector":
    if room.prefix.endswith("HeavenVault"):
        return unreal.Vector(room.x, room.depth / 2.0 - 150.0, 4.0)
    return unreal.Vector(room.x + room.width / 2.0 - 78.0, room.depth / 2.0 - 70.0, 4.0)


def _yaw_rotation(start: "unreal.Vector", end: "unreal.Vector") -> "unreal.Rotator":
    return unreal.Rotator(0.0, math.degrees(math.atan2(end.y - start.y, end.x - start.x)), 0.0)


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
