from __future__ import annotations

from collections.abc import Mapping
from typing import Final

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _shape, _spawn, _text

from .room1_memory_assets import ensure_beef_board_material, ensure_room1_image_material
from .room1_memory_specs import BEEF_SLOTS, MEMORY_FRAMES, PUZZLE_STATIONS, ROOM1_PROTO_PREFIX, VIOLIN_KEYRING_IMAGE
from .specs import ROOMS, RoomSpec
from .visuals import material_path

AudioAssets = Mapping[str, str]

STORY_TEXT: Final[str] = "하영아. 방탈출을 풀며 우리의 추억을 잘 떠올려봐!!\n기억하지 못하면 영영 방 안에서 탈출하지 못해!"
ENTRY_TEXT: Final[str] = "규칙 안내\n인터넷 사용 가능\n힌트는 카톡 또는 전화"
LETTER_TEXT: Final[str] = "정하영,,,,\n너는 우리의 500일 기념일을 까먹었지...\n네가 좋아하던 오로나민 C도 이제 절대 안 먹을 거야.\n오늘부터 나는 다른 거 마실 거야. 됐어!\n정답: vita500"


def spawn_room1_memory_prototype(audio_assets: AudioAssets) -> int:
    room = _room1()
    count = 0
    count += _spawn_architectural_cleanup(room)
    count += _spawn_entry_area(room)
    count += _spawn_memory_wall(room)
    count += _spawn_music_area(room)
    count += _spawn_painting_and_grid(room)
    count += _spawn_beef_and_steak_area(room)
    count += _spawn_runtime_sequence(audio_assets)
    count += _spawn_room2_transition(audio_assets)
    return count


def _spawn_architectural_cleanup(room: RoomSpec) -> int:
    count = 0
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_WoodFloorHeroInset", unreal.Vector(room.x, -24.0, 2.0), unreal.Vector(4.92, 3.42, 0.018), material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_BackWallWarmPlaster", unreal.Vector(room.x, 278.0, 150.0), unreal.Vector(4.94, 0.018, 1.55), material_path("WarmPlaster")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_BackWallWoodWainscot", unreal.Vector(room.x, 274.0, 64.0), unreal.Vector(4.92, 0.026, 0.46), material_path("WalnutDark")))
    for x in (-330.0, -165.0, 0.0, 165.0, 330.0):
        count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_FloorBoardLine_{int(x + 400)}", unreal.Vector(x, -24.0, 5.2), unreal.Vector(0.012, 3.3, 0.006), material_path("BrassEdge")))
    for index, x in enumerate((-300.0, -226.0, -152.0, -78.0, -4.0, 70.0, 144.0, 218.0, 292.0)):
        bulb = _shape(f"{ROOM1_PROTO_PREFIX}_StringLight_Bulb_{index + 1:02d}", "Sphere", unreal.Vector(x, 258.0, 274.0), unreal.Vector(0.055, 0.055, 0.055), material_path("NeonAmber"))
        rail = _cube(f"{ROOM1_PROTO_PREFIX}_StringLight_Cable_{index + 1:02d}", unreal.Vector(x, 260.0, 280.0), unreal.Vector(0.36, 0.006, 0.006), material_path("DeepShadow"))
        count += _movable(bulb) + _movable(rail)
    count += _movable(_point_light(f"{ROOM1_PROTO_PREFIX}_SteamRoom_WarmBounce", unreal.Vector(-20.0, -44.0, 228.0), unreal.LinearColor(1.0, 0.70, 0.42, 1.0), 2300.0, 580.0))
    return count


