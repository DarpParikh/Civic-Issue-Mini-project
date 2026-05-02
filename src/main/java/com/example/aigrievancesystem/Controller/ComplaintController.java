package com.example.aigrievancesystem.controller;

import com.example.aigrievancesystem.dto.ComplaintRequest;
import com.example.aigrievancesystem.dto.ComplaintResponse;
import com.example.aigrievancesystem.dto.SendMailRequest;
import com.example.aigrievancesystem.service.ComplaintService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/complaints")
public class ComplaintController {

    private static final Logger log = LoggerFactory.getLogger(ComplaintController.class);

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public ComplaintResponse createComplaint(@RequestBody ComplaintRequest complaintRequest) {
        return complaintService.createComplaint(complaintRequest);
    }

    @GetMapping
    public List<ComplaintResponse> getAllComplaints(
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) String role
    ) {
        try {
            if ("ADMIN".equalsIgnoreCase(role)) {
                log.info("Fetching all complaints for admin role");
                return complaintService.getAllComplaints();
            }
            if (userEmail != null && !userEmail.isBlank()) {
                log.info("Fetching complaints by userEmail={}", userEmail);
                return complaintService.getComplaintsByUserEmail(userEmail);
            }
            log.info("Fetching all complaints");
            return complaintService.getAllComplaints();
        } catch (IllegalArgumentException ex) {
            log.warn("Invalid complaints query parameter: {}", ex.getMessage());
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to fetch complaints", ex);
            throw new RuntimeException("Failed to fetch complaints", ex);
        }
    }

    @PutMapping("/{id}/status")
    public ComplaintResponse updateComplaintStatus(@PathVariable Long id, @RequestParam String status) {
        return complaintService.updateComplaintStatus(id, status);
    }

    @PostMapping("/{id}/send-mail")
    public Map<String, Object> sendComplaintMail(@PathVariable Long id, @RequestBody(required = false) SendMailRequest request) {
        String body = request != null ? request.getBody() : null;
        boolean sent = complaintService.sendComplaintEmail(id, body);
        return Map.of(
                "complaintId", id,
                "sent", sent
        );
    }
}