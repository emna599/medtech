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

    public DiningController(DiningService diningService, ChevaletService chevaletService) {
        this.diningService = diningService;
        this.chevaletService = chevaletService;
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
