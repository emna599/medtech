package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.AllergyDto;
import com.esigelec.ehpad_backend.dto.AppetiteDto;
import com.esigelec.ehpad_backend.dto.AssistantReply;
import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.dto.ServiceItemDto;
import com.esigelec.ehpad_backend.dto.ServiceKind;
import com.esigelec.ehpad_backend.entity.MealLocation;
import com.esigelec.ehpad_backend.entity.ServiceStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** L'assistant comprend des questions courantes, ne modifie jamais rien et respecte le doute d'identité. */
class AssistantServiceTest {

    private ResidentService residentService;
    private CareService careService;
    private AppetiteService appetiteService;
    private AssistantService assistant;

    private final ResidentCardDto martin = resident(1L, "Colette", "Martin", "12", List.of(new AllergyDto("Poisson", "GRAVE")), false);
    private final ResidentCardDto durand = resident(2L, "Michel", "Durand", "7", List.of(), false);

    @BeforeEach
    void setUp() {
        residentService = mock(ResidentService.class);
        careService = mock(CareService.class);
        appetiteService = mock(AppetiteService.class);
        assistant = new AssistantService(residentService, careService, appetiteService);
        when(residentService.list(null)).thenReturn(List.of(martin, durand));
        when(careService.listToday(ServiceKind.REPAS)).thenReturn(List.of());
        when(careService.listToday(ServiceKind.MEDICAMENT)).thenReturn(List.of());
    }

    @Test
    void answersAllergiesOfAResidentWithAWarning() {
        AssistantReply reply = assistant.answer("Quelles sont les allergies de Mme Martin ?", true);

        assertThat(reply.intent()).isEqualTo("ALLERGIES");
        assertThat(reply.answer()).contains("Poisson");
        assertThat(reply.residents()).extracting(AssistantReply.ResidentRef::id).containsExactly(1L);
    }

    @Test
    void listsMealsStillToServe() {
        when(careService.listToday(ServiceKind.REPAS)).thenReturn(List.of(
                meal(10L, durand, ServiceStatus.A_FAIRE),
                meal(11L, martin, ServiceStatus.FAIT)));

        AssistantReply reply = assistant.answer("Qui n'a pas encore mangé ?", true);

        assertThat(reply.intent()).isEqualTo("RESTE_REPAS");
        assertThat(reply.answer()).contains("1 repas à servir").contains("Michel DURAND");
    }

    @Test
    void saysWhenEverythingIsDone() {
        when(careService.listToday(ServiceKind.REPAS)).thenReturn(List.of(meal(10L, durand, ServiceStatus.FAIT)));

        AssistantReply reply = assistant.answer("Qui n'a pas encore mangé ?", true);

        assertThat(reply.answer()).contains("Rien en attente");
    }

    @Test
    void proposesAnActionButNeverRecordsIt() {
        when(careService.listToday(ServiceKind.REPAS)).thenReturn(List.of(meal(42L, durand, ServiceStatus.A_FAIRE)));

        AssistantReply reply = assistant.answer("Marque le repas de M. Durand comme servi", true);

        assertThat(reply.action()).isNotNull();
        assertThat(reply.action().itemId()).isEqualTo(42L);
        assertThat(reply.action().kind()).isEqualTo(ServiceKind.REPAS);
        verify(careService, never()).completeMeal(any(), any(), any());
        verify(careService, never()).completeDose(any(), any(), any());
    }

    @Test
    void refusesToPrepareAnActionDuringAnIdentityDoubt() {
        ResidentCardDto doubtful = resident(3L, "Rosa", "Garcia", "4", List.of(), true);
        when(residentService.list(null)).thenReturn(List.of(doubtful));
        when(careService.listToday(ServiceKind.REPAS)).thenReturn(List.of(meal(50L, doubtful, ServiceStatus.A_FAIRE)));

        AssistantReply reply = assistant.answer("Marque le repas de Mme Garcia comme servi", true);

        assertThat(reply.action()).isNull();
        assertThat(reply.answer()).contains("Doute d'identité");
    }

