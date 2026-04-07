package com.uninode.smartcampus.modules.notifications.service;

import java.util.List;
import java.util.Locale;

import com.uninode.smartcampus.modules.notifications.dto.CreateNotificationRequest;
import com.uninode.smartcampus.modules.notifications.dto.NotificationResponse;
import com.uninode.smartcampus.modules.notifications.entity.Notification;
import com.uninode.smartcampus.modules.notifications.entity.NotificationType;
import com.uninode.smartcampus.modules.notifications.exception.NotificationNotFoundException;
import com.uninode.smartcampus.modules.notifications.repository.NotificationRepository;
import com.uninode.smartcampus.modules.users.entity.User;
import com.uninode.smartcampus.modules.users.exception.UserNotFoundException;
import com.uninode.smartcampus.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public NotificationResponse createNotification(CreateNotificationRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + request.getUserId()));

        Notification notification = Notification.builder()
                .notificationType(parseNotificationType(request.getNotificationType()))
                .message(request.getNotification().trim())
                .user(user)
                .build();

        Notification savedNotification = notificationRepository.save(notification);
        log.info("Created notification id={} for user id={}", savedNotification.getNotificationId(), user.getUserId());
        return toResponse(savedNotification);
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException(
                        "Notification not found with id: " + notificationId
                ));

        notificationRepository.delete(notification);
        log.info("Deleted notification id={}", notificationId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsByUserId(Long userId) {
        ensureUserExists(userId);
        return notificationRepository.findByUserUserIdOrderByCreatedAtDescNotificationIdDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsByUserIdAndType(Long userId, String notificationType) {
        ensureUserExists(userId);
        NotificationType parsedType = parseNotificationType(notificationType);

        return notificationRepository.findByUserUserIdAndNotificationTypeOrderByCreatedAtDescNotificationIdDesc(
                        userId,
                        parsedType
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void ensureUserExists(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException("User not found with id: " + userId);
        }
    }

    private NotificationType parseNotificationType(String value) {
        try {
            return NotificationType.fromValue(value.trim());
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("Notification type must be one of: Ticket, System, Booking");
        }
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .notificationId(notification.getNotificationId())
                .createdAt(notification.getCreatedAt())
                .notificationType(formatNotificationType(notification.getNotificationType()))
                .notification(notification.getMessage())
                .userId(notification.getUser().getUserId())
                .build();
    }

    private String formatNotificationType(NotificationType notificationType) {
        return notificationType.getDbValue();
    }
}
