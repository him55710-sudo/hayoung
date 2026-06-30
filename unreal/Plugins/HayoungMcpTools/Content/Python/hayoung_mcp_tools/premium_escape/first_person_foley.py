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
class FoleyCue:
    name: str
    sound_key: str
    rel_x: float
    rel_y: float
    z: float
    volume: float
    caption: str


@dataclass(frozen=True, slots=True)
class FoleyProfile:
    prefix: str
    floor_tag: str
    footstep_sound: str
    material_note: str
    cues: tuple[FoleyCue, ...]


FOLEY_PROFILES: Final[tuple[FoleyProfile, ...]] = (
    FoleyProfile("PremiumEscape_Room01_DiaryArchive", "wood_creak", "sfx_footstep_wood", "좁은 목재 바닥과 책장 사이의 삐걱임", (FoleyCue("NearBookshelfStep", "sfx_footstep_wood", -250.0, 110.0, 46.0, 0.12, "책장 앞 발소리"), FoleyCue("DrawerTouch", "sfx_drawer_slide", 205.0, -128.0, 76.0, 0.14, "서랍 손잡이 마찰"), FoleyCue("LetterCloth", "sfx_cloth_rustle", -30.0, -205.0, 118.0, 0.11, "편지 봉투 스침"), FoleyCue("DoorCreakClose", "sfx_door_creak", 330.0, 230.0, 124.0, 0.18, "다음 문 경첩"), FoleyCue("FocusedBreath", "sfx_breath_focus", -10.0, 40.0, 154.0, 0.08, "잠금장치 앞 긴장감"))),
    FoleyProfile("PremiumEscape_Room02_CafePromise", "cafe_tile", "sfx_footstep_tile", "타일 바닥, 카운터, 벨, 에스프레소 잔향", (FoleyCue("TileStepLane", "sfx_footstep_tile", -260.0, 30.0, 44.0, 0.13, "카페 타일 발소리"), FoleyCue("CounterTap", "sfx_button_press", -205.0, 230.0, 98.0, 0.10, "카운터 버튼 터치"), FoleyCue("ServiceBell", "sfx_service_bell", 235.0, -165.0, 112.0, 0.15, "벨 힌트 반응"), FoleyCue("BoothFabric", "sfx_cloth_rustle", 305.0, 80.0, 88.0, 0.10, "부스 천 스침"), FoleyCue("ExitHinge", "sfx_door_creak", 410.0, 290.0, 126.0, 0.17, "카페 출구 경첩"))),
    FoleyProfile("PremiumEscape_Room03_RainRepair", "wet_concrete", "sfx_footstep_concrete", "젖은 콘크리트와 금속 공구의 둔한 울림", (FoleyCue("WetStep", "sfx_footstep_concrete", -210.0, 120.0, 44.0, 0.14, "젖은 바닥 발소리"), FoleyCue("ToolBump", "sfx_floor_creak", -260.0, -230.0, 82.0, 0.12, "공구함 충돌"), FoleyCue("FuseToggle", "sfx_fuse_toggle", 215.0, 168.0, 140.0, 0.16, "퓨즈 토글"), FoleyCue("ValveTurn", "sfx_valve_turn", -170.0, -240.0, 104.0, 0.15, "밸브 회전"), FoleyCue("MetalDoor", "sfx_door_creak", 300.0, 330.0, 128.0, 0.18, "수리실 철문"))),
    FoleyProfile("PremiumEscape_Room04_NightCity", "metal_rooftop", "sfx_footstep_metal", "옥상 금속판과 도시 모형 사이의 얇은 반향", (FoleyCue("MetalStep", "sfx_footstep_metal", -330.0, 120.0, 46.0, 0.15, "옥상 금속판 발소리"), FoleyCue("SafeDialTouch", "sfx_dial_tick", -265.0, 155.0, 112.0, 0.13, "금고 다이얼 접촉"), FoleyCue("MiniCityTap", "sfx_floor_creak", 60.0, 250.0, 92.0, 0.10, "도시 모형 진동"), FoleyCue("ElevatorChime", "sfx_elevator_chime", 320.0, -135.0, 136.0, 0.14, "엘리베이터 패널"), FoleyCue("RooftopDoor", "sfx_door_creak", 450.0, 315.0, 130.0, 0.18, "옥상문 경첩"))),
    FoleyProfile("PremiumEscape_Room05_HeavenVault", "soft_cloud", "sfx_footstep_cloud", "부드러운 구름길과 예식홀 잔향", (FoleyCue("CloudStep", "sfx_footstep_cloud", -300.0, 160.0, 52.0, 0.14, "구름길 발소리"), FoleyCue("LetterVault", "sfx_paper_rustle", 255.0, -185.0, 138.0, 0.12, "편지 금고 종이"), FoleyCue("HeartKeyTurn", "sfx_key_turn", 250.0, -180.0, 124.0, 0.15, "하트 키 회전"), FoleyCue("CeremonyCloth", "sfx_cloth_rustle", 10.0, 245.0, 104.0, 0.11, "예식 천 장식"), FoleyCue("FinalDoor", "sfx_door_creak", 460.0, 350.0, 134.0, 0.20, "엔딩문 개방"))),
)


