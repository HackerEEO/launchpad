import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

export const Privacy = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-bold mb-6 gradient-text">Privacy Policy</h1>
          <p className="text-text-secondary mb-8">Last Updated: December 7, 2024</p>

          <Card className="p-12">
            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-3xl font-bold mb-4">1. Introduction</h2>
                <p className="text-text-secondary leading-relaxed">
                  CryptoLaunch ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform. By using CryptoLaunch, you consent to the practices described in this policy.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">2. Information We Collect</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  We collect several types of information:
                </p>
                <h3 className="text-xl font-bold mb-2">2.1 Wallet Information</h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  When you connect your Web3 wallet, we collect your wallet address and transaction history related to our Platform. This information is publicly available on the blockchain.
                </p>
                <h3 className="text-xl font-bold mb-2">2.2 Personal Information</h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  If you choose to provide it, we may collect your email address, name, and other contact information for account creation, KYC verification, or customer support purposes.
                </p>
                <h3 className="text-xl font-bold mb-2">2.3 Usage Data</h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  We automatically collect information about your interactions with the Platform, including IP address, browser type, device information, pages viewed, and time spent on pages.
                </p>
                <h3 className="text-xl font-bold mb-2">2.4 Cookies and Tracking Technologies</h3>
                <p className="text-text-secondary leading-relaxed">
                  We use cookies, web beacons, and similar tracking technologies to collect information about your browsing activities and preferences. See our Cookie Policy for more details.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">3. How We Use Your Information</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process your transactions and participation in token sales</li>
                  <li>Send you important notices and updates</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Detect, prevent, and address fraud and security issues</li>
                  <li>Comply with legal obligations and enforce our Terms of Service</li>
                  <li>Analyze usage patterns and improve user experience</li>
                  <li>Send marketing communications (with your consent)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">4. How We Share Your Information</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  We may share your information with:
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  <li>Project teams for token sales you participate in</li>
                  <li>Service providers who assist in operating our Platform</li>
                  <li>Law enforcement or regulatory authorities when required by law</li>
                  <li>Professional advisors such as lawyers and accountants</li>
                  <li>Potential buyers in the event of a merger, acquisition, or sale of assets</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mt-4">
                  We do not sell your personal information to third parties for marketing purposes.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">5. Data Security</h2>
                <p className="text-text-secondary leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">6. Data Retention</h2>
                <p className="text-text-secondary leading-relaxed">
                  We retain your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Blockchain transaction data is permanent and cannot be deleted.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">7. Your Rights</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  Depending on your location, you may have certain rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  <li>Access: Request access to your personal information</li>
                  <li>Correction: Request correction of inaccurate information</li>
                  <li>Deletion: Request deletion of your personal information</li>
                  <li>Portability: Request transfer of your information to another service</li>
                  <li>Objection: Object to certain processing of your information</li>
                  <li>Withdraw Consent: Withdraw consent for processing based on consent</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">8. International Data Transfers</h2>
                <p className="text-text-secondary leading-relaxed">
                  Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure appropriate safeguards are in place to protect your information.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">9. Children's Privacy</h2>
                <p className="text-text-secondary leading-relaxed">
                  Our Platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">10. Third-Party Links</h2>
                <p className="text-text-secondary leading-relaxed">
                  Our Platform may contain links to third-party websites. We are not responsible for the privacy practices of these websites. We encourage you to review their privacy policies.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">11. Changes to This Policy</h2>
                <p className="text-text-secondary leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on our Platform and updating the "Last Updated" date. Your continued use after such changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">12. Contact Us</h2>
                <p className="text-text-secondary leading-relaxed">
                  If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
                </p>
                <p className="text-text-secondary leading-relaxed mt-2">
                  Email: privacy@cryptolaunch.io<br />
                  Address: CryptoLaunch Privacy Team
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">13. GDPR Compliance</h2>
                <p className="text-text-secondary leading-relaxed">
                  For users in the European Economic Area, we comply with the General Data Protection Regulation (GDPR). We process your data based on legitimate interests, contractual necessity, legal obligations, or your consent. You have the right to lodge a complaint with your local data protection authority.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">14. CCPA Compliance</h2>
                <p className="text-text-secondary leading-relaxed">
                  For California residents, we comply with the California Consumer Privacy Act (CCPA). You have the right to know what personal information we collect, delete your information, and opt out of the sale of your information (though we do not sell personal information).
                </p>
              </section>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
