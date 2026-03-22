import { css } from '@emotion/react';
import { Suspense, useEffect, useState } from 'react';
import { Top, Spacing, Border, Button, Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import DateInput from 'components/DateInput';
import { format } from 'date-fns';
import { LoadingFallback } from '../../components/LoadingFallback';
import { MyReservationList } from './MyReservationList';
import { ReservationTableContainer } from './ReservationTableContainer';
import { useTypedRouter } from 'hooks/useTypedRouter';
import { useTypedSearchParams } from 'hooks/useTypedSearchParams';

export function ReservationStatusPage() {
  const router = useTypedRouter();
  const searchParams = useTypedSearchParams('/');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    searchParams.message ? { type: 'success', text: searchParams.message } : null
  );

  /**
   * Question:
   * 다른 페이지에서 넘어온 스테이트에서 메시지가 있을 경우, "한번만" 보여준다는 코드 같은데,
   * useEffect만 봤었을땐, 그런 의도가 잘 느껴지진 않는다
   */
  useEffect(() => {
    if (searchParams.message) {
      router.replace('/');
    }
  }, [searchParams.message, router]);

  return (
    <div
      css={css`
        background: ${colors.white};
        padding-bottom: 40px;
      `}
    >
      <Top.Top03
        css={css`
          padding-left: 24px;
          padding-right: 24px;
        `}
      >
        회의실 예약
      </Top.Top03>

      <Spacing size={24} />

      {/* 날짜 선택 */}
      <div
        css={css`
          padding: 0 24px;
        `}
      >
        <Text typography="t5" fontWeight="bold" color={colors.grey900}>
          날짜 선택
        </Text>
        <Spacing size={16} />
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: 6px;
          `}
        >
          <DateInput
            value={date}
            min={format(new Date(), 'yyyy-MM-dd')}
            onChange={e => setDate(e.target.value)}
            aria-label="날짜"
          />
        </div>
      </div>

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {/* 예약 현황 타임라인 */}
      <div
        css={css`
          padding: 0 24px;
        `}
      >
        <Text typography="t5" fontWeight="bold" color={colors.grey900}>
          예약 현황
        </Text>
        <Spacing size={16} />

        <Suspense fallback={<LoadingFallback text="예약 현황을 불러오는 중입니다..." />}>
          <div
            css={css`
              background: ${colors.grey50};
              border-radius: 14px;
              padding: 16px;
            `}
          >
            <ReservationTableContainer date={date} />
          </div>
        </Suspense>
      </div>

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {/* 메시지 배너 */}
      {message && (
        <div
          css={css`
            padding: 0 24px;
          `}
        >
          <div
            css={css`
              padding: 10px 14px;
              border-radius: 10px;
              background: ${message.type === 'success' ? colors.blue50 : colors.red50};
              display: flex;
              align-items: center;
              gap: 8px;
            `}
          >
            <Text
              typography="t7"
              fontWeight="medium"
              color={message.type === 'success' ? colors.blue600 : colors.red500}
            >
              {message.text}
            </Text>
          </div>
          <Spacing size={12} />
        </div>
      )}

      {/* 내 예약 목록 */}
      <div
        css={css`
          padding: 0 24px;
        `}
      >
        <Suspense fallback={<LoadingFallback text="내 예약 목록을 불러오는 중입니다..." />}>
          <MyReservationList
            onCancel={isSuccess => {
              if (isSuccess) {
                setMessage({ type: 'success', text: '예약이 취소되었습니다.' });
              } else {
                setMessage({ type: 'error', text: '취소에 실패했습니다.' });
              }
            }}
          />
        </Suspense>
      </div>

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {/* 예약하기 버튼 */}
      <div
        css={css`
          padding: 0 24px;
        `}
      >
        <Button display="full" onClick={() => router.push('/booking')}>
          예약하기
        </Button>
      </div>
      <Spacing size={24} />
    </div>
  );
}
