package com.example.aigrievancesystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AiGrievanceSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiGrievanceSystemApplication.class, args);
    }

}
