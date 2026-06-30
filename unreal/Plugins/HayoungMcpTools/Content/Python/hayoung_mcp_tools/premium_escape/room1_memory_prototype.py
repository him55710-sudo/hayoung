from __future__ import annotations

from collections.abc import Mapping
from typing import Final

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _spawn, _text

from .room1_memory_assets import ensure_beef_board_material
from .room1_memory_specs import BEEF_SLOTS, MEMORY_FRAMES, PUZZLE_STATIONS, ROOM1_PROTO_PREFIX
from .specs import ROOMS, RoomSpec
from .visuals import material_path

AudioAssets = Mapping[str, str]

STORY_TEXT: Final[str] = "하영아. 방탈출을 풀며 우리의 추억을 잘 떠올려봐!!\n기억하지 못하면 영영 방 안에서 탈출하지 못해!"
ENTRY_TEXT: Final[str] = "인터넷 사용 가능\n힌트 사용은 현수에게 카톡 또는 전화"
LETTER_TEXT: Final[str] = "정하영,,,,\n너는 우리의 500일 기념일을 까먹었지...\n네가 좋아하던 오로나민 C도 이제 절대 안 먹을 거야.\n오늘부터 나는 다른 거 마실 거야. 됐어!\n정답: vita500"


def spawn_room1_memory_prototype(audio_assets: AudioAssets) -> int:
    room = _room1()
    count = 0
    count += _spawn_entry_area(room)
    count += _spawn_memory_wall(room)
    count += _spawn_music_area(room)
    count += _spawn_painting_and_grid(room)
    count += _spawn_beef_and_steak_area(room)
    count += _spawn_runtime_sequence(audio_assets)
    count += _spawn_room2_transition(audio_assets)
    return count


def _spawn_entry_area(room: RoomSpec) -> int:
    count = 0
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_Desk", unreal.Vector(-250.0, -222.0, 38.0), unreal.Vector(1.35, 0.55, 0.34), material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_LetterPaper", unreal.Vector(-250.0, -222.0, 78.0), unreal.Vector(0.74, 0.34, 0.018), material_path("HeavenPearl")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_StoryText", STORY_TEXT, unreal.Vector(room.x, -274.0, 176.0), 20.0)
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_EntryRuleText", ENTRY_TEXT, unreal.Vector(-284.0, -274.0, 112.0), 15.0)
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_LetterText", LETTER_TEXT, unreal.Vector(-250.0, -258.0, 122.0), 11.5)
    count += _movable(_point_light(f"{ROOM1_PROTO_PREFIX}_DeskWarmLamp", unreal.Vector(-244.0, -210.0, 178.0), unreal.LinearColor(1.0, 0.72, 0.42, 1.0), 880.0, 260.0))
    return count


def _spawn_memory_wall(room: RoomSpec) -> int:
    count = 0
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_MemoryWallTitle", "추억을 시간순으로 눌러라: 노랑 -> 초록 -> 파랑 -> 빨강", unreal.Vector(room.x, 266.0, 268.0), 18.0)
    for frame in MEMORY_FRAMES:
        count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_Frame_{frame.name}_Border_{frame.border_color}", _vector(frame.location), unreal.Vector(0.72, 0.035, 0.48), material_path(frame.material_key)))
        count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_Frame_{frame.name}_SymbolPanel", unreal.Vector(frame.location[0], frame.location[1] - 3.0, frame.location[2]), unreal.Vector(0.56, 0.026, 0.34), material_path("WarmPlaster")))
        count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_Frame_{frame.name}_Text", f"{frame.title}\n{frame.clue}\n테두리: {frame.border_color}", unreal.Vector(frame.location[0], frame.location[1] - 18.0, frame.location[2] + 4.0), 10.5)
    button_specs = (("Yellow", -180.0, "노랑", "BrassEdge"), ("Green", -60.0, "초록", "GlassTeal"), ("Blue", 60.0, "파랑", "RainBlue"), ("Red", 180.0, "빨강", "RoseGlow"))
    for name, x, label, material_key in button_specs:
        count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_ColorButton_{name}", "Cylinder", unreal.Vector(x, 176.0, 42.0), unreal.Vector(0.32, 0.32, 0.07), material_path(material_key)))
        count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_ColorButton_{name}_Label", label, unreal.Vector(x, 170.0, 84.0), 12.5)
    count += _movable(_point_light(f"{ROOM1_PROTO_PREFIX}_MemoryWallActivationLight", unreal.Vector(0.0, 210.0, 220.0), unreal.LinearColor(1.0, 0.86, 0.54, 1.0), 1350.0, 440.0))
    return count


