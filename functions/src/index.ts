/**
 * ADVIBE STUDIO — FIREBASE CLOUD FUNCTIONS V2 (FIRESTORE -> GOOGLE SHEETS AUTO-BACKUP)
 *
 * Automatically triggers whenever a new document is created or updated in:
 *   - /leads/{leadId}
 *   - /assessments/{assessmentId}
 *   - /students/{studentId}
 * in Firestore database: "ai-studio-advibestudio-7b001ad8-bbb4-4031-b0f9-c594f3acfb66"
 * and backs up the record to the connected Google Sheet for 100% redundancy.
 */

export const DATABASE_ID = 'ai-studio-advibestudio-7b001ad8-bbb4-4031-b0f9-c594f3acfb66';

export interface FirestoreEventPayload {
  spreadsheetName: string;
  deduplicationKey: string;
  tabs: Record<string, Record<string, string>>;
}

export async function pushPayloadToGoogleSheet(
  webhookUrl: string,
  payload: FirestoreEventPayload
): Promise<boolean> {
  if (!webhookUrl) return false;
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      payload_json: JSON.stringify(payload),
    }).toString(),
  });
  return response.ok;
}
