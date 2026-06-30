from __future__ import annotations

import json
from dataclasses import dataclass

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _spawn

from .runtime_props import runtime_prop_for
from .runtime_secret_simulation import simulate_runtime_secret_discoveries
from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class ChainSimulation:
    prop_interactions: int
    lock_interactions: int
    token_inputs: int
    feedback_pulses: int
    locked_door_denials: int
    unlocked_door_checks: int
    hud_prompt_available: bool
    hud_goal_available: bool
    hud_progress_available: bool
    runtime_footstep_audio_available: bool
    runtime_footstep_interval: float
    runtime_footstep_surface: str
    runtime_first_person_body_available: bool
    runtime_interaction_rig_available: bool
    runtime_interaction_hand_alpha: float
    runtime_room_audio_volume_count: int
    runtime_room_audio_ready_count: int
    runtime_room_audio_unique_sound_count: int
    runtime_room_audio_comfort_count: int
    runtime_room_audio_start_count: int
    runtime_room_audio_stop_count: int
    runtime_secret_interactions: int
    runtime_secret_reward_keys: int
    runtime_secret_sound_count: int
    runtime_secret_motion_count: int
    inventory_count_samples: int
    runtime_lock_hardware_count: int
    door_count: int
    runtime_door_hardware_count: int
    locked_door_feedback_count: int
    door_handle_feedback_count: int
    missing_labels: tuple[str, ...]

    def is_ready(self) -> bool:
        return (
            self.prop_interactions == 10
            and self.lock_interactions == 10
            and self.token_inputs >= 40
            and self.feedback_pulses == 10
            and self.locked_door_denials == 5
            and self.unlocked_door_checks == 5
            and self.hud_prompt_available
            and self.hud_goal_available
            and self.hud_progress_available
            and self.runtime_footstep_audio_available
            and 0.2 <= self.runtime_footstep_interval <= 0.8
            and self.runtime_footstep_surface == "wood"
            and self.runtime_first_person_body_available
            and self.runtime_interaction_rig_available
            and self.runtime_interaction_hand_alpha > 0.0
            and self.runtime_room_audio_volume_count == 5
            and self.runtime_room_audio_ready_count == 5
            and self.runtime_room_audio_unique_sound_count == 5
            and self.runtime_room_audio_comfort_count == 5
            and self.runtime_room_audio_start_count == 5
            and self.runtime_room_audio_stop_count == 5
            and self.runtime_secret_interactions == 15
            and self.runtime_secret_reward_keys == 15
            and self.runtime_secret_sound_count == 15
            and self.runtime_secret_motion_count == 15
            and self.inventory_count_samples >= 2
            and self.runtime_lock_hardware_count == 10
            and self.door_count == 5
            and self.runtime_door_hardware_count == 5
            and self.locked_door_feedback_count == 5
            and self.door_handle_feedback_count == 5
            and len(self.missing_labels) == 0
        )

    def to_json(self) -> str:
        return json.dumps(
            {
                "prop_interactions": self.prop_interactions,
                "lock_interactions": self.lock_interactions,
                "token_inputs": self.token_inputs,
                "feedback_pulses": self.feedback_pulses,
                "locked_door_denials": self.locked_door_denials,
                "unlocked_door_checks": self.unlocked_door_checks,
                "hud_prompt_available": self.hud_prompt_available,
                "hud_goal_available": self.hud_goal_available,
                "hud_progress_available": self.hud_progress_available,
                "runtime_footstep_audio_available": self.runtime_footstep_audio_available,
                "runtime_footstep_interval": self.runtime_footstep_interval,
                "runtime_footstep_surface": self.runtime_footstep_surface,
                "runtime_first_person_body_available": self.runtime_first_person_body_available,
                "runtime_interaction_rig_available": self.runtime_interaction_rig_available,
                "runtime_interaction_hand_alpha": self.runtime_interaction_hand_alpha,
                "runtime_room_audio_volume_count": self.runtime_room_audio_volume_count,
                "runtime_room_audio_ready_count": self.runtime_room_audio_ready_count,
                "runtime_room_audio_unique_sound_count": self.runtime_room_audio_unique_sound_count,
                "runtime_room_audio_comfort_count": self.runtime_room_audio_comfort_count,
                "runtime_room_audio_start_count": self.runtime_room_audio_start_count,
                "runtime_room_audio_stop_count": self.runtime_room_audio_stop_count,
                "runtime_secret_interactions": self.runtime_secret_interactions,
                "runtime_secret_reward_keys": self.runtime_secret_reward_keys,
                "runtime_secret_sound_count": self.runtime_secret_sound_count,
                "runtime_secret_motion_count": self.runtime_secret_motion_count,
                "inventory_count_samples": self.inventory_count_samples,
                "runtime_lock_hardware_count": self.runtime_lock_hardware_count,
                "door_count": self.door_count,
                "runtime_door_hardware_count": self.runtime_door_hardware_count,
                "locked_door_feedback_count": self.locked_door_feedback_count,
                "door_handle_feedback_count": self.door_handle_feedback_count,
                "missing_labels": list(self.missing_labels),
                "ready": self.is_ready(),
            },
            ensure_ascii=False,
        )


