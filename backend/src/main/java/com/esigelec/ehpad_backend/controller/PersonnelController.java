package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.CompleteRequest;
import com.esigelec.ehpad_backend.dto.DoubtDto;
import com.esigelec.ehpad_backend.dto.DoubtRequest;
import com.esigelec.ehpad_backend.dto.IdentifyRequest;
import com.esigelec.ehpad_backend.dto.LocationRequest;
import com.esigelec.ehpad_backend.dto.QuantityRequest;
import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.dto.ServiceItemDto;
import com.esigelec.ehpad_backend.dto.ServiceKind;
import com.esigelec.ehpad_backend.service.CareService;
import com.esigelec.ehpad_backend.service.IdentityDoubtService;
import com.esigelec.ehpad_backend.service.ResidentService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

    public PersonnelController(ResidentService residentService,
                               CareService careService,
                               IdentityDoubtService doubtService) {
        this.residentService = residentService;
        this.careService = careService;
        this.doubtService = doubtService;
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

    @PutMapping("/residents/{id}/meal-location")
    public ResidentCardDto changeMealLocation(@PathVariable Long id,
                                              @Valid @RequestBody LocationRequest request,
                                              Authentication authentication) {
        return residentService.changeMealLocation(id, request.mealLocation(), authentication.getName());
    }

    /** Identification par le code anonyme d'un bracelet ou d'un badge (facultatif). */
    @PostMapping("/identify")
    public ResidentCardDto identify(@Valid @RequestBody IdentifyRequest request, Authentication authentication) {
        return residentService.identifyByCode(request.code(), authentication.getName());
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
}
