declare module '@azure/ai-textanalytics' {
  export class TextAnalyticsClient {
    constructor(endpoint: string, credential: AzureKeyCredential);
    analyzeSentiment(documents: string[]): Promise<any>;
  }
  export class AzureKeyCredential {
    constructor(key: string);
  }
}

declare module 'zoomus' {
  export class Client {
    constructor(config: { apiKey: string; apiSecret: string });
    meetings: {
      create(meeting: any): Promise<any>;
    };
  }
}

declare module 'twilio' {
  export class Twilio {
    constructor(accountSid: string, authToken: string);
    messages: {
      create(data: any): Promise<any>;
    };
  }
} 