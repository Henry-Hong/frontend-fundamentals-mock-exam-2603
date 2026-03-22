import { css, SerializedStyles } from '@emotion/react';
import { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react';

type RadioInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'css'> & {
  children: ReactNode;
  css?: SerializedStyles;
};

const RadioInput = forwardRef<HTMLInputElement, RadioInputProps>(
  ({ children, className, 'aria-label': ariaLabel, ...inputProps }, ref) => (
    <label className={className} aria-label={ariaLabel}>
      <input
        ref={ref}
        type="radio"
        {...inputProps}
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
      {children}
    </label>
  )
);

RadioInput.displayName = 'RadioInput';

export default RadioInput;
