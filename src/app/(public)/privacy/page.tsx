import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-lg">
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">1. Who We Are</h2>
                    <p>This website and service (collectively, the &quot;Service&quot;) helps users learn languages through phrase‑shadowing practice. For the purposes of UK and EU data protection law, we act as the data controller for the personal data described in this policy.</p>
                    <p>Contact email: hello@lingopaper.com</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">2. Scope of This Policy</h2>
                    <p>This Privacy Policy describes how we collect, use, disclose, and protect your personal data when you:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Create an account or sign in with Google Sign‑In or email/password</li>
                        <li>Use the Service through our website, mobile interface, or Chrome app</li>
                        <li>Communicate with us or interact with the Service</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">3. Personal Data We Collect</h2>

                    <h3 className="text-xl font-medium mb-2">Account Identifiers</h3>
                    <ul className="list-disc pl-6 mt-2">
                        <li>For Google Sign-In: Google UID, display name, email address, profile photo</li>
                        <li>For Email/Password: Email address</li>
                    </ul>

                    <h3 className="text-xl font-medium mb-2 mt-4">Learning Content</h3>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Phrase collections you create or import</li>
                        <li>Audio you record or upload</li>
                        <li>Background images you upload</li>
                        <li>Custom text content you generate</li>
                    </ul>

                    <h3 className="text-xl font-medium mb-2 mt-4">Usage Statistics</h3>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Total phrases listened to</li>
                        <li>First practice dates per language pair</li>
                        <li>Daily usage counts and activity timestamps</li>
                        <li>Language pair preferences</li>
                    </ul>

                    <h3 className="text-xl font-medium mb-2 mt-4">Preferences & Settings</h3>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Romanization toggle preferences</li>
                        <li>Theme preferences (dark/light mode)</li>
                        <li>Visual effects settings</li>
                    </ul>

                    <h3 className="text-xl font-medium mb-2 mt-4">Device & Log Data</h3>
                    <ul className="list-disc pl-6 mt-2">
                        <li>IP address</li>
                        <li>Browser type and operating system</li>
                        <li>Time zone and error logs</li>
                    </ul>

                    <h3 className="text-xl font-medium mb-2 mt-4">Cookies & Similar Technologies</h3>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Firebase authentication cookies</li>
                        <li>Local storage for caching audio and UI preferences</li>
                    </ul>

                    <p className="mt-4">We do not intentionally collect sensitive personal data such as health information, biometric data, or government‑issued identifiers. Please do not upload such information.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Personal Data</h2>

                    <h3 className="text-xl font-medium mb-2">To Provide the Service</h3>
                    <p>We use your data to:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Create and manage your account</li>
                        <li>Authenticate you via Google or email/password</li>
                        <li>Deliver core learning features including phrase shadowing, TTS playback, and collection management</li>
                        <li>Provide statistics dashboards and progress tracking</li>
                    </ul>
                    <p className="mt-2"><strong>Legal basis:</strong> Performance of a contract (Art. 6(1)(b) UK GDPR)</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">To Improve and Personalise</h3>
                    <p>We use your data to:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Generate AI‑powered phrase suggestions and Romanizations</li>
                        <li>Conduct analytics to improve UI, features, and performance</li>
                        <li>Understand how the Service is used and make improvements</li>
                    </ul>
                    <p className="mt-2"><strong>Legal basis:</strong> Legitimate interests in improving and personalising the Service (Art. 6(1)(f) UK GDPR)</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">For Security and Legal Compliance</h3>
                    <p>We use your data to:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Maintain security, debug issues, and prevent fraud</li>
                        <li>Comply with legal obligations (tax, accounting, consumer protection)</li>
                    </ul>
                    <p className="mt-2"><strong>Legal basis:</strong> Legitimate interests (Art. 6(1)(f)) and compliance with legal obligations (Art. 6(1)(c) UK GDPR)</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">To Communicate With You</h3>
                    <p>We may contact you about service updates or material changes to these terms.</p>
                    <p className="mt-2"><strong>Legal basis:</strong> Performance of a contract and legitimate interests</p>

                    <p className="mt-4">If we rely on consent for any processing (e.g., optional marketing emails), we will obtain it separately and you may withdraw it at any time.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">5. AI‑Generated Content & Automated Processing</h2>
                    <p>The Service may use machine‑learning models to suggest phrases or generate text‑to‑speech audio (&quot;AI Features&quot;). These features enhance your language‑learning experience by providing suggested content and audio pronunciation.</p>
                    <p className="mt-2">AI Features do not make legal or significant decisions about you. They simply provide learning suggestions based on language patterns. You should independently verify important translations or pronunciations.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">6. Sharing & Disclosure</h2>
                    <p>We only share personal data as described below:</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">Service Providers</h3>
                    <p>We use third‑party service providers under data‑processing agreements to operate the Service:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Google LLC – Firebase Authentication, Firestore Database (EU multiregion), Firebase Storage, Cloud Functions, and Cloud Text‑to‑Speech for audio generation</li>
                        <li>Mixpanel – Analytics and usage tracking to understand how users interact with the Service</li>
                        <li>Microsoft Clarity – Session recording and heatmaps to improve user experience</li>
                    </ul>

                    <h3 className="text-xl font-medium mb-2 mt-4">Legal & Safety</h3>
                    <p>We may disclose data if required by law, court order, or to protect rights, property, and safety.</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">Business Transfers</h3>
                    <p>In connection with a merger, acquisition, or sale of assets, provided the recipient honours this policy.</p>

                    <p className="mt-4"><strong>We do not sell or rent personal data to third parties.</strong></p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">7. International Data Transfers</h2>
                    <p>Your data is primarily stored in Google Cloud&apos;s EU multiregion data centres to ensure it remains within the UK/EU where possible.</p>
                    <p className="mt-2">Limited technical personnel outside the UK/EU may access data for support and maintenance purposes. Where data is transferred outside the UK/EU, we rely on Standard Contractual Clauses approved by the UK Information Commissioner&apos;s Office and implement strict access controls.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">8. Security Measures</h2>
                    <p>We implement appropriate technical and organisational measures to protect your data, including:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Encryption at rest and in transit using industry‑standard TLS protocols</li>
                        <li>Role‑based access controls and least‑privilege principles</li>
                        <li>Firebase App Check to restrict backend access to verified clients</li>
                        <li>Regular security patches, vulnerability assessments, and code reviews</li>
                        <li>Continuous encrypted backups with redundancy</li>
                    </ul>
                    <p className="mt-4">No system is 100% secure. While we strive to protect your data to industry standards, we cannot guarantee absolute security.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">9. Cookies & Local Storage</h2>
                    <p>We use authentication cookies and browser local storage to:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Keep you signed in</li>
                        <li>Cache audio files for faster playback</li>
                        <li>Store UI preferences</li>
                        <li>Collect aggregated usage analytics</li>
                    </ul>
                    <p className="mt-2">You can control cookies via your browser settings, but blocking them may impair core functionality of the Service.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">10. Data Retention</h2>
                    <p>We retain personal data only as long as necessary to fulfil the purposes described in this policy:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li><strong>Active accounts:</strong> Data retained for the life of the account</li>
                        <li><strong>After account deletion:</strong> Personal data (including cached audio) deleted or anonymised within 30 days</li>
                        <li><strong>Server logs:</strong> Retained for up to 90 days for security and diagnostics</li>
                    </ul>
                    <p className="mt-2">Aggregated, non‑identifiable data may be retained indefinitely for analytics and service improvement.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">11. Your Rights</h2>
                    <p>Under UK and EU data protection law, you have the following rights:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li><strong>Access:</strong> Obtain a copy of your personal data</li>
                        <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                        <li><strong>Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
                        <li><strong>Restriction:</strong> Limit processing under certain conditions</li>
                        <li><strong>Portability:</strong> Receive your data in a structured, machine‑readable format</li>
                        <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                        <li><strong>Consent Withdrawal:</strong> Withdraw consent at any time where processing is based on consent</li>
                        <li><strong>Complaint:</strong> Lodge a complaint with the UK Information Commissioner&apos;s Office (ICO) or your local supervisory authority</li>
                    </ul>
                    <p className="mt-4">To exercise your rights, contact us at hello@lingopaper.com. We may need to verify your identity before fulfilling requests.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">12. Children&apos;s Privacy</h2>
                    <p>The Service is not directed to children under 16 years of age (or the age of digital consent in your country, whichever is higher). We do not knowingly collect personal data from children.</p>
                    <p className="mt-2">If you believe a child has provided us with personal data, please contact us at hello@lingopaper.com so we can delete it promptly.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">13. Changes to This Policy</h2>
                    <p>We may update this Privacy Policy from time to time. If changes are material, we will provide reasonable notice via the Service interface or by email, and update the &quot;Last updated&quot; date at the top of this page.</p>
                    <p className="mt-2">Your continued use of the Service after changes take effect constitutes acceptance of the updated policy.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
                    <p>For any questions about this Privacy Policy or our data practices, please contact us at:</p>
                    <p className="mt-2">Email: hello@lingopaper.com</p>
                </section>
            </div>
        </div>
    );
}
