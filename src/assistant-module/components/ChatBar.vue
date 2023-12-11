<template>
    <div class="chat-bar">
        <textarea class="message-input" :rows="inputRows" ref="textInput" v-model="content" placeholder="Write a message"
            @keydown="onKeyDown($event)" :disabled="disabled" />
        <button class="btn-send" @click="emitSendMessage()" :disabled="disabled">
            <v-icon name="send" />
        </button>
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
const inputRows = ref(1);

watch(() => props.disabled, async (newVal) => {
    if (!newVal) {
        await nextTick();
        textInput.value?.focus();
    }
});

watch(() => content.value, (newVal) => {
    const lineCount = newVal.split('\n').length;
    inputRows.value = lineCount;
})

async function emitSendMessage() {
    if (props.disabled) return;
    const text = content.value.trim();
    if (text.length === 0) return;
    emit('sendMessage', text);
    content.value = '';
}

function onKeyDown(e: KeyboardEvent) {
    if (props.disabled) return;
    console.log(e);
    if (!e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        emitSendMessage();
    }
}
</script>

<style scoped>
.chat-bar {
    display: flex;
    border-top: 1px solid #222222;
    padding: 0.5rem 1rem;
    align-items: flex-end;
}

.message-input {
    border: none;
    background: none;
    flex: 1;
    resize: none;
    height: 100%;
}

.btn-send {
    background: transparent;
    border-radius: 0.5rem;
    padding: 0.5rem;
    display: block;
    transition: background 0.2s;
}

.btn-send:hover {
    background: var(--theme--navigation--background);
}
</style>