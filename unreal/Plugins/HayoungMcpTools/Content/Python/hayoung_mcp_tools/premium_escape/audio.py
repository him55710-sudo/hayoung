from __future__ import annotations

import math
import wave
from collections.abc import Mapping
from pathlib import Path
from typing import Final

import unreal

from .specs import SOUNDS, SoundSpec


AUDIO_DESTINATION: Final[str] = "/Game/Hayoung500/Audio"
SAMPLE_RATE: Final[int] = 22050
MAX_INT16: Final[int] = 32767


def ensure_audio_assets() -> Mapping[str, str]:
    source_dir = Path(unreal.Paths.project_dir()) / "SourceAudio" / "Hayoung500"
    source_dir.mkdir(parents=True, exist_ok=True)
    tasks: list[unreal.AssetImportTask] = []
    asset_paths: dict[str, str] = {}

    for spec in SOUNDS:
        wav_path = source_dir / spec.filename
        _write_wave(wav_path, spec)
        asset_name = Path(spec.filename).stem
        asset_paths[spec.key] = f"{AUDIO_DESTINATION}/{asset_name}"
        if not unreal.EditorAssetLibrary.does_asset_exist(asset_paths[spec.key]):
            task = unreal.AssetImportTask()
            task.set_editor_property("filename", str(wav_path))
            task.set_editor_property("destination_path", AUDIO_DESTINATION)
            task.set_editor_property("automated", True)
            task.set_editor_property("save", True)
            tasks.append(task)

    if tasks:
        unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks(tasks)
    return asset_paths


def _write_wave(path: Path, spec: SoundSpec) -> None:
    frame_count = max(1, int(spec.duration * SAMPLE_RATE))
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(_wave_bytes(spec, frame_count))


def _wave_bytes(spec: SoundSpec, frame_count: int) -> bytes:
    frames = bytearray()
    for index in range(frame_count):
        time = index / SAMPLE_RATE
        env = _envelope(time, spec.duration)
        sample = _sample(spec, time) * env
        value = int(max(-1.0, min(1.0, sample)) * MAX_INT16)
        frames.extend(value.to_bytes(2, "little", signed=True))
    return bytes(frames)


def _envelope(time: float, duration: float) -> float:
    attack = min(1.0, time / 0.18)
    release = min(1.0, (duration - time) / 0.28)
    return max(0.0, min(attack, release))


def _sample(spec: SoundSpec, time: float) -> float:
    base = math.sin(2.0 * math.pi * spec.frequency * time)
    overtone = 0.35 * math.sin(2.0 * math.pi * spec.frequency * 1.5 * time)
    slow = 0.25 * math.sin(2.0 * math.pi * (spec.frequency / 4.0) * time)
    noise = 0.08 * math.sin(2.0 * math.pi * 37.0 * time) * math.sin(2.0 * math.pi * 19.0 * time)
    return 0.34 * base + 0.19 * overtone + slow + noise