def _spawn_music_area(room: RoomSpec) -> int:
    count = 0
    for index, x in enumerate((-314.0, -282.0, -250.0)):
        count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_Doll_{index + 1}", "Sphere", unreal.Vector(x, 28.0, 82.0), unreal.Vector(0.18, 0.18, 0.28), material_path("WarmPlaster")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_ViolinDollCue", "바이올린 키링을 쥐여주면\n인생의 회전목마 placeholder가 재생된다", unreal.Vector(-286.0, -34.0, 144.0), 12.0)
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_Shelf", unreal.Vector(294.0, 20.0, 96.0), unreal.Vector(0.95, 0.22, 0.08), material_path("WalnutDark")))
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_CarouselVisual", "Cylinder", unreal.Vector(294.0, 18.0, 138.0), unreal.Vector(0.30, 0.30, 0.12), material_path("RoseGlow")))
    count += _movable(_point_light(f"{ROOM1_PROTO_PREFIX}_CarouselSpatialSoundLight", unreal.Vector(294.0, 18.0, 190.0), unreal.LinearColor(1.0, 0.56, 0.78, 1.0), 900.0, 300.0))
    return count


def _spawn_painting_and_grid(room: RoomSpec) -> int:
    count = 0
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_BigPainting", unreal.Vector(298.0, 272.0, 148.0), unreal.Vector(1.34, 0.036, 0.82), material_path("WarmPlaster")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_BigPaintingText", "놀이공원 그림이다.\n회전목마 하나가 빠져 있다.", unreal.Vector(298.0, 252.0, 172.0), 14.0)
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_AddedCarouselVisual_HiddenCue", "Cylinder", unreal.Vector(348.0, 250.0, 198.0), unreal.Vector(0.18, 0.18, 0.055), material_path("BrassEdge")))
    for cell in range(1, 10):
        row = (cell - 1) // 3
        col = (cell - 1) % 3
        x = -96.0 + col * 68.0
        y = -52.0 + row * 68.0
        count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_FloorGrid_Cell{cell:02d}", unreal.Vector(x, y, 4.0), unreal.Vector(0.54, 0.54, 0.018), material_path("DeepShadow" if cell == 9 else "StoneFloor")))
        count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_FloorGrid_Cell{cell:02d}_Number", str(cell), unreal.Vector(x, y - 3.0, 18.0), 18.0)
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_PyeongsangBench", unreal.Vector(38.0, -42.0, 28.0), unreal.Vector(0.86, 0.42, 0.12), material_path("WalnutDark")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_GuroHintNote", "우리가 처음 앉았던 곳.\n이름 속에 이미 자리가 숨어 있었다.", unreal.Vector(-206.0, 42.0, 76.0), 12.0)
    return count


def _spawn_beef_and_steak_area(room: RoomSpec) -> int:
    count = 0
    beef_material = ensure_beef_board_material()
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_BeefCutsWall_BigBoard", unreal.Vector(252.0, 276.0, 142.0), unreal.Vector(1.68, 0.028, 1.12), material_path("HeavenPearl")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_BeefImagePanel", unreal.Vector(252.0, 272.0, 154.0), unreal.Vector(1.48, 0.018, 0.86), beef_material))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_BeefHintText", "힌트: 100일의 기억은 소의 윗등 쪽,\n목심과 등심 사이 어딘가에 숨어 있다.", unreal.Vector(252.0, 244.0, 58.0), 11.0)
    for slot in BEEF_SLOTS:
        material_key = "RoseGlow" if slot.is_answer else "GlassTeal"
        count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_BeefSlot_{slot.key}", _vector(slot.location), unreal.Vector(0.34, 0.016, 0.16), material_path(material_key)))
        count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_BeefSlot_{slot.key}_Label", slot.label, unreal.Vector(slot.location[0], slot.location[1] - 18.0, slot.location[2]), 10.0)
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_SteakTable", unreal.Vector(10.0, -224.0, 46.0), unreal.Vector(1.52, 0.58, 0.20), material_path("WalnutDark")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_SteakVoteRule", "두 스테이크를 모두 맛본 뒤\n현수의 스테이크를 골라야 문이 열린다.", unreal.Vector(84.0, -270.0, 116.0), 12.0)
    return count


def _spawn_runtime_sequence(audio_assets: AudioAssets) -> int:
    lock_class = unreal.load_class(None, "/Script/Hayoung500.HYLockActor")
    prop_class = unreal.load_class(None, "/Script/Hayoung500.HYInteractablePropActor")
    if not lock_class or not prop_class:
        return 0
    count = 0
    count += _spawn_room1_lock(lock_class, "P0_Letter", "vita500", unreal.HYLockKind.LETTER, audio_assets)
    count += _spawn_room1_lock(lock_class, "P1_ColorOrder", "YGBR", unreal.HYLockKind.BUTTON_SEQUENCE, audio_assets)
    for station in PUZZLE_STATIONS[2:]:
        count += _spawn_room1_prop(prop_class, station, audio_assets)
    return count


