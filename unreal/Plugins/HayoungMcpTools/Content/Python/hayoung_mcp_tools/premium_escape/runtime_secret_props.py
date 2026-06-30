from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Literal, TypeAlias, assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _cube, _point_light, _spawn, _text

from .level_ops import color
from .secret_discovery import DiscoveryKind, RoomSecretPlan, SecretBeat, SECRET_PLANS
from .specs import RoomSpec
from .visuals import accent_material_path, material_path, prop_material_path

AudioAssets: TypeAlias = Mapping[str, str]
PropMesh: TypeAlias = Literal["Cube", "Cylinder", "Sphere"]
VectorTriple: TypeAlias = tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class RuntimeSecretProfile:
    mesh: PropMesh
    material_path: str
    scale: VectorTriple
    motion_offset: VectorTriple
    motion_rotation: VectorTriple
    sound_key: str


@dataclass(frozen=True, slots=True)
class RuntimeSecretRequest:
    room: RoomSpec
    beat: SecretBeat
    index: int
    prop_class: "unreal.Class"
    audio_assets: AudioAssets
    required_key: str | None
    reward_key: str


@dataclass(frozen=True, slots=True)
class RuntimeSecretLayer:
    spawned_count: int
    final_secret_key: str | None


def spawn_room_runtime_secret_discoveries(room: RoomSpec, audio_assets: AudioAssets, entry_key: str | None) -> RuntimeSecretLayer:
    prop_class = unreal.load_class(None, "/Script/Hayoung500.HYInteractablePropActor")
    if not prop_class:
        return RuntimeSecretLayer(0, entry_key)
    spawned_count = 0
    required_key = entry_key
    for index, beat in enumerate(runtime_secret_plan_for(room).beats):
        reward_key = runtime_secret_reward_key(room, index, beat)
        request = RuntimeSecretRequest(room, beat, index, prop_class, audio_assets, required_key, reward_key)
        spawned_count += _spawn_runtime_secret(request)
        required_key = reward_key
    return RuntimeSecretLayer(spawned_count, required_key)


def runtime_secret_plan_for(room: RoomSpec) -> RoomSecretPlan:
    for plan in SECRET_PLANS:
        if plan.room_prefix == room.prefix:
            return plan
    return RoomSecretPlan(room.prefix, SECRET_PLANS[0].beats)


def runtime_secret_label(room: RoomSpec, index: int, beat: SecretBeat) -> str:
    return f"PE_RuntimeSecret_{room.prefix}_{index + 1:02d}_{beat.name}_InteractableProp"


def runtime_secret_reward_key(room: RoomSpec, index: int, beat: SecretBeat) -> str:
    return f"{room.prefix}_secret_{index + 1}_{beat.name}_found"


def _spawn_runtime_secret(request: RuntimeSecretRequest) -> int:
    profile = _profile_for(request.room, request.beat.kind)
    actor = _spawn(request.prop_class, _location(request.room, request.beat), label=runtime_secret_label(request.room, request.index, request.beat))
    actor.set_actor_scale3d(_vector(profile.scale))
    _set_mesh(actor, profile.mesh)
    _set_material(actor, profile.material_path)
    actor.set_editor_property("interaction_prompt", f"{request.beat.clue} -> {request.beat.reward}")
    actor.set_editor_property("required_key_id", request.required_key or "")
    actor.set_editor_property("reward_key_id", request.reward_key)
    actor.set_editor_property("interaction_sound", _sound(request.audio_assets, profile.sound_key))
    actor.set_editor_property("motion_offset", _vector(profile.motion_offset))
    actor.set_editor_property("motion_rotation", unreal.Rotator(profile.motion_rotation[0], profile.motion_rotation[1], profile.motion_rotation[2]))
    _cube(f"{actor.get_actor_label()}_ReachPad", _offset(actor, (0.0, -24.0, -18.0)), unreal.Vector(0.50, 0.018, 0.014), accent_material_path(request.room))
    _text(f"{actor.get_actor_label()}_RuntimeCue", request.beat.clue, _offset(actor, (0.0, -46.0, 50.0)), unreal.Rotator(0.0, 0.0, 0.0), 8.2)
    _point_light(f"{actor.get_actor_label()}_RuntimeGlow", _offset(actor, (0.0, -36.0, 48.0)), color(request.room), 460.0, 185.0)
    return 4


def _profile_for(room: RoomSpec, kind: DiscoveryKind) -> RuntimeSecretProfile:
    match kind:
        case "false_panel":
            return RuntimeSecretProfile("Cube", prop_material_path(room), (0.46, 0.05, 0.22), (0.0, -42.0, 16.0), (0.0, 18.0, 0.0), "sfx_drawer_slide")
        case "drawer_cache":
            return RuntimeSecretProfile("Cube", material_path("WalnutDark"), (0.48, 0.18, 0.14), (0.0, -58.0, 0.0), (0.0, 0.0, 3.0), "sfx_drawer_slide")
        case "uv_reveal":
            return RuntimeSecretProfile("Cylinder", material_path("GlassTeal"), (0.18, 0.18, 0.04), (18.0, -18.0, 10.0), (0.0, 0.0, 74.0), "sfx_paper_rustle")
        case "magnetic_release":
            return RuntimeSecretProfile("Cylinder", material_path("BrassEdge"), (0.16, 0.16, 0.05), (0.0, -28.0, 18.0), (0.0, 112.0, 0.0), "sfx_magnetic_snap")
        case "signal_model":
            return RuntimeSecretProfile("Cube", accent_material_path(room), (0.36, 0.08, 0.20), (24.0, -16.0, 18.0), (0.0, 32.0, 0.0), "sfx_elevator_chime")
        case unreachable:
            assert_never(unreachable)


def _location(room: RoomSpec, beat: SecretBeat) -> "unreal.Vector":
    return unreal.Vector(room.x + room.width * beat.x_ratio, room.depth * beat.y_ratio - 28.0, 82.0)


def _vector(value: VectorTriple) -> "unreal.Vector":
    return unreal.Vector(value[0], value[1], value[2])


def _offset(actor: "unreal.Actor", offset: VectorTriple) -> "unreal.Vector":
    location = actor.get_actor_location()
    return unreal.Vector(location.x + offset[0], location.y + offset[1], location.z + offset[2])


def _set_mesh(actor: "unreal.Actor", mesh: PropMesh) -> None:
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
