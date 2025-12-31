import 'server-only';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // Development: Use local service account key from Backend directory
    admin.initializeApp({
      credential: admin.credential.cert(
        require('../../../Backend/keys/languageshadowing-69768-firebase-admin.json')
      ),
      projectId: 'languageshadowing-69768',
    });
  } else {
    // Production: Use environment variables (from Google Cloud Run)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'languageshadowing-69768',
    });
  }
}

// Export Firestore instance for server-side queries
export const db = admin.firestore();
