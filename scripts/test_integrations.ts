import { config } from 'dotenv';
config();

import { TextAnalyticsClient, AzureKeyCredential } from '@azure/ai-text-analytics';
import { ZoomClient, ZoomApi } from '@nektarai/zoom-api-client';
import twilio from 'twilio';
import { WebClient } from '@slack/web-api';
import sgMail from '@sendgrid/mail';
import { google } from 'googleapis';
import { Client as MicrosoftGraphClient } from '@microsoft/microsoft-graph-client';
import { DefaultAzureCredential } from '@azure/identity';

// Test user data
const testUser = {
  email: 'test@example.com',
  phone: '+1234567890',
  slackId: 'U1234567890'
};

// Test SendGrid integration
async function testSendGrid() {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    const msg = {
      to: testUser.email,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: 'Test Email',
      text: 'This is a test email from SendGrid integration'
    };
    await sgMail.send(msg);
    return { success: true, message: 'SendGrid email sent successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Test Twilio integration
async function testTwilio() {
  try {
    const client = new twilio.Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    await client.messages.create({
      body: 'Test SMS from Twilio integration',
      to: testUser.phone,
      from: process.env.TWILIO_PHONE_NUMBER!
    });
    return { success: true, message: 'Twilio SMS sent successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Test Slack integration
async function testSlack() {
  try {
    const client = new WebClient(process.env.SLACK_BOT_TOKEN!);
    await client.chat.postMessage({
      channel: testUser.slackId,
      text: 'Test message from Slack integration'
    });
    return { success: true, message: 'Slack message sent successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Test Azure Cognitive Services
async function testAzureCognitiveServices() {
  try {
    const client = new TextAnalyticsClient(
      process.env.AZURE_COGNITIVE_SERVICES_ENDPOINT!,
      new AzureKeyCredential(process.env.AZURE_COGNITIVE_SERVICES_KEY!)
    );
    const result = await client.analyzeSentiment(['This is a test message']);
    return { success: true, message: 'Azure Cognitive Services test successful', result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Test Zoom integration
async function testZoom() {
  try {
    const client = new ZoomClient({
      clientId: process.env.ZOOM_CLIENT_ID!,
      clientSecret: process.env.ZOOM_CLIENT_SECRET!,
      redirectUri: process.env.ZOOM_REDIRECT_URI
    });

    const zoomApi = new ZoomApi({
      client,
      tokens: {
        access_token: process.env.ZOOM_ACCESS_TOKEN!,
        token_type: 'bearer',
        expires_in: 3600
      }
    });

    const meeting = await zoomApi.meetings().create('me', {
      topic: 'Test Meeting',
      type: 1, // Instant meeting
      duration: 30,
      timezone: 'UTC'
    });
    return { success: true, message: 'Zoom meeting created successfully', meeting };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Test Google Calendar integration
async function testGoogleCalendar() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CALENDAR_CREDENTIALS!),
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    const calendar = google.calendar({ version: 'v3', auth });
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: 'Test Event',
        start: { dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
        end: { dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString() }
      }
    });
    return { success: true, message: 'Google Calendar event created successfully', event };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Test Microsoft Graph integration
async function testMicrosoftGraph() {
  try {
    const client = MicrosoftGraphClient.init({
      authProvider: async (done) => {
        const credential = new DefaultAzureCredential();
        const token = await credential.getToken('https://graph.microsoft.com/.default');
        done(null, token.token);
      }
    });
    const result = await client.api('/me').get();
    return { success: true, message: 'Microsoft Graph API test successful', result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Main test function
async function main() {
  console.log('Starting integration tests...\n');

  const tests = [
    { name: 'SendGrid', fn: testSendGrid },
    { name: 'Twilio', fn: testTwilio },
    { name: 'Slack', fn: testSlack },
    { name: 'Azure Cognitive Services', fn: testAzureCognitiveServices },
    { name: 'Zoom', fn: testZoom },
    { name: 'Google Calendar', fn: testGoogleCalendar },
    { name: 'Microsoft Graph', fn: testMicrosoftGraph }
  ];

  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    const result = await test.fn();
    console.log(result);
    console.log('-------------------\n');
  }
}

main().catch(console.error); 