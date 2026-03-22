import { css } from '@emotion/react';
import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { colors } from '_tosslib/constants/colors';

type CheckboxInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & {
  label: string;
  selected?: boolean;
};

const CheckboxInput = forwardRef<HTMLInputElement, CheckboxInputProps>(({ label, selected, ...rest }, ref) => (
  <label
    css={css`
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid ${selected ? colors.blue500 : colors.grey200};
      background: ${selected ? colors.blue50 : colors.grey50};
      color: ${selected ? colors.blue600 : colors.grey700};
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      &:hover {
        border-color: ${selected ? colors.blue500 : colors.grey400};
      }
    `}
  >
    <input
      ref={ref}
      type="checkbox"
      {...rest}
      css={css`
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `}
    />
    {label}
  </label>
));

CheckboxInput.displayName = 'CheckboxInput';

export default CheckboxInput;
