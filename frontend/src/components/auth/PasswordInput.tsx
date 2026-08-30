'use client';

import React, { useState } from 'react';
import {
  TextField,
  IconButton,
  InputAdornment,
  Alert,
  TextFieldProps,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export interface PasswordInputProps extends Omit<TextFieldProps, 'type'> {
  label?: string;
  error?: boolean;
  helperText?: React.ReactNode;
  autoComplete?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label = 'Password',
  error,
  helperText,
  disabled,
  autoComplete = 'current-password',
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

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleMouseDownPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
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
        autoComplete={autoComplete}
        onKeyDown={handleKeyDown}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                edge="end"
                size="small"
                sx={{
                  color: 'text.secondary',
                  minWidth: 40,
                  minHeight: 40,
                }}
              >
                {showPassword ? (
                  <VisibilityOffOutlinedIcon fontSize="small" />
                ) : (
                  <VisibilityOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </InputAdornment>
          ),
          ...props.InputProps,
        }}
      />
    </>
  );
};

export default PasswordInput;
