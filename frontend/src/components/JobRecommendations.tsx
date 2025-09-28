import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  postedDate: string;
  description: string;
  skills: string[];
  experienceLevel: string;
  applicants: string[];
  companyId: string;
}

interface UserProfile {
  skills: string[];
  experience: string;
  location: string;
  preferredJobTypes: string[];
  savedJobs: string[];
  appliedJobs: string[];
}

const JobRecommendations: React.FC = () => {
  const [user] = useAuthState(auth);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Load user profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile({
            skills: userData.skills || [],
            experience: userData.experience || '',
            location: userData.location || '',
            preferredJobTypes: userData.preferredJobTypes || [],
            savedJobs: userData.savedJobs || [],
            appliedJobs: userData.appliedJobs || []
          });
        }

        // Get all jobs
        const jobsRef = collection(db, 'jobs');
        const jobsQuery = query(
          jobsRef,
          where('active', '==', true),
          orderBy('postedDate', 'desc'),
          limit(50)
        );
        const jobsSnapshot = await getDocs(jobsQuery);
        const allJobs = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Job[];

        // Calculate recommendations based on user profile
        const recommendations = calculateRecommendations(allJobs, userProfile);
        setRecommendedJobs(recommendations.slice(0, 10));

      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [user, userProfile]);

  const calculateRecommendations = (jobs: Job[], profile: UserProfile | null): Job[] => {
    if (!profile) return jobs.slice(0, 10);

    return jobs
      .map(job => {
        let score = 0;

        // Skill matching (40% weight)
        if (profile.skills.length > 0 && job.skills) {
          const matchingSkills = job.skills.filter(skill => 
            profile.skills.some(userSkill => 
              userSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(userSkill.toLowerCase())
            )
          ).length;
          score += (matchingSkills / Math.max(profile.skills.length, job.skills.length)) * 40;
        }

        // Experience level matching (20% weight)
        if (profile.experience && job.experienceLevel) {
          const experienceMatch = getExperienceMatch(profile.experience, job.experienceLevel);
          score += experienceMatch * 20;
        }

        // Location preference (15% weight)
        if (profile.location && job.location) {
          const locationMatch = getLocationMatch(profile.location, job.location);
          score += locationMatch * 15;
        }

        // Job type preference (15% weight)
        if (profile.preferredJobTypes.length > 0) {
          const typeMatch = profile.preferredJobTypes.includes(job.type) ? 1 : 0;
          score += typeMatch * 15;
        }

        // Recency bonus (10% weight)
        const daysSincePosted = Math.floor((Date.now() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24));
        const recencyScore = Math.max(0, 1 - (daysSincePosted / 30)); // Decay over 30 days
        score += recencyScore * 10;

        return { ...job, recommendationScore: score };
      })
      .filter(job => !profile.savedJobs.includes(job.id) && !profile.appliedJobs.includes(job.id))
      .sort((a, b) => (b as any).recommendationScore - (a as any).recommendationScore);
  };

  const getExperienceMatch = (userExperience: string, jobExperience: string): number => {
    const experienceLevels = {
      'entry': 1,
      'mid': 2,
      'senior': 3,
      'executive': 4
    };

    const userLevel = experienceLevels[userExperience as keyof typeof experienceLevels] || 1;
    const jobLevel = experienceLevels[jobExperience as keyof typeof experienceLevels] || 1;

    // Perfect match
    if (userLevel === jobLevel) return 1;
    
    // User is slightly overqualified (still good match)
    if (userLevel === jobLevel + 1) return 0.8;
    
    // User is underqualified
    if (userLevel < jobLevel) return 0.3;
    
    // User is significantly overqualified
    return 0.5;
  };

  const getLocationMatch = (userLocation: string, jobLocation: string): number => {
    const userCity = userLocation.toLowerCase().split(',')[0].trim();
    const jobCity = jobLocation.toLowerCase().split(',')[0].trim();
    
    // Exact match
    if (userCity === jobCity) return 1;
    
    // Remote work
    if (jobLocation.toLowerCase().includes('remote')) return 0.9;
    
    // Same state (basic check)
    const userState = userLocation.toLowerCase().split(',').pop()?.trim();
    const jobState = jobLocation.toLowerCase().split(',').pop()?.trim();
    if (userState && jobState && userState === jobState) return 0.7;
    
    return 0.2;
  };

  const getRecommendationReason = (job: Job): string => {
    if (!userProfile) return 'Recommended for you';

    const reasons = [];

    // Skill match
    if (userProfile.skills.length > 0 && job.skills) {
      const matchingSkills = job.skills.filter(skill => 
        userProfile.skills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
      if (matchingSkills.length > 0) {
        reasons.push(`Matches your skills: ${matchingSkills.slice(0, 2).join(', ')}`);
      }
    }

    // Experience match
    if (userProfile.experience && job.experienceLevel) {
      if (userProfile.experience === job.experienceLevel) {
        reasons.push('Matches your experience level');
      }
    }

    // Location match
    if (userProfile.location && job.location) {
      if (job.location.toLowerCase().includes('remote')) {
        reasons.push('Remote work available');
      } else if (userProfile.location.toLowerCase().includes(job.location.toLowerCase().split(',')[0])) {
        reasons.push('Near your location');
      }
    }

    return reasons.length > 0 ? reasons[0] : 'Recommended for you';
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommended Jobs</h2>
        <p className="text-gray-600 text-center py-8">
          <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
            Sign up
          </Link> to get personalized job recommendations
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommended Jobs</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Recommended Jobs</h2>
        <span className="text-sm text-gray-500">
          Based on your profile and preferences
        </span>
      </div>

      {recommendedJobs.length > 0 ? (
        <div className="space-y-4">
          {recommendedJobs.map((job) => (
            <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Link 
                      to={`/jobs/${job.id}`}
                      className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {job.title}
                    </Link>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <span className="font-medium">{job.company}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.type}</span>
                    <span>•</span>
                    <span>{job.salary}</span>
                  </div>

                  <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-green-600 font-medium">
                      {getRecommendationReason(job)}
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(job.postedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="ml-4 flex flex-col items-end space-y-2">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Job
                  </Link>
                  <span className="text-xs text-gray-500">
                    {job.applicants?.length || 0} applicants
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No recommendations available at the moment.</p>
          <Link 
            to="/jobs" 
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Browse All Jobs
          </Link>
        </div>
      )}
    </div>
  );
};

export default JobRecommendations;
