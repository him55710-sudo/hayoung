from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import TypeAlias

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _spawn, _text

from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

AudioAssets: TypeAlias = Mapping[str, str]
Offset: TypeAlias = tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class OperationsContext:
    room: RoomSpec
    label: str
    station: "unreal.Vector"


def spawn_room_operations(room: RoomSpec, audio_assets: AudioAssets) -> int:
    context = OperationsContext(room, f"PE_Operations_{room.prefix}", _station(room))
    count = _spawn_staff_touchpoints(context, audio_assets)
    count += _spawn_safety_devices(context)
    count += _spawn_reset_controls(context)
    count += _spawn_maintenance_traces(context)
    return count


def _spawn_staff_touchpoints(context: OperationsContext, audio_assets: AudioAssets) -> int:
    room = context.room
    station = context.station
    _cube(f"{context.label}_IntercomBase", station, unreal.Vector(0.34, 0.024, 0.20), prop_material_path(room))
    _cube(f"{context.label}_IntercomScreen", _point(context, (0.0, -5.0, 2.0)), unreal.Vector(0.26, 0.014, 0.12), material_path("DeepShadow"))
    _shape(f"{context.label}_StaffSpeaker", "Cylinder", _point(context, (27.0, -9.0, 2.0)), unreal.Vector(0.052, 0.052, 0.032), material_path("BrassEdge"))
    _shape(f"{context.label}_StaffMic", "Cylinder", _point(context, (-28.0, -9.0, -4.0)), unreal.Vector(0.036, 0.036, 0.03), material_path("GlassTeal"))
    _shape(f"{context.label}_CCTVBody", "Sphere", unreal.Vector(room.x + room.width * 0.38, room.depth * 0.42, room.height - 54.0), unreal.Vector(0.12, 0.12, 0.075), material_path("DeepShadow"))
    _shape(f"{context.label}_CCTVRecordLamp", "Sphere", unreal.Vector(room.x + room.width * 0.38 - 16.0, room.depth * 0.42 - 5.0, room.height - 55.0), unreal.Vector(0.026, 0.026, 0.026), material_path("RoseGlow"))
    _cube(f"{context.label}_OperatorSignalCable", unreal.Vector((station.x + room.x) / 2.0, room.depth * 0.43, room.height - 28.0), unreal.Vector(max(0.42, room.width / 350.0), 0.012, 0.012), material_path("GlassTeal"))
    _cube(f"{context.label}_HintQueueToken", _point(context, (-38.0, -10.0, -28.0)), unreal.Vector(0.11, 0.012, 0.05), accent_material_path(room))
    _shape(f"{context.label}_HintReplyLight", "Sphere", _point(context, (38.0, -10.0, -28.0)), unreal.Vector(0.026, 0.026, 0.026), material_path("GlassTeal"))
    _text(f"{context.label}_OperationsLabel", "스태프 호출 / CCTV / 힌트 응답", _point(context, (0.0, -16.0, 32.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.4)
    return _spawn_operation_audio(context, audio_assets) + 10


def _spawn_safety_devices(context: OperationsContext) -> int:
    room = context.room
    half_w = room.width / 2.0
    half_d = room.depth / 2.0
    origin = unreal.Vector(room.x + half_w - 76.0, -half_d + 92.0, 118.0)
    _cube(f"{context.label}_EmergencyReleaseBox", origin, unreal.Vector(0.28, 0.022, 0.22), material_path("DeepShadow"))
    _shape(f"{context.label}_EmergencyPullRing", "Cylinder", unreal.Vector(origin.x - 20.0, origin.y - 10.0, origin.z + 2.0), unreal.Vector(0.056, 0.056, 0.026), material_path("RoseGlow"))
    _cube(f"{context.label}_PanicKeyGlass", unreal.Vector(origin.x + 16.0, origin.y - 8.0, origin.z - 26.0), unreal.Vector(0.15, 0.012, 0.08), material_path("GlassTeal"))
    _shape(f"{context.label}_PanicKeyCylinder", "Cylinder", unreal.Vector(origin.x + 16.0, origin.y - 13.0, origin.z - 26.0), unreal.Vector(0.022, 0.022, 0.095), material_path("BrassEdge"))
    _shape(f"{context.label}_FireExtinguisherBody", "Cylinder", unreal.Vector(origin.x - 54.0, origin.y - 3.0, origin.z - 56.0), unreal.Vector(0.09, 0.09, 0.34), material_path("RoseGlow"))
    _shape(f"{context.label}_FireExtinguisherHose", "Cylinder", unreal.Vector(origin.x - 41.0, origin.y - 9.0, origin.z - 42.0), unreal.Vector(0.018, 0.018, 0.18), material_path("DeepShadow"))
    _cube(f"{context.label}_ExitTapeLeft", unreal.Vector(room.x - half_w + 52.0, -half_d + 28.0, 2.0), unreal.Vector(0.42, 0.025, 0.006), accent_material_path(room))
    _cube(f"{context.label}_ExitTapeRight", unreal.Vector(room.x + half_w - 52.0, -half_d + 28.0, 2.0), unreal.Vector(0.42, 0.025, 0.006), accent_material_path(room))
    _cube(f"{context.label}_MaglockStatusPanel", unreal.Vector(origin.x - 18.0, origin.y - 10.0, origin.z + 34.0), unreal.Vector(0.18, 0.012, 0.06), material_path("BrassEdge"))
    _shape(f"{context.label}_MaglockStatusLamp", "Sphere", unreal.Vector(origin.x + 12.0, origin.y - 14.0, origin.z + 34.0), unreal.Vector(0.023, 0.023, 0.023), material_path("GlassTeal"))
    for index in range(3):
        label_origin = unreal.Vector(origin.x - 46.0 + index * 38.0, origin.y - 12.0, origin.z + 64.0)
        _cube(f"{context.label}_NoForceLabel_{index + 1}", label_origin, unreal.Vector(0.15, 0.012, 0.052), material_path("HeavenPearl"))
        _text(f"{context.label}_NoForceText_{index + 1}", "파손금지", unreal.Vector(label_origin.x, label_origin.y - 7.0, label_origin.z + 2.0), unreal.Rotator(0.0, 0.0, 0.0), 2.8)
    return 16


def _spawn_reset_controls(context: OperationsContext) -> int:
    room = context.room
    board = unreal.Vector(room.x - room.width * 0.41, -room.depth * 0.42, 150.0)
    _cube(f"{context.label}_ResetChecklist", board, unreal.Vector(0.32, 0.018, 0.44), material_path("HeavenPearl"))
    _cube(f"{context.label}_ResetClipTop", unreal.Vector(board.x, board.y - 5.0, board.z + 25.0), unreal.Vector(0.22, 0.012, 0.028), material_path("BrassEdge"))
    _cube(f"{context.label}_ResetClipBottom", unreal.Vector(board.x, board.y - 5.0, board.z - 25.0), unreal.Vector(0.22, 0.012, 0.028), material_path("BrassEdge"))
    _cube(f"{context.label}_PropInventoryBoard", unreal.Vector(board.x + 48.0, board.y - 2.0, board.z - 6.0), unreal.Vector(0.26, 0.014, 0.30), prop_material_path(room))
    for index, item in enumerate(("KEY", "CARD", "UV", "MAG", "LOCK")):
        _cube(f"{context.label}_PropInventoryTag_{item}", unreal.Vector(board.x + 48.0, board.y - 8.0, board.z + 35.0 - index * 14.0), unreal.Vector(0.18, 0.01, 0.032), accent_material_path(room))
    _shape(f"{context.label}_ResetKeyHook", "Cylinder", unreal.Vector(board.x - 29.0, board.y - 8.0, board.z - 39.0), unreal.Vector(0.021, 0.021, 0.075), material_path("BrassEdge"))
    _shape(f"{context.label}_StaffKeyReplica", "Cylinder", unreal.Vector(board.x - 19.0, board.y - 11.0, board.z - 46.0), unreal.Vector(0.018, 0.018, 0.11), material_path("BrassEdge"))
    _shape(f"{context.label}_RoomReadyLamp", "Sphere", unreal.Vector(board.x + 78.0, board.y - 8.0, board.z + 38.0), unreal.Vector(0.025, 0.025, 0.025), material_path("GlassTeal"))
    _cube(f"{context.label}_QRWaiverPlaque", unreal.Vector(board.x - 44.0, board.y - 5.0, board.z + 45.0), unreal.Vector(0.12, 0.012, 0.06), material_path("DeepShadow"))
    _cube(f"{context.label}_PhoneLockerCue", unreal.Vector(board.x - 46.0, board.y - 5.0, board.z + 30.0), unreal.Vector(0.14, 0.012, 0.05), material_path("RoseGlow"))
    return 15


def _spawn_maintenance_traces(context: OperationsContext) -> int:
    room = context.room
    half_w = room.width / 2.0
    half_d = room.depth / 2.0
    hatch = unreal.Vector(room.x + half_w - 90.0, half_d - 18.0, 90.0)
    _cube(f"{context.label}_Maintenance_ServiceHatch", hatch, unreal.Vector(0.34, 0.022, 0.42), material_path("DeepShadow"))
    _cube(f"{context.label}_Maintenance_VentGrilleFrame", unreal.Vector(hatch.x - 58.0, hatch.y - 2.0, hatch.z + 62.0), unreal.Vector(0.26, 0.014, 0.10), material_path("BrassEdge"))
    for index in range(5):
        _cube(f"{context.label}_Maintenance_VentSlat_{index + 1}", unreal.Vector(hatch.x - 58.0, hatch.y - 7.0, hatch.z + 42.0 + index * 8.0), unreal.Vector(0.24, 0.008, 0.009), material_path("DeepShadow"))
    for index in range(4):
        _cube(f"{context.label}_Maintenance_CableLabel_{index + 1}", unreal.Vector(room.x - half_w + 58.0 + index * 34.0, half_d - 24.0, room.height - 38.0), unreal.Vector(0.11, 0.01, 0.032), accent_material_path(room))
    _cube(f"{context.label}_Maintenance_CableRun", unreal.Vector(room.x, half_d - 22.0, room.height - 32.0), unreal.Vector(room.width / 165.0, 0.014, 0.014), material_path("DeepShadow"))
    for index in range(4):
        x = room.x - 72.0 + index * 48.0
        _shape(f"{context.label}_Maintenance_FloorAccessScrew_{index + 1}", "Sphere", unreal.Vector(x, -half_d + 54.0, 3.0), unreal.Vector(0.018, 0.018, 0.018), material_path("BrassEdge"))
    for index in range(3):
        _cube(f"{context.label}_Maintenance_AcousticPanel_{index + 1}", unreal.Vector(room.x - half_w + 30.0, -half_d * 0.12 + index * 72.0, 180.0), unreal.Vector(0.018, 0.42, 0.28), prop_material_path(room))
    return 19


def _spawn_operation_audio(context: OperationsContext, audio_assets: AudioAssets) -> int:
    asset_path = audio_assets.get("sfx_phone_buzz", "")
    if not asset_path:
        return 0
    sound = unreal.load_asset(asset_path)
    actor = _spawn(unreal.AmbientSound, _point(context, (0.0, -19.0, 6.0)), label=f"{context.label}_StaffBuzzEmitter")
    component = actor.get_editor_property("audio_component")
    component.set_editor_property("sound", sound)
    component.set_editor_property("volume_multiplier", 0.12)
    component.set_editor_property("auto_activate", False)
    _point_light(f"{context.label}_StaffBuzzPulse", _point(context, (0.0, -34.0, 20.0)), _accent(context.room), 72.0, 92.0)
    return 2


def _station(room: RoomSpec) -> "unreal.Vector":
    return unreal.Vector(room.x - room.width * 0.34, room.depth * 0.40, 108.0)


def _point(context: OperationsContext, offset: Offset) -> "unreal.Vector":
    return unreal.Vector(context.station.x + offset[0], context.station.y + offset[1], context.station.z + offset[2])


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
