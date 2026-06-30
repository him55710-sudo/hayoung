from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Final, Literal, TypeAlias, assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _point_light, _spawn, _text

from .level_ops import color
from .specs import LockSpec, RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

AudioAssets: TypeAlias = Mapping[str, str]
PropMesh: TypeAlias = Literal["Cube", "Cylinder", "Sphere"]
VectorTriple: TypeAlias = tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class RuntimePropSpec:
    name: str
    prompt: str
    mesh: PropMesh
    sound_key: str
    offset: VectorTriple
    rotation: VectorTriple


@dataclass(frozen=True, slots=True)
class RoomRuntimePropSet:
    room_prefix: str
    props: tuple[RuntimePropSpec, RuntimePropSpec]


@dataclass(frozen=True, slots=True)
class RuntimePropRequest:
    room: RoomSpec
    lock: LockSpec
    prop: RuntimePropSpec
    prop_class: "unreal.Class"
    audio_assets: AudioAssets
    required_key: str | None
    reward_key: str


ROOM_RUNTIME_PROPS: Final[tuple[RoomRuntimePropSet, ...]] = (
    RoomRuntimePropSet(
        "PremiumEscape_Room01_DiaryArchive",
        (
            RuntimePropSpec("UnderShelf_KeyPickup", "책장 밑 자석 열쇠를 집는다", "Cylinder", "sfx_key_pickup", (0.0, 0.0, 34.0), (0.0, 140.0, 0.0)),
            RuntimePropSpec("Drawer_SlideBox", "3단 서랍을 당겨 다음 단서를 확인한다", "Cube", "sfx_drawer_slide", (0.0, -54.0, 0.0), (0.0, 0.0, 2.0)),
        ),
    ),
    RoomRuntimePropSet(
        "PremiumEscape_Room02_CafePromise",
        (
            RuntimePropSpec("Receipt_RailSlide", "영수증 레일을 밀어 방향 순서를 드러낸다", "Cube", "sfx_paper_rustle", (46.0, 0.0, 0.0), (0.0, 0.0, -4.0)),
            RuntimePropSpec("ServiceBell_Button", "서비스벨과 색상 버튼을 눌러 메뉴판을 활성화한다", "Sphere", "sfx_service_bell", (0.0, 0.0, -10.0), (0.0, 28.0, 0.0)),
        ),
    ),
    RoomRuntimePropSet(
        "PremiumEscape_Room03_RainRepair",
        (
            RuntimePropSpec("FuseBank_Toggle", "퓨즈 스위치를 올려 젖은 패널 전원을 켠다", "Cube", "sfx_fuse_toggle", (0.0, -18.0, 0.0), (18.0, 0.0, 0.0)),
            RuntimePropSpec("ValveWheel_Turn", "파이프 밸브를 돌려 빗방울 숫자를 정렬한다", "Cylinder", "sfx_valve_turn", (0.0, 0.0, 0.0), (0.0, 0.0, 94.0)),
        ),
    ),
    RoomRuntimePropSet(
        "PremiumEscape_Room04_NightCity",
        (
            RuntimePropSpec("SafeHandle_Rotate", "미니 금고 손잡이를 잡고 회전 각도를 확인한다", "Cylinder", "sfx_safe_open", (16.0, -8.0, 0.0), (0.0, 82.0, 0.0)),
            RuntimePropSpec("ElevatorPanel_Press", "엘리베이터 호출 패널을 눌러 문자 신호를 켠다", "Cube", "sfx_elevator_chime", (0.0, -16.0, 0.0), (-10.0, 0.0, 0.0)),
        ),
    ),
    RoomRuntimePropSet(
        "PremiumEscape_Room05_HeavenVault",
        (
            RuntimePropSpec("LetterVault_Open", "편지 금고 서랍을 열어 500일 조각을 꺼낸다", "Cube", "sfx_heaven_chime", (0.0, -62.0, 0.0), (0.0, 0.0, 3.0)),
            RuntimePropSpec("HeartKey_Pedestal", "하트 열쇠 받침대에서 마지막 열쇠를 들어 올린다", "Sphere", "sfx_key_pickup", (0.0, 0.0, 44.0), (0.0, 180.0, 0.0)),
        ),
    ),
)


