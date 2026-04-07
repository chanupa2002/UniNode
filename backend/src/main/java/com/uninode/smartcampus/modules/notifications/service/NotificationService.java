package com.uninode.smartcampus.modules.notifications.service;

import java.util.List;

import com.uninode.smartcampus.modules.notifications.dto.CreateNotificationRequest;
import com.uninode.smartcampus.modules.notifications.dto.NotificationResponse;

public interface NotificationService {

    NotificationResponse createNotification(CreateNotificationRequest request);

    void deleteNotification(Long notificationId);

    List<NotificationResponse> getNotificationsByUserId(Long userId);

    List<NotificationResponse> getNotificationsByUserIdAndType(Long userId, String notificationType);
}
