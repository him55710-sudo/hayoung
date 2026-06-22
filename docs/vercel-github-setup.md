# GitHub / Vercel 연결 메모

## 현재 상태

- GitHub 저장소: `him55710-sudo/hayoung`
- 이 로컬 폴더는 위 저장소를 원격 `origin`으로 가진 Git 저장소입니다.
- 원격 저장소는 클론 시점에 완전히 비어 있었습니다.
- Vercel 프로젝트: `https://vercel.com/mongben/hyunsu-hayoung-400`
- Vercel 대시보드에는 `Connect Git Repository` 단계가 남아 있었습니다.
- 로컬에는 `gh`와 `vercel` CLI가 전역 설치되어 있지 않았습니다. `npx vercel`로 임시 실행할 수 있습니다.

## Vercel에서 GitHub 연결

1. Vercel 프로젝트 `hyunsu-hayoung-400`로 이동합니다.
2. `Connect Git Repository`를 선택합니다.
3. GitHub 앱 권한 화면에서 `him55710-sudo/hayoung` 저장소 접근을 허용합니다.
4. Framework Preset은 `Vite`, Build Command는 `npm run build`, Output Directory는 `dist`를 사용합니다.
5. 연결 후 GitHub `main` 브랜치에 push하면 Vercel이 자동 배포합니다.

## 프로젝트 이름 변경 추천

기념일이 500일로 변경되었으므로 Vercel 프로젝트 이름도 나중에 다음처럼 바꾸는 것을 추천합니다.

```text
hyunsu-hayoung-500
```

Vercel URL을 유지해야 하면 이름만 바꾸지 않고 앱 내부 문구만 500일로 유지해도 됩니다.
