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





여기서부터는 나와 챗지피티의 대화내용을 그대로 복사한것입니다


첨부 파일 분석이 끝났고, 실제 만세력 구조에 맞춘 1차 특징 스냅샷을 만들었습니다.

확인된 만세력 저장 구조

현재 chart-storage.ts는 다음 형태로 saju_charts.chart_data에 저장합니다.

chart_data
├─ schemaVersion
├─ engineVersion
├─ calculatedAt
├─ birthProfile
└─ chart

chart에는 이미 다음 값이 계산되어 있습니다.

사주 원국 4주
천간·지지 십성
지장간
12운성
납음
합·충·형·파·해 등의 관계
신살
공망
오행 개수
천을귀인
월령
전체 대운 및 대운별 신살

따라서 기존 만세력 테이블을 새로 만들 필요는 없습니다.

현재 자체 계산값으로 확인되지 않은 항목은 다음입니다.

신강·신약
격국
용신·희신·기신
가중치가 적용된 오행 점수

이 값들은 아직 DB의 확정된 계산값이 아니므로 1차 스냅샷에는 포함하지 않았습니다. 특히 현재 사주총평 Gemini 프롬프트에 있는 격국·용희신 부분은 다음 API 연결 작업에서 조정해야 합니다.

1단계 설치 파일

한꺼번에 받으려면 다음 압축파일을 사용하세요.

사주 특징 스냅샷 v1 ZIP

개별 파일:

Supabase 테이블 생성 SQL
명리 특징 추출기
갱신된 프로젝트 작업기록
적용 순서
1. Supabase SQL 실행

Supabase의 SQL Editor를 열고 다음 파일의 전체 내용을 한 번에 실행합니다.

20260819_create_saju_feature_snapshots.sql

정상 결과는 다음과 같이 나옵니다.

table_schema | table_name              | row_security
public       | saju_feature_snapshots  | true

이 SQL은 다음을 함께 설정합니다.

saju_feature_snapshots 테이블
중복 방지 제약조건
특징 버전 관리
원본 차트 해시
명리 근거 목록
검증 상태
사용자별 RLS 보안 정책
updated_at 자동 갱신

SQL만 실행한 직후 테이블 내용이 비어 있는 것은 정상입니다. 아직 사주총평 API와 연결하지 않았기 때문입니다.

2. 특징 추출기 저장

다운로드한 feature-snapshot.js를 다음 위치에 넣습니다.

app/lib/saju/feature-snapshot.js

이 파일은 서버 전용입니다. 클라이언트 컴포넌트에서는 불러오면 안 됩니다.

3. 기존 파일은 수정하지 않기

이번 단계에서는 첨부하신 다음 두 파일을 교체하거나 수정하지 않습니다.

app/api/saju/route.js
app/lib/saju/chart-storage.ts

두 파일은 현재 만세력 구조를 분석하기 위해 사용했습니다.

만들어진 특징 데이터

새 추출기는 다음과 같은 근거 ID를 생성합니다.

ORIGINAL_YEAR_PILLAR
ORIGINAL_MONTH_PILLAR
ORIGINAL_DAY_PILLAR
ORIGINAL_HOUR_PILLAR
ORIGINAL_DAY_MASTER
ORIGINAL_MONTH_COMMAND
ORIGINAL_OHAENG_COUNT
ORIGINAL_YEAR_GONGMANG
ORIGINAL_DAY_GONGMANG
ORIGINAL_CHEON_EUL
DAEUN_01
DAEUN_02
...

각 근거에는 다음이 포함됩니다.

{
  "factId": "ORIGINAL_DAY_MASTER",
  "label": "일간",
  "value": {
    "gan": "갑",
    "element": "木",
    "yinYang": "양"
  },
  "sourcePath": "chart.day.gan",
  "calculator": "saju-features-v1.0"
}

이렇게 하면 나중에 Gemini의 문장을 보면서 어떤 DB 계산값을 근거로 작성했는지 확인할 수 있습니다.

다음 작업

