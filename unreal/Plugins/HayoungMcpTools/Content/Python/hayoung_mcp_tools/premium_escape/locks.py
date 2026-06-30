from __future__ import annotations

from typing import assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .level_ops import color
from .specs import LockKind, LockSpec, RoomSpec


def spawn_lock_station(room: RoomSpec, lock: LockSpec) -> int:
    base = unreal.Vector(room.x + lock.rel_x, lock.rel_y, 72.0)
    accent = color(room)
    _cube(f"{room.prefix}_{lock.kind}_LockBody", base, unreal.Vector(0.72, 0.20, 0.52))
    _text(f"{room.prefix}_{lock.kind}_LockTitle", lock.title, unreal.Vector(base.x, base.y - 30.0, 136.0), unreal.Rotator(0.0, 0.0, 0.0), 15.0)
    _text(f"{room.prefix}_{lock.kind}_ClueLogic", lock.clue, unreal.Vector(base.x, base.y - 54.0, 112.0), unreal.Rotator(0.0, 0.0, 0.0), 11.0)
    _text(f"{room.prefix}_{lock.kind}_UnlockMotion", lock.motion, unreal.Vector(base.x, base.y + 36.0, 28.0), unreal.Rotator(0.0, 0.0, 0.0), 10.0)
    _point_light(f"{room.prefix}_{lock.kind}_Feedback_LED", unreal.Vector(base.x, base.y - 8.0, 118.0), accent, 360.0, 180.0)
    return 5 + _spawn_lock_detail(room, lock, base)


def _spawn_lock_detail(room: RoomSpec, lock: LockSpec, base: "unreal.Vector") -> int:
    match lock.kind:
        case LockKind.COMBINATION:
            return _spawn_combination(room, lock, base)
        case LockKind.DIRECTION:
            return _spawn_direction(room, lock, base)
        case LockKind.KEYPAD:
            return _spawn_keypad(room, lock, base)
        case LockKind.KEYED_PADLOCK:
            return _spawn_keyed(room, lock, base)
        case LockKind.MAGNETIC:
            return _spawn_magnetic(room, lock, base)
        case LockKind.BUTTON_SEQUENCE:
            return _spawn_buttons(room, lock, base)
        case LockKind.LETTER:
            return _spawn_letters(room, lock, base)
        case LockKind.SAFE_DIAL:
            return _spawn_safe(room, lock, base)
        case unreachable:
            assert_never(unreachable)


def _spawn_combination(room: RoomSpec, lock: LockSpec, base: "unreal.Vector") -> int:
    for index, digit in enumerate(("0", "5", "0", "0")):
        _shape(f"{room.prefix}_{lock.kind}_Dial_{index + 1}_{digit}", "Cylinder", unreal.Vector(base.x - 27.0 + index * 18.0, base.y - 18.0, 78.0), unreal.Vector(0.09, 0.09, 0.11))
    _cube(f"{room.prefix}_{lock.kind}_Shackle_Start", unreal.Vector(base.x, base.y - 17.0, 112.0), unreal.Vector(0.48, 0.035, 0.08))
    _cube(f"{room.prefix}_{lock.kind}_Shackle_Open_Ghost", unreal.Vector(base.x, base.y - 17.0, 144.0), unreal.Vector(0.48, 0.025, 0.04))
    return 6


def _spawn_direction(room: RoomSpec, lock: LockSpec, base: "unreal.Vector") -> int:
    for label, dx, dz in (("UP", 0.0, 20.0), ("DOWN", 0.0, -20.0), ("LEFT", -24.0, 0.0), ("RIGHT", 24.0, 0.0)):
        _text(f"{room.prefix}_{lock.kind}_{label}_Button", label, unreal.Vector(base.x + dx, base.y - 22.0, 92.0 + dz), unreal.Rotator(0.0, 0.0, 0.0), 10.0)
    _cube(f"{room.prefix}_{lock.kind}_Latch_Depress_Path", unreal.Vector(base.x, base.y - 18.0, 52.0), unreal.Vector(0.52, 0.018, 0.04))
    return 5


