# Migration: useState → react-hook-form

RoomBookingPage의 7개 `useState` + 수동 검증 로직을 `react-hook-form` + `zod`로 마이그레이션한 과정과 의사결정을 정리한다.

---

## 1. Before / After 구조 비교

### Before (main 브랜치)

```
RoomBookingPage (594줄, 단일 파일)
├── 상태: 7개 useState (date, startTime, endTime, attendees, equipment, preferredFloor, selectedRoomId, errorMessage)
├── URL 동기화: useEffect + setSearchParams 직접 호출
├── 검증: 렌더링마다 validationError 재계산 + handleBook 내 수동 if문
├── 필터 초기화: handleFilterChange로 selectedRoomId, errorMessage 수동 리셋
└── 제출: handleBook에서 수동 검증 → mutateAsync
```

### After (feature 브랜치)

```
useBookingForm.ts (새 파일, 63줄)
├── 스키마: BookingFormSchema (zod)
├── 상태: useForm (react-hook-form이 내부 관리)
├── URL 동기화: form.watch + router.replace
└── 필터 초기화: watch 콜백 내 roomId 리셋

RoomBookingPage (457줄)
├── 검증: zod schema + UI 레벨 실시간 검증 병행
├── 제출: handleSubmit(onSubmit) — zod가 검증 후 통과된 data만 전달
└── 에러: errors.root / errors.roomId (react-hook-form 에러 객체)
```

**핵심 변화**: 594줄 단일 파일 → 63줄 + 457줄 (총 520줄, 구조 분리)

---

## 2. 의사결정 기록

### 2-1. 왜 react-hook-form을 도입했는가

| 문제 | 원본 코드 | react-hook-form |
|------|-----------|-----------------|
| 상태 7개가 컴포넌트에 흩어져 있음 | `useState` × 7 | `useForm` 하나로 통합 |
| 값 변경마다 수동으로 `handleFilterChange` 호출 필요 | 깜빡하면 버그 | `watch` 콜백으로 자동 처리 |
| 검증 로직이 두 곳에 분산 (렌더 시점 + handleBook) | 실수 여지 큼 | zod schema 한 곳에 선언 |
| URL 동기화 useEffect의 deps가 6개 | 변경 빠뜨리기 쉬움 | `form.watch`로 모든 변경 감지 |

### 2-2. Controller vs register — "폼 안에서는 string" 원칙

`floor`(선호 층)의 타입을 `z.coerce.number().nullable()`로 하면 `<Select>`의 string 값과 불일치하여 `Controller`가 필요해진다. 대신 `z.string().optional()`로 정의하고, **사용 시점에서만 `Number()` 변환**하는 전략을 택했다.

```ts
// 스키마: string으로 정의
floor: z.string().optional()

// JSX: register 한 줄
<Select {...register('floor')} aria-label="선호 층">

// 사용 시점: 필요할 때만 변환
if (preferredFloor && room.floor !== Number(preferredFloor)) return false;
```

→ 상세 근거는 `docs/react-hook-form-tips.md` 참고.

### 2-3. Zod schema의 `.min(1)` 들은 어디서 온 것인가

원본 코드의 수동 검증을 schema로 **1:1 대응**시킨 것이다.

| schema | 원본 검증 |
|--------|-----------|
| `date: z.string().min(1)` | 기본값이 항상 오늘 날짜라 검증 없었음 (방어적 추가) |
| `startTime: z.string().min(1)` | `handleBook` 내 `if (!startTime)` |
| `endTime: z.string().min(1)` | `handleBook` 내 `if (!endTime)` |
| `attendees: z.coerce.number().min(1)` | `if (attendees < 1)` + `Math.max(1, ...)` |
| `roomId: z.string().min(1)` | `handleBook` 내 `if (!selectedRoomId)` |

`z.string().min(1)`은 "빈 문자열이 아닌지" 확인하는 zod 관용 표현이다. `z.string()`만으로는 `""`도 통과하기 때문.

### 2-4. 검증 타이밍 변화

| | 원본 | 현재 |
|---|---|---|
| 시간 역전 | 렌더마다 `validationError` 계산 (실시간) | UI 레벨 `watch` 기반 실시간 + schema `refine` (submit 시) |
| 빈 필드 | `handleBook`에서 수동 if문 (submit 시) | schema `.min(1)` (submit 시) |
| 인원 < 1 | `Math.max(1, ...)` (onChange 시 즉시 보정) + `validationError` (렌더 시) | HTML `min={1}` (브라우저 레벨) + schema `.min(1)` (submit 시) |

**참석 인원**의 경우, 원본은 onChange에서 `Math.max(1, ...)`로 값 자체를 강제 보정했지만 현재는 HTML `min` 속성에 의존한다. HTML `min`은 스피너 화살표 클릭에는 동작하지만, 직접 타이핑으로 `0`이나 음수를 입력하는 것까지는 막지 않는다. 다만 submit 시 schema에서 잡히므로 실질적 문제는 없다.

---

## 3. refine vs superRefine vs pipe

### 3-1. `.refine()` — 현재 사용 중

```ts
z.object({ ... })
  .refine(data => data.endTime > data.startTime, {
    message: '종료 시간은 시작 시간보다 늦어야 합니다.',
    path: ['endTime'],
  });
```

**특성**: `.object()` 단계의 모든 필드가 통과해야 실행된다.

