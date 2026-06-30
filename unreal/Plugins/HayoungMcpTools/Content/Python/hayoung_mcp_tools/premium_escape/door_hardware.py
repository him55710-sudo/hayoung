from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import TypeAlias

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _spawn, _text

from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

AudioAssets: TypeAlias = Mapping[str, str]
Offset: TypeAlias = tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class DoorHardwareContext:
    room: RoomSpec
    label: str
    origin: "unreal.Vector"


def spawn_room_door_hardware(room: RoomSpec, audio_assets: AudioAssets) -> int:
    context = DoorHardwareContext(room, f"PE_DoorHardware_{room.prefix}_ExitDoor", _origin(room))
    count = _spawn_frame_hardware(context)
    count += _spawn_hinge_stack(context)
    count += _spawn_touch_hardware(context)
    count += _spawn_closer_and_sensors(context)
    count += _spawn_creak_anchor(context, audio_assets)
    return count


def _spawn_frame_hardware(context: DoorHardwareContext) -> int:
    _cube(f"{context.label}_BackerPanel", _point(context, (0.0, 0.0, 0.0)), unreal.Vector(0.78, 0.032, 1.52), prop_material_path(context.room))
    _cube(f"{context.label}_RubberSeal_Left", _point(context, (-43.0, -2.0, 0.0)), unreal.Vector(0.018, 0.018, 1.58), material_path("DeepShadow"))
    _cube(f"{context.label}_RubberSeal_Right", _point(context, (43.0, -2.0, 0.0)), unreal.Vector(0.018, 0.018, 1.58), material_path("DeepShadow"))
    _cube(f"{context.label}_RubberSeal_Top", _point(context, (0.0, -2.0, 78.0)), unreal.Vector(0.88, 0.018, 0.018), material_path("DeepShadow"))
    _cube(f"{context.label}_BrushSeal_Bottom", _point(context, (0.0, -5.0, -78.0)), unreal.Vector(0.82, 0.018, 0.025), material_path("BrassEdge"))
    _cube(f"{context.label}_StrikeReceiver", _point(context, (49.0, -7.0, 8.0)), unreal.Vector(0.08, 0.026, 0.34), material_path("BrassEdge"))
    _cube(f"{context.label}_LatchPocket", _point(context, (44.0, -10.0, 6.0)), unreal.Vector(0.045, 0.02, 0.12), material_path("DeepShadow"))
    _cube(f"{context.label}_FrameScrewRail", _point(context, (51.0, -6.0, -22.0)), unreal.Vector(0.03, 0.018, 0.78), material_path("BrassEdge"))
    _cube(f"{context.label}_ExitKeyPlate", _point(context, (-59.0, -10.0, 4.0)), unreal.Vector(0.13, 0.024, 0.22), accent_material_path(context.room))
    _text(f"{context.label}_InspectionLabel", f"{context.room.title} exit hardware", _point(context, (0.0, -34.0, 98.0)), unreal.Rotator(0.0, 0.0, 0.0), 5.8)
    return 10


def _spawn_hinge_stack(context: DoorHardwareContext) -> int:
    count = 0
    for index, z in enumerate((-58.0, 6.0, 70.0), start=1):
        base = f"{context.label}_Hinge_{index:02d}"
        _cube(f"{base}_HingeLeaf_Frame", _point(context, (-48.0, -9.0, z)), unreal.Vector(0.07, 0.022, 0.22), material_path("BrassEdge"))
        _cube(f"{base}_HingeLeaf_Door", _point(context, (-39.0, -9.0, z)), unreal.Vector(0.07, 0.022, 0.22), material_path("BrassEdge"))
        _shape(f"{base}_HingePin", "Cylinder", _point(context, (-43.5, -13.0, z)), unreal.Vector(0.028, 0.028, 0.24), material_path("BrassEdge"))
        _shape(f"{base}_ScrewTop", "Sphere", _point(context, (-48.0, -15.0, z + 7.0)), unreal.Vector(0.017, 0.017, 0.017), material_path("DeepShadow"))
        _shape(f"{base}_ScrewBottom", "Sphere", _point(context, (-39.0, -15.0, z - 7.0)), unreal.Vector(0.017, 0.017, 0.017), material_path("DeepShadow"))
        count += 5
    return count


