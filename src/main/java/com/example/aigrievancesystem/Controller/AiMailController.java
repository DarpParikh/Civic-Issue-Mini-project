package com.example.aigrievancesystem.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AiMailController {

    private final ObjectProvider<ChatClient> chatClientProvider;

    public AiMailController(ObjectProvider<ChatClient> chatClientProvider) {
        this.chatClientProvider = chatClientProvider;
    }

    @PostMapping("/chat")
    public String chat(@RequestParam String message) {
        ChatClient chatClient = chatClientProvider.getIfAvailable();
        if (chatClient == null) {
            return "AI chat is currently unavailable. Please check AI model configuration.";
        }

        return chatClient
                .prompt()
                .user(message)
                .call()
                .content();
    }
}
