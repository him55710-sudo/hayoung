from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import TypeAlias, assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _spawn, _text

from .sound_profiles import lock_sound_profile
from .specs import LockKind, LockSpec, RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

AudioAssets: TypeAlias = Mapping[str, str]
Offset: TypeAlias = tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class PuzzleFeedbackContext:
    room: RoomSpec
    lock: LockSpec
    index: int
    label: str
    origin: "unreal.Vector"
    audio_assets: AudioAssets


def spawn_room_puzzle_feedback(room: RoomSpec, audio_assets: AudioAssets) -> int:
    count = 0
    for index, lock in enumerate(room.locks):
        context = PuzzleFeedbackContext(room, lock, index, _label(room, lock, index), _origin(room, lock), audio_assets)
        count += _spawn_feedback_station(context)
    return count


def _spawn_feedback_station(context: PuzzleFeedbackContext) -> int:
    count = _spawn_state_feedback(context)
    count += _spawn_progress_nodes(context)
    count += _spawn_correction_frames(context)
    count += _spawn_audio_anchors(context)
    return count


def _spawn_state_feedback(context: PuzzleFeedbackContext) -> int:
    _cube(f"{context.label}_BacklitResultPanel", context.origin, unreal.Vector(0.82, 0.024, 0.22), prop_material_path(context.room))
    _cube(f"{context.label}_GlassDiffuser", _point(context, (0.0, -8.0, 0.0)), unreal.Vector(0.76, 0.012, 0.16), material_path("HeavenPearl"))
    _text(f"{context.label}_FeedbackTitle", context.lock.title, _point(context, (0.0, -17.0, 24.0)), unreal.Rotator(0.0, 0.0, 0.0), 5.3)
    _text(f"{context.label}_FeedbackHint", _feedback_hint(context.lock.kind), _point(context, (0.0, -17.0, -24.0)), unreal.Rotator(0.0, 0.0, 0.0), 4.2)
    _cube(f"{context.label}_SignalLineToDoor", _point(context, (47.0, -9.0, 0.0)), unreal.Vector(0.32, 0.011, 0.018), accent_material_path(context.room))
    _shape(f"{context.label}_SuccessLamp", "Sphere", _point(context, (56.0, -14.0, 20.0)), unreal.Vector(0.043, 0.043, 0.043), material_path("GlassTeal"))
    _shape(f"{context.label}_ErrorLamp", "Sphere", _point(context, (56.0, -14.0, 4.0)), unreal.Vector(0.038, 0.038, 0.038), material_path("RoseGlow"))
    _shape(f"{context.label}_RewardKeyGlow", "Sphere", _point(context, (-56.0, -14.0, 20.0)), unreal.Vector(0.047, 0.047, 0.047), material_path("BrassEdge"))
    _cube(f"{context.label}_ResetStrip", _point(context, (-54.0, -14.0, -11.0)), unreal.Vector(0.18, 0.011, 0.026), material_path("DeepShadow"))
    _cube(f"{context.label}_HandReboundRail", _point(context, (0.0, -15.0, 13.0)), unreal.Vector(0.54, 0.012, 0.017), accent_material_path(context.room))
    _point_light(f"{context.label}_ResultHalo", _point(context, (0.0, -42.0, 24.0)), _accent(context.room), 190.0, 150.0)
    return 11


def _spawn_progress_nodes(context: PuzzleFeedbackContext) -> int:
    count = 0
    answer_length = len(context.lock.answer)
    for slot in range(answer_length):
        x = -36.0 + slot * min(18.0, 72.0 / max(answer_length, 1))
        _shape(f"{context.label}_ProgressNode_{slot + 1:02d}", "Sphere", _point(context, (x, -15.0, -41.0)), unreal.Vector(0.025, 0.025, 0.025), accent_material_path(context.room))
        count += 1
    return count


def _spawn_correction_frames(context: PuzzleFeedbackContext) -> int:
    for index, offset in enumerate((-22.0, 0.0, 22.0), start=1):
        _cube(f"{context.label}_CorrectionFrame_{index:02d}", _point(context, (offset, -16.0, 42.0)), unreal.Vector(0.16, 0.010, 0.034), material_path("RoseGlow"))
    return 3


def _spawn_audio_anchors(context: PuzzleFeedbackContext) -> int:
    profile = lock_sound_profile(context.lock.kind)
    count = _spawn_emitter(context, "InputEmitter", profile.input_key, (-30.0, -24.0, 2.0), 0.10)
    count += _spawn_emitter(context, "SuccessEmitter", profile.success_key, (0.0, -24.0, 2.0), 0.13)
    count += _spawn_emitter(context, "ErrorEmitter", profile.fail_key, (30.0, -24.0, 2.0), 0.11)
    return count


def _spawn_emitter(context: PuzzleFeedbackContext, suffix: str, sound_key: str, offset: Offset, volume: float) -> int:
    asset_path = context.audio_assets.get(sound_key, "")
    if not asset_path:
        return 0
    sound = unreal.load_asset(asset_path)
    actor = _spawn(unreal.AmbientSound, _point(context, offset), label=f"{context.label}_{suffix}")
    component = actor.get_editor_property("audio_component")
    component.set_editor_property("sound", sound)
    component.set_editor_property("volume_multiplier", volume)
    component.set_editor_property("auto_activate", False)
    return 1


def _feedback_hint(kind: LockKind) -> str:
    match kind:
        case LockKind.COMBINATION:
            return "휠 정렬 후 걸쇠가 위로 빠지는 순간을 강조"
        case LockKind.DIRECTION:
            return "각 방향 입력마다 노드가 차례로 켜짐"
        case LockKind.KEYPAD:
            return "삑 소리, 입력 슬롯, 잠금 해제 램프가 연결"
        case LockKind.KEYED_PADLOCK:
            return "열쇠 삽입과 90도 회전 뒤 보상 키 글로우"
        case LockKind.MAGNETIC:
            return "자석 스냅과 릴레이 피드백을 같은 지점에 배치"
        case LockKind.BUTTON_SEQUENCE:
            return "색 버튼 순서 실패 시 리셋 스트립이 짧게 점등"
        case LockKind.LETTER:
            return "문자 드럼 정렬마다 진행 노드가 고정"
        case LockKind.SAFE_DIAL:
            return "좌우 회전 단계와 금고 볼트 후퇴를 분리 표시"
        case unreachable:
            assert_never(unreachable)


def _label(room: RoomSpec, lock: LockSpec, index: int) -> str:
    return f"PE_PuzzleFeedback_{room.prefix}_L{index + 1:02d}_{lock.kind.value}"


def _origin(room: RoomSpec, lock: LockSpec) -> "unreal.Vector":
    return unreal.Vector(room.x + lock.rel_x, lock.rel_y - 255.0, 166.0)


def _point(context: PuzzleFeedbackContext, offset: Offset) -> "unreal.Vector":
    return unreal.Vector(context.origin.x + offset[0], context.origin.y + offset[1], context.origin.z + offset[2])


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
