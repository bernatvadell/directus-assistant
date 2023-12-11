<template>
    <div class="chat-bar">
        <input type="text" ref="textInput" v-model="content" placeholder="Write a message" @keydown="onKeyDown($event)"
            :disabled="disabled" />
        <v-icon clickable name="send" @click="emitSendMessage()" :disabled="disabled" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
    disabled: Boolean
});

interface Emits {
    (event: 'sendMessage', message: string): void;
}

const emit: Emits = defineEmits<Emits>();
const textInput = ref<HTMLInputElement | null>(null);
const content = ref('');

watch(() => props.disabled, async (newVal) => {
    if (!newVal) {
        await nextTick();
        textInput.value?.focus();
    }
});

async function emitSendMessage() {
    if (props.disabled) return;
    emit('sendMessage', content.value);
    content.value = '';
}

function onKeyDown(e: KeyboardEvent) {
    if (props.disabled) return;
    if (e.code === 'Enter') {
        e.preventDefault();
        emitSendMessage();
    }
}
</script>

<style scoped>
.chat-bar {
    display: flex;
    border-top: 1px solid #222222;
    padding: 1rem 1.5rem;
}

input {
    border: none;
    background: none;
    flex: 1;
}
</style>