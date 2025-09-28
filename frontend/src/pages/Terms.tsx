import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
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
                  Welcome to Job Seeker ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our 
                  website and services (collectively, the "Service") operated by Job Seeker.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any 
                  part of these terms, then you may not access the Service.
                </p>
              </section>

              {/* Acceptance of Terms */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  By creating an account, posting a job, applying for a job, or otherwise using our Service, you 
                  acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  You must be at least 18 years old to use our Service. By using our Service, you represent and 
                  warrant that you are at least 18 years of age.
                </p>
              </section>

              {/* User Accounts */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Account Creation:</strong> You must provide accurate, current, and complete information 
                    when creating your account. You are responsible for maintaining the confidentiality of your 
                    account credentials.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Account Security:</strong> You are responsible for all activities that occur under your 
                    account. You must notify us immediately of any unauthorized use of your account.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Account Termination:</strong> We reserve the right to suspend or terminate your account 
                    at any time for violation of these Terms or for any other reason at our sole discretion.
                  </p>
                </div>
              </section>

              {/* Job Postings */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Job Postings and Applications</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Job Postings:</strong> Employers are responsible for the accuracy and legality of their 
                    job postings. We reserve the right to remove any job posting that violates these Terms or 
                    applicable laws.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Applications:</strong> Job seekers are responsible for the accuracy of their applications 
                    and profile information. We do not guarantee job placement or employment opportunities.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Equal Opportunity:</strong> All users must comply with applicable equal opportunity and 
                    anti-discrimination laws.
                  </p>
                </div>
              </section>

              {/* Prohibited Uses */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Prohibited Uses</h2>
                <p className="text-gray-700 leading-relaxed mb-4">You may not use our Service:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                  <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                  <li>To submit false or misleading information</li>
                  <li>To upload or transmit viruses or any other type of malicious code</li>
                  <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                  <li>For any obscene or immoral purpose</li>
                  <li>To interfere with or circumvent the security features of the Service</li>
                </ul>
              </section>

              {/* Content and Intellectual Property */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Content and Intellectual Property</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Your Content:</strong> You retain ownership of any content you post to our Service. 
                    By posting content, you grant us a non-exclusive, royalty-free license to use, modify, and 
                    display such content in connection with the Service.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Our Content:</strong> The Service and its original content, features, and functionality 
                    are owned by Job Seeker and are protected by international copyright, trademark, patent, 
                    trade secret, and other intellectual property laws.
                  </p>
                </div>
              </section>

              {/* Privacy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your 
                  use of the Service, to understand our practices.
                </p>
              </section>

              {/* Disclaimers */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimers</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Service Availability:</strong> The Service is provided on an "AS IS" and "AS AVAILABLE" 
                    basis. We do not guarantee that the Service will be available at all times or free from errors.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>No Employment Guarantee:</strong> We do not guarantee job placement, employment, or 
                    any specific outcomes from using our Service.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Third-Party Content:</strong> We are not responsible for the content, accuracy, or 
                    opinions expressed in job postings or user profiles.
                  </p>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed">
                  In no event shall Job Seeker, nor its directors, employees, partners, agents, suppliers, or 
                  affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, 
                  including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
                  resulting from your use of the Service.
                </p>
              </section>

              {/* Indemnification */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
                <p className="text-gray-700 leading-relaxed">
                  You agree to defend, indemnify, and hold harmless Job Seeker and its licensee and licensors, 
                  and their employees, contractors, agents, officers and directors, from and against any and all 
                  claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not 
                  limited to attorney's fees).
                </p>
              </section>

              {/* Termination */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may terminate or suspend your account and bar access to the Service immediately, without 
                  prior notice or liability, under our sole discretion, for any reason whatsoever and without 
                  limitation, including but not limited to a breach of the Terms.
                </p>
              </section>

              {/* Changes to Terms */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                  If a revision is material, we will provide at least 30 days notice prior to any new terms taking 
                  effect. What constitutes a material change will be determined at our sole discretion.
                </p>
              </section>

              {/* Contact Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Email:</strong> legal@jobseeker.com<br />
                    <strong>Address:</strong> 123 Business Street, Suite 100, Tech City, TC 12345, United States
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

export default Terms;
