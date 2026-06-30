from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

import unreal


@dataclass(frozen=True, slots=True)
class EndingSceneCounts:
    actor_count: int
    photo_spot_count: int
    letter_count: int
    audio_cue_count: int


def collect_ending_counts(actors: Iterable["unreal.Actor"]) -> EndingSceneCounts:
    actor_count = 0
    photo_spot_count = 0
    letter_count = 0
    audio_cue_count = 0
    for actor in actors:
        label = actor.get_actor_label()
        if not label.startswith("PE_Ending_"):
            continue
        actor_count += 1
        photo_spot_count += int("_PhotoSpot" in label)
        letter_count += int("_FinalLetter" in label)
        audio_cue_count += int("Cue" in label)
    return EndingSceneCounts(actor_count, photo_spot_count, letter_count, audio_cue_count)
