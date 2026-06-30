from __future__ import annotations

from dataclasses import dataclass
from typing import assert_never

from .specs import LockKind


@dataclass(frozen=True, slots=True)
class LockSoundProfile:
    input_key: str
    success_key: str
    fail_key: str


def lock_sound_profile(kind: LockKind) -> LockSoundProfile:
    match kind:
        case LockKind.COMBINATION:
            return LockSoundProfile("sfx_dial_tick", "sfx_lock_click", "sfx_error_buzz")
        case LockKind.DIRECTION:
            return LockSoundProfile("sfx_direction_press", "sfx_lock_click", "sfx_error_buzz")
        case LockKind.KEYPAD:
            return LockSoundProfile("sfx_keypad_beep", "sfx_lock_click", "sfx_error_buzz")
        case LockKind.KEYED_PADLOCK:
            return LockSoundProfile("sfx_key_turn", "sfx_key_turn", "sfx_error_buzz")
        case LockKind.MAGNETIC:
            return LockSoundProfile("sfx_magnetic_snap", "sfx_magnetic_snap", "sfx_error_buzz")
        case LockKind.BUTTON_SEQUENCE:
            return LockSoundProfile("sfx_button_press", "sfx_button_press", "sfx_error_buzz")
        case LockKind.LETTER:
            return LockSoundProfile("sfx_letter_roll", "sfx_lock_click", "sfx_error_buzz")
        case LockKind.SAFE_DIAL:
            return LockSoundProfile("sfx_dial_tick", "sfx_safe_open", "sfx_error_buzz")
        case unreachable:
            assert_never(unreachable)