def _spawn_room2_transition(audio_assets: AudioAssets) -> int:
    door_class = unreal.load_class(None, "/Script/Hayoung500.HYDoorActor")
    if not door_class:
        return 0
    door = _spawn(door_class, unreal.Vector(394.0, 222.0, 116.0), unreal.Rotator(0.0, 0.0, 0.0), f"{ROOM1_PROTO_PREFIX}_DoorToRoom2")
    door.set_actor_scale3d(unreal.Vector(0.82, 0.08, 1.52))
    door.set_editor_property("required_key_id", "Room1_P7_FinalSolved")
    door.set_editor_property("door_creak_sound", _sound(audio_assets, "sfx_door_creak"))
    door.set_editor_property("locked_sound", _sound(audio_assets, "sfx_error_buzz"))
    _set_actor_mesh(door, "/Engine/BasicShapes/Cube.Cube", material_path("BrassEdge"))
    count = _movable(door)
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_DoorToRoom2_Label", "다음 기억으로 / Room 2", unreal.Vector(394.0, 196.0, 218.0), 15.0)
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_Room2Placeholder", unreal.Vector(552.0, 222.0, 42.0), unreal.Vector(1.12, 0.72, 0.08), material_path("DeepShadow")))
    count += _movable(_point_light(f"{ROOM1_PROTO_PREFIX}_Room2DoorLight", unreal.Vector(394.0, 184.0, 220.0), unreal.LinearColor(1.0, 0.86, 0.58, 1.0), 1600.0, 360.0))
    return count


def _spawn_room1_lock(lock_class: "unreal.Class", station_key: str, answer: str, kind: "unreal.HYLockKind", audio_assets: AudioAssets) -> int:
    station = next(spec for spec in PUZZLE_STATIONS if spec.key == station_key)
    actor = _spawn(lock_class, _vector(station.location), label=f"{ROOM1_PROTO_PREFIX}_{station.key}_Lock")
    actor.set_actor_scale3d(unreal.Vector(0.56, 0.18, 0.42))
    actor.set_editor_property("lock_kind", kind)
    actor.refresh_runtime_lock_hardware()
    actor.set_editor_property("expected_input", answer)
    actor.set_editor_property("interaction_hint", station.prompt)
    actor.set_editor_property("required_key_id", station.required_key)
    actor.set_editor_property("reward_key_id", station.reward_key)
    actor.set_editor_property("success_sound", _sound(audio_assets, "sfx_lock_click"))
    actor.set_editor_property("fail_sound", _sound(audio_assets, "sfx_error_buzz"))
    actor.set_editor_property("input_sound", _sound(audio_assets, "sfx_keypad_beep"))
    _set_actor_mesh(actor, "/Engine/BasicShapes/Cube.Cube", material_path("BrassEdge"))
    return _movable(actor)


def _spawn_room1_prop(prop_class: "unreal.Class", station: "PuzzleStationSpec", audio_assets: AudioAssets) -> int:
    actor = _spawn(prop_class, _vector(station.location), label=f"{ROOM1_PROTO_PREFIX}_{station.key}_Prop")
    actor.set_actor_scale3d(unreal.Vector(0.42, 0.24, 0.28))
    actor.set_editor_property("interaction_prompt", station.prompt)
    actor.set_editor_property("required_key_id", station.required_key)
    actor.set_editor_property("reward_key_id", station.reward_key)
    actor.set_editor_property("interaction_sound", _sound(audio_assets, "sfx_key_pickup"))
    actor.set_editor_property("motion_offset", unreal.Vector(0.0, -18.0, 16.0))
    actor.set_editor_property("motion_rotation", unreal.Rotator(0.0, 18.0, 0.0))
    _set_actor_mesh(actor, "/Engine/BasicShapes/Sphere.Sphere", _nearest_material(station.color))
    return _movable(actor)


def _room1() -> RoomSpec:
    return ROOMS[0]


def _nearest_material(color: tuple[float, float, float]) -> str:
    return material_path("RoseGlow" if color[0] > 0.95 and color[1] < 0.65 else "GlassTeal")


def _spawn_text(label: str, text: str, location: "unreal.Vector", size: float) -> int:
    return _movable(_text(label, text, location, unreal.Rotator(0.0, 180.0, 0.0), size))


def _vector(value: tuple[float, float, float]) -> "unreal.Vector":
    return unreal.Vector(value[0], value[1], value[2])


def _set_actor_mesh(actor: "unreal.Actor", mesh_path: str, material_ref: str) -> None:
    mesh = unreal.load_asset(mesh_path)
    material = unreal.load_asset(material_ref)
    for component in actor.get_components_by_class(unreal.StaticMeshComponent):
        if mesh:
            component.set_static_mesh(mesh)
        if material:
            component.set_material(0, material)


def _movable(actor: "unreal.Actor") -> int:
    for component in actor.get_components_by_class(unreal.SceneComponent):
        if hasattr(component, "set_mobility"):
            component.set_mobility(unreal.ComponentMobility.MOVABLE)
    return 1


def _sound(audio_assets: AudioAssets, key: str) -> "unreal.SoundBase | None":
    asset_path = audio_assets.get(key)
    if not asset_path:
        return None
    return unreal.load_asset(asset_path)
