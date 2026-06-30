from __future__ import annotations

import json
from dataclasses import dataclass

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _spawn

from .escape_cafe_props import REAL_ESCAPE_PROP_PLANS
from .runtime_escape_cafe_props import runtime_escape_prop_label
from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class RuntimeEscapeCafePropSimulation:
    actor_count: int
    interactions: int
    interacted_state_count: int
    props_with_sound: int
    reward_key_count: int
    motion_config_count: int
    hardware_count: int
    motion_feedback_count: int
    room_count: int
    missing_labels: tuple[str, ...]

    def is_ready(self) -> bool:
        return (
            self.actor_count == 30
            and self.interactions == 30
            and self.interacted_state_count == 30
            and self.props_with_sound == 30
            and self.reward_key_count == 30
            and self.motion_config_count == 30
            and self.hardware_count == 30
            and self.motion_feedback_count == 30
            and self.room_count == 5
            and len(self.missing_labels) == 0
        )

    def to_json(self) -> str:
        return json.dumps(
            {
                "actor_count": self.actor_count,
                "interactions": self.interactions,
                "interacted_state_count": self.interacted_state_count,
                "props_with_sound": self.props_with_sound,
                "reward_key_count": self.reward_key_count,
                "motion_config_count": self.motion_config_count,
                "hardware_count": self.hardware_count,
                "motion_feedback_count": self.motion_feedback_count,
                "room_count": self.room_count,
                "missing_labels": list(self.missing_labels),
                "ready": self.is_ready(),
            },
            ensure_ascii=False,
        )


def simulate_runtime_escape_cafe_props() -> str:
    actor_subsystem = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    actors = actor_subsystem.get_all_level_actors()
    player_class = unreal.load_class(None, "/Script/Hayoung500.HYFirstPersonCharacter")
    if not player_class:
        return RuntimeEscapeCafePropSimulation(0, 0, 0, 0, 0, 0, 0, 0, 0, ("HYFirstPersonCharacter class",)).to_json()

    player = _spawn(player_class, unreal.Vector(-260.0, -170.0, 88.0), label="PE_QA_RuntimeRealPropPlayer")
    actor_count = 0
    interactions = 0
    interacted_state_count = 0
    props_with_sound = 0
    reward_key_count = 0
    motion_config_count = 0
    hardware_count = 0
    motion_feedback_count = 0
    rooms: set[str] = set()
    missing_labels: list[str] = []

    for room, plan in zip(ROOMS, REAL_ESCAPE_PROP_PLANS, strict=True):
        for index, prop in enumerate(plan.props, start=1):
            label = runtime_escape_prop_label(room, index, prop)
            prop_actor = _actor_by_label(actors, label)
            if prop_actor:
                actor_count += 1
                rooms.add(room.prefix)
                props_with_sound += int(bool(prop_actor.get_editor_property("interaction_sound")))
                reward_key_count += int(bool(prop_actor.get_editor_property("reward_key_id")))
                motion_config_count += int(_has_motion(prop_actor))
                hardware_count += int(prop_actor.has_runtime_prop_hardware())
                interactions += int(prop_actor.interact(player))
                interacted_state_count += int(prop_actor.was_interacted())
                motion_feedback_count += int(prop_actor.get_motion_alpha() > 0.0)
            else:
                missing_labels.append(label)

    actor_subsystem.destroy_actor(player)
    return RuntimeEscapeCafePropSimulation(actor_count, interactions, interacted_state_count, props_with_sound, reward_key_count, motion_config_count, hardware_count, motion_feedback_count, len(rooms), tuple(missing_labels)).to_json()


def _actor_by_label(actors: list["unreal.Actor"], label: str) -> "unreal.Actor | None":
    for actor in actors:
        if actor.get_actor_label() == label:
            return actor
    return None


def _has_motion(actor: "unreal.Actor") -> bool:
    offset = actor.get_editor_property("motion_offset")
    rotation = actor.get_editor_property("motion_rotation")
    moving = abs(offset.x) + abs(offset.y) + abs(offset.z) > 0.0
    rotating = abs(rotation.pitch) + abs(rotation.yaw) + abs(rotation.roll) > 0.0
    return moving or rotating
