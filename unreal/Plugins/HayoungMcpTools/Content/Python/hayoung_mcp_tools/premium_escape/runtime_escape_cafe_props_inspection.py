from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass, field

import unreal

from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class RuntimeEscapeCafePropCounts:
    actor_count: int
    room_count: int
    interactable_count: int
    props_with_sound: int
    reward_key_count: int
    motion_config_count: int
    hardware_count: int
    cue_count: int
    glow_count: int


@dataclass(slots=True)  # noqa: MUTABLE_OK
class _MutableRuntimeEscapeCafePropCounts:
    actor_count: int = 0
    interactable_count: int = 0
    props_with_sound: int = 0
    reward_key_count: int = 0
    motion_config_count: int = 0
    hardware_count: int = 0
    cue_count: int = 0
    glow_count: int = 0
    rooms: set[str] = field(default_factory=set)

    def consume(self, actor: "unreal.Actor") -> None:
        label = actor.get_actor_label()
        if not label.startswith("PE_RuntimeRealEscapeProp_"):
            return
        self.actor_count += 1
        self.cue_count += int(label.endswith("_RuntimeCue"))
        self.glow_count += int(label.endswith("_RuntimeUseGlow"))
        for room in ROOMS:
            if label.startswith(f"PE_RuntimeRealEscapeProp_{room.prefix}_"):
                self.rooms.add(room.prefix)
        if label.endswith("_InteractableProp"):
            self._consume_interactable(actor)

    def _consume_interactable(self, actor: "unreal.Actor") -> None:
        self.interactable_count += 1
        self.props_with_sound += int(bool(actor.get_editor_property("interaction_sound")))
        self.reward_key_count += int(bool(actor.get_editor_property("reward_key_id")))
        self.hardware_count += int(actor.has_runtime_prop_hardware())
        offset = actor.get_editor_property("motion_offset")
        rotation = actor.get_editor_property("motion_rotation")
        moving = abs(offset.x) + abs(offset.y) + abs(offset.z) > 0.0
        rotating = abs(rotation.pitch) + abs(rotation.yaw) + abs(rotation.roll) > 0.0
        self.motion_config_count += int(moving or rotating)

    def freeze(self) -> RuntimeEscapeCafePropCounts:
        return RuntimeEscapeCafePropCounts(
            self.actor_count,
            len(self.rooms),
            self.interactable_count,
            self.props_with_sound,
            self.reward_key_count,
            self.motion_config_count,
            self.hardware_count,
            self.cue_count,
            self.glow_count,
        )


def collect_runtime_escape_cafe_prop_counts(actors: Iterable["unreal.Actor"]) -> RuntimeEscapeCafePropCounts:
    counts = _MutableRuntimeEscapeCafePropCounts()
    for actor in actors:
        counts.consume(actor)
    return counts.freeze()
