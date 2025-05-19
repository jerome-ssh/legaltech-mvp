import twilio from 'twilio';

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface SMSOptions {
  to: string;
  body: string;
}

export async function sendSMS({ to, body }: SMSOptions) {
  try {
    await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error };
  }
}

// SMS templates
export const smsTemplates = {
  matterUpdate: (caseTitle: string, message: string, label: string) =>
    `${label} Update: ${caseTitle}\n${message}\n\nReply STOP to unsubscribe.`,
  
  meetingReminder: (caseTitle: string, meetingTime: string, label: string) =>
    `Reminder: Meeting for ${caseTitle} at ${meetingTime}\n\nReply STOP to unsubscribe.`,
  
  documentNotification: (caseTitle: string, documentName: string, label: string) =>
    `New document uploaded for your ${label.toLowerCase()}: ${documentName}\n\nReply STOP to unsubscribe.`
}; 