import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="prose prose-lg max-w-none">
              {/* Introduction */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  At Job Seeker ("we," "our," or "us"), we are committed to protecting your privacy and personal 
                  information. This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                  information when you use our website and services.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy 
                  Policy, please do not access the site or use our services.
                </p>
              </section>

              {/* Information We Collect */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may collect personal information that you voluntarily provide to us when you:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                  <li>Create an account (name, email, phone number)</li>
                  <li>Complete your profile (skills, experience, education, location)</li>
                  <li>Post a job listing (company information, job details)</li>
                  <li>Apply for jobs (resume, cover letter, application materials)</li>
                  <li>Contact us (inquiry details, communication preferences)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">Automatically Collected Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may automatically collect certain information when you use our Service:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage data (pages visited, time spent, click patterns)</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Location data (if you choose to share it)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Information</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may receive information about you from third parties, such as social media platforms 
                  (if you choose to connect your accounts) or other users who refer you to our Service.
                </p>
              </section>

              {/* How We Use Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                  <li>Provide, operate, and maintain our Service</li>
                  <li>Process job applications and facilitate connections between job seekers and employers</li>
                  <li>Send you notifications about job opportunities and application updates</li>
                  <li>Improve our Service and develop new features</li>
                  <li>Communicate with you about your account and our Service</li>
                  <li>Send you marketing communications (with your consent)</li>
                  <li>Detect, prevent, and address technical issues and security threats</li>
                  <li>Comply with legal obligations and enforce our terms</li>
                </ul>
              </section>

              {/* Information Sharing */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Share Your Information</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">With Employers and Job Seekers</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  When you apply for a job, we share your application materials with the employer. When you post 
                  a job, we may share your company information with job seekers.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">With Service Providers</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may share your information with third-party service providers who assist us in operating 
                  our Service, such as hosting providers, analytics services, and email services.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">Legal Requirements</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may disclose your information if required by law or if we believe such disclosure is 
                  necessary to protect our rights, your safety, or the safety of others.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">Business Transfers</h3>
                <p className="text-gray-700 leading-relaxed">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred 
                  as part of that transaction.
                </p>
              </section>

              {/* Data Security */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We implement appropriate technical and organizational security measures to protect your personal 
                  information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication measures</li>
                  <li>Secure data storage and backup procedures</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  However, no method of transmission over the internet or electronic storage is 100% secure. 
                  While we strive to protect your information, we cannot guarantee absolute security.
                </p>
              </section>

              {/* Cookies and Tracking */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use cookies and similar tracking technologies to enhance your experience on our Service. 
                  Cookies are small data files stored on your device that help us:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
                  <li>Remember your preferences and settings</li>
                  <li>Analyze how you use our Service</li>
                  <li>Provide personalized content and advertisements</li>
                  <li>Improve our Service functionality</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  You can control cookie settings through your browser preferences. However, disabling cookies 
                  may affect the functionality of our Service.
                </p>
              </section>

              {/* Your Rights */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights and Choices</h2>
                <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
                  <li>Access and update your personal information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt out of marketing communications</li>
                  <li>Request a copy of your data</li>
                  <li>Object to certain processing of your data</li>
                  <li>Withdraw consent where applicable</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  To exercise these rights, please contact us using the information provided in the Contact 
                  section below.
                </p>
              </section>

              {/* Data Retention */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your personal information for as long as necessary to provide our Service and 
                  fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is 
                  required or permitted by law. When you delete your account, we will delete or anonymize 
                  your personal information, except where we are required to retain it for legal or 
                  regulatory purposes.
                </p>
              </section>

              {/* International Transfers */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. 
                  We ensure that such transfers comply with applicable data protection laws and implement 
                  appropriate safeguards to protect your information.
                </p>
              </section>

              {/* Children's Privacy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our Service is not intended for children under 18 years of age. We do not knowingly collect 
                  personal information from children under 18. If you are a parent or guardian and believe 
                  your child has provided us with personal information, please contact us.
                </p>
              </section>

              {/* Changes to Privacy Policy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by 
                  posting the new Privacy Policy on this page and updating the "Last updated" date. We 
                  encourage you to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              {/* Contact Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Email:</strong> privacy@jobseeker.com<br />
                    <strong>Address:</strong> 123 Business Street, Suite 100, Tech City, TC 12345, United States<br />
                    <strong>Phone:</strong> +1 (555) 123-4567
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
