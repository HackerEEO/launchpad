import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

export const Cookies = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-bold mb-6 gradient-text">Cookie Policy</h1>
          <p className="text-text-secondary mb-8">Last Updated: December 7, 2024</p>

          <Card className="p-12">
            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-3xl font-bold mb-4">1. What Are Cookies?</h2>
                <p className="text-text-secondary leading-relaxed">
                  Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners. Cookies can be "session" cookies (temporary and deleted when you close your browser) or "persistent" cookies (remain on your device for a set period).
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">2. How We Use Cookies</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  CryptoLaunch uses cookies and similar tracking technologies for various purposes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  <li>To enable certain functions of the Platform</li>
                  <li>To remember your preferences and settings</li>
                  <li>To analyze how you use the Platform</li>
                  <li>To improve our services and user experience</li>
                  <li>To provide personalized content</li>
                  <li>To measure the effectiveness of our marketing campaigns</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">3. Types of Cookies We Use</h2>

                <h3 className="text-xl font-bold mb-2 mt-6">3.1 Strictly Necessary Cookies</h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  These cookies are essential for the Platform to function properly. They enable core functionality such as wallet connection, navigation, and access to secure areas. The Platform cannot function properly without these cookies, and they cannot be disabled.
                </p>

                <h3 className="text-xl font-bold mb-2">3.2 Performance Cookies</h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  These cookies collect information about how you use the Platform, such as which pages you visit most often and whether you receive error messages. This information is aggregated and anonymous, and we use it to improve how the Platform works.
                </p>

                <h3 className="text-xl font-bold mb-2">3.3 Functional Cookies</h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  These cookies allow the Platform to remember choices you make (such as language preferences or theme settings) and provide enhanced, personalized features. They may also be used to provide services you have requested.
                </p>

                <h3 className="text-xl font-bold mb-2">3.4 Targeting/Advertising Cookies</h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  These cookies are used to deliver content that is more relevant to you and your interests. They may be used to deliver targeted advertising or limit the number of times you see an advertisement. They also help us measure the effectiveness of advertising campaigns.
                </p>

                <h3 className="text-xl font-bold mb-2">3.5 Analytics Cookies</h3>
                <p className="text-text-secondary leading-relaxed">
                  We use analytics services like Google Analytics to understand how users interact with the Platform. These cookies collect information such as page visits, time spent on pages, and navigation paths.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">4. Third-Party Cookies</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  In addition to our own cookies, we may use third-party cookies from:
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  <li>Google Analytics for website analytics</li>
                  <li>Social media platforms for sharing content</li>
                  <li>Advertising networks for targeted advertising</li>
                  <li>Content delivery networks for performance optimization</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mt-4">
                  These third parties may use cookies to collect information about your online activities across different websites over time.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">5. Local Storage and Web Beacons</h2>
                <p className="text-text-secondary leading-relaxed">
                  In addition to cookies, we may use local storage (such as HTML5 localStorage) and web beacons (small transparent images) to store information on your device and track your usage of the Platform. These technologies serve similar purposes to cookies and are subject to this Cookie Policy.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">6. Managing Cookies</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  You have several options for managing cookies:
                </p>

                <h3 className="text-xl font-bold mb-2 mt-6">6.1 Browser Settings</h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies or delete certain cookies. Please note that if you block or delete cookies, some features of the Platform may not function properly.
                </p>

                <h3 className="text-xl font-bold mb-2">6.2 Opt-Out Tools</h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  You can opt out of certain third-party cookies through:
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  <li>Google Analytics Opt-out Browser Add-on</li>
                  <li>Your Online Choices (European users)</li>
                  <li>Network Advertising Initiative (NAI)</li>
                  <li>Digital Advertising Alliance (DAA)</li>
                </ul>

                <h3 className="text-xl font-bold mb-2 mt-6">6.3 Mobile Devices</h3>
                <p className="text-text-secondary leading-relaxed">
                  On mobile devices, you can manage tracking preferences through your device settings. For iOS devices, you can enable "Limit Ad Tracking." For Android devices, you can reset your advertising ID or opt out of personalized ads.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">7. Do Not Track Signals</h2>
                <p className="text-text-secondary leading-relaxed">
                  Some browsers have a "Do Not Track" (DNT) feature that signals to websites that you do not want your online activities tracked. Currently, there is no industry standard for responding to DNT signals. We do not currently respond to DNT signals, but we respect your privacy choices.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">8. Cookie Duration</h2>
                <p className="text-text-secondary leading-relaxed">
                  The length of time a cookie remains on your device depends on whether it is a "session" or "persistent" cookie. Session cookies are deleted when you close your browser. Persistent cookies remain on your device until they expire or you delete them. Our persistent cookies typically expire after 12 months.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">9. Cookies and Personal Data</h2>
                <p className="text-text-secondary leading-relaxed">
                  Some cookies may collect personal data, such as your IP address or wallet address. We treat this information in accordance with our Privacy Policy. By using the Platform, you consent to our use of cookies as described in this Cookie Policy.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">10. Updates to This Policy</h2>
                <p className="text-text-secondary leading-relaxed">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our Platform and updating the "Last Updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">11. Contact Us</h2>
                <p className="text-text-secondary leading-relaxed">
                  If you have questions about our use of cookies or this Cookie Policy, please contact us at:
                </p>
                <p className="text-text-secondary leading-relaxed mt-2">
                  Email: privacy@cryptolaunch.io
                </p>
              </section>

              <section className="bg-primary-500/10 p-6 rounded-lg border border-primary-500/20">
                <h3 className="text-xl font-bold mb-3">Your Consent</h3>
                <p className="text-text-secondary leading-relaxed">
                  By continuing to use our Platform, you consent to our use of cookies as described in this Cookie Policy. If you do not agree to our use of cookies, you should disable cookies in your browser settings or refrain from using the Platform.
                </p>
              </section>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
