<script setup>
import { ref } from 'vue';

defineProps({
  modelValue: {
    type: String,
    required: true
  }
});
const emit = defineEmits(['update:modelValue']);

const el = ref(null);
const input = ({ target }) => {
  // eslint-disable-next-line no-param-reassign
  target.value = target.value.toLowerCase().replace(/[^a-z]/g, '');
  target.setCustomValidity('');
  emit('update:modelValue', target.value);
};
const setCustomValidity = (message) => { el.value.setCustomValidity(message); };
const reportValidity = () => { el.value.reportValidity(); };
const focus = () => { el.value.focus(); };

defineExpose({ setCustomValidity, reportValidity, focus });
</script>

<template>
  <input ref="el" class="form-control input-letters" :value="modelValue"
    autocomplete="off" @input="input">
</template>
