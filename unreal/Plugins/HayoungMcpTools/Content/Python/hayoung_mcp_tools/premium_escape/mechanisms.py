from __future__ import annotations

from dataclasses import dataclass
from typing import assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _text

from .specs import LockKind, LockSpec, RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path


@dataclass(frozen=True, slots=True)
class MechanismSpec:
    room: RoomSpec
    lock: LockSpec
    index: int


def spawn_room_mechanisms(room: RoomSpec) -> int:
    count = 0
    for index, lock in enumerate(room.locks):
        count += _spawn_lock_mechanism(MechanismSpec(room, lock, index))
    return count


def _spawn_lock_mechanism(spec: MechanismSpec) -> int:
    count = _spawn_common_rig(spec)
    match spec.lock.kind:
        case LockKind.COMBINATION:
            count += _spawn_combination(spec)
        case LockKind.DIRECTION:
            count += _spawn_direction(spec)
        case LockKind.KEYPAD:
            count += _spawn_keypad(spec)
        case LockKind.KEYED_PADLOCK:
            count += _spawn_keyed_padlock(spec)
        case LockKind.MAGNETIC:
            count += _spawn_magnetic(spec)
        case LockKind.BUTTON_SEQUENCE:
            count += _spawn_button_sequence(spec)
        case LockKind.LETTER:
            count += _spawn_letter(spec)
        case LockKind.SAFE_DIAL:
            count += _spawn_safe_dial(spec)
        case unreachable:
            assert_never(unreachable)
    return count


def _spawn_common_rig(spec: MechanismSpec) -> int:
    origin = _origin(spec)
    label = _label(spec)
    _cube(f"{label}_Backplate", origin, unreal.Vector(0.92, 0.08, 0.72), prop_material_path(spec.room))
    _cube(f"{label}_HaspRail", unreal.Vector(origin.x, origin.y - 8.0, origin.z + 28.0), unreal.Vector(0.78, 0.035, 0.08), material_path("BrassEdge"))
    _shape(f"{label}_CableConduit", "Cylinder", unreal.Vector(origin.x - 54.0, origin.y - 12.0, origin.z + 4.0), unreal.Vector(0.08, 0.08, 0.82), material_path("DeepShadow"))
    _text(f"{label}_MotionCue", spec.lock.motion, unreal.Vector(origin.x, origin.y - 36.0, origin.z + 76.0), unreal.Rotator(0.0, 0.0, 0.0), 8.0)
    _point_light(f"{label}_SolvedGlowPreview", unreal.Vector(origin.x, origin.y - 40.0, origin.z + 58.0), _accent(spec.room), 380.0, 180.0)
    return 5


def _spawn_combination(spec: MechanismSpec) -> int:
    origin = _origin(spec)
    label = _label(spec)
    _cube(f"{label}_TumblerFrame", unreal.Vector(origin.x, origin.y - 18.0, origin.z), unreal.Vector(0.56, 0.08, 0.28), material_path("DeepShadow"))
    for index in range(4):
        _shape(f"{label}_DialWheel_{index + 1}", "Cylinder", unreal.Vector(origin.x - 27.0 + index * 18.0, origin.y - 28.0, origin.z + 2.0), unreal.Vector(0.10, 0.10, 0.055), material_path("BrassEdge"))
    _shape(f"{label}_RaisedShackle", "Cylinder", unreal.Vector(origin.x, origin.y - 22.0, origin.z + 38.0), unreal.Vector(0.33, 0.33, 0.045), material_path("BrassEdge"))
    _cube(f"{label}_NumberWindow", unreal.Vector(origin.x, origin.y - 34.0, origin.z - 23.0), unreal.Vector(0.48, 0.03, 0.045), material_path("GlassTeal"))
    return 7


def _spawn_direction(spec: MechanismSpec) -> int:
    origin = _origin(spec)
    label = _label(spec)
    _cube(f"{label}_ArrowPanel", unreal.Vector(origin.x, origin.y - 18.0, origin.z), unreal.Vector(0.58, 0.07, 0.38), material_path("DeepShadow"))
    for index, symbol in enumerate(("U", "R", "D", "L")):
        loc = _button_location(origin, index)
        _cube(f"{label}_ArrowButton_{symbol}", loc, unreal.Vector(0.13, 0.045, 0.13), material_path("GlassTeal"))
        _text(f"{label}_ArrowGlyph_{symbol}", symbol, unreal.Vector(loc.x, loc.y - 7.0, loc.z + 1.0), unreal.Rotator(0.0, 0.0, 0.0), 9.0)
    _cube(f"{label}_SequenceResetRail", unreal.Vector(origin.x, origin.y - 30.0, origin.z - 31.0), unreal.Vector(0.48, 0.025, 0.035), material_path("RoseGlow"))
    return 10


