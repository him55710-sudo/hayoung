from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import TypeAlias

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _spawn, _text

from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

AudioAssets: TypeAlias = Mapping[str, str]


@dataclass(frozen=True, slots=True)
class TransitionContext:
    left: RoomSpec
    right: RoomSpec
    label: str
    center: float
    door_x: float
    y: float


def spawn_door_transition(left: RoomSpec, right: RoomSpec, audio_assets: AudioAssets) -> int:
    context = _context(left, right)
    count = _spawn_vestibule(context)
    count += _spawn_unlock_feedback(context)
    count += _spawn_transition_audio(context, audio_assets)
    return count


def _spawn_vestibule(context: TransitionContext) -> int:
    _cube(f"{context.label}_ThresholdStone", unreal.Vector(context.door_x + 18.0, context.y - 8.0, 5.0), unreal.Vector(0.78, 0.22, 0.045), prop_material_path(context.left))
    _cube(f"{context.label}_LeftJamb", unreal.Vector(context.door_x - 48.0, context.y - 38.0, 126.0), unreal.Vector(0.055, 0.055, 1.62), material_path("BrassEdge"))
    _cube(f"{context.label}_RightJamb", unreal.Vector(context.door_x + 48.0, context.y - 38.0, 126.0), unreal.Vector(0.055, 0.055, 1.62), material_path("BrassEdge"))
    _cube(f"{context.label}_TopHeader", unreal.Vector(context.door_x, context.y - 38.0, 212.0), unreal.Vector(0.98, 0.06, 0.08), material_path("DeepShadow"))
    _cube(f"{context.label}_LightLeak", unreal.Vector(context.door_x + 52.0, context.y - 62.0, 132.0), unreal.Vector(0.025, 0.018, 1.20), accent_material_path(context.right))
    _shape(f"{context.label}_HingePinTop", "Cylinder", unreal.Vector(context.door_x - 53.0, context.y - 43.0, 168.0), unreal.Vector(0.038, 0.038, 0.12), material_path("BrassEdge"))
    _shape(f"{context.label}_HingePinBottom", "Cylinder", unreal.Vector(context.door_x - 53.0, context.y - 43.0, 82.0), unreal.Vector(0.038, 0.038, 0.12), material_path("BrassEdge"))
    _text(f"{context.label}_RoomChangeLabel", f"{context.left.title} -> {context.right.title}", unreal.Vector(context.center, context.y - 106.0, 138.0), unreal.Rotator(0.0, 0.0, 0.0), 9.0)
    _point_light(f"{context.label}_NextRoomBleed", unreal.Vector(context.door_x + 70.0, context.y - 82.0, 176.0), _accent(context.right), 620.0, 260.0)
    return 9


def _spawn_unlock_feedback(context: TransitionContext) -> int:
    _cube(f"{context.label}_KeyReaderPlate", unreal.Vector(context.door_x - 70.0, context.y - 48.0, 122.0), unreal.Vector(0.16, 0.022, 0.26), material_path("DeepShadow"))
    _shape(f"{context.label}_AcceptedLamp", "Sphere", unreal.Vector(context.door_x - 70.0, context.y - 66.0, 146.0), unreal.Vector(0.034, 0.034, 0.034), material_path("GlassTeal"))
    _shape(f"{context.label}_LockedLamp", "Sphere", unreal.Vector(context.door_x - 70.0, context.y - 66.0, 122.0), unreal.Vector(0.03, 0.03, 0.03), material_path("RoseGlow"))
    _cube(f"{context.label}_BoltTravelStart", unreal.Vector(context.door_x - 26.0, context.y - 62.0, 130.0), unreal.Vector(0.22, 0.016, 0.045), material_path("RoseGlow"))
    _cube(f"{context.label}_BoltTravelEnd", unreal.Vector(context.door_x + 26.0, context.y - 62.0, 130.0), unreal.Vector(0.22, 0.016, 0.045), material_path("GlassTeal"))
    _cube(f"{context.label}_OpenSwingArc", unreal.Vector(context.door_x + 36.0, context.y - 98.0, 42.0), unreal.Vector(0.58, 0.012, 0.035), accent_material_path(context.right))
    _text(f"{context.label}_UnlockCue", "키 확인 -> 볼트 이동 -> 경첩 소리 -> 다음 방 조명 유입", unreal.Vector(context.door_x, context.y - 112.0, 224.0), unreal.Rotator(0.0, 0.0, 0.0), 7.2)
    for index in range(5):
        _cube(f"{context.label}_StepArrow_{index + 1}", unreal.Vector(context.door_x + 28.0 + index * 22.0, context.y - 38.0 - index * 18.0, 16.0), unreal.Vector(0.13, 0.055, 0.018), accent_material_path(context.right))
    return 12


def _spawn_transition_audio(context: TransitionContext, audio_assets: AudioAssets) -> int:
    location = unreal.Vector(context.door_x - 44.0, context.y - 58.0, 148.0)
    asset_path = audio_assets.get("sfx_door_creak", "")
    if asset_path:
        sound = unreal.load_asset(asset_path)
        actor = _spawn(unreal.AmbientSound, location, label=f"{context.label}_DoorCreakEmitter")
        component = actor.get_editor_property("audio_component")
        component.set_editor_property("sound", sound)
        component.set_editor_property("volume_multiplier", 0.22)
        component.set_editor_property("auto_activate", True)
        emitted = 1
    else:
        emitted = 0
    _shape(f"{context.label}_AudioSource", "Sphere", unreal.Vector(location.x, location.y, location.z + 18.0), unreal.Vector(0.045, 0.045, 0.045), material_path("RoseGlow"))
    _text(f"{context.label}_AudioLabel", "door creak anchored at hinge", unreal.Vector(location.x, location.y - 24.0, location.z + 42.0), unreal.Rotator(0.0, 0.0, 0.0), 5.6)
    _point_light(f"{context.label}_AudioPulse", unreal.Vector(location.x, location.y, location.z + 26.0), _accent(context.left), 95.0, 120.0)
    return emitted + 3


def _context(left: RoomSpec, right: RoomSpec) -> TransitionContext:
    start = left.x + left.width / 2.0
    end = right.x - right.width / 2.0
    center = (start + end) / 2.0
    return TransitionContext(left, right, f"PE_Transition_{left.prefix}_To_{right.prefix}", center, start + 38.0, left.depth / 2.0 - 36.0)


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
