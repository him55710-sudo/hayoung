from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import TypeAlias, assert_never

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _spawn

from .runtime_props import RuntimePropRequest, runtime_prop_for, spawn_runtime_prop
from .runtime_secret_props import spawn_room_runtime_secret_discoveries
from .sound_profiles import lock_sound_profile
from .specs import LockKind, LockSpec, RoomSpec
from .visuals import material_path, prop_material_path

AudioAssets: TypeAlias = Mapping[str, str]


@dataclass(frozen=True, slots=True)
class RuntimeRoomLayer:
    spawned_count: int
    exit_key: str | None


def spawn_room_runtime(room: RoomSpec, audio_assets: AudioAssets, required_gate_key: str | None) -> RuntimeRoomLayer:
    door_class = unreal.load_class(None, "/Script/Hayoung500.HYDoorActor")
    lock_class = unreal.load_class(None, "/Script/Hayoung500.HYLockActor")
    audio_class = unreal.load_class(None, "/Script/Hayoung500.HYRoomAudioVolume")
    prop_class = unreal.load_class(None, "/Script/Hayoung500.HYInteractablePropActor")
    if not door_class or not lock_class or not audio_class or not prop_class:
        return RuntimeRoomLayer(0, required_gate_key)

    door = _spawn_door(room, door_class, audio_assets)
    spawned_count = 1 + _spawn_audio_volume(room, audio_class, audio_assets)
    current_key = required_gate_key
    secret_layer = spawn_room_runtime_secret_discoveries(room, audio_assets, current_key)
    spawned_count += secret_layer.spawned_count
    last_index = len(room.locks) - 1

    for index, lock in enumerate(room.locks):
        prop_key = f"{room.prefix}_{index + 1}_prop_checked"
        spawned_count += spawn_runtime_prop(RuntimePropRequest(room, lock, runtime_prop_for(room, index), prop_class, audio_assets, current_key, prop_key))
        reward_key = f"{room.prefix}_{index + 1}_{lock.kind.value}_solved"
        lock_actor = _spawn_lock(room, lock, lock_class)
        lock_actor.set_editor_property("lock_kind", _runtime_lock_kind(lock.kind))
        lock_actor.refresh_runtime_lock_hardware()
        lock_actor.set_editor_property("expected_input", lock.answer)
        lock_actor.set_editor_property("interaction_hint", f"{lock.title} / {lock.clue}")
        lock_actor.set_editor_property("required_key_id", prop_key)
        lock_actor.set_editor_property("reward_key_id", reward_key)
        sound_profile = lock_sound_profile(lock.kind)
        lock_actor.set_editor_property("success_sound", _sound(audio_assets, sound_profile.success_key))
        lock_actor.set_editor_property("fail_sound", _sound(audio_assets, sound_profile.fail_key))
        lock_actor.set_editor_property("input_sound", _sound(audio_assets, sound_profile.input_key))
        if index == last_index:
            lock_actor.set_editor_property("door_to_open", door)
        current_key = reward_key
        spawned_count += 1

    door.set_editor_property("required_key_id", current_key or "")
    return RuntimeRoomLayer(spawned_count, current_key)


def _spawn_door(room: RoomSpec, door_class: "unreal.Class", audio_assets: AudioAssets) -> "unreal.Actor":
    actor = _spawn(door_class, _door_location(room), unreal.Rotator(0.0, 0.0, 0.0), f"PE_Runtime_{room.prefix}_DoorActor")
    actor.set_actor_scale3d(unreal.Vector(0.74, 0.08, 1.45))
    _set_mesh(actor, "/Engine/BasicShapes/Cube.Cube")
    _set_material(actor, prop_material_path(room))
    actor.set_editor_property("door_creak_sound", _sound(audio_assets, "sfx_door_creak"))
    actor.set_editor_property("locked_sound", _sound(audio_assets, "sfx_error_buzz"))
    return actor


def _spawn_audio_volume(room: RoomSpec, audio_class: "unreal.Class", audio_assets: AudioAssets) -> int:
    actor = _spawn(audio_class, unreal.Vector(room.x, 0.0, 140.0), label=f"PE_Runtime_{room.prefix}_RoomAudioVolume")
    actor.set_editor_property("room_ambience", _sound(audio_assets, room.ambient_key))
    actor.set_editor_property("footstep_surface", room.footstep_surface)
    actor.set_editor_property("volume_multiplier", 0.62)
    box = actor.get_component_by_class(unreal.BoxComponent)
    if box:
        box.set_box_extent(unreal.Vector(room.width / 2.0, room.depth / 2.0, 190.0))
    return 1


def _spawn_lock(room: RoomSpec, lock: LockSpec, lock_class: "unreal.Class") -> "unreal.Actor":
    actor = _spawn(lock_class, unreal.Vector(room.x + lock.rel_x, lock.rel_y - 50.0, 92.0), label=f"PE_Runtime_{room.prefix}_{lock.kind.value}_LockActor")
    actor.set_actor_scale3d(unreal.Vector(0.70, 0.20, 0.52))
    _set_mesh(actor, "/Engine/BasicShapes/Cube.Cube")
    _set_material(actor, material_path("BrassEdge"))
    return actor


def _runtime_lock_kind(lock_kind: LockKind) -> "unreal.HYLockKind":
    match lock_kind:
        case LockKind.COMBINATION:
            return unreal.HYLockKind.COMBINATION
        case LockKind.DIRECTION:
            return unreal.HYLockKind.DIRECTION
        case LockKind.KEYPAD:
            return unreal.HYLockKind.KEYPAD
        case LockKind.KEYED_PADLOCK:
            return unreal.HYLockKind.KEYED_PADLOCK
        case LockKind.MAGNETIC:
            return unreal.HYLockKind.MAGNETIC
        case LockKind.BUTTON_SEQUENCE:
            return unreal.HYLockKind.BUTTON_SEQUENCE
        case LockKind.LETTER:
            return unreal.HYLockKind.LETTER
        case LockKind.SAFE_DIAL:
            return unreal.HYLockKind.SAFE_DIAL
        case unreachable:
            assert_never(unreachable)


def _door_location(room: RoomSpec) -> "unreal.Vector":
    half_d = room.depth / 2.0
    if room.prefix.endswith("HeavenVault"):
        return unreal.Vector(room.x, half_d - 96.0, 126.0)
    return unreal.Vector(room.x + room.width / 2.0 + 38.0, half_d - 36.0, 126.0)


def _set_mesh(actor: "unreal.Actor", mesh_path: str) -> None:
    component = actor.get_component_by_class(unreal.StaticMeshComponent)
    mesh = unreal.load_asset(mesh_path)
    if component and mesh:
        component.set_static_mesh(mesh)


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
