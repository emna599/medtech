package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.AllergyDto;
import com.esigelec.ehpad_backend.dto.CompleteRequest;
import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.entity.Meal;
import com.esigelec.ehpad_backend.entity.MealLocation;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.ServiceStatus;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.repository.IdentityDoubtRepository;
import com.esigelec.ehpad_backend.repository.MealDistributionRepository;
import com.esigelec.ehpad_backend.repository.MealRepository;
import com.esigelec.ehpad_backend.repository.MedicationDoseRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class CareServiceMealRiskTest {

    @Test
    void rejectsConfirmationOfAllergiesThatChangedAfterTheMealSheetWasOpened() {
        MealRepository meals = mock(MealRepository.class);
        MealDistributionRepository distributions = mock(MealDistributionRepository.class);
        ResidentRepository residents = mock(ResidentRepository.class);
        ResidentCardAssembler assembler = mock(ResidentCardAssembler.class);
        AuditService audit = mock(AuditService.class);
        CareService care = new CareService(meals, distributions, mock(MedicationDoseRepository.class),
                mock(IdentityDoubtRepository.class), assembler, residents, mock(CurrentUserService.class), audit);

        Resident resident = new Resident();
        ReflectionTestUtils.setField(resident, "id", 1L);
        resident.setActive(true);
        Meal meal = new Meal();
        meal.setResident(resident);
        meal.setStatus(ServiceStatus.A_FAIRE);

        when(meals.findById(42L)).thenReturn(Optional.of(meal));
        when(residents.findByIdForUpdate(1L)).thenReturn(Optional.of(resident));
        when(assembler.assemble(List.of(resident))).thenReturn(Map.of(1L, card("Poisson")));

        CompleteRequest staleConfirmation = new CompleteRequest(
                ServiceStatus.FAIT, null, true, card("Arachides").mealRiskVersion());

        assertThatThrownBy(() -> care.completeMeal(42L, staleConfirmation, "personnel"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Les consignes du repas ont changé");
        assertThat(meal.getStatus()).isEqualTo(ServiceStatus.A_FAIRE);
        verifyNoInteractions(distributions, audit);
    }

    private ResidentCardDto card(String allergy) {
        return new ResidentCardDto(1L, "Prénom", "Nom", 85, null, null, null, MealLocation.SALLE, false,
                null, List.of(new AllergyDto(allergy, null)), null, null, null, null, false);
    }
}
