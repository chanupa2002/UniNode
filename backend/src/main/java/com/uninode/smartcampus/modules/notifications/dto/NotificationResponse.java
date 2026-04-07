package com.uninode.smartcampus.modules.notifications.dto;

import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    private Long notificationId;

    private OffsetDateTime createdAt;

    private String notificationType;

    private String notification;

    private Long userId;
}
