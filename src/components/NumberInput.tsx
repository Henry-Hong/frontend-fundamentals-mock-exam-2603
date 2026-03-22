import { css } from '@emotion/react';
import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { colors } from '_tosslib/constants/colors';

type NumberInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'>;

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>((props, ref) => (
  <input
    ref={ref}
    type="number"
    {...props}
    css={css`
      box-sizing: border-box;
      font-size: 16px;
      font-weight: 500;
      line-height: 1.5;
      height: 48px;
      background-color: ${colors.grey50};
      border-radius: 12px;
      color: ${colors.grey800};
      width: 100%;
      border: 1px solid ${colors.grey200};
      padding: 0 16px;
      outline: none;
      transition: border-color 0.15s;
      &:focus {
        border-color: ${colors.blue500};
      }
    `}
  />
));

NumberInput.displayName = 'NumberInput';

export default NumberInput;
