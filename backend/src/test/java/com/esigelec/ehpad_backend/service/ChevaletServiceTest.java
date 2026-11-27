package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.ChevaletRequest;
import com.esigelec.ehpad_backend.entity.Chevalet;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.repository.ChevaletRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Un chevalet déjà associé à quelqu'un d'autre n'est réassigné qu'après confirmation. */
class ChevaletServiceTest {

    private ChevaletRepository chevaletRepository;
    private ResidentRepository residentRepository;
    private ChevaletService service;
    private Resident martin;
    private Resident durand;

    @BeforeEach
    void setUp() {
        chevaletRepository = mock(ChevaletRepository.class);
        residentRepository = mock(ResidentRepository.class);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        when(currentUserService.require("sam")).thenReturn(mock(User.class));
        service = new ChevaletService(chevaletRepository, residentRepository, currentUserService, mock(AuditService.class));

        martin = resident(1L, "Jeanne", "Martin");
        durand = resident(2L, "Michel", "Durand");
        when(residentRepository.findActiveById(1L)).thenReturn(Optional.of(martin));
        when(chevaletRepository.findByResidentId(1L)).thenReturn(Optional.empty());
        when(chevaletRepository.saveAndFlush(any(Chevalet.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void refusesToStealAChevaletWithoutConfirmation() {
        Chevalet taken = new Chevalet("12");
        taken.setResident(durand);
        when(chevaletRepository.findByCodeIgnoreCase("12")).thenReturn(Optional.of(taken));

        assertThatThrownBy(() -> service.associate(new ChevaletRequest("12", 1L, false), "sam"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Michel Durand");
    }

    @Test
    void reassignsWhenConfirmed() {
        Chevalet taken = new Chevalet("12");
        taken.setResident(durand);
        when(chevaletRepository.findByCodeIgnoreCase("12")).thenReturn(Optional.of(taken));

        assertThat(service.associate(new ChevaletRequest("12", 1L, true), "sam").residentId()).isEqualTo(1L);
    }

    @Test
    void createsAFreshChevaletOnTheFly() {
        when(chevaletRepository.findByCodeIgnoreCase("7")).thenReturn(Optional.empty());

        assertThat(service.associate(new ChevaletRequest(" 7 ", 1L, false), "sam").code()).isEqualTo("7");
    }

    private static Resident resident(Long id, String first, String last) {
        Resident resident = mock(Resident.class);
        when(resident.getId()).thenReturn(id);
        when(resident.getFirstName()).thenReturn(first);
        when(resident.getLastName()).thenReturn(last);
        return resident;
    }
}
