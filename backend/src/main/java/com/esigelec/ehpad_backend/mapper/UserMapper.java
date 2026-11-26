package com.esigelec.ehpad_backend.mapper;

import com.esigelec.ehpad_backend.dto.AdminUserDto;
import com.esigelec.ehpad_backend.dto.UserInfoDto;
import com.esigelec.ehpad_backend.entity.StaffProfile;
import com.esigelec.ehpad_backend.entity.User;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserInfoDto toInfo(User user) {
        return new UserInfoDto(user.getId(), user.getUsername(), user.getFullName(), user.getRole());
    }

    public static AdminUserDto toAdmin(User user, StaffProfile profile) {
        return new AdminUserDto(user.getId(), user.getUsername(), user.getFullName(), user.getRole(),
                user.isEnabled(), user.getCreatedAt(), profile == null ? null : profile.getJob(),
                profile == null ? null : profile.getShift());
    }
}
