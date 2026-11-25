package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.DashboardStatsDto;
import com.esigelec.ehpad_backend.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Tableau de bord global et statistiques. Réservé au rôle ADMIN. */
@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final DashboardService service;

    public AdminDashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping
    public DashboardStatsDto stats() {
        return service.stats();
    }
}