def _spawn_touch_hardware(context: DoorHardwareContext) -> int:
    _shape(f"{context.label}_LeverRosette", "Cylinder", _point(context, (18.0, -15.0, 2.0)), unreal.Vector(0.082, 0.082, 0.028), material_path("BrassEdge"))
    _shape(f"{context.label}_LeverHandle", "Cylinder", _point(context, (34.0, -20.0, 2.0)), unreal.Vector(0.032, 0.032, 0.30), material_path("BrassEdge"))
    _shape(f"{context.label}_ThumbTurn", "Cylinder", _point(context, (18.0, -18.0, 21.0)), unreal.Vector(0.048, 0.048, 0.035), accent_material_path(context.room))
    _shape(f"{context.label}_KeyCylinder", "Cylinder", _point(context, (18.0, -18.0, -18.0)), unreal.Vector(0.05, 0.05, 0.035), material_path("DeepShadow"))
    _cube(f"{context.label}_TouchWearPlate", _point(context, (21.0, -21.0, -38.0)), unreal.Vector(0.22, 0.012, 0.28), material_path("BrassEdge"))
    _shape(f"{context.label}_FingerSmudge", "Sphere", _point(context, (36.0, -24.0, -26.0)), unreal.Vector(0.055, 0.018, 0.028), material_path("GlassTeal"))
    _shape(f"{context.label}_PalmPressureGhost", "Sphere", _point(context, (5.0, -24.0, -48.0)), unreal.Vector(0.07, 0.018, 0.048), material_path("RoseGlow"))
    _shape(f"{context.label}_HandStartMarker", "Sphere", _point(context, (5.0, -34.0, 8.0)), unreal.Vector(0.032, 0.032, 0.032), accent_material_path(context.room))
    _shape(f"{context.label}_HandEndMarker", "Sphere", _point(context, (42.0, -34.0, 8.0)), unreal.Vector(0.032, 0.032, 0.032), material_path("GlassTeal"))
    _text(f"{context.label}_GripDirectionCue", "잡기 -> 누르기 -> 당기기", _point(context, (22.0, -44.0, 45.0)), unreal.Rotator(0.0, 0.0, 0.0), 5.2)
    return 10


def _spawn_closer_and_sensors(context: DoorHardwareContext) -> int:
    _cube(f"{context.label}_DoorCloserBody", _point(context, (-18.0, -18.0, 82.0)), unreal.Vector(0.30, 0.025, 0.055), material_path("DeepShadow"))
    _cube(f"{context.label}_DoorCloserArm_A", _point(context, (11.0, -20.0, 76.0)), unreal.Vector(0.30, 0.012, 0.018), material_path("BrassEdge"))
    _cube(f"{context.label}_DoorCloserArm_B", _point(context, (34.0, -20.0, 67.0)), unreal.Vector(0.24, 0.012, 0.018), material_path("BrassEdge"))
    _shape(f"{context.label}_CloserPivot", "Sphere", _point(context, (21.0, -24.0, 72.0)), unreal.Vector(0.026, 0.026, 0.026), accent_material_path(context.room))
    _cube(f"{context.label}_MagneticContactDoor", _point(context, (-30.0, -18.0, 47.0)), unreal.Vector(0.08, 0.018, 0.04), material_path("GlassTeal"))
    _cube(f"{context.label}_MagneticContactFrame", _point(context, (-50.0, -18.0, 47.0)), unreal.Vector(0.08, 0.018, 0.04), material_path("GlassTeal"))
    _shape(f"{context.label}_SensorLamp", "Sphere", _point(context, (-30.0, -24.0, 56.0)), unreal.Vector(0.026, 0.026, 0.026), material_path("RoseGlow"))
    for index in range(3):
        _cube(f"{context.label}_CableClip_{index + 1}", _point(context, (-60.0, -18.0, 52.0 - index * 18.0)), unreal.Vector(0.045, 0.014, 0.018), material_path("DeepShadow"))
    _cube(f"{context.label}_BoltTravelWitness", _point(context, (42.0, -19.0, 13.0)), unreal.Vector(0.16, 0.01, 0.032), accent_material_path(context.room))
    _cube(f"{context.label}_DeadboltFace", _point(context, (42.0, -18.0, 28.0)), unreal.Vector(0.09, 0.014, 0.07), material_path("BrassEdge"))
    _cube(f"{context.label}_DoorStop", _point(context, (-64.0, -18.0, -74.0)), unreal.Vector(0.08, 0.028, 0.05), material_path("DeepShadow"))
    return 13


def _spawn_creak_anchor(context: DoorHardwareContext, audio_assets: AudioAssets) -> int:
    location = _point(context, (-44.0, -28.0, 18.0))
    asset_path = audio_assets.get("sfx_door_creak", "")
    emitted = 0
    if asset_path:
        sound = unreal.load_asset(asset_path)
        actor = _spawn(unreal.AmbientSound, location, label=f"{context.label}_CreakEmitter")
        component = actor.get_editor_property("audio_component")
        component.set_editor_property("sound", sound)
        component.set_editor_property("volume_multiplier", 0.16)
        component.set_editor_property("auto_activate", False)
        emitted = 1
    _shape(f"{context.label}_CreakAudioSource", "Sphere", unreal.Vector(location.x, location.y, location.z + 18.0), unreal.Vector(0.036, 0.036, 0.036), material_path("RoseGlow"))
    _text(f"{context.label}_CreakAudioLabel", "hinge creak trigger anchor", unreal.Vector(location.x, location.y - 18.0, location.z + 42.0), unreal.Rotator(0.0, 0.0, 0.0), 4.8)
    _point_light(f"{context.label}_CreakReadyPulse", unreal.Vector(location.x, location.y, location.z + 28.0), _accent(context.room), 68.0, 95.0)
    return emitted + 3


def _origin(room: RoomSpec) -> "unreal.Vector":
    return unreal.Vector(room.x + room.width / 2.0 - 68.0, room.depth / 2.0 - 50.0, 124.0)


def _point(context: DoorHardwareContext, offset: Offset) -> "unreal.Vector":
    return unreal.Vector(context.origin.x + offset[0], context.origin.y + offset[1], context.origin.z + offset[2])


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
