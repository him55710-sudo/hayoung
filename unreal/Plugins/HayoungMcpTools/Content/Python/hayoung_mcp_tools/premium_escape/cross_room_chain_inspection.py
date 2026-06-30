from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

import unreal


@dataclass(frozen=True, slots=True)
class CrossRoomChainCounts:
    actor_count: int
    fragment_count: int
    receiver_slot_count: int
    dependency_line_count: int


def collect_cross_room_chain_counts(actors: Iterable["unreal.Actor"]) -> CrossRoomChainCounts:
    actor_count = 0
    fragment_count = 0
    receiver_slot_count = 0
    dependency_line_count = 0
    for actor in actors:
        label = actor.get_actor_label()
        if not label.startswith("PE_CrossChain_"):
            continue
        actor_count += 1
        fragment_count += int("_CodeShard" in label)
        receiver_slot_count += int("_ReceiverSlot_" in label)
        dependency_line_count += int("_DependencyLine" in label)
    return CrossRoomChainCounts(actor_count, fragment_count, receiver_slot_count, dependency_line_count)