def _spawn_keypad(spec: MechanismSpec) -> int:
    origin = _origin(spec)
    label = _label(spec)
    _cube(f"{label}_KeypadBody", unreal.Vector(origin.x, origin.y - 18.0, origin.z), unreal.Vector(0.46, 0.07, 0.54), material_path("DeepShadow"))
    for index in range(10):
        loc = unreal.Vector(origin.x - 24.0 + index % 3 * 24.0, origin.y - 29.0, origin.z + 24.0 - index // 3 * 17.0)
        _cube(f"{label}_Key_{index}", loc, unreal.Vector(0.085, 0.035, 0.07), material_path("BrassEdge"))
    _cube(f"{label}_BlueAcceptLed", unreal.Vector(origin.x + 38.0, origin.y - 31.0, origin.z + 28.0), unreal.Vector(0.055, 0.025, 0.055), material_path("RainBlue"))
    _text(f"{label}_BeepCue", "beep / blue LED / bolt retract", unreal.Vector(origin.x, origin.y - 38.0, origin.z - 48.0), unreal.Rotator(0.0, 0.0, 0.0), 8.0)
    return 13


def _spawn_keyed_padlock(spec: MechanismSpec) -> int:
    origin = _origin(spec)
    label = _label(spec)
    _shape(f"{label}_PadlockBody", "Sphere", unreal.Vector(origin.x, origin.y - 20.0, origin.z - 2.0), unreal.Vector(0.28, 0.14, 0.24), material_path("BrassEdge"))
    _shape(f"{label}_OpenShackleArc", "Cylinder", unreal.Vector(origin.x, origin.y - 20.0, origin.z + 31.0), unreal.Vector(0.24, 0.24, 0.04), material_path("BrassEdge"))
    _shape(f"{label}_Keyhole", "Cylinder", unreal.Vector(origin.x, origin.y - 36.0, origin.z - 3.0), unreal.Vector(0.055, 0.055, 0.022), material_path("DeepShadow"))
    _cube(f"{label}_InsertedKeyStem", unreal.Vector(origin.x + 34.0, origin.y - 36.0, origin.z - 3.0), unreal.Vector(0.30, 0.018, 0.028), material_path("BrassEdge"))
    _shape(f"{label}_KeyBow", "Cylinder", unreal.Vector(origin.x + 54.0, origin.y - 36.0, origin.z - 3.0), unreal.Vector(0.09, 0.09, 0.02), material_path("BrassEdge"))
    _cube(f"{label}_DroppedClaspTarget", unreal.Vector(origin.x - 40.0, origin.y - 24.0, origin.z - 32.0), unreal.Vector(0.18, 0.035, 0.09), material_path("RoseGlow"))
    return 6


def _spawn_magnetic(spec: MechanismSpec) -> int:
    origin = _origin(spec)
    label = _label(spec)
    _cube(f"{label}_ReaderPlate", unreal.Vector(origin.x, origin.y - 18.0, origin.z), unreal.Vector(0.58, 0.055, 0.38), material_path("RainBlue"))
    _shape(f"{label}_HeartMagnetToken", "Sphere", unreal.Vector(origin.x, origin.y - 32.0, origin.z + 2.0), unreal.Vector(0.18, 0.08, 0.16), material_path("RoseGlow"))
    _shape(f"{label}_CoilLeft", "Cylinder", unreal.Vector(origin.x - 35.0, origin.y - 28.0, origin.z + 24.0), unreal.Vector(0.08, 0.08, 0.04), material_path("BrassEdge"))
    _shape(f"{label}_CoilRight", "Cylinder", unreal.Vector(origin.x + 35.0, origin.y - 28.0, origin.z + 24.0), unreal.Vector(0.08, 0.08, 0.04), material_path("BrassEdge"))
    _cube(f"{label}_RelayBox", unreal.Vector(origin.x, origin.y - 26.0, origin.z - 34.0), unreal.Vector(0.32, 0.04, 0.08), material_path("DeepShadow"))
    _text(f"{label}_SensorCue", "magnet snaps / relay opens", unreal.Vector(origin.x, origin.y - 39.0, origin.z + 50.0), unreal.Rotator(0.0, 0.0, 0.0), 8.0)
    return 6


def _spawn_button_sequence(spec: MechanismSpec) -> int:
    origin = _origin(spec)
    label = _label(spec)
    _cube(f"{label}_ButtonConsole", unreal.Vector(origin.x, origin.y - 18.0, origin.z), unreal.Vector(0.62, 0.07, 0.30), material_path("DeepShadow"))
    for index, key in enumerate(("Pink", "Green", "Blue", "Gold")):
        _shape(f"{label}_{key}_Button", "Sphere", unreal.Vector(origin.x - 36.0 + index * 24.0, origin.y - 31.0, origin.z + 8.0), unreal.Vector(0.10, 0.06, 0.10), _button_material(index))
    _cube(f"{label}_SuccessSweep", unreal.Vector(origin.x, origin.y - 34.0, origin.z - 21.0), unreal.Vector(0.54, 0.025, 0.035), material_path("GlassTeal"))
    _cube(f"{label}_SpeakerGrille", unreal.Vector(origin.x + 47.0, origin.y - 30.0, origin.z + 31.0), unreal.Vector(0.08, 0.018, 0.11), material_path("DeepShadow"))
    return 7


def _spawn_letter(spec: MechanismSpec) -> int:
    origin = _origin(spec)
    label = _label(spec)
    _cube(f"{label}_LetterRail", unreal.Vector(origin.x, origin.y - 18.0, origin.z), unreal.Vector(0.58, 0.06, 0.24), material_path("DeepShadow"))
    for index, letter in enumerate(("H", "Y", "S")):
        loc = unreal.Vector(origin.x - 26.0 + index * 26.0, origin.y - 29.0, origin.z + 2.0)
        _shape(f"{label}_LetterDrum_{letter}", "Cylinder", loc, unreal.Vector(0.11, 0.11, 0.055), material_path("BrassEdge"))
        _text(f"{label}_LetterGlyph_{letter}", letter, unreal.Vector(loc.x, loc.y - 8.0, loc.z + 1.0), unreal.Rotator(0.0, 0.0, 0.0), 8.0)
    _cube(f"{label}_RooftopLatch", unreal.Vector(origin.x, origin.y - 31.0, origin.z - 29.0), unreal.Vector(0.42, 0.025, 0.045), material_path("NeonAmber"))
    return 8


def _spawn_safe_dial(spec: MechanismSpec) -> int:
    origin = _origin(spec)
    label = _label(spec)
    _cube(f"{label}_SafeDoorFace", unreal.Vector(origin.x, origin.y - 18.0, origin.z), unreal.Vector(0.70, 0.075, 0.58), material_path("DeepShadow"))
    _shape(f"{label}_DialWheel", "Cylinder", unreal.Vector(origin.x, origin.y - 31.0, origin.z + 5.0), unreal.Vector(0.22, 0.22, 0.045), material_path("BrassEdge"))
    _cube(f"{label}_DialPointer", unreal.Vector(origin.x, origin.y - 36.0, origin.z + 28.0), unreal.Vector(0.035, 0.018, 0.16), material_path("RoseGlow"))
    for index in range(6):
        _cube(f"{label}_Tick_{index + 1}", unreal.Vector(origin.x - 48.0 + index * 19.0, origin.y - 34.0, origin.z - 35.0), unreal.Vector(0.018, 0.018, 0.065), material_path("BrassEdge"))
    _shape(f"{label}_HingeTop", "Cylinder", unreal.Vector(origin.x + 46.0, origin.y - 27.0, origin.z + 34.0), unreal.Vector(0.06, 0.06, 0.08), material_path("BrassEdge"))
    _shape(f"{label}_HingeBottom", "Cylinder", unreal.Vector(origin.x + 46.0, origin.y - 27.0, origin.z - 34.0), unreal.Vector(0.06, 0.06, 0.08), material_path("BrassEdge"))
    return 11


def _button_location(origin: "unreal.Vector", index: int) -> "unreal.Vector":
    offsets = ((0.0, 24.0), (27.0, 0.0), (0.0, -24.0), (-27.0, 0.0))
    return unreal.Vector(origin.x + offsets[index][0], origin.y - 30.0, origin.z + offsets[index][1])


def _button_material(index: int) -> str:
    materials = (material_path("RoseGlow"), material_path("GlassTeal"), material_path("RainBlue"), material_path("BrassEdge"))
    return materials[index]


def _origin(spec: MechanismSpec) -> "unreal.Vector":
    return unreal.Vector(spec.room.x + spec.lock.rel_x, spec.lock.rel_y - 126.0, 104.0)


def _label(spec: MechanismSpec) -> str:
    return f"PE_Mechanism_{spec.room.prefix}_{spec.index + 1:02d}_{spec.lock.kind.value}"


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
