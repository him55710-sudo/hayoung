from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Final, TypeAlias

Color: TypeAlias = tuple[float, float, float]
VectorTriple: TypeAlias = tuple[float, float, float]

ROOM1_PROTO_PREFIX: Final[str] = "PE_Room1Proto"
ROOM1_SOURCE_PREFIX: Final[str] = "PremiumEscape_Room01_DiaryArchive"
BEEF_IMAGE_SOURCE: Final[Path] = Path(r"C:\Users\임현수\Downloads\ChatGPT Image 2026년 6월 30일 오전 02_48_50.png")


@dataclass(frozen=True, slots=True)
class MemoryFrameSpec:
    name: str
    title: str
    clue: str
    border_color: str
    material_key: str
    location: VectorTriple
    image_source: Path


@dataclass(frozen=True, slots=True)
class PuzzleStationSpec:
    key: str
    title: str
    prompt: str
    required_key: str
    reward_key: str
    location: VectorTriple
    color: Color


@dataclass(frozen=True, slots=True)
class BeefSlotSpec:
    key: str
    label: str
    location: VectorTriple
    is_answer: bool


ROOM1_IMAGE_DIR: Final[Path] = Path(r"C:\Users\임현수\OneDrive\그림\Saved Pictures\1번 테마\1번 방")
JATJEOL_CONFESSION_IMAGE: Final[Path] = ROOM1_IMAGE_DIR / "KakaoTalk_20260629_213013107.jpg"
VIOLIN_KEYRING_IMAGE: Final[Path] = ROOM1_IMAGE_DIR / "KakaoTalk_20260629_213013107_01.png"
BIRTHDAY_GIFT_IMAGE: Final[Path] = ROOM1_IMAGE_DIR / "KakaoTalk_20260629_213013107_02.jpg"
PHILIPPINES_TRIP_IMAGE: Final[Path] = ROOM1_IMAGE_DIR / "KakaoTalk_20260629_213013107_03.jpg"
HUNDRED_DAY_IMAGE: Final[Path] = ROOM1_IMAGE_DIR / "KakaoTalk_20260629_213013107_04.jpg"


MEMORY_FRAMES: Final[tuple[MemoryFrameSpec, ...]] = (
    MemoryFrameSpec("JatjeolConfession", "첫 고백", "잣절 공원 벤치", "노랑", "BrassEdge", (-182.0, 272.0, 202.0), JATJEOL_CONFESSION_IMAGE),
    MemoryFrameSpec("BirthdayGift", "현수 생일", "하영이가 준 선물", "초록", "GlassTeal", (-52.0, 272.0, 202.0), BIRTHDAY_GIFT_IMAGE),
    MemoryFrameSpec("PhilippinesTrip", "필리핀 여행", "함께 본 높은 하늘", "파랑", "RainBlue", (-182.0, 272.0, 112.0), PHILIPPINES_TRIP_IMAGE),
    MemoryFrameSpec("HundredDayHongdae", "100일 네 컷", "홍대의 네 장면", "빨강", "RoseGlow", (-52.0, 272.0, 112.0), HUNDRED_DAY_IMAGE),
)

