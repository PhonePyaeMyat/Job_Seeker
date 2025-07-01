package com.jobseeker.model;

import lombok.Data;
import java.time.LocalDateTime;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class Job {
    private String id;
    @NotBlank
    private String title;
    @NotBlank
    private String company;
    @NotBlank
    private String location;
    @NotBlank
    private String description;
    private String requirements;
    private String type; // FULL_TIME, PART_TIME, CONTRACT, etc.
    private String salary;
    private String experienceLevel; // ENTRY, MID, SENIOR, etc.
    private String[] skills;
    private LocalDateTime postedDate;
    @NotNull
    private LocalDateTime expiryDate;
    private boolean active;
    private String companyId;
    private String[] applicants;
} 