SQL 실행 결과가 정상인지 확인한 다음, 다음 단계에서 app/api/fortune/overview/route.js를 수정합니다.

다음 단계에서는:

saju_charts에서 만세력을 불러옵니다.
saju_feature_snapshots를 조회합니다.
없으면 feature-snapshot.js로 생성하여 저장합니다.
검증된 특징을 Gemini에 전달합니다.
Gemini가 반환한 evidenceFactIds를 검사합니다.
풀이 내용과 근거를 saju_interpretations에 함께 저장합니다.
기존 사주총평 1번도 근거 포함 방식으로 한 번 재생성합니다.

우선 SQL을 실행하고 결과 화면을 보내주시면, 그다음 사주총평 API 연결 파일을 만들어드리겠습니다.


지금 하는 작업은 왜하는건지 자세히 알려줄수잇나요?
네. 지금 하는 작업을 한 문장으로 설명하면:

Gemini가 작성한 사주풀이가 만세력의 어떤 계산값을 근거로 만들어졌는지 기록하는 작업입니다.

단순히 테이블을 하나 더 만드는 작업이 아니라, 나중에 Gemini 없이 자체 사주풀이 엔진을 만들기 위한 기반을 마련하는 것입니다.

현재 방식의 문제

현재 사주총평은 다음 순서입니다.

만세력 DB → 전체 데이터를 Gemini에 전달 → Gemini가 풀이 작성 → 문장만 DB 저장

예를 들어 Gemini가 다음과 같이 풀이했다고 하겠습니다.

책임감이 강하고 시간이 흐를수록 안정적인 성장을 이루는 사람입니다.

현재 DB에는 이 문장은 저장되지만, Gemini가 정확히 무엇을 보고 이런 말을 했는지는 알기 어렵습니다.

일간을 보고 판단했는지
월령을 보고 판단했는지
정관이나 인성을 보고 판단했는지
오행 분포를 보고 판단했는지
대운을 보고 판단했는지
혹은 만세력에 없는 내용을 추측했는지

이 구분이 되지 않습니다.

고객이 많아져서 풀이 문장이 수십만 건 쌓여도, 근거가 없다면 나중에 자체 엔진의 규칙으로 바꾸기가 매우 어렵습니다.

지금 만들고 있는 구조

앞으로는 만세력 원본과 최종 풀이 사이에 특징 스냅샷을 넣습니다.

만세력 원본
    ↓
명리 특징 스냅샷
    ↓
Gemini 사주풀이
    ↓
풀이 문장과 사용 근거 저장

각각의 역할은 다음과 같습니다.

데이터	역할
saju_charts	만세력 계산 원본
saju_feature_snapshots	풀이에 사용할 명리 특징과 근거
saju_interpretations	최종 사주풀이 문장
실제 예시
1. 기존 만세력 원본

현재 chart_data에는 다음과 같이 저장되어 있습니다.

{
  "day": {
    "gan": "갑",
    "ji": "자",
    "sipseong": "일간(나)"
  },
  "month": {
    "gan": "무",
    "ji": "인",
    "sipseong": "편재"
  },
  "ohaengCount": {
    "목": 2,
    "화": 1,
    "토": 3,
    "금": 1,
    "수": 1
  }
}

이것은 계산 결과이지만, 사람이 보거나 사주풀이에 사용하기 좋은 표준 구조는 아닙니다.

2. 특징 스냅샷으로 정리

feature-snapshot.js가 원본에서 다음과 같은 특징을 만듭니다.

{
  "factId": "ORIGINAL_DAY_MASTER",
  "label": "일간",
  "value": {
    "gan": "갑",
    "element": "木",
    "yinYang": "양"
  },
  "sourcePath": "chart.day.gan",
  "calculator": "saju-features-v1.0"
}

이 데이터가 뜻하는 것은 다음과 같습니다.

근거 이름: 일간
실제 값: 갑목
원본 위치: chart.day.gan
계산 버전: saju-features-v1.0

