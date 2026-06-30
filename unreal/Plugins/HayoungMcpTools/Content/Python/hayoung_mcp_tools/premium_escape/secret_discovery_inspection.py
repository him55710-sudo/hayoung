from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass, field

import unreal

from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class SecretDiscoveryCounts:
    actor_count: int
    room_count: int
    hidden_panel_count: int
    reveal_ghost_count: int
    reward_cache_count: int
    tool_cue_count: int
    dependency_link_count: int


@dataclass(slots=True)  # noqa: MUTABLE_OK
class _MutableSecretDiscoveryCounts:
    """Mutable accumulator for one secret-discovery inspection pass."""

    actor_count: int = 0
    hidden_panel_count: int = 0
    reveal_ghost_count: int = 0
    reward_cache_count: int = 0
    tool_cue_count: int = 0
    dependency_link_count: int = 0
    rooms: set[str] = field(default_factory=set)

    def consume(self, label: str) -> None:
        if not label.startswith("PE_SecretDiscovery_"):
            return
        self.actor_count += 1
        self.hidden_panel_count += int("_HiddenPanelClosed" in label)
        self.reveal_ghost_count += int("_OpenGhost" in label or "_PulledDrawerGhost" in label or "_LatchReleasedGhost" in label)
        self.reward_cache_count += int("_RewardCache" in label)
        self.tool_cue_count += int("_ToolCue" in label)
        self.dependency_link_count += int("_DependencyLink" in label)
        for room in ROOMS:
            if label.startswith(f"PE_SecretDiscovery_{room.prefix}_"):
                self.rooms.add(room.prefix)

    def freeze(self) -> SecretDiscoveryCounts:
        return SecretDiscoveryCounts(
            self.actor_count,
            len(self.rooms),
            self.hidden_panel_count,
            self.reveal_ghost_count,
            self.reward_cache_count,
            self.tool_cue_count,
            self.dependency_link_count,
        )


def collect_secret_discovery_counts(actors: Iterable["unreal.Actor"]) -> SecretDiscoveryCounts:
    counts = _MutableSecretDiscoveryCounts()
    for actor in actors:
        counts.consume(actor.get_actor_label())
    return counts.freeze()
