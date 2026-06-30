from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Final, TypeAlias

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _point_light, _shape, _spawn, _text

from .specs import RoomSpec
from .visuals import material_path

AudioAssets: TypeAlias = Mapping[str, str]


@dataclass(frozen=True, slots=True)
class SpatialEmitterSpec:
    name: str
    sound_key: str
    rel_x: float
    rel_y: float
    z: float
    volume: float


@dataclass(frozen=True, slots=True)
class RoomSpatialAudioSet:
    prefix: str
    emitters: tuple[SpatialEmitterSpec, ...]


ROOM_SPATIAL_AUDIO: Final[tuple[RoomSpatialAudioSet, ...]] = (
    RoomSpatialAudioSet("PremiumEscape_Room01_DiaryArchive", (SpatialEmitterSpec("PaperRustle", "sfx_paper_rustle", -225.0, 185.0, 142.0, 0.22), SpatialEmitterSpec("DrawerSlideLoop", "sfx_drawer_slide", 210.0, -135.0, 82.0, 0.12), SpatialEmitterSpec("HintPhoneBuzz", "sfx_phone_buzz", -310.0, -35.0, 132.0, 0.18))),
    RoomSpatialAudioSet("PremiumEscape_Room02_CafePromise", (SpatialEmitterSpec("EspressoSteam", "sfx_cafe_machine", -310.0, 205.0, 124.0, 0.24), SpatialEmitterSpec("ServiceBellAir", "sfx_keypad_beep", 225.0, -160.0, 102.0, 0.10), SpatialEmitterSpec("MenuNeonHum", "sfx_neon_hum", 10.0, 292.0, 226.0, 0.16))),
    RoomSpatialAudioSet("PremiumEscape_Room03_RainRepair", (SpatialEmitterSpec("RainWindow", "sfx_rain_window", -210.0, 330.0, 205.0, 0.32), SpatialEmitterSpec("FuseBuzz", "sfx_neon_hum", 205.0, 170.0, 145.0, 0.18), SpatialEmitterSpec("ValvePipeTick", "sfx_lock_click", -170.0, -235.0, 105.0, 0.10))),
    RoomSpatialAudioSet("PremiumEscape_Room04_NightCity", (SpatialEmitterSpec("CityNeonHum", "sfx_neon_hum", -300.0, 275.0, 238.0, 0.25), SpatialEmitterSpec("SafeMetalGroan", "sfx_safe_open", -265.0, 140.0, 104.0, 0.13), SpatialEmitterSpec("ElevatorPanelBeep", "sfx_keypad_beep", 315.0, -130.0, 136.0, 0.12))),
    RoomSpatialAudioSet("PremiumEscape_Room05_HeavenVault", (SpatialEmitterSpec("CloudChime", "sfx_heaven_chime", -280.0, 235.0, 190.0, 0.28), SpatialEmitterSpec("LetterVaultGlow", "sfx_paper_rustle", 255.0, -185.0, 138.0, 0.18), SpatialEmitterSpec("HeartGateBloom", "sfx_heaven_chime", 0.0, 332.0, 240.0, 0.24))),
)


def spawn_room_spatial_audio(room: RoomSpec, audio_assets: AudioAssets) -> int:
    if not audio_assets:
        return 0
    count = 0
    for emitter in _emitters_for(room):
        count += _spawn_emitter(room, audio_assets, emitter)
    return count


def _spawn_emitter(room: RoomSpec, audio_assets: AudioAssets, emitter: SpatialEmitterSpec) -> int:
    asset_path = audio_assets.get(emitter.sound_key)
    if not asset_path:
        return 0
    location = unreal.Vector(room.x + emitter.rel_x, emitter.rel_y, emitter.z)
    sound = unreal.load_asset(asset_path)
    actor = _spawn(unreal.AmbientSound, location, label=f"PE_SpatialAudio_{room.prefix}_{emitter.name}")
    component = actor.get_editor_property("audio_component")
    component.set_editor_property("sound", sound)
    component.set_editor_property("volume_multiplier", emitter.volume)
    component.set_editor_property("auto_activate", True)
    _shape(f"PE_SpatialAudio_{room.prefix}_{emitter.name}_SourceOrb", "Sphere", unreal.Vector(location.x, location.y, location.z + 18.0), unreal.Vector(0.055, 0.055, 0.055), material_path("GlassTeal"))
    _text(f"PE_SpatialAudio_{room.prefix}_{emitter.name}_Label", emitter.name, unreal.Vector(location.x, location.y - 24.0, location.z + 38.0), unreal.Rotator(0.0, 0.0, 0.0), 7.0)
    _point_light(f"PE_SpatialAudio_{room.prefix}_{emitter.name}_Pulse", unreal.Vector(location.x, location.y, location.z + 24.0), unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0), 130.0, 145.0)
    return 4


def _emitters_for(room: RoomSpec) -> tuple[SpatialEmitterSpec, ...]:
    for audio_set in ROOM_SPATIAL_AUDIO:
        if audio_set.prefix == room.prefix:
            return audio_set.emitters
    return ()