**장점**: 단순하고 읽기 쉽다. 필드 간 비교 검증에 적합.

**한계**: `.object()` 내 어떤 필드라도 실패하면 refine은 스킵된다. 예를 들어 `roomId`가 빈 문자열이면 `.min(1)`에서 실패 → refine 미실행 → 시간 역전 에러가 표시되지 않음.

**현재 코드에서 괜찮은 이유**: 시간 역전 검증을 UI 레벨에서 별도로 처리하고 있다.

```ts
// index.tsx — schema refine에 의존하지 않는 실시간 검증
const hasTimeInputs = startTime !== '' && endTime !== '';
const timeValidationError = hasTimeInputs && endTime <= startTime
  ? errors.endTime?.message
  : null;
```

단, 이 코드는 `errors.endTime?.message`를 읽는데 refine이 스킵되면 `errors.endTime` 자체가 없어서 `null`이 된다. 현재 UI 흐름상 roomId가 비어있으면 submit 버튼이 보이지 않으므로 (`isFilterComplete` 게이팅) 실제 문제가 되진 않는다.

### 3-2. `.superRefine()` — 독립적 검증이 필요할 때

```ts
z.object({ ... })
  .superRefine((data, ctx) => {
    if (data.endTime <= data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '종료 시간은 시작 시간보다 늦어야 합니다.',
        path: ['endTime'],
      });
    }
    if (data.roomId === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '회의실을 선택해주세요.',
        path: ['roomId'],
      });
    }
  });
```

**특성**: `.object()` 통과 후 **여러 에러를 동시에** 추가할 수 있다. `refine`은 boolean 하나만 반환하지만, `superRefine`은 `ctx.addIssue()`를 원하는 만큼 호출 가능.

**하지만**: `.object()` 단계가 실패하면 역시 실행되지 않는다는 점은 `refine`과 동일하다.

### 3-3. `.pipe()` — object 실패와 무관하게 실행하고 싶을 때

```ts
// 1단계: 느슨한 파싱 (실패해도 2단계로 넘어감)
const Step1 = z.object({
  startTime: z.string(),
  endTime: z.string(),
  roomId: z.string(),
  // ...
});

// 2단계: 엄격한 검증
const BookingFormSchema = Step1.pipe(
  z.object({
    startTime: z.string().min(1, '시작 시간을 선택해주세요.'),
    endTime: z.string().min(1, '종료 시간을 선택해주세요.'),
    roomId: z.string().min(1, '회의실을 선택해주세요.'),
    // ...
  }).refine(data => data.endTime > data.startTime, {
    message: '종료 시간은 시작 시간보다 늦어야 합니다.',
    path: ['endTime'],
  })
);
```

**특성**: 파싱을 여러 단계로 나눈다. 하지만 `pipe`는 1단계가 성공해야 2단계로 넘어가므로, 실제로는 "object 실패에도 refine 실행"이라는 목적에는 맞지 않다.

### 3-4. 정리: 언제 무엇을 쓰는가

| 도구 | 언제 | 예시 |
|------|------|------|
| `.refine()` | 필드 간 단일 비교. 모든 필드가 유효하다는 전제 하에 추가 조건 검사 | `endTime > startTime` |
| `.superRefine()` | 필드 간 비교가 여러 개이거나, 조건부로 다른 에러를 내야 할 때 | 복수의 cross-field 검증을 한 번에 |
| `.pipe()` | 파싱 결과의 타입을 변환한 뒤 추가 검증을 적용할 때 | `z.string().pipe(z.coerce.date())` |
| UI 레벨 검증 | schema 검증과 무관하게 실시간 피드백이 필요할 때 | 시간 역전 즉시 경고 표시 |

---

## 4. 현재 코드의 검증 흐름 요약

```
사용자 입력
  │
  ├─ [실시간] watch 기반 UI 검증
  │   └─ endTime <= startTime → timeValidationError 표시
  │   └─ isFilterComplete = false → 회의실 목록/submit 버튼 숨김
  │
  └─ [submit 시] zod schema 검증
      ├─ .object() 단계: 각 필드 개별 검증 (.min(1) 등)
      │   └─ 실패 → errors.startTime, errors.roomId 등 표시
      └─ .refine() 단계: endTime > startTime
          └─ .object() 통과 후에만 실행
          └─ 실패 → errors.endTime 표시

→ 실시간 검증이 1차 방어선, schema가 2차 방어선.
→ refine 스킵 가능성은 UI 흐름(isFilterComplete 게이팅)이 보완.
```

---

## 5. 알려진 한계 / 개선 가능 포인트

| 항목 | 현황 | 심각도 | 비고 |
|------|------|--------|------|
| refine 스킵 시 시간 에러 미표시 | UI 흐름상 도달 불가 | 낮음 | `isFilterComplete`가 방어 |
| 참석 인원 직접 타이핑으로 0 입력 가능 | submit 시 잡힘 | 낮음 | 원본은 onChange에서 즉시 보정했음 |
| `date`의 `.min(1)` | 기본값이 항상 존재하여 dead code에 가까움 | 없음 | 방어적 코드, 해 없음 |
| `timeValidationError`가 `errors.endTime?.message`에 의존 | refine 스킵 시 undefined | 낮음 | 직접 문자열로 대체하면 해결 가능 |
