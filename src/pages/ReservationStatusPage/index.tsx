import { css } from '@emotion/react';
import { Suspense, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Top, Spacing, Border, Button, Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import DateInput from 'components/DateInput';
import { format } from 'date-fns';
import { getRooms, getReservations } from 'remotes/remotes';
import { LoadingFallback } from '../../components/LoadingFallback';
import { EQUIPMENT_LABELS } from './consts';
import { MyReservationList } from './MyReservationList';
import { ReservationTable } from './ReservationTable';

const TIME_SLOTS: string[] = [];
for (let h = 9; h <= 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 20) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
  }
}

const HOUR_LABELS = TIME_SLOTS.filter(t => t.endsWith(':00'));
const TIMELINE_START = 9;
const TIMELINE_END = 20;
const TOTAL_MINUTES = (TIMELINE_END - TIMELINE_START) * 60;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h - TIMELINE_START) * 60 + m;
}

export function ReservationStatusPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const locationState = location.state as { message?: string } | null;
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    locationState?.message ? { type: 'success', text: locationState.message } : null
  );

  useEffect(() => {
    if (locationState?.message) {
      window.history.replaceState({}, '');
    }
  }, [locationState]);

  const { data: rooms = [] } = useQuery(['rooms'], getRooms);
  const { data: reservations = [] } = useQuery(['reservations', date], () => getReservations(date), {
    enabled: !!date,
  });

  const [activeReservation, setActiveReservation] = useState<string | null>(null);

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

        <div
          css={css`
            background: ${colors.grey50};
            border-radius: 14px;
            padding: 16px;
          `}
        >
          {/* 시간 헤더 */}
          <ReservationTable.Header from={TIMELINE_START} to={TIMELINE_END} />

          {/* 회의실별 타임라인 */}
          {rooms.map((room: { id: string; name: string }, index: number) => {
            const roomReservations = reservations.filter((r: { roomId: string }) => r.roomId === room.id);
            return (
              <div
                key={room.id}
                css={css`
                  display: flex;
                  align-items: center;
                  height: 32px;
                  ${index > 0 ? 'margin-top: 4px;' : ''}
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
                    {room.name}
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
                  {roomReservations.map(
                    (res: { id: string; start: string; end: string; attendees: number; equipment: string[] }) => {
                      const left = (timeToMinutes(res.start) / TOTAL_MINUTES) * 100;
                      const width = ((timeToMinutes(res.end) - timeToMinutes(res.start)) / TOTAL_MINUTES) * 100;
                      const isActive = activeReservation === res.id;
                      return (
                        <div
                          key={res.id}
                          css={css`
                            position: absolute;
                            left: ${left}%;
                            width: ${width}%;
                            height: 100%;
                          `}
                        >
                          <div
                            role="button"
                            aria-label={`${room.name} ${res.start}-${res.end} 예약 상세`}
                            onClick={() => setActiveReservation(isActive ? null : res.id)}
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
                                {res.start} ~ {res.end}
                              </div>
                              <div>{res.attendees}명</div>
                              {res.equipment.length > 0 && (
                                <div>{res.equipment.map((e: string) => EQUIPMENT_LABELS[e]).join(', ')}</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
        <Button display="full" onClick={() => navigate('/booking')}>
          예약하기
        </Button>
      </div>
      <Spacing size={24} />
    </div>
  );
}
