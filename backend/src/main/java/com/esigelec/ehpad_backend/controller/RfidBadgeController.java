package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.service.RfidBadgeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RfidBadgeController {
    public record Status(boolean assigned) {}
    public record Badge(@NotBlank @Size(max = 100) String code) {}
    public record Presence(boolean present) {}
    public record Attendance(@NotBlank @Size(max = 100) String code, boolean leaving) {}

    private final RfidBadgeService badges;

    public RfidBadgeController(RfidBadgeService badges) {
        this.badges = badges;
    }

    @GetMapping("/api/admin/users/{id}/rfid")
    public Status staff(@PathVariable long id) { return new Status(badges.staffBadge(id)); }

    @PutMapping("/api/admin/users/{id}/rfid")
    public Status assignStaff(@PathVariable long id, @Valid @RequestBody Badge badge, Authentication auth) {
        badges.assignStaff(id, badge.code(), auth.getName());
        return new Status(true);
    }

    @DeleteMapping("/api/admin/users/{id}/rfid")
    public Status revokeStaff(@PathVariable long id, Authentication auth) {
        badges.revokeStaff(id, auth.getName());
        return new Status(false);
    }

    @GetMapping("/api/admin/residents/{id}/rfid")
    public Status resident(@PathVariable long id) { return new Status(badges.residentBadge(id)); }

    @PutMapping("/api/admin/residents/{id}/rfid")
    public Status assignResident(@PathVariable long id, @Valid @RequestBody Badge badge, Authentication auth) {
        badges.assignResident(id, badge.code(), auth.getName());
        return new Status(true);
    }

    @DeleteMapping("/api/admin/residents/{id}/rfid")
    public Status revokeResident(@PathVariable long id, Authentication auth) {
        badges.revokeResident(id, auth.getName());
        return new Status(false);
    }

    @PostMapping("/api/personnel/team/rfid")
    public Presence point(@Valid @RequestBody Attendance badge, Authentication auth) {
        return new Presence(badges.point(auth.getName(), badge.code(), badge.leaving()));
    }
}