PUZZLE_STATIONS: Final[tuple[PuzzleStationSpec, ...]] = (
    PuzzleStationSpec("P0_Letter", "문제 0: Vita500 편지", "[E] 책상 위 편지 읽기 / vita500 입력", "", "Room1_P0_Vita500Solved", (-284.0, -208.0, 96.0), (1.0, 0.62, 0.42)),
    PuzzleStationSpec("P1_ColorOrder", "문제 1: 추억 시간순", "노랑-초록-파랑-빨강 / YGBR", "Room1_P0_Vita500Solved", "Room1_P1_ColorOrderSolved", (-116.0, 176.0, 92.0), (1.0, 0.88, 0.25)),
    PuzzleStationSpec("P1_KeyringPickup", "바이올린 키링 획득", "[E] 액자 속 작은 바이올린 키링 줍기", "Room1_P1_ColorOrderSolved", "ViolinKeyring", (58.0, 244.0, 188.0), (0.95, 0.68, 0.28)),
    PuzzleStationSpec("P2_ViolinDoll", "문제 2: 바이올린 피규어", "[E] 피규어에게 키링 건네기", "ViolinKeyring", "Room1_P2_DollPlayed", (154.0, 112.0, 124.0), (0.52, 0.78, 1.0)),
    PuzzleStationSpec("P3_Carousel", "문제 3: 회전목마", "[E] 오르골에서 회전목마 소품 꺼내기", "Room1_P2_DollPlayed", "Carousel", (156.0, 34.0, 126.0), (1.0, 0.74, 0.86)),
    PuzzleStationSpec("P4_PaintingSlot", "문제 4: 놀이공원 그림", "[E] 그림의 빈자리에 회전목마 넣기", "Carousel", "Room1_P4_PaintingSolved", (282.0, 248.0, 186.0), (0.96, 0.80, 0.50)),
    PuzzleStationSpec("P5_GuroBench", "문제 5: 구로평상 9번", "[E] 평상을 9번 칸에 올리기", "Room1_P4_PaintingSolved", "Room1_P5_BenchOnNine", (16.0, -34.0, 42.0), (0.72, 0.52, 0.34)),
    PuzzleStationSpec("P5_MeatPickup", "고기 덩어리 획득", "[E] 9번 칸 아래 고기 줍기", "Room1_P5_BenchOnNine", "MeatPiece", (118.0, -96.0, 46.0), (0.86, 0.28, 0.18)),
    PuzzleStationSpec("P6_SalchisalSlot", "문제 6: 살치살 위치", "[E] ㅅㅊㅅ 슬롯에 고기 놓기", "MeatPiece", "Room1_P6_MeatSolved", (286.0, 270.0, 124.0), (1.0, 0.38, 0.28)),
    PuzzleStationSpec("P7_HyunsuSteak", "현수의 스테이크 시식", "[E] A 스테이크 맛보기", "Room1_P6_MeatSolved", "TastedHyunsuSteak", (188.0, -214.0, 78.0), (0.98, 0.46, 0.22)),
    PuzzleStationSpec("P7_AlperoSteak", "알페로 스테이크 시식", "[E] B 스테이크 맛보기", "TastedHyunsuSteak", "BothSteaksTasted", (306.0, -214.0, 78.0), (0.92, 0.30, 0.24)),
    PuzzleStationSpec("P7_FinalVote", "문제 7: 최종 선택", "[E] 현수의 스테이크에 투표", "BothSteaksTasted", "Room1_P7_FinalSolved", (248.0, -170.0, 88.0), (1.0, 0.72, 0.36)),
)

BEEF_SLOTS: Final[tuple[BeefSlotSpec, ...]] = (
    BeefSlotSpec("Chuck", "ㄷㅅㅁ", (186.0, 273.0, 188.0), False),
    BeefSlotSpec("Salchisal", "ㅅㅊㅅ", (250.0, 273.0, 188.0), True),
    BeefSlotSpec("Rib", "ㅇㅅ", (314.0, 273.0, 188.0), False),
    BeefSlotSpec("Tender", "ㅊㄷㄹ", (218.0, 273.0, 96.0), False),
    BeefSlotSpec("Brisket", "ㄱㅂㅅ", (290.0, 273.0, 96.0), False),
)

REQUIRED_ROOM1_LABELS: Final[tuple[str, ...]] = (
    "PE_Room1Proto_Desk",
    "PE_Room1Proto_WallMessageFrame",
    "PE_Room1Proto_RuleBoard",
    "PE_Room1Proto_PhotoString_Rail",
    "PE_Room1Proto_LetterText",
    "PE_Room1Proto_P0_Letter_Lock",
    "PE_Room1Proto_ColorButton_Yellow",
    "PE_Room1Proto_ColorButton_Green",
    "PE_Room1Proto_ColorButton_Blue",
    "PE_Room1Proto_ColorButton_Red",
    "PE_Room1Proto_P1_KeyringPickup_Prop",
    "PE_Room1Proto_P2_ViolinDoll_Prop",
    "PE_Room1Proto_P3_Carousel_Prop",
    "PE_Room1Proto_ViolinGlassCase",
    "PE_Room1Proto_CarouselMusicBox_Base",
    "PE_Room1Proto_AmusementParkPainting",
    "PE_Room1Proto_P4_PaintingSlot_Prop",
    "PE_Room1Proto_FloorGrid_Cell09",
    "PE_Room1Proto_P5_GuroBench_Prop",
    "PE_Room1Proto_BeefCutsWall_BigBoard",
    "PE_Room1Proto_BeefImagePanel",
    "PE_Room1Proto_BeefSlot_Salchisal",
    "PE_Room1Proto_P6_SalchisalSlot_Prop",
    "PE_Room1Proto_Steak_A_Plate",
    "PE_Room1Proto_Steak_B_Plate",
    "PE_Room1Proto_P7_HyunsuSteak_Prop",
    "PE_Room1Proto_P7_AlperoSteak_Prop",
    "PE_Room1Proto_P7_FinalVote_Prop",
    "PE_Room1Proto_DoorToRoom2",
    "PE_Room1Proto_Room2Placeholder",
)
