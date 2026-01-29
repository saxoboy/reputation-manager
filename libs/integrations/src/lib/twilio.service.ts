import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import type { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';

export interface SendSMSOptions {
  to: string;
  body: string;
  from?: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  cost?: number;
}

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private client: twilio.Twilio | null = null;
  private fromNumber = '';
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    this.initialize();
  }

  private initialize() {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber =
      this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

    if (!accountSid || !authToken || !this.fromNumber) {
      this.logger.warn(
        '⚠️  Twilio credentials not configured. SMS sending will be mocked.',
      );
      this.isConfigured = false;
      return;
    }

    try {
      this.client = twilio(accountSid, authToken);
      this.isConfigured = true;
      this.logger.log('✅ Twilio client initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Twilio client', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send SMS via Twilio
   * Falls back to mock if Twilio is not configured
   */
  async sendSMS(options: SendSMSOptions): Promise<SMSResponse> {
    const { to, body, from } = options;
    const fromNumber = from || this.fromNumber;

    // Validate phone number format (Ecuador: +593XXXXXXXXX)
    if (!this.isValidEcuadorPhone(to)) {
      this.logger.error(`Invalid phone number format: ${to}`);
      return {
        success: false,
        error:
          'Invalid phone number format. Expected Ecuador format: +593XXXXXXXXX',
      };
    }

    // Mock mode if not configured
    if (!this.isConfigured || !this.client) {
      return this.mockSendSMS(to, body, fromNumber);
    }

    // Real Twilio send
    try {
      this.logger.log(`📱 Sending SMS to ${to}...`);

      const message: MessageInstance = await this.client.messages.create({
        body,
        from: fromNumber,
        to,
      });

      this.logger.log(
        `✅ SMS sent successfully. SID: ${message.sid}, Status: ${message.status}`,
      );

      return {
        success: true,
        messageId: message.sid,
        status: message.status,
        cost: this.estimateCost(),
      };
    } catch (error: unknown) {
      this.logger.error(`❌ Failed to send SMS to ${to}`, error);

      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Verify Twilio webhook signature
   * Ensures requests actually come from Twilio
   */
  validateWebhookSignature(
    signature: string,
    url: string,
    params: Record<string, unknown>,
  ): boolean {
    if (!this.isConfigured) {
      this.logger.warn('Twilio not configured, skipping signature validation');
      return true; // Allow in dev mode
    }

    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    if (!authToken) return false;

    try {
      return twilio.validateRequest(authToken, signature, url, params);
    } catch (error) {
      this.logger.error('Failed to validate webhook signature', error);
      return false;
    }
  }

  /**
   * Get message status from Twilio
   */
  async getMessageStatus(messageSid: string): Promise<string | null> {
    if (!this.client) {
      this.logger.warn('Twilio not configured, cannot fetch message status');
      return null;
    }

    try {
      const message = await this.client.messages(messageSid).fetch();
      return message.status;
    } catch (error) {
      this.logger.error(
        `Failed to fetch message status for ${messageSid}`,
        error,
      );
      return null;
    }
  }

  /**
   * Check if Twilio is properly configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Validate Ecuador phone number format
   */
  private isValidEcuadorPhone(phone: string): boolean {
    const ecuadorPhoneRegex = /^\+593[0-9]{9}$/;
    return ecuadorPhoneRegex.test(phone);
  }

  /**
   * Mock SMS sending for development
   */
  private mockSendSMS(to: string, body: string, from: string): SMSResponse {
    this.logger.log('📱 [MOCK] Sending SMS...');
    this.logger.log(`   From: ${from}`);
    this.logger.log(`   To: ${to}`);
    this.logger.log(`   Body: ${body}`);
    this.logger.log('✅ [MOCK] SMS sent successfully');

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      status: 'sent',
      cost: 0,
    };
  }

  /**
   * Parse Twilio error into user-friendly message
   */
  private parseError(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const twilioError = error as { code?: number; message?: string };

      if (twilioError.code === 21211) {
        return 'Invalid phone number';
      }
      if (twilioError.code === 21408) {
        return 'Permission to send to this number denied';
      }
      if (twilioError.code === 21610) {
        return 'Phone number is unsubscribed from receiving messages';
      }
      if (twilioError.code === 21614) {
        return 'Phone number is not a valid mobile number';
      }
      if (twilioError.code === 30007) {
        return 'Carrier violation - message filtered';
      }
      if (twilioError.code === 20429) {
        return 'Too many requests - Rate limit exceeded';
      }

      if (twilioError.message) {
        return twilioError.message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error occurred';
  }

  /**
   * Estimate SMS cost (Ecuador rates)
   */
  private estimateCost(): number {
    return 0.05; // ~$0.05 USD per SMS in Ecuador
  }
}
