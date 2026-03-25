package com.example.aigrievancesystem.Config;


import com.example.aigrievancesystem.Service.MailService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.chat.memory.InMemoryChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Bean
    ChatMemoryRepository chatMemoryRepository(){
        return new InMemoryChatMemoryRepository() ;
    }
    @Bean
    ChatMemory chatMemory(){
        return MessageWindowChatMemory
                .builder()
                .maxMessages(10)
                .chatMemoryRepository(chatMemoryRepository())
                .build();
    }
    @Bean
    ChatClient chatClient(OpenAiChatModel chatModel, ChatMemory chatMemory, MailService mailService){
        return ChatClient
                .builder(chatModel)
                .defaultAdvisors(
                        MessageChatMemoryAdvisor
                                .builder
                                        (chatMemory)
                                .build())
                .defaultTools(mailService)
                .build();
    }
}
