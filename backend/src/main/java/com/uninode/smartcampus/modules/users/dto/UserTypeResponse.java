package com.uninode.smartcampus.modules.users.dto;

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
public class UserTypeResponse {

    private Long userId;

    private Long userTypeId;

    private String roleName;
}
