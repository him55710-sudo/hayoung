from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

import unreal

from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class RuntimeSecretCounts:
    actor_count: int
    room_count: int
    interactable_count: int
    sound_count: int
    reward_key_count: int
    required_key_count: int
    motion_count: int


def collect_runtime_secret_counts(actors: Iterable["unreal.Actor"]) -> RuntimeSecretCounts:
    actor_count = 0
    interactable_count = 0
    sound_count = 0
    reward_key_count = 0
    required_key_count = 0
    motion_count = 0
    rooms: set[str] = set()
    for actor in actors:
        label = actor.get_actor_label()
        if not label.startswith("PE_RuntimeSecret_"):
            continue
        actor_count += 1
        for room in ROOMS:
            if label.startswith(f"PE_RuntimeSecret_{room.prefix}_"):
                rooms.add(room.prefix)
        if label.endswith("_InteractableProp"):
            interactable_count += 1
            sound_count += int(bool(actor.get_editor_property("interaction_sound")))
            reward_key_count += int(bool(actor.get_editor_property("reward_key_id")))
            required_key_count += int(bool(actor.get_editor_property("required_key_id")))
            motion_count += int(_has_motion(actor.get_editor_property("motion_offset")))
    return RuntimeSecretCounts(actor_count, len(rooms), interactable_count, sound_count, reward_key_count, required_key_count, motion_count)


def _has_motion(vector: "unreal.Vector") -> bool:
    return abs(vector.x) + abs(vector.y) + abs(vector.z) > 0.0
