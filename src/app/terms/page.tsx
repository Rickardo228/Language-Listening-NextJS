import React from 'react';

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Language Shadowing – Terms and Conditions</h1>
            <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-lg">
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                    <p>By creating an account, accessing, or using the Language Shadowing web application (the &quot;Service&quot;), you agree to be bound by these Terms and by our Privacy Policy, incorporated here by reference. If you do not agree, do not access or use the Service.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
                    <p>The Service is intended for individuals who are (i) at least 16 years old (or the age of digital consent in your country, whichever is higher) and (ii) legally capable of entering into binding contracts. By using the Service, you represent and warrant that you meet these requirements.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">3. Account Registration and Security</h2>
                    <h3 className="text-xl font-medium mb-2">Google Sign‑In</h3>
                    <p>You may create and access your account only through Google Sign‑In, powered by Firebase Authentication.</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">Account Information</h3>
                    <p>Your Google display name, email address, and profile photo are used to create your Language Shadowing profile. You must ensure this information is accurate and kept up to date.</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">Credentials</h3>
                    <p>You are responsible for maintaining the confidentiality of your Google account credentials and for all activity that occurs under your account. Notify us immediately of any unauthorized use.</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">Sign‑Out</h3>
                    <p>You may sign out at any time from the application&apos;s settings menu.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">4. License to Use the Service</h2>
                    <p>Subject to these Terms, we grant you a limited, non‑exclusive, non‑transferable, revocable license to access and use the Service for personal, non‑commercial language‑learning purposes. All rights not expressly granted are reserved by us and our licensors.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
                    <h3 className="text-xl font-medium mb-2">Definition</h3>
                    <p>&quot;User Content&quot; means any text, audio, images, or other materials you upload, import, create, record, or otherwise generate through the Service, including custom phrase collections and background images.</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">Ownership</h3>
                    <p>You retain all rights to your User Content. By submitting User Content, you grant us a worldwide, royalty‑free, sublicensable license to host, store, reproduce, and display such content solely for the purpose of operating and improving the Service.</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">Responsibility</h3>
                    <p>You are solely responsible for your User Content and for ensuring it does not violate any law, proprietary right, or these Terms.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">6. AI‑Generated Content and Text‑to‑Speech (TTS)</h2>
                    <h3 className="text-xl font-medium mb-2">Generative Features</h3>
                    <p>The Service may offer AI‑powered phrase suggestions and TTS audio generation (&quot;Generated Content&quot;). Generated Content is provided &quot;as is&quot; without warranty of accuracy, completeness, or suitability. Always verify important translations or pronunciations independently.</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">Licensing</h3>
                    <p>Subject to your compliance with these Terms, you may use Generated Content for personal, non‑commercial learning. Commercial redistribution or public broadcasting requires prior written consent.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">7. Acceptable Use Policy</h2>
                    <p>You agree not to:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Use the Service for unlawful, harmful, or harassing activity;</li>
                        <li>Upload or generate content that is defamatory, obscene, hateful, or infringes third‑party rights;</li>
                        <li>Reverse engineer, decompile, or attempt to extract the Service&apos;s source code;</li>
                        <li>Circumvent technical protections or misuse Firebase databases;</li>
                        <li>Interfere with, or disrupt, the Service or servers;</li>
                        <li>Use automated systems (bots, scrapers) except via our documented APIs.</li>
                    </ul>
                    <p className="mt-2">Violation may result in immediate suspension or termination of your account.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">8. Privacy and Data Protection</h2>
                    <h3 className="text-xl font-medium mb-2">Personal Data</h3>
                    <p>We process the following categories of personal data:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Google account identifiers (UID, display name, email, profile photo);</li>
                        <li>Collections and phrases you create or import;</li>
                        <li>Usage statistics (e.g., total phrases listened, language‑pair preferences, timestamps of activity, first‑practice dates);</li>
                        <li>Settings and visual‑theme preferences.</li>
                    </ul>

                    <h3 className="text-xl font-medium mb-2 mt-4">Storage</h3>
                    <p>Data is stored in Google Cloud Firestore (EU multiregion) with backups per Google&apos;s redundancy policies. Audio files are cached via Firebase Storage.</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">Legal Basis</h3>
                    <p>For users in the UK/EU, processing is based on the performance of our contract with you (Art. 6 (1)(b) GDPR) and our legitimate interests in improving the Service (Art. 6 (1)(f)).</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">Retention</h3>
                    <p>Personal data is retained for as long as your account is active or as needed to provide the Service, then securely deleted or anonymized within 30 days of account deletion.</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">Your Rights</h3>
                    <p>Where applicable, you have rights of access, rectification, erasure, data portability, restriction, and objection. Contact us to exercise these rights.</p>

                    <h3 className="text-xl font-medium mb-2 mt-4">Third‑Party Services</h3>
                    <p>Google LLC (Firebase) processes data as our processor under the Google Cloud Data Processing and Security Terms.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
                    <p>The Service, including all software, design elements, and content (excluding User Content), is our property or that of our licensors and is protected by intellectual‑property laws. All trademarks, logos, and service marks displayed in the Service are our property or that of third parties.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">10. Third‑Party Links & Services</h2>
                    <p>The Service may contain links to third‑party websites or integrate third‑party APIs (e.g., Google, text‑to‑speech providers). We do not endorse and are not responsible for third‑party services&apos; content, policies, or practices.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">11. Subscriptions & Payments</h2>
                    <p>At present, the Service is free of charge. If we introduce paid features or subscriptions, additional terms and payment details will be provided, and continued use will constitute acceptance of those terms.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
                    <p>We may suspend or terminate your access to the Service at any time, with or without notice, if we reasonably believe you have violated these Terms. Upon termination, Sections 5–9, 12–18 survive.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">13. Disclaimer of Warranties</h2>
                    <p>The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the maximum extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non‑infringement. We do not warrant that the Service will be uninterrupted, error‑free, or secure.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">14. Limitation of Liability</h2>
                    <p>To the fullest extent permitted by law, we will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits or revenues, arising out of or relating to your use of the Service, even if we have been advised of the possibility of such damages. Our aggregate liability to you for all claims shall not exceed £100 or the amount you paid us in the past 12 months (whichever is higher).</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">15. Indemnification</h2>
                    <p>You agree to indemnify and hold us harmless from any claim, demand, or damage (including reasonable attorneys&apos; fees) arising out of your (i) use of the Service; (ii) violation of these Terms; or (iii) infringement of any intellectual‑property or other right of any person or entity.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">16. Modifications to the Service and to Terms</h2>
                    <p>We may update the Service or these Terms from time to time. We will provide reasonable notice of material changes by posting the revised Terms and updating the "Last updated" date. Continued use after changes become effective constitutes acceptance.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">17. Modifications to the Service and to Terms</h2>
                    <p>We may update the Service or these Terms from time to time. We will provide reasonable notice of material changes by posting the revised Terms and updating the &quot;Last updated&quot; date. Continued use after changes become effective constitutes acceptance.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">18. Governing Law & Dispute Resolution</h2>
                    <p>These Terms are governed by the laws of England and Wales, without regard to conflict‑of‑law provisions. You and we agree to submit to the exclusive jurisdiction of the courts of England and Wales. If you are a consumer residing in the European Union, you may also bring proceedings in your home jurisdiction and benefit from mandatory consumer‑protection laws.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">19. Contact</h2>
                    <p>If you have any questions about these Terms or the Service, please contact us at [email protected].</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Annex A – Definitions</h2>
                    <p><strong>&quot;Phrase Collection&quot;</strong> means a group of input/output phrase pairs, including any associated metadata and audio.</p>
                    <p><strong>&quot;Shadowing&quot;</strong> means the language‑learning technique of repeating spoken phrases immediately after hearing them.</p>
                </section>
            </div>
        </div>
    );
} 