# 운세인사이트 프로젝트 작업기록

최종 갱신: 2026-08-19

이 문서는 대화가 길어지거나 새 채팅으로 이동해도 운세인사이트 개발을 같은 기준으로 이어가기 위한 기준 문서입니다.

## 1. 현재 확정된 방향

- 만세력 계산은 운세인사이트 자체 계산 결과를 사용한다.
- Gemini는 생년월일로 사주를 다시 계산하지 않는다.
- 사주총평 입력 범위는 원국과 전체 대운이다.
- 오늘의 운세 입력 범위는 원국·대운·세운·월운·일진이다.
- Gemini 결과는 최초 생성 후 DB에 저장하고, 같은 결과는 DB에서 재사용한다.
- 장기 목표는 Gemini가 계산과 판단을 담당하지 않게 하고, 자체 명리 특징 추출기와 규칙 엔진을 구축하는 것이다.
- 고객 데이터는 서비스 제공용과 연구·개선용을 분리한다. 연구·학습에는 동의 및 검수된 익명 데이터만 사용한다.

## 2. 현재 완료된 작업

- `saju_charts.chart_data`에 만세력 원본 결과가 저장되고 있다.
- `saju_interpretations`에 Gemini 풀이와 생성 버전을 저장한다.
- 사주총평 API의 `interpretation_type`은 `overall`, `period_key`는 `lifetime`을 사용한다.
- `saju_interpretations_type_check`에 `overall` 허용값을 추가했다.
- 확인 결과: `overall_allowed = true`.
- 사주총평 1~3번을 Gemini가 한 번에 생성하고 `structured_result.summary`, `structured_result.essence`로 저장하는 코드가 준비되었다.
- 사주총평 상세 내용은 세로형 전체 너비로 표시되며 이전·다음 버튼은 제거되었다.

## 3. 중요한 구분

### `saju_charts`

만세력 계산 결과의 원본 저장소다. 같은 목적의 만세력 결과 테이블을 다시 만들지 않는다.

### `saju_feature_snapshots`

원본 `chart_data`에서 사주 해석에 사용할 명리 특징을 표준 형식으로 추출한 기록이다. 새로운 만세력 계산 결과가 아니라, 풀이 근거를 추적하기 위한 파생 데이터다.

## 4. 지금 해야 할 작업

사주총평 2번 이후의 풀이 항목을 계속 확대하기 전에 `saju_feature_snapshots`의 최소 구조를 설계한다.

단, 실제 SQL과 추출 코드는 현재 `chart_data`의 필드명을 확인한 뒤 작성한다. 필드 구조를 추측하여 SQL이나 추출기를 만들지 않는다.

확인에 필요한 파일:

1. `app/api/saju/route.js` 또는 `route.ts`
2. `app/lib/saju/chart-storage.ts`
3. 가능하면 개인정보를 제거한 `saju_charts.chart_data` 샘플 JSON 1건

## 5. `saju_feature_snapshots` 최소 설계안

예정 필드:

| 필드 | 역할 |
| --- | --- |
| `id` | 특징 스냅샷 ID |
| `user_id` | 소유 사용자 및 RLS 기준 |
| `saju_chart_id` | 원본 만세력 행 연결 |
| `feature_version` | 특징 추출 로직 버전 |
| `source_engine_version` | 원본 만세력 계산 엔진 버전 |
| `source_chart_hash` | 같은 계산 입력과 결과 식별 |
| `original_features` | 일간·월령·오행·십성·합충형파해 등 원국 특징 |
| `daeun_features` | 전체 대운과 원국의 작용 특징 |
| `validation_status` | 생성·검증·오류 상태 |
| `validation_errors` | 누락 또는 불일치 기록 |
| `created_at` / `updated_at` | 생성 및 수정 시각 |

유일성 기준은 우선 `(saju_chart_id, feature_version)`으로 한다. 같은 만세력이라도 특징 추출 로직이 변경되면 새 버전으로 다시 생성할 수 있어야 한다.

## 6. 특징 데이터 예시

