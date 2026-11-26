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
import com.esigelec.ehpad_backend.service.IdentityDoubtService;
import com.esigelec.ehpad_backend.service.PochetteScanService;
import com.esigelec.ehpad_backend.service.ResidentService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * API de l'espace PERSONNEL (accès PERSONNEL et ADMIN, voir SecurityConfig).
 * Le soignant est toujours celui du jeton : il n'est jamais envoyé par le frontend.
 */
@RestController
@RequestMapping("/api/personnel")
public class PersonnelController {

    private final ResidentService residentService;
    private final CareService careService;
    private final IdentityDoubtService doubtService;
    private final AssistantService assistantService;
    private final AppetiteService appetiteService;
    private final PochetteScanService pochetteScanService;

    public PersonnelController(ResidentService residentService,
                               CareService careService,
                               IdentityDoubtService doubtService,
                               AssistantService assistantService,
                               AppetiteService appetiteService,
                               PochetteScanService pochetteScanService) {
        this.residentService = residentService;
        this.careService = careService;
        this.doubtService = doubtService;
        this.assistantService = assistantService;
        this.appetiteService = appetiteService;
        this.pochetteScanService = pochetteScanService;
    }

    // ------------------------------------------------------------ résidents

    @GetMapping("/residents")
    public List<ResidentCardDto> residents(@RequestParam(required = false) String search) {
        return residentService.list(search);
    }

    @GetMapping("/residents/{id}")
    public ResidentCardDto resident(@PathVariable Long id) {
        return residentService.get(id);
    }

    /** Appétit des derniers jours (7 par défaut, de 3 à 14). */
    @GetMapping("/residents/{id}/appetite")
    public AppetiteDto appetite(@PathVariable Long id, @RequestParam(defaultValue = "7") int days) {
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
        return pochetteScanService.scan(photo, authentication.getName());
    }

    // ------------------------------------------------------------ repas et médicaments du jour

    @GetMapping("/service")
    public List<ServiceItemDto> service(@RequestParam ServiceKind kind) {
        return careService.listToday(kind);
    }

    @PostMapping("/meals/{id}/complete")
    public ServiceItemDto completeMeal(@PathVariable Long id,
                                       @Valid @RequestBody CompleteRequest request,
                                       Authentication authentication) {
        return careService.completeMeal(id, request, authentication.getName());
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
                                       Authentication authentication) {
        return careService.completeDose(id, request, authentication.getName());
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
    public AssistantReply assistant(@Valid @RequestBody AssistantRequest request) {
        return assistantService.answer(request.message());
    }
}
