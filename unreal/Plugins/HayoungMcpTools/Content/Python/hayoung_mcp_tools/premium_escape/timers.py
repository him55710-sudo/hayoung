from __future__ import annotations

from dataclasses import dataclass

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path


@dataclass(frozen=True, slots=True)
class TimerContext:
    room: RoomSpec
    label: str
    origin: "unreal.Vector"


def spawn_room_timer_system(room: RoomSpec) -> int:
    context = TimerContext(room, f"PE_Timer_{room.prefix}", _timer_location(room))
    return _spawn_countdown_display(context) + _spawn_pressure_markers(context) + _spawn_emergency_channel(context)


def _spawn_countdown_display(context: TimerContext) -> int:
    origin = context.origin
    _cube(f"{context.label}_CountdownFrame", origin, unreal.Vector(0.68, 0.034, 0.26), prop_material_path(context.room))
    _cube(f"{context.label}_CountdownScreen", unreal.Vector(origin.x, origin.y - 4.0, origin.z), unreal.Vector(0.58, 0.018, 0.18), material_path("DeepShadow"))
    _text(f"{context.label}_CountdownText", "60:00", unreal.Vector(origin.x, origin.y - 10.0, origin.z + 2.0), unreal.Rotator(0.0, 0.0, 0.0), 13.0)
    _cube(f"{context.label}_RoomTimerSync", unreal.Vector(origin.x + 44.0, origin.y - 6.0, origin.z - 20.0), unreal.Vector(0.16, 0.014, 0.026), accent_material_path(context.room))
    _point_light(f"{context.label}_TimerGlow", unreal.Vector(origin.x, origin.y - 48.0, origin.z + 12.0), _accent(context.room), 240.0, 190.0)
    return 5


def _spawn_pressure_markers(context: TimerContext) -> int:
    count = 0
    for index, minute in enumerate((45, 30, 15, 5)):
        marker = unreal.Vector(context.origin.x - 45.0 + index * 30.0, context.origin.y - 18.0, context.origin.z - 36.0)
        _cube(f"{context.label}_MinuteTick_{minute:02d}", marker, unreal.Vector(0.16, 0.012, 0.044), material_path("BrassEdge"))
        _text(f"{context.label}_MinuteText_{minute:02d}", f"{minute}m", unreal.Vector(marker.x, marker.y - 8.0, marker.z + 9.0), unreal.Rotator(0.0, 0.0, 0.0), 3.6)
        count += 2
    _cube(f"{context.label}_FinalTenPressureRail", unreal.Vector(context.origin.x, context.origin.y - 20.0, context.origin.z - 54.0), unreal.Vector(0.64, 0.014, 0.018), material_path("RoseGlow"))
    _text(f"{context.label}_FinalTenCue", "10분 이하: 조명/음악 긴장도 상승", unreal.Vector(context.origin.x, context.origin.y - 28.0, context.origin.z - 70.0), unreal.Rotator(0.0, 0.0, 0.0), 4.2)
    return count + 2


def _spawn_emergency_channel(context: TimerContext) -> int:
    room = context.room
    half_w = room.width / 2.0
    half_d = room.depth / 2.0
    emergency = unreal.Vector(room.x + half_w - 86.0, -half_d + 72.0, 112.0)
    _cube(f"{context.label}_EmergencyPanel", emergency, unreal.Vector(0.32, 0.026, 0.23), material_path("DeepShadow"))
    _shape(f"{context.label}_EmergencyButton", "Cylinder", unreal.Vector(emergency.x - 20.0, emergency.y - 10.0, emergency.z + 6.0), unreal.Vector(0.075, 0.075, 0.030), material_path("RoseGlow"))
    _text(f"{context.label}_EmergencyText", "비상 호출 / 스태프 즉시 개방", unreal.Vector(emergency.x + 5.0, emergency.y - 10.0, emergency.z + 24.0), unreal.Rotator(0.0, 0.0, 0.0), 4.5)
    _cube(f"{context.label}_ExitMap", unreal.Vector(emergency.x, emergency.y - 8.0, emergency.z - 24.0), unreal.Vector(0.28, 0.014, 0.08), accent_material_path(room))
    _cube(f"{context.label}_StaffTimerSync", unreal.Vector((emergency.x + context.origin.x) / 2.0, half_d - 16.0, room.height - 34.0), unreal.Vector(max(0.28, room.width / 420.0), 0.014, 0.014), material_path("GlassTeal"))
    return 5


def _timer_location(room: RoomSpec) -> "unreal.Vector":
    return unreal.Vector(room.x + room.width * 0.20, -room.depth * 0.44, 204.0)


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
