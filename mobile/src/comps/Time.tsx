import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';

const TimerComponent = ({ mode }: { mode: 'timer' | 'countdown' }) => {
  // Initialize state: 180 seconds for timer mode, 0 seconds for countdown mode
  const [time, setTime] = useState(mode === 'timer' ? 180 : 0);
  const [isRed, setIsRed] = useState(false); // State to control blinking color

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (mode === 'timer') {
      // Timer mode: Decrease time every second
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 0) {
            // Stop the timer when it reaches 0
            clearInterval(interval);
            return 0;
          }
          return prevTime - 1; // Decrease time by 1 second
        });
      }, 1000);
    } else if (mode === 'countdown') {
      // Countdown mode: Increase time every second
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1); // Increase time by 1 second
      }, 1000);
    }

    // Cleanup interval on component unmount or mode change
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    if (mode === 'timer' && time <= 10 && time > 0) {
      // Blinking effect for the last 10 seconds
      const blinkInterval = setInterval(() => {
        setIsRed((prev) => !prev); // Toggle red state
      }, 500); // Change color every 500ms

      return () => clearInterval(blinkInterval); // Cleanup on unmount or time change
    }
  }, [time, mode]);

  // Format seconds into HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0'); // Calculate hours
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0'); // Calculate minutes
    const secs = (seconds % 60).toString().padStart(2, '0'); // Calculate seconds
    return `${hrs}:${mins}:${secs}`; // Combine into HH:MM:SS format
  };

  return (
    // Subtle line-like display for timer
    <Text
      style={[
        styles.timeText,
        mode === 'timer' && time <= 10 ? { color: isRed ? 'red' : 'white' } : null, // Apply blinking color
      ]}
    >
      {formatTime(time)}
    </Text>
  );
};

const styles = StyleSheet.create({
  timeText: {
    fontSize: 16, // Smaller font size for subtle appearance
    fontWeight: '500', // Medium weight text
    color: '#fff', // Default white text to blend with previous lines
  },
});

export default TimerComponent;
