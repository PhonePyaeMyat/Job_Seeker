package com.jobseeker.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.jobseeker.model.Job;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class JobService {

    private final Firestore db;
    private static final String JOBS_COLLECTION = "jobs";

    public JobService(Firestore db) {
        this.db = db;
    }

    public List<Job> getAllJobs() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(JOBS_COLLECTION).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Job> jobs = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            jobs.add(document.toObject(Job.class));
        }
        return jobs;
    }

    public Job getJobById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(JOBS_COLLECTION).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        if (document.exists()) {
            return document.toObject(Job.class);
        }
        return null;
    }

    public Job createJob(Job job) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(JOBS_COLLECTION).document();
        job.setId(docRef.getId());
        docRef.set(job).get();
        return job;
    }

    public Job updateJob(String id, Job job) throws ExecutionException, InterruptedException {
        db.collection(JOBS_COLLECTION).document(id).set(job).get();
        return job;
    }

    public void deleteJob(String id) {
        db.collection(JOBS_COLLECTION).document(id).delete();
    }

    public List<Job> searchJobs(String keyword, String location, String type) throws ExecutionException, InterruptedException {
        CollectionReference jobsCollection = db.collection(JOBS_COLLECTION);
        Query query = jobsCollection;

        if (keyword != null && !keyword.isEmpty()) {
            query = query.whereGreaterThanOrEqualTo("title", keyword)
                         .whereLessThanOrEqualTo("title", keyword + '\uf8ff');
        }

        if (location != null && !location.isEmpty()) {
            query = query.whereEqualTo("location", location);
        }

        if (type != null && !type.isEmpty()) {
            query = query.whereEqualTo("type", type);
        }

        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Job> jobs = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            jobs.add(document.toObject(Job.class));
        }
        return jobs;
    }
} 