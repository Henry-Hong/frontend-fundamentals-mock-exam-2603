import { css } from '@emotion/react';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Text } from '_tosslib/components';
import { colors } from '../../_tosslib/constants/colors';
import { Reservation } from '../../_tosslib/server/types';
import { EQUIPMENT_LABELS } from './consts';

/**
 * Thoughts.
 * 추상화 근거:
 * 1. 스타일 코드등으로 인해 스크롤이 길어지고, Header나 Body 코드가 멀어짐 -> 첫 코드를 보고 "이게 예약 테이블인가?"를 알기 어려웠음
 * 2. "예약" 서비스인데, 예약 현황을 보여주는 UI는 핵심이라고 생각함 -> "예약 테이블"UI 는 핵심컴포넌트로서, 자주 사용/수정될 것이라고 생각함
 * 3. from/to, activeId를 Context로 공유하여 props 중복 전달을 제거하고, 테이블 전체에서 하나의 툴팁만 활성화되도록 보장
 */

type ReservationTableContextValue = {
  from: number;
  to: number;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
};

const Root = ({ from = 9, to = 20, children }: { from?: number; to?: number; children: ReactNode }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <ReservationTableContext.Provider value={{ from, to, activeId, setActiveId }}>
      {children}
    </ReservationTableContext.Provider>
  );
};

const Header = ({ render }: { render?: (hour: number) => ReactNode }) => {
  const { from, to } = useReservationTable();
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

/**
 * Thoughts.
 * 추상화 근거:
 * 1. 회의실별 Row 렌더링 로직(라벨 + 타임라인 바 + 툴팁)이 반복되며 index.tsx를 비대하게 만듦
 * 2. Row는 Header와 동일한 from/to 타임라인 범위를 공유하므로, 같은 컴포넌트 그룹으로 응집시킴
 */
function timeToMinutes(time: string, timelineStart: number): number {
  const [h, m] = time.split(':').map(Number);
  return (h - timelineStart) * 60 + m;
}

const Row = ({ label, reservations }: { label: string; reservations: Reservation[] }) => {
  const { from, to, activeId, setActiveId } = useReservationTable();
  const totalMinutes = (to - from) * 60;

  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        height: 32px;
      `}
    >
      <div
        css={css`
          width: 80px;
          flex-shrink: 0;
          padding-right: 8px;
        `}
      >
        <Text
          typography="t7"
          fontWeight="medium"
          color={colors.grey700}
          ellipsisAfterLines={1}
          css={css`
            font-size: 12px;
          `}
        >
          {label}
        </Text>
      </div>
      <div
        css={css`
          flex: 1;
          height: 24px;
          background: ${colors.white};
          border-radius: 6px;
          position: relative;
          overflow: visible;
        `}
      >
        {reservations.map(reservation => {
          const left = (timeToMinutes(reservation.start, from) / totalMinutes) * 100;
          const width =
            ((timeToMinutes(reservation.end, from) - timeToMinutes(reservation.start, from)) / totalMinutes) * 100;
          const isActive = activeId === reservation.id;

          return (
            <div
              key={reservation.id}
              css={css`
                position: absolute;
                left: ${left}%;
                width: ${width}%;
                height: 100%;
              `}
            >
              <div
                role="button"
                aria-label={`${label} ${reservation.start}-${reservation.end} 예약 상세`}
                onClick={() => setActiveId(isActive ? null : reservation.id)}
                css={css`
                  width: 100%;
                  height: 100%;
                  background: ${colors.blue400};
                  border-radius: 4px;
                  opacity: ${isActive ? 1 : 0.75};
                  cursor: pointer;
                  transition: opacity 0.15s;
                  &:hover {
                    opacity: 1;
                  }
                `}
              />
              {isActive && (
                <div
                  role="tooltip"
                  css={css`
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    margin-top: 6px;
                    background: ${colors.grey900};
                    color: ${colors.white};
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    white-space: nowrap;
                    z-index: 10;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
                    line-height: 1.6;
                  `}
                >
                  <div>
                    {reservation.start} ~ {reservation.end}
                  </div>
                  <div>{reservation.attendees}명</div>
                  {reservation.equipment.length > 0 && (
                    <div>{reservation.equipment.map(e => EQUIPMENT_LABELS[e]).join(', ')}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ReservationTableContext = createContext<ReservationTableContextValue | null>(null);

function useReservationTable() {
  const ctx = useContext(ReservationTableContext);
  if (ctx === null) {
    throw new Error('ReservationTable.Header/Row must be used within ReservationTable.Root');
  }
  return ctx;
}

export const ReservationTable = Object.assign(
  {},
  {
    Root,
    Header,
    Row,
  }
);
