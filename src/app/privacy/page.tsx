
export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">Language Shadowing – Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-gray dark:prose-invert max-w-none">


                <h2>1. Who We Are</h2>
                <p>
                    "Language Shadowing" ("we", "our", or "us") is a web application that helps users learn languages through phrase‑shadowing practice. For the purposes of EU/UK data‑protection law, we act as the data controller for the personal data described in this policy.
                </p>
                <p>
                    Contact email: hello@lingopaper.com<br />
                </p>

                <h2>2. Scope of This Policy</h2>
                <p>This Privacy Policy describes how we collect, use, disclose, and protect your personal data when you:</p>
                <ul>
                    <li>Create an account or sign in with Google Sign‑In;</li>
                    <li>Use the Language Shadowing website, mobile interface, Chrome app, or any related services (collectively, the "Service");</li>
                    <li>Communicate with us or otherwise interact where we post this policy.</li>
                </ul>

                <h2>3. Personal Data We Collect</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Examples</th>
                                <th>Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Account Identifiers</td>
                                <td>Google UID, display name, email address, profile photo</td>
                                <td>Provided by Google Sign‑In when you create an account</td>
                            </tr>
                            <tr>
                                <td>Learning Content</td>
                                <td>Phrase collections, imported text, audio you record or upload, background images</td>
                                <td>You provide or generate within the Service</td>
                            </tr>
                            <tr>
                                <td>Usage Statistics</td>
                                <td>Total phrases listened, first practice dates per language pair, daily usage counts, last activity timestamps</td>
                                <td>Collected automatically as you interact with the Service</td>
                            </tr>
                            <tr>
                                <td>Preferences & Settings</td>
                                <td>Language pair preferences, Romanization toggle, theme (dark/light), visual‑effects settings</td>
                                <td>Collected from in‑app settings</td>
                            </tr>
                            <tr>
                                <td>Device & Log Data</td>
                                <td>IP address, browser type, operating system, time‑zone, error logs</td>
                                <td>Collected automatically via Firebase and server logs</td>
                            </tr>
                            <tr>
                                <td>Cookies & Similar Tech</td>
                                <td>Firebase authentication cookies, local storage for caching audio and UI preferences</td>
                                <td>Collected automatically; see Section 9</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="mt-4">
                    We do not intentionally collect sensitive personal data (e.g., health, biometric, or government‑issued identifiers). Please refrain from uploading such information.
                </p>

                <h2>4. How We Use Your Personal Data & Legal Bases</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th>Purpose</th>
                                <th>GDPR/UK GDPR Legal Basis</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Create and manage your account; authenticate via Google</td>
                                <td>Performance of a contract (Art. 6 (1)(b))</td>
                            </tr>
                            <tr>
                                <td>Deliver core learning features, including phrase shadowing, TTS playback, and collection management</td>
                                <td>Performance of a contract (Art. 6 (1)(b))</td>
                            </tr>
                            <tr>
                                <td>Generate AI‑powered phrase suggestions and Romanizations</td>
                                <td>Legitimate interests in improving and personalising the Service (Art. 6 (1)(f))</td>
                            </tr>
                            <tr>
                                <td>Provide statistics dashboards, progress tracking, and usage insights</td>
                                <td>Legitimate interests (Art. 6 (1)(f))</td>
                            </tr>
                            <tr>
                                <td>Maintain security, debug, and prevent fraud</td>
                                <td>Legitimate interests (Art. 6 (1)(f)); compliance with legal obligations (Art. 6 (1)(c))</td>
                            </tr>
                            <tr>
                                <td>Communicate with you about updates or material changes</td>
                                <td>Performance of a contract; Legitimate interests</td>
                            </tr>
                            <tr>
                                <td>Conduct analytics to improve UI, features, and performance</td>
                                <td>Legitimate interests (Art. 6 (1)(f))</td>
                            </tr>
                            <tr>
                                <td>Comply with legal obligations (tax, accounting, consumer protection)</td>
                                <td>Compliance with a legal obligation (Art. 6 (1)(c))</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="mt-4">
                    If we rely on consent (e.g., for optional marketing emails), we will obtain it separately and you may withdraw it at any time.
                </p>

                <h2>5. AI‑Generated Content & Automated Processing</h2>
                <p>
                    The Service may use machine‑learning models to suggest phrases or generate TTS audio ("AI Features"). These features draw on large language and speech datasets to create probabilistic outputs. AI Features do not make legal or significant decisions about you; they simply enhance your language‑learning experience. Nevertheless, you should independently verify important translations or pronunciations.
                </p>

                <h2>6. Sharing & Disclosure</h2>
                <p>We only share personal data as described below:</p>
                <ul>
                    <li>
                        <strong>Service Providers.</strong> We use third parties under data‑processing agreements to operate the Service:
                        <ul>
                            <li>Google LLC – Firebase Authentication, Firestore Database (EU multiregion), Firebase Storage, Cloud Functions;</li>
                            <li>Google Cloud Text‑to‑Speech or equivalent TTS provider;</li>
                            <li>[Analytics provider] (if added) for anonymised usage metrics.</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Legal & Safety.</strong> We may disclose data if required by law, subpoena, or to protect rights, property, and safety.
                    </li>
                    <li>
                        <strong>Business Transfers.</strong> In connection with a merger, acquisition, or sale of assets, provided the recipient honours this policy.
                    </li>
                </ul>
                <p>We do not sell or rent personal data to third parties.</p>

                <h2>7. International Data Transfers</h2>
                <p>
                    Your data is primarily stored in Google Cloud's EU multiregion data centres. Limited technical personnel outside the EEA/UK may access data for support purposes under Standard Contractual Clauses and strict access controls.
                </p>

                <h2>8. Security Measures</h2>
                <p>We implement appropriate technical and organisational measures, including:</p>
                <ul>
                    <li>Google Cloud‑managed encryption at rest and TLS in transit;</li>
                    <li>Role‑based access controls and least‑privilege principles;</li>
                    <li>Firebase App Check to mitigate abuse and restrict backend access to verified clients;</li>
                    <li>Regular security patches, vulnerability assessments, and code reviews;</li>
                    <li>Continuous backups with encrypted redundancy.</li>
                </ul>
                <p>
                    No system is 100 % secure. We cannot guarantee absolute security, but we strive to protect your data to industry standards.
                </p>

                <h2>9. Cookies & Local Storage</h2>
                <p>We use authentication cookies and browser local storage to:</p>
                <ul>
                    <li>Keep you signed in;</li>
                    <li>Cache audio files and UI preferences;</li>
                    <li>Collect aggregated usage analytics.</li>
                </ul>
                <p>You can control cookies via browser settings, but blocking them may impair core functionality.</p>

                <h2>10. Data Retention</h2>
                <p>We retain personal data only as long as necessary to fulfil the purposes described:</p>
                <ul>
                    <li>Active account: data retained for the life of the account;</li>
                    <li>Account deletion: personal data (including cached audio) deleted or anonymised within 30 days;</li>
                    <li>Server logs: retained up to 90 days for security and diagnostics.</li>
                </ul>
                <p>Aggregated, non‑identifiable data may be retained indefinitely.</p>

                <h2>11. Your Rights</h2>
                <p>Depending on your location, you may have the following rights:</p>
                <ul>
                    <li>Access – obtain a copy of your personal data;</li>
                    <li>Rectification – correct inaccurate or incomplete data;</li>
                    <li>Erasure – request deletion ("right to be forgotten");</li>
                    <li>Restriction – limit processing under certain conditions;</li>
                    <li>Portability – receive data in a structured, machine‑readable format;</li>
                    <li>Objection – object to processing based on legitimate interests;</li>
                    <li>Consent Withdrawal – withdraw consent at any time (where processing is based on consent);</li>
                    <li>Complaint – lodge a complaint with your local supervisory authority (e.g., the UK ICO).</li>
                </ul>
                <p>
                    To exercise your rights, contact us at hello@lingopaper.com. We may verify your identity before fulfilling requests.
                </p>

                <h2>12. Children</h2>
                <p>
                    The Service is not directed to children under 16 (or the age of digital consent in your country). We do not knowingly collect personal data from children. If you believe a child has provided us data, please contact us so we can delete it.
                </p>

                <h2>13. Changes to This Policy</h2>
                <p>
                    We may update this Privacy Policy periodically. If changes are material, we will provide reasonable notice (e.g., via the app interface or email) and indicate the "Last updated" date. Your continued use after changes take effect constitutes acceptance.
                </p>

                <h2>14. Contact Us</h2>
                <p>For any questions about this Privacy Policy or our data practices, contact:</p>
                <p>
                    Email: hello@lingopaper.com<br />
                    Attn: Data Protection Officer
                </p>

                <p className="mt-8 text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Language Shadowing. All rights reserved.
                </p>
            </div>
        </div>
    );
} 