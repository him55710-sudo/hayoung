from __future__ import annotations

from typing import Final

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _spawn, _text

from .specs import ROOMS, RoomSpec


LEVEL_PATH: Final[str] = "/Game/Maps/Hayoung500EscapeCafe_Legendary"
LABEL_PREFIXES: Final[tuple[str, ...]] = (
    "PremiumEscape_",
    "PE_Audio_",
    "PE_Player_",
    "PE_Connector_",
    "PE_Finale_",
    "PE_Ending_",
    "PE_Interact_",
    "PE_Door_",
    "PE_Runtime_",
    "PE_RuntimeRealEscapeProp_",
    "PE_RuntimeSecret_",
    "PE_Fixture_",
    "PE_Visual_",
    "PE_Setpiece_",
    "PE_Camera_",
    "PE_Path_",
    "PE_Playability_",
    "PE_Mechanism_",
    "PE_Dressing_",
    "PE_SpatialAudio_",
    "PE_ClueChain_",
    "PE_CrossChain_",
    "PE_Progress_",
    "PE_LockHardware_",
    "PE_DoorHardware_",
    "PE_Operations_",
    "PE_LightingQuality_",
    "PE_PuzzleFeedback_",
    "PE_LockMotion_",
    "PE_LockOperation_",
    "PE_SearchSurface_",
    "PE_RealEscapeProp_",
    "PE_RoomDressing_",
    "PE_Room1Proto_",
    "PE_SecretDiscovery_",
    "PE_RoomShape_",
    "PE_Cinematic_",
    "PE_Foley_",
    "PE_Hint_",
    "PE_Timer_",
    "PE_Transition_",
    "R01_",
)


def open_or_create_level() -> None:
    unreal.EditorAssetLibrary.make_directory("/Game/Maps")
    if unreal.EditorAssetLibrary.does_asset_exist(LEVEL_PATH):
        unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
        return
    unreal.EditorLevelLibrary.new_level(LEVEL_PATH)


def clear_generated_actors() -> None:
    actor_subsystem = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    for actor in list(actor_subsystem.get_all_level_actors()):
        label = actor.get_actor_label()
        if label.startswith(LABEL_PREFIXES):
            actor_subsystem.destroy_actor(actor)


def save_current_level() -> bool:
    return bool(unreal.EditorLevelLibrary.save_current_level())


def spawn_player_start() -> int:
    start = _spawn(unreal.PlayerStart, unreal.Vector(-280.0, -180.0, 45.0), unreal.Rotator(0.0, 35.0, 0.0), "PE_Player_FirstPersonStart")
    start.set_actor_scale3d(unreal.Vector(1.0, 1.0, 1.0))
    _shape("PE_Player_3D_Capsule_Reference", "Cylinder", unreal.Vector(-260.0, -145.0, 88.0), unreal.Vector(0.28, 0.28, 0.88))
    _cube("PE_Player_Interaction_Raycast", unreal.Vector(-205.0, -95.0, 118.0), unreal.Vector(0.025, 1.3, 0.025))
    _cube("PE_Player_Camera_Eye_Height", unreal.Vector(-260.0, -145.0, 158.0), unreal.Vector(0.16, 0.05, 0.05))
    _text("PE_Player_Interaction_Range", "1인칭 시작 / WASD 이동 / E 상호작용 / 시선 레이캐스트", unreal.Vector(-260.0, -220.0, 150.0), unreal.Rotator(0.0, 20.0, 0.0), 18.0)
    return 5


def spawn_connector(left: RoomSpec, right: RoomSpec) -> int:
    start = left.x + left.width / 2.0
    end = right.x - right.width / 2.0
    center = (start + end) / 2.0
    length = max(120.0, end - start)
    door_x = start + 38.0
    _cube(f"PE_Connector_{left.prefix}_To_{right.prefix}_Floor", unreal.Vector(center, left.depth / 2.0 - 35.0, -6.0), unreal.Vector(length / 100.0, 0.62, 0.08))
    _cube(f"PE_Door_{left.prefix}_To_{right.prefix}_ClosedPanel", unreal.Vector(door_x, left.depth / 2.0 - 36.0, 126.0), unreal.Vector(0.74, 0.035, 1.45))
    _cube(f"PE_Door_{left.prefix}_To_{right.prefix}_OpenGhost", unreal.Vector(door_x + 58.0, left.depth / 2.0 - 98.0, 126.0), unreal.Vector(0.74, 0.025, 1.45))
    _cube(f"PE_Door_{left.prefix}_To_{right.prefix}_HingeAxis", unreal.Vector(door_x - 42.0, left.depth / 2.0 - 40.0, 126.0), unreal.Vector(0.035, 0.035, 1.55))
    _text(f"PE_Connector_{left.prefix}_To_{right.prefix}_UnlockChain", "이전 방 보상 키가 다음 방 장치를 활성화", unreal.Vector(center, left.depth / 2.0 - 78.0, 128.0), unreal.Rotator(0.0, 0.0, 0.0), 13.0)
    _text(f"PE_Door_{left.prefix}_To_{right.prefix}_CreakCue", "SFX: sfx_door_creak / 문 패널 82도 회전", unreal.Vector(door_x + 50.0, left.depth / 2.0 - 110.0, 210.0), unreal.Rotator(0.0, 0.0, 0.0), 11.0)
    return 6


def spawn_finale(theme_label: str) -> int:
    final_room = ROOMS[-1]
    _text("PE_Finale_Title", theme_label, unreal.Vector(final_room.x, -final_room.depth / 2.0 + 88.0, 315.0), unreal.Rotator(0.0, 0.0, 0.0), 44.0)
    _shape("PE_Finale_Heaven_Gate_Ring", "Cylinder", unreal.Vector(final_room.x, final_room.depth / 2.0 - 96.0, 198.0), unreal.Vector(1.25, 1.25, 0.08))
    _point_light("PE_Finale_500Day_Bloom", unreal.Vector(final_room.x, final_room.depth / 2.0 - 160.0, 245.0), unreal.LinearColor(0.95, 0.92, 1.0, 1.0), 4200.0, 1200.0)
    _text("PE_Finale_Ending_Trigger", "마지막 하트 키 사용 시 엔딩 BGM + 편지 연출", unreal.Vector(final_room.x, final_room.depth / 2.0 - 220.0, 128.0), unreal.Rotator(0.0, 0.0, 0.0), 16.0)
    return 4


def color(room: RoomSpec) -> "unreal.LinearColor":
    return unreal.LinearColor(room.accent[0], room.accent[1], room.accent[2], 1.0)
