from __future__ import annotations

from typing import assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _shape, _text

from .specs import LockKind, LockSpec, RoomSpec


def spawn_room_interactions(room: RoomSpec) -> int:
    half_d = room.depth / 2.0
    count = 0
    _cube(f"PE_Interact_{room.prefix}_BGM_TriggerVolume", unreal.Vector(room.x, -half_d + 70.0, 88.0), unreal.Vector(room.width / 110.0, 0.42, 1.25))
    _text(f"PE_Interact_{room.prefix}_BGM_Label", f"입장 시 BGM: {room.ambient_key}", unreal.Vector(room.x, -half_d + 34.0, 178.0), unreal.Rotator(0.0, 0.0, 0.0), 13.0)
    count += 2
    for lock in room.locks:
        count += _spawn_lock_interaction(room, lock)
    return count


def _spawn_lock_interaction(room: RoomSpec, lock: LockSpec) -> int:
    base = unreal.Vector(room.x + lock.rel_x, lock.rel_y - 78.0, 92.0)
    sfx_key = _sfx_for_lock(lock)
    _cube(f"PE_Interact_{room.prefix}_{lock.kind}_UseTrigger", base, unreal.Vector(0.74, 0.32, 0.82))
    _text(f"PE_Interact_{room.prefix}_{lock.kind}_UsePrompt", f"E 사용 / {lock.title}", unreal.Vector(base.x, base.y - 44.0, 160.0), unreal.Rotator(0.0, 0.0, 0.0), 13.0)
    _shape(f"PE_Interact_{room.prefix}_{lock.kind}_InputSocket", "Cylinder", unreal.Vector(base.x - 58.0, base.y - 10.0, 98.0), unreal.Vector(0.13, 0.13, 0.05))
    _cube(f"PE_Interact_{room.prefix}_{lock.kind}_MotionStart", unreal.Vector(base.x + 44.0, base.y - 6.0, 86.0), unreal.Vector(0.20, 0.04, 0.05))
    _cube(f"PE_Interact_{room.prefix}_{lock.kind}_MotionEnd", unreal.Vector(base.x + 86.0, base.y - 6.0, 116.0), unreal.Vector(0.20, 0.04, 0.05))
    _text(f"PE_Interact_{room.prefix}_{lock.kind}_SfxCue", f"SFX: {sfx_key} / 성공 시 다음 단서 활성화", unreal.Vector(base.x, base.y + 52.0, 48.0), unreal.Rotator(0.0, 0.0, 0.0), 10.0)
    return 6


def _sfx_for_lock(lock: LockSpec) -> str:
    match lock.kind:
        case LockKind.COMBINATION:
            return "sfx_lock_click"
        case LockKind.DIRECTION:
            return "sfx_keypad_beep"
        case LockKind.KEYPAD:
            return "sfx_keypad_beep"
        case LockKind.KEYED_PADLOCK:
            return "sfx_key_pickup"
        case LockKind.MAGNETIC:
            return "sfx_lock_click"
        case LockKind.BUTTON_SEQUENCE:
            return "sfx_keypad_beep"
        case LockKind.LETTER:
            return "sfx_lock_click"
        case LockKind.SAFE_DIAL:
            return "sfx_safe_open"
        case unreachable:
            assert_never(unreachable)
