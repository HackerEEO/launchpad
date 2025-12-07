import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

export const Terms = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-bold mb-6 gradient-text">Terms of Service</h1>
          <p className="text-text-secondary mb-8">Last Updated: December 7, 2024</p>

          <Card className="p-12">
            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-3xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-text-secondary leading-relaxed">
                  By accessing and using CryptoLaunch ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to modify these terms at any time, and your continued use of the Platform constitutes acceptance of any changes.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">2. Eligibility</h2>
                <p className="text-text-secondary leading-relaxed">
                  You must be at least 18 years old and have the legal capacity to enter into binding contracts to use this Platform. By using our services, you represent and warrant that you meet these requirements. You also confirm that you are not located in, under the control of, or a national or resident of any restricted jurisdiction.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">3. Account Registration</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  To participate in token sales, you may need to connect a Web3 wallet. You are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  <li>Maintaining the security of your wallet and private keys</li>
                  <li>All activities that occur under your wallet address</li>
                  <li>Ensuring your wallet has sufficient funds for transactions and gas fees</li>
                  <li>Complying with all applicable laws and regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">4. Token Sales and Investments</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  When participating in token sales through our Platform:
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  <li>All investments are at your own risk</li>
                  <li>Cryptocurrency investments are highly volatile and speculative</li>
                  <li>Past performance does not guarantee future results</li>
                  <li>You may lose all or part of your investment</li>
                  <li>Token sales may fail to reach their funding goals</li>
                  <li>Projects may not deliver on their roadmap or promises</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">5. No Investment Advice</h2>
                <p className="text-text-secondary leading-relaxed">
                  CryptoLaunch does not provide investment, legal, tax, or financial advice. The information provided on the Platform is for informational purposes only. You should conduct your own research and consult with professional advisors before making any investment decisions.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">6. Project Listings</h2>
                <p className="text-text-secondary leading-relaxed">
                  While we conduct due diligence on projects listed on our Platform, we do not guarantee the success, legitimacy, or viability of any project. The inclusion of a project on our Platform does not constitute an endorsement or recommendation. Users must perform their own research before investing.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">7. Smart Contracts</h2>
                <p className="text-text-secondary leading-relaxed">
                  Token sales are conducted through smart contracts on the blockchain. Once a transaction is confirmed on the blockchain, it cannot be reversed. We are not responsible for errors in smart contracts or blockchain transactions.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">8. Prohibited Activities</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  You agree not to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  <li>Use the Platform for any illegal purposes</li>
                  <li>Manipulate token prices or engage in market manipulation</li>
                  <li>Create multiple accounts to circumvent participation limits</li>
                  <li>Attempt to hack, exploit, or damage the Platform</li>
                  <li>Impersonate others or provide false information</li>
                  <li>Engage in fraudulent activities or money laundering</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">9. Intellectual Property</h2>
                <p className="text-text-secondary leading-relaxed">
                  All content on the Platform, including text, graphics, logos, and software, is the property of CryptoLaunch or its licensors and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">10. Limitation of Liability</h2>
                <p className="text-text-secondary leading-relaxed">
                  To the fullest extent permitted by law, CryptoLaunch and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or investments, arising from your use of the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">11. Indemnification</h2>
                <p className="text-text-secondary leading-relaxed">
                  You agree to indemnify and hold harmless CryptoLaunch, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising from your use of the Platform or violation of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">12. Governing Law</h2>
                <p className="text-text-secondary leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which CryptoLaunch operates, without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">13. Contact Information</h2>
                <p className="text-text-secondary leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at legal@cryptolaunch.io.
                </p>
              </section>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
