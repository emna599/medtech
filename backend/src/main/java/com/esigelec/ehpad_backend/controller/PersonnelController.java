package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.AppetiteDto;
import com.esigelec.ehpad_backend.dto.AssistantReply;
import com.esigelec.ehpad_backend.dto.AssistantRequest;
import com.esigelec.ehpad_backend.dto.CompleteRequest;
import com.esigelec.ehpad_backend.dto.DoubtDto;
import com.esigelec.ehpad_backend.dto.DoubtRequest;
import com.esigelec.ehpad_backend.dto.IdentifyRequest;
import com.esigelec.ehpad_backend.dto.LocationRequest;
import com.esigelec.ehpad_backend.dto.QuantityRequest;
import com.esigelec.ehpad_backend.dto.PochetteScanDto;
import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.dto.ResidentIdentityDto;
import com.esigelec.ehpad_backend.dto.ServiceItemDto;
import com.esigelec.ehpad_backend.dto.ServiceKind;
import com.esigelec.ehpad_backend.service.AppetiteService;
import com.esigelec.ehpad_backend.service.AssistantService;
import com.esigelec.ehpad_backend.service.CareService;
import com.esigelec.ehpad_backend.service.CareCompletionService;
import com.esigelec.ehpad_backend.service.IdentityDoubtService;
import com.esigelec.ehpad_backend.service.PochetteScanService;
import com.esigelec.ehpad_backend.service.ResidentService;
import com.esigelec.ehpad_backend.service.StaffService;
import com.esigelec.ehpad_backend.service.StaffAssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * API de l'espace PERSONNEL (accès PERSONNEL et ADMIN, voir SecurityConfig).
 * Le soignant est toujours celui du jeton : il n'est jamais envoyé par le frontend.
 */
@RestController
@RequestMapping("/api/personnel")
public class PersonnelController {

    private final ResidentService residentService;
    private final StaffService staff;
    private final StaffAssignmentService assignments;
    private final CareService careService;
    private final CareCompletionService completions;
    private final IdentityDoubtService doubtService;
    private final AssistantService assistantService;
    private final AppetiteService appetiteService;
    private final PochetteScanService pochetteScanService;

    public PersonnelController(ResidentService residentService,
                               CareService careService,
                               CareCompletionService completions,
                               IdentityDoubtService doubtService,
                               AssistantService assistantService,
                               AppetiteService appetiteService,
                               PochetteScanService pochetteScanService, StaffService staff, StaffAssignmentService assignments) {
        this.residentService = residentService;
        this.staff = staff;
        this.assignments = assignments;
        this.careService = careService;
        this.completions = completions;
        this.doubtService = doubtService;
        this.assistantService = assistantService;
        this.appetiteService = appetiteService;
        this.pochetteScanService = pochetteScanService;
    }

    // ------------------------------------------------------------ résidents

    @GetMapping("/residents")
    public List<ResidentCardDto> residents(@RequestParam(required = false) String search, Authentication authentication) {
        var floors = assignments.activeFloors(authentication.getName());
        if (floors.isEmpty()) return List.of();
        return residentService.list(search).stream()
                .filter(resident -> resident.floor() != null && floors.contains(resident.floor()))
                .toList();
    }

    @GetMapping("/residents/{id}")
    public ResidentCardDto resident(@PathVariable Long id, Authentication authentication) {
        var resident = residentService.get(id);
        if (resident.floor() == null || !assignments.activeFloors(authentication.getName()).contains(resident.floor())) {
            throw new AccessDeniedException("Aucune affectation active pour ce secteur");
        }
        return resident;
    }

    /** Appétit des derniers jours (7 par défaut, de 3 à 14). */
    @GetMapping("/residents/{id}/appetite")
    public AppetiteDto appetite(@PathVariable Long id, @RequestParam(defaultValue = "7") int days, Authentication authentication) {
        resident(id, authentication);
        return appetiteService.forResident(id, days);
    }

