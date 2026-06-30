from __future__ import annotations

import json
from dataclasses import dataclass

import unreal

from hayoung_mcp_tools.toolsets.romantic_escape_room import _spawn

from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class RuntimeFootstepSurfaceSimulation:
    room_audio_volume_count: int
    configured_surface_count: int
    player_surface_count: int
    expected_surface_count: int
    missing_labels: tuple[str, ...]

    def is_ready(self) -> bool:
        return (
            self.room_audio_volume_count == 5
            and self.configured_surface_count == 5
            and self.player_surface_count == 5
            and self.expected_surface_count == 5
            and len(self.missing_labels) == 0
        )

    def to_json(self) -> str:
        return json.dumps(
            {
                "room_audio_volume_count": self.room_audio_volume_count,
                "configured_surface_count": self.configured_surface_count,
                "player_surface_count": self.player_surface_count,
                "expected_surface_count": self.expected_surface_count,
                "missing_labels": list(self.missing_labels),
                "ready": self.is_ready(),
            },
            ensure_ascii=False,
        )


def simulate_runtime_footstep_surfaces() -> str:
    actor_subsystem = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    actors = actor_subsystem.get_all_level_actors()
    player_class = unreal.load_class(None, "/Script/Hayoung500.HYFirstPersonCharacter")
    if not player_class:
        return RuntimeFootstepSurfaceSimulation(0, 0, 0, 0, ("HYFirstPersonCharacter class",)).to_json()

    player = _spawn(player_class, unreal.Vector(-280.0, -180.0, 88.0), label="PE_QA_RuntimeFootstepPlayer")
    configured_surfaces: set[str] = set()
    player_surfaces: set[str] = set()
    expected_surfaces = {room.footstep_surface for room in ROOMS}
    missing_labels: list[str] = []
    room_audio_volume_count = 0

    for room in ROOMS:
        label = f"PE_Runtime_{room.prefix}_RoomAudioVolume"
        audio_actor = _actor_by_label(actors, label)
        if audio_actor:
            room_audio_volume_count += 1
            configured_surfaces.add(str(audio_actor.get_footstep_surface_name()))
            audio_actor.preview_enter_room_for_player(player)
            player_surfaces.add(str(player.get_runtime_footstep_surface()))
            audio_actor.preview_exit_room()
        else:
            missing_labels.append(label)

    actor_subsystem.destroy_actor(player)
    return RuntimeFootstepSurfaceSimulation(room_audio_volume_count, len(configured_surfaces), len(player_surfaces), len(expected_surfaces), tuple(missing_labels)).to_json()


def _actor_by_label(actors: list["unreal.Actor"], label: str) -> "unreal.Actor | None":
    for actor in actors:
        if actor.get_actor_label() == label:
            return actor
    return None
