package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.AllergyDto;
import com.esigelec.ehpad_backend.dto.CompleteRequest;
import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.dto.ServiceItemDto;
import com.esigelec.ehpad_backend.dto.ServiceKind;
import com.esigelec.ehpad_backend.entity.Meal;
import com.esigelec.ehpad_backend.entity.MealDistribution;
import com.esigelec.ehpad_backend.entity.MedicationDose;
import com.esigelec.ehpad_backend.entity.QuantityEaten;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.ServiceStatus;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.IdentityDoubtRepository;
import com.esigelec.ehpad_backend.repository.MealDistributionRepository;
import com.esigelec.ehpad_backend.repository.MealRepository;
import com.esigelec.ehpad_backend.repository.MedicationDoseRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Repas à servir et prises de médicaments à donner : liste du jour et validation par le soignant. */
@Service
public class CareService {

    private static final Comparator<ServiceItemDto> ORDER = Comparator
            .comparing(ServiceItemDto::scheduledAt)
            .thenComparing(item -> roomOrder(item.resident().room()))
            .thenComparing(item -> item.resident().lastName());

    private final MealRepository mealRepository;
    private final MealDistributionRepository distributionRepository;
    private final MedicationDoseRepository doseRepository;
    private final IdentityDoubtRepository doubtRepository;
    private final ResidentCardAssembler assembler;
    private final ResidentRepository residentRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public CareService(MealRepository mealRepository,
                       MealDistributionRepository distributionRepository,
                       MedicationDoseRepository doseRepository,
                       IdentityDoubtRepository doubtRepository,
                       ResidentCardAssembler assembler,
                       ResidentRepository residentRepository,
                       CurrentUserService currentUserService,
                       AuditService auditService) {
        this.mealRepository = mealRepository;
        this.distributionRepository = distributionRepository;
        this.doseRepository = doseRepository;
        this.doubtRepository = doubtRepository;
        this.assembler = assembler;
        this.residentRepository = residentRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    // ------------------------------------------------------------------ lecture

    @Transactional(readOnly = true)
    public List<ServiceItemDto> listToday(ServiceKind kind) {
        LocalDateTime from = LocalDate.now().atStartOfDay();
        LocalDateTime to = from.plusDays(1);
        return kind == ServiceKind.REPAS ? listMeals(from, to) : listDoses(from, to);
    }

    private List<ServiceItemDto> listMeals(LocalDateTime from, LocalDateTime to) {
        List<Meal> meals = mealRepository.findActiveBetween(from, to);
        if (meals.isEmpty()) {
            return List.of();
        }
        Map<Long, ResidentCardDto> cards = assembler.assemble(meals.stream().map(Meal::getResident).toList());
        Map<Long, MealDistribution> distributions = distributionRepository
                .findByMealIdIn(meals.stream().map(Meal::getId).toList()).stream()
                .collect(Collectors.toMap(d -> d.getMeal().getId(), Function.identity()));

        List<ServiceItemDto> items = new ArrayList<>();
        for (Meal meal : meals) {
            items.add(toMealItem(meal, cards.get(meal.getResident().getId()), distributions.get(meal.getId())));
        }
        items.sort(ORDER);
        return items;
    }

    private List<ServiceItemDto> listDoses(LocalDateTime from, LocalDateTime to) {
        List<MedicationDose> doses = doseRepository.findActiveBetween(from, to);
        if (doses.isEmpty()) {
            return List.of();
        }
        Map<Long, ResidentCardDto> cards = assembler.assemble(doses.stream().map(MedicationDose::getResident).toList());
        List<ServiceItemDto> items = new ArrayList<>();
        for (MedicationDose dose : doses) {
            items.add(toDoseItem(dose, cards.get(dose.getResident().getId())));
        }
        items.sort(ORDER);
        return items;
    }

    // ------------------------------------------------------------------ validation

    @Transactional
    public ServiceItemDto completeMeal(Long mealId, CompleteRequest request, String username) {
        User user = currentUserService.require(username);
        Long residentId = mealRepository.findResidentId(mealId)
                .orElseThrow(() -> new ResourceNotFoundException("Repas introuvable"));
        Resident resident = lockActiveResident(residentId);
        Meal meal = mealRepository.findByIdForUpdate(mealId)
                .orElseThrow(() -> new ResourceNotFoundException("Repas introuvable"));
        ResidentCardDto card = assembler.assemble(List.of(resident)).get(resident.getId());
        validate(request, meal.getStatus(), resident.getId());
        requireMealRiskAck(request, card);

        meal.setStatus(request.status());

        MealDistribution distribution = distributionRepository.findByMealId(mealId).orElse(null);
        if (request.status() != ServiceStatus.PLUS_TARD) {
            if (distribution == null) {
                distribution = new MealDistribution();
                distribution.setMeal(meal);
            }
            distribution.setUser(user);
            distribution.setServedAt(LocalDateTime.now());
            distribution.setComment(clean(request.comment()));
            distribution.setQuantityEaten(request.status() == ServiceStatus.REFUSE ? QuantityEaten.RIEN : null);
            distribution = distributionRepository.save(distribution);
        }

        auditService.record(user, "REPAS_" + request.status().name(), "Meal", meal.getId());
        if (request.status() == ServiceStatus.FAIT && request.riskAcknowledged()) {
            auditService.record(user, "REPAS_RISQUE_CONFIRME", "Meal", meal.getId());
        }
        return toMealItem(meal, card, distribution);
    }

    /** Quantité mangée, saisie au débarrassage (uniquement pour un repas déjà servi). */
    @Transactional
    public ServiceItemDto setQuantity(Long mealId, QuantityEaten quantity, String username) {
        User user = currentUserService.require(username);
        Meal meal = mealRepository.findByIdForUpdate(mealId).orElseThrow(() -> new ResourceNotFoundException("Repas introuvable"));
        Resident resident = requireActive(meal.getResident());
        if (meal.getStatus() != ServiceStatus.FAIT) {
            throw new ConflictException("La quantité ne peut être saisie que pour un repas servi");
        }
        MealDistribution distribution = distributionRepository.findByMealId(mealId)
                .orElseThrow(() -> new ConflictException("Le repas n'a pas été enregistré comme servi"));
        distribution.setQuantityEaten(quantity);

        auditService.record(user, "REPAS_QUANTITE", "Meal", meal.getId());
        return toMealItem(meal, assembler.assemble(List.of(resident)).get(resident.getId()), distribution);
    }

    @Transactional
    public ServiceItemDto completeDose(Long doseId, CompleteRequest request, String username) {
        if (request.status() == ServiceStatus.ABSENT) {
            throw new BadRequestException("Ce statut est réservé aux repas.");
        }
        User user = currentUserService.require(username);
        Long residentId = doseRepository.findResidentId(doseId)
                .orElseThrow(() -> new ResourceNotFoundException("Prise introuvable"));
        Resident resident = lockActiveResident(residentId);
        MedicationDose dose = doseRepository.findByIdForUpdate(doseId)
                .orElseThrow(() -> new ResourceNotFoundException("Prise introuvable"));
        validate(request, dose.getStatus(), resident.getId());
        requireDoseRiskAck(request, dose);

        dose.setStatus(request.status());
        dose.setUser(user);
        dose.setComment(clean(request.comment()));
        dose.setGivenAt(request.status() == ServiceStatus.PLUS_TARD ? null : LocalDateTime.now());

        auditService.record(user, "PRISE_" + request.status().name(), "MedicationDose", dose.getId());
        if (request.riskAcknowledged()) {
            auditService.record(user, "PRISE_RISQUE_CONFIRME", "MedicationDose", dose.getId());
        }
        return toDoseItem(dose, assembler.assemble(List.of(resident)).get(resident.getId()));
    }

    // ------------------------------------------------------------------ règles

    private void validate(CompleteRequest request, ServiceStatus current, Long residentId) {
        if (request.status() == ServiceStatus.A_FAIRE) {
            throw new BadRequestException("Statut invalide");
        }
        if (current == ServiceStatus.FAIT || current == ServiceStatus.REFUSE || current == ServiceStatus.ABSENT) {
            throw new ConflictException("Déjà enregistré");
        }
        if (request.status() == ServiceStatus.REFUSE && clean(request.comment()) == null) {
            throw new BadRequestException("Le motif du refus est obligatoire");
        }
        if (request.status() == ServiceStatus.FAIT && doubtRepository.existsByResidentIdAndResolvedFalse(residentId)) {
            throw new ConflictException(
                    "Doute d'identité en cours : un collègue doit confirmer l'identité avant de valider");
        }
    }

    /**
     * Le soignant confirme les allergies, la texture adaptée et les restrictions
     * à partir de la version des consignes affichée sur sa fiche.
     */
    private void requireMealRiskAck(CompleteRequest request, ResidentCardDto card) {
        if (request.status() != ServiceStatus.FAIT || card == null) {
            return;
        }
        if (card.mealTextureConflict()) {
            throw new ConflictException("Plusieurs textures adaptées se contredisent. Demandez au médecin de corriger les consignes avant de servir.");
        }
        if ((request.mealRiskVersion() != null || request.riskAcknowledged())
                && !card.mealRiskVersion().equals(request.mealRiskVersion())) {
            throw new ConflictException("Les consignes du repas ont changé. Vérifiez la fiche actualisée avant de confirmer.");
        }
        if (request.riskAcknowledged()) {
            return;
        }
        List<String> risks = new ArrayList<>();
        if (card.allergies() != null && !card.allergies().isEmpty()) {
            risks.add("allergie(s) : " + card.allergies().stream()
                    .map(AllergyDto::name).collect(Collectors.joining(", ")));
        }
        String texture = card.texture();
        if (texture != null && !texture.isBlank() && !texture.equalsIgnoreCase("Normale")) {
            risks.add("texture " + texture.toLowerCase(Locale.ROOT));
        }
        if (card.restrictions() != null) {
            risks.add("à éviter : " + card.restrictions());
        }
        if (card.mealInstructionsChangedAt() != null) {
            risks.add("consignes modifiées aujourd’hui");
        }
        if (!risks.isEmpty()) {
            throw new ConflictException(
                    "Vérifiez le plateau avant de servir — " + String.join(" · ", risks) + " — puis confirmez.");
        }
    }

    /** Médicament : une prise à risque ne peut être validée sans confirmation explicite du soignant. */
    private void requireDoseRiskAck(CompleteRequest request, MedicationDose dose) {
        if (request.status() == ServiceStatus.FAIT && dose.isHighRisk() && !request.riskAcknowledged()) {
            throw new ConflictException(
                    "Médicament à risque : vérifiez le résident et la prescription, puis confirmez.");
        }
    }

    private Resident lockActiveResident(Long residentId) {
        return requireActive(residentRepository.findByIdForUpdate(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable")));
    }

    private static Resident requireActive(Resident resident) {
        if (!resident.isActive()) {
            throw new ResourceNotFoundException("Résident introuvable");
        }
        return resident;
    }

    // ------------------------------------------------------------------ conversion

    private ServiceItemDto toMealItem(Meal meal, ResidentCardDto card, MealDistribution distribution) {
        return new ServiceItemDto(
                ServiceKind.REPAS,
                meal.getId(),
                meal.getType(),
                meal.getDescription() == null ? meal.getType() : meal.getDescription(),
                null,
                meal.getScheduledAt(),
                meal.getStatus(),
                false,
                Optional.ofNullable(distribution).map(MealDistribution::getQuantityEaten).orElse(null),
                card);
    }

    private ServiceItemDto toDoseItem(MedicationDose dose, ResidentCardDto card) {
        return new ServiceItemDto(
                ServiceKind.MEDICAMENT,
                dose.getId(),
                doseSlot(dose.getScheduledAt()),
                dose.getMedication(),
                dose.getDose(),
                dose.getScheduledAt(),
                dose.getStatus(),
                dose.isHighRisk(),
                null,
                card);
    }

    private static String doseSlot(LocalDateTime time) {
        int hour = time.getHour();
        if (hour < 11) {
            return "MATIN";
        }
        return hour < 15 ? "MIDI" : "SOIR";
    }

    /** Ordre naturel des chambres : 3 avant 12 (et non l'ordre alphabétique "12" avant "3"). */
    private static int roomOrder(String room) {
        if (room == null) {
            return Integer.MAX_VALUE;
        }
        String digits = room.replaceAll("\\D", "");
        return digits.isEmpty() ? Integer.MAX_VALUE : Integer.parseInt(digits);
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
