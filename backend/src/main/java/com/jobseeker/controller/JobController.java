package com.jobseeker.controller;

import com.jobseeker.model.Job;
import com.jobseeker.service.JobService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.concurrent.ExecutionException;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    @Value("${api.key}")
    private String apiKey;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    private boolean isAuthorized(String header) {
        return header != null && header.equals(apiKey);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) throws ExecutionException, InterruptedException {
        List<Job> allJobs = jobService.getAllJobs();
        int total = allJobs.size();
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);
        List<Job> jobs = allJobs.subList(fromIndex, toIndex);
        Map<String, Object> response = new HashMap<>();
        response.put("jobs", jobs);
        response.put("total", total);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> getJobById(@PathVariable String id) throws ExecutionException, InterruptedException {
        Job job = jobService.getJobById(id);
        if (job != null) {
            return ResponseEntity.ok(job);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Job> createJob(@Valid @RequestBody Job job, @RequestHeader(value = "Authorization", required = false) String authHeader) throws ExecutionException, InterruptedException {
        if (!isAuthorized(authHeader)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(jobService.createJob(job));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Job> updateJob(@PathVariable String id, @Valid @RequestBody Job job, @RequestHeader(value = "Authorization", required = false) String authHeader) throws ExecutionException, InterruptedException {
        if (!isAuthorized(authHeader)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(jobService.updateJob(id, job));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable String id, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!isAuthorized(authHeader)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        jobService.deleteJob(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) throws ExecutionException, InterruptedException {
        List<Job> filteredJobs = jobService.searchJobs(keyword, location, type);
        int total = filteredJobs.size();
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);
        List<Job> jobs = filteredJobs.subList(fromIndex, toIndex);
        Map<String, Object> response = new HashMap<>();
        response.put("jobs", jobs);
        response.put("total", total);
        return ResponseEntity.ok(response);
    }
} 