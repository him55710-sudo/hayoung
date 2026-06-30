from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

import unreal

from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class PuzzleFeedbackCounts:
    actor_count: int
    room_count: int
    station_count: int
    success_lamp_count: int
    error_lamp_count: int
    progress_node_count: int
    correction_frame_count: int
    reward_glow_count: int
    reset_cue_count: int
    hand_rebound_count: int
    audio_anchor_count: int


def collect_puzzle_feedback_counts(actors: Iterable["unreal.Actor"]) -> PuzzleFeedbackCounts:
    actor_count = 0
    success_lamp_count = 0
    error_lamp_count = 0
    progress_node_count = 0
    correction_frame_count = 0
    reward_glow_count = 0
    reset_cue_count = 0
    hand_rebound_count = 0
    audio_anchor_count = 0
    rooms: set[str] = set()
    stations: set[str] = set()
    for actor in actors:
        label = actor.get_actor_label()
        if not label.startswith("PE_PuzzleFeedback_"):
            continue
        actor_count += 1
        success_lamp_count += int(label.endswith("_SuccessLamp"))
        error_lamp_count += int(label.endswith("_ErrorLamp"))
        progress_node_count += int("_ProgressNode_" in label)
        correction_frame_count += int("_CorrectionFrame_" in label)
        reward_glow_count += int(label.endswith("_RewardKeyGlow"))
        reset_cue_count += int(label.endswith("_ResetStrip"))
        hand_rebound_count += int(label.endswith("_HandReboundRail"))
        audio_anchor_count += int(label.endswith("_InputEmitter") or label.endswith("_SuccessEmitter") or label.endswith("_ErrorEmitter"))
        for room in ROOMS:
            if label.startswith(f"PE_PuzzleFeedback_{room.prefix}_"):
                rooms.add(room.prefix)
            for index, lock in enumerate(room.locks):
                station = f"PE_PuzzleFeedback_{room.prefix}_L{index + 1:02d}_{lock.kind.value}"
                if label.startswith(station):
                    stations.add(station)
    return PuzzleFeedbackCounts(
        actor_count,
        len(rooms),
        len(stations),
        success_lamp_count,
        error_lamp_count,
        progress_node_count,
        correction_frame_count,
        reward_glow_count,
        reset_cue_count,
        hand_rebound_count,
        audio_anchor_count,
    )
