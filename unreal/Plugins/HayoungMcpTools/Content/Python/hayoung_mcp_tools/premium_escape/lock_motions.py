from __future__ import annotations

from dataclasses import dataclass
from typing import TypeAlias, assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .specs import LockKind, LockSpec, RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

Offset: TypeAlias = tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class MotionContext:
    room: RoomSpec
    lock: LockSpec
    index: int
    label: str
    origin: "unreal.Vector"


def spawn_room_lock_motions(room: RoomSpec) -> int:
    count = 0
    for index, lock in enumerate(room.locks):
        count += _spawn_motion_rig(_context(room, lock, index))
    return count


def _spawn_motion_rig(context: MotionContext) -> int:
    count = _spawn_base(context)
    count += _spawn_state_path(context)
    count += _spawn_kind_controls(context)
    return count


def _spawn_base(context: MotionContext) -> int:
    _cube(f"{context.label}_WorkbenchPlate", context.origin, unreal.Vector(0.78, 0.035, 0.18), prop_material_path(context.room))
    _cube(f"{context.label}_FingerShadowPad", _point(context, (0.0, -10.0, -18.0)), unreal.Vector(0.42, 0.014, 0.025), material_path("DeepShadow"))
    _text(f"{context.label}_MotionTitle", context.lock.title, _point(context, (0.0, -10.0, 24.0)), unreal.Rotator(0.0, 0.0, 0.0), 6.8)
    _text(f"{context.label}_ActionCue", _action_cue(context.lock.kind), _point(context, (0.0, -10.0, -2.0)), unreal.Rotator(0.0, 0.0, 0.0), 5.2)
    _point_light(f"{context.label}_HandWarmLight", _point(context, (0.0, -38.0, 30.0)), _accent(context.room), 170.0, 150.0)
    return 5


