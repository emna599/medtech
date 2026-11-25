package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.ResidentDto;
import com.esigelec.ehpad_backend.dto.ResidentRequest;
import com.esigelec.ehpad_backend.service.ResidentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Gestion et consultation des résidents. Réservé au rôle ADMIN (voir SecurityConfig). */
@RestController
@RequestMapping("/api/admin/residents")
public class AdminResidentController {

    private final ResidentService service;

    public AdminResidentController(ResidentService service) {
        this.service = service;
    }

    /** Filtres facultatifs : ?search=dupont&active=true&roomId=3 */
    @GetMapping
    public List<ResidentDto> list(@RequestParam(required = false) String search,
                                  @RequestParam(required = false) Boolean active,
                                  @RequestParam(required = false) Long roomId) {
        return service.list(search, active, roomId);
    }

    @GetMapping("/{id}")
    public ResidentDto get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResidentDto create(@Valid @RequestBody ResidentRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public ResidentDto update(@PathVariable Long id, @Valid @RequestBody ResidentRequest request) {
        return service.update(id, request);
    }
}
