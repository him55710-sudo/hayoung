export type HintPenalty = {
  id: string;
  label: string;
  shortLabel: string;
  detail: string;
  tone: string;
};

export const hintPenalties: HintPenalty[] = [
  {
    id: "banana",
    label: "현수한테 바나나우유 사주기",
    shortLabel: "바나나우유",
    detail: "첫 힌트 영수증",
    tone: "banana",
  },
  {
    id: "bingsu",
    label: "현수한테 설빙 사주기",
    shortLabel: "설빙",
    detail: "두 번째 힌트 계약",
    tone: "bingsu",
  },
  {
    id: "escape",
    label: "현수랑 방탈출 하러가기",
    shortLabel: "방탈출 데이트",
    detail: "최종 벌칙 예약권",
    tone: "escape",
  },
];

export const hintStageLabels = ["조사 위치 안내", "단서 연결 방식", "정답 직전 안내"] as const;
