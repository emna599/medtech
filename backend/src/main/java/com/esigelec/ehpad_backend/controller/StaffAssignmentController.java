package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.service.StaffAssignmentService;
import com.esigelec.ehpad_backend.service.StaffAssignmentService.Assignment;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class StaffAssignmentController {
    public record GrantRequest(@NotNull Integer floor, @NotNull OffsetDateTime startsAt,
                               @NotNull OffsetDateTime endsAt) {}

    public record ReplacementRequest(@NotNull Long substituteId) {}

    private final StaffAssignmentService assignments;

    public StaffAssignmentController(StaffAssignmentService assignments) {
        this.assignments = assignments;
    }

    @GetMapping("/assignments/overview")
    public StaffAssignmentService.Overview overview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return assignments.overview(date);
    }

    @GetMapping("/{userId}/assignments")
    public List<Assignment> list(@PathVariable Long userId) {
        return assignments.list(userId);
    }

    @PostMapping("/{userId}/assignments")
    @ResponseStatus(HttpStatus.CREATED)
    public List<Assignment> grant(@PathVariable Long userId, @Valid @RequestBody GrantRequest request,
                                  Authentication auth) {
        assignments.grant(userId, request.floor(), request.startsAt(), request.endsAt(), auth.getName());
        return assignments.list(userId);
    }

    @DeleteMapping("/{userId}/assignments/{assignmentId}")
    public List<Assignment> revoke(@PathVariable Long userId, @PathVariable Long assignmentId,
                                   Authentication auth) {
        assignments.revoke(userId, assignmentId, auth.getName());
        return assignments.list(userId);
    }
    @PostMapping("/{userId}/assignments/{assignmentId}/replacement")
    public List<Assignment> replace(@PathVariable Long userId, @PathVariable Long assignmentId,
                                    @Valid @RequestBody ReplacementRequest request, Authentication auth) {
        assignments.replace(userId, assignmentId, request.substituteId(), auth.getName());
        return assignments.list(userId);
    }
    @PostMapping("/{userId}/assignments/{assignmentId}/publication")
    public List<Assignment> publish(@PathVariable Long userId, @PathVariable Long assignmentId, Authentication auth) {
        assignments.publish(userId, assignmentId, auth.getName());
        return assignments.list(userId);
    }
}
