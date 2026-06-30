from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, TypeAlias, assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .level_ops import color
from .specs import LockKind, LockSpec, RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

Offset: TypeAlias = tuple[float, float, float]
HardwareMesh: TypeAlias = Literal["Cube", "Cylinder", "Sphere"]


@dataclass(frozen=True, slots=True)
class HardwareContext:
    room: RoomSpec
    lock: LockSpec
    index: int
    label: str
    origin: "unreal.Vector"


def spawn_room_lock_hardware(room: RoomSpec) -> int:
    count = 0
    for index, lock in enumerate(room.locks):
        count += _spawn_station(_context(room, lock, index))
    return count


def _spawn_station(context: HardwareContext) -> int:
    return _spawn_base_hardware(context) + _spawn_kind_hardware(context)


def _spawn_base_hardware(context: HardwareContext) -> int:
    _cube(f"{context.label}_Backplate", context.origin, unreal.Vector(0.72, 0.035, 0.46), prop_material_path(context.room))
    _shape(f"{context.label}_Shackle", "Cylinder", _point(context, (0.0, -15.0, 55.0)), unreal.Vector(0.15, 0.15, 0.028), material_path("BrassEdge"))
    _shape(f"{context.label}_Keyway", "Cylinder", _point(context, (-31.0, -17.0, 9.0)), unreal.Vector(0.055, 0.055, 0.018), material_path("DeepShadow"))
    _cube(f"{context.label}_BoltRail", _point(context, (28.0, -17.0, 9.0)), unreal.Vector(0.22, 0.012, 0.055), material_path("BrassEdge"))
    _cube(f"{context.label}_TactileGrip", _point(context, (0.0, -19.0, -31.0)), unreal.Vector(0.50, 0.010, 0.024), accent_material_path(context.room))
    _cube(f"{context.label}_SoundPort", _point(context, (-52.0, -19.0, -2.0)), unreal.Vector(0.045, 0.010, 0.24), material_path("DeepShadow"))
    _shape(f"{context.label}_SolvedLamp", "Sphere", _point(context, (52.0, -18.0, 28.0)), unreal.Vector(0.040, 0.040, 0.040), material_path("GlassTeal"))
    _shape(f"{context.label}_ErrorLamp", "Sphere", _point(context, (52.0, -18.0, 12.0)), unreal.Vector(0.034, 0.034, 0.034), material_path("RoseGlow"))
    for screw in range(4):
        x = -54.0 if screw % 2 == 0 else 54.0
        z = 42.0 if screw < 2 else -39.0
        _shape(f"{context.label}_Screw_{screw + 1}", "Cylinder", _point(context, (x, -20.0, z)), unreal.Vector(0.022, 0.022, 0.008), material_path("BrassEdge"))
    _text(f"{context.label}_HardwareCue", context.lock.motion, _point(context, (0.0, -25.0, 78.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.8)
    _point_light(f"{context.label}_HardwareGlow", _point(context, (0.0, -46.0, 40.0)), color(context.room), 210.0, 150.0)
    return 14


def _spawn_kind_hardware(context: HardwareContext) -> int:
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


def _spawn_combination(context: HardwareContext) -> int:
    for wheel in range(5):
        _shape(f"{context.label}_HardwareDetail_Wheel_{wheel + 1}", "Cylinder", _point(context, (-36.0 + wheel * 18.0, -21.0, 21.0)), unreal.Vector(0.058, 0.058, 0.048), material_path("BrassEdge"))
    _cube(f"{context.label}_HardwareDetail_IndexLine", _point(context, (0.0, -23.0, 39.0)), unreal.Vector(0.48, 0.008, 0.012), material_path("RoseGlow"))
    return 6


def _spawn_direction(context: HardwareContext) -> int:
    for step, offset in enumerate(((0.0, -21.0, 38.0), (22.0, -21.0, 20.0), (0.0, -21.0, 2.0), (-22.0, -21.0, 20.0))):
        _cube(f"{context.label}_HardwareDetail_ArrowKey_{step + 1}", _point(context, offset), unreal.Vector(0.090, 0.012, 0.062), accent_material_path(context.room))
    _cube(f"{context.label}_HardwareDetail_DirectionMembrane", _point(context, (0.0, -24.0, 20.0)), unreal.Vector(0.58, 0.006, 0.34), material_path("GlassTeal"))
    return 5


def _spawn_keypad(context: HardwareContext) -> int:
    for digit in range(10):
        x = -24.0 + digit % 3 * 24.0
        z = 40.0 - digit // 3 * 13.0
        _cube(f"{context.label}_HardwareDetail_Keycap_{digit}", _point(context, (x, -21.0, z)), unreal.Vector(0.080, 0.012, 0.048), material_path("GlassTeal"))
    _cube(f"{context.label}_HardwareDetail_RubberUnderlay", _point(context, (0.0, -24.0, 17.0)), unreal.Vector(0.58, 0.006, 0.34), material_path("DeepShadow"))
    return 11


def _spawn_keyed_padlock(context: HardwareContext) -> int:
    _shape(f"{context.label}_HardwareDetail_KeyBow", "Cylinder", _point(context, (-36.0, -21.0, 19.0)), unreal.Vector(0.072, 0.072, 0.018), material_path("BrassEdge"))
    _cube(f"{context.label}_HardwareDetail_KeyBlade", _point(context, (-12.0, -21.0, 19.0)), unreal.Vector(0.28, 0.010, 0.024), material_path("BrassEdge"))
    for tooth in range(3):
        _cube(f"{context.label}_HardwareDetail_KeyTooth_{tooth + 1}", _point(context, (4.0 + tooth * 9.0, -22.0, 10.0 - tooth * 3.0)), unreal.Vector(0.035, 0.008, 0.030), material_path("BrassEdge"))
    _cube(f"{context.label}_HardwareDetail_TurnStop", _point(context, (32.0, -22.0, 29.0)), unreal.Vector(0.10, 0.010, 0.070), material_path("RoseGlow"))
    return 6


def _spawn_magnetic(context: HardwareContext) -> int:
    _shape(f"{context.label}_HardwareDetail_MagnetPuck", "Cylinder", _point(context, (-24.0, -21.0, 22.0)), unreal.Vector(0.082, 0.082, 0.020), material_path("BrassEdge"))
    _cube(f"{context.label}_HardwareDetail_ReedSensor", _point(context, (8.0, -22.0, 22.0)), unreal.Vector(0.25, 0.008, 0.050), material_path("DeepShadow"))
    _cube(f"{context.label}_HardwareDetail_PolarityMark", _point(context, (-8.0, -24.0, 40.0)), unreal.Vector(0.36, 0.006, 0.012), material_path("RoseGlow"))
    _cube(f"{context.label}_HardwareDetail_RelayLatch", _point(context, (34.0, -23.0, 10.0)), unreal.Vector(0.12, 0.010, 0.065), accent_material_path(context.room))
    return 4


def _spawn_button_sequence(context: HardwareContext) -> int:
    for slot, material in enumerate(("RoseGlow", "GlassTeal", "RainBlue", "BrassEdge")):
        _shape(f"{context.label}_HardwareDetail_ButtonCap_{slot + 1}", "Cylinder", _point(context, (-30.0 + slot * 20.0, -21.0, 20.0)), unreal.Vector(0.060, 0.060, 0.030), material_path(material))
    _cube(f"{context.label}_HardwareDetail_ButtonSpringRail", _point(context, (0.0, -24.0, 1.0)), unreal.Vector(0.50, 0.008, 0.018), material_path("DeepShadow"))
    return 5


def _spawn_letter(context: HardwareContext) -> int:
    for drum in range(3):
        _shape(f"{context.label}_HardwareDetail_LetterDrum_{drum + 1}", "Cylinder", _point(context, (-20.0 + drum * 20.0, -21.0, 21.0)), unreal.Vector(0.066, 0.066, 0.044), material_path("BrassEdge"))
    _cube(f"{context.label}_HardwareDetail_ViewWindow", _point(context, (0.0, -24.0, 40.0)), unreal.Vector(0.34, 0.008, 0.040), material_path("RoseGlow"))
    _cube(f"{context.label}_HardwareDetail_RatchetBar", _point(context, (0.0, -24.0, 3.0)), unreal.Vector(0.34, 0.008, 0.018), material_path("DeepShadow"))
    return 5


def _spawn_safe_dial(context: HardwareContext) -> int:
    _shape(f"{context.label}_HardwareDetail_DialWheel", "Cylinder", _point(context, (-14.0, -21.0, 21.0)), unreal.Vector(0.13, 0.13, 0.035), material_path("BrassEdge"))
    _cube(f"{context.label}_HardwareDetail_DialPointer", _point(context, (-14.0, -24.0, 41.0)), unreal.Vector(0.020, 0.008, 0.16), material_path("RoseGlow"))
    for tick in range(8):
        _cube(f"{context.label}_HardwareDetail_DialTick_{tick + 1}", _point(context, (-49.0 + tick * 10.0, -24.0, -2.0)), unreal.Vector(0.016, 0.006, 0.040), material_path("BrassEdge"))
    _cube(f"{context.label}_HardwareDetail_BoltWindow", _point(context, (38.0, -22.0, 20.0)), unreal.Vector(0.12, 0.010, 0.080), accent_material_path(context.room))
    return 11


def _context(room: RoomSpec, lock: LockSpec, index: int) -> HardwareContext:
    return HardwareContext(room, lock, index, f"PE_LockHardware_{room.prefix}_L{index + 1:02d}_{lock.kind.value}", _origin(room, lock))


def _origin(room: RoomSpec, lock: LockSpec) -> "unreal.Vector":
    return unreal.Vector(room.x + lock.rel_x, lock.rel_y - 245.0, 146.0)


def _point(context: HardwareContext, offset: Offset) -> "unreal.Vector":
    return unreal.Vector(context.origin.x + offset[0], context.origin.y + offset[1], context.origin.z + offset[2])