    @PutMapping("/residents/{id}/meal-location")
    public ResidentCardDto changeMealLocation(@PathVariable Long id,
                                              @Valid @RequestBody LocationRequest request,
                                              Authentication authentication) {
        return residentService.changeMealLocation(id, request.mealLocation(), authentication.getName());
    }

    /** Identification par le code anonyme d'un bracelet ou d'un badge (facultatif). */
    @PostMapping("/identify")
    public ResidentIdentityDto identify(@Valid @RequestBody IdentifyRequest request, Authentication authentication) {
        return residentService.identifyByCode(request.code(), authentication.getName());
    }

    /** Photo de l'étiquette d'une pochette : l'OCR propose un résident, le soignant vérifie le visage. */
    @PostMapping(value = "/identify/pochette", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PochetteScanDto identifyByPochette(@RequestPart("photo") MultipartFile photo, Authentication authentication) {
        staff.requireMedicationAccess(authentication.getName());
        var result = pochetteScanService.scan(photo, authentication.getName());
        if (result.resident() != null) {
            var floors = assignments.activeFloors(authentication.getName());
            if (result.resident().floor() == null || !floors.contains(result.resident().floor())) {
                return new PochetteScanDto("NOT_FOUND", "Aucun résultat dans votre secteur actif.",
                        null, null, null, null, null);
            }
        }
        return result;
    }

    // ------------------------------------------------------------ repas et médicaments du jour

    @GetMapping("/service")
    public List<ServiceItemDto> service(@RequestParam ServiceKind kind, Authentication authentication) {
        if (kind == ServiceKind.MEDICAMENT) staff.requireMedicationAccess(authentication.getName());
        var floors = assignments.activeFloors(authentication.getName());
        if (floors.isEmpty()) return List.of();
        return careService.listToday(kind).stream()
                .filter(item -> item.resident().floor() != null && floors.contains(item.resident().floor()))
                .toList();
    }

    @PostMapping("/meals/{id}/complete")
    public ServiceItemDto completeMeal(@PathVariable Long id,
                                       @Valid @RequestBody CompleteRequest request,
                                       @RequestHeader(name = "Idempotency-Key", required = false) UUID requestId,
                                       Authentication authentication) {
        return completions.complete(ServiceKind.REPAS, id, request, requestId, authentication.getName());
    }

    @PutMapping("/meals/{id}/quantity")
    public ServiceItemDto mealQuantity(@PathVariable Long id,
                                       @Valid @RequestBody QuantityRequest request,
                                       Authentication authentication) {
        return careService.setQuantity(id, request.quantityEaten(), authentication.getName());
    }

    @PostMapping("/doses/{id}/complete")
    public ServiceItemDto completeDose(@PathVariable Long id,
                                       @Valid @RequestBody CompleteRequest request,
                                       @RequestHeader(name = "Idempotency-Key", required = false) UUID requestId,
                                       Authentication authentication) {
        return completions.complete(ServiceKind.MEDICAMENT, id, request, requestId, authentication.getName());
    }

    // ------------------------------------------------------------ doutes d'identité

    @GetMapping("/identity-doubts")
    public List<DoubtDto> openDoubts() {
        return doubtService.listOpen();
    }

    @PostMapping("/identity-doubts")
    public DoubtDto reportDoubt(@Valid @RequestBody DoubtRequest request, Authentication authentication) {
        return doubtService.report(request, authentication.getName());
    }

    @PostMapping("/identity-doubts/{id}/resolve")
    public DoubtDto resolveDoubt(@PathVariable Long id, Authentication authentication) {
        return doubtService.resolve(id, authentication.getName());
    }

    // ------------------------------------------------------------ assistant

    /** Répond à une question en français. N'enregistre rien : une action proposée doit être confirmée. */
    @PostMapping("/assistant")
    public AssistantReply assistant(@Valid @RequestBody AssistantRequest request, Authentication authentication) {
        var floors = assignments.activeFloors(authentication.getName());
        return assistantService.answer(request.message(), staff.canAccessMedication(authentication.getName()),
                resident -> resident.floor() != null && floors.contains(resident.floor()));
    }
}
