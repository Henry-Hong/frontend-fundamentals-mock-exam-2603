import { css } from '@emotion/react';
import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query';
import { Spacing, Button, Text, ListRow } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import { cancelReservation } from 'remotes/remotes';
import {
  myReservationListQueryOptions,
  MY_RESERVATIONS_QUERY_KEY,
  RESERVATIONS_QUERY_KEY,
  roomsQueryOptions,
} from './queryOptions';
import { Reservation } from '../../_tosslib/server/types';
import { EQUIPMENT_LABELS } from './consts';

export const MyReservationList = ({ onCancel }: { onCancel: (isSuccess: boolean) => void }) => {
  const queryClient = useQueryClient();

  // Question: MyReservationList인데 왜 rooms를 가져오는지 의구심이 들지 않을까?
  const [{ data: myReservationList }, { data: rooms }] = useSuspenseQueries({
    queries: [myReservationListQueryOptions(), roomsQueryOptions()],
  });

  const cancelMutation = useMutation((id: string) => cancelReservation(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(RESERVATIONS_QUERY_KEY);
      queryClient.invalidateQueries(MY_RESERVATIONS_QUERY_KEY);
    },
  });

  return (
    <>
      <div
        css={css`
          display: flex;
          align-items: baseline;
          gap: 6px;
        `}
      >
        <Text typography="t5" fontWeight="bold" color={colors.grey900}>
          내 예약
        </Text>
        {myReservationList.length > 0 && (
          <Text typography="t7" fontWeight="medium" color={colors.grey500}>
            {myReservationList.length}건
          </Text>
        )}
      </div>
      <Spacing size={16} />

      {myReservationList.length === 0 ? (
        <div
          css={css`
            padding: 40px 0;
            text-align: center;
            background: ${colors.grey50};
            border-radius: 14px;
          `}
        >
          <Text typography="t6" color={colors.grey500}>
            예약 내역이 없습니다.
          </Text>
        </div>
      ) : (
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: 10px;
          `}
        >
          {myReservationList.map(reservation => (
            <div
              key={reservation.id}
              css={css`
                padding: 14px 16px;
                border-radius: 14px;
                background: ${colors.grey50};
                border: 1px solid ${colors.grey200};
              `}
            >
              <ListRow
                contents={
                  <ListRow.Text2Rows
                    top={rooms.find(room => room.id === reservation.roomId)?.name ?? reservation.roomId}
                    bottom={getFullReservationDescription(reservation)}
                    topProps={{ typography: 't6', fontWeight: 'bold', color: colors.grey900 }}
                    bottomProps={{ typography: 't7', color: colors.grey600 }}
                  />
                }
                right={
                  <Button
                    disabled={cancelMutation.isPending}
                    type="danger"
                    style="weak"
                    size="small"
                    onClick={async e => {
                      e.stopPropagation();
                      if (window.confirm('정말 취소하시겠습니까?')) {
                        try {
                          await cancelMutation.mutateAsync(reservation.id);
                          onCancel(true);
                        } catch {
                          onCancel(false);
                        }
                      }
                    }}
                  >
                    취소
                  </Button>
                }
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/**
 * ex) 2026-03-10 09:00~10:00 · 5명 · TV
 * @param reservation
 * @returns
 */
const getFullReservationDescription = (reservation: Reservation) => {
  return `${reservation.date} ${reservation.start}~${reservation.end} · ${reservation.attendees}명 · ${
    reservation.equipment.map(equipment => EQUIPMENT_LABELS[equipment]).join(', ') || '장비 없음'
  }`;
};
