from __future__ import annotations

from dataclasses import dataclass
from typing import TypeAlias, assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .specs import LockKind, LockSpec, RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

Offset: TypeAlias = tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class OperationContext:
    room: RoomSpec
    lock: LockSpec
    index: int
    label: str
    origin: "unreal.Vector"


def spawn_room_lock_operations(room: RoomSpec) -> int:
    count = 0
    for index, lock in enumerate(room.locks):
        count += _spawn_station(_context(room, lock, index))
    return count


def _spawn_station(context: OperationContext) -> int:
    count = _spawn_operation_base(context)
    count += _spawn_feedback_path(context)
    count += _spawn_kind_operation(context)
    return count


def _spawn_operation_base(context: OperationContext) -> int:
    _cube(f"{context.label}_InstructionPlate", context.origin, unreal.Vector(0.92, 0.026, 0.34), prop_material_path(context.room))
    _cube(f"{context.label}_FingerRestShadow", _point(context, (0.0, -8.0, -31.0)), unreal.Vector(0.56, 0.011, 0.026), material_path("DeepShadow"))
    _text(f"{context.label}_Title", context.lock.title, _point(context, (0.0, -10.0, 30.0)), unreal.Rotator(0.0, 0.0, 0.0), 6.8)
    _text(f"{context.label}_ClueRoute", context.lock.clue, _point(context, (0.0, -10.0, 13.0)), unreal.Rotator(0.0, 0.0, 0.0), 5.0)
    _text(f"{context.label}_SlotCue", _slot_cue(context.lock), _point(context, (0.0, -10.0, -5.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.8)
    _cube(f"{context.label}_FocusNotch", _point(context, (-48.0, -11.0, -22.0)), unreal.Vector(0.05, 0.016, 0.16), accent_material_path(context.room))
    _cube(f"{context.label}_RewardKeyArrow", _point(context, (46.0, -11.0, -22.0)), unreal.Vector(0.25, 0.014, 0.04), material_path("BrassEdge"))
    _text(f"{context.label}_SoundCue", _kind_sound_cue(context.lock.kind), _point(context, (0.0, -10.0, -47.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.3)
    _point_light(f"{context.label}_InteractionPool", _point(context, (0.0, -40.0, 32.0)), _accent(context.room), 240.0, 170.0)
    return 9


def _spawn_feedback_path(context: OperationContext) -> int:
    _shape(f"{context.label}_HandApproachGhost", "Sphere", _point(context, (-36.0, -13.0, 8.0)), unreal.Vector(0.055, 0.055, 0.036), material_path("GlassTeal"))
    _shape(f"{context.label}_CommitGhost", "Sphere", _point(context, (36.0, -13.0, 8.0)), unreal.Vector(0.055, 0.055, 0.036), material_path("RoseGlow"))
    _cube(f"{context.label}_HandTravelRail", _point(context, (0.0, -13.0, 8.0)), unreal.Vector(0.64, 0.01, 0.016), accent_material_path(context.room))
    _cube(f"{context.label}_PressDepthMarker", _point(context, (0.0, -17.0, -10.0)), unreal.Vector(0.32, 0.012, 0.032), material_path("DeepShadow"))
    _shape(f"{context.label}_SolvedLamp", "Sphere", _point(context, (51.0, -14.0, 23.0)), unreal.Vector(0.048, 0.048, 0.048), material_path("GlassTeal"))
    _shape(f"{context.label}_ErrorLamp", "Sphere", _point(context, (51.0, -14.0, 8.0)), unreal.Vector(0.038, 0.038, 0.038), material_path("RoseGlow"))
    _text(f"{context.label}_FeedbackRule", "정답: 램프 점등 / 오답: 짧은 진동 후 리셋", _point(context, (0.0, -10.0, -63.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.1)
    return 7


def _spawn_kind_operation(context: OperationContext) -> int:
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
            return _spawn_letter(context)
        case LockKind.SAFE_DIAL:
            return _spawn_safe_dial(context)
        case unreachable:
            assert_never(unreachable)


def _spawn_combination(context: OperationContext) -> int:
    for slot in range(4):
        _shape(f"{context.label}_NumberWheel_{slot + 1}", "Cylinder", _point(context, (-30.0 + slot * 20.0, -12.0, 53.0)), unreal.Vector(0.066, 0.066, 0.052), material_path("BrassEdge"))
    _cube(f"{context.label}_WheelRidgeStrip", _point(context, (0.0, -14.0, 68.0)), unreal.Vector(0.58, 0.01, 0.018), material_path("DeepShadow"))
    _cube(f"{context.label}_ShackleLiftPath", _point(context, (0.0, -14.0, 85.0)), unreal.Vector(0.44, 0.012, 0.03), material_path("RoseGlow"))
    _text(f"{context.label}_WheelInstruction", "휠을 한 칸씩 넘기며 촉감 홈을 확인", _point(context, (0.0, -10.0, 100.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.3)
    return 7


def _spawn_direction(context: OperationContext) -> int:
    for slot, offset in enumerate(((0.0, -12.0, 75.0), (22.0, -12.0, 57.0), (0.0, -12.0, 39.0), (-22.0, -12.0, 57.0))):
        _cube(f"{context.label}_ArrowPress_{slot + 1}", _point(context, offset), unreal.Vector(0.105, 0.016, 0.075), accent_material_path(context.room))
    _cube(f"{context.label}_RouteMemoryRail", _point(context, (0.0, -14.0, 22.0)), unreal.Vector(0.46, 0.011, 0.018), material_path("GlassTeal"))
    _text(f"{context.label}_DirectionInstruction", "관찰한 이동 경로를 버튼 깊이로 재현", _point(context, (0.0, -10.0, 93.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.3)
    return 6


def _spawn_keypad(context: OperationContext) -> int:
    for slot in range(10):
        x = -24.0 + slot % 3 * 24.0
        z = 69.0 - slot // 3 * 16.0
        _cube(f"{context.label}_Digit_{slot}", _point(context, (x, -12.0, z)), unreal.Vector(0.09, 0.016, 0.058), material_path("GlassTeal"))
    _cube(f"{context.label}_InputDisplay", _point(context, (0.0, -14.0, 84.0)), unreal.Vector(0.38, 0.011, 0.045), material_path("DeepShadow"))
    _shape(f"{context.label}_AcceptLed", "Sphere", _point(context, (42.0, -14.0, 83.0)), unreal.Vector(0.036, 0.036, 0.036), material_path("GlassTeal"))
    _shape(f"{context.label}_RejectLed", "Sphere", _point(context, (42.0, -14.0, 67.0)), unreal.Vector(0.032, 0.032, 0.032), material_path("RoseGlow"))
    _text(f"{context.label}_KeypadInstruction", "삑 소리마다 입력 슬롯이 한 칸 진행", _point(context, (0.0, -10.0, 101.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.3)
    return 14


def _spawn_keyed_padlock(context: OperationContext) -> int:
    _shape(f"{context.label}_KeyBowGuide", "Cylinder", _point(context, (-34.0, -12.0, 56.0)), unreal.Vector(0.074, 0.074, 0.02), material_path("BrassEdge"))
    _cube(f"{context.label}_KeyBladeGuide", _point(context, (-12.0, -12.0, 56.0)), unreal.Vector(0.26, 0.012, 0.022), material_path("BrassEdge"))
    _shape(f"{context.label}_KeyholeTarget", "Cylinder", _point(context, (14.0, -14.0, 56.0)), unreal.Vector(0.052, 0.052, 0.018), material_path("DeepShadow"))
    _cube(f"{context.label}_QuarterTurnArc", _point(context, (30.0, -14.0, 74.0)), unreal.Vector(0.22, 0.012, 0.018), material_path("RoseGlow"))
    _cube(f"{context.label}_ClaspDropPocket", _point(context, (39.0, -14.0, 40.0)), unreal.Vector(0.085, 0.012, 0.14), accent_material_path(context.room))
    _text(f"{context.label}_KeyInstruction", "삽입 - 90도 회전 - 걸쇠 낙하 확인", _point(context, (0.0, -10.0, 94.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.3)
    return 6


def _spawn_magnetic(context: OperationContext) -> int:
    _shape(f"{context.label}_MagnetTokenGuide", "Cylinder", _point(context, (-24.0, -12.0, 58.0)), unreal.Vector(0.09, 0.09, 0.026), material_path("BrassEdge"))
    _cube(f"{context.label}_ReedSwitchCradle", _point(context, (8.0, -14.0, 58.0)), unreal.Vector(0.28, 0.012, 0.052), prop_material_path(context.room))
    _cube(f"{context.label}_PolarityStripe", _point(context, (-8.0, -15.0, 74.0)), unreal.Vector(0.38, 0.01, 0.014), material_path("RoseGlow"))
    _shape(f"{context.label}_RelayOpenLamp", "Sphere", _point(context, (38.0, -14.0, 74.0)), unreal.Vector(0.044, 0.044, 0.044), material_path("GlassTeal"))
    _text(f"{context.label}_MagnetInstruction", "붙는 방향이 맞으면 릴레이 소리가 난다", _point(context, (0.0, -10.0, 94.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.3)
    return 5


def _spawn_button_sequence(context: OperationContext) -> int:
    for slot, material in enumerate(("RoseGlow", "GlassTeal", "RainBlue", "BrassEdge")):
        _shape(f"{context.label}_ColorButton_{slot + 1}", "Cylinder", _point(context, (-30.0 + slot * 20.0, -12.0, 58.0)), unreal.Vector(0.067, 0.067, 0.032), material_path(material))
    _cube(f"{context.label}_OrderLampRail", _point(context, (0.0, -14.0, 77.0)), unreal.Vector(0.54, 0.011, 0.018), material_path("GlassTeal"))
    _cube(f"{context.label}_ResetTouchStrip", _point(context, (0.0, -14.0, 39.0)), unreal.Vector(0.42, 0.011, 0.018), material_path("DeepShadow"))
    _text(f"{context.label}_ButtonInstruction", "색 순서가 틀리면 하단 스트립이 리셋", _point(context, (0.0, -10.0, 94.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.3)
    return 7


def _spawn_letter(context: OperationContext) -> int:
    for slot in range(3):
        _shape(f"{context.label}_LetterDrum_{slot + 1}", "Cylinder", _point(context, (-20.0 + slot * 20.0, -12.0, 58.0)), unreal.Vector(0.073, 0.073, 0.048), material_path("BrassEdge"))
    _cube(f"{context.label}_IndexWindow", _point(context, (0.0, -14.0, 76.0)), unreal.Vector(0.36, 0.011, 0.036), material_path("RoseGlow"))
    _cube(f"{context.label}_RatchetFeelRail", _point(context, (0.0, -14.0, 39.0)), unreal.Vector(0.38, 0.011, 0.018), material_path("DeepShadow"))
    _text(f"{context.label}_LetterInstruction", "딸깍 홈마다 한 글자씩 정렬", _point(context, (0.0, -10.0, 94.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.3)
    return 6


def _spawn_safe_dial(context: OperationContext) -> int:
    _shape(f"{context.label}_DialGrip", "Cylinder", _point(context, (-14.0, -12.0, 58.0)), unreal.Vector(0.14, 0.14, 0.035), material_path("BrassEdge"))
    _cube(f"{context.label}_PointerNeedle", _point(context, (-14.0, -15.0, 77.0)), unreal.Vector(0.022, 0.011, 0.18), material_path("RoseGlow"))
    for tick in range(6):
        _cube(f"{context.label}_DialTick_{tick + 1}", _point(context, (-45.0 + tick * 12.5, -14.0, 37.0)), unreal.Vector(0.018, 0.01, 0.048), material_path("BrassEdge"))
    _cube(f"{context.label}_LeftRightSequenceRail", _point(context, (-14.0, -14.0, 21.0)), unreal.Vector(0.42, 0.011, 0.018), material_path("GlassTeal"))
    _cube(f"{context.label}_BoltWithdrawMarker", _point(context, (39.0, -14.0, 58.0)), unreal.Vector(0.12, 0.012, 0.09), accent_material_path(context.room))
    _text(f"{context.label}_SafeInstruction", "좌-우-좌 순서와 멈춤 지점을 모두 맞춤", _point(context, (0.0, -10.0, 96.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.3)
    return 11


def _context(room: RoomSpec, lock: LockSpec, index: int) -> OperationContext:
    return OperationContext(room, lock, index, f"PE_LockOperation_{room.prefix}_L{index + 1:02d}_{lock.kind.value}", _origin(room, lock))


def _origin(room: RoomSpec, lock: LockSpec) -> "unreal.Vector":
    return unreal.Vector(room.x + lock.rel_x, lock.rel_y - 196.0, 204.0)


def _point(context: OperationContext, offset: Offset) -> "unreal.Vector":
    return unreal.Vector(context.origin.x + offset[0], context.origin.y + offset[1], context.origin.z + offset[2])


def _slot_cue(lock: LockSpec) -> str:
    return f"입력 슬롯 x{len(lock.answer)} / 정답은 주변 단서에서만 확인"


def _kind_sound_cue(kind: LockKind) -> str:
    match kind:
        case LockKind.COMBINATION:
            return "SFX: dial tick + shackle lift"
        case LockKind.DIRECTION:
            return "SFX: direction press + latch click"
        case LockKind.KEYPAD:
            return "SFX: keypad beep + bolt retract"
        case LockKind.KEYED_PADLOCK:
            return "SFX: key teeth + clasp drop"
        case LockKind.MAGNETIC:
            return "SFX: magnetic snap + relay hum"
        case LockKind.BUTTON_SEQUENCE:
            return "SFX: color button + sweep lamp"
        case LockKind.LETTER:
            return "SFX: letter roll + index click"
        case LockKind.SAFE_DIAL:
            return "SFX: dial tick + safe bolt"
        case unreachable:
            assert_never(unreachable)


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
