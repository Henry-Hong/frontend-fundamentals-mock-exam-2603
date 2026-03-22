import { css } from '@emotion/react';
import { Text } from '_tosslib/components';
import { colors } from '../../_tosslib/constants/colors';

/**
 * Thoughts.
 * 추상화 근거:
 * 1. 스타일 코드등으로 인해 스크롤이 길어지고, Header나 Body 코드가 멀어짐 -> 첫 코드를 보고 "이게 예약 테이블인가?"를 알기 어려웠음
 * 2. "예약" 서비스인데, 예약 현황을 보여주는 UI는 핵심이라고 생각함 -> "예약 테이블"UI 는 핵심컴포넌트로서, 자주 사용/수정될 것이라고 생각함
 */
const Header = ({
  from = 9,
  to = 20,
  render,
}: {
  from?: number;
  to?: number;
  render?: (hour: number) => React.ReactNode;
}) => {
  const hourColumns = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return (
    <div
      css={css`
        display: flex;
        align-items: flex-end;
        margin-bottom: 8px;
      `}
    >
      <div
        css={css`
          width: 80px;
          flex-shrink: 0;
          padding-right: 8px;
        `}
      />
      <div
        css={css`
          flex: 1;
          position: relative;
          height: 18px;
        `}
      >
        {hourColumns.map(hour => {
          const left = ((hour - from) / (to - from)) * 100;

          if (render) {
            return render(hour);
          }

          return (
            <Text
              key={hour}
              typography="t7"
              fontWeight="regular"
              color={colors.grey400}
              css={css`
                position: absolute;
                left: ${left}%;
                transform: translateX(-50%);
                font-size: 10px;
                letter-spacing: -0.3px;
              `}
            >
              {String(hour).padStart(2, '0')}
            </Text>
          );
        })}
      </div>
    </div>
  );
};

const Body = ({}) => {
  return <></>;
};

export const ReservationTable = Object.assign(
  {},
  {
    Header,
    Body,
  }
);