    @Test
    void asksToBePreciseWhenTwoResidentsShareAName() {
        ResidentCardDto otherMartin = resident(4L, "Paul", "Martin", "9", List.of(), false);
        when(residentService.list(null)).thenReturn(List.of(martin, otherMartin));

        AssistantReply reply = assistant.answer("allergies de Martin", true);

        assertThat(reply.intent()).isEqualTo("AMBIGU");
        assertThat(reply.residents()).hasSize(2);
    }

    @Test
    void warnsWhenAppetiteIsDeclining() {
        when(appetiteService.forResident(1L, 7)).thenReturn(new AppetiteDto(List.of(), 0.2, 0.9, true));

        AssistantReply reply = assistant.answer("Appétit de Mme Martin ?", true);

        assertThat(reply.intent()).isEqualTo("APPETIT");
        assertThat(reply.answer()).contains("en baisse");
    }

    @Test
    void fallsBackToHelpOnAnUnknownQuestion() {
        AssistantReply reply = assistant.answer("Quelle est la capitale de la France ?", true);

        assertThat(reply.intent()).isEqualTo("AIDE");
        assertThat(reply.action()).isNull();
    }

    @Test
    void listsAbsencesForTheRequestedMealSlot() {
        when(careService.listToday(ServiceKind.REPAS)).thenReturn(List.of(
                meal(10L, durand, ServiceStatus.ABSENT), meal(11L, martin, ServiceStatus.REFUSE)));

        AssistantReply reply = assistant.answer("Qui est absent au déjeuner ?", true);

        assertThat(reply.intent()).isEqualTo("ABSENCES");
        assertThat(reply.residents()).extracting(AssistantReply.ResidentRef::id).containsExactly(2L);
        assertThat(reply.action()).isNull();
    }

    @Test
    void avoidsPreparingAnActionWhenSeveralItemsMatch() {
        when(careService.listToday(ServiceKind.REPAS)).thenReturn(List.of(
                meal(42L, durand, ServiceStatus.A_FAIRE), meal(43L, durand, ServiceStatus.PLUS_TARD)));

        AssistantReply reply = assistant.answer("Marque le repas de Durand comme servi", true);

        assertThat(reply.action()).isNull();
        assertThat(reply.answer()).contains("choisir");
    }

    @Test
    void sendsAResidentWithAllergiesToTheServiceSheetForConfirmation() {
        when(careService.listToday(ServiceKind.REPAS)).thenReturn(List.of(meal(42L, martin, ServiceStatus.A_FAIRE)));

        AssistantReply reply = assistant.answer("Marque le repas de Martin comme servi", true);

        assertThat(reply.action()).isNull();
        assertThat(reply.answer()).contains("fiche de service");
    }

    @Test
    void redirectsClinicalQuestionsToTheCareTeam() {
        AssistantReply reply = assistant.answer("Quelle posologie prescrire pour Durand ?", true);

        assertThat(reply.intent()).isEqualTo("HORS_PERIMETRE");
        assertThat(reply.residents()).isEmpty();
        assertThat(reply.action()).isNull();
    }

    private static ResidentCardDto resident(Long id, String first, String last, String room,
                                            List<AllergyDto> allergies, boolean doubt) {
        return new ResidentCardDto(id, first, last, 85, room, 1, null, MealLocation.SALLE, false, null,
                allergies, "Normal", "Normale", null, null, doubt, null, false);
    }

    private static ServiceItemDto meal(Long id, ResidentCardDto resident, ServiceStatus status) {
        return new ServiceItemDto(ServiceKind.REPAS, id, "DEJEUNER", "Déjeuner", null,
                LocalDate.now().atTime(12, 0), status, false, null, resident);
    }
    @Test
    void restrictedSummaryDoesNotReadDoses() {
        when(careService.listToday(ServiceKind.REPAS)).thenReturn(List.of());
        AssistantReply reply = assistant.answer("Résumé du service", false);
        assertThat(reply.answer()).doesNotContain("prises données");
        org.mockito.Mockito.verify(careService, org.mockito.Mockito.never()).listToday(ServiceKind.MEDICAMENT);
    }
}
