package com.example.aigrievancesystem.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class AiMailController {

    private static final Logger log = LoggerFactory.getLogger(AiMailController.class);

    private final ObjectProvider<ChatClient> chatClientProvider;

    public AiMailController(ObjectProvider<ChatClient> chatClientProvider) {
        this.chatClientProvider = chatClientProvider;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, String> payload) {
        try {
            // Extract structured data from request
            String name = payload.getOrDefault("name", "Citizen");
            String email = payload.getOrDefault("email", "N/A");
            String category = payload.getOrDefault("category", "General Issue");
            String description = payload.getOrDefault("description", "");
            String location = payload.getOrDefault("location", "Unknown Location");
            String department = payload.getOrDefault("department", "Concerned Department");
            String currentDraft = payload.getOrDefault("currentDraft", "");
            String modificationCommand = payload.getOrDefault("modificationCommand", "");

            System.out.println("AI request - Name: " + name + ", Email: " + email + ", Category: " + category);
            log.info("Received AI chat request from user {} for category {}", email, category);

            ChatClient chatClient = chatClientProvider.getIfAvailable();
            if (chatClient == null) {
                log.error("ChatClient is not available - AI model not configured");
                System.out.println("ChatClient NOT available - returning fallback");
                return ResponseEntity.ok("AI temporarily unavailable. Please try again.");
            }

            // Build dynamic prompt based on context (modification vs generation)
            String prompt;
            if (!modificationCommand.isEmpty() && !currentDraft.isEmpty()) {
                // Modification case
                prompt = String.format("""
                        You are an assistant helping revise an official complaint email.
                        
                        USER DETAILS:
                        Name: %s
                        Email: %s
                        Department: %s
                        
                        CURRENT DRAFT:
                        %s
                        
                        USER MODIFICATION REQUEST:
                        %s
                        
                        INSTRUCTIONS:
                        * Apply the user's modification to the email
                        * Keep all specific user information (%s, %s)
                        * DO NOT use placeholders
                        * Return only the revised email body
                        """, name, email, department, currentDraft, modificationCommand, name, email);
            } else {
                // Initial email generation case
                prompt = String.format("""
                        Generate a formal government complaint email.

                        STRICT INSTRUCTIONS:
                        * DO NOT use placeholders like [Your Name], [Recipient Name], etc.
                        * Use the actual values provided below
                        * Make it professional and complete
                        * Do not repeat previous responses

                        USER DETAILS:
                        Name: %s
                        Email: %s
                        Department: %s
                        Category: %s
                        Location: %s
                        Description: %s

                        The email must:
                        * Address the correct department (%s)
                        * Include user name (%s) and email (%s)
                        * Be ready to send (NO placeholders)
                        * Be formal and professional
                        """, name, email, department, category, location, description, department, name, email);
            }

            String response = chatClient
                    .prompt()
                    .user(prompt)
                    .call()
                    .content();

            System.out.println("AI response generated: " + response.substring(0, Math.min(100, response.length())));
            log.info("AI response generated successfully. Response length: {}", response.length());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.out.println("AI error: " + e.getMessage());
            e.printStackTrace();
            log.error("AI chat request failed with error: {}", e.getMessage(), e);
            return ResponseEntity.ok("AI temporarily unavailable. Please try again.");
        }
    }
}