아래 구조는 방향 예시이며 실제 필드명은 현재 `chart_data`를 확인한 뒤 확정한다.

```json
{
  "dayMaster": {
    "stem": "예시",
    "element": "예시",
    "yinYang": "예시",
    "sourcePath": "chart.day.gan"
  },
  "season": {
    "monthBranch": "예시",
    "solarTerm": "예시"
  },
  "fiveElements": {
    "rawCounts": {},
    "weightedScores": {},
    "calculationVersion": "feature-v1"
  },
  "tenGods": [],
  "relations": [],
  "strength": {
    "result": "예시",
    "score": null,
    "evidenceFactIds": []
  },
  "structure": {
    "gyeokguk": null,
    "school": null,
    "evidenceFactIds": []
  },
  "usefulElements": {
    "yongshin": null,
    "heeshin": [],
    "school": null,
    "evidenceFactIds": []
  }
}
```

격국·신강신약·용희신은 유파와 판정 규칙에 따라 달라질 수 있으므로 반드시 `school`, `feature_version`, 판정 근거를 함께 저장한다.

## 7. Gemini 근거 추적 방식

각 특징에 서버가 고유한 `factId`를 부여한다.

```json
{
  "factId": "ORIGINAL_DAY_MASTER_ELEMENT",
  "value": "예시",
  "sourcePath": "chart.day.gan",
  "calculator": "feature-v1"
}
```

Gemini에는 계산 결과와 `factId`를 전달하고, 각 풀이 항목에 사용한 `evidenceFactIds`를 반환하도록 요청한다. 서버는 반환된 모든 ID가 실제 스냅샷에 존재하는지 검증한 뒤 저장한다.

```json
{
  "id": 1,
  "headline": "풀이 원문",
  "evidenceFactIds": [
    "ORIGINAL_DAY_MASTER_ELEMENT",
    "ORIGINAL_MONTH_SEASON",
    "DAEUN_CURRENT_RELATION"
  ]
}
```

저장 연결 방식:

- `saju_interpretations.input_snapshot.featureSnapshotId`
- `saju_interpretations.structured_result.essence[].evidenceFactIds`
- 이후 필요해지면 `saju_interpretations.feature_snapshot_id` 외래키 컬럼을 추가한다.

## 8. 구현 순서

1. 실제 `chart_data` 구조 확인
2. 원본 데이터와 파생 특징 목록 매핑
3. `saju_feature_snapshots` SQL 확정 및 RLS 적용
4. `extractSajuFeatures()` 서버 함수 작성
5. 동일 입력의 특징 해시 및 버전 검증
6. 사주총평 API 호출 전에 특징 스냅샷 조회 또는 생성
7. Gemini에 원본 전체가 아니라 검증된 특징과 필요한 대운 근거 전달
8. Gemini의 `evidenceFactIds` 검증
9. 풀이와 근거를 `saju_interpretations`에 함께 저장
10. 여러 사주 샘플로 회귀 테스트

## 9. 자체 풀이 엔진으로 가는 단계

### 1단계: 현재

자체 만세력 → Gemini 풀이 → DB 캐시

### 2단계: 다음

자체 만세력 → 자체 특징 추출 → Gemini 문장화 → 근거와 결과 저장

### 3단계

자체 만세력 → 자체 특징 추출 → 검수된 명리 규칙 선택 → Gemini 문장화

### 4단계: 목표

자체 만세력 → 자체 특징 추출 → 자체 규칙 엔진 → 검수된 풀이 블록 조립

Gemini 결과를 그대로 정답 데이터로 사용하지 않는다. 전문가 검수 후 `approved` 또는 `corrected`로 판정된 익명 데이터만 자체 엔진 개선 자료로 사용한다.

## 10. 새 대화에서 이어가는 방법

새 채팅에서 이 파일을 첨부하고 다음과 같이 요청한다.

> 운세인사이트 프로젝트 작업기록을 기준으로 이전 작업을 이어서 진행해 주세요. 현재 다음 작업은 `saju_feature_snapshots` 설계이며, 첨부한 만세력 계산 코드와 `chart_data` 구조를 먼저 확인해 주세요.

