'use client';

import React, { useState, useEffect } from 'react';
import { Button, Tooltip, Typography, Stack } from '@mui/material';
import { Mic, MicOff } from '@mui/icons-material';

interface SpeechToTextButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const SpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({ onTranscript, disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = true;
        reco.interimResults = true;
        reco.lang = 'en-US';

        reco.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            onTranscript(currentTranscript);
          }
        };

        reco.onerror = (err: any) => {
          console.error('Speech recognition error', err);
          setIsListening(false);
        };

        reco.onend = () => {
          setIsListening(false);
        };

        setRecognition(reco);
      } else {
        setSupported(false);
      }
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  if (!supported) {
    return (
      <Tooltip title="Web Speech API is not supported in this browser. Please type your response directly below.">
        <span>
          <Button variant="outlined" disabled startIcon={<MicOff />} sx={{ borderRadius: 2.5, textTransform: 'none' }}>
            Speech Input Unavailable
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="contained"
      onClick={toggleListening}
      disabled={disabled}
      startIcon={isListening ? <MicOff /> : <Mic />}
      sx={{
        background: isListening ? '#EF4444' : 'rgba(59, 130, 246, 0.2)',
        color: isListening ? '#fff' : '#60A5FA',
        border: isListening ? 'none' : '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: 2.5,
        fontWeight: 600,
        textTransform: 'none',
        px: 2.5,
        '&:hover': {
          background: isListening ? '#DC2626' : 'rgba(59, 130, 246, 0.3)',
        },
      }}
    >
      {isListening ? 'Stop Recording' : 'Voice Input (Mic)'}
    </Button>
  );
};
