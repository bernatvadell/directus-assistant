<template>
    <div class="conversation">
        <div class="chat-container">
            <chat-message v-for="message in conversation" :key="message.id" :message="message" />
        </div>
        <chat-bar key="chatbar" :disabled="sendingMessage" @send-message="onSendMessage($event)" />
    </div>
</template>

<style>
#main-content {
    display: flex;
    flex-direction: column;
}
</style>

<style scoped>
.conversation {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.conversation .chat-container {
    display: flex;
    flex-direction: column;
    padding: 0 2rem;
    gap: 2rem;
    flex: 1;
    overflow-y: auto;
}
</style>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useApi } from '@directus/extensions-sdk'
import { Message } from '../interfaces'
import ChatMessage from './ChatMessage.vue';
import ChatBar from './ChatBar.vue';

export default defineComponent({
    components: { ChatMessage, ChatBar },
    setup() {
        const api = useApi();
        const sendingMessage = ref(false);
        const conversation = ref<Message[]>([]);

        async function onSendMessage(message: string) {
            if (sendingMessage.value) return;
            sendingMessage.value = true;
            conversation.value.push({ content: message, created_at: new Date().toString(), id: -1, role: 'user', user: '' })
            const response = await api.post('/assistant/send', { content: message })
            sendingMessage.value = false;
            conversation.value.splice(conversation.value.length - 1, 1);
            const { ok, data } = response.data;
            if (ok) {
                conversation.value.push(data.user_message);
                for (const message of data.assistant_messages)
                    conversation.value.push(message);
            }
        }

        async function loadMessages() {
            const response = await api.get('/assistant/messages');
            const { ok, data } = response.data;
            if (ok) conversation.value = data;
        }

        loadMessages();

        return {
            sendingMessage,
            onSendMessage,
            conversation
        }
    }
})
</script>
