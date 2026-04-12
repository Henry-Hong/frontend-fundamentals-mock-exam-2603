# react-hook-form: Controller 없이 register로 통일하기

## 핵심 원칙

HTML 폼 요소는 기본적으로 **string**을 다룬다.
`register`도 string 기반으로 동작한다.
폼 스키마의 타입을 **HTML 요소의 자연스러운 타입에 맞추면** `Controller` 없이 `register`만으로 충분하다.

## Controller가 필요해지는 순간

폼 필드의 타입이 HTML 요소의 타입과 **불일치**할 때 `Controller`가 필요해진다.

```typescript
// 스키마에서 number | null 로 정의하면
floor: z.coerce.number().nullable()

// <Select>의 value는 string이므로 변환이 필요
// → Controller로 "" ↔ null, "3" ↔ 3 양방향 변환을 직접 작성해야 함
<Controller
  name="floor"
  control={control}
  render={({ field }) => (
    <Select
      value={field.value ?? ''}
      onChange={e => {
        const val = e.target.value;
        field.onChange(val === '' ? null : Number(val));  // 변환 로직
      }}
      onBlur={field.onBlur}
      ref={field.ref}
    >
      ...
    </Select>
  )}
/>
```

**23줄**의 코드가 필요하다.

## Controller를 없애는 방법

스키마 타입을 **string으로 맞추면** 변환이 사라진다.

```typescript
// string으로 정의
floor: z.string().optional()

// register 한 줄로 끝
<Select {...register('floor')} aria-label="선호 층">
  <option value="">전체</option>
  ...
</Select>
```

**1줄.** 끝.

실제로 number가 필요한 곳(필터링, API 호출 등)에서만 변환하면 된다:

```typescript
// 사용 시점에서 딱 한 번만 변환
if (preferredFloor && room.floor !== Number(preferredFloor)) return false;
```

## 판단 기준: 언제 string으로 두어도 되는가?

| 상황 | string으로 둬도 되는가 | 이유 |
|------|:---:|------|
| 서버에 보내지 않는 필터용 값 | O | 클라이언트에서만 사용, 필요할 때 변환 |
| 서버에 보내는 값이지만 API가 string을 받음 | O | 변환 자체가 불필요 |
| 서버에 number로 보내야 하는 값 | △ | 제출 시점에 변환하면 됨 |
| 복잡한 객체/배열을 다루는 커스텀 컴포넌트 | X | Controller가 적합 |

## 진짜 Controller가 필요한 경우

- 토글 버튼 그룹처럼 `<input>`, `<select>`가 아닌 **커스텀 UI**
- `string[]`, `object` 등 HTML 요소로 표현할 수 없는 타입
- 외부 라이브러리 컴포넌트 (DatePicker, Slider 등)

## 정리

1. HTML 폼 요소는 string을 다룬다
2. 스키마 타입을 string에 맞추면 `register`로 통일할 수 있다
3. 타입 변환은 **폼 바깥**(필터링, 제출 시점)에서 한 번만 하면 된다
4. `Controller`는 진짜 커스텀 UI에서만 쓴다

> **"폼 안에서는 string, 폼 밖에서 변환"**
