<template>
  <p
    :style="{
      color: props.mode === 'timer' && time.value <= 10 ? (isRed.value ? 'red' : 'white') : '#fff',
      fontSize: '20px',
      fontWeight: '500',
    }"
  >
    {{ formattedTime }}
  </p>
 </template>
 
 <script setup>
 import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
 
 const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['timer', 'countdown'].includes(value),
  },
 });
 
 const time = ref(props.mode === 'timer' ? 180 : 0);
 const isRed = ref(false);
 let interval = null;
 let blinkInterval = null;
 
 const formattedTime = computed(() => {
  const hrs = String(Math.floor(time.value / 3600)).padStart(2, '0');
  const mins = String(Math.floor((time.value % 3600) / 60)).padStart(2, '0');
  const secs = String(time.value % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
 });
 
 watch(time, (newTime) => {
  if (props.mode === 'timer' && newTime <= 10 && newTime > 0) {
    if (!blinkInterval) {
      blinkInterval = setInterval(() => {
        isRed.value = !isRed.value;
      }, 500);
    }
  } else if (newTime === 0 || newTime > 10) {
    clearInterval(blinkInterval);
    blinkInterval = null;
    isRed.value = false;
  }
 });
 
 onMounted(() => {
  interval = setInterval(() => {
    if (props.mode === 'timer') {
      if (time.value > 0) {
        time.value--;
      } else {
        clearInterval(interval);
      }
    } else if (props.mode === 'countdown') {
      time.value++;
    }
  }, 1000);
 });
 
 onBeforeUnmount(() => {
  clearInterval(interval);
  clearInterval(blinkInterval);
 });
 </script>