def spawn_room_first_person_foley(room: RoomSpec, audio_assets: AudioAssets) -> int:
    profile = _profile_for(room)
    count = _spawn_body_reference(room, profile)
    count += _spawn_step_lane(room, profile)
    for cue in profile.cues:
        count += _spawn_cue(room, audio_assets, profile, cue)
    return count


def _spawn_body_reference(room: RoomSpec, profile: FoleyProfile) -> int:
    base = f"PE_Foley_{room.prefix}_Body"
    _shape(f"{base}_CapsuleGhost", "Cylinder", unreal.Vector(room.x - room.width / 2.0 + 92.0, -room.depth / 2.0 + 118.0, 94.0), unreal.Vector(0.22, 0.22, 0.88), material_path("GlassTeal"))
    _cube(f"{base}_EyeHeightRail", unreal.Vector(room.x - room.width / 2.0 + 92.0, -room.depth / 2.0 + 118.0, 158.0), unreal.Vector(0.42, 0.018, 0.018), accent_material_path(room))
    _cube(f"{base}_ShoulderClearanceGate", unreal.Vector(room.x - room.width / 2.0 + 128.0, -room.depth / 2.0 + 118.0, 118.0), unreal.Vector(0.05, 0.015, 0.74), material_path("BrassEdge"))
    _text(f"{base}_PresenceLabel", f"1인칭 몸 기준 / {profile.material_note}", unreal.Vector(room.x - room.width / 2.0 + 150.0, -room.depth / 2.0 + 92.0, 170.0), unreal.Rotator(0.0, 0.0, 0.0), 7.0)
    _point_light(f"{base}_EyeGlint", unreal.Vector(room.x - room.width / 2.0 + 92.0, -room.depth / 2.0 + 96.0, 164.0), _accent(room), 120.0, 130.0)
    return 5


def _spawn_step_lane(room: RoomSpec, profile: FoleyProfile) -> int:
    base = f"PE_Foley_{room.prefix}_Surface_{profile.floor_tag}"
    for index in range(6):
        x = room.x - room.width / 2.0 + 150.0 + index * (room.width - 300.0) / 5.0
        y = -room.depth / 2.0 + 158.0 + (index % 2) * 32.0
        _cube(f"{base}_FootstepPad_{index + 1}", unreal.Vector(x, y, 4.0), unreal.Vector(0.34, 0.18, 0.018), prop_material_path(room))
    _text(f"{base}_FootstepLabel", f"{profile.floor_tag} / {profile.footstep_sound}", unreal.Vector(room.x, -room.depth / 2.0 + 122.0, 58.0), unreal.Rotator(0.0, 0.0, 0.0), 7.0)
    _cube(f"{base}_CrouchNoiseZone", unreal.Vector(room.x, -room.depth / 2.0 + 198.0, 24.0), unreal.Vector(0.88, 0.16, 0.045), material_path("DeepShadow"))
    return 8


def _spawn_cue(room: RoomSpec, audio_assets: AudioAssets, profile: FoleyProfile, cue: FoleyCue) -> int:
    location = unreal.Vector(room.x + cue.rel_x, cue.rel_y, cue.z)
    label = f"PE_Foley_{room.prefix}_Cue_{cue.name}"
    asset_path = audio_assets.get(cue.sound_key, audio_assets.get(profile.footstep_sound, ""))
    if asset_path:
        sound = unreal.load_asset(asset_path)
        actor = _spawn(unreal.AmbientSound, location, label=f"{label}_Emitter")
        component = actor.get_editor_property("audio_component")
        component.set_editor_property("sound", sound)
        component.set_editor_property("volume_multiplier", cue.volume)
        component.set_editor_property("auto_activate", True)
        emitted = 1
    else:
        emitted = 0
    _shape(f"{label}_SourceDot", "Sphere", unreal.Vector(location.x, location.y, location.z + 18.0), unreal.Vector(0.042, 0.042, 0.042), material_path("RoseGlow"))
    _cube(f"{label}_TriggerPad", unreal.Vector(location.x, location.y, 7.0), unreal.Vector(0.28, 0.20, 0.018), accent_material_path(room))
    _text(f"{label}_Caption", cue.caption, unreal.Vector(location.x, location.y - 24.0, location.z + 38.0), unreal.Rotator(0.0, 0.0, 0.0), 5.4)
    _point_light(f"{label}_Pulse", unreal.Vector(location.x, location.y, location.z + 22.0), _accent(room), 90.0, 110.0)
    return emitted + 4


def _profile_for(room: RoomSpec) -> FoleyProfile:
    for profile in FOLEY_PROFILES:
        if profile.prefix == room.prefix:
            return profile
    return FOLEY_PROFILES[0]


def _accent(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