def runtime_prop_for(room: RoomSpec, index: int) -> RuntimePropSpec:
    for prop_set in ROOM_RUNTIME_PROPS:
        if prop_set.room_prefix == room.prefix:
            return prop_set.props[index]
    return ROOM_RUNTIME_PROPS[0].props[index]


def spawn_runtime_prop(request: RuntimePropRequest) -> int:
    actor = _spawn(request.prop_class, _prop_location(request.room, request.lock), label=f"PE_Runtime_{request.room.prefix}_{request.prop.name}_InteractableProp")
    actor.set_actor_scale3d(_prop_scale(request.prop.mesh))
    _set_mesh(actor, request.prop.mesh)
    _set_material(actor, _prop_material(request.room, request.prop.mesh))
    actor.set_editor_property("interaction_prompt", request.prop.prompt)
    actor.set_editor_property("required_key_id", request.required_key or "")
    actor.set_editor_property("reward_key_id", request.reward_key)
    actor.set_editor_property("interaction_sound", _sound(request.audio_assets, request.prop.sound_key))
    actor.set_editor_property("motion_offset", unreal.Vector(request.prop.offset[0], request.prop.offset[1], request.prop.offset[2]))
    actor.set_editor_property("motion_rotation", unreal.Rotator(request.prop.rotation[0], request.prop.rotation[1], request.prop.rotation[2]))
    _text(f"{actor.get_actor_label()}_Cue", request.prop.prompt, unreal.Vector(actor.get_actor_location().x, actor.get_actor_location().y - 34.0, actor.get_actor_location().z + 62.0), unreal.Rotator(0.0, 0.0, 0.0), 10.0)
    _point_light(f"{actor.get_actor_label()}_UseGlow", unreal.Vector(actor.get_actor_location().x, actor.get_actor_location().y - 14.0, actor.get_actor_location().z + 44.0), color(request.room), 520.0, 210.0)
    return 3


def _prop_location(room: RoomSpec, lock: LockSpec) -> "unreal.Vector":
    return unreal.Vector(room.x + lock.rel_x * 0.72, lock.rel_y - 145.0, 68.0)


def _prop_scale(mesh: PropMesh) -> "unreal.Vector":
    match mesh:
        case "Cube":
            return unreal.Vector(0.46, 0.22, 0.22)
        case "Cylinder":
            return unreal.Vector(0.24, 0.24, 0.10)
        case "Sphere":
            return unreal.Vector(0.22, 0.22, 0.18)
        case unreachable:
            assert_never(unreachable)


def _prop_material(room: RoomSpec, mesh: PropMesh) -> str:
    match mesh:
        case "Cube":
            return prop_material_path(room)
        case "Cylinder":
            return material_path("BrassEdge")
        case "Sphere":
            return accent_material_path(room)
        case unreachable:
            assert_never(unreachable)


def _set_mesh(actor: "unreal.Actor", mesh: str) -> None:
    component = actor.get_component_by_class(unreal.StaticMeshComponent)
    static_mesh = unreal.load_asset(f"/Engine/BasicShapes/{mesh}.{mesh}")
    if component and static_mesh:
        component.set_static_mesh(static_mesh)


def _set_material(actor: "unreal.Actor", material_path_value: str) -> None:
    material = unreal.load_asset(material_path_value)
    if material:
        for component in actor.get_components_by_class(unreal.StaticMeshComponent):
            component.set_material(0, material)


def _sound(audio_assets: AudioAssets, key: str) -> "unreal.SoundBase | None":
    asset_path = audio_assets.get(key)
    if not asset_path:
        return None
    return unreal.load_asset(asset_path)
