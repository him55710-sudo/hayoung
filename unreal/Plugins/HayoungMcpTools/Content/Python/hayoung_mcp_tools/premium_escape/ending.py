from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Final, TypeAlias

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _spawn, _text

from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

AudioAssets: TypeAlias = Mapping[str, str]


@dataclass(frozen=True, slots=True)
class EndingContext:
    room: RoomSpec
    audio_assets: AudioAssets
    label: str


@dataclass(frozen=True, slots=True)
class EndingAudioCue:
    name: str
    sound_key: str
    rel_x: float
    rel_y: float
    z: float
    volume: float
    active: bool


ENDING_AUDIO_CUES: Final[tuple[EndingAudioCue, ...]] = (
    EndingAudioCue("BgmCue", "bgm_heaven_vault", 0.0, 292.0, 248.0, 0.52, True),
    EndingAudioCue("ChimeCue", "sfx_heaven_chime", -220.0, 210.0, 182.0, 0.24, False),
    EndingAudioCue("HeartKeyCue", "sfx_key_turn", 245.0, -176.0, 124.0, 0.22, False),
    EndingAudioCue("DoorCreakCue", "sfx_door_creak", 455.0, 338.0, 136.0, 0.25, False),
    EndingAudioCue("LetterRustleCue", "sfx_paper_rustle", 18.0, -178.0, 126.0, 0.18, False),
)


def spawn_finale_ceremony(room: RoomSpec, audio_assets: AudioAssets) -> int:
    context = EndingContext(room, audio_assets, f"PE_Ending_{room.prefix}")
    count = _spawn_ceremony_stage(context)
    count += _spawn_memory_rewards(context)
    count += _spawn_final_unlock_motion(context)
    count += _spawn_photo_spot(context)
    count += _spawn_audio_cues(context)
    return count


def _spawn_ceremony_stage(context: EndingContext) -> int:
    room = context.room
    front_y = room.depth / 2.0 - 152.0
    _cube(f"{context.label}_CloudAisle", unreal.Vector(room.x, -room.depth * 0.16, 12.0), unreal.Vector(2.25, 2.95, 0.08), material_path("GlassTeal"))
    _cube(f"{context.label}_CeremonyPlatform", unreal.Vector(room.x, front_y, 18.0), unreal.Vector(2.9, 0.82, 0.14), prop_material_path(room))
    _shape(f"{context.label}_500DayArch_LeftPillar", "Cylinder", unreal.Vector(room.x - 194.0, front_y, 152.0), unreal.Vector(0.18, 0.18, 1.52), material_path("BrassEdge"))
    _shape(f"{context.label}_500DayArch_RightPillar", "Cylinder", unreal.Vector(room.x + 194.0, front_y, 152.0), unreal.Vector(0.18, 0.18, 1.52), material_path("BrassEdge"))
    _shape(f"{context.label}_500DayArch_Ring", "Cylinder", unreal.Vector(room.x, front_y, 276.0), unreal.Vector(1.88, 1.88, 0.055), accent_material_path(room))
    _text(f"{context.label}_FinalLetter_Title", "500일의 마지막 편지", unreal.Vector(room.x, front_y - 38.0, 228.0), unreal.Rotator(0.0, 0.0, 0.0), 18.0)
    _text(f"{context.label}_EndingVowText", "모든 방의 기억을 모아 하트 키로 엔딩문을 연다", unreal.Vector(room.x, front_y - 58.0, 205.0), unreal.Rotator(0.0, 0.0, 0.0), 8.0)
    _point_light(f"{context.label}_WarmFinaleBloom", unreal.Vector(room.x, front_y - 92.0, 245.0), _accent(room), 1500.0, 760.0)
    return 8


