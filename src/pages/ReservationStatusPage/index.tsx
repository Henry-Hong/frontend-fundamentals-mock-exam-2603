import { css } from '@emotion/react';
import { useLocation } from 'react-router-dom';
import { Suspense, useEffect, useMemo, useState } from 'react';
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
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [message, setMessage] = useMessageFromSearchParams();
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
        {/* 고민 : date 랑 setDate가 선언부랑 너무 떨어져있지 않나?
          
          떨어져 있는 이유 : 상단의 컴포넌트 코드들
          그렇다면, 이거 컴포넌트화 한다음, 내부에서 처리 해도 좋지 않을까? 

          근데 그러면 결국 날짜 정보를 예약현황 페이지컴포넌트에서 제거한다는건데,,, 그러면 ReservationTable 에서 사용하는걸 알기 어려워 지잖아
          props 라는게 어쩌면 어떤것에 의존하는지를 명확하게 보여주는 단서이기 때문에, 좋지아니한가

          나는 그럼 결국 date state 를 강조하고 싶은건데, 눈에 띄는 다른 코드들이 보인다 예를들어 router, searchParams, useEffect, message 등

          얘네들을 없애는게 관건이 될듯
          */}
        <DateInput
          value={date}
          min={format(new Date(), 'yyyy-MM-dd')}
          onChange={e => setDate(e.target.value)}
          aria-label="날짜"
        />
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
          <ReservationTableContainer date={date} />
        </Suspense>
      </div>

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {/* 메시지 배너 */}
      {message && <MessageBanner message={message} />}

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
      <BookingButton />

      <Spacing size={24} />
    </div>
  );
}

/**
 * useMessage 라는 커스텀 훅을 만들어 볼까?
 * - 단순한 추출이 되지 않으려면.. 어떻게 해야할까
 * - 첫번째로 고려할건 "재사용성"인것 같다.
 *
 * 아니 그전에 왜 useMessage 라는 커스텀 훅을 만들어보고 싶어한걸까?
 * - 첫번째로, searchParameter에서 받아온 값을 처리하는 로직이 복잡함
 * - 두번째로, 그다음에 replace 하는 로직이 복잡함
 * 이정도?
 *
 * 근데 이렇게 하면..
 * 1. searchParameter로 모두 처리한다고 오해하지않을까?
 * - searchParams 쓰는건 알겠는데; setMessage 하면 searchParameter 도 바뀌는걸로 이해하지 않을까?
 * - 싀바 어렵네;
 * - 그러면 이대로면,,
 *
 * 2. message / setMessage가 정의한곳과 소비한곳이 멀어지는것 같다?
 */

const useMessageFromSearchParams = () => {
  const location = useLocation();
  const router = useTypedRouter();
  const _message = new URLSearchParams(location.search).get('message');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    _message ? { type: 'success', text: _message } : null
  );

  useEffect(() => {
    if (message) {
      router.replace('/');
    }
  }, [location.search, router]);

  return useMemo(() => [message, setMessage] as const, [message, setMessage]);
};

/**
 * BookingButton만 쓰면, 무조건 예약하기 가능
 * 이건 단순 추출이 아님
 * 모든 예약은 BookingPage 에서 이뤄짐
 * 개발자 입장에서는 BookingButton만 사용하면됨
 */
const BookingButton = () => {
  const router = useTypedRouter();
  return (
    <div
      css={css`
        padding: 0 24px;
      `}
    >
      <Button display="full" onClick={() => router.push('/booking')}>
        예약하기
      </Button>
    </div>
  );
};

const MessageBanner = ({ message }: { message: { type: 'success' | 'error'; text: string } }) => {
  return (
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
        <Text typography="t7" fontWeight="medium" color={message.type === 'success' ? colors.blue600 : colors.red500}>
          {message.text}
        </Text>
      </div>
      <Spacing size={12} />
    </div>
  );
};
