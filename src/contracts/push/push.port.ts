/** Port push notification (FCM). */
export interface IPushService {
  sendToTopics(title: string, body: string, topics: string[], data?: Record<string, string>): Promise<void>;
}
