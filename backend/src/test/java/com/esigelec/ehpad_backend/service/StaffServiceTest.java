package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.ForbiddenException;
import com.esigelec.ehpad_backend.repository.PlanningTaskRepository;
import com.esigelec.ehpad_backend.repository.StaffProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Sans fonction connue, un compte PERSONNEL est traité comme aide-soignant : pas de médicaments. */
class StaffServiceTest {

    private CurrentUserService currentUserService;
    private StaffProfileRepository profileRepository;
    private StaffService staffService;

    @BeforeEach
    void setUp() {
        currentUserService = mock(CurrentUserService.class);
        profileRepository = mock(StaffProfileRepository.class);
        staffService = new StaffService(currentUserService, profileRepository, mock(PlanningTaskRepository.class));
    }

    @Test
    void personnelWithoutProfileCannotGiveMedication() {
        User user = user("sam", Role.PERSONNEL);
        when(currentUserService.require("sam")).thenReturn(user);
        when(profileRepository.findById(user.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> staffService.requireMedicationRights("sam"))
                .isInstanceOf(ForbiddenException.class);
        assertThat(staffService.me("sam").canGiveMedication()).isFalse();
    }

    @Test
    void adminHasAllRights() {
        User admin = user("admin", Role.ADMIN);
        when(currentUserService.require("admin")).thenReturn(admin);
        when(profileRepository.findById(admin.getId())).thenReturn(Optional.empty());

        assertThatCode(() -> staffService.requireMedicationRights("admin")).doesNotThrowAnyException();
        assertThat(staffService.me("admin").canEditPhotos()).isTrue();
    }

    private static User user(String username, Role role) {
        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);
        when(user.getUsername()).thenReturn(username);
        when(user.getFullName()).thenReturn(username);
        when(user.getRole()).thenReturn(role);
        return user;
    }
}