def _spawn_entry_area(room: RoomSpec) -> int:
    count = 0
    count += _framed_notice("WallMessageFrame", STORY_TEXT, unreal.Vector(-326.0, -272.0, 178.0), unreal.Vector(0.78, 0.04, 0.86), 18.0)
    count += _framed_notice("RuleBoard", ENTRY_TEXT, unreal.Vector(-326.0, -272.0, 82.0), unreal.Vector(0.70, 0.04, 0.54), 13.0)
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_Desk", unreal.Vector(-284.0, -208.0, 38.0), unreal.Vector(1.38, 0.62, 0.32), material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_DeskBackRail", unreal.Vector(-284.0, -174.0, 76.0), unreal.Vector(1.40, 0.06, 0.40), material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_Chair", unreal.Vector(-218.0, -236.0, 34.0), unreal.Vector(0.42, 0.42, 0.22), material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_ChairBack", unreal.Vector(-218.0, -250.0, 76.0), unreal.Vector(0.42, 0.05, 0.52), material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_LetterPaper", unreal.Vector(-284.0, -208.0, 76.0), unreal.Vector(0.74, 0.34, 0.018), material_path("HeavenPearl")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_LetterText", LETTER_TEXT, unreal.Vector(-284.0, -242.0, 122.0), 10.2)
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_DeskLampShade", "Cone", unreal.Vector(-332.0, -210.0, 114.0), unreal.Vector(0.24, 0.24, 0.18), material_path("GlassTeal")))
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_DeskLampBase", "Cylinder", unreal.Vector(-332.0, -210.0, 80.0), unreal.Vector(0.10, 0.10, 0.16), material_path("BrassEdge")))
    count += _movable(_point_light(f"{ROOM1_PROTO_PREFIX}_DeskWarmLamp", unreal.Vector(-330.0, -206.0, 152.0), unreal.LinearColor(1.0, 0.72, 0.42, 1.0), 980.0, 270.0))
    count += _photo_string()
    return count


def _spawn_memory_wall(room: RoomSpec) -> int:
    count = 0
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_MemoryWallTitle", "우리의 추억 4컷 포스터", unreal.Vector(-116.0, 248.0, 270.0), 17.0)
    for frame in MEMORY_FRAMES:
        photo_material = ensure_room1_image_material(f"Memory_{frame.name}", frame.image_source)
        count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_Frame_{frame.name}_Border_{frame.border_color}", _vector(frame.location), unreal.Vector(0.64, 0.035, 0.46), material_path(frame.material_key)))
        count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_Frame_{frame.name}_Photo", unreal.Vector(frame.location[0], frame.location[1] - 3.2, frame.location[2] + 4.0), unreal.Vector(0.54, 0.018, 0.34), photo_material))
        count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_Frame_{frame.name}_Caption", f"{frame.title}\n{frame.clue}", unreal.Vector(frame.location[0], frame.location[1] - 19.0, frame.location[2] - 42.0), 8.4)
    button_specs = (
        ("Yellow", -218.0, "노랑", "BrassEdge"),
        ("Green", -148.0, "초록", "GlassTeal"),
        ("Blue", -78.0, "파랑", "RainBlue"),
        ("Red", -8.0, "빨강", "RoseGlow"),
    )
    for name, x, label, material_key in button_specs:
        count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_ColorButton_{name}", "Cylinder", unreal.Vector(x, 176.0, 42.0), unreal.Vector(0.27, 0.27, 0.065), material_path(material_key)))
        count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_ColorButton_{name}_Label", label, unreal.Vector(x, 170.0, 80.0), 11.0)
    count += _movable(_point_light(f"{ROOM1_PROTO_PREFIX}_MemoryWallActivationLight", unreal.Vector(-112.0, 214.0, 216.0), unreal.LinearColor(1.0, 0.86, 0.54, 1.0), 1350.0, 430.0))
    return count


def _spawn_music_area(room: RoomSpec) -> int:
    count = 0
    violin_material = ensure_room1_image_material("ViolinKeyringReference", VIOLIN_KEYRING_IMAGE)
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_ViolinGlassCase", unreal.Vector(58.0, 274.0, 184.0), unreal.Vector(0.60, 0.040, 0.86), material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_ViolinKeyringPhoto", unreal.Vector(58.0, 270.0, 184.0), unreal.Vector(0.49, 0.018, 0.68), violin_material))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_ViolinGlassPane", unreal.Vector(58.0, 263.0, 184.0), unreal.Vector(0.56, 0.010, 0.76), material_path("GlassTeal")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_ViolinCaseLabel", "바이올린 열쇠고리\n액자 속 숨겨진 수납", unreal.Vector(58.0, 242.0, 90.0), 9.6)
    count += _spawn_performer_figure(unreal.Vector(154.0, 110.0, 92.0))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_Shelf", unreal.Vector(154.0, 82.0, 80.0), unreal.Vector(1.04, 0.28, 0.16), material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_ShelfDrawer", unreal.Vector(154.0, 56.0, 42.0), unreal.Vector(1.02, 0.22, 0.42), material_path("WalnutDark")))
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_CarouselMusicBox_Base", "Cylinder", unreal.Vector(154.0, 34.0, 110.0), unreal.Vector(0.36, 0.36, 0.10), material_path("BrassEdge")))
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_CarouselMusicBox_Roof", "Cone", unreal.Vector(154.0, 34.0, 138.0), unreal.Vector(0.38, 0.38, 0.18), material_path("RoseGlow")))
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_CarouselHorseA", "Sphere", unreal.Vector(135.0, 34.0, 124.0), unreal.Vector(0.10, 0.055, 0.075), material_path("HeavenPearl")))
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_CarouselHorseB", "Sphere", unreal.Vector(173.0, 34.0, 124.0), unreal.Vector(0.10, 0.055, 0.075), material_path("HeavenPearl")))
    count += _movable(_point_light(f"{ROOM1_PROTO_PREFIX}_CarouselSpatialSoundLight", unreal.Vector(154.0, 34.0, 190.0), unreal.LinearColor(1.0, 0.56, 0.78, 1.0), 1050.0, 300.0))
    return count


