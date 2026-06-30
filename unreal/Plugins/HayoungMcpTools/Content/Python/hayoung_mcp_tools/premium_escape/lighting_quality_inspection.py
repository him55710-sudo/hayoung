from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

import unreal

from .specs import ROOMS


@dataclass(frozen=True, slots=True)
class LightingQualityCounts:
    actor_count: int
    room_count: int
    post_process_count: int
    key_light_count: int
    fill_light_count: int
    rim_light_count: int
    puzzle_light_count: int
    exit_light_count: int
    volumetric_beam_count: int
    dust_mote_count: int
    reflection_card_count: int
    shadow_catcher_count: int
    exposure_anchor_count: int


def collect_lighting_quality_counts(actors: Iterable["unreal.Actor"]) -> LightingQualityCounts:
    actor_count = 0
    post_process_count = 0
    key_light_count = 0
    fill_light_count = 0
    rim_light_count = 0
    puzzle_light_count = 0
    exit_light_count = 0
    volumetric_beam_count = 0
    dust_mote_count = 0
    reflection_card_count = 0
    shadow_catcher_count = 0
    exposure_anchor_count = 0
    rooms: set[str] = set()
    for actor in actors:
        label = actor.get_actor_label()
        if not label.startswith("PE_LightingQuality_"):
            continue
        actor_count += 1
        post_process_count += int(label.endswith("_PostProcessVolume"))
        key_light_count += int(label.endswith("_KeyLight"))
        fill_light_count += int(label.endswith("_FillLight"))
        rim_light_count += int(label.endswith("_RimLight"))
        puzzle_light_count += int(label.endswith("_PuzzleFocusLight"))
        exit_light_count += int(label.endswith("_ExitGlowLight"))
        volumetric_beam_count += int("_VolumetricBeam_" in label)
        dust_mote_count += int("_DustMote_" in label)
        reflection_card_count += int("_ReflectionCard_" in label)
        shadow_catcher_count += int("_ShadowCatcher_" in label)
        exposure_anchor_count += int(label.endswith("_ExposureAnchor"))
        for room in ROOMS:
            if label.startswith(f"PE_LightingQuality_{room.prefix}_"):
                rooms.add(room.prefix)
    return LightingQualityCounts(
        actor_count,
        len(rooms),
        post_process_count,
        key_light_count,
        fill_light_count,
        rim_light_count,
        puzzle_light_count,
        exit_light_count,
        volumetric_beam_count,
        dust_mote_count,
        reflection_card_count,
        shadow_catcher_count,
        exposure_anchor_count,
    )
