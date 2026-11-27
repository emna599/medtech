package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.NoteDto;
import com.esigelec.ehpad_backend.dto.NoteRequest;
import com.esigelec.ehpad_backend.dto.PlanningDto;
import com.esigelec.ehpad_backend.dto.TeamDto;
import com.esigelec.ehpad_backend.security.JwtAuthenticationFilter;
import com.esigelec.ehpad_backend.service.NoteService;
import com.esigelec.ehpad_backend.service.StaffService;
import com.esigelec.ehpad_backend.service.StaffAssignmentService;
import com.esigelec.ehpad_backend.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/personnel")
public class StaffController {
    private final StaffService staffService;
    private final StaffAssignmentService assignments;
    private final TeamService teamService;
    private final NoteService noteService;

    public StaffController(StaffService staffService, TeamService teamService, NoteService noteService, StaffAssignmentService assignments) {
        this.staffService = staffService;
        this.assignments = assignments;
        this.teamService = teamService;
        this.noteService = noteService;
    }

    public record StaffAccess(boolean diningOnly, boolean kitchenOnly, boolean medicationAccess) {}

    @GetMapping("/access")
    public StaffAccess access(Authentication authentication) {
        boolean diningOnly = authentication.getAuthorities().stream()
                .anyMatch(authority -> JwtAuthenticationFilter.DINING_AUTHORITY.equals(authority.getAuthority()));
        boolean kitchenOnly = authentication.getAuthorities().stream()
                .anyMatch(authority -> JwtAuthenticationFilter.KITCHEN_AUTHORITY.equals(authority.getAuthority()));
        return new StaffAccess(diningOnly, kitchenOnly, staffService.canAccessMedication(authentication.getName()));
    }

    @GetMapping("/my-assignments")
    public List<StaffAssignmentService.Assignment> myAssignments(Authentication auth) {
        return assignments.upcoming(auth.getName());
    }

    /** Planning type (fixe) de la fonction et de l'équipe du soignant. */
    @GetMapping("/planning")
    public PlanningDto planning(Authentication authentication) {
        return staffService.planning(authentication.getName());
    }

    /** Équipe en service et part de résidents de chacun. */
    @GetMapping("/team")
    public TeamDto team(Authentication authentication) {
        return teamService.team(authentication.getName());
    }

    @PostMapping("/team/check-in")
    public TeamDto checkIn(Authentication authentication) {
        return teamService.checkIn(authentication.getName());
    }

    @PostMapping("/team/check-out")
    public TeamDto checkOut(Authentication authentication) {
        return teamService.checkOut(authentication.getName());
    }

    @GetMapping("/notes")
    public List<NoteDto> notes(@RequestParam(required = false) Long residentId, Authentication authentication) {
        return noteService.list(residentId, authentication.getName());
    }

    @PostMapping("/notes")
    public NoteDto addNote(@Valid @RequestBody NoteRequest request, Authentication authentication) {
        return noteService.create(request, authentication.getName());
    }

}
