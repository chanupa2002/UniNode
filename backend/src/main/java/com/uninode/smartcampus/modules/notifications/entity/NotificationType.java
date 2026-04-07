package com.uninode.smartcampus.modules.notifications.entity;

import java.util.Arrays;

public enum NotificationType {
    TICKET("Ticket"),
    SYSTEM("System"),
    BOOKING("Booking");

    private final String dbValue;

    NotificationType(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static NotificationType fromValue(String value) {
        return Arrays.stream(values())
                .filter(type -> type.name().equalsIgnoreCase(value) || type.dbValue.equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Notification type must be one of: Ticket, System, Booking"
                ));
    }
}
