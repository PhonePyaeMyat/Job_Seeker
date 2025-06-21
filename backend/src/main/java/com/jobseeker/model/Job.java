package com.jobseeker.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Job {
    private String id;
    private String title;
    private String company;
    private String location;
    private String description;
    private String requirements;
    private String type; // FULL_TIME, PART_TIME, CONTRACT, etc.
    private String salary;
    private String experienceLevel; // ENTRY, MID, SENIOR, etc.
    private String[] skills;
    private LocalDateTime postedDate;
    private LocalDateTime expiryDate;
    private boolean active;
    private String companyId;
    private String[] applicants;
} 