def _spawn_painting_and_grid(room: RoomSpec) -> int:
    count = 0
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_AmusementParkPainting", unreal.Vector(286.0, 274.0, 190.0), unreal.Vector(1.42, 0.036, 0.82), material_path("WarmPlaster")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_AmusementParkFrame", unreal.Vector(286.0, 272.0, 190.0), unreal.Vector(1.54, 0.030, 0.94), material_path("WalnutDark")))
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_PaintingFerrisWheel", "Cylinder", unreal.Vector(262.0, 250.0, 198.0), unreal.Vector(0.34, 0.34, 0.018), material_path("BrassEdge")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_PaintingCoasterTrack", unreal.Vector(322.0, 248.0, 178.0), unreal.Vector(0.82, 0.014, 0.040), material_path("RoseGlow")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_BigPaintingText", "우리의 추억 여행\n회전목마가 비어 있다", unreal.Vector(286.0, 246.0, 226.0), 12.0)
    for cell in range(1, 10):
        row = (cell - 1) // 3
        col = (cell - 1) % 3
        x = -82.0 + col * 66.0
        y = -58.0 + row * 66.0
        count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_FloorGrid_Cell{cell:02d}", unreal.Vector(x, y, 5.0), unreal.Vector(0.52, 0.52, 0.018), material_path("DeepShadow" if cell == 9 else "StoneFloor")))
        count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_FloorGrid_Cell{cell:02d}_Number", str(cell), unreal.Vector(x, y - 3.0, 20.0), 17.0)
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_PyeongsangBench", unreal.Vector(16.0, -34.0, 32.0), unreal.Vector(0.86, 0.42, 0.12), material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_PyeongsangBench_LegA", unreal.Vector(-24.0, -58.0, 16.0), unreal.Vector(0.08, 0.08, 0.18), material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_PyeongsangBench_LegB", unreal.Vector(56.0, -58.0, 16.0), unreal.Vector(0.08, 0.08, 0.18), material_path("WalnutDark")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_GuroHintNote", "구로평상 8 & 3x3 숫자 퍼즐\n평상을 9번 위에 올려요", unreal.Vector(-190.0, -2.0, 76.0), 10.4)
    return count


