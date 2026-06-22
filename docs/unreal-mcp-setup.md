# Unreal Engine 5.8 MCP 연결 메모

Epic의 Unreal Engine 5.8에는 Experimental Unreal MCP 플러그인이 포함되어 있습니다. 이 플러그인은 Unreal Editor 내부에 MCP 서버를 띄우고, AI agent가 로컬 HTTP 연결로 에디터 도구를 호출할 수 있게 합니다.

## 현재 PC 확인 결과

- 표준 설치 경로인 `C:\Program Files\Epic Games\UE_5.8`에는 Unreal Editor가 없습니다.
- Windows 앱 목록에서도 Epic Games Launcher / Unreal Editor가 보이지 않았습니다.
- 따라서 이 PC에서 실제 에디터 연결은 UE 5.8 설치와 Epic 로그인 이후 가능합니다.
- 공식 Epic Games Launcher 설치 파일은 `C:\Users\임현수\Downloads\EpicInstaller-20.1.0.msi`에 다운로드해 두었습니다.
- C 드라이브 여유 공간은 확인 시점에 약 55GB입니다. UE 5.8 설치에는 옵션을 최소화하거나 추가 공간 확보가 필요할 수 있습니다.

## UE 5.8 설치 후 연결 순서

1. Epic Games Launcher에서 Unreal Engine 5.8을 설치합니다.
2. `unreal/Hayoung400.uproject`를 Unreal Editor 5.8로 엽니다.
3. `Edit > Plugins`에서 `Unreal MCP`를 검색해 활성화합니다. 필요하면 에디터를 재시작합니다.
4. `Edit > Editor Preferences > General > Model Context Protocol`에서 `Auto Start Server`를 켭니다.
5. 기본 서버 주소는 `http://127.0.0.1:8000/mcp`입니다.
6. 에디터 콘솔에서 다음 명령을 실행해 에이전트 설정을 생성합니다.

```text
ModelContextProtocol.GenerateClientConfig All
```

Codex만 대상으로 할 경우:

```text
ModelContextProtocol.GenerateClientConfig Codex
```

7. AI agent를 이 저장소 루트에서 다시 시작합니다.

## 준비된 저장소 파일

- `.mcp.json`: 기본 Unreal MCP 서버 주소를 가리키는 MCP 클라이언트 설정
- `unreal/Hayoung400.uproject`: 5.8 엔진 연결용 Unreal 프로젝트 파일
- `unreal/Plugins/HayoungMcpTools`: 자연어로 방/조명/기념 도시 블록을 배치하기 위한 Python Toolset 스캐폴드

## 에디터에서 바로 해볼 자연어 요청 예시

```text
Unreal MCP에 연결되어 있다면 400일 기념 방탈출 방을 만들어줘.
문, 책상, 달빛 창문, 따뜻한 조명, 단서 상자를 배치하고 배우 라벨을 정리해줘.
```

```text
Hayoung MCP toolset이 보이면 anniversary room preset을 만들고 조명을 더 로맨틱하게 맞춰줘.
```

5개 방 블록아웃:

```text
HayoungEscapeRoomTools의 create_five_room_escape_level을 실행해서 400일의 방 5개 룸 블록아웃을 만들어줘.
각 방에 퍼즐 장치, 보상 받침대, 다음 방 문, 따뜻한 조명을 배치해줘.
```

## 공식 문서 핵심

- 플러그인 이름은 UI에서 `Unreal MCP`, 내부 식별자는 `ModelContextProtocol`입니다.
- 기본 포트는 `8000`, 기본 경로는 `/mcp`입니다.
- 기본적으로 로컬 루프백 연결만 사용하며 인증 계층은 없습니다. 외부 네트워크에 노출하면 안 됩니다.
- Tool Search 모드에서는 `list_toolsets`, `describe_toolset`, `call_tool` 메타 도구가 보일 수 있습니다.
