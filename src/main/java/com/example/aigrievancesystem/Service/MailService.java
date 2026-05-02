package com.example.aigrievancesystem.service;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.example.aigrievancesystem.model.Complaint;

@Service
public class MailService {

    private final JavaMailSender mailSender;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Tool(name = "send_mail", description = "Send an email to a recipient with subject and content")
    public boolean sendMail(String to, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(content);
        try {
            mailSender.send(message);
        } catch (MailException e) {
            return false;
        }
        return true;
    }

    public void sendComplaintConfirmation(String toEmail, Complaint complaint) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Complaint Submitted Successfully");

        StringBuilder sb = new StringBuilder();
        sb.append("Your complaint has been registered.\n\n");
        sb.append("Category: " + complaint.getCategory() + "\n");
        sb.append("Description: " + complaint.getDescription() + "\n");
        sb.append("Location: " + (complaint.getLatitude() != null && complaint.getLongitude() != null ? ("Lat: " + complaint.getLatitude() + ", Lng: " + complaint.getLongitude()) : "Not provided") + "\n");
        sb.append("Status: " + complaint.getStatus() + "\n\n");
        sb.append("We will take necessary action.\n\n");
        sb.append("Regards,\nCivicVoice Team");

        message.setText(sb.toString());
        try {
            mailSender.send(message);
            System.out.println("Complaint email sent to: " + toEmail);
        } catch (MailException ex) {
            System.out.println("Failed to send complaint email to: " + toEmail + " - " + ex.getMessage());
        }
    }
}
