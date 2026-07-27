'use client';

import React, { useState } from 'react';
import {
  TextField,
  IconButton,
  InputAdornment,
  Alert,
  TextFieldProps,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export interface PasswordInputProps extends Omit<TextFieldProps, 'type'> {
  label?: string;
  error?: boolean;
  helperText?: React.ReactNode;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label = 'Password',
  error,
  helperText,
  disabled,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  return (
    <>
      {capsLockActive && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon fontSize="inherit" />}
          sx={{ mb: 1, py: 0.25, borderRadius: '8px', fontSize: '0.8rem' }}
        >
          Caps Lock is ON
        </Alert>
      )}
      <TextField
        {...props}
        label={label}
        type={showPassword ? 'text' : 'password'}
        fullWidth
        variant="outlined"
        error={error}
        helperText={helperText}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        InputProps={{
          ...props.InputProps,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword((prev) => !prev)}
                onMouseDown={(e) => e.preventDefault()}
                edge="end"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                size="small"
                disabled={disabled}
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </>
  );
};

export default PasswordInput;
