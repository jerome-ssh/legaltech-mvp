import { sendEmail, emailTemplates } from './email';
import { sendSMS, smsTemplates } from './sms';
import { sendSlackMessage, slackTemplates } from './slack';

interface User {
  email?: string;
  phoneNumber?: string;
  slackId?: string;
}

interface NotificationOptions {
  user: User;
  caseTitle: string;
  message: string;
  type: 'caseUpdate' | 'meetingInvite' | 'documentNotification';
  meetingDetails?: any;
  documentName?: string;
}

interface NotificationResult {
  success: boolean;
  error: Error | null;
}

interface NotificationResults {
  email: NotificationResult;
  sms: NotificationResult;
  slack: NotificationResult;
}

export async function sendNotification({
  user,
  caseTitle,
  message,
  type,
  meetingDetails,
  documentName
}: NotificationOptions): Promise<NotificationResults> {
  const results: NotificationResults = {
    email: { success: false, error: null },
    sms: { success: false, error: null },
    slack: { success: false, error: null }
  };

  // Send email if user has email
  if (user.email) {
    let html;
    switch (type) {
      case 'caseUpdate':
        html = emailTemplates.caseUpdate(caseTitle, message);
        break;
      case 'meetingInvite':
        html = emailTemplates.meetingInvite(caseTitle, meetingDetails!);
        break;
      case 'documentNotification':
        html = emailTemplates.documentNotification(caseTitle, documentName!);
        break;
    }
    const emailResult = await sendEmail({
      to: user.email,
      subject: `${caseTitle} - ${type}`,
      html
    });
    results.email = {
      success: emailResult.success,
      error: emailResult.error as Error | null
    };
  }

  // Send SMS if user has phone number
  if (user.phoneNumber) {
    let smsBody;
    switch (type) {
      case 'caseUpdate':
        smsBody = smsTemplates.caseUpdate(caseTitle, message);
        break;
      case 'meetingInvite':
        smsBody = smsTemplates.meetingReminder(caseTitle, meetingDetails!.time);
        break;
      case 'documentNotification':
        smsBody = smsTemplates.documentNotification(caseTitle, documentName!);
        break;
    }
    const smsResult = await sendSMS({
      to: user.phoneNumber,
      body: smsBody
    });
    results.sms = {
      success: smsResult.success,
      error: smsResult.error as Error | null
    };
  }

  // Send Slack message if user has Slack ID
  if (user.slackId) {
    let blocks;
    switch (type) {
      case 'caseUpdate':
        blocks = slackTemplates.caseUpdate(caseTitle, message).blocks;
        break;
      case 'meetingInvite':
        blocks = slackTemplates.meetingInvite(caseTitle, meetingDetails!).blocks;
        break;
      case 'documentNotification':
        blocks = slackTemplates.documentNotification(caseTitle, documentName!).blocks;
        break;
    }
    const slackResult = await sendSlackMessage({
      channel: user.slackId,
      text: `${caseTitle} - ${type}`,
      blocks
    });
    results.slack = {
      success: slackResult.success,
      error: slackResult.error as Error | null
    };
  }

  return results;
} 