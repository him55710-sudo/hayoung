from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum, unique
from typing import Final, TypeAlias


Color: TypeAlias = tuple[float, float, float]


@unique
class LockKind(StrEnum):
    COMBINATION = "combination"
    DIRECTION = "direction"
    KEYPAD = "keypad"
    KEYED_PADLOCK = "keyed_padlock"
    MAGNETIC = "magnetic"
    BUTTON_SEQUENCE = "button_sequence"
    LETTER = "letter"
    SAFE_DIAL = "safe_dial"


@dataclass(frozen=True, slots=True)
class LockSpec:
    kind: LockKind
    title: str
    clue: str
    motion: str
    answer: str
    rel_x: float
    rel_y: float


@dataclass(frozen=True, slots=True)
class RoomSpec:
    prefix: str
    title: str
    subtitle: str
    x: float
    width: float
    depth: float
    height: float
    accent: Color
    ambient_key: str
    footstep_surface: str
    layout_note: str
    decor: tuple[str, ...]
    locks: tuple[LockSpec, ...]


@dataclass(frozen=True, slots=True)
class SoundSpec:
    key: str
    filename: str
    frequency: float
    duration: float
    mood: str


ROOMS: Final[tuple[RoomSpec, ...]] = (
    RoomSpec(
        prefix="PremiumEscape_Room01_DiaryArchive",
        title="첫 기록 보관실",
        subtitle="작은 책장, 편지, 숨겨진 네 자리 자물쇠",
        x=0.0,
        width=720.0,
        depth=560.0,
        height=330.0,
        accent=(1.0, 0.62, 0.42),
        ambient_key="bgm_diary_archive",
        footstep_surface="wood",
        layout_note="small rectangular archive with dense search surfaces",
        decor=("diary_wall", "photo_frames", "drawer_stack", "hint_phone", "letter_box"),
        locks=(
            LockSpec(LockKind.COMBINATION, "0500 네 자리 자물쇠", "사진 날짜와 책갈피 숫자를 합친다", "dial wheels rotate, shackle rises, drawer slides", "0500", -180.0, 170.0),
            LockSpec(LockKind.KEYED_PADLOCK, "작은 황동 열쇠", "책장 밑면의 자석 키를 집는다", "key inserts, quarter turn, clasp drops", "BRASS", 185.0, -115.0),
        ),
    ),
    RoomSpec(
        prefix="PremiumEscape_Room02_CafePromise",
        title="카페 약속 주방",
        subtitle="카운터와 좌석 사이를 훑는 방향 자물쇠",
        x=900.0,
        width=880.0,
        depth=680.0,
        height=360.0,
        accent=(0.48, 0.95, 0.72),
        ambient_key="bgm_cafe_promise",
        footstep_surface="tile",
        layout_note="L-shaped cafe counter with booth alcove and arrow trail",
        decor=("espresso_counter", "booth_seats", "receipt_clues", "menu_board", "service_bell"),
        locks=(
            LockSpec(LockKind.DIRECTION, "상하좌우 방향 자물쇠", "영수증 화살표와 컵받침 순서를 맞춘다", "four arrows depress in sequence, latch clicks", "URDL", -225.0, 210.0),
            LockSpec(LockKind.BUTTON_SEQUENCE, "색상 버튼 패널", "메뉴판 색상 가격 순서가 버튼 순서다", "buttons sink, green lamp sweeps left to right", "PGBG", 230.0, -150.0),
        ),
    ),
    RoomSpec(
        prefix="PremiumEscape_Room03_RainRepair",
        title="비 오는 수리실",
        subtitle="파이프, 퓨즈, 젖은 창문 뒤의 자기 잠금",
        x=1970.0,
        width=650.0,
        depth=820.0,
        height=430.0,
        accent=(0.45, 0.58, 1.0),
        ambient_key="bgm_rain_repair",
        footstep_surface="concrete",
        layout_note="tall narrow workshop with rain window and fuse wall",
        decor=("rain_window", "pipe_grid", "fuse_box", "tool_shadow", "broken_heart_repair"),
        locks=(
            LockSpec(LockKind.MAGNETIC, "자석 리드 스위치", "금속 하트 조각을 올바른 홈에 붙인다", "magnet snaps, hidden relay opens, panel hum fades", "HEART", -165.0, 250.0),
            LockSpec(LockKind.KEYPAD, "습기 찬 숫자 키패드", "빗방울이 남긴 네 자리 흔적을 입력한다", "keys press, red LED turns blue, bolt retracts", "2013", 175.0, -210.0),
        ),
    ),
    RoomSpec(
        prefix="PremiumEscape_Room04_NightCity",
        title="야간 도시 옥상",
        subtitle="넓은 도시 미니어처와 엘리베이터 금고",
        x=3040.0,
        width=1050.0,
        depth=760.0,
        height=480.0,
        accent=(1.0, 0.55, 0.35),
        ambient_key="bgm_night_city",
        footstep_surface="metal",
        layout_note="wide rooftop city set with balcony and skyline route",
        decor=("mini_city_grid", "neon_signs", "bridge_model", "window_signal", "elevator_panel"),
        locks=(
            LockSpec(LockKind.SAFE_DIAL, "회전식 미니 금고", "도시 건물 높이가 좌우 회전 각도다", "dial rotates left-right-left, safe door swings", "L35R20L10", -260.0, 160.0),
            LockSpec(LockKind.LETTER, "세 글자 문자 자물쇠", "창문 신호의 첫 글자들을 읽는다", "letter drums roll, rooftop gate unlocks", "HYS", 260.0, -120.0),
        ),
    ),
    RoomSpec(
        prefix="PremiumEscape_Room05_HeavenVault",
        title="하늘 금고 예식홀",
        subtitle="구름길, 편지 금고, 500일 엔딩 문",
        x=4300.0,
        width=1180.0,
        depth=920.0,
        height=540.0,
        accent=(0.8, 0.9, 1.0),
        ambient_key="bgm_heaven_vault",
        footstep_surface="cloud",
        layout_note="large ceremonial vault with circular cloud path",
        decor=("cloud_path", "memory_columns", "letter_vault", "heart_gate", "ending_pedestal"),
        locks=(
            LockSpec(LockKind.COMBINATION, "500일 최종 조합", "앞 네 방에서 얻은 숫자 조각을 합친다", "five tumblers align, gold bolt slides", "500", -210.0, 215.0),
            LockSpec(LockKind.KEYED_PADLOCK, "하트 열쇠 엔딩문", "마지막 편지에서 하트 키를 받는다", "key turns slowly, double doors open outward", "LOVE", 250.0, -180.0),
        ),
    ),
)