def _spawn_state_path(context: MotionContext) -> int:
    _shape(f"{context.label}_HandStartGhost", "Sphere", _point(context, (-28.0, -12.0, 16.0)), unreal.Vector(0.06, 0.06, 0.035), material_path("GlassTeal"))
    _shape(f"{context.label}_HandFinishGhost", "Sphere", _point(context, (30.0, -12.0, 16.0)), unreal.Vector(0.052, 0.052, 0.035), material_path("RoseGlow"))
    _cube(f"{context.label}_MotionArrowRail", _point(context, (0.0, -12.0, 16.0)), unreal.Vector(0.52, 0.012, 0.018), accent_material_path(context.room))
    _cube(f"{context.label}_ClickContactMarker", _point(context, (38.0, -13.0, 4.0)), unreal.Vector(0.04, 0.018, 0.09), material_path("BrassEdge"))
    _text(f"{context.label}_FeedbackCue", "click / slide / open feedback", _point(context, (0.0, -11.0, -31.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.6)
    return 5


def _spawn_kind_controls(context: MotionContext) -> int:
    match context.lock.kind:
        case LockKind.COMBINATION:
            return _spawn_combination(context)
        case LockKind.DIRECTION:
            return _spawn_direction(context)
        case LockKind.KEYPAD:
            return _spawn_keypad(context)
        case LockKind.KEYED_PADLOCK:
            return _spawn_keyed_padlock(context)
        case LockKind.MAGNETIC:
            return _spawn_magnetic(context)
        case LockKind.BUTTON_SEQUENCE:
            return _spawn_button_sequence(context)
        case LockKind.LETTER:
            return _spawn_letter_drums(context)
        case LockKind.SAFE_DIAL:
            return _spawn_safe_dial(context)
        case unreachable:
            assert_never(unreachable)


def _spawn_combination(context: MotionContext) -> int:
    for slot in range(4):
        _shape(f"{context.label}_TumblerWheel_{slot + 1}", "Cylinder", _point(context, (-27.0 + slot * 18.0, -12.0, 5.0)), unreal.Vector(0.07, 0.07, 0.055), material_path("BrassEdge"))
    _cube(f"{context.label}_ShackleRiseGhost", _point(context, (0.0, -13.0, 36.0)), unreal.Vector(0.42, 0.018, 0.035), material_path("RoseGlow"))
    _text(f"{context.label}_WheelCue", "wheel turns -> shackle rises", _point(context, (0.0, -13.0, 50.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.6)
    return 6


def _spawn_direction(context: MotionContext) -> int:
    for slot, offset in enumerate(((-18.0, 0.0, 16.0), (0.0, 0.0, 30.0), (18.0, 0.0, 16.0), (0.0, 0.0, 2.0))):
        _cube(f"{context.label}_ArrowButton_{slot + 1}", _point(context, offset), unreal.Vector(0.11, 0.018, 0.08), accent_material_path(context.room))
    _cube(f"{context.label}_PressDepthGhost", _point(context, (0.0, -16.0, 16.0)), unreal.Vector(0.34, 0.012, 0.018), material_path("GlassTeal"))
    _text(f"{context.label}_DirectionCue", "press arrows in route order", _point(context, (0.0, -12.0, 46.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.7)
    return 6


def _spawn_keypad(context: MotionContext) -> int:
    for slot in range(6):
        x = -24.0 + (slot % 3) * 24.0
        z = 3.0 + (slot // 3) * 18.0
        _cube(f"{context.label}_KeyButton_{slot + 1}", _point(context, (x, -12.0, z)), unreal.Vector(0.12, 0.018, 0.07), material_path("GlassTeal"))
    _cube(f"{context.label}_LedDisplay", _point(context, (0.0, -13.0, 42.0)), unreal.Vector(0.36, 0.014, 0.055), material_path("DeepShadow"))
    _text(f"{context.label}_BeepCue", "beep -> blue LED -> bolt retracts", _point(context, (0.0, -12.0, 55.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.5)
    return 8


def _spawn_keyed_padlock(context: MotionContext) -> int:
    _shape(f"{context.label}_KeyBow", "Cylinder", _point(context, (-30.0, -12.0, 10.0)), unreal.Vector(0.08, 0.08, 0.02), material_path("BrassEdge"))
    _cube(f"{context.label}_KeyBlade", _point(context, (-12.0, -12.0, 10.0)), unreal.Vector(0.24, 0.014, 0.025), material_path("BrassEdge"))
    _shape(f"{context.label}_Keyhole", "Cylinder", _point(context, (12.0, -13.0, 10.0)), unreal.Vector(0.055, 0.055, 0.018), material_path("DeepShadow"))
    _cube(f"{context.label}_TurnArc", _point(context, (25.0, -13.0, 26.0)), unreal.Vector(0.22, 0.014, 0.018), material_path("RoseGlow"))
    _cube(f"{context.label}_LatchDropGhost", _point(context, (34.0, -13.0, -2.0)), unreal.Vector(0.08, 0.014, 0.15), accent_material_path(context.room))
    return 5


def _spawn_magnetic(context: MotionContext) -> int:
    _shape(f"{context.label}_MagnetDisc", "Cylinder", _point(context, (-24.0, -12.0, 12.0)), unreal.Vector(0.10, 0.10, 0.025), material_path("BrassEdge"))
    _cube(f"{context.label}_ReedSwitchSlot", _point(context, (6.0, -13.0, 12.0)), unreal.Vector(0.26, 0.014, 0.06), prop_material_path(context.room))
    _cube(f"{context.label}_SnapPath", _point(context, (-9.0, -14.0, 24.0)), unreal.Vector(0.32, 0.011, 0.016), material_path("RoseGlow"))
    _shape(f"{context.label}_RelayLamp", "Sphere", _point(context, (34.0, -13.0, 20.0)), unreal.Vector(0.052, 0.052, 0.052), material_path("GlassTeal"))
    _text(f"{context.label}_MagnetCue", "magnet snaps -> relay opens", _point(context, (2.0, -12.0, 43.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.7)
    return 5


def _spawn_button_sequence(context: MotionContext) -> int:
    for slot in range(4):
        _shape(f"{context.label}_ColorButton_{slot + 1}", "Cylinder", _point(context, (-27.0 + slot * 18.0, -12.0, 13.0)), unreal.Vector(0.07, 0.07, 0.032), accent_material_path(context.room))
    _cube(f"{context.label}_SweepLamp", _point(context, (0.0, -14.0, 30.0)), unreal.Vector(0.48, 0.012, 0.022), material_path("GlassTeal"))
    _text(f"{context.label}_SequenceCue", "buttons sink -> lamp sweeps", _point(context, (0.0, -12.0, 47.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.8)
    return 6


def _spawn_letter_drums(context: MotionContext) -> int:
    for slot in range(3):
        _shape(f"{context.label}_LetterDrum_{slot + 1}", "Cylinder", _point(context, (-18.0 + slot * 18.0, -12.0, 13.0)), unreal.Vector(0.075, 0.075, 0.052), material_path("BrassEdge"))
    _cube(f"{context.label}_IndexNotch", _point(context, (0.0, -14.0, 31.0)), unreal.Vector(0.34, 0.012, 0.018), material_path("RoseGlow"))
    _text(f"{context.label}_LetterCue", "drums roll -> letters align", _point(context, (0.0, -12.0, 47.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.8)
    return 5


def _spawn_safe_dial(context: MotionContext) -> int:
    _shape(f"{context.label}_DialFace", "Cylinder", _point(context, (-10.0, -12.0, 16.0)), unreal.Vector(0.15, 0.15, 0.035), material_path("BrassEdge"))
    _cube(f"{context.label}_PointerNeedle", _point(context, (-10.0, -15.0, 34.0)), unreal.Vector(0.025, 0.012, 0.20), material_path("RoseGlow"))
    _cube(f"{context.label}_LeftRightArc", _point(context, (-10.0, -14.0, 0.0)), unreal.Vector(0.38, 0.012, 0.018), material_path("GlassTeal"))
    _cube(f"{context.label}_SafeBoltGhost", _point(context, (34.0, -13.0, 16.0)), unreal.Vector(0.15, 0.014, 0.08), accent_material_path(context.room))
    _text(f"{context.label}_DialCue", "left-right-left -> safe opens", _point(context, (5.0, -12.0, 50.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.7)
    return 5


def _context(room: RoomSpec, lock: LockSpec, index: int) -> MotionContext:
    return MotionContext(room, lock, index, f"PE_LockMotion_{room.prefix}_{index + 1:02d}_{lock.kind.value}", _origin(room, lock))


def _origin(room: RoomSpec, lock: LockSpec) -> "unreal.Vector":
    return unreal.Vector(room.x + lock.rel_x, lock.rel_y - 124.0, 144.0)


def _point(context: MotionContext, offset: Offset) -> "unreal.Vector":
    return unreal.Vector(context.origin.x + offset[0], context.origin.y + offset[1], context.origin.z + offset[2])


def _action_cue(kind: LockKind) -> str:
    match kind:
        case LockKind.COMBINATION:
            return "손가락으로 숫자 휠 회전"
        case LockKind.DIRECTION:
            return "방향 버튼을 순서대로 누름"
        case LockKind.KEYPAD:
            return "키패드 입력과 LED 피드백"
        case LockKind.KEYED_PADLOCK:
            return "열쇠 삽입 후 90도 회전"
        case LockKind.MAGNETIC:
            return "자석 접촉으로 릴레이 개방"
        case LockKind.BUTTON_SEQUENCE:
            return "색상 버튼 순서 입력"
        case LockKind.LETTER:
            return "문자 드럼 정렬"
        case LockKind.SAFE_DIAL:
            return "금고 다이얼 좌우 회전"
        case unreachable:
            assert_never(unreachable)


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