def simulate_escape_chain() -> str:
    actor_subsystem = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    actors = actor_subsystem.get_all_level_actors()
    player_class = unreal.load_class(None, "/Script/Hayoung500.HYFirstPersonCharacter")
    if not player_class:
        return ChainSimulation(0, 0, 0, 0, 0, 0, False, False, False, False, 0.0, "", False, False, 0.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ("HYFirstPersonCharacter class",)).to_json()

    _reset_runtime_actor_state(actors)
    player = _spawn(player_class, unreal.Vector(-280.0, -180.0, 88.0), label="PE_QA_RuntimeChainPlayer")
    hud_prompt_available = bool(player.get_focused_prompt())
    hud_goal_available = bool(player.get_current_goal_text())
    hud_progress_available = player.get_escape_step_count() == 20 and player.get_current_room_number() == 1
    runtime_footstep_audio_available = bool(player.has_runtime_footstep_audio())
    runtime_footstep_interval = float(player.get_runtime_footstep_interval())
    runtime_footstep_surface = str(player.get_runtime_footstep_surface())
    runtime_first_person_body_available = bool(player.has_runtime_first_person_body())
    runtime_interaction_rig_available = bool(player.has_runtime_interaction_rig())
    runtime_interaction_hand_alpha = 0.0
    inventory_count_samples = 1 if player.get_inventory_key_count() >= 0 else 0
    runtime_lock_hardware_count = 0
    prop_interactions = 0
    lock_interactions = 0
    token_inputs = 0
    feedback_pulses = 0
    locked_door_denials = 0
    unlocked_door_checks = 0
    door_count = 0
    runtime_door_hardware_count = 0
    locked_door_feedback_count = 0
    door_handle_feedback_count = 0
    runtime_room_audio_volume_count = 0
    runtime_room_audio_ready_count = 0
    runtime_room_audio_comfort_count = 0
    runtime_room_audio_start_count = 0
    runtime_room_audio_stop_count = 0
    runtime_room_audio_sounds: set[str] = set()
    runtime_secret_interactions = 0
    runtime_secret_reward_keys = 0
    runtime_secret_sound_count = 0
    runtime_secret_motion_count = 0
    missing_labels: list[str] = []

    for room in ROOMS:
        audio_label = f"PE_Runtime_{room.prefix}_RoomAudioVolume"
        audio_actor = _actor_by_label(actors, audio_label)
        if audio_actor:
            runtime_room_audio_volume_count += 1
            ambience_name = str(audio_actor.get_room_ambience_debug_name())
            if audio_actor.has_room_ambience() and ambience_name:
                runtime_room_audio_ready_count += 1
                runtime_room_audio_sounds.add(ambience_name)
            if 0.2 <= audio_actor.get_configured_volume_multiplier() <= 1.0 and 0.2 <= audio_actor.get_fade_seconds() <= 3.0:
                runtime_room_audio_comfort_count += 1
            audio_actor.preview_enter_room()
            runtime_room_audio_start_count += int(audio_actor.get_ambience_playback_request_count() > 0)
            audio_actor.preview_exit_room()
            runtime_room_audio_stop_count += int(audio_actor.get_ambience_fade_out_request_count() > 0)
        else:
            missing_labels.append(audio_label)

        door_label = f"PE_Runtime_{room.prefix}_DoorActor"
        door_actor = _actor_by_label(actors, door_label)
        if door_actor:
            door_count += 1
            runtime_door_hardware_count += int(door_actor.has_runtime_door_hardware())
            if not door_actor.try_open_door(player):
                locked_door_denials += 1
                locked_door_feedback_count += int(door_actor.get_locked_feedback_alpha() > 0.0)
                door_handle_feedback_count += int(door_actor.get_handle_press_alpha() > 0.0)
        else:
            missing_labels.append(door_label)
        runtime_secret = simulate_runtime_secret_discoveries(actors, player, room)
        runtime_secret_interactions += runtime_secret.interactions
        runtime_secret_reward_keys += runtime_secret.reward_keys
        runtime_secret_sound_count += runtime_secret.sound_count
        runtime_secret_motion_count += runtime_secret.motion_count
        missing_labels.extend(runtime_secret.missing_labels)
        for index, lock in enumerate(room.locks):
            prop_label = f"PE_Runtime_{room.prefix}_{runtime_prop_for(room, index).name}_InteractableProp"
            prop_actor = _actor_by_label(actors, prop_label)
            if prop_actor:
                if prop_actor.interact(player):
                    prop_interactions += 1
                    if player.get_inventory_key_count() >= 0:
                        inventory_count_samples += 1
            else:
                missing_labels.append(prop_label)

            lock_label = f"PE_Runtime_{room.prefix}_{lock.kind.value}_LockActor"
            lock_actor = _actor_by_label(actors, lock_label)
            if lock_actor:
                runtime_lock_hardware_count += int(lock_actor.has_runtime_lock_hardware())
                lock_actor.clear_pending_input()
                for token in lock.answer:
                    lock_actor.append_input_token(token)
                    token_inputs += 1
                if lock_actor.get_input_feedback_alpha() > 0.0:
                    feedback_pulses += 1
                if lock_actor.interact(player):
                    lock_interactions += 1
                    if float(player.get_interaction_hand_alpha()) > 0.0:
                        runtime_interaction_hand_alpha = float(player.get_interaction_hand_alpha())
            else:
                missing_labels.append(lock_label)
        if door_actor and door_actor.is_unlocked() and door_actor.is_open():
            unlocked_door_checks += 1

    actor_subsystem.destroy_actor(player)
    return ChainSimulation(prop_interactions, lock_interactions, token_inputs, feedback_pulses, locked_door_denials, unlocked_door_checks, hud_prompt_available, hud_goal_available, hud_progress_available, runtime_footstep_audio_available, runtime_footstep_interval, runtime_footstep_surface, runtime_first_person_body_available, runtime_interaction_rig_available, runtime_interaction_hand_alpha, runtime_room_audio_volume_count, runtime_room_audio_ready_count, len(runtime_room_audio_sounds), runtime_room_audio_comfort_count, runtime_room_audio_start_count, runtime_room_audio_stop_count, runtime_secret_interactions, runtime_secret_reward_keys, runtime_secret_sound_count, runtime_secret_motion_count, inventory_count_samples, runtime_lock_hardware_count, door_count, runtime_door_hardware_count, locked_door_feedback_count, door_handle_feedback_count, tuple(missing_labels)).to_json()


def _actor_by_label(actors: list["unreal.Actor"], label: str) -> "unreal.Actor | None":
    for actor in actors:
        if actor.get_actor_label() == label:
            return actor
    return None


def _reset_runtime_actor_state(actors: list["unreal.Actor"]) -> None:
    for actor in actors:
        if hasattr(actor, "reset_door_for_simulation"):
            actor.reset_door_for_simulation()
        if hasattr(actor, "reset_lock_for_simulation"):
            actor.reset_lock_for_simulation()
        if hasattr(actor, "reset_interaction_for_simulation"):
            actor.reset_interaction_for_simulation()