def _spawn_memory_rewards(context: EndingContext) -> int:
    room = context.room
    count = 0
    for index, title in enumerate(("첫 기록", "카페 약속", "비 오는 날", "야간 도시", "하늘 금고")):
        x = room.x - 312.0 + index * 156.0
        _cube(f"{context.label}_MemoryPhoto_{index + 1:02d}", unreal.Vector(x, 74.0, 132.0), unreal.Vector(0.08, 0.38, 0.30), material_path("WarmPlaster"))
        _cube(f"{context.label}_MemoryPhotoGlow_{index + 1:02d}", unreal.Vector(x, 70.0, 132.0), unreal.Vector(0.018, 0.42, 0.34), accent_material_path(room))
        _text(f"{context.label}_MemoryLabel_{index + 1:02d}", title, unreal.Vector(x, 48.0, 174.0), unreal.Rotator(0.0, 0.0, 0.0), 5.8)
        count += 3
    for index, coupon in enumerate(("바나나우유", "설빙", "방탈출 데이트")):
        x = room.x - 130.0 + index * 130.0
        _cube(f"{context.label}_HintPenaltyCoupon_{index + 1:02d}", unreal.Vector(x, -236.0, 88.0), unreal.Vector(0.42, 0.035, 0.16), prop_material_path(room))
        _text(f"{context.label}_HintPenaltyCouponText_{index + 1:02d}", coupon, unreal.Vector(x, -248.0, 111.0), unreal.Rotator(0.0, 0.0, 0.0), 5.0)
        count += 2
    _cube(f"{context.label}_FinalLetterPedestal", unreal.Vector(room.x, -176.0, 72.0), unreal.Vector(0.64, 0.44, 0.34), material_path("BrassEdge"))
    _cube(f"{context.label}_FinalLetterEnvelope", unreal.Vector(room.x, -192.0, 118.0), unreal.Vector(0.44, 0.026, 0.16), material_path("WarmPlaster"))
    _cube(f"{context.label}_HeartKeyReturnTray", unreal.Vector(room.x + 72.0, -210.0, 112.0), unreal.Vector(0.24, 0.045, 0.045), accent_material_path(room))
    _shape(f"{context.label}_HeartKeyToken", "Sphere", unreal.Vector(room.x + 72.0, -226.0, 128.0), unreal.Vector(0.09, 0.06, 0.045), material_path("RoseGlow"))
    _text(f"{context.label}_FinalLetterBody", "하영아, 500일 동안의 모든 단서가 우리 이야기였어.", unreal.Vector(room.x, -232.0, 152.0), unreal.Rotator(0.0, 0.0, 0.0), 6.2)
    return count + 5


def _spawn_final_unlock_motion(context: EndingContext) -> int:
    room = context.room
    gate_y = room.depth / 2.0 - 52.0
    _cube(f"{context.label}_EndingDoor_LeftClosed", unreal.Vector(room.x - 76.0, gate_y, 132.0), unreal.Vector(0.72, 0.045, 1.42), material_path("DeepShadow"))
    _cube(f"{context.label}_EndingDoor_RightClosed", unreal.Vector(room.x + 76.0, gate_y, 132.0), unreal.Vector(0.72, 0.045, 1.42), material_path("DeepShadow"))
    _cube(f"{context.label}_EndingDoor_LeftOpenGhost", unreal.Vector(room.x - 162.0, gate_y - 86.0, 132.0), unreal.Vector(0.72, 0.024, 1.42), material_path("GlassTeal"))
    _cube(f"{context.label}_EndingDoor_RightOpenGhost", unreal.Vector(room.x + 162.0, gate_y - 86.0, 132.0), unreal.Vector(0.72, 0.024, 1.42), material_path("GlassTeal"))
    _shape(f"{context.label}_HeartLockBody", "Sphere", unreal.Vector(room.x, gate_y - 20.0, 136.0), unreal.Vector(0.28, 0.16, 0.22), material_path("RoseGlow"))
    _cube(f"{context.label}_KeyInsertTrack", unreal.Vector(room.x - 48.0, gate_y - 24.0, 136.0), unreal.Vector(0.36, 0.028, 0.026), accent_material_path(room))
    for index in range(5):
        _shape(f"{context.label}_FinalTumbler_{index + 1}", "Cylinder", unreal.Vector(room.x - 64.0 + index * 32.0, gate_y - 32.0, 92.0), unreal.Vector(0.095, 0.095, 0.036), material_path("BrassEdge"))
    _text(f"{context.label}_UnlockMotionLabel", "삽입 -> 천천히 회전 -> 5개 텀블러 정렬 -> 양문 개방", unreal.Vector(room.x, gate_y - 68.0, 208.0), unreal.Rotator(0.0, 0.0, 0.0), 6.2)
    _point_light(f"{context.label}_UnlockSpark", unreal.Vector(room.x, gate_y - 48.0, 164.0), _accent(room), 680.0, 280.0)
    return 12


