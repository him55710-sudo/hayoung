from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _spawn, _text

from .specs import RoomSpec


@dataclass(frozen=True, slots=True)
class SoundActorSpec:
    label: str
    asset_path: str
    location: "unreal.Vector"
    volume: float


def spawn_room_audio(room: RoomSpec, audio_assets: Mapping[str, str]) -> int:
    if not audio_assets:
        _text(f"{room.prefix}_Ambience_Pending", f"BGM slot: {room.ambient_key}", unreal.Vector(room.x, -room.depth / 2.0 + 48.0, 185.0), unreal.Rotator(0.0, 0.0, 0.0), 14.0)
        return 1
    _ambient_sound(SoundActorSpec(f"PE_Audio_{room.prefix}_Loop", audio_assets[room.ambient_key], unreal.Vector(room.x, -room.depth / 2.0 + 80.0, 190.0), 0.45))
    for index, key in enumerate(("sfx_door_creak", "sfx_lock_click", "sfx_key_pickup", "sfx_keypad_beep")):
        _ambient_sound(SoundActorSpec(f"PE_Audio_{room.prefix}_{key}_TriggerMarker", audio_assets[key], unreal.Vector(room.x - 135.0 + index * 90.0, room.depth / 2.0 - 90.0, 90.0), 0.0))
    return 5


def _ambient_sound(spec: SoundActorSpec) -> None:
    sound = unreal.load_asset(spec.asset_path)
    actor = _spawn(unreal.AmbientSound, spec.location, label=spec.label)
    component = actor.get_editor_property("audio_component")
    component.set_editor_property("sound", sound)
    component.set_editor_property("volume_multiplier", spec.volume)
    component.set_editor_property("auto_activate", spec.volume > 0.0)