SOUNDS: Final[tuple[SoundSpec, ...]] = (
    SoundSpec("bgm_diary_archive", "bgm_diary_archive.wav", 220.0, 7.5, "warm paper pad"),
    SoundSpec("bgm_cafe_promise", "bgm_cafe_promise.wav", 277.0, 7.5, "soft cafe pulse"),
    SoundSpec("bgm_rain_repair", "bgm_rain_repair.wav", 146.0, 7.5, "rainy blue drone"),
    SoundSpec("bgm_night_city", "bgm_night_city.wav", 196.0, 7.5, "distant city hum"),
    SoundSpec("bgm_heaven_vault", "bgm_heaven_vault.wav", 330.0, 8.0, "bright finale pad"),
    SoundSpec("sfx_door_creak", "sfx_door_creak.wav", 92.0, 1.6, "hinge creak"),
    SoundSpec("sfx_lock_click", "sfx_lock_click.wav", 740.0, 0.28, "metal click"),
    SoundSpec("sfx_key_pickup", "sfx_key_pickup.wav", 988.0, 0.45, "small key shimmer"),
    SoundSpec("sfx_keypad_beep", "sfx_keypad_beep.wav", 880.0, 0.18, "button beep"),
    SoundSpec("sfx_drawer_slide", "sfx_drawer_slide.wav", 132.0, 0.9, "wooden slide"),
    SoundSpec("sfx_safe_open", "sfx_safe_open.wav", 110.0, 1.2, "heavy safe open"),
    SoundSpec("sfx_dial_tick", "sfx_dial_tick.wav", 510.0, 0.22, "ratcheting dial tick"),
    SoundSpec("sfx_direction_press", "sfx_direction_press.wav", 430.0, 0.20, "direction button thunk"),
    SoundSpec("sfx_key_turn", "sfx_key_turn.wav", 260.0, 0.55, "key teeth and cylinder turn"),
    SoundSpec("sfx_magnetic_snap", "sfx_magnetic_snap.wav", 190.0, 0.42, "magnet snap relay"),
    SoundSpec("sfx_button_press", "sfx_button_press.wav", 620.0, 0.24, "arcade color button press"),
    SoundSpec("sfx_letter_roll", "sfx_letter_roll.wav", 360.0, 0.48, "letter drum roll"),
    SoundSpec("sfx_error_buzz", "sfx_error_buzz.wav", 104.0, 0.38, "wrong input buzz"),
    SoundSpec("sfx_fuse_toggle", "sfx_fuse_toggle.wav", 210.0, 0.46, "fuse switch toggle"),
    SoundSpec("sfx_service_bell", "sfx_service_bell.wav", 910.0, 0.54, "counter service bell"),
    SoundSpec("sfx_valve_turn", "sfx_valve_turn.wav", 155.0, 0.80, "pipe valve turn"),
    SoundSpec("sfx_elevator_chime", "sfx_elevator_chime.wav", 760.0, 0.64, "elevator panel chime"),
    SoundSpec("sfx_paper_rustle", "sfx_paper_rustle.wav", 318.0, 1.4, "paper clue rustle"),
    SoundSpec("sfx_phone_buzz", "sfx_phone_buzz.wav", 118.0, 1.0, "hint phone buzz"),
    SoundSpec("sfx_cafe_machine", "sfx_cafe_machine.wav", 246.0, 1.8, "espresso steam hiss"),
    SoundSpec("sfx_rain_window", "sfx_rain_window.wav", 172.0, 2.4, "rain on window"),
    SoundSpec("sfx_neon_hum", "sfx_neon_hum.wav", 88.0, 2.2, "electrical neon hum"),
    SoundSpec("sfx_heaven_chime", "sfx_heaven_chime.wav", 660.0, 1.8, "soft celestial chime"),
    SoundSpec("sfx_footstep_wood", "sfx_footstep_wood.wav", 122.0, 0.34, "warm wooden step"),
    SoundSpec("sfx_footstep_tile", "sfx_footstep_tile.wav", 168.0, 0.28, "clean cafe tile step"),
    SoundSpec("sfx_footstep_concrete", "sfx_footstep_concrete.wav", 94.0, 0.36, "damp concrete step"),
    SoundSpec("sfx_footstep_metal", "sfx_footstep_metal.wav", 210.0, 0.30, "thin rooftop metal step"),
    SoundSpec("sfx_footstep_cloud", "sfx_footstep_cloud.wav", 244.0, 0.42, "soft cloud footfall"),
    SoundSpec("sfx_cloth_rustle", "sfx_cloth_rustle.wav", 294.0, 0.62, "cloth and envelope rustle"),
    SoundSpec("sfx_floor_creak", "sfx_floor_creak.wav", 72.0, 0.58, "low room floor creak"),
    SoundSpec("sfx_breath_focus", "sfx_breath_focus.wav", 132.0, 0.72, "quiet focus breath"),
)
