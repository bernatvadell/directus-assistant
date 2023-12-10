<template>
    <div class="message" :class="[`message-${message.role}`, { 'sending': sending }]">
        <div class="avatar">
            <div class="avatar-container">
                <v-progress-circular v-if="sending" indeterminate />
                <v-icon v-else :name="message.role === 'assistant' ? 'support_agent' : 'person'" />
            </div>
        </div>
        <div class="content">
            {{ message.content }}
        </div>
    </div>
</template>

<style scoped>
.message {
    display: flex;
    flex-direction: row;
    gap: 1rem;
}

.message.message-user {
    align-self: end;
    flex-direction: row-reverse;
}

.message .avatar-container {
    --v-icon-size: 30px;

    border-radius: 50%;
    overflow: hidden;
    border: 1px solid #e0e0e0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.message .avatar-container img {
    width: 100%;
    height: auto;
}

.message .content {
    background: var(--theme--navigation--background);
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    /* user-select: text; */
}

.message.message-user .content {
    background: var(--project-color);
}

.message.sending .content {
    font-style: italic;
}
</style>

<script setup lang="ts">
import { Message } from '../interfaces'

defineProps<{
    message: Message;
}>()
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    data({ message }) {
        const sending = message.id === -1;
        return {
            message,
            sending
        };
    }
})
</script>