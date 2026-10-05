package vn.hugamex.website.contact;

import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile({"dev", "prod"})
@EnableScheduling
public class ContactNotificationWorker {
  private final ContactNotificationService notifications;

  public ContactNotificationWorker(ContactNotificationService notifications) {
    this.notifications = notifications;
  }

  @Scheduled(initialDelay = 10000, fixedDelay = 10000)
  public void sendPending() {
    notifications.processPending();
  }
}