def _spawn_keypad(room: RoomSpec, lock: LockSpec, base: "unreal.Vector") -> int:
    count = 0
    for row in range(3):
        for column in range(3):
            digit = row * 3 + column + 1
            _text(f"{room.prefix}_{lock.kind}_Key_{digit}", str(digit), unreal.Vector(base.x - 24.0 + column * 24.0, base.y - 22.0, 104.0 - row * 19.0), unreal.Rotator(0.0, 0.0, 0.0), 12.0)
            count += 1
    _cube(f"{room.prefix}_{lock.kind}_Bolt_Retract_Ghost", unreal.Vector(base.x + 54.0, base.y - 18.0, 76.0), unreal.Vector(0.38, 0.018, 0.035))
    return count + 1


def _spawn_keyed(room: RoomSpec, lock: LockSpec, base: "unreal.Vector") -> int:
    _shape(f"{room.prefix}_{lock.kind}_Key_Ring", "Cylinder", unreal.Vector(base.x - 38.0, base.y - 19.0, 92.0), unreal.Vector(0.12, 0.12, 0.035))
    _cube(f"{room.prefix}_{lock.kind}_Key_Blade_Insert_Path", unreal.Vector(base.x - 8.0, base.y - 20.0, 89.0), unreal.Vector(0.32, 0.018, 0.025))
    _cube(f"{room.prefix}_{lock.kind}_Hasp_Drop_End", unreal.Vector(base.x + 44.0, base.y - 18.0, 54.0), unreal.Vector(0.08, 0.018, 0.34))
    return 3


def _spawn_magnetic(room: RoomSpec, lock: LockSpec, base: "unreal.Vector") -> int:
    _shape(f"{room.prefix}_{lock.kind}_Magnet_Puck", "Cylinder", unreal.Vector(base.x - 34.0, base.y - 20.0, 96.0), unreal.Vector(0.16, 0.16, 0.05))
    _cube(f"{room.prefix}_{lock.kind}_Sensor_Hotspot", unreal.Vector(base.x + 28.0, base.y - 20.0, 96.0), unreal.Vector(0.18, 0.018, 0.18))
    _cube(f"{room.prefix}_{lock.kind}_Relay_Open_Path", unreal.Vector(base.x, base.y - 22.0, 56.0), unreal.Vector(0.58, 0.014, 0.028))
    return 3


def _spawn_buttons(room: RoomSpec, lock: LockSpec, base: "unreal.Vector") -> int:
    for index, label in enumerate(("PINK", "GREEN", "BLUE", "GOLD")):
        _text(f"{room.prefix}_{lock.kind}_{label}_Button", label, unreal.Vector(base.x - 38.0 + index * 26.0, base.y - 20.0, 92.0), unreal.Rotator(0.0, 0.0, 0.0), 8.0)
    _cube(f"{room.prefix}_{lock.kind}_Success_Sweep_Light_Path", unreal.Vector(base.x, base.y - 19.0, 119.0), unreal.Vector(0.68, 0.014, 0.025))
    return 5


def _spawn_letters(room: RoomSpec, lock: LockSpec, base: "unreal.Vector") -> int:
    for index, letter in enumerate(("H", "Y", "S")):
        _text(f"{room.prefix}_{lock.kind}_LetterDrum_{index + 1}_{letter}", letter, unreal.Vector(base.x - 22.0 + index * 22.0, base.y - 20.0, 94.0), unreal.Rotator(0.0, 0.0, 0.0), 16.0)
    _cube(f"{room.prefix}_{lock.kind}_Drum_Roll_Ghost", unreal.Vector(base.x, base.y - 18.0, 118.0), unreal.Vector(0.50, 0.014, 0.028))
    return 4


def _spawn_safe(room: RoomSpec, lock: LockSpec, base: "unreal.Vector") -> int:
    _shape(f"{room.prefix}_{lock.kind}_Rotary_Dial", "Cylinder", unreal.Vector(base.x, base.y - 23.0, 96.0), unreal.Vector(0.22, 0.22, 0.06))
    _cube(f"{room.prefix}_{lock.kind}_Door_Closed", unreal.Vector(base.x + 42.0, base.y - 18.0, 78.0), unreal.Vector(0.08, 0.018, 0.42))
    _cube(f"{room.prefix}_{lock.kind}_Door_Open_End", unreal.Vector(base.x + 74.0, base.y - 58.0, 78.0), unreal.Vector(0.08, 0.018, 0.42))
    return 3