def _spawn_beef_and_steak_area(room: RoomSpec) -> int:
    count = 0
    beef_material = ensure_beef_board_material()
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_BeefCutsWall_BigBoard", unreal.Vector(286.0, 272.0, 90.0), unreal.Vector(1.38, 0.028, 0.78), material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_BeefImagePanel", unreal.Vector(286.0, 268.0, 98.0), unreal.Vector(1.18, 0.018, 0.58), beef_material))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_BeefBoard_EaselLeft", unreal.Vector(228.0, 224.0, 28.0), unreal.Vector(0.045, 0.045, 0.58), material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_BeefBoard_EaselRight", unreal.Vector(344.0, 224.0, 28.0), unreal.Vector(0.045, 0.045, 0.58), material_path("WalnutDark")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_BeefHintText", "소의 부위 퍼즐\n목심과 등심 사이", unreal.Vector(286.0, 240.0, 28.0), 9.4)
    for slot in BEEF_SLOTS:
        material_key = "RoseGlow" if slot.is_answer else "GlassTeal"
        count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_BeefSlot_{slot.key}", _vector(slot.location), unreal.Vector(0.28, 0.016, 0.12), material_path(material_key)))
        count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_BeefSlot_{slot.key}_Label", slot.label, unreal.Vector(slot.location[0], slot.location[1] - 18.0, slot.location[2]), 8.0)
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_SteakTable", unreal.Vector(248.0, -214.0, 44.0), unreal.Vector(1.32, 0.56, 0.18), material_path("WalnutDark")))
    count += _steak_plate("A", unreal.Vector(188.0, -214.0, 72.0), "현수")
    count += _steak_plate("B", unreal.Vector(306.0, -214.0, 72.0), "알페로")
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_SteakVoteRule", "스테이크 시식 퍼즐\nA vs B 선택의 단서", unreal.Vector(248.0, -262.0, 110.0), 10.8)
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
    door = _spawn(door_class, unreal.Vector(392.0, 210.0, 112.0), unreal.Rotator(0.0, 0.0, 0.0), f"{ROOM1_PROTO_PREFIX}_DoorToRoom2")
    door.set_actor_scale3d(unreal.Vector(0.74, 0.08, 1.46))
    door.set_editor_property("required_key_id", "Room1_P7_FinalSolved")
    door.set_editor_property("door_creak_sound", _sound(audio_assets, "sfx_door_creak"))
    door.set_editor_property("locked_sound", _sound(audio_assets, "sfx_error_buzz"))
    _set_actor_mesh(door, "/Engine/BasicShapes/Cube.Cube", material_path("WalnutDark"))
    count = _movable(door)
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_DoorFrame_GlowLeft", unreal.Vector(350.0, 205.0, 116.0), unreal.Vector(0.035, 0.04, 1.58), material_path("NeonAmber")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_DoorFrame_GlowRight", unreal.Vector(434.0, 205.0, 116.0), unreal.Vector(0.035, 0.04, 1.58), material_path("NeonAmber")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_DoorFrame_GlowTop", unreal.Vector(392.0, 205.0, 195.0), unreal.Vector(0.86, 0.04, 0.035), material_path("NeonAmber")))
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_DoorKnob", "Sphere", unreal.Vector(424.0, 198.0, 112.0), unreal.Vector(0.06, 0.06, 0.06), material_path("BrassEdge")))
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_DoorMat", "Cylinder", unreal.Vector(392.0, 152.0, 7.0), unreal.Vector(0.48, 0.34, 0.018), material_path("DeepShadow")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_DoorToRoom2_Label", "다음 기억으로\nRoom 2", unreal.Vector(392.0, 188.0, 154.0), 12.0)
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_Room2Placeholder", unreal.Vector(538.0, 210.0, 42.0), unreal.Vector(1.0, 0.70, 0.08), material_path("DeepShadow")))
    count += _movable(_point_light(f"{ROOM1_PROTO_PREFIX}_Room2DoorLight", unreal.Vector(392.0, 178.0, 220.0), unreal.LinearColor(1.0, 0.82, 0.48, 1.0), 1900.0, 360.0))
    return count


def _framed_notice(name: str, message: str, location: "unreal.Vector", scale: "unreal.Vector", text_size: float) -> int:
    count = 0
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_{name}", location, scale, material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_{name}_Paper", unreal.Vector(location.x, location.y - 3.0, location.z), unreal.Vector(scale.x * 0.82, 0.014, scale.z * 0.82), material_path("HeavenPearl")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_{name}_Text", message, unreal.Vector(location.x, location.y - 20.0, location.z + 4.0), text_size)
    return count


def _photo_string() -> int:
    count = 0
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_PhotoString_Rail", unreal.Vector(-218.0, 272.0, 244.0), unreal.Vector(1.02, 0.012, 0.012), material_path("DeepShadow")))
    for index, x in enumerate((-258.0, -232.0, -206.0, -180.0)):
        count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_PhotoString_Clip_{index + 1}", unreal.Vector(x, 267.0, 236.0), unreal.Vector(0.12, 0.014, 0.16), material_path("HeavenPearl")))
        count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_PhotoString_Pin_{index + 1}", "Sphere", unreal.Vector(x, 262.0, 246.0), unreal.Vector(0.025, 0.025, 0.025), material_path("BrassEdge")))
    return count


