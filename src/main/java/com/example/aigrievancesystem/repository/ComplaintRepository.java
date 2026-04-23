package com.example.aigrievancesystem.repository;

import com.example.aigrievancesystem.model.Complaint;
import com.example.aigrievancesystem.model.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
	@Override
	List<Complaint> findAll();

	List<Complaint> findByUserEmail(String userEmail);

	List<Complaint> findByCreatedAtBeforeAndStatusNot(LocalDateTime threshold, Status status);
}