def _spawn_photo_spot(context: EndingContext) -> int:
    room = context.room
    spot_y = room.depth / 2.0 - 292.0
    _cube(f"{context.label}_PhotoSpotFloorMark", unreal.Vector(room.x, spot_y, 5.0), unreal.Vector(1.05, 0.54, 0.018), accent_material_path(room))
    _cube(f"{context.label}_PhotoSpotBackdrop", unreal.Vector(room.x, spot_y + 68.0, 154.0), unreal.Vector(1.72, 0.035, 1.24), material_path("WarmPlaster"))
    _text(f"{context.label}_PhotoSpotTitle", "500일 탈출 성공", unreal.Vector(room.x, spot_y + 38.0, 232.0), unreal.Rotator(0.0, 0.0, 0.0), 16.0)
    _shape(f"{context.label}_PhotoSpotStaffCamera", "Sphere", unreal.Vector(room.x - 224.0, spot_y - 88.0, 142.0), unreal.Vector(0.12, 0.12, 0.085), material_path("DeepShadow"))
    _cube(f"{context.label}_PhotoSpotCompletionStampPad", unreal.Vector(room.x + 218.0, spot_y - 62.0, 72.0), unreal.Vector(0.30, 0.17, 0.05), prop_material_path(room))
    _text(f"{context.label}_PhotoSpotStaffCompletionBoard", "스태프 확인 / 성공 사진 / 기념 도장", unreal.Vector(room.x + 208.0, spot_y - 80.0, 118.0), unreal.Rotator(0.0, 0.0, 0.0), 5.4)
    _point_light(f"{context.label}_PhotoSpotSoftbox", unreal.Vector(room.x - 118.0, spot_y - 104.0, 216.0), unreal.LinearColor(1.0, 0.86, 0.74, 1.0), 720.0, 420.0)
    return 7


def _spawn_audio_cues(context: EndingContext) -> int:
    count = 0
    for cue in ENDING_AUDIO_CUES:
        count += _spawn_audio_cue(context, cue)
    return count


def _spawn_audio_cue(context: EndingContext, cue: EndingAudioCue) -> int:
    room = context.room
    location = unreal.Vector(room.x + cue.rel_x, cue.rel_y, cue.z)
    label = f"{context.label}_{cue.name}"
    asset_path = context.audio_assets.get(cue.sound_key)
    emitted = 0
    if asset_path:
        sound = unreal.load_asset(asset_path)
        actor = _spawn(unreal.AmbientSound, location, label=f"{label}_Emitter")
        component = actor.get_editor_property("audio_component")
        component.set_editor_property("sound", sound)
        component.set_editor_property("volume_multiplier", cue.volume)
        component.set_editor_property("auto_activate", cue.active)
        emitted = 1
    _shape(f"{label}_SourceOrb", "Sphere", unreal.Vector(location.x, location.y, location.z + 16.0), unreal.Vector(0.052, 0.052, 0.052), material_path("GlassTeal"))
    _text(f"{label}_Label", cue.sound_key, unreal.Vector(location.x, location.y - 22.0, location.z + 36.0), unreal.Rotator(0.0, 0.0, 0.0), 5.0)
    _point_light(f"{label}_Pulse", unreal.Vector(location.x, location.y, location.z + 22.0), _accent(room), 95.0, 132.0)
    return emitted + 3


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
