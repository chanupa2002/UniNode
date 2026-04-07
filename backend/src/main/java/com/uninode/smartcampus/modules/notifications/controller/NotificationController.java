package com.uninode.smartcampus.modules.notifications.controller;

import java.util.List;

import com.uninode.smartcampus.modules.notifications.dto.CreateNotificationRequest;
import com.uninode.smartcampus.modules.notifications.dto.NotificationResponse;
import com.uninode.smartcampus.modules.notifications.service.NotificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Validated
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<NotificationResponse> createNotification(
            @Valid @RequestBody CreateNotificationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.createNotification(request));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable @Positive(message = "Notification id must be greater than 0") Long notificationId) {
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<NotificationResponse>> getNotificationsByUserId(
            @PathVariable @Positive(message = "User id must be greater than 0") Long userId
    ) {
        return ResponseEntity.ok(notificationService.getNotificationsByUserId(userId));
    }

    @GetMapping("/users/{userId}/types/{notificationType}")
    public ResponseEntity<List<NotificationResponse>> getNotificationsByUserIdAndType(
            @PathVariable @Positive(message = "User id must be greater than 0") Long userId,
            @PathVariable
            @Pattern(
                    regexp = "^(?i)(Ticket|System|Booking)$",
                    message = "Notification type must be one of: Ticket, System, Booking"
            ) String notificationType
    ) {
        return ResponseEntity.ok(notificationService.getNotificationsByUserIdAndType(userId, notificationType));
    }
}
