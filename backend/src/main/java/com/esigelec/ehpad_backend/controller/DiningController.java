package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.DiningDto;
import com.esigelec.ehpad_backend.dto.ReadingDto;
import com.esigelec.ehpad_backend.dto.ReadingRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.esigelec.ehpad_backend.dto.WeeklyMenuDto;
import com.esigelec.ehpad_backend.service.DiningService;
import com.esigelec.ehpad_backend.service.ChevaletService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** Interface Service : tables de la salle à manger et menu de la semaine (lecture seule ; « Fait » passe par /meals/{id}/complete). */
@RestController
@RequestMapping("/api/personnel/dining")
public class DiningController {

    private final DiningService diningService;

    private final ChevaletService chevaletService;

    private final com.esigelec.ehpad_backend.service.CareService care;

    public DiningController(DiningService diningService, ChevaletService chevaletService,
                            com.esigelec.ehpad_backend.service.CareService care) {
        this.diningService = diningService;
        this.chevaletService = chevaletService;
        this.care = care;
    }

    /** Tables et résidents pour le repas demandé (DEJEUNER ou DINER ; par défaut selon l'heure). */
    @GetMapping("/tables")
    public DiningDto tables(@RequestParam(required = false) String slot) {
        return diningService.tables(slot);
    }

    /** Menu de la semaine qui contient la date (par défaut cette semaine). */
    @GetMapping("/menu")
    public WeeklyMenuDto menu(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return diningService.menu(date);
    }

    @GetMapping("/breakfast")
    public java.util.List<Breakfast> breakfast() {
        return care.listToday(com.esigelec.ehpad_backend.dto.ServiceKind.REPAS).stream()
                .filter(item -> "PETIT_DEJEUNER".equals(item.slot()) && item.resident().room() != null)
                .map(item -> {
                    var resident = item.resident();
                    return new Breakfast(item.id(), resident.firstName() + " " + resident.lastName(),
                            resident.room(), resident.floor(), item.label(), resident.regime(), resident.texture(),
                            resident.restrictions(), resident.allergies().stream()
                            .map(com.esigelec.ehpad_backend.dto.AllergyDto::name).toList(),
                            resident.mealRiskVersion(), item.status().name());
                }).toList();
    }

    @PostMapping("/breakfast/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void serveBreakfast(@PathVariable long id, @Valid @RequestBody BreakfastConfirmation request,
                               Authentication authentication) {
        care.serveBreakfast(id, request.version(), authentication.getName());
    }

    public record Breakfast(long id, String name, String room, Integer floor, String meal, String regime,
                            String texture, String restrictions, java.util.List<String> allergies, String version, String status) {}

    public record BreakfastConfirmation(@jakarta.validation.constraints.NotBlank
                                        @jakarta.validation.constraints.Size(max = 64) String version) {}

    @GetMapping("/demo-nfc/residents")
    public java.util.List<DiningDto.Identity> demoNfcResidents(Authentication authentication) {
        return diningService.demoNfcResidents(authentication.getName());
    }

    @PostMapping("/demo-nfc/residents/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void linkDemoNfc(@PathVariable long id,
                            @Valid @RequestBody com.esigelec.ehpad_backend.dto.NfcLinkRequest request,
                            Authentication authentication) {
        diningService.linkDemoNfc(id, request.token(), authentication.getName());
    }

    /** Lecture d'un bracelet par le lecteur d'une table (lecteur réel ou simulation depuis l'écran). */
    @PostMapping("/readings")
    public ReadingDto reading(@Valid @RequestBody ReadingRequest request, Authentication authentication) {
        return diningService.reading(request, authentication.getName());
    }
    @PutMapping("/chevalets/{residentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void assignChevalet(@PathVariable long residentId, @Valid @RequestBody ChevaletNumber request,
                               Authentication authentication) {
        chevaletService.assign(residentId, request.number(), authentication.getName());
    }

    @DeleteMapping("/chevalets/{residentId}/{number}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void releaseChevalet(@PathVariable long residentId, @PathVariable String number,
                                Authentication authentication) {
        chevaletService.release(residentId, number, authentication.getName());
    }

    public record ChevaletNumber(
        @jakarta.validation.constraints.NotNull
        @Pattern(regexp = "[1-9][0-9]{0,3}", message = "Saisissez un numéro de chevalet de 1 à 9999.")
        String number
    ) {}
}
