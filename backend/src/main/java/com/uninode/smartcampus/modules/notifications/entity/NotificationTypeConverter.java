package com.uninode.smartcampus.modules.notifications.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class NotificationTypeConverter implements AttributeConverter<NotificationType, String> {

    @Override
    public String convertToDatabaseColumn(NotificationType attribute) {
        return attribute == null ? null : attribute.getDbValue();
    }

    @Override
    public NotificationType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : NotificationType.fromValue(dbData);
    }
}