def _spawn_performer_figure(location: "unreal.Vector") -> int:
    count = 0
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_ViolinPerformer_Platform", "Cylinder", location, unreal.Vector(0.30, 0.30, 0.07), material_path("BrassEdge")))
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_ViolinPerformer_FigureBody", "Cylinder", unreal.Vector(location.x, location.y, location.z + 28.0), unreal.Vector(0.11, 0.11, 0.28), material_path("WarmPlaster")))
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_ViolinPerformer_Head", "Sphere", unreal.Vector(location.x, location.y, location.z + 58.0), unreal.Vector(0.10, 0.10, 0.10), material_path("HeavenPearl")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_ViolinPerformer_Violin", unreal.Vector(location.x + 13.0, location.y - 8.0, location.z + 42.0), unreal.Vector(0.22, 0.035, 0.08), material_path("WalnutDark")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_ViolinPerformer_Bow", unreal.Vector(location.x - 14.0, location.y - 10.0, location.z + 44.0), unreal.Vector(0.28, 0.012, 0.012), material_path("BrassEdge")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_ViolinPerformer_Label", "바이올린 연주 피규어\n키링을 건네면 오르골 작동", unreal.Vector(location.x, location.y - 44.0, location.z + 78.0), 8.8)
    return count


def _steak_plate(label: str, location: "unreal.Vector", owner: str) -> int:
    count = 0
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_Steak_{label}_Plate", "Cylinder", location, unreal.Vector(0.28, 0.28, 0.025), material_path("HeavenPearl")))
    count += _movable(_shape(f"{ROOM1_PROTO_PREFIX}_Steak_{label}_Meat", "Sphere", unreal.Vector(location.x, location.y, location.z + 8.0), unreal.Vector(0.20, 0.12, 0.045), material_path("RoseGlow")))
    count += _movable(_cube(f"{ROOM1_PROTO_PREFIX}_Steak_{label}_Flag", unreal.Vector(location.x, location.y - 24.0, location.z + 38.0), unreal.Vector(0.18, 0.012, 0.16), material_path("BrassEdge")))
    count += _spawn_text(f"{ROOM1_PROTO_PREFIX}_Steak_{label}_Label", f"{label}\n{owner}", unreal.Vector(location.x, location.y - 38.0, location.z + 48.0), 9.2)
    return count


def _spawn_room1_lock(lock_class: "unreal.Class", station_key: str, answer: str, kind: "unreal.HYLockKind", audio_assets: AudioAssets) -> int:
    station = next(spec for spec in PUZZLE_STATIONS if spec.key == station_key)
    actor = _spawn(lock_class, _vector(station.location), label=f"{ROOM1_PROTO_PREFIX}_{station.key}_Lock")
    actor.set_actor_scale3d(unreal.Vector(0.50, 0.16, 0.34))
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
    actor.set_actor_scale3d(_prop_scale(station.key))
    actor.set_editor_property("interaction_prompt", station.prompt)
    actor.set_editor_property("required_key_id", station.required_key)
    actor.set_editor_property("reward_key_id", station.reward_key)
    actor.set_editor_property("interaction_sound", _sound(audio_assets, "sfx_key_pickup"))
    actor.set_editor_property("motion_offset", unreal.Vector(0.0, -18.0, 16.0))
    actor.set_editor_property("motion_rotation", unreal.Rotator(0.0, 18.0, 0.0))
    mesh_path = "/Engine/BasicShapes/Cube.Cube" if station.key in {"P1_KeyringPickup", "P4_PaintingSlot", "P6_SalchisalSlot", "P7_FinalVote"} else "/Engine/BasicShapes/Cylinder.Cylinder"
    _set_actor_mesh(actor, mesh_path, _nearest_material(station.color))
    return _movable(actor)


def _prop_scale(station_key: str) -> "unreal.Vector":
    if "Steak" in station_key:
        return unreal.Vector(0.18, 0.18, 0.06)
    if "Meat" in station_key:
        return unreal.Vector(0.18, 0.12, 0.08)
    if "Keyring" in station_key:
        return unreal.Vector(0.14, 0.04, 0.16)
    if "Painting" in station_key or "Salchisal" in station_key:
        return unreal.Vector(0.24, 0.04, 0.18)
    return unreal.Vector(0.26, 0.18, 0.20)


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
