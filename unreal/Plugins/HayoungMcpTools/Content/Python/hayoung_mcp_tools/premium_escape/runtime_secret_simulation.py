from __future__ import annotations

from dataclasses import dataclass

import unreal

from .runtime_secret_props import runtime_secret_label, runtime_secret_plan_for
from .specs import RoomSpec


@dataclass(frozen=True, slots=True)
class RuntimeSecretSimulation:
    interactions: int
    reward_keys: int
    sound_count: int
    motion_count: int
    missing_labels: tuple[str, ...]


def simulate_runtime_secret_discoveries(actors: list["unreal.Actor"], player: "unreal.Actor", room: RoomSpec) -> RuntimeSecretSimulation:
    interactions = 0
    reward_keys = 0
    sound_count = 0
    motion_count = 0
    missing_labels: list[str] = []
    for index, beat in enumerate(runtime_secret_plan_for(room).beats):
        label = runtime_secret_label(room, index, beat)
        actor = _actor_by_label(actors, label)
        if actor:
            sound_count += int(bool(actor.get_editor_property("interaction_sound")))
            motion_count += int(_has_motion(actor.get_editor_property("motion_offset")))
            inventory_before = int(player.get_inventory_key_count())
            if actor.interact(player):
                interactions += 1
                reward_keys += int(player.get_inventory_key_count() > inventory_before)
        else:
            missing_labels.append(label)
    return RuntimeSecretSimulation(interactions, reward_keys, sound_count, motion_count, tuple(missing_labels))


def _actor_by_label(actors: list["unreal.Actor"], label: str) -> "unreal.Actor | None":
    for actor in actors:
        if actor.get_actor_label() == label:
            return actor
    return None


def _has_motion(vector: "unreal.Vector") -> bool:
    return abs(vector.x) + abs(vector.y) + abs(vector.z) > 0.0
