package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.service.KitchenService;
import com.esigelec.ehpad_backend.service.KitchenService.Plate;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/kitchen")
public class KitchenController {
    public record Confirmation(@NotBlank @Size(max = 64) String version) {}
    public record Menu(@NotNull LocalDate date, @NotBlank String slot, @Size(max = 150) String starter,
                       @NotBlank @Size(max = 150) String main, @Size(max = 150) String side,
                       @Size(max = 150) String dessert) {}

    private final KitchenService kitchen;
    public KitchenController(KitchenService kitchen) { this.kitchen = kitchen; }

    @GetMapping("/plates")
    public List<Plate> plates(@RequestParam String slot) { return kitchen.plates(slot); }

    @PutMapping("/plates/{id}")
    public Plate check(@PathVariable long id, @Valid @RequestBody Confirmation body, Authentication auth) {
        return kitchen.check(id, body.version(), auth.getName());
    }

    @PutMapping("/menu")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void publish(@Valid @RequestBody Menu menu, Authentication auth) {
        kitchen.publishMenu(menu.date(), menu.slot(), menu.starter(), menu.main(), menu.side(), menu.dessert(), auth.getName());
    }
}
