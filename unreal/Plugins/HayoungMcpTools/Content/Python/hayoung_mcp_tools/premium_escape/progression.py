from __future__ import annotations

from dataclasses import dataclass

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .specs import LockSpec, RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path


@dataclass(frozen=True, slots=True)
class ProgressContext:
    room: RoomSpec
    label: str
    board_center: "unreal.Vector"


@dataclass(frozen=True, slots=True)
class LockProgress:
    context: ProgressContext
    lock: LockSpec
    index: int


def spawn_room_progress(room: RoomSpec) -> int:
    context = ProgressContext(room, f"PE_Progress_{room.prefix}", _board_center(room))
    count = _spawn_status_board(context)
    for index, lock in enumerate(room.locks):
        count += _spawn_lock_status(LockProgress(context, lock, index))
    count += _spawn_exit_feedback(context)
    count += _spawn_unlock_conduit(context)
    return count


def _spawn_status_board(context: ProgressContext) -> int:
    board = context.board_center
    _cube(f"{context.label}_BoardBack", board, unreal.Vector(1.05, 0.035, 0.72), prop_material_path(context.room))
    _cube(f"{context.label}_BoardGlass", unreal.Vector(board.x, board.y - 3.0, board.z + 1.0), unreal.Vector(0.96, 0.018, 0.62), material_path("GlassTeal"))
    _text(f"{context.label}_BoardTitle", "ROOM PROGRESS", unreal.Vector(board.x, board.y - 8.0, board.z + 36.0), unreal.Rotator(0.0, 0.0, 0.0), 11.0)
    _text(f"{context.label}_BoardSubtitle", context.room.title, unreal.Vector(board.x, board.y - 8.0, board.z + 18.0), unreal.Rotator(0.0, 0.0, 0.0), 8.0)
    _point_light(f"{context.label}_BoardSoftGlow", unreal.Vector(board.x, board.y - 42.0, board.z + 30.0), _accent(context.room), 260.0, 210.0)
    return 5


def _spawn_lock_status(progress: LockProgress) -> int:
    row = _row_location(progress)
    label = f"{progress.context.label}_Lock{progress.index + 1:02d}"
    _cube(f"{label}_StatusPlate", row, unreal.Vector(0.78, 0.024, 0.13), accent_material_path(progress.context.room))
    _shape(f"{label}_LockedAmberLamp", "Sphere", unreal.Vector(row.x - 35.0, row.y - 8.0, row.z + 3.0), unreal.Vector(0.065, 0.065, 0.065), material_path("BrassEdge"))
    _shape(f"{label}_SolvedGreenLamp", "Sphere", unreal.Vector(row.x - 18.0, row.y - 8.0, row.z + 3.0), unreal.Vector(0.05, 0.05, 0.05), material_path("GlassTeal"))
    _cube(f"{label}_ProgressRail", unreal.Vector(row.x + 25.0, row.y - 8.0, row.z - 16.0), unreal.Vector(0.34, 0.012, 0.018), material_path("DeepShadow"))
    _cube(f"{label}_CurrentNeedle", unreal.Vector(row.x + 3.0 + progress.index * 24.0, row.y - 10.0, row.z - 15.0), unreal.Vector(0.025, 0.018, 0.06), material_path("RoseGlow"))
    _text(f"{label}_Title", progress.lock.title, unreal.Vector(row.x + 8.0, row.y - 9.0, row.z + 8.0), unreal.Rotator(0.0, 0.0, 0.0), 6.0)
    _text(f"{label}_Motion", progress.lock.motion, unreal.Vector(row.x + 10.0, row.y - 9.0, row.z - 6.0), unreal.Rotator(0.0, 0.0, 0.0), 4.8)
    _point_light(f"{label}_SolvedPulse", unreal.Vector(row.x - 18.0, row.y - 30.0, row.z + 8.0), _accent(progress.context.room), 130.0, 120.0)
    return 8


def _spawn_exit_feedback(context: ProgressContext) -> int:
    room = context.room
    x = room.x + room.width * 0.34
    y = room.depth * 0.38
    _shape(f"{context.label}_RewardKeyPedestal", "Cylinder", unreal.Vector(x - 42.0, y, 38.0), unreal.Vector(0.18, 0.18, 0.18), prop_material_path(room))
    _shape(f"{context.label}_RewardKeyGlow", "Sphere", unreal.Vector(x - 42.0, y - 4.0, 77.0), unreal.Vector(0.075, 0.075, 0.075), material_path("RoseGlow"))
    _cube(f"{context.label}_ExitReadyPanel", unreal.Vector(x + 18.0, y, 118.0), unreal.Vector(0.46, 0.028, 0.22), accent_material_path(room))
    _text(f"{context.label}_ExitReadyText", "두 장치 해제 -> 다음 문 활성화", unreal.Vector(x + 18.0, y - 8.0, 124.0), unreal.Rotator(0.0, 0.0, 0.0), 6.2)
    _point_light(f"{context.label}_ExitReadyLamp", unreal.Vector(x + 18.0, y - 38.0, 130.0), _accent(room), 360.0, 230.0)
    return 5


def _spawn_unlock_conduit(context: ProgressContext) -> int:
    room = context.room
    count = 0
    for index in range(4):
        x = room.x - room.width * 0.18 + index * room.width * 0.12
        y = room.depth * 0.43
        z = 96.0 + index * 8.0
        _cube(f"{context.label}_DoorSignalStrip_{index + 1:02d}", unreal.Vector(x, y, z), unreal.Vector(0.30, 0.018, 0.025), material_path("RoseGlow"))
        count += 1
    _text(f"{context.label}_DoorSignalCue", "LOCKS -> KEY -> EXIT", unreal.Vector(room.x + room.width * 0.10, room.depth * 0.43 - 12.0, 146.0), unreal.Rotator(0.0, 0.0, 0.0), 7.0)
    return count + 1


def _board_center(room: RoomSpec) -> "unreal.Vector":
    return unreal.Vector(room.x - room.width * 0.30, -room.depth * 0.42, 190.0)


def _row_location(progress: LockProgress) -> "unreal.Vector":
    board = progress.context.board_center
    return unreal.Vector(board.x, board.y - 4.0, board.z - 12.0 - progress.index * 36.0)


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
