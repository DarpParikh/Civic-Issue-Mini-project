package com.example.aigrievancesystem.service;

import com.example.aigrievancesystem.dto.ComplaintRequest;
import com.example.aigrievancesystem.dto.ComplaintResponse;
import com.example.aigrievancesystem.exception.ResourceNotFoundException;
import com.example.aigrievancesystem.model.Complaint;
import com.example.aigrievancesystem.model.Status;
import com.example.aigrievancesystem.repository.ComplaintRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class ComplaintService {

    private static final Logger log = LoggerFactory.getLogger(ComplaintService.class);

    private final ComplaintRepository complaintRepository;
    private final ObjectProvider<ChatClient> chatClientProvider;
    private final MailService mailService;

    @Value("${complaint.notification.email:${spring.mail.username}}")
    private String complaintNotificationEmail;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            ObjectProvider<ChatClient> chatClientProvider,
            MailService mailService
    ) {
        this.complaintRepository = complaintRepository;
        this.chatClientProvider = chatClientProvider;
        this.mailService = mailService;
    }

    public ComplaintResponse createComplaint(ComplaintRequest request) {
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new IllegalArgumentException("Complaint description is required");
        }

        Complaint complaint = new Complaint();
        complaint.setCategory(request.getCategory());
        complaint.setDescription(request.getDescription());
        complaint.setSeverity(request.getSeverity());
        complaint.setLatitude(request.getLatitude());
        complaint.setLongitude(request.getLongitude());
        complaint.setEmail(request.getEmail());
        complaint.setUserEmail(request.getEmail());
        complaint.setImageUrl(request.getImageUrl());
        complaint.setStatus(Status.PENDING);

        log.info("Creating complaint with category={} and severity={}", complaint.getCategory(), complaint.getSeverity());

        String aiText = generateFormalComplaintText(
                complaint.getDescription(),
                complaint.getLatitude(),
                complaint.getLongitude()
        );
        complaint.setAiGeneratedText(aiText);

        Complaint savedComplaint = complaintRepository.save(complaint);
        log.info("Complaint created with id={}", savedComplaint.getId());

        return toResponse(savedComplaint);
    }

    public List<ComplaintResponse> getAllComplaints(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new IllegalArgumentException("userEmail is required");
        }

        return complaintRepository.findByUserEmail(userEmail)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ComplaintResponse updateComplaintStatus(Long id, String statusValue) {
        if (statusValue == null || statusValue.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }

        Status status;
        try {
            status = Status.valueOf(statusValue.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid status. Allowed values: PENDING, IN_PROGRESS, RESOLVED");
        }

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        complaint.setStatus(status);
        Complaint updated = complaintRepository.save(complaint);
        log.info("Complaint status updated for id={} to {}", id, status);
        return toResponse(updated);
    }

    public boolean sendComplaintEmail(Long id, String customBody) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        String body = (customBody == null || customBody.isBlank())
                ? buildDefaultEmailBody(complaint)
                : customBody;

        String recipient = complaint.getEmail();
        if (recipient == null || recipient.isBlank()) {
            recipient = complaintNotificationEmail;
        }

        boolean sent = mailService.sendMail(
                recipient,
                "Complaint Submitted Successfully",
                body
        );
        if (sent) {
            log.info("Complaint notification email sent to {} for complaint id={}", recipient, id);
        } else {
            log.warn("Complaint notification email failed for recipient {} for complaint id={}", recipient, id);
        }
        return sent;
    }

    @Scheduled(fixedRate = 3600000)
    public void escalateOldComplaints() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        List<Complaint> staleComplaints = complaintRepository.findByCreatedAtBeforeAndStatusNot(threshold, Status.RESOLVED);

        for (Complaint complaint : staleComplaints) {
            if (complaint.getStatus() == Status.PENDING) {
                complaint.setStatus(Status.IN_PROGRESS);
                complaintRepository.save(complaint);
            }
            log.warn("Escalated complaint id={} with status={} createdAt={}", complaint.getId(), complaint.getStatus(), complaint.getCreatedAt());
        }
    }

    private String generateFormalComplaintText(String description, Double latitude, Double longitude) {
        ChatClient chatClient = chatClientProvider.getIfAvailable();
        String location = (latitude != null && longitude != null)
                ? "Latitude: " + latitude + ", Longitude: " + longitude
                : "Location not provided";

        if (chatClient == null) {
            String fallback = "Subject: Civic Grievance Complaint\n" +
                    "Respected Sir/Madam,\n\n" +
                    "I would like to register the following civic issue: " + description + "\n" +
                    "Location: " + location + "\n\n" +
                    "I request your office to take necessary action at the earliest.\n\n" +
                    "Thank you.\n" +
                    "Yours faithfully,";
            log.warn("ChatClient not available, using fallback complaint text");
            log.info("AI generated complaint text: {}", fallback);
            return fallback;
        }

        String prompt = "Convert the following issue into a formal government complaint email.\n\n" +
                "Include:\n" +
                "- Subject line\n" +
                "- Proper greeting (Respected Sir/Madam)\n" +
                "- Clear structured description\n" +
                "- Location mention if available\n" +
                "- Request for action\n" +
                "- Polite closing\n\n" +
                "Issue:\n" +
                description + "\n\n" +
                "Location details: " + location;

        String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        log.info("AI generated complaint text: {}", response);
        return response;
    }

    private String buildDefaultEmailBody(Complaint complaint) {
        return "Your complaint has been registered.\n\n" +
                "Category: " + complaint.getCategory() + "\n" +
                "Description: " + complaint.getDescription() + "\n" +
                "Status: " + complaint.getStatus() + "\n\n" +
                complaint.getAiGeneratedText();
    }

    private ComplaintResponse toResponse(Complaint complaint) {
        ComplaintResponse response = new ComplaintResponse();
        response.setId(complaint.getId());
        response.setCategory(complaint.getCategory());
        response.setDescription(complaint.getDescription());
        response.setAiGeneratedText(complaint.getAiGeneratedText());
        response.setSeverity(complaint.getSeverity());
        response.setLatitude(complaint.getLatitude());
        response.setLongitude(complaint.getLongitude());
        response.setEmail(complaint.getEmail());
        response.setImageUrl(complaint.getImageUrl());
        response.setStatus(complaint.getStatus());
        response.setCreatedAt(complaint.getCreatedAt());
        return response;
    }
}