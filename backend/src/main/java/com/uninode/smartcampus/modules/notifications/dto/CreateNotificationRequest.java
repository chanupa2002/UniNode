package com.uninode.smartcampus.modules.notifications.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
public class CreateNotificationRequest {

    @NotNull(message = "User id is required")
    @Positive(message = "User id must be greater than 0")
    private Long userId;

    @NotBlank(message = "Notification type is required")
    @Pattern(
            regexp = "^(?i)(Ticket|System|Booking)$",
            message = "Notification type must be one of: Ticket, System, Booking"
    )
    private String notificationType;

    @NotBlank(message = "Notification message is required")
    @Size(min = 1, max = 1000, message = "Notification message must be between 1 and 1000 characters")
    private String notification;
}