Gemini가 이 특징을 근거로 풀이했다면 결과에 다음 ID를 함께 반환하도록 합니다.

{
  "headline": "스스로 길을 만들며 성장하는 추진력을 지녔습니다.",
  "evidenceFactIds": [
    "ORIGINAL_DAY_MASTER",
    "ORIGINAL_MONTH_COMMAND",
    "ORIGINAL_OHAENG_COUNT"
  ]
}

그러면 나중에 이 문장이 어떤 만세력 결과에서 나왔는지 추적할 수 있습니다.

왜 지금 해야 하나요?

현재는 사주총평 1번을 만들고 있습니다. 앞으로 2번부터 12번까지 계속 Gemini 풀이를 생성하면 많은 문장이 DB에 쌓입니다.

근거 저장 구조 없이 먼저 12개를 모두 만들면:

기존 풀이를 다시 분석해야 함
어떤 명리 특징을 사용했는지 알기 어려움
Gemini가 추측한 내용을 사실과 구분하기 어려움
나중에 자체 엔진용 데이터로 사용하기 어려움
프롬프트를 수정할 때 이전 결과와 비교하기 어려움

반대로 지금 특징 스냅샷을 연결하면, 2번부터 생성되는 모든 풀이가 근거를 가진 데이터로 축적됩니다.

이미 만든 1번은 새로운 구조가 완성된 후 한 번만 다시 생성하면 됩니다.

자체 풀이 엔진과 어떻게 연결되나요?

초기에는 Gemini가 문장을 작성합니다.

명리 특징 → Gemini → 풀이 문장

고객 데이터와 전문가 검수가 충분히 쌓이면 다음과 같은 관계를 찾을 수 있습니다.

ORIGINAL_DAY_MASTER = 갑목
ORIGINAL_MONTH_COMMAND = 인월
특정 십성 조합 = 인성 강함
대운 관계 = 목·화 보완

그리고 전문가가 다음처럼 자체 규칙을 만들 수 있습니다.

갑목 일간이 인월에 태어나고,
인성이 적절하며 목·화 흐름이 연결되면
→ 성장 의지, 학습력, 확장성을 핵심 성향으로 해석한다.

이 규칙과 자체 작성 문장이 충분히 쌓이면 Gemini 없이 다음 흐름으로 작동합니다.

만세력
→ 특징 추출
→ 자체 명리 규칙 검색
→ 검수된 풀이 문장 선택
→ 최종 사주총평
이번 작업으로 당장 달라지는 것

사용자가 보는 사주총평 화면이 바로 달라지는 작업은 아닙니다.

이번 작업은 서버와 DB 내부에서 다음을 준비합니다.

만세력 풀이 근거 표준화
계산 버전 기록
같은 결과인지 확인하는 해시
근거 누락 여부 검증
Gemini가 사용한 근거 추적
자체 규칙 엔진용 데이터 축적
이번 작업으로 아직 하지 않는 것

다음 항목은 아직 계산하거나 확정하지 않습니다.

신강·신약
격국
용신·희신
재물운 좋고 나쁨
직업 적성 최종 판정

이 항목들은 명리학적 판단 규칙이 필요합니다. 지금 Gemini가 추측한 값을 DB의 확정된 사실처럼 저장하면 오히려 자체 엔진의 품질이 떨어질 수 있습니다.

따라서 현재는 논쟁이 적은 객관적 계산 결과부터 저장하고, 판단이 필요한 항목은 나중에 전문가 검수 규칙을 만든 뒤 추가합니다.

결론

지금 작업의 목적은 사주풀이를 하나 더 만드는 것이 아니라 다음을 준비하는 것입니다.

고객의 만세력 → 사용된 명리 근거 → 최종 풀이

이 연결고리를 DB에 남기는 것입니다.

이 구조가 없으면 고객 데이터가 많이 쌓여도 단순한 Gemini 문장 모음에 가깝습니다. 이 구조가 있으면 같은 데이터가 향후 자체 사주풀이 규칙을 만들 수 있는 검증 가능한 자산으로 남습니다.