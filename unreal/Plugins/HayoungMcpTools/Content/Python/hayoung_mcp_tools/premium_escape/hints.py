from __future__ import annotations

from dataclasses import dataclass
from typing import Final

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path


@dataclass(frozen=True, slots=True)
class HintPenalty:
    step: int
    label: str
    detail: str


@dataclass(frozen=True, slots=True)
class HintContext:
    room: RoomSpec
    label: str
    station: "unreal.Vector"


HINT_PENALTIES: Final[tuple[HintPenalty, ...]] = (
    HintPenalty(1, "힌트 1", "바나나우유 영수증"),
    HintPenalty(2, "힌트 2", "설빙 계약서"),
    HintPenalty(3, "힌트 3", "다음 방탈출 데이트권"),
)


def spawn_room_hint_system(room: RoomSpec) -> int:
    context = HintContext(room, f"PE_Hint_{room.prefix}", _station_location(room))
    return _spawn_hint_station(context) + _spawn_penalty_ladder(context) + _spawn_staff_channel(context)


def _spawn_hint_station(context: HintContext) -> int:
    station = context.station
    _cube(f"{context.label}_HintPhoneDock", station, unreal.Vector(0.40, 0.16, 0.10), prop_material_path(context.room))
    _cube(f"{context.label}_TabletScreen", unreal.Vector(station.x, station.y - 17.0, station.z + 18.0), unreal.Vector(0.34, 0.020, 0.20), material_path("GlassTeal"))
    _cube(f"{context.label}_RequestButton", unreal.Vector(station.x - 28.0, station.y - 22.0, station.z + 6.0), unreal.Vector(0.10, 0.030, 0.045), accent_material_path(context.room))
    _shape(f"{context.label}_CallLamp", "Sphere", unreal.Vector(station.x + 30.0, station.y - 22.0, station.z + 18.0), unreal.Vector(0.050, 0.050, 0.050), material_path("RoseGlow"))
    _text(f"{context.label}_InstructionText", "힌트 요청 -> 페널티 선택 -> 스태프 답변 수신", unreal.Vector(station.x, station.y - 30.0, station.z + 42.0), unreal.Rotator(0.0, 0.0, 0.0), 5.0)
    _point_light(f"{context.label}_TabletGlow", unreal.Vector(station.x, station.y - 52.0, station.z + 34.0), _accent(context.room), 185.0, 155.0)
    return 6


def _spawn_penalty_ladder(context: HintContext) -> int:
    count = 0
    for index, penalty in enumerate(HINT_PENALTIES):
        origin = unreal.Vector(context.station.x - 50.0 + index * 50.0, context.station.y - 20.0, context.station.z - 24.0)
        _cube(f"{context.label}_PenaltyStep_{penalty.step:02d}", origin, unreal.Vector(0.24, 0.020, 0.060), material_path("BrassEdge"))
        _text(f"{context.label}_PenaltyLabel_{penalty.step:02d}", penalty.label, unreal.Vector(origin.x, origin.y - 10.0, origin.z + 11.0), unreal.Rotator(0.0, 0.0, 0.0), 3.8)
        _text(f"{context.label}_PenaltyDetail_{penalty.step:02d}", penalty.detail, unreal.Vector(origin.x, origin.y - 10.0, origin.z - 5.0), unreal.Rotator(0.0, 0.0, 0.0), 3.4)
        count += 3
    return count


def _spawn_staff_channel(context: HintContext) -> int:
    room = context.room
    cctv = unreal.Vector(room.x + room.width * 0.36, room.depth * 0.42, room.height - 62.0)
    _shape(f"{context.label}_CctvDome", "Sphere", cctv, unreal.Vector(0.14, 0.14, 0.09), material_path("DeepShadow"))
    _shape(f"{context.label}_MicCapsule", "Cylinder", unreal.Vector(cctv.x - 34.0, cctv.y - 6.0, cctv.z - 18.0), unreal.Vector(0.055, 0.055, 0.075), prop_material_path(room))
    _cube(f"{context.label}_SpeakerReplyPanel", unreal.Vector(context.station.x + 58.0, context.station.y - 22.0, context.station.z + 16.0), unreal.Vector(0.18, 0.018, 0.13), material_path("DeepShadow"))
    _cube(f"{context.label}_SignalCable", unreal.Vector((context.station.x + cctv.x) / 2.0, room.depth * 0.39, room.height - 30.0), unreal.Vector(max(0.32, room.width / 360.0), 0.018, 0.018), material_path("RoseGlow"))
    _text(f"{context.label}_StaffReplyCue", "CCTV/마이크 확인 후 모니터에 단계별 힌트 표시", unreal.Vector(context.station.x + 35.0, context.station.y - 34.0, context.station.z + 58.0), unreal.Rotator(0.0, 0.0, 0.0), 4.2)
    return 5


def _station_location(room: RoomSpec) -> "unreal.Vector":
    return unreal.Vector(room.x - room.width * 0.36, room.depth * 0.36, 96.0